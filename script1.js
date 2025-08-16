/*
  Face Attendance System — script.js
  --------------------------------------------------------
  What you get:
   - Model loader (configurable base URL)
   - Teacher & Student modes
   - Registration: capture N descriptors & save to Supabase
   - Recognition: live detection + matching + attendance mark
   - Clean, modular code with clear status messaging

  Prereqs in Supabase (JSON column type recommended for descriptor arrays):
   - teacher_face_descriptors: { id(uuid), teacher_id(uuid/text), descriptor(json) }
   - student_face_descriptors: { id(uuid), student_id(uuid/text), descriptor(json) }
   - teacher_attendance: { id, teacher_id, date, status, arrival_time, remarks }
   - attendance (students): { id, student_id, attendance_date, status, arrival_time, remarks }

  Configure the 3 inputs in the UI header (URL, key, models path), then click Apply.
*/

// ---------- Global State ----------
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';
let MODEL_URL = '/models';

let supabaseClient = null;
let currentMode = 'teacher'; // 'teacher' | 'student'
let modelsLoaded = false;
let faceMatcher = null; // built from DB descriptors
let overlayOn = true;
let threshold = 0.6;

// Camera
let mediaStream = null;
let rafId = null;

// Registration
let regActive = false;
let regVectors = [];
let expectedSamples = 3;

// Elements
const els = {
  modelsState: document.getElementById('modelsState'),
  cameraState: document.getElementById('cameraState'),
  supabaseState: document.getElementById('supabaseState'),
  video: document.getElementById('video'),
  overlay: document.getElementById('overlay'),
  recStatus: document.getElementById('recStatus'),
  lastMatch: document.getElementById('lastMatch'),
  lastMiss: document.getElementById('lastMiss'),
  descCount: document.getElementById('descCount'),
  attnStatus: document.getElementById('attnStatus'),
  // config
  confUrl: document.getElementById('confSupabaseUrl'),
  confKey: document.getElementById('confSupabaseKey'),
  confModels: document.getElementById('confModelsUrl'),
  // controls
  btnApply: document.getElementById('applyConfig'),
  btnStart: document.getElementById('startRec'),
  btnStop: document.getElementById('stopRec'),
  btnToggleOv: document.getElementById('toggleOverlay'),
  detectorSel: document.getElementById('detectorSelect'),
  threshold: document.getElementById('threshold'),
  threshLabel: document.getElementById('threshLabel'),
  reloadDescriptors: document.getElementById('reloadDescriptors'),
  markPresent: document.getElementById('markPresent'),
  // mode
  modeTeacher: document.getElementById('modeTeacher'),
  modeStudent: document.getElementById('modeStudent'),
  idLabel: document.getElementById('idLabel'),
  // registration
  regId: document.getElementById('regId'),
  sampleCount: document.getElementById('sampleCount'),
  startReg: document.getElementById('startReg'),
  captureOne: document.getElementById('captureOne'),
  saveReg: document.getElementById('saveReg'),
  cancelReg: document.getElementById('cancelReg'),
  regStatus: document.getElementById('regStatus'),
  vecsBox: document.getElementById('vecsBox'),
};

// ---------- Helpers ----------
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fmtTime = () => new Date().toTimeString().split(' ')[0];
const fmtDate = () => new Date().toISOString().split('T')[0];

function setBadge(el, text) { el.textContent = text; }
function info(msg) { els.recStatus.textContent = msg; }
function ok(msg) { els.recStatus.textContent = msg; }
function warn(msg){ els.recStatus.textContent = msg; }
function setLastMatch(text){ els.lastMiss.style.display='none'; els.lastMatch.style.display='inline-block'; els.lastMatch.textContent=text; }
function setLastMiss(text){ els.lastMatch.style.display='none'; els.lastMiss.style.display='inline-block'; els.lastMiss.textContent=text; }

function getDetectorOptions(){
  const d = els.detectorSel.value;
  if(d === 'tiny'){
    return new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  }
  return new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
}

function ensureSupabase(){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Configure Supabase URL/key and click Apply.');
  if(!supabaseClient) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

async function loadModels(){
  setBadge(els.modelsState,'loading');
  // Load both SSD, Tiny, Landmarks, Recognition
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  modelsLoaded = true;
  setBadge(els.modelsState,'ready');
}

async function startCamera(){
  if(mediaStream){ return; }
  mediaStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
  els.video.srcObject = mediaStream;
  await els.video.play();
  setBadge(els.cameraState,'running');
}

function stopCamera(){
  if(mediaStream){
    mediaStream.getTracks().forEach(t=>t.stop());
    mediaStream = null;
  }
  if(rafId){ cancelAnimationFrame(rafId); rafId = null; }
  setBadge(els.cameraState,'stopped');
}

function drawOverlay(detections){
  const canvas = els.overlay;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width, canvas.height);
  if(!overlayOn || !detections) return;
  const dims = faceapi.matchDimensions(canvas, { width: els.video.videoWidth, height: els.video.videoHeight });
  const resized = faceapi.resizeResults(detections, dims);
  faceapi.draw.drawDetections(canvas, resized);
  faceapi.draw.drawFaceLandmarks(canvas, resized);
}

// ---------- Descriptors DB ----------
async function loadAllDescriptors(){
  ensureSupabase();
  const table = currentMode === 'teacher' ? 'teacher_face_descriptors' : 'student_face_descriptors';
  const idField = currentMode === 'teacher' ? 'teacher_id' : 'student_id';
  const { data, error } = await supabaseClient.from(table).select(`${idField}, descriptor`);
  if(error){ throw error; }
  const labeled = {};
  (data||[]).forEach(row => {
    const key = row[idField];
    const arr = new Float32Array(row.descriptor);
    if(!labeled[key]) labeled[key] = [];
    labeled[key].push(arr);
  });
  const labeledDescs = Object.entries(labeled).map(([label, vecs])=> new faceapi.LabeledFaceDescriptors(label, vecs));
  faceMatcher = new faceapi.FaceMatcher(labeledDescs, threshold);
  els.descCount.textContent = String(labeledDescs.length);
}

async function saveDescriptorForId(userId, vector){
  ensureSupabase();
  if(!userId) throw new Error('Missing ID');
  const table = currentMode === 'teacher' ? 'teacher_face_descriptors' : 'student_face_descriptors';
  const idField = currentMode === 'teacher' ? 'teacher_id' : 'student_id';
  const payload = {}; payload[idField] = userId; payload.descriptor = Array.from(vector);
  const { error } = await supabaseClient.from(table).insert(payload);
  if(error) throw error;
}

// ---------- Attendance DB ----------
async function markAttendance(userId, method='Face Recognition'){
  ensureSupabase();
  const today = fmtDate();
  const now = fmtTime();

  if(currentMode === 'teacher'){
    // teacher_attendance
    const { data, error } = await supabaseClient
      .from('teacher_attendance')
      .select('id, arrival_time')
      .eq('teacher_id', userId)
      .eq('date', today);
    if(error) throw error;
    if(data && data.length){
      // update arrival_time if empty
      const rec = data[0];
      if(!rec.arrival_time){
        const { error: upErr } = await supabaseClient.from('teacher_attendance').update({ arrival_time: now, status:'Present', remarks: method }).eq('id', rec.id);
        if(upErr) throw upErr;
      }
    } else {
      const { error: insErr } = await supabaseClient.from('teacher_attendance').insert({ teacher_id: userId, date: today, status:'Present', arrival_time: now, remarks: method });
      if(insErr) throw insErr;
    }
  } else {
    // student attendance table named 'attendance'
    const { data, error } = await supabaseClient
      .from('attendance')
      .select('id, arrival_time')
      .eq('student_id', userId)
      .eq('attendance_date', today);
    if(error) throw error;
    if(data && data.length){
      const rec = data[0];
      if(!rec.arrival_time){
        const { error: upErr } = await supabaseClient.from('attendance').update({ arrival_time: now, status:'Present', remarks: method }).eq('id', rec.id);
        if(upErr) throw upErr;
      }
    } else {
      const { error: insErr } = await supabaseClient.from('attendance').insert({ student_id: userId, attendance_date: today, status:'Present', arrival_time: now, remarks: method });
      if(insErr) throw insErr;
    }
  }
  els.attnStatus.textContent = `[${now}] Marked Present for ${userId} (${currentMode}).`;
}

// ---------- Recognition Loop ----------
async function recognizeLoop(){
  if(!modelsLoaded){ info('Load models first.'); return; }
  if(!mediaStream){ await startCamera(); }
  info('Detecting…');

  const step = async () => {
    try{
      const options = getDetectorOptions();
      let det = await faceapi.detectAllFaces(els.video, options).withFaceLandmarks().withFaceDescriptors();
      drawOverlay(det);

      if(det.length){
        // for each face, find best match
        let best = null;
        det.forEach(d => {
          if(!d.descriptor) return;
          if(faceMatcher){
            const m = faceMatcher.findBestMatch(d.descriptor);
            if(m && m.label !== 'unknown' && (best===null || m.distance < best.distance)){
              best = { id: m.label, distance: m.distance };
            }
          }
        });

        if(best){
          setLastMatch(`${best.id} @ ${best.distance.toFixed(3)}`);
          els.recStatus.textContent = `Match → ${best.id} (dist ${best.distance.toFixed(3)})`;
          if(best.distance <= threshold){
            // mark attendance (debounce by simple timer)
            await markAttendance(best.id, 'Face Recognition');
            await sleep(1500); // small pause to avoid spamming DB
          }
        } else {
          setLastMiss('No known faces');
        }
      }
    } catch(err){
      warn('Recognition error: ' + err.message);
      console.error(err);
    }
    rafId = requestAnimationFrame(step);
  };
  step();
}

// ---------- Registration Flow ----------
async function beginRegistration(){
  if(!modelsLoaded) await loadModels();
  if(!mediaStream) await startCamera();
  regActive = true;
  regVectors = [];
  els.regStatus.textContent = 'Registration active. Capture samples.';
  els.vecsBox.textContent = '';
}

async function captureSample(){
  if(!regActive){ els.regStatus.textContent = 'Start registration first.'; return; }
  const options = getDetectorOptions();
  const res = await faceapi.detectSingleFace(els.video, options).withFaceLandmarks().withFaceDescriptor();
  if(!res || !res.descriptor){ els.regStatus.textContent = 'No face detected. Try again.'; return; }
  regVectors.push(res.descriptor);
  els.vecsBox.textContent += `\n#${regVectors.length}: [${Array.from(res.descriptor).slice(0,6).map(n=>n.toFixed(3)).join(', ')} …]`;
  els.regStatus.textContent = `Captured ${regVectors.length}/${expectedSamples}.`;
}

async function saveRegistration(){
  const id = els.regId.value.trim();
  if(!id){ els.regStatus.textContent = 'Provide an ID.'; return; }
  if(regVectors.length === 0){ els.regStatus.textContent = 'Capture at least 1 sample.'; return; }
  try{
    for(const vec of regVectors){ await saveDescriptorForId(id, vec); }
    els.regStatus.textContent = `Saved ${regVectors.length} descriptor(s) for ${id}.`;
    await loadAllDescriptors();
  }catch(err){
    els.regStatus.textContent = 'Save failed: ' + err.message;
  } finally {
    regActive = false;
  }
}

function cancelRegistration(){
  regActive = false;
  regVectors = [];
  els.regStatus.textContent = 'Registration cancelled.';
}

// ---------- UI Wiring ----------
async function applyConfig(){
  SUPABASE_URL = els.confUrl.value.trim();
  SUPABASE_ANON_KEY = els.confKey.value.trim();
  MODEL_URL = els.confModels.value.trim() || '/models';

  try{
    ensureSupabase();
    setBadge(els.supabaseState, 'ready');
  }catch(err){ setBadge(els.supabaseState, 'error'); }

  try{
    await loadModels();
    await loadAllDescriptors();
  }catch(err){ els.recStatus.textContent = 'Model/descriptor load error: ' + err.message; }
}

function setMode(mode){
  currentMode = mode; // 'teacher' or 'student'
  els.modeTeacher.classList.toggle('primary', mode==='teacher');
  els.modeStudent.classList.toggle('primary', mode==='student');
  els.idLabel.textContent = mode === 'teacher' ? 'Teacher UUID / ID' : 'Student UUID / ID';
  loadAllDescriptors().catch(e=>console.warn(e));
}

// Events
els.btnApply.addEventListener('click', applyConfig);
els.btnStart.addEventListener('click', recognizeLoop);
els.btnStop.addEventListener('click', ()=>{ cancelAnimationFrame(rafId); rafId=null; info('Stopped.'); });
els.btnToggleOv.addEventListener('click', ()=>{ overlayOn = !overlayOn; });
els.threshold.addEventListener('input', (e)=>{ threshold = parseFloat(e.target.value); els.threshLabel.textContent = threshold.toFixed(2); if(faceMatcher) faceMatcher.distanceThreshold = threshold; });
els.reloadDescriptors.addEventListener('click', ()=> loadAllDescriptors());
els.markPresent.addEventListener('click', ()=>{
  const id = els.regId.value.trim();
  if(!id) { els.attnStatus.textContent = 'Provide an ID in the registration box to mark.'; return; }
  markAttendance(id, 'Manual').catch(err => els.attnStatus.textContent = 'Error: ' + err.message);
});

els.modeTeacher.addEventListener('click', ()=> setMode('teacher'));
els.modeStudent.addEventListener('click', ()=> setMode('student'));

els.startReg.addEventListener('click', beginRegistration);
els.captureOne.addEventListener('click', captureSample);
els.saveReg.addEventListener('click', saveRegistration);
els.cancelReg.addEventListener('click', cancelRegistration);

els.sampleCount.addEventListener('change', ()=>{ expectedSamples = parseInt(els.sampleCount.value,10) || 3; });

// Stop camera on unload
window.addEventListener('beforeunload', stopCamera);

// Initial labels
els.threshLabel.textContent = threshold.toFixed(2);
info('Configure Supabase and models, then Apply.');
