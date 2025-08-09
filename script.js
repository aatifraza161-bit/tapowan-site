// Global variables for data (will be populated from Supabase)
let students = [];
let teachers = [];
let payrollEntries = [];
let invoices = [];
let announcements = [];
let notifications = []; // Client-side for simplicity
let auditLogs = [];
let backups = []; // Client-side for simplicity
let attendanceRecords = [];
let teacherAttendanceRecords = [];
let profiles = []; // New global variable for profiles
let exams = []; // Global variable for exams
let homeworkAssignments = []; // Global variable for homework
let holidays = []; // Global variable for holidays

// FIX: Ensure html5-qrcode is loaded and ready before use.
// This block ensures the script is loaded dynamically if not already there.
// It's crucial for the Html5QrcodeScanner to be available.
// We'll use a Promise to track its loading status.
let html5QrCodeLoaded = new Promise((resolve, reject) => {
    if (window.Html5QrcodeScanner) {
        console.log('html5-qrcode library already present.');
        resolve();
    } else {
        const cdnUrl = 'https://unpkg.com/html5-qrcode@2.3.8/dist/html5-qrcode.min.js';
        const cdnUrl2 = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'; // Corrected CDN path
        // No localUrl fallback as it's not provided in the context for this specific file.

        const loadScript = (url) => {
            return new Promise((scriptResolve, scriptReject) => {
                const qrScript = document.createElement('script');
                qrScript.src = url;
                qrScript.onload = () => {
                    console.log(`html5-qrcode library loaded successfully from: ${url}`);
                    resolve(); // Resolve the main promise once any script loads
                    scriptResolve();
                };
                qrScript.onerror = (e) => {
                    console.error(`Failed to load html5-qrcode library from ${url}:`, e);
                    scriptReject(new Error(`Failed to load html5-qrcode library from ${url}.`));
                };
                document.head.appendChild(qrScript);
            });
        };

        loadScript(cdnUrl)
            .then(resolve)
            .catch(() => {
                console.warn('Attempting to load html5-qrcode from second CDN...');
                return loadScript(cdnUrl2);
            })
            .then(resolve)
            .catch((e) => {
                console.error('Failed to load html5-qrcode library from all sources:', e);
                alert('Failed to load QR scanner library. Please check your internet connection.');
                reject(new Error('Failed to load html5-qrcode library from all sources.'));
            });
    }
});

// Global variable for QR Scanner
let html5QrCodeScanner = null;
let html5QrCodeScannerTeacher = null; // For teacher QR scanner

// Supabase Client Initialization (Replace with your actual keys)
const SUPABASE_URL = 'https://zyvwttzwjweeslvjbatg.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dnd0dHp3andlZXNsdmpiYXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTQwODMsImV4cCI6MjA2OTUzMDA4M30.pgzB45XBJAyGBlkKUJF4Jr0yVNunXjwa8p8JOaX7Nso'; // Replace with your actual Supabase Anon Key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- IMPORTANT RLS NOTE ---
// If you are still getting 403 errors after this, ensure your Row Level Security (RLS) policies
// in Supabase are configured to allow 'SELECT', 'INSERT', 'UPDATE', 'DELETE' for the 'authenticated'
// and/or 'anon' roles on ALL tables your application interacts with.
//
// For testing, you can temporarily set very permissive policies like:
// CREATE POLICY "Allow all for authenticated users" ON your_table FOR ALL TO authenticated USING (true);
// CREATE POLICY "Allow all for anon users" ON your_table FOR ALL TO anon USING (true);
//
// Remember to refine these for production security!
//
// If you are getting 403 errors for attendance, specifically check:
// 1. RLS is ENABLED on the 'attendance' and 'teacher_attendance' tables.
// 2. There is a 'SELECT' policy for the 'authenticated' role (or 'anon' if needed before login)
//    on both 'attendance' and 'teacher_attendance' tables, with a 'USING' expression of 'true'.


// --- UI Utilities: Dark Mode and Exports ---
function applyDarkModeFromStorage() {
    const dark = localStorage.getItem('darkMode');
    if (dark === 'true') {
        document.body.classList.add('dark-mode');
        if (darkModeIcon) darkModeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        document.body.classList.remove('dark-mode');
        if (darkModeIcon) darkModeIcon.classList.replace('fa-sun', 'fa-moon');
    }
}
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    if (darkModeIcon) {
        if (isDark) {
            darkModeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            darkModeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    }
}
if (typeof window !== 'undefined') {
    // Attach toggle if element exists
    document.addEventListener('DOMContentLoaded', () => {
        const dm = document.getElementById('darkModeToggle');
        if (dm) dm.addEventListener('click', toggleDarkMode);
        applyDarkModeFromStorage();
    });
}

// Export utilities
function exportChartAsPNG(chartCanvasId, filename = 'chart.png') {
    const canvas = document.getElementById(chartCanvasId);
    if (!canvas) {
        console.error(`Canvas with ID ${chartCanvasId} not found.`);
        return;
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    link.click();
}
function exportArrayToCSV(array, filename = 'export.csv') {
    if (!Array.isArray(array) || array.length === 0) { alert('No data to export'); return; }
    const keys = Object.keys(array[0]);
    const lines = [keys.join(',')].concat(array.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Placeholder for Excel export functions (requires XLSX.js)
function exportStudentsToExcel() {
    if (students.length === 0) {
        alert('No student data to export.');
        return;
    }
    const ws = XLSX.utils.json_to_sheet(students);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_data.xlsx");
    console.log('Students data exported to Excel.');
}

function exportTeachersToExcel() {
    if (teachers.length === 0) {
        alert('No teacher data to export.');
        return;
    }
    const ws = XLSX.utils.json_to_sheet(teachers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
    XLSX.writeFile(wb, "teachers_data.xlsx");
    console.log('Teachers data exported to Excel.');
}

function exportHomeworkToExcel() {
    if (homeworkAssignments.length === 0) {
        alert('No homework data to export.');
        return;
    }
    const ws = XLSX.utils.json_to_sheet(homeworkAssignments);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Homework");
    XLSX.writeFile(wb, "homework_data.xlsx");
    console.log('Homework data exported to Excel.');
}

// Placeholder for PDF export functions (requires jspdf)
function exportReportsToPdf() {
    alert('Generating reports PDF...');
    // Implement jspdf logic here to generate a PDF of the reports dashboard
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("School Reports", 10, 10);
    // Add content from charts and tables
    doc.save("school_reports.pdf");
    console.log('Reports PDF generation initiated.');
}

function generateHomeworkReport() {
    alert('Generating homework report PDF...');
    // Implement jspdf logic here to generate a PDF of homework assignments
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Homework Assignments Report", 10, 10);
    // Add homework data
    doc.save("homework_report.pdf");
    console.log('Homework report PDF generation initiated.');
}

// --- Utility Functions ---

/**
 * Generates a unique UUID.
 * @returns {string} A UUID string.
 */
function generateUniqueId() {
    return crypto.randomUUID();
}

/**
 * Adds an entry to the audit_logs table in Supabase.
 * @param {string} userEmail - The email of the user performing the action.
 * @param {string} action - The action performed (e.g., 'Logged In', 'Added Student').
 * @param {string} module - The module where the action occurred (e.g., 'Authentication', 'Students').
 * @param {string} details - More specific details about the action.
 */
async function addAuditLog(userEmail, action, module, details) {
    try {
        const emailToLog = userEmail || 'anonymous@example.com';

        const { data, error } = await supabase.from('audit_logs').insert([
            {
                user_email: emailToLog,
                action: action,
                module: module,
                details: details,
                timestamp: new Date().toISOString()
            }
        ]);
        if (error) {
            console.error('Audit Log Error: Error adding audit log:', error);
            // Log the full error object for debugging RLS issues
            console.error('Audit Log Error: Supabase RLS or DB error details:', error.message, error.details, error.hint);
        } else {
            console.log('Audit Log Success: Audit log added:', data);
        }
    } catch (err) {
        console.error('Audit Log Unexpected Error:', err);
    }
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 * Used for storing WebAuthn credentials.
 * @param {ArrayBuffer} buffer - The ArrayBuffer to convert.
 * @returns {string} The Base64 encoded string.
 */
function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 * Used for retrieving WebAuthn credentials.
 * @param {string} base64 - The Base64 string to convert.
 * @returns {ArrayBuffer} The ArrayBuffer.
 */
function base64ToArrayBuffer(base64) {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Placeholder for voice assistant
function startVoiceAssistant() {
    alert('Voice assistant functionality is not yet implemented.');
    console.log('Voice assistant started.');
}

// Placeholder for typing effect
function initTypedWelcome() {
    const typedWelcomeElement = document.getElementById('typed-welcome');
    if (typedWelcomeElement) {
        // Simple typing effect simulation
        const text = "Welcome to Tapowan Public School Management System";
        let i = 0;
        typedWelcomeElement.textContent = ''; // Clear content initially
        function typeWriter() {
            if (i < text.length) {
                typedWelcomeElement.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50); // Typing speed
            }
        }
        typeWriter();
    }
}


// --- Data Fetching Functions (from Supabase) ---

async function fetchStudents() {
    console.log('Fetching students...');
    try {
        // Fetch students from the 'students' table
        const { data, error } = await supabase.from('students').select('*');
        if (error) throw error;
        students = data;
        console.log('Students fetched successfully:', students.length);
    } catch (error) {
        console.error('Error fetching students:', error);
        students = [];
    } finally {
        renderStudentTable();
        updateDashboardStats();
    }
}

async function fetchTeachers() {
    console.log('Fetching teachers...');
    try {
        const { data, error } = await supabase.from('teachers').select('*');
        if (error) throw error;
        teachers = data;
        console.log('Teachers fetched successfully:', teachers.length);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        teachers = [];
    } finally {
        renderTeacherTable();
        updateDashboardStats();
    }
}

async function fetchPayrollEntries() {
    console.log('Fetching payroll entries...');
    try {
        const { data, error } = await supabase.from('payroll').select('*');
        if (error) throw error;
        payrollEntries = data;
        console.log('Payroll entries fetched successfully:', payrollEntries.length);
    } catch (error) {
        console.error('Error fetching payroll entries:', error);
        payrollEntries = [];
    } finally {
        renderPayrollTable();
    }
}

async function fetchInvoices() {
    console.log('Fetching invoices...');
    try {
        const { data, error } = await supabase.from('finance').select(`
            *,
            students (
                id,
                name,
                class,
                father_name
            )
        `);
        if (error) throw error;
        invoices = data;
        console.log('Invoices fetched successfully:', invoices.length);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        invoices = [];
    } finally {
        renderFinanceTable();
        updateDashboardStats();
    }
}

async function fetchAnnouncements() {
    console.log('Fetching announcements...');
    try {
        const { data, error } = await supabase.from('announcements').select('*');
        if (error) throw error;
        announcements = data;
        console.log('Announcements fetched successfully:', announcements.length);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        announcements = [];
    } finally {
        renderAnnouncementTable();
    }
}

async function fetchNotifications() {
    console.log('Fetching notifications (client-side simulation)...');
    // Notifications are still client-side for simplicity, but could be fetched from DB
    notifications = JSON.parse(localStorage.getItem('notifications')) || [
        { id: 1, title: "New student enrolled!", description: "Emily Johnson joined Grade 10.", time: "5 minutes ago", unread: true },
        { id: 2, title: "Payroll processed", description: "March payroll completed for all staff.", time: "1 hour ago", unread: true },
        { id: 3, title: "Event Reminder", description: "Parent-Teacher meeting tomorrow at 3 PM.", time: "Yesterday", unread: true },
        { id: 4, title: "System Update", description: "System maintenance scheduled for Sunday.", time: "2 days ago", unread: false },
    ];
    renderDropdownNotifications();
    console.log('Notifications loaded:', notifications.length);
}

async function fetchAuditLogs() {
    console.log('Fetching audit logs...');
    try {
        const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
        if (error) throw error;
        auditLogs = data;
        console.log('Audit logs fetched successfully:', auditLogs.length);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        auditLogs = [];
    } finally {
        renderAuditLogs();
        renderRecentActivity();
    }
}

async function fetchBackups() {
    console.log('Fetching backups (client-side simulation)...');
    // Backups are simulated, but could be fetched from a storage service
    backups = JSON.parse(localStorage.getItem('backups')) || [
        { id: 'B001', backup_id: 'BK20231026-001', date: '2023-10-26 02:00:00', size: '150 MB', type: 'Full' },
        { id: 'B002', backup_id: 'BK20231025-001', date: '2023-10-25 02:00:00', size: '148 MB', type: 'Full' }
    ];
    renderBackupTable();
    console.log('Backups loaded:', backups.length);
}

async function fetchAttendanceRecords() {
    console.log('Fetching student attendance records...');
    try {
        // Fetch attendance records and join with students table to get student details
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                *,
                students (
                    id,
                    name,
                    class,
                    roll_no
                )
            `);
        if (error) {
            console.error('Error fetching student attendance records:', error);
            console.error('Supabase RLS or DB error details for student attendance:', error.message, error.details, error.hint);
            if (error.code === '403') {
                console.error("Received 403 Forbidden for student attendance. Check RLS policies for 'attendance' table.");
            }
            throw error; // Re-throw to ensure finally block is reached
        }
        attendanceRecords = data;
        console.log('Student attendance records fetched successfully:', attendanceRecords.length);
    } catch (error) {
        console.error('Caught error fetching student attendance, setting attendanceRecords to empty array.');
        attendanceRecords = [];
    } finally {
        // Ensure renderAttendanceTable is called after data is fetched
        renderAttendanceTable();
        // Also update dashboard stats that rely on attendance
        updateDashboardStats();
    }
}

async function fetchTeacherAttendanceRecords() {
    console.log('Fetching teacher attendance records...');
    try {
        // Fetch teacher attendance records and join with teachers table to get teacher details
        const { data, error } = await supabase
            .from('teacher_attendance')
            .select(`
                *,
                teachers (
                    id,
                    name,
                    subject
                )
            `);
        if (error) {
            console.error('Error fetching teacher attendance records:', error);
            console.error('Supabase RLS or DB error details for teacher attendance:', error.message, error.details, error.hint);
            if (error.code === '403') {
                console.error("Received 403 Forbidden for teacher attendance. Check RLS policies for 'teacher_attendance' table.");
            }
            throw error; // Re-throw to ensure finally block is reached
        }
        teacherAttendanceRecords = data;
        console.log('Teacher attendance records fetched successfully:', teacherAttendanceRecords.length);
    } catch (error) {
        console.error('Caught error fetching teacher attendance, setting teacherAttendanceRecords to empty array.');
        teacherAttendanceRecords = [];
    } finally {
        renderTeacherAttendanceTable();
        updateDashboardStats();
    }
}

async function fetchProfiles() {
    console.log('Fetching user profiles...');
    try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        profiles = data;
        console.log('User profiles fetched successfully:', profiles.length);
    } catch (error) {
        console.error('Error fetching profiles:', error);
        profiles = [];
    } finally {
        renderUserTable();
    }
}

async function fetchExams() {
    console.log('Fetching exams...');
    try {
        const { data, error } = await supabase.from('exams').select('*');
        if (error) throw error;
        exams = data;
        console.log('Exams fetched successfully:', exams.length);
    } catch (error) {
        console.error('Error fetching exams:', error);
        exams = [];
    } finally {
        renderExams();
    }
}

async function fetchHomework() {
    console.log('Fetching homework assignments...');
    try {
        const { data, error } = await supabase.from('homework').select('*');
        if (error) throw error;
        homeworkAssignments = data;
        console.log('Homework assignments fetched successfully:', homeworkAssignments.length);
    } catch (error) {
        console.error('Error fetching homework:', error);
        homeworkAssignments = [];
    } finally {
        renderHomeworkTable();
    }
}

async function fetchHolidays() {
    console.log('Fetching holidays...');
    try {
        const { data, error } = await supabase.from('holidays').select('*');
        if (error) throw error;
        holidays = data;
        console.log('Holidays fetched successfully:', holidays.length);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        holidays = [];
    } finally {
        renderHolidayList();
    }
}

/**
 * Fetches the role of a specific user from the 'profiles' table.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<string|null>} The role of the user (e.g., 'admin', 'teacher', 'student') or null if not found.
 */
async function fetchUserRole(userId) {
    console.log(`Fetching role for user ID: ${userId}`);
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user role:', error);
            return null;
        }

        if (data) {
            console.log(`User role for ${userId}: ${data.role}`);
            return data.role;
        } else {
            console.warn(`No profile found for user ID: ${userId}`);
            return null;
        }
    } catch (err) {
        console.error('Unexpected error in fetchUserRole:', err);
        return null;
    }
}

// --- Initial Data Load ---
async function loadAllData() {
    console.log('Loading all initial data...');
    await Promise.all([
        fetchStudents(),
        fetchTeachers(),
        fetchPayrollEntries(),
        fetchInvoices(),
        fetchAnnouncements(),
        fetchNotifications(), // Still local
        fetchAuditLogs(),
        fetchBackups(), // Still local
        fetchAttendanceRecords(), // Ensure this is awaited
        fetchTeacherAttendanceRecords(), // Ensure this is awaited
        fetchProfiles(),
        fetchExams(), // Fetch exams
        fetchHomework(), // Fetch homework
        fetchHolidays() // Fetch holidays
    ]);
    console.log('All initial data loaded.');
    updateDashboardStats();
    renderHolidayList();
}

// --- UI Element References ---

// Login UI Elements
const loginUi = document.getElementById('login-ui');
const schoolSiteUi = document.getElementById('school-site-ui');
const roleButtons = document.querySelectorAll('.role-button');
const selectedRoleInput = document.getElementById('selectedRole');
const loginForm = document.getElementById('loginForm');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

// School Site UI Elements
const logoutButton = document.getElementById('logoutButton');
const notificationButton = document.getElementById('notificationButton');
const notificationDropdown = document.getElementById('notificationDropdown');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const viewAllNotificationsLink = document.getElementById('viewAllNotificationsLink');
const notificationList = document.getElementById("notificationList");
const notificationCount = document.getElementById("notificationCount");
const newCount = document.getElementById("newCount");
const loggedInUserName = document.getElementById('loggedInUserName'); // This element is not in index.html, but was in script.js. Keeping it for consistency.
const currentModuleTitle = document.getElementById('currentModuleTitle');

const viewAllModal = document.getElementById("viewAllModal");
const viewAllNotificationList = document.getElementById("viewAllNotificationList");
const closeViewAllModal = document.getElementById("closeViewAllModal");
const modalMarkAllReadBtn = document.getElementById("modalMarkAllReadBtn");

const openPayrollModalBtn = document.getElementById('openPayrollModalBtn');
const payrollModal = document.getElementById('payrollModal');
const closePayrollModalBtn = document.getElementById('closePayrollModalBtn');
const payrollForm = document.getElementById('payrollForm');
const payrollTableBody = document.getElementById('payrollTableBody');
const searchPayrollPeriodInput = document.getElementById('searchPayrollPeriod');
const applyPayrollSearchButton = document.getElementById('applyPayrollSearch');

const openAddInvoiceModalBtn = document.getElementById('openAddInvoiceModalBtn');
const addInvoiceModal = document.getElementById('addInvoiceModal');
const closeAddInvoiceModalBtn = document.getElementById('closeAddInvoiceModalBtn');
const addInvoiceForm = document.getElementById('addInvoiceForm');
const financeTableBody = document.getElementById('financeTableBody');
const searchInvoiceNumberInput = document.getElementById('searchInvoiceNumber');
const applyInvoiceSearchButton = document.getElementById('applyInvoiceSearch');
const invoiceStudentSelect = document.getElementById('invoiceStudentId');

const userProfileToggle = document.getElementById('userProfileToggle');
const userDropdown = document.getElementById('userDropdown');

const searchStudentNameInput = document.getElementById('searchStudentName');
const searchRollInput = document.getElementById('searchRoll');
const searchClassSelect = document.getElementById('searchClass');
const applyStudentSearchButton = document.getElementById('applyStudentSearch');
const studentTableBody = document.getElementById('studentTableBody');

const studentModal = document.getElementById('studentModal');
const closeStudentModal = document.getElementById('closeStudentModal');
const studentForm = document.getElementById('studentForm');
const studentModalTitle = document.getElementById('studentModalTitle');
const studentFormSubmitBtn = document.getElementById('studentFormSubmitBtn');
const studentDetailsModal = document.getElementById('studentDetailsModal');
const closeStudentDetailsModal = document.getElementById('closeStudentDetailsModal');
const studentDetailsContent = document.getElementById('studentDetailsContent');


const searchTeacherNameInput = document.getElementById('searchTeacherName');
const searchTeacherSubjectSelect = document.getElementById('searchTeacherSubject');
const applyTeacherSearchButton = document.getElementById('applyTeacherSearch');
const teacherModal = document.getElementById('teacherModal');
const closeTeacherModal = document.getElementById('closeTeacherModal');
const teacherForm = document.getElementById('teacherForm');
const teacherTableBody = document.getElementById('teacherTableBody');
const teacherModalTitle = document.getElementById('teacherModalTitle');
const teacherFormSubmitBtn = document.getElementById('teacherFormSubmitBtn');
const teacherDetailsModal = document.getElementById('teacherDetailsModal');
const closeTeacherDetailsModal = document.getElementById('closeTeacherDetailsModal');
const teacherDetailsContent = document.getElementById('teacherDetailsContent');

// ===== Teacher Details Modal Logic (from sc.txt) =====

// Function to display teacher details in the modal
function showTeacherDetailsModal(teacherId) {
    const teacherDetailsModal = document.getElementById('teacherDetailsModal');
    const teacherDetailsContent = document.getElementById('teacherDetailsContent');

    // FIX: Use the globally available 'teachers' array
    const teacher = teachers.find(t => t.id === teacherId);

    if (teacher) {
        // Clear previous content
        teacherDetailsContent.innerHTML = '';

        // Populate the modal with teacher details
        teacherDetailsContent.innerHTML = `
            <p><strong>Name:</strong> ${teacher.name || 'N/A'}</p>
            <p><strong>Subject:</strong> ${teacher.subject || 'N/A'}</p>
            <p><strong>Email:</strong> ${teacher.email || 'N/A'}</p>
            <p><strong>Classes:</strong> ${teacher.classes || 'N/A'}</p>
        `;
        teacherDetailsModal.classList.remove('hidden');
        teacherDetailsModal.style.display = 'flex'; // Ensure it's visible
    } else {
        console.error('Teacher not found with ID:', teacherId);
        alert('Teacher details not found.');
    }
}

// The loadTeachers function from the original context is not needed here
// as 'teachers' global array is populated by fetchTeachers().
// Keeping it commented out to show it's intentionally removed.
/*
async function loadTeachers() {
    // Mock data for demonstration if not using a backend
    teachersData = [
        { id: 'T001', fullName: 'Ms. Alice Smith', subject: 'Math', email: 'alice.s@example.com', classes: 'Grade 6, Grade 7' },
        { id: 'T002', fullName: 'Mr. Bob Johnson', subject: 'Science', email: 'bob.j@example.com', classes: 'Grade 8, Grade 9' },
    ];
    renderTeachersTable(); // Assuming you have a function to render the table
}
*/


const userModal = document.getElementById('userModal');
const closeUserModal = document.getElementById('closeUserModal');
const userForm = document.getElementById('userForm');
const userTableBody = document.getElementById('userTableBody');
const userModalTitle = document.getElementById('userModalTitle');
const userFormSubmitBtn = document.getElementById('userFormSubmitBtn');

const announcementModal = document.getElementById('announcementModal');
const closeAnnouncementModal = document.getElementById('closeAnnouncementModal');
const announcementForm = document.getElementById('announcementForm');
const announcementTableBody = document.getElementById('announcementTableBody');
const announcementModalTitle = document.getElementById('announcementModalTitle');
const announcementFormSubmitBtn = document.getElementById('announcementFormSubmitBtn');

const auditLogTableBody = document.getElementById('auditLogTableBody');
const backupTableBody = document.getElementById('backupTableBody');
const recentActivityList = document.getElementById('recentActivityList');

// Dashboard Stats Elements
const totalStudentsCount = document.getElementById('totalStudentsCount');
const totalTeachersCount = document.getElementById('totalTeachersCount');
const monthlyRevenue = document.getElementById('monthlyRevenue'); // Not directly in index.html, but implied by script.js
const upcomingEventsCount = document.getElementById('upcomingEventsCount'); // Not directly in index.html, but implied by script.js
const studentsPresentToday = document.getElementById('studentsPresentToday');
const teachersPresentToday = document.getElementById('teachersPresentToday');

// Chart.js instances (These are for dashboard charts, not reports)
// Centralized chart update scheduler to avoid multiple re-initializations
let chartUpdateScheduled = false;
function scheduleChartUpdate() {
    if (chartUpdateScheduled) return;
    chartUpdateScheduled = true;
    // Use requestAnimationFrame to batch DOM work and avoid layout thrash
    requestAnimationFrame(() => {
        try {
            initCharts(); // Call initCharts directly here
        } finally {
            chartUpdateScheduled = false;
        }
    });
}
/** Utility to safely destroy a Chart.js instance **/
function safeDestroy(chartInstance) {
    try {
        if (chartInstance && typeof chartInstance.destroy === 'function') {
            chartInstance.destroy();
        }
    } catch (e) {
        console.warn('Error destroying chart instance:', e);
    }
}

let financeOverviewChartInstance = null;
let studentAttendanceChartInstance = null;
let teacherAttendanceChartInstance = null;
let monthlyAttendanceTrendChartInstance = null;

// Student Attendance Module Elements
const attendanceModal = document.getElementById('attendanceModal');
const closeAttendanceModal = document.getElementById('closeAttendanceModal');
const attendanceForm = document.getElementById('attendanceForm');
const attendanceModalTitle = document.getElementById('attendanceModalTitle');
const attendanceFormSubmitBtn = document.getElementById('attendanceFormSubmitBtn');
const attendanceStudentSelect = document.getElementById('attendanceStudentSelect');
const attendanceTableBody = document.getElementById('attendanceTableBody');
const attendanceClassFilter = document.getElementById('attendanceClassFilter');
const attendanceDateFilter = document.getElementById('attendanceDateFilter');
const attendanceStudentNameFilter = document.getElementById('attendanceStudentNameFilter');
const applyAttendanceFilter = document.getElementById('applyAttendanceFilter');
const attendanceTotalStudents = document.getElementById('attendanceTotalStudents');
const attendanceTotalPresent = document.getElementById('attendanceTotalPresent');
const attendanceTotalAbsent = document.getElementById('attendanceTotalAbsent');
const registerStudentFingerprintBtn = document.getElementById('registerStudentFingerprintBtn');
const verifyStudentFingerprintBtn = document.getElementById('verifyStudentFingerprintBtn');
const qrScannerSection = document.getElementById('qrScannerSection');
const qrVideo = document.getElementById('qrVideo');
const classAttendanceSelect = document.getElementById('classAttendanceSelect');
const classAttendanceDate = document.getElementById('classAttendanceDate');
const loadClassStudentsBtn = document.getElementById('loadClassStudentsBtn');
const markClassAttendanceBtn = document.getElementById('markClassAttendanceBtn');
const classAttendanceTableBody = document.getElementById('classAttendanceTableBody');

// Teacher Attendance Module Elements
const teacherAttendanceModal = document.getElementById('teacherAttendanceModal');
const closeTeacherAttendanceModal = document.getElementById('closeTeacherAttendanceModal');
const teacherAttendanceForm = document.getElementById('teacherAttendanceForm');
const teacherAttendanceModalTitle = document.getElementById('teacherAttendanceModalTitle');
const teacherAttendanceFormSubmitBtn = document.getElementById('teacherAttendanceFormSubmitBtn');
const teacherAttendanceTeacherSelect = document.getElementById('teacherAttendanceTeacherSelect');
// FIX: Renamed this to avoid conflict with teacher management table body
const teacherAttendanceRecordsTableBody = document.getElementById('teacherAttendanceTableBody');
const teacherAttendanceSubjectFilter = document.getElementById('teacherAttendanceSubjectFilter');
const teacherAttendanceDateFilter = document.getElementById('teacherAttendanceDateFilter');
const teacherAttendanceNameFilter = document.getElementById('teacherAttendanceNameFilter');
const applyTeacherAttendanceFilter = document.getElementById('applyTeacherAttendanceFilter');
const teacherAttendanceTotalTeachers = document.getElementById('teacherAttendanceTotalTeachers');
const teacherAttendanceTotalPresent = document.getElementById('teacherAttendanceTotalPresent');
const teacherAttendanceTotalAbsent = document.getElementById('teacherAttendanceTotalAbsent');
const registerTeacherFingerprintBtn = document.getElementById('registerTeacherFingerprintBtn');
const verifyTeacherFingerprintBtn = document.getElementById('verifyTeacherFingerprintBtn');
const teacherQrScannerSection = document.getElementById('teacherQrScannerSection');
const teacherQrVideo = document.getElementById('teacherQrVideo');

// Dark Mode Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeIcon = darkModeToggle ? darkModeToggle.querySelector('i') : null;

// QR Code Modal Elements
const studentQrCodeModal = document.getElementById('studentQrCodeModal');
const closeStudentQrCodeModal = document.getElementById('closeStudentQrCodeModal');
const studentQrCodeCanvas = document.getElementById('studentQrCodeCanvas');
const qrCodeStudentIdDisplay = document.getElementById('qrCodeStudentIdDisplay');
const downloadQrCodeLink = document.getElementById('downloadQrCodeLink'); // Changed from button to link

// Exam Module Elements
const examTableBody = document.getElementById('examTableBody');
const examModal = document.getElementById('examModal');
const closeExamModal = document.getElementById('closeExamModal');
const examForm = document.getElementById('examForm');
const examModalTitle = document.getElementById('examModalTitle');
const examFormSubmitBtn = document.getElementById('examFormSubmitBtn');
let currentExamId = null;

// Generate Exam Results Modal elements
const generateResultsModal = document.getElementById('generateResultsModal');
const closeGenerateResultsModal = document.getElementById('closeGenerateResultsModal');
const generateResultsForm = document.getElementById('generateResultsForm');
const resultsClassFilter = document.getElementById('resultsClassFilter');
const resultsExamTypeFilter = document.getElementById('resultsExamTypeFilter');

// Chart instances for reports
let reportsAttendanceChart = null;
let reportsPerformanceChart = null;
let reportsStudentStatusChart = null;
let reportsClassPerformanceChart = null;

// Calendar Module Elements
const calendarEl = document.getElementById('calendar-full');
let calendar;
const holidayListContainer = document.getElementById('holidayList');
const addHolidayModal = document.getElementById('addHolidayModal');
const closeAddHolidayModal = document.getElementById('closeAddHolidayModal');
const addHolidayForm = document.getElementById('addHolidayForm');

// Invoice Details Modal
const invoiceDetailsModal = document.getElementById('invoiceDetailsModal');
const closeInvoiceDetailsModal = document.getElementById('closeInvoiceDetailsModal');
const invoiceContent = document.getElementById('invoiceContent'); // Added for invoice details

// Homework Module Elements
const homeworkTableBody = document.getElementById('homeworkTableBody');
const addHomeworkModal = document.getElementById('addHomeworkModal');
const closeAddHomeworkModal = document.getElementById('closeAddHomeworkModal');
const homeworkForm = document.getElementById('homeworkForm');
const homeworkModalTitle = document.getElementById('addHomeworkModalTitle');
const homeworkFormSubmitBtn = document.getElementById('homeworkFormSubmitBtn');
const filterHomeworkClass = document.getElementById('filterHomeworkClass');
const filterHomeworkSubject = document.getElementById('filterHomeworkSubject');
const filterHomeworkDueDate = document.getElementById('filterHomeworkDueDate');
const applyHomeworkFilter = document.getElementById('applyHomeworkFilter');
const homeworkDetailsModal = document.getElementById('homeworkDetailsModal');
const closeHomeworkDetailsModal = document.getElementById('closeHomeworkDetailsModal');
const homeworkDetailsContent = document.getElementById('homeworkDetailsContent');

// Teacher QR Code Modal Elements
const teacherQrCodeModal = document.getElementById('teacherQrCodeModal');
const closeTeacherQrCodeModal = document.getElementById('closeTeacherQrCodeModal');
const teacherQrCodeCanvas = document.getElementById('teacherQrCodeCanvas');
const qrCodeTeacherIdDisplay = document.getElementById('qrCodeTeacherIdDisplay');
const downloadTeacherQrCodeLink = document.getElementById('downloadTeacherQrCodeLink');


// --- Initial UI State Management ---

/**
 * Shows the login UI and hides the main school site UI.
 */
function showLoginUi() {
    console.log('Showing login UI.');
    loginUi.style.display = 'flex';
    schoolSiteUi.style.display = 'none';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.minHeight = '100vh';
    document.body.style.backgroundColor = 'var(--light)';
    document.body.style.overflow = 'hidden';
    initTypedWelcome(); // Initialize typing effect on login page
}

/**
 * Shows the main school site UI and hides the login UI.
 * Loads all initial data and updates UI elements.
 */
async function showSchoolSiteUi() {
    console.log('Showing school site UI.');
    loginUi.style.display = 'none';
    schoolSiteUi.style.display = 'flex';
    document.body.style.justifyContent = 'flex-start';
    document.body.style.alignItems = 'flex-start';
    document.body.style.minHeight = 'auto';
    document.body.style.backgroundColor = 'var(--light)';
    document.body.style.overflow = 'auto';

    const { data: { session } } = await supabase.auth.getSession();
    console.log("showSchoolSiteUi: Current session status:", session ? "Authenticated" : "Not Authenticated");
    if (session && session.user) {
        console.log("showSchoolSiteUi: Authenticated user email:", session.user.email);
    }

    await loadAllData(); // Load all data from Supabase

    updateLoggedInUserName();
    updateUIAccess(); // Adjust UI based on role

    if (calendarEl && typeof FullCalendar !== 'undefined' && !calendar) {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            themeSystem: 'standard',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            editable: true,
            selectable: true,
            dayMaxEvents: true,
            firstDay: 1,
            eventColor: '#4F46E5',
            eventTextColor: '#ffffff',
            height: 'auto',
            events: [
                {
                    title: 'Parent-Teacher Meeting',
                    start: new Date().toISOString().split('T')[0],
                    backgroundColor: '#4F46E5',
                    borderColor: '#4F46E5'
                },
                {
                    title: 'Sports Day',
                    start: new Date(new Date().getTime() + 86400000 * 5).toISOString().split('T')[0],
                    backgroundColor: '#10B981',
                    borderColor: '#10B981'
                },
                {
                    title: 'End of Term Exams',
                    start: new Date(new Date().getTime() + 86400000 * 14).toISOString().split('T')[0],
                    end: new Date(new Date().getTime() + 86400000 * 18).toISOString().split('T')[0],
                    backgroundColor: '#F59E0B',
                    borderColor: '#F59E0B'
                }
            ],
            eventSources: [
                {
                    events: holidays.map(holiday => ({
                        title: holiday.name,
                        start: holiday.date,
                        allDay: true,
                        classNames: ['holiday'],
                        display: 'background'
                    }))
                }
            ],
            eventDidMount: function(info) {
                info.el.title = info.event.title;
            }
        });
        calendar.render();
    } else if (calendar) {
        calendar.render(); // Re-render if already initialized
    }
}

/**
 * Updates UI elements (navigation, buttons) to be fully visible.
 * All role-based restrictions are removed.
 */
function updateUIAccess() {
    console.log('Updating UI access: showing all elements.');
    // Show all elements with data-role attributes
    document.querySelectorAll('[data-role]').forEach(el => {
        el.style.display = 'block';
    });

    // Show all navigation items
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('hidden');
    });

    // Show all specific buttons/forms
    // These elements are not directly present in the provided index.html,
    // but were referenced in the original script.js. Keeping them as placeholders.
    const addStudentBtn = document.querySelector('#studentsModule button.bg-blue-600');
    if (addStudentBtn) addStudentBtn.classList.remove('hidden');
    const addTeacherBtn = document.querySelector('#teachersModule button.bg-green-600');
    if (addTeacherBtn) addTeacherBtn.classList.remove('hidden');
    const addUserBtn = document.querySelector('#user-managementModule button.bg-blue-600');
    if (addUserBtn) addUserBtn.classList.remove('hidden');
    if (openPayrollModalBtn) openPayrollModalBtn.classList.remove('hidden');
    if (openAddInvoiceModalBtn) openAddInvoiceModalBtn.classList.remove('hidden');
}


// Check login status on load
document.addEventListener('DOMContentLoaded', () => {
    // Always show the login UI initially to prevent auto-login on refresh
    // This ensures a clean login flow.
    showLoginUi();

    // If you want to automatically log in if a session exists on refresh,
    // uncomment the block below. However, the current setup requires manual login
    // after a refresh for security and clarity.
    /*
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
            console.log("DOMContentLoaded: Existing session found. Attempting to show school site UI.");
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('loggedInUser', JSON.stringify(session.user));
            showSchoolSiteUi();
        } else {
            console.log("DOMContentLoaded: No existing session. Showing login UI.");
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('loggedInUser');
            showLoginUi();
        }
    });
    */
});

// --- Login UI Logic ---

roleButtons.forEach(button => {
    button.addEventListener('click', function() {
        roleButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        selectedRoleInput.value = this.dataset.role;
        console.log(`Role selected: ${this.dataset.role}`);
    });
});

/**
 * Handles user login authentication with Supabase.
 * Verifies selected role against user_metadata.
 */
async function handleLogin() {
    const emailInput = document.getElementById('email').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const selectedRole = document.getElementById('selectedRole').value;

    // Ensure all fields are filled and a role is selected
    if (!emailInput || !passwordInput || !selectedRole) {
        alert('Please fill in all fields and select a role.');
        console.warn('Login attempt failed: Missing email, password, or role.');
        return;
    }

    console.log(`Attempting login for ${emailInput} with role ${selectedRole}...`);
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailInput,
            password: passwordInput
        });

        if (authError) {
            alert('Login failed: ' + authError.message);
            console.error('Supabase signInWithPassword error:', authError);
            await addAuditLog(emailInput, 'Login Failed', 'Authentication', `Error: ${authError.message}`);
            return;
        }

        if (authData.user) {
            // Determine the user's actual role from Supabase metadata
            // raw_user_meta_data is preferred as it's directly set by the application
            const userRole = authData.user.user_metadata?.role || authData.user.app_metadata?.role || 'admin'; // Corrected to user_metadata
            console.log(`User ${authData.user.email} logged in. Actual role: ${userRole}`);

            // Proceed with login if roles match or if the selected role is 'admin' (allowing admin to impersonate/test)
            // NOTE: For stricter role enforcement, you'd add: if (selectedRole !== userRole && userRole !== 'admin') { ... }
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('loggedInUser', JSON.stringify(authData.user)); // Store the full user object
            alert('Login successful! Redirecting...');
            await addAuditLog(authData.user.email, 'Logged In', 'Authentication', `Successful login for role: ${userRole}`);
            showSchoolSiteUi(); // Only call this on successful login
        } else {
            // This case should ideally be covered by authError, but as a fallback
            alert('Login failed: No user data returned.');
            console.error('Login failed: No user data returned from signInWithPassword.');
            await addAuditLog(emailInput, 'Login Failed (No User Data)', 'Authentication', 'No user data returned from signInWithPassword.');
        }
    } catch (err) {
        console.error('Unexpected error during login:', err);
        alert('An unexpected error occurred: ' + err.message);
        await addAuditLog(emailInput, 'Login Failed (Unexpected)', 'Authentication', `Unexpected error: ${err.message}`);
    }
}

// Event listener for the login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await handleLogin();
    });
}

// Forgot Password Modal Logic
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(event) {
        event.preventDefault();
        forgotPasswordModal.classList.add('active');
        forgotPasswordModal.style.display = 'flex'; // Ensure it's visible
        console.log('Forgot password modal opened.');
    });
}

if (closeForgotPasswordModal) {
    closeForgotPasswordModal.addEventListener('click', function() {
        forgotPasswordModal.classList.remove('active');
        forgotPasswordModal.style.display = 'none'; // Ensure it's hidden
        forgotPasswordForm.reset();
        console.log('Forgot password modal closed.');
    });
}

if (forgotPasswordModal) {
    forgotPasswordModal.addEventListener('click', function(event) {
        if (event.target === forgotPasswordModal) {
            forgotPasswordModal.classList.remove('active');
            forgotPasswordModal.style.display = 'none'; // Ensure it's hidden
            forgotPasswordForm.reset();
            console.log('Forgot password modal closed by outside click.');
        }
    });
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        if (!email) {
            alert('Please enter your email address.');
            console.warn('Forgot password attempt: No email entered.');
            return;
        }
        console.log(`Sending password reset link to ${email}...`);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
                alert('Error sending reset link: ' + error.message);
                console.error('Supabase resetPasswordForEmail error:', error);
                await addAuditLog(email, 'Forgot Password Failed', 'Authentication', `Failed to send reset link: ${error.message}`);
            } else {
                alert('If an account with that email exists, a password reset link has been sent to ' + email + '.');
                console.log('Password reset link sent successfully (if email exists).');
                await addAuditLog(email, 'Forgot Password Initiated', 'Authentication', 'Password reset link sent.');
            }
        } catch (err) {
            console.error('Unexpected error during password reset:', err);
            alert('An unexpected error occurred: ' + err.message);
        } finally {
            forgotPasswordModal.classList.remove('active');
            forgotPasswordModal.style.display = 'none'; // Ensure it's hidden
            forgotPasswordForm.reset();
        }
    });
}

// --- School Site UI Logic ---

// Logout functionality
if (logoutButton) {
    logoutButton.addEventListener('click', async function() {
        if (confirm('Are you sure you want to logout?')) {
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            console.log(`Logging out user: ${loggedInUser ? loggedInUser.email : 'Unknown'}`);
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;

                await addAuditLog(loggedInUser ? loggedInUser.email : 'Unknown', 'Logged Out', 'Authentication', 'User logged out');
                localStorage.clear(); // Clear all local storage on logout

                // Reset UI elements to default dashboard view
                document.querySelectorAll('.module-content').forEach(m => m.classList.add('hidden'));
                document.getElementById('dashboardMainContent').classList.remove('hidden');
                document.getElementById('moduleTabs').classList.remove('hidden');
                document.getElementById('modulesContainer').classList.add('hidden');
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                document.querySelector('.nav-item[data-module="dashboard"]').classList.add('active');
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelector('.tab[data-tab="dashboard"]').classList.add('active');

                // Destroy all chart instances to prevent memory leaks and re-render issues
                safeDestroy(financeOverviewChartInstance);
                safeDestroy(studentAttendanceChartInstance);
                safeDestroy(teacherAttendanceChartInstance);
                safeDestroy(monthlyAttendanceTrendChartInstance);
                safeDestroy(reportsAttendanceChart);
                safeDestroy(reportsPerformanceChart);
                safeDestroy(reportsStudentStatusChart);
                safeDestroy(reportsClassPerformanceChart);

                // Reset global data arrays
                students = [];
                teachers = [];
                payrollEntries = [];
                invoices = [];
                announcements = [];
                notifications = [];
                auditLogs = [];
                backups = [];
                attendanceRecords = [];
                teacherAttendanceRecords = [];
                profiles = [];
                exams = [];
                homeworkAssignments = [];
                holidays = [];

                // Stop QR scanners if they are active
                if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
                    await html5QrCodeScanner.stop();
                    html5QrCodeScanner = null; // Clear the instance
                }
                if (html5QrCodeScannerTeacher && html5QrCodeScannerTeacher.isScanning) {
                    await html5QrCodeScannerTeacher.stop();
                    html5QrCodeScannerTeacher = null; // Clear the instance
                }

                // Show login UI after all cleanup
                showLoginUi();
                console.log('Logout successful. UI reset and data cleared.');

            } catch (error) {
                console.error('Error logging out:', error);
                alert('Error logging out: ' + error.message);
                await addAuditLog(loggedInUser ? loggedInUser.email : 'Unknown', 'Logout Failed', 'Authentication', `Error: ${error.message}`);
            }
        }
    });
}


function renderHolidayList() {
    if (!holidayListContainer) return;
    holidayListContainer.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingHolidays = holidays
        .filter(holiday => new Date(holiday.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort ascending to show nearest first

    if (upcomingHolidays.length === 0) {
        holidayListContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No upcoming holidays.</p>';
        return;
    }

    upcomingHolidays.slice(0, 5).forEach(holiday => {
        const holidayDate = new Date(holiday.date);
        const formattedDate = holidayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const listItem = document.createElement('div');
        listItem.className = 'holiday-list-item module-card';
        listItem.innerHTML = `
            <span class="date">${formattedDate}</span>
            <span class="name">${holiday.name}</span>
            <i class="fas fa-star text-red-500"></i>
        `;
        holidayListContainer.appendChild(listItem);
    });
    console.log('Holiday list rendered.');
}

window.showAddHolidayModal = function() {
    addHolidayModal.classList.remove('hidden');
    addHolidayModal.style.display = 'flex';
    addHolidayForm.reset();
    console.log('Add Holiday modal opened.');
}

if (closeAddHolidayModal) {
    closeAddHolidayModal.addEventListener('click', () => {
        addHolidayModal.classList.add('hidden');
        addHolidayModal.style.display = 'none';
        console.log('Add Holiday modal closed.');
    });
}

if (addHolidayModal) {
    addHolidayModal.addEventListener('click', (e) => {
        if (e.target === addHolidayModal) {
            addHolidayModal.classList.add('hidden');
            addHolidayModal.style.display = 'none';
            console.log('Add Holiday modal closed by outside click.');
        }
    });
}

if (addHolidayForm) {
    addHolidayForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const holidayName = document.getElementById('holidayName').value;
        const holidayDate = document.getElementById('holidayDate').value;

        if (!holidayName || !holidayDate) {
            alert('Please fill in all fields.');
            console.warn('Add Holiday failed: Missing name or date.');
            return;
        }

        try {
            const { data, error } = await supabase.from('holidays').insert([
                { name: holidayName, date: holidayDate }
            ]).select();

            if (error) throw error;

            alert('Holiday added successfully!');
            await fetchHolidays(); // Re-fetch holidays to update the list and calendar
            if (calendar) {
                calendar.addEvent({
                    title: holidayName,
                    start: holidayDate,
                    allDay: true,
                    classNames: ['holiday'],
                    display: 'background'
                });
            }
            addHolidayModal.classList.add('hidden');
            addHolidayModal.style.display = 'none';
            addHolidayForm.reset();
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            await addAuditLog(loggedInUser?.email || 'admin', 'Added Holiday', 'Calendar', `Added holiday: ${holidayName} on ${holidayDate}`);
            console.log(`Holiday "${holidayName}" added.`);
        } catch (error) {
            alert('Error adding holiday: ' + error.message);
            console.error('Supabase error adding holiday:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Add Holiday Failed', 'Calendar', `Error: ${error.message}`);
        }
    });
}


/**
 * Shows the specified module content and updates active navigation/tab states.
 * All modules are accessible.
 * @param {string} moduleName - The name of the module to show (e.g., 'dashboard', 'students').
 */
window.showModule = async function(moduleName) {
    console.log(`Showing module: ${moduleName}`);
    const dashboardMainContent = document.getElementById('dashboardMainContent');
    const modulesContainer = document.getElementById('modulesContainer');
    const moduleTabs = document.getElementById('moduleTabs');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Role retrieval is kept for audit logging, but not for access control
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role || 'admin' : null; // Corrected to user_metadata

    currentModuleTitle.textContent = moduleName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    document.querySelectorAll('.module-content').forEach(m => m.classList.add('hidden'));
    dashboardMainContent.classList.add('hidden');
    modulesContainer.classList.remove('hidden');

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Stop QR scanner if active when switching modules
    if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
        await stopQrAttendance();
    }
    if (html5QrCodeScannerTeacher && html5QrCodeScannerTeacher.isScanning) {
        await stopTeacherQrAttendance();
    }

    if (moduleName === 'dashboard') {
        dashboardMainContent.classList.remove('hidden');
        modulesContainer.classList.add('hidden');
        moduleTabs.classList.remove('hidden');
        document.querySelector('.tab[data-tab="dashboard"]').classList.add('active');
        document.querySelector('.nav-item[data-module="dashboard"]').classList.add('active');
        currentModuleTitle.textContent = 'Dashboard';
        updateDashboardStats();
        scheduleChartUpdate();
    } else {
        const moduleElement = document.getElementById(`${moduleName}Module`);
        if (moduleElement) {
            moduleElement.classList.remove('hidden');
        }
        const tabElement = document.querySelector(`.tab[data-tab="${moduleName}"]`);
        if (tabElement) {
            tabElement.classList.add('active');
        }
        const activeNavItem = document.querySelector(`.nav-item[data-module="${moduleName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Re-fetch data for the module when it's opened
        switch (moduleName) {
            case 'students': await fetchStudents(); break;
            case 'teachers': await fetchTeachers(); break;
            case 'payroll': await fetchPayrollEntries(); break;
            case 'finance': await fetchInvoices(); populateInvoiceStudentSelect(); break;
            case 'attendance': await fetchAttendanceRecords(); populateStudentSelect(); break; // Ensure fetchAttendanceRecords is called here
            case 'teacher-attendance': await fetchTeacherAttendanceRecords(); populateTeacherSelect(); break;
            case 'announcements': await fetchAnnouncements(); break;
            case 'audit-logs': await fetchAuditLogs(); break;
            case 'backup-restore': await fetchBackups(); break;
            case 'user-management': await fetchProfiles(); break;
            case 'exams': await fetchExams(); break; // Fetch exams when module is opened
            case 'reports': initReportsCharts(); break; // Initialize reports charts
            case 'homework': await fetchHomework(); break; // Fetch homework when module is opened
            case 'calendar': await fetchHolidays(); if(calendar) calendar.render(); break; // Re-render calendar on module switch
            default: console.warn(`No specific data fetch defined for module: ${moduleName}`);
        }
    }
    if (notificationDropdown) notificationDropdown.classList.remove('active');
    if (userDropdown) userDropdown.classList.remove('active');
}

document.querySelectorAll('.open-module, .tab, .nav-item').forEach(el => { // Removed .user-dropdown-item as it's not a module trigger
    el.addEventListener('click', async (e) => {
        e.preventDefault();
        const moduleName = el.dataset.module || el.dataset.tab;
        if (moduleName) {
            showModule(moduleName);
        }
    });
});

// User Dropdown Toggle
window.toggleUserDropdown = function() {
    if (userDropdown) userDropdown.classList.toggle('hidden'); // Use hidden class for Tailwind
    if (notificationDropdown) notificationDropdown.classList.add('hidden'); // Hide notification dropdown
    console.log('User profile dropdown toggled.');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (notificationDropdown && !notificationDropdown.contains(event.target) && (!notificationButton || !notificationButton.contains(event.target))) {
        notificationDropdown.classList.add('hidden');
    }
    if (userDropdown && !userDropdown.contains(event.target) && (!userProfileToggle || !userProfileToggle.contains(event.target))) {
        userDropdown.classList.add('hidden');
    }
});


function renderDropdownNotifications() {
    if (!notificationList || !notificationCount || !newCount) return;
    notificationList.innerHTML = "";
    let unreadCount = 0;
    notifications.slice(0, 3).forEach((notif) => {
        if (notif.unread) unreadCount++;
        const div = document.createElement("div");
        div.className = "notification-item" + (notif.unread ? " unread" : "");
        div.dataset.id = notif.id;
        div.innerHTML = `
            <div class="title">${notif.title}</div>
            <p class="text-sm text-gray-600">${notif.description}</p>
            <div class="time">${notif.time}</div>
        `;
        div.addEventListener("click", () => {
            markNotificationRead(notif.id);
        });
        notificationList.appendChild(div);
    });
    notificationCount.textContent = unreadCount > 0 ? unreadCount : "";
    newCount.textContent = unreadCount > 0 ? `${unreadCount} New` : "No new";
    localStorage.setItem('notifications', JSON.stringify(notifications));
    console.log('Dropdown notifications rendered.');
}

function renderModalNotifications() {
    if (!viewAllNotificationList) return;
    viewAllNotificationList.innerHTML = "";
    notifications.forEach((notif) => {
        const div = document.createElement("div");
        div.className = "view-all-notification" + (notif.unread ? " unread" : "");
        div.dataset.id = notif.id;
        div.innerHTML = `
            <div class="title">${notif.title}</div>
            <p class="text-sm text-gray-600">${notif.description}</p>
            <div class="time">${notif.time}</div>
        `;
        div.addEventListener("click", () => {
            markNotificationRead(notif.id);
            div.classList.remove("unread");
        });
        viewAllNotificationList.appendChild(div);
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    console.log('Modal notifications rendered.');
}

async function markNotificationRead(id) {
    const notif = notifications.find((n) => n.id === id);
    if (notif && notif.unread) {
        notif.unread = false;
        renderDropdownNotifications();
        renderModalNotifications();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        await addAuditLog(loggedInUser?.email || 'System', 'Notification Read', 'Notifications', `Notification "${notif.title}" marked as read.`);
        console.log(`Notification ID ${id} marked as read.`);
    }
}

async function markAllAsRead() {
    notifications.forEach((n) => (n.unread = false));
    renderDropdownNotifications();
    renderModalNotifications();
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    await addAuditLog(loggedInUser?.email || 'System', 'Notifications', 'Notifications', 'All notifications marked as read.');
    console.log('All notifications marked as read.');
}

if (notificationButton) {
    notificationButton.addEventListener('click', function(event) {
        event.stopPropagation();
        notificationDropdown.classList.toggle('hidden'); // Use hidden class
        if (userDropdown) userDropdown.classList.add('hidden'); // Hide user dropdown
        console.log('Notification dropdown toggled.');
    });
}


if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
}

if (viewAllNotificationsLink) {
    viewAllNotificationsLink.addEventListener('click', function(event) {
        event.preventDefault();
        if (notificationDropdown) notificationDropdown.classList.add("hidden"); // Use hidden class
        if (viewAllModal) {
            viewAllModal.classList.add("active");
            viewAllModal.style.display = 'flex'; // Ensure it's visible
        }
        renderModalNotifications();
        console.log('View All Notifications modal opened.');
    });
}

if (closeViewAllModal) {
    closeViewAllModal.addEventListener("click", () => {
        if (viewAllModal) {
            viewAllModal.classList.remove("active");
            viewAllModal.style.display = 'none'; // Ensure it's hidden
        }
        console.log('View All Notifications modal closed.');
    });
}

if (viewAllModal) {
    viewAllModal.addEventListener("click", (e) => {
        if (e.target === viewAllModal) {
            viewAllModal.classList.remove("active");
            viewAllModal.style.display = 'none'; // Ensure it's hidden
            console.log('View All Notifications modal closed by outside click.');
        }
    });
}

if (modalMarkAllReadBtn) {
    modalMarkAllReadBtn.addEventListener("click", markAllAsRead);
}

// Payroll Module Specific JavaScript
function renderPayrollTable(filteredPayroll = payrollEntries) {
    if (!payrollTableBody) return;
    payrollTableBody.innerHTML = '';
    if (filteredPayroll.length === 0) {
        payrollTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No payroll entries found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    filteredPayroll.forEach(entry => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (entry.status) {
            case 'Paid': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Processing': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            case 'Pending': statusBgClass = 'bg-blue-100'; statusTextColorClass = 'text-blue-800'; break;
            default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
        }
        newRow.innerHTML = `
            <td class="py-3 px-4">${entry.period}</td>
            <td class="py-3 px-4">${entry.staff_count}</td>
            <td class="py-3 px-4">₹${parseFloat(entry.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${entry.status}</span>
            </td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="View Details" onclick="alert('Viewing details for payroll ${entry.period}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Download PDF" onclick="alert('Downloading PDF for payroll ${entry.period}')">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </td>
        `;
        payrollTableBody.prepend(newRow);
    });
    console.log('Payroll table rendered.');
}

function filterPayroll() {
    const periodQuery = searchPayrollPeriodInput.value.toLowerCase();
    const filtered = payrollEntries.filter(entry => {
        return entry.period.toLowerCase().includes(periodQuery);
    });
    renderPayrollTable(filtered);
    console.log('Payroll filtered.');
}

if (applyPayrollSearchButton) applyPayrollSearchButton.addEventListener('click', filterPayroll);
if (searchPayrollPeriodInput) searchPayrollPeriodInput.addEventListener('keyup', filterPayroll);


if (openPayrollModalBtn) {
    openPayrollModalBtn.addEventListener('click', () => {
        if (payrollModal) {
            payrollModal.classList.remove('hidden');
            payrollModal.style.display = 'flex';
            console.log('Payroll modal opened.');
        }
    });
}

if (closePayrollModalBtn) {
    closePayrollModalBtn.addEventListener('click', () => {
        if (payrollModal) {
            payrollModal.classList.add('hidden');
            payrollModal.style.display = 'none';
        }
        if (payrollForm) payrollForm.reset();
        console.log('Payroll modal closed.');
    });
}

if (payrollModal) {
    payrollModal.addEventListener('click', (e) => {
        if (e.target === payrollModal) {
            payrollModal.classList.add('hidden');
            payrollModal.style.display = 'none';
            if (payrollForm) payrollForm.reset();
            console.log('Payroll modal closed by outside click.');
        }
    });
}

if (payrollForm) {
    payrollForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

        const periodInput = document.getElementById('payrollPeriod').value;
        const staffCount = document.getElementById('staffCount').value;
        const totalAmount = parseFloat(document.getElementById('totalAmount').value);

        if (!periodInput || !staffCount || isNaN(totalAmount)) {
            alert('Please fill in all fields correctly.');
            console.warn('Payroll form submission failed: Missing or invalid fields.');
            return;
        }

        const [year, monthNum] = periodInput.split('-');
        const date = new Date(year, monthNum - 1);
        const formattedPeriod = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        console.log(`Submitting payroll for ${formattedPeriod}...`);
        try {
            const { data, error } = await supabase.from('payroll').insert([
                {
                    period: formattedPeriod,
                    staff_count: parseInt(staffCount),
                    total_amount: totalAmount,
                    status: 'Processing'
                }
            ]).select();

            if (error) throw error;

            alert('Payroll processing initiated successfully!');
            await addAuditLog(loggedInUser?.email || 'admin', 'Processed Payroll', 'Payroll', `Processed payroll for ${formattedPeriod}, amount: ₹${totalAmount}`);
            await fetchPayrollEntries();
            if (payrollModal) {
                payrollModal.classList.add('hidden');
                payrollModal.style.display = 'none';
            }
            payrollForm.reset();
            console.log('Payroll submitted successfully.');
        } catch (error) {
            alert('Error processing payroll: ' + error.message);
            console.error('Supabase error processing payroll:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Payroll Processing Failed', 'Payroll', `Error: ${error.message}`);
        }
    });
}

// Finance Module Specific JavaScript
function renderFinanceTable(filteredInvoices = invoices) {
    if (!financeTableBody) return;
    financeTableBody.innerHTML = '';
    if (filteredInvoices.length === 0) {
        financeTableBody.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-gray-500">No invoices found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    filteredInvoices.forEach(invoice => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (invoice.status) {
            case 'Paid': statusBgClass = 'bg-blue-100'; statusTextColorClass = 'text-blue-800'; break;
            case 'Pending': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            case 'Overdue': statusBgClass = 'bg-red-100'; statusTextColorClass = 'text-red-800'; break;
            default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
        }

        const studentName = invoice.students ? invoice.students.name : 'N/A';
        const studentClass = invoice.students ? invoice.students.class : 'N/A';
        const fatherName = invoice.students ? invoice.students.father_name : 'N/A';
        const dueAmount = parseFloat(invoice.amount) - parseFloat(invoice.paid_amount || 0);

        newRow.innerHTML = `
            <td class="py-3 px-4">${invoice.invoice_number}</td>
            <td class="py-3 px-4">${studentName}</td>
            <td class="py-3 px-4">${studentClass}</td>
            <td class="py-3 px-4">${fatherName}</td>
            <td class="py-3 px-4">₹${parseFloat(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4">₹${parseFloat(invoice.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4">₹${dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4">${invoice.date}</td>
            <td class="py-3 px-4">${invoice.due_date || 'N/A'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${invoice.status}</span>
            </td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="View Details" onclick="showInvoiceDetailsModal('${invoice.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Download PDF" onclick="alert('Downloading PDF for invoice ${invoice.invoice_number}')">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </td>
        `;
        financeTableBody.prepend(newRow);
    });
    console.log('Finance table rendered.');
}

function filterInvoices() {
    const invoiceNumberQuery = searchInvoiceNumberInput.value.toLowerCase();
    const studentNameQuery = document.getElementById('searchInvoiceStudent').value.toLowerCase();

    const filtered = invoices.filter(invoice => {
        const invoiceMatch = invoice.invoice_number.toLowerCase().includes(invoiceNumberQuery);
        const studentMatch = studentNameQuery === '' || (invoice.students && invoice.students.name.toLowerCase().includes(studentNameQuery));
        return invoiceMatch && studentMatch;
    });
    renderFinanceTable(filtered);
    console.log('Invoices filtered.');
}

if (applyInvoiceSearchButton) applyInvoiceSearchButton.addEventListener('click', filterInvoices);
if (searchInvoiceNumberInput) searchInvoiceNumberInput.addEventListener('keyup', filterInvoices);
if (document.getElementById('searchInvoiceStudent')) document.getElementById('searchInvoiceStudent').addEventListener('keyup', filterInvoices);


if (openAddInvoiceModalBtn) {
    openAddInvoiceModalBtn.addEventListener('click', () => {
        if (addInvoiceModal) {
            addInvoiceModal.classList.remove('hidden');
            addInvoiceModal.style.display = 'flex';
            populateInvoiceStudentSelect();
            console.log('Add Invoice modal opened.');
        }
    });
}

if (closeAddInvoiceModalBtn) {
    closeAddInvoiceModalBtn.addEventListener('click', () => {
        if (addInvoiceModal) {
            addInvoiceModal.classList.add('hidden');
            addInvoiceModal.style.display = 'none';
        }
        if (addInvoiceForm) addInvoiceForm.reset();
        console.log('Add Invoice modal closed.');
    });
}

if (addInvoiceModal) {
    addInvoiceModal.addEventListener('click', (e) => {
        if (e.target === addInvoiceModal) {
            addInvoiceModal.classList.add('hidden');
            addInvoiceModal.style.display = 'none';
            if (addInvoiceForm) addInvoiceForm.reset();
            console.log('Add Invoice modal closed by outside click.');
        }
    });
}

// Function to populate the student select dropdown in the Add Invoice modal
async function populateInvoiceStudentSelect() {
    if (!invoiceStudentSelect) return;

    if (students.length === 0) {
        await fetchStudents(); // Ensure students data is available
    }

    invoiceStudentSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (Class: ${student.class})`;
        invoiceStudentSelect.appendChild(option);
    });
    console.log('Invoice student select populated.');
}


if (addInvoiceForm) {
    addInvoiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

        const studentId = document.getElementById('invoiceStudentId').value;
        const invoiceNumber = document.getElementById('invoiceNumber').value;
        const invoiceTotalAmount = parseFloat(document.getElementById('invoiceTotalAmount').value);
        const invoicePaidAmount = parseFloat(document.getElementById('invoicePaidAmount').value);
        const invoiceIssueDate = document.getElementById('invoiceIssueDate').value;
        const invoiceDueDate = document.getElementById('invoiceDueDate').value;
        const invoiceStatus = document.getElementById('invoiceStatus').value;

        if (!studentId || !invoiceNumber || isNaN(invoiceTotalAmount) || isNaN(invoicePaidAmount) || !invoiceIssueDate || !invoiceDueDate || !invoiceStatus) {
            alert('Please fill in all fields correctly.');
            console.warn('Add Invoice form submission failed: Missing or invalid fields.');
            return;
        }

        console.log(`Submitting invoice ${invoiceNumber}...`);
        try {
            const { data, error } = await supabase.from('finance').insert([
                {
                    student_id: studentId,
                    invoice_number: invoiceNumber,
                    amount: invoiceTotalAmount,
                    paid_amount: invoicePaidAmount,
                    date: invoiceIssueDate,
                    due_date: invoiceDueDate,
                    status: invoiceStatus
                }
            ]).select();

            if (error) throw error;

            alert('Invoice added successfully!');
            await addAuditLog(loggedInUser?.email || 'admin', 'Added Invoice', 'Finance', `Added invoice ${invoiceNumber} for ₹${invoiceTotalAmount}`);
            await fetchInvoices();
            if (addInvoiceModal) {
                addInvoiceModal.classList.add('hidden');
                addInvoiceModal.style.display = 'none';
            }
            addInvoiceForm.reset();
            console.log('Invoice added successfully.');
        } catch (error) {
            alert('Error adding invoice: ' + error.message);
            console.error('Supabase error adding invoice:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Add Invoice Failed', 'Finance', `Error: ${error.message}`);
        }
    });
}

window.showInvoiceDetailsModal = async function(invoiceId) {
    console.log(`Showing details for invoice ID: ${invoiceId}`);
    // Ensure invoices data is up-to-date before searching
    if (invoices.length === 0) {
        await fetchInvoices();
    }

    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        alert('Invoice not found.');
        console.error(`Invoice with ID ${invoiceId} not found in current data.`);
        return;
    }

    // Ensure students data is up-to-date before searching
    if (students.length === 0) {
        await fetchStudents();
    }
    const student = students.find(s => s.id === invoice.student_id);

    if (invoiceContent) {
        document.getElementById('invoiceDetailNumber').textContent = invoice.invoice_number;
        document.getElementById('invoiceDetailDate').textContent = invoice.date;
        document.getElementById('invoiceDetailStatus').textContent = invoice.status;
        document.getElementById('invoiceDetailStatus').className = `font-bold ${invoice.status === 'Paid' ? 'text-blue-800' : invoice.status === 'Pending' ? 'text-yellow-800' : 'text-red-800'}`;
        document.getElementById('invoiceDetailTotalAmount').textContent = `₹${parseFloat(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('invoiceDetailTotalAmountSummary').textContent = `₹${parseFloat(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('invoiceDetailPaidAmount').textContent = `₹${parseFloat(invoice.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('invoiceDetailPaidAmountSummary').textContent = `₹${parseFloat(invoice.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const dueAmount = parseFloat(invoice.amount) - parseFloat(invoice.paid_amount || 0);
        document.getElementById('invoiceDetailDueAmount').textContent = `₹${dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('invoiceDetailDueAmountSummary').textContent = `₹${dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('invoiceDetailDueDate').textContent = invoice.due_date || 'N/A';


        if (student) {
            document.getElementById('invoiceDetailStudentName').textContent = student.name;
            document.getElementById('invoiceDetailStudentClass').textContent = `Class: ${student.class}`;
            document.getElementById('invoiceDetailFatherName').textContent = `Father: ${student.father_name}`;
        } else {
            document.getElementById('invoiceDetailStudentName').textContent = 'N/A';
            document.getElementById('invoiceDetailStudentClass').textContent = '';
            document.getElementById('invoiceDetailFatherName').textContent = '';
        }
    }

    if (invoiceDetailsModal) {
        invoiceDetailsModal.classList.remove('hidden');
        invoiceDetailsModal.style.display = 'flex';
        console.log('Invoice details modal opened.');
    }
};

if (closeInvoiceDetailsModal) {
    closeInvoiceDetailsModal.addEventListener('click', () => {
        invoiceDetailsModal.classList.add('hidden');
        invoiceDetailsModal.style.display = 'none';
        console.log('Invoice details modal closed.');
    });
}

if (invoiceDetailsModal) {
    invoiceDetailsModal.addEventListener('click', (e) => {
        if (e.target === invoiceDetailsModal) {
            invoiceDetailsModal.classList.add('hidden');
            invoiceDetailsModal.style.display = 'none';
            console.log('Invoice details modal closed by outside click.');
        }
    });
}

window.printInvoice = function() {
    console.log('Printing invoice...');
    const printContents = document.getElementById('invoiceDetailsModal').querySelector('.print-area').innerHTML;
    const originalContents = document.body.innerHTML;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Invoice</title>');
    // Copy styles from the main document
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        printWindow.document.write(`<link rel="stylesheet" href="${link.href}">`);
    });
    printWindow.document.write('<style>.print-hide { display: none !important; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    console.log('Invoice print initiated.');
}


async function updateLoggedInUserName() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser && loggedInUserName) {
        loggedInUserName.textContent = loggedInUser.user_metadata?.name || loggedInUser.email; // Corrected to user_metadata
        console.log(`Logged in user name updated to: ${loggedInUserName.textContent}`);
    }
}


// Student Search and Render Functionality
function renderStudentTable(filteredStudents = students) {
    if (!studentTableBody) return;
    studentTableBody.innerHTML = '';
    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = '<tr><td colspan="15" class="text-center py-4 text-gray-500">No students found matching your criteria.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    filteredStudents.forEach(student => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (student.status) {
            case 'Active': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Inactive': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
        }
        newRow.innerHTML = `
            <td class="py-3 px-4">${student.id}</td>
            <td class="py-3 px-4">${student.name}</td>
            <td class="py-3 px-4">${student.father_name}</td>
            <td class="py-3 px-4">${student.mother_name}</td>
            <td class="py-3 px-4">${student.class}</td>
            <td class="py-3 px-4">${student.roll_no}</td>
            <td class="py-3 px-4">${student.aadhar_no}</td>
            <td class="py-3 px-4">${student.blood_group || 'N/A'}</td>
            <td class="py-3 px-4">${student.admission_no || 'N/A'}</td>
            <td class="py-3 px-4">${student.admission_date || 'N/A'}</td>
            <td class="py-3 px-4">${student.father_aadhar || 'N/A'}</td>
            <td class="py-3 px-4">${student.mother_aadhar || 'N/A'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${student.status}</span>
            </td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Student" onclick="editStudent('${student.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 mr-3" title="Delete Student" onclick="deleteStudent('${student.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="text-purple-600 mr-3" title="Show QR Code" onclick="showStudentQrCodeModal('${student.id}')">
                    <i class="fas fa-qrcode"></i>
                </button>
                <button class="text-green-600" title="View Details" onclick="showStudentDetailsModal('${student.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        studentTableBody.appendChild(newRow);
    });
    console.log('Student table rendered.');
}

function filterStudents() {
    const nameQuery = searchStudentNameInput.value.toLowerCase();
    const rollQuery = searchRollInput.value.toLowerCase();
    const classQuery = searchClassSelect.value.toLowerCase();

    const filtered = students.filter(student => {
        const nameMatch = student.name.toLowerCase().includes(nameQuery);
        const rollMatch = student.roll_no.toLowerCase().includes(rollQuery);
        const classMatch = classQuery === '' || student.class.toLowerCase() === classQuery;
        return nameMatch && rollMatch && classMatch;
    });
    renderStudentTable(filtered);
    console.log('Students filtered.');
}

if (applyStudentSearchButton) applyStudentSearchButton.addEventListener('click', filterStudents);
if (searchStudentNameInput) searchStudentNameInput.addEventListener('keyup', filterStudents);
if (searchRollInput) searchRollInput.addEventListener('keyup', filterStudents);
if (searchClassSelect) searchClassSelect.addEventListener('change', filterStudents);

// Teacher Render Functionality
function renderTeacherTable(filteredTeachers = teachers) {
    if (!teacherTableBody) return;
    teacherTableBody.innerHTML = '';
    if (filteredTeachers.length === 0) {
        teacherTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No teachers found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    filteredTeachers.forEach(teacher => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${teacher.id}</td>
            <td class="py-3 px-4">${teacher.name}</td>
            <td class="py-3 px-4">${teacher.subject}</td>
            <td class="py-3 px-4">${teacher.classes}</td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Teacher" onclick="editTeacher('${teacher.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 mr-3" title="Delete Teacher" onclick="deleteTeacher('${teacher.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="text-purple-600 mr-3" title="Show QR Code" onclick="showTeacherQrCodeModal('${teacher.id}')">
                    <i class="fas fa-qrcode"></i>
                </button>
                <button class="text-green-600" title="View Details" onclick="showTeacherDetailsModal('${teacher.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        teacherTableBody.appendChild(newRow);
    });
    console.log('Teacher table rendered.');
}

function filterTeachers() {
    const nameQuery = searchTeacherNameInput.value.toLowerCase();
    const subjectQuery = searchTeacherSubjectSelect.value.toLowerCase();

    const filtered = teachers.filter(teacher => {
        const nameMatch = teacher.name.toLowerCase().includes(nameQuery);
        const subjectMatch = subjectQuery === '' || teacher.subject.toLowerCase() === subjectQuery;
        return nameMatch && subjectMatch;
    });
    renderTeacherTable(filtered);
    console.log('Teachers filtered.');
}

if (applyTeacherSearchButton) applyTeacherSearchButton.addEventListener('click', filterTeachers);
if (searchTeacherNameInput) searchTeacherNameInput.addEventListener('keyup', filterTeachers);
if (searchTeacherSubjectSelect) searchTeacherSubjectSelect.addEventListener('change', filterTeachers);


// User Render Functionality (Now uses profiles data)
function renderUserTable() {
    if (!userTableBody) return;
    userTableBody.innerHTML = '';
    if (profiles.length === 0) {
        userTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No user profiles found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const currentUserRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    profiles.forEach(profile => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${profile.id}</td>
            <td class="py-3 px-4">${profile.full_name || 'N/A'}</td>
            <td class="py-3 px-4">${profile.email || 'N/A'}</td>
            <td class="py-3 px-4">${profile.role || 'N/A'}</td>
            <td class="py-3 px-4">${profile.status || 'N/A'}</td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit User" onclick="editUser('${profile.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600" title="Delete User" onclick="deleteUser('${profile.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        userTableBody.appendChild(newRow);
    });
    console.log('User table rendered.');
}

// Announcement Render Functionality
function renderAnnouncementTable() {
    if (!announcementTableBody) return;
    announcementTableBody.innerHTML = '';
    if (announcements.length === 0) {
        announcementTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No announcements found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    announcements.forEach(announcement => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (announcement.status) {
            case 'Active': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Archived': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
        }
        newRow.innerHTML = `
            <td class="py-3 px-4">${announcement.title}</td>
            <td class="py-3 px-4">${announcement.content.substring(0, 50)}${announcement.content.length > 50 ? '...' : ''}</td>
            <td class="py-3 px-4">${announcement.date_posted}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${announcement.status}</span>
            </td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Announcement" onclick="editAnnouncement('${announcement.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600" title="Delete Announcement" onclick="deleteAnnouncement('${announcement.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        announcementTableBody.appendChild(newRow);
    });
    console.log('Announcement table rendered.');
}

// Audit Log Render Functionality
function renderAuditLogs() {
    if (!auditLogTableBody) return;
    auditLogTableBody.innerHTML = '';
    if (auditLogs.length === 0) {
        auditLogTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No audit logs found.</td></tr>';
        return;
    }
    auditLogs.forEach(log => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${new Date(log.timestamp).toLocaleString()}</td>
            <td class="py-3 px-4">${log.user_email}</td>
            <td class="py-3 px-4">${log.action}</td>
            <td class="py-3 px-4">${log.module}</td>
            <td class="py-3 px-4">${log.details}</td>
        `;
        auditLogTableBody.appendChild(newRow);
    });
    console.log('Audit logs rendered.');
}

// Backup Render Functionality
function renderBackupTable() {
    if (!backupTableBody) return;
    backupTableBody.innerHTML = '';
    if (backups.length === 0) {
        backupTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No backups found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    backups.forEach(backup => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${backup.backup_id}</td>
            <td class="py-3 px-4">${new Date(backup.date).toLocaleString()}</td>
            <td class="py-3 px-4">${backup.size}</td>
            <td class="py-3 px-4">${backup.type}</td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Download Backup" onclick="alert('Downloading backup ${backup.backup_id}...')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="text-green-600 mr-3" title="Restore from this Backup" onclick="alert('Restoring from backup ${backup.backup_id}...')">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="text-red-600" title="Delete Backup" onclick="alert('Deleting backup ${backup.backup_id}...')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        backupTableBody.appendChild(newRow);
    });
    console.log('Backup table rendered.');
}

// Student Attendance Module Functions
function renderAttendanceTable(filteredAttendance = attendanceRecords) {
    if (!attendanceTableBody) return;
    attendanceTableBody.innerHTML = '';

    let totalPresent = 0;
    let totalAbsent = 0;
    let uniqueStudentsPresent = new Set(); // Track unique students present
    let uniqueStudentsAbsent = new Set(); // Track unique students absent
    let uniqueStudentsTotal = new Set(); // Track all unique students in records

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    if (filteredAttendance.length === 0) {
        attendanceTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No attendance records found for the selected criteria.</td></tr>';
    } else {
        filteredAttendance.forEach(record => {
            // Access student details directly from the joined 'students' object
            const student = record.students;
            if (!student) {
                console.warn(`Student data not found for attendance record ID: ${record.id}. Skipping row.`);
                return; // Skip if student data is not found (e.g., if the student was deleted)
            }

            uniqueStudentsTotal.add(student.id); // Add student to total unique count

            if (record.status === 'Present') {
                uniqueStudentsPresent.add(student.id); // Count unique present students
            } else if (record.status === 'Absent') {
                uniqueStudentsAbsent.add(student.id); // Count unique absent students
            }

            const newRow = document.createElement('tr');
            newRow.className = 'border-b hover:bg-gray-50';
            let statusBgClass = '';
            let statusTextColorClass = '';
            switch (record.status) {
                case 'Present': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
                case 'Absent': statusBgClass = 'bg-red-100'; statusTextColorClass = 'text-red-800'; break;
                case 'Leave': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
                default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
            }
            newRow.innerHTML = `
                <td class="py-3 px-4">${student.name}</td>
                <td class="py-3 px-4">${student.roll_no}</td>
                <td class="py-3 px-4">${student.class}</td>
                <td class="py-3 px-4">${record.date}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${record.status}</span>
                </td>
                <td class="py-3 px-4">${record.remarks || '-'}</td>
                <td class="py-3 px-4 table-actions">
                    <button class="text-blue-600 mr-3" title="Edit Attendance" onclick="editAttendance('${record.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600" title="Delete Attendance" onclick="deleteAttendance('${record.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            attendanceTableBody.appendChild(newRow);
        });
    }

    // Update the summary counts based on unique students
    if (attendanceTotalStudents) attendanceTotalStudents.textContent = uniqueStudentsTotal.size;
    if (attendanceTotalPresent) attendanceTotalPresent.textContent = uniqueStudentsPresent.size;
    if (attendanceTotalAbsent) attendanceTotalAbsent.textContent = uniqueStudentsAbsent.size;
    console.log('Student attendance table rendered.');
}

function filterAttendance() {
    const classFilter = attendanceClassFilter.value.toLowerCase();
    const dateFilter = attendanceDateFilter.value;
    const studentNameFilter = attendanceStudentNameFilter.value.toLowerCase();

    const filtered = attendanceRecords.filter(record => {
        // Access student details directly from the joined 'students' object
        const student = record.students;
        if (!student) return false; // Skip if student data is missing

        const classMatch = classFilter === '' || student.class.toLowerCase() === classFilter;
        const dateMatch = dateFilter === '' || record.date === dateFilter;
        const nameMatch = studentNameFilter === '' || student.name.toLowerCase().includes(studentNameFilter);

        return classMatch && dateMatch && nameMatch;
    });
    renderAttendanceTable(filtered);
    console.log('Student attendance filtered.');
}

if (applyAttendanceFilter) applyAttendanceFilter.addEventListener('click', filterAttendance);
if (attendanceClassFilter) attendanceClassFilter.addEventListener('change', filterAttendance);
if (attendanceDateFilter) attendanceDateFilter.addEventListener('change', filterAttendance);
if (attendanceStudentNameFilter) attendanceStudentNameFilter.addEventListener('keyup', filterAttendance);

// Class-wise Attendance Functions
if (loadClassStudentsBtn) {
    loadClassStudentsBtn.addEventListener('click', async () => {
        const selectedClass = classAttendanceSelect.value;
        const selectedDate = classAttendanceDate.value;

        if (!selectedClass || !selectedDate) {
            alert('Please select both a class and a date.');
            console.warn('Load Class Students failed: Missing class or date.');
            return;
        }
        console.log(`Loading students for class ${selectedClass} on ${selectedDate}...`);

        const studentsInClass = students.filter(s => s.class === selectedClass);
        const classAttendanceBody = document.getElementById('classAttendanceTableBody');
        classAttendanceBody.innerHTML = '';

        if (studentsInClass.length === 0) {
            classAttendanceBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No students found in this class.</td></tr>';
            console.log(`No students found in class ${selectedClass}.`);
            return;
        }

        for (const student of studentsInClass) {
            // Fetch the specific record for this student and date
            const { data: existingRecords, error: fetchError } = await supabase
                .from('attendance')
                .select('*')
                .eq('student_id', student.id)
                .eq('date', selectedDate);

            if (fetchError) {
                console.error('Error fetching existing attendance record for class-wise attendance:', fetchError);
                // Fallback to default if there's an error fetching
            }

            const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;
            const status = existingRecord ? existingRecord.status : 'Absent'; // Default to Absent if no record
            const remarks = existingRecord ? existingRecord.remarks : '';

            const newRow = document.createElement('tr');
            newRow.className = 'border-b hover:bg-gray-50';
            newRow.innerHTML = `
                <td class="py-3 px-4">${student.name}</td>
                <td class="py-3 px-4">${student.roll_no}</td>
                <td class="py-3 px-4">
                    <select class="p-2 border border-gray-300 rounded-lg status-select" data-student-id="${student.id}">
                        <option value="Present" ${status === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="Absent" ${status === 'Absent' ? 'selected' : ''}>Absent</option>
                        <option value="Leave" ${status === 'Leave' ? 'selected' : ''}>Leave</option>
                    </select>
                </td>
                <td class="py-3 px-4">
                    <input type="text" class="w-full p-2 border border-gray-300 rounded-lg remarks-input" value="${remarks}" placeholder="Remarks">
                </td>
                <td class="py-3 px-4">
                    <button class="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 save-attendance-btn" data-student-id="${student.id}">Save</button>
                </td>
            `;
            classAttendanceBody.appendChild(newRow);
        }

        // Add event listeners for individual save buttons
        document.querySelectorAll('.save-attendance-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const studentId = event.target.dataset.studentId;
                const row = event.target.closest('tr');
                const status = row.querySelector('.status-select').value;
                const remarks = row.querySelector('.remarks-input').value;
                await markIndividualAttendance(studentId, selectedDate, status, remarks);
            });
        });
        console.log(`Students for class ${selectedClass} loaded into class attendance table.`);
    });
}

if (markClassAttendanceBtn) {
    markClassAttendanceBtn.addEventListener('click', async () => {
        const selectedClass = classAttendanceSelect.value;
        const selectedDate = classAttendanceDate.value;

        if (!selectedClass || !selectedDate) {
            alert('Please select both a class and a date.');
            console.warn('Mark Class Attendance failed: Missing class or date.');
            return;
        }

        if (!confirm(`Are you sure you want to mark all students in ${selectedClass} as PRESENT for ${selectedDate}?`)) {
            return;
        }
        console.log(`Marking all students in ${selectedClass} as PRESENT for ${selectedDate}...`);

        const studentsInClass = students.filter(s => s.class === selectedClass);
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'System';

        for (const student of studentsInClass) {
            const attendanceData = {
                student_id: student.id,
                date: selectedDate,
                status: 'Present',
                remarks: 'Marked Present (Class-wise)'
            };

            try {
                await supabase.from('attendance').upsert(
                    { ...attendanceData },
                    { onConflict: ['student_id', 'date'] } // Conflict on student_id and date to update existing
                );
                await addAuditLog(userEmail, 'Marked Class Attendance', 'Attendance', `Marked Present for ${student.name} (Class: ${selectedClass}) on ${selectedDate}`);
            } catch (error) {
                console.error(`Error marking attendance for ${student.name}:`, error);
                await addAuditLog(userEmail, 'Class Attendance Failed', 'Attendance', `Failed to mark attendance for ${student.name} (Class: ${selectedClass}) on ${selectedDate}: ${error.message}`);
            }
        }
        alert(`All students in ${selectedClass} marked as Present for ${selectedDate}.`);
        await fetchAttendanceRecords(); // Refresh the main attendance table and summary counts
        loadClassStudentsBtn.click(); // Reload the class-wise table to show updated statuses
        console.log('Class attendance marked successfully.');
    });
}

async function markIndividualAttendance(studentId, date, status, remarks) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'System';
    const student = students.find(s => s.id === studentId);
    console.log(`Marking individual attendance for ${student ? student.name : studentId} as ${status} on ${date}...`);

    const attendanceData = {
        student_id: studentId,
        date: date,
        status: status,
        remarks: remarks
    };

    try {
        await supabase.from('attendance').upsert(
            { ...attendanceData },
            { onConflict: ['student_id', 'date'] } // Conflict on student_id and date to update existing
        );
        alert(`Attendance for ${student ? student.name : 'student'} updated to ${status} for ${date}.`);
        await addAuditLog(userEmail, 'Marked Individual Attendance', 'Attendance', `Marked ${status} for ${student ? student.name : studentId} on ${date}`);
        await fetchAttendanceRecords(); // Refresh the main attendance table and summary counts
        console.log(`Individual attendance for ${student ? student.name : studentId} updated successfully.`);
    } catch (error) {
        console.error(`Error marking attendance for ${student ? student.name : studentId}:`, error);
        alert(`Error marking attendance for ${student ? student.name : studentId}: ${error.message}`);
        await addAuditLog(userEmail, 'Individual Attendance Failed', 'Attendance', `Failed to mark attendance for ${student ? student.name : studentId} on ${date}: ${error.message}`);
    }
}


// Teacher Attendance Module Functions
function renderTeacherAttendanceTable(filteredRecords = teacherAttendanceRecords) {
    // FIX: Use the new, distinct ID for teacher attendance table body
    if (!teacherAttendanceRecordsTableBody) return;
    teacherAttendanceRecordsTableBody.innerHTML = '';

    let totalPresent = 0;
    let totalAbsent = 0;
    let uniqueTeachersPresent = new Set(); // Track unique teachers present
    let uniqueTeachersAbsent = new Set(); // Track unique teachers absent
    let uniqueTeachersTotal = new Set(); // Track all unique teachers in records

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    if (filteredRecords.length === 0) {
        teacherAttendanceRecordsTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No teacher attendance records found for the selected criteria.</td></tr>';
    } else {
        filteredRecords.forEach(record => {
            // Access teacher details directly from the joined 'teachers' object
            const teacher = record.teachers;
            if (!teacher) {
                console.warn(`Teacher data not found for teacher attendance record ID: ${record.id}. Skipping row.`);
                return; // Skip if teacher data is not found
            }

            uniqueTeachersTotal.add(teacher.id); // Add teacher to total unique count

            if (record.status === 'Present') {
                uniqueTeachersPresent.add(teacher.id); // Count unique present teachers
            } else if (record.status === 'Absent') {
                uniqueTeachersAbsent.add(teacher.id); // Count unique absent teachers
            }

            const newRow = document.createElement('tr');
            newRow.className = 'border-b hover:bg-gray-50';
            let statusBgClass = '';
            let statusTextColorClass = '';
            switch (record.status) {
                case 'Present': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
                case 'Absent': statusBgClass = 'bg-red-100'; statusTextColorClass = 'text-red-800'; break;
                case 'Leave': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
                default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
            }
            newRow.innerHTML = `
                <td class="py-3 px-4">${teacher.name}</td>
                <td class="py-3 px-4">${teacher.subject}</td>
                <td class="py-3 px-4">${record.date}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${record.status}</span>
                </td>
                <td class="py-3 px-4">${record.remarks || '-'}</td>
                <td class="py-3 px-4 table-actions">
                    <button class="text-blue-600 mr-3" title="Edit Attendance" onclick="editTeacherAttendance('${record.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600" title="Delete Attendance" onclick="deleteTeacherAttendance('${record.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="text-green-600" title="View Teacher Details" onclick="showTeacherDetailsModal('${teacher.id}')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            `;
            teacherAttendanceRecordsTableBody.appendChild(newRow);
        });
    }

    // Update the summary counts based on unique teachers
    if (teacherAttendanceTotalTeachers) teacherAttendanceTotalTeachers.textContent = uniqueTeachersTotal.size;
    if (teacherAttendanceTotalPresent) teacherAttendanceTotalPresent.textContent = uniqueTeachersPresent.size;
    if (teacherAttendanceTotalAbsent) teacherAttendanceTotalAbsent.textContent = uniqueTeachersAbsent.size;
    console.log('Teacher attendance table rendered.');
}

function filterTeacherAttendance() {
    const subjectFilter = teacherAttendanceSubjectFilter.value.toLowerCase();
    const dateFilter = teacherAttendanceDateFilter.value;
    const nameFilter = teacherAttendanceNameFilter.value.toLowerCase();

    const filtered = teacherAttendanceRecords.filter(record => {
        // Access teacher details directly from the joined 'teachers' object
        const teacher = record.teachers;
        if (!teacher) return false; // Skip if teacher data is missing

        const subjectMatch = subjectFilter === '' || teacher.subject.toLowerCase() === subjectFilter;
        const dateMatch = dateFilter === '' || record.date === dateFilter;
        const nameMatch = nameFilter === '' || teacher.name.toLowerCase().includes(nameFilter);

        return subjectMatch && dateMatch && nameMatch;
    });
    renderTeacherAttendanceTable(filtered);
    console.log('Teacher attendance filtered.');
}

if (applyTeacherAttendanceFilter) applyTeacherAttendanceFilter.addEventListener('click', filterTeacherAttendance);
if (teacherAttendanceSubjectFilter) teacherAttendanceSubjectFilter.addEventListener('change', filterTeacherAttendance);
if (teacherAttendanceDateFilter) teacherAttendanceDateFilter.addEventListener('change', filterTeacherAttendance);
if (teacherAttendanceNameFilter) teacherAttendanceNameFilter.addEventListener('keyup', filterTeacherAttendance);

window.showAddTeacherAttendanceModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    teacherAttendanceModalTitle.textContent = 'Mark Teacher Attendance';
    teacherAttendanceFormSubmitBtn.textContent = 'Mark Attendance';
    document.getElementById('teacherAttendanceId').value = '';
    teacherAttendanceForm.reset();
    populateTeacherSelect();
    document.getElementById('teacherAttendanceDate').valueAsDate = new Date();
    if (teacherAttendanceModal) {
        teacherAttendanceModal.classList.remove('hidden');
        teacherAttendanceModal.style.display = 'flex';
        console.log('Add Teacher Attendance modal opened.');
    }
}

window.editTeacherAttendance = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    const record = teacherAttendanceRecords.find(r => r.id === id);
    if (record) {
        teacherAttendanceModalTitle.textContent = 'Edit Teacher Attendance';
        teacherAttendanceFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('teacherAttendanceId').value = record.id;
        populateTeacherSelect(record.teacher_id);
        document.getElementById('teacherAttendanceDate').value = record.date;
        document.getElementById('teacherAttendanceStatus').value = record.status;
        document.getElementById('teacherAttendanceRemarks').value = record.remarks;
        if (teacherAttendanceModal) {
            teacherAttendanceModal.classList.remove('hidden');
            teacherAttendanceModal.style.display = 'flex';
            console.log(`Edit Teacher Attendance modal opened for ID: ${id}`);
        }
    }
}

window.deleteTeacherAttendance = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    if (confirm('Are you sure you want to delete this teacher attendance record?')) {
        console.log(`Deleting teacher attendance record ID: ${id}`);
        try {
            const { error } = await supabase.from('teacher_attendance').delete().eq('id', id);
            if (error) throw error;

            const deletedRecord = teacherAttendanceRecords.find(r => r.id === id);
            const teacher = deletedRecord.teachers; // Access teacher details from the joined object
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Teacher Attendance', 'Teacher Attendance', `Deleted attendance for ${teacher ? teacher.name : 'Unknown Teacher'} on ${deletedRecord.date}`);
            alert('Teacher attendance record deleted successfully!');
            await fetchTeacherAttendanceRecords();
            console.log(`Teacher attendance record ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting teacher attendance record: ' + error.message);
            console.error('Supabase error deleting teacher attendance record:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Teacher Attendance Failed', 'Teacher Attendance', `Error: ${error.message}`);
        }
    }
}

function populateTeacherSelect(selectedTeacherId = '') {
    if (!teacherAttendanceTeacherSelect) return;
    teacherAttendanceTeacherSelect.innerHTML = '<option value="">Select Teacher</option>';
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = `${teacher.name} (Subject: ${teacher.subject})`;
        if (teacher.id === selectedTeacherId) {
            option.selected = true;
        }
        teacherAttendanceTeacherSelect.appendChild(option);
    });
    console.log('Teacher select populated.');
}

// Update Dashboard Stats
function updateDashboardStats() {
    if (totalStudentsCount) totalStudentsCount.textContent = students.length.toLocaleString();
    if (totalTeachersCount) totalTeachersCount.textContent = teachers.length.toLocaleString();

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthRevenue = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return inv.status === 'Paid' && invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    }).reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    if (monthlyRevenue) monthlyRevenue.textContent = `₹${currentMonthRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Calculate students present today
    const today = new Date().toISOString().split('T')[0];
    // Use unique students for today's count
    const studentsPresentTodayCount = new Set(attendanceRecords.filter(record => record.date === today && record.status === 'Present').map(rec => rec.student_id)).size;
    if (studentsPresentToday) {
        studentsPresentToday.textContent = studentsPresentTodayCount.toLocaleString();
    }

    // Calculate teachers present today
    // Use unique teachers for today's count
    const teachersPresentTodayCount = new Set(teacherAttendanceRecords.filter(record => record.date === today && record.status === 'Present').map(rec => rec.teacher_id)).size;
    if (teachersPresentToday) {
        teachersPresentToday.textContent = teachersPresentTodayCount.toLocaleString();
    }


    if (upcomingEventsCount && calendar) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const upcomingEvents = calendar.getEvents().filter(event => {
            if (event.classNames.includes('holiday')) {
                return new Date(event.start) >= today;
            }
            return event.end ? new Date(event.end) >= today : new Date(event.start) >= today;
        });
        upcomingEventsCount.textContent = upcomingEvents.length.toLocaleString();
    } else if (upcomingEventsCount) {
        upcomingEventsCount.textContent = 'N/A';
    }
    console.log('Dashboard stats updated.');
    initCharts(); // Ensure charts are updated with new data
}

// Render Recent Activity
function renderRecentActivity() {
    if (!recentActivityList) return;
    recentActivityList.innerHTML = '';
    auditLogs.slice(0, 3).forEach(log => {
        const div = document.createElement('div');
        div.className = 'flex items-start space-x-3 animate-slideInFromLeft';
        let iconClass = 'fas fa-info-circle';
        let iconBgClass = 'bg-gray-50';
        let iconTextColorClass = 'text-gray-600';

        if (log.action.includes('Added Student')) { iconClass = 'fas fa-user-plus'; iconBgClass = 'bg-blue-50'; iconTextColorClass = 'text-blue-600'; }
        else if (log.action.includes('Processed Payroll')) { iconClass = 'fas fa-money-bill-wave'; iconBgClass = 'bg-green-50'; iconTextColorClass = 'text-green-600'; }
        else if (log.action.includes('Added Invoice')) { iconClass = 'fas fa-file-invoice-dollar'; iconBgClass = 'bg-purple-50'; iconTextColorClass = 'text-purple-600'; }
        else if (log.action.includes('Logged In')) { iconClass = 'fas fa-sign-in-alt'; iconBgClass = 'bg-indigo-50'; iconTextColorClass = 'text-indigo-600'; }
        else if (log.action.includes('Notification')) { iconClass = 'fas fa-bell'; iconBgClass = 'bg-orange-50'; iconTextColorClass = 'text-orange-600'; }
        else if (log.action.includes('Added Teacher')) { iconClass = 'fas fa-chalkboard-teacher'; iconBgClass = 'bg-green-50'; iconTextColorClass = 'text-green-600'; }
        else if (log.action.includes('Added User')) { iconClass = 'fas fa-user-plus'; iconBgClass = 'bg-red-50'; iconTextColorClass = 'text-red-600'; }
        else if (log.action.includes('Published Announcement')) { iconClass = 'fas fa-bullhorn'; iconBgClass = 'bg-pink-50'; iconTextColorClass = 'text-pink-600'; }
        else if (log.action.includes('Marked Attendance') || log.action.includes('Updated Attendance')) { iconClass = 'fas fa-check-circle'; iconBgClass = 'bg-indigo-50'; iconTextColorClass = 'text-indigo-600'; }

        div.innerHTML = `
            <div class="icon-wrapper ${iconBgClass} ${iconTextColorClass}">
                <i class="${iconClass}"></i>
            </div>
            <div>
                <p class="font-medium">${log.action}</p>
                <p class="text-sm text-gray-500">${log.details}</p>
                <p class="text-xs text-gray-400">${new Date(log.timestamp).toLocaleString()}</p>
            </div>
        `;
        recentActivityList.appendChild(div);
    });
    console.log('Recent activity list rendered.');
}

// Modals for Add/Edit Student, Teacher, User, Announcement, Attendance
window.showAddStudentForm = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    studentModalTitle.textContent = 'Add New Student';
    studentFormSubmitBtn.textContent = 'Add Student';
    document.getElementById('studentId').value = '';
    studentForm.reset();
    if (studentModal) {
        studentModal.classList.remove('hidden');
        studentModal.style.display = 'flex';
        console.log('Add Student form opened.');
    }
}
window.editStudent = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    const student = students.find(s => s.id === id);
    if (student) {
        studentModalTitle.textContent = 'Edit Student';
        studentFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('studentId').value = student.id;
        document.getElementById('studentFullName').value = student.name;
        document.getElementById('studentFatherName').value = student.father_name;
        document.getElementById('studentMotherName').value = student.mother_name;
        document.getElementById('studentClass').value = student.class;
        document.getElementById('studentRollNo').value = student.roll_no;
        document.getElementById('studentAadharNo').value = student.aadhar_no;
        document.getElementById('studentBloodGroup').value = student.blood_group || '';
        document.getElementById('studentAdmissionNo').value = student.admission_no || '';
        document.getElementById('studentAdmissionDate').value = student.admission_date || '';
        document.getElementById('studentFatherAadhar').value = student.father_aadhar || '';
        document.getElementById('studentMotherAadhar').value = student.mother_aadhar || '';
        document.getElementById('studentEmail').value = student.email;
        document.getElementById('studentPhone').value = student.phone;
        document.getElementById('studentStatus').value = student.status;
        if (studentModal) {
            studentModal.classList.remove('hidden');
            studentModal.style.display = 'flex';
            console.log(`Edit Student form opened for ID: ${id}`);
        }
    }
}
window.deleteStudent = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    if (confirm('Are you sure you want to delete this student?')) {
        console.log(`Deleting student ID: ${id}`);
        try {
            const { error } = await supabase.from('students').delete().eq('id', id);
            if (error) throw error;

            const deletedStudent = students.find(s => s.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Student', 'Students', `Deleted student: ${deletedStudent.name} (ID: ${deletedStudent.id})`);
            alert('Student deleted successfully!');
            await fetchStudents();
            console.log(`Student ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting student: ' + error.message);
            console.error('Supabase error deleting student:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Student Failed', 'Students', `Error: ${error.message}`);
        }
    }
}

window.showStudentDetailsModal = function(id) {
    const student = students.find(s => s.id === id);
    if (student) {
        studentDetailsModalTitle.textContent = `Details for ${student.name}`;
        studentDetailsContent.innerHTML = `
            <p><strong>ID:</strong> ${student.id}</p>
            <p><strong>Full Name:</strong> ${student.name}</p>
            <p><strong>Father's Name:</strong> ${student.father_name}</p>
            <p><strong>Mother's Name:</strong> ${student.mother_name}</p>
            <p><strong>Class:</strong> ${student.class}</p>
            <p><strong>Roll No.:</strong> ${student.roll_no}</p>
            <p><strong>Aadhar No.:</strong> ${student.aadhar_no}</p>
            <p><strong>Blood Group:</strong> ${student.blood_group || 'N/A'}</p>
            <p><strong>Admission No.:</strong> ${student.admission_no || 'N/A'}</p>
            <p><strong>Admission Date:</strong> ${student.admission_date || 'N/A'}</p>
            <p><strong>Father's Aadhar:</strong> ${student.father_aadhar || 'N/A'}</p>
            <p><strong>Mother's Aadhar:</strong> ${student.mother_aadhar || 'N/A'}</p>
            <p><strong>Email:</strong> ${student.email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${student.phone || 'N/A'}</p>
            <p><strong>Status:</strong> ${student.status}</p>
        `;
        studentDetailsModal.classList.remove('hidden');
        studentDetailsModal.style.display = 'flex';
        console.log(`Student details modal opened for ID: ${id}`);
    } else {
        alert('Student not found.');
        console.warn(`Student with ID ${id} not found for details.`);
    }
}

window.showAddTeacherForm = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    teacherModalTitle.textContent = 'Add New Teacher';
    teacherFormSubmitBtn.textContent = 'Add Teacher';
    document.getElementById('teacherId').value = '';
    teacherForm.reset();
    if (teacherModal) {
        teacherModal.classList.remove('hidden');
        teacherModal.style.display = 'flex';
        console.log('Add Teacher form opened.');
    }
}
window.editTeacher = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    const teacher = teachers.find(t => t.id === id);
    if (teacher) {
        teacherModalTitle.textContent = 'Edit Teacher';
        teacherFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('teacherId').value = teacher.id;
        document.getElementById('teacherFullName').value = teacher.name;
        document.getElementById('teacherSubject').value = teacher.subject;
        document.getElementById('teacherEmail').value = teacher.email;
        document.getElementById('teacherClasses').value = teacher.classes;
        if (teacherModal) {
            teacherModal.classList.remove('hidden');
            teacherModal.style.display = 'flex';
            console.log(`Edit Teacher form opened for ID: ${id}`);
        }
    }
}
window.deleteTeacher = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    if (confirm('Are you sure you want to delete this teacher?')) {
        console.log(`Deleting teacher ID: ${id}`);
        try {
            const { error } = await supabase.from('teachers').delete().eq('id', id);
            if (error) throw error;

            const deletedTeacher = teachers.find(t => t.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Teacher', 'Teachers', `Deleted teacher: ${deletedTeacher.name} (ID: ${deletedTeacher.id})`);
            alert('Teacher deleted successfully!');
            await fetchTeachers();
            console.log(`Teacher ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting teacher: ' + error.message);
            console.error('Supabase error deleting teacher:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Teacher Failed', 'Teachers', `Error: ${error.message}`);
        }
    }
}

// FIX: Ensure this function is correctly linked to the global 'teachers' array
// and that the modal is correctly displayed.
window.showTeacherDetailsModal = function(id) {
    const teacher = teachers.find(t => t.id === id);
    if (teacher) {
        teacherDetailsModalTitle.textContent = `Details for ${teacher.name}`;
        teacherDetailsContent.innerHTML = `
            <p><strong>ID:</strong> ${teacher.id}</p>
            <p><strong>Full Name:</strong> ${teacher.name}</p>
            <p><strong>Subject:</strong> ${teacher.subject}</p>
            <p><strong>Email:</strong> ${teacher.email || 'N/A'}</p>
            <p><strong>Classes:</strong> ${teacher.classes || 'N/A'}</p>
        `;
        teacherDetailsModal.classList.remove('hidden');
        teacherDetailsModal.style.display = 'flex';
        console.log(`Teacher details modal opened for ID: ${id}`);
    } else {
        alert('Teacher not found.');
        console.warn(`Teacher with ID ${id} not found for details.`);
    }
}

window.showAddUserForm = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    userModalTitle.textContent = 'Add New User';
    userFormSubmitBtn.textContent = 'Add User';
    document.getElementById('userId').value = '';
    document.getElementById('userPassword').required = true;
    userForm.reset(); // Reset form fields
    if (userModal) {
        userModal.classList.remove('hidden');
        userModal.style.display = 'flex';
        console.log('Add User form opened.');
    }
}
window.editUser = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    userModalTitle.textContent = 'Edit User';
    userFormSubmitBtn.textContent = 'Save Changes';
    document.getElementById('userId').value = id;
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = false;

    const profile = profiles.find(p => p.id === id);
    if (profile) {
        document.getElementById('userFullName').value = profile.full_name || '';
        document.getElementById('userEmail').value = profile.email || '';
        document.getElementById('userRole').value = profile.role || '';
        document.getElementById('userStatus').value = profile.status || '';
        console.log(`Edit User form opened for ID: ${id} (profile found).`);
    } else {
        // Fallback to loggedInUser if profile not found (e.g., editing self before profiles are fully loaded)
        if (loggedInUser.id === id) {
            document.getElementById('userFullName').value = loggedInUser.user_metadata?.name || ''; // Corrected to user_metadata
            document.getElementById('userEmail').value = loggedInUser.email || '';
            document.getElementById('userRole').value = loggedInUser.user_metadata?.role || ''; // Corrected to user_metadata
            document.getElementById('userStatus').value = 'Active'; // Assuming active if logged in
            console.log(`Edit User form opened for ID: ${id} (self-edit, profile not found).`);
        } else {
            alert('User profile not found for editing.');
            if (userModal) {
                userModal.classList.add('hidden');
                userModal.style.display = 'none';
            }
            console.warn(`User profile not found for editing ID: ${id}.`);
            return;
        }
    }

    if (userModal) {
        userModal.classList.remove('hidden');
        userModal.style.display = 'flex';
    }
}
window.deleteUser = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        console.log(`Deleting user ID: ${id}`);
        try {
            // Delete from profiles table first
            const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
            if (profileError) throw profileError;
            console.log(`User profile ID ${id} deleted from public.profiles.`);

            // Then delete from auth.users (requires service role key on server-side)
            // This part is client-side for demonstration, but in production, it should be a secure backend call.
            // IMPORTANT: Replace 'YOUR_SERVICE_ROLE_KEY' with your actual Supabase Service Role Key.
            // This key should NEVER be exposed on the client-side in a production environment.
            // This is for demonstration purposes only.
            const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // <<< REPLACE THIS WITH YOUR ACTUAL SERVICE ROLE KEY

            if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY' || !SERVICE_ROLE_KEY) {
                alert('Service Role Key is not configured. Cannot delete user from auth.users table from client-side.');
                await addAuditLog(loggedInUser?.email || 'admin', 'Attempted User Deletion', 'User Management', `Attempted to delete user with ID: ${id} (auth.users not deleted due to missing service role key).`);
                await fetchProfiles(); // Re-fetch profiles to reflect deletion from public.profiles
                console.warn('Service Role Key missing, auth.users deletion skipped.');
                return;
            }

            const { error: authError } = await supabase.auth.admin.deleteUser(id);
            if (authError) throw authError;
            console.log(`User ID ${id} deleted from auth.users.`);

            const deletedProfile = profiles.find(p => p.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted User', 'User Management', `Deleted user: ${deletedProfile?.full_name || deletedProfile?.email || id}`);
            alert('User deleted successfully!');
            await fetchProfiles();
            console.log(`User ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting user: ' + error.message);
            console.error('Supabase error deleting user:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete User Failed', 'User Management', `Error: ${error.message}`);
        }
    }
}

window.showAddAnnouncementModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    announcementModalTitle.textContent = 'Add New Announcement';
    announcementFormSubmitBtn.textContent = 'Publish Announcement';
    document.getElementById('announcementId').value = '';
    announcementForm.reset();
    if (announcementModal) {
        announcementModal.classList.remove('hidden');
        announcementModal.style.display = 'flex';
        console.log('Add Announcement modal opened.');
    }
}
window.editAnnouncement = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    const announcement = announcements.find(a => a.id === id);
    if (announcement) {
        announcementModalTitle.textContent = 'Edit Announcement';
        announcementFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('announcementId').value = announcement.id;
        document.getElementById('announcementTitle').value = announcement.title;
        document.getElementById('announcementContent').value = announcement.content;
        document.getElementById('announcementStatus').value = announcement.status;
        if (announcementModal) {
            announcementModal.classList.remove('hidden');
            announcementModal.style.display = 'flex';
            console.log(`Edit Announcement modal opened for ID: ${id}`);
        }
    }
}
window.deleteAnnouncement = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    if (confirm('Are you sure you want to delete this announcement?')) {
        console.log(`Deleting announcement ID: ${id}`);
        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;

            const deletedAnnouncement = announcements.find(a => a.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Announcement', 'Announcements', `Deleted announcement: ${deletedAnnouncement.title} (ID: ${deletedAnnouncement.id})`);
            alert('Announcement deleted successfully!');
            await fetchAnnouncements();
            console.log(`Announcement ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting announcement: ' + error.message);
            console.error('Supabase error deleting announcement:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Announcement Failed', 'Announcements', `Error: ${error.message}`);
        }
    }
}

// Attendance Module Specific JavaScript
window.showAddAttendanceModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    attendanceModalTitle.textContent = 'Mark Attendance';
    attendanceFormSubmitBtn.textContent = 'Mark Attendance';
    document.getElementById('attendanceId').value = '';
    attendanceForm.reset();
    populateStudentSelect();
    document.getElementById('attendanceDate').valueAsDate = new Date();
    if (attendanceModal) {
        attendanceModal.classList.remove('hidden');
        attendanceModal.style.display = 'flex';
        console.log('Add Attendance modal opened.');
    }
}

window.editAttendance = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    const record = attendanceRecords.find(r => r.id === id);
    if (record) {
        attendanceModalTitle.textContent = 'Edit Attendance';
        attendanceFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('attendanceId').value = record.id;
        populateStudentSelect(record.student_id);
        document.getElementById('attendanceDate').value = record.date;
        document.getElementById('attendanceStatus').value = record.status;
        document.getElementById('attendanceRemarks').value = record.remarks;
        if (attendanceModal) {
            attendanceModal.classList.remove('hidden');
            attendanceModal.style.display = 'flex';
            console.log(`Edit Attendance modal opened for ID: ${id}`);
        }
    }
}

window.deleteAttendance = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    if (confirm('Are you sure you want to delete this attendance record?')) {
        console.log(`Deleting attendance record ID: ${id}`);
        try {
            const { error } = await supabase.from('attendance').delete().eq('id', id);
            if (error) throw error;

            const deletedRecord = attendanceRecords.find(r => r.id === id);
            const student = deletedRecord.students; // Access student details from the joined object
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Attendance', 'Attendance', `Deleted attendance for ${student ? student.name : 'Unknown Student'} on ${deletedRecord.date}`);
            alert('Attendance record deleted successfully!');
            await fetchAttendanceRecords();
            console.log(`Attendance record ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting attendance record: ' + error.message);
            console.error('Supabase error deleting attendance record:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Attendance Failed', 'Attendance', `Error: ${error.message}`);
        }
    }
}

function populateStudentSelect(selectedStudentId = '') {
    if (!attendanceStudentSelect) return;
    attendanceStudentSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (Class: ${student.class}, Roll: ${student.roll_no})`;
        if (student.id === selectedStudentId) {
            option.selected = true;
        }
        attendanceStudentSelect.appendChild(option);
    });
    console.log('Student select populated.');
}

if (attendanceForm) {
    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'System';

        const id = document.getElementById('attendanceId').value;
        const studentId = document.getElementById('attendanceStudentSelect').value;
        const date = document.getElementById('attendanceDate').value;
        const status = document.getElementById('attendanceStatus').value;
        const remarks = document.getElementById('attendanceRemarks').value;

        if (!studentId || !date || !status) {
            alert('Please fill in all required attendance fields.');
            console.warn('Attendance form submission failed: Missing required fields.');
            return;
        }

        const attendanceData = {
            student_id: studentId,
            date: date,
            status: status,
            remarks: remarks
        };

        try {
            let result;
            if (id) {
                // Update existing record
                result = await supabase.from('attendance').update(attendanceData).eq('id', id).select();
                alert('Attendance record updated successfully!');
                await addAuditLog(userEmail, 'Updated Attendance', 'Attendance', `Updated attendance for student ${studentId} on ${date} to ${status}`);
            } else {
                // Insert new record, or update if a record for student_id and date already exists
                result = await supabase.from('attendance').upsert(
                    { ...attendanceData },
                    { onConflict: ['student_id', 'date'] } // Conflict on student_id and date to update existing
                ).select();
                alert('Attendance marked successfully!');
                await addAuditLog(userEmail, 'Marked Attendance', 'Attendance', `Marked attendance for student ${studentId} on ${date} as ${status}`);
            }

            if (result.error) throw result.error;

            await fetchAttendanceRecords();
            if (attendanceModal) {
                attendanceModal.classList.add('hidden');
                attendanceModal.style.display = 'none';
            }
            attendanceForm.reset();
            console.log('Attendance form submitted successfully.');
        } catch (error) {
            alert('Error saving attendance: ' + error.message);
            console.error('Supabase error saving attendance:', error);
            await addAuditLog(userEmail, 'Attendance Save Failed', 'Attendance', `Error: ${error.message}`);
        }
    });
}

if (closeAttendanceModal) {
    closeAttendanceModal.addEventListener('click', () => {
        if (attendanceModal) {
            attendanceModal.classList.add('hidden');
            attendanceModal.style.display = 'none';
        }
        attendanceForm.reset();
        console.log('Attendance modal closed.');
    });
}

if (attendanceModal) {
    attendanceModal.addEventListener('click', (e) => {
        if (e.target === attendanceModal) {
            attendanceModal.classList.add('hidden');
            attendanceModal.style.display = 'none';
            attendanceForm.reset();
            console.log('Attendance modal closed by outside click.');
        }
    });
}

// Teacher Attendance Form Submission
if (teacherAttendanceForm) {
    teacherAttendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'System';

        const id = document.getElementById('teacherAttendanceId').value;
        const teacherId = document.getElementById('teacherAttendanceTeacherSelect').value;
        const date = document.getElementById('teacherAttendanceDate').value;
        const status = document.getElementById('teacherAttendanceStatus').value;
        const remarks = document.getElementById('teacherAttendanceRemarks').value;

        if (!teacherId || !date || !status) {
            alert('Please fill in all required teacher attendance fields.');
            console.warn('Teacher attendance form submission failed: Missing required fields.');
            return;
        }

        const attendanceData = {
            teacher_id: teacherId,
            date: date,
            status: status,
            remarks: remarks
        };

        try {
            let result;
            if (id) {
                // Update existing record
                result = await supabase.from('teacher_attendance').update(attendanceData).eq('id', id).select();
                alert('Teacher attendance record updated successfully!');
                await addAuditLog(userEmail, 'Updated Teacher Attendance', 'Teacher Attendance', `Updated attendance for teacher ${teacherId} on ${date} to ${status}`);
            } else {
                // Insert new record, or update if a record for teacher_id and date already exists
                result = await supabase.from('teacher_attendance').upsert(
                    { ...attendanceData },
                    { onConflict: ['teacher_id', 'date'] } // Conflict on teacher_id and date to update existing
                ).select();
                alert('Teacher attendance marked successfully!');
                await addAuditLog(userEmail, 'Marked Teacher Attendance', 'Teacher Attendance', `Marked attendance for teacher ${teacherId} on ${date} as ${status}`);
            }

            if (result.error) throw result.error;

            await fetchTeacherAttendanceRecords();
            if (teacherAttendanceModal) {
                teacherAttendanceModal.classList.add('hidden');
                teacherAttendanceModal.style.display = 'none';
            }
            teacherAttendanceForm.reset();
            console.log('Teacher attendance form submitted successfully.');
        } catch (error) {
            alert('Error saving teacher attendance: ' + error.message);
            console.error('Supabase error saving teacher attendance:', error);
            await addAuditLog(userEmail, 'Teacher Attendance Save Failed', 'Teacher Attendance', `Error: ${error.message}`);
        }
    });
}

if (closeTeacherAttendanceModal) {
    closeTeacherAttendanceModal.addEventListener('click', () => {
        if (teacherAttendanceModal) {
            teacherAttendanceModal.classList.add('hidden');
            teacherAttendanceModal.style.display = 'none';
        }
        teacherAttendanceForm.reset();
        console.log('Teacher attendance modal closed.');
    });
}

if (teacherAttendanceModal) {
    teacherAttendanceModal.addEventListener('click', (e) => {
        if (e.target === teacherAttendanceModal) {
            teacherAttendanceModal.classList.add('hidden');
            teacherAttendanceModal.style.display = 'none';
            teacherAttendanceForm.reset();
            console.log('Teacher attendance modal closed by outside click.');
        }
    });
}

// QR Code Scanning for Student Attendance
window.startQrAttendance = async function() {
    console.log('Starting QR attendance scan...');
    if (!qrScannerSection || !qrVideo) {
        console.error('QR scanner elements not found.');
        alert('QR scanner elements not found in the UI.');
        return;
    }

    qrScannerSection.classList.remove('hidden');
    qrVideo.innerHTML = ''; // Clear any previous content

    await html5QrCodeLoaded; // Ensure the library is loaded

    if (!window.Html5QrcodeScanner) {
        console.error('Html5QrcodeScanner is not available.');
        alert('QR scanner library not loaded correctly. Cannot start scan.');
        return;
    }

    html5QrCodeScanner = new Html5QrcodeScanner(
        "qrVideo",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
    );

    html5QrCodeScanner.render(onScanSuccess, onScanError);
    console.log('Html5QrcodeScanner initialized and rendering.');
}

window.stopQrAttendance = async function() {
    console.log('Stopping QR attendance scan...');
    if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
        try {
            await html5QrCodeScanner.stop();
            console.log('QR scanner stopped.');
        } catch (err) {
            console.error('Error stopping QR scanner:', err);
        } finally {
            html5QrCodeScanner = null;
            if (qrScannerSection) qrScannerSection.classList.add('hidden');
            if (qrVideo) qrVideo.innerHTML = ''; // Clear video element content
        }
    } else {
        console.log('QR scanner not active.');
        if (qrScannerSection) qrScannerSection.classList.add('hidden');
        if (qrVideo) qrVideo.innerHTML = ''; // Clear video element content
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    console.log(`QR Code scanned: ${decodedText}`);
    alert(`QR Code scanned: ${decodedText}`);
    // Assuming decodedText is the student_id
    const studentId = decodedText;
    const today = new Date().toISOString().split('T')[0];
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'System';

    try {
        const { data, error } = await supabase.from('attendance').upsert(
            { student_id: studentId, date: today, status: 'Present', remarks: 'QR Scan' },
            { onConflict: ['student_id', 'date'] }
        ).select();

        if (error) throw error;

        const student = students.find(s => s.id === studentId);
        alert(`Attendance marked for ${student ? student.name : 'Student ID ' + studentId} as Present.`);
        await addAuditLog(userEmail, 'QR Attendance', 'Attendance', `Marked Present for student ${student ? student.name : studentId} via QR scan.`);
        await fetchAttendanceRecords(); // Refresh attendance table
        await stopQrAttendance(); // Stop scanner after successful scan
    } catch (error) {
        alert('Error marking attendance via QR: ' + error.message);
        console.error('Supabase error marking QR attendance:', error);
        await addAuditLog(userEmail, 'QR Attendance Failed', 'Attendance', `Failed to mark attendance for student ${studentId} via QR scan: ${error.message}`);
    }
}

function onScanError(errorMessage) {
    // console.warn(`QR Scan Error: ${errorMessage}`); // Too verbose, only log if needed for debugging
}

// QR Code Scanning for Teacher Attendance
window.startTeacherQrAttendance = async function() {
    console.log('Starting Teacher QR attendance scan...');
    if (!teacherQrScannerSection || !teacherQrVideo) {
        console.error('Teacher QR scanner elements not found.');
        alert('Teacher QR scanner elements not found in the UI.');
        return;
    }

    teacherQrScannerSection.classList.remove('hidden');
    teacherQrVideo.innerHTML = ''; // Clear any previous content

    await html5QrCodeLoaded; // Ensure the library is loaded

    if (!window.Html5QrcodeScanner) {
        console.error('Html5QrcodeScanner is not available.');
        alert('QR scanner library not loaded correctly. Cannot start scan.');
        return;
    }

    html5QrCodeScannerTeacher = new Html5QrcodeScanner(
        "teacherQrVideo",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
    );

    html5QrCodeScannerTeacher.render(onTeacherScanSuccess, onTeacherScanError);
    console.log('Html5QrcodeScanner for teachers initialized and rendering.');
}

window.stopTeacherQrAttendance = async function() {
    console.log('Stopping Teacher QR attendance scan...');
    if (html5QrCodeScannerTeacher && html5QrCodeScannerTeacher.isScanning) {
        try {
            await html5QrCodeScannerTeacher.stop();
            console.log('Teacher QR scanner stopped.');
        } catch (err) {
            console.error('Error stopping Teacher QR scanner:', err);
        } finally {
            html5QrCodeScannerTeacher = null;
            if (teacherQrScannerSection) teacherQrScannerSection.classList.add('hidden');
            if (teacherQrVideo) teacherQrVideo.innerHTML = ''; // Clear video element content
        }
    } else {
        console.log('Teacher QR scanner not active.');
        if (teacherQrScannerSection) teacherQrScannerSection.classList.add('hidden');
        if (teacherQrVideo) teacherQrVideo.innerHTML = ''; // Clear video element content
    }
}

async function onTeacherScanSuccess(decodedText, decodedResult) {
    console.log(`Teacher QR Code scanned: ${decodedText}`);
    alert(`Teacher QR Code scanned: ${decodedText}`);
    // Assuming decodedText is the teacher_id
    const teacherId = decodedText;
    const today = new Date().toISOString().split('T')[0];
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'System';

    try {
        const { data, error } = await supabase.from('teacher_attendance').upsert(
            { teacher_id: teacherId, date: today, status: 'Present', remarks: 'QR Scan' },
            { onConflict: ['teacher_id', 'date'] }
        ).select();

        if (error) throw error;

        const teacher = teachers.find(t => t.id === teacherId);
        alert(`Attendance marked for ${teacher ? teacher.name : 'Teacher ID ' + teacherId} as Present.`);
        await addAuditLog(userEmail, 'QR Teacher Attendance', 'Teacher Attendance', `Marked Present for teacher ${teacher ? teacher.name : teacherId} via QR scan.`);
        await fetchTeacherAttendanceRecords(); // Refresh teacher attendance table
        await stopTeacherQrAttendance(); // Stop scanner after successful scan
    } catch (error) {
        alert('Error marking teacher attendance via QR: ' + error.message);
        console.error('Supabase error marking teacher QR attendance:', error);
        await addAuditLog(userEmail, 'QR Teacher Attendance Failed', 'Teacher Attendance', `Failed to mark attendance for teacher ${teacherId} via QR scan: ${error.message}`);
    }
}

function onTeacherScanError(errorMessage) {
    // console.warn(`Teacher QR Scan Error: ${errorMessage}`); // Too verbose
}

// QR Code Generation for Students
window.showStudentQrCodeModal = async function(studentId) {
    console.log(`Generating QR code for student ID: ${studentId}`);
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('Student not found.');
        console.warn(`Student with ID ${studentId} not found for QR code generation.`);
        return;
    }

    if (!window.QRious) {
        alert('QRious library not loaded. Cannot generate QR code.');
        console.error('QRious library (qrious.min.js) is not loaded.');
        return;
    }

    const qrData = student.id; // The data to be encoded in the QR code

    // Clear previous QR code
    studentQrCodeCanvas.getContext('2d').clearRect(0, 0, studentQrCodeCanvas.width, studentQrCodeCanvas.height);

    new QRious({
        element: studentQrCodeCanvas,
        value: qrData,
        size: 200,
        padding: 10,
        level: 'H' // High error correction
    });

    qrCodeStudentIdDisplay.textContent = `Student ID: ${student.id}`;
    downloadQrCodeLink.href = studentQrCodeCanvas.toDataURL('image/png');
    downloadQrCodeLink.download = `student_${student.id}_qr_code.png`;

    studentQrCodeModal.classList.remove('hidden');
    studentQrCodeModal.style.display = 'flex';
    console.log(`QR code generated and displayed for student ID: ${studentId}`);
}

if (closeStudentQrCodeModal) {
    closeStudentQrCodeModal.addEventListener('click', () => {
        studentQrCodeModal.classList.add('hidden');
        studentQrCodeModal.style.display = 'none';
        console.log('Student QR code modal closed.');
    });
}

if (studentQrCodeModal) {
    studentQrCodeModal.addEventListener('click', (e) => {
        if (e.target === studentQrCodeModal) {
            studentQrCodeModal.classList.add('hidden');
            studentQrCodeModal.style.display = 'none';
            console.log('Student QR code modal closed by outside click.');
        }
    });
}

window.printStudentQrCode = function() {
    console.log('Printing student QR code...');
    const printContents = studentQrCodeModal.querySelector('.p-4').innerHTML; // Get only the QR and text part
    const originalContents = document.body.innerHTML;

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Student QR Code</title>');
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        printWindow.document.write(`<link rel="stylesheet" href="${link.href}">`);
    });
    printWindow.document.write('<style>body { text-align: center; font-family: sans-serif; } canvas { border: 1px solid #ccc; padding: 10px; border-radius: 8px; } p { margin-top: 1rem; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    console.log('Student QR code print initiated.');
}

// QR Code Generation for Teachers
window.showTeacherQrCodeModal = async function(teacherId) {
    console.log(`Generating QR code for teacher ID: ${teacherId}`);
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) {
        alert('Teacher not found.');
        console.warn(`Teacher with ID ${teacherId} not found for QR code generation.`);
        return;
    }

    if (!window.QRious) {
        alert('QRious library not loaded. Cannot generate QR code.');
        console.error('QRious library (qrious.min.js) is not loaded.');
        return;
    }

    const qrData = teacher.id; // The data to be encoded in the QR code

    // Clear previous QR code
    teacherQrCodeCanvas.getContext('2d').clearRect(0, 0, teacherQrCodeCanvas.width, teacherQrCodeCanvas.height);

    new QRious({
        element: teacherQrCodeCanvas,
        value: qrData,
        size: 200,
        padding: 10,
        level: 'H' // High error correction
    });

    qrCodeTeacherIdDisplay.textContent = `Teacher ID: ${teacher.id}`;
    downloadTeacherQrCodeLink.href = teacherQrCodeCanvas.toDataURL('image/png');
    downloadTeacherQrCodeLink.download = `teacher_${teacher.id}_qr_code.png`;

    teacherQrCodeModal.classList.remove('hidden');
    teacherQrCodeModal.style.display = 'flex';
    console.log(`QR code generated and displayed for teacher ID: ${teacherId}`);
}

if (closeTeacherQrCodeModal) {
    closeTeacherQrCodeModal.addEventListener('click', () => {
        teacherQrCodeModal.classList.add('hidden');
        teacherQrCodeModal.style.display = 'none';
        console.log('Teacher QR code modal closed.');
    });
}

if (teacherQrCodeModal) {
    teacherQrCodeModal.addEventListener('click', (e) => {
        if (e.target === teacherQrCodeModal) {
            teacherQrCodeModal.classList.add('hidden');
            teacherQrCodeModal.style.display = 'none';
            console.log('Teacher QR code modal closed by outside click.');
        }
    });
}

window.printTeacherQrCode = function() {
    console.log('Printing teacher QR code...');
    const printContents = teacherQrCodeModal.querySelector('.p-4').innerHTML; // Get only the QR and text part
    const originalContents = document.body.innerHTML;

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Teacher QR Code</title>');
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        printWindow.document.write(`<link rel="stylesheet" href="${link.href}">`);
    });
    printWindow.document.write('<style>body { text-align: center; font-family: sans-serif; } canvas { border: 1px solid #ccc; padding: 10px; border-radius: 8px; } p { margin-top: 1rem; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContents);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    console.log('Teacher QR code print initiated.');
}


// Exam Module Functions
function renderExams() {
    if (!examTableBody) return;
    examTableBody.innerHTML = '';
    if (exams.length === 0) {
        examTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No exams found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    exams.forEach(exam => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${exam.exam_name}</td>
            <td class="py-3 px-4">${exam.class}</td>
            <td class="py-3 px-4">${exam.subject}</td>
            <td class="py-3 px-4">${exam.date}</td>
            <td class="py-3 px-4">${exam.max_marks}</td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Exam" onclick="editExam('${exam.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600" title="Delete Exam" onclick="deleteExam('${exam.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        examTableBody.appendChild(newRow);
    });
    console.log('Exam table rendered.');
}

window.showAddExamModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    examModalTitle.textContent = 'Add New Exam';
    examFormSubmitBtn.textContent = 'Save Exam';
    document.getElementById('examId').value = '';
    examForm.reset();
    if (examModal) {
        examModal.classList.remove('hidden');
        examModal.style.display = 'flex';
        console.log('Add Exam modal opened.');
    }
}

window.editExam = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    const exam = exams.find(e => e.id === id);
    if (exam) {
        examModalTitle.textContent = 'Edit Exam';
        examFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('examId').value = exam.id;
        document.getElementById('examName').value = exam.exam_name;
        document.getElementById('examClass').value = exam.class;
        document.getElementById('examSubject').value = exam.subject;
        document.getElementById('examDate').value = exam.date;
        document.getElementById('examMaxMarks').value = exam.max_marks;
        if (examModal) {
            examModal.classList.remove('hidden');
            examModal.style.display = 'flex';
            console.log(`Edit Exam modal opened for ID: ${id}`);
        }
    }
}

window.deleteExam = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    if (confirm('Are you sure you want to delete this exam?')) {
        console.log(`Deleting exam ID: ${id}`);
        try {
            const { error } = await supabase.from('exams').delete().eq('id', id);
            if (error) throw error;

            const deletedExam = exams.find(e => e.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Exam', 'Exams', `Deleted exam: ${deletedExam.exam_name} (ID: ${deletedExam.id})`);
            alert('Exam deleted successfully!');
            await fetchExams();
            console.log(`Exam ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting exam: ' + error.message);
            console.error('Supabase error deleting exam:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Exam Failed', 'Exams', `Error: ${error.message}`);
        }
    }
}

if (examForm) {
    examForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'System';

        const id = document.getElementById('examId').value;
        const examName = document.getElementById('examName').value;
        const examClass = document.getElementById('examClass').value;
        const examSubject = document.getElementById('examSubject').value;
        const examDate = document.getElementById('examDate').value;
        const examMaxMarks = document.getElementById('examMaxMarks').value;

        if (!examName || !examClass || !examSubject || !examDate || !examMaxMarks) {
            alert('Please fill in all required exam fields.');
            console.warn('Exam form submission failed: Missing required fields.');
            return;
        }

        const examData = {
            exam_name: examName,
            class: examClass,
            subject: examSubject,
            date: examDate,
            max_marks: examMaxMarks
        };

        try {
            let result;
            if (id) {
                // Update existing record
                result = await supabase.from('exams').update(examData).eq('id', id).select();
                alert('Exam updated successfully!');
                await addAuditLog(userEmail, 'Updated Exam', 'Exams', `Updated exam: ${examName} (ID: ${id})`);
            } else {
                // Insert new record
                result = await supabase.from('exams').insert(examData).select();
                alert('Exam added successfully!');
                await addAuditLog(userEmail, 'Added Exam', 'Exams', `Added new exam: ${examName}`);
            }

            if (result.error) throw result.error;

            await fetchExams();
            if (examModal) {
                examModal.classList.add('hidden');
                examModal.style.display = 'none';
            }
            examForm.reset();
            console.log('Exam form submitted successfully.');
        } catch (error) {
            alert('Error saving exam: ' + error.message);
            console.error('Supabase error saving exam:', error);
            await addAuditLog(userEmail, 'Exam Save Failed', 'Exams', `Error: ${error.message}`);
        }
    });
}

if (closeExamModal) {
    closeExamModal.addEventListener('click', () => {
        if (examModal) {
            examModal.classList.add('hidden');
            examModal.style.display = 'none';
        }
        examForm.reset();
        console.log('Exam modal closed.');
    });
}

if (examModal) {
    examModal.addEventListener('click', (e) => {
        if (e.target === examModal) {
            examModal.classList.add('hidden');
            examModal.style.display = 'none';
            examForm.reset();
            console.log('Exam modal closed by outside click.');
        }
    });
}

// Generate Exam Results Modal Logic
window.showGenerateResultsModal = function() {
    generateResultsModal.classList.remove('hidden');
    generateResultsModal.style.display = 'flex';
    generateResultsForm.reset();
    console.log('Generate Exam Results modal opened.');
}

if (closeGenerateResultsModal) {
    closeGenerateResultsModal.addEventListener('click', () => {
        generateResultsModal.classList.add('hidden');
        generateResultsModal.style.display = 'none';
        console.log('Generate Exam Results modal closed.');
    });
}

if (generateResultsModal) {
    generateResultsModal.addEventListener('click', (e) => {
        if (e.target === generateResultsModal) {
            generateResultsModal.classList.add('hidden');
            generateResultsModal.style.display = 'none';
            console.log('Generate Exam Results modal closed by outside click.');
        }
    });
}

if (generateResultsForm) {
    generateResultsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedClass = resultsClassFilter.value;
        const examType = resultsExamTypeFilter.value;

        if (!selectedClass || !examType) {
            alert('Please select both Class and Exam Type.');
            return;
        }

        alert(`Generating PDF report for ${examType} exams in ${selectedClass}... (Functionality to be implemented)`);
        console.log(`Generating PDF report for ${examType} exams in ${selectedClass}.`);
        // Here you would typically fetch exam results data based on filters
        // and then use jsPDF to generate the report.
        // For now, it's a placeholder.

        generateResultsModal.classList.add('hidden');
        generateResultsModal.style.display = 'none';
    });
}

// Homework Module Functions
function renderHomeworkTable(filteredHomework = homeworkAssignments) {
    if (!homeworkTableBody) return;
    homeworkTableBody.innerHTML = '';
    if (filteredHomework.length === 0) {
        homeworkTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No homework assignments found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata

    filteredHomework.forEach(homework => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${homework.id}</td>
            <td class="py-3 px-4">${homework.title}</td>
            <td class="py-3 px-4">${homework.class}</td>
            <td class="py-3 px-4">${homework.subject}</td>
            <td class="py-3 px-4">${homework.assigned_date}</td>
            <td class="py-3 px-4">${homework.due_date}</td>
            <td class="py-3 px-4 table-actions">
                <button class="text-blue-600 mr-3" title="Edit Homework" onclick="editHomework('${homework.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 mr-3" title="Delete Homework" onclick="deleteHomework('${homework.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="text-green-600" title="View Details" onclick="showHomeworkDetailsModal('${homework.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        homeworkTableBody.appendChild(newRow);
    });
    console.log('Homework table rendered.');
}

window.showAddHomeworkModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    homeworkModalTitle.textContent = 'Add New Homework';
    homeworkFormSubmitBtn.textContent = 'Add Homework';
    document.getElementById('homeworkId').value = '';
    homeworkForm.reset();
    if (addHomeworkModal) {
        addHomeworkModal.classList.remove('hidden');
        addHomeworkModal.style.display = 'flex';
        console.log('Add Homework modal opened.');
    }
}

window.editHomework = function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    const homework = homeworkAssignments.find(h => h.id === id);
    if (homework) {
        homeworkModalTitle.textContent = 'Edit Homework';
        homeworkFormSubmitBtn.textContent = 'Save Changes';
        document.getElementById('homeworkId').value = homework.id;
        document.getElementById('homeworkTitle').value = homework.title;
        document.getElementById('homeworkClass').value = homework.class;
        document.getElementById('homeworkSubject').value = homework.subject;
        document.getElementById('homeworkAssignedDate').value = homework.assigned_date;
        document.getElementById('homeworkDueDate').value = homework.due_date;
        document.getElementById('homeworkDescription').value = homework.description || '';
        if (addHomeworkModal) {
            addHomeworkModal.classList.remove('hidden');
            addHomeworkModal.style.display = 'flex';
            console.log(`Edit Homework modal opened for ID: ${id}`);
        }
    }
}

window.deleteHomework = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null; // Corrected to user_metadata
    if (confirm('Are you sure you want to delete this homework assignment?')) {
        console.log(`Deleting homework ID: ${id}`);
        try {
            const { error } = await supabase.from('homework').delete().eq('id', id);
            if (error) throw error;

            const deletedHomework = homeworkAssignments.find(h => h.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Homework', 'Homework', `Deleted homework: ${deletedHomework.title} (ID: ${deletedHomework.id})`);
            alert('Homework assignment deleted successfully!');
            await fetchHomework();
            console.log(`Homework ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting homework: ' + error.message);
            console.error('Supabase error deleting homework:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Homework Failed', 'Homework', `Error: ${error.message}`);
        }
    }
}

window.showHomeworkDetailsModal = function(id) {
    const homework = homeworkAssignments.find(h => h.id === id);
    if (homework) {
        homeworkDetailsModalTitle.textContent = `Details for ${homework.title}`;
        homeworkDetailsContent.innerHTML = `
            <p><strong>ID:</strong> ${homework.id}</p>
            <p><strong>Title:</strong> ${homework.title}</p>
            <p><strong>Class:</strong> ${homework.class}</p>
            <p><strong>Subject:</strong> ${homework.subject}</p>
            <p><strong>Assigned Date:</strong> ${homework.assigned_date}</p>
            <p><strong>Due Date:</strong> ${homework.due_date}</p>
            <p><strong>Description:</strong> ${homework.description || 'N/A'}</p>
        `;
        homeworkDetailsModal.classList.remove('hidden');
        homeworkDetailsModal.style.display = 'flex';
        console.log(`Homework details modal opened for ID: ${id}`);
    } else {
        alert('Homework not found.');
        console.warn(`Homework with ID ${id} not found for details.`);
    }
}

function filterHomework() {
    const classFilter = filterHomeworkClass.value;
    const subjectFilter = filterHomeworkSubject.value;
    const dueDateFilter = filterHomeworkDueDate.value;

    const filtered = homeworkAssignments.filter(homework => {
        const classMatch = classFilter === '' || homework.class === classFilter;
        const subjectMatch = subjectFilter === '' || homework.subject === subjectFilter;
        const dueDateMatch = dueDateFilter === '' || homework.due_date === dueDateFilter;
        return classMatch && subjectMatch && dueDateMatch;
    });
    renderHomeworkTable(filtered);
    console.log('Homework filtered.');
}

if (closeAddHomeworkModal) {
    closeAddHomeworkModal.addEventListener('click', () => {
        addHomeworkModal.classList.add('hidden');
        addHomeworkModal.style.display = 'none';
        homeworkForm.reset();
        console.log('Add Homework modal closed.');
    });
}

if (addHomeworkModal) {
    addHomeworkModal.addEventListener('click', (e) => {
        if (e.target === addHomeworkModal) {
            addHomeworkModal.classList.add('hidden');
            addHomeworkModal.style.display = 'none';
            homeworkForm.reset();
            console.log('Add Homework modal closed by outside click.');
        }
    });
}

if (homeworkForm) {
    homeworkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'System';

        const id = document.getElementById('homeworkId').value;
        const title = document.getElementById('homeworkTitle').value;
        const homeworkClass = document.getElementById('homeworkClass').value;
        const subject = document.getElementById('homeworkSubject').value;
        const assignedDate = document.getElementById('homeworkAssignedDate').value;
        const dueDate = document.getElementById('homeworkDueDate').value;
        const description = document.getElementById('homeworkDescription').value;

        if (!title || !homeworkClass || !subject || !assignedDate || !dueDate) {
            alert('Please fill in all required homework fields.');
            console.warn('Homework form submission failed: Missing required fields.');
            return;
        }

        const homeworkData = {
            title: title,
            class: homeworkClass,
            subject: subject,
            assigned_date: assignedDate,
            due_date: dueDate,
            description: description
        };

        try {
            let result;
            if (id) {
                // Update existing record
                result = await supabase.from('homework').update(homeworkData).eq('id', id).select();
                alert('Homework updated successfully!');
                await addAuditLog(userEmail, 'Updated Homework', 'Homework', `Updated homework: ${title} (ID: ${id})`);
            } else {
                // Insert new record
                result = await supabase.from('homework').insert(homeworkData).select();
                alert('Homework added successfully!');
                await addAuditLog(userEmail, 'Added Homework', 'Homework', `Added new homework: ${title}`);
            }

            if (result.error) throw result.error;

            await fetchHomework();
            if (addHomeworkModal) {
                addHomeworkModal.classList.add('hidden');
                addHomeworkModal.style.display = 'none';
            }
            homeworkForm.reset();
            console.log('Homework form submitted successfully.');
        } catch (error) {
            alert('Error saving homework: ' + error.message);
            console.error('Supabase error saving homework:', error);
            await addAuditLog(userEmail, 'Homework Save Failed', 'Homework', `Error: ${error.message}`);
        }
    });
}

if (closeHomeworkDetailsModal) {
    closeHomeworkDetailsModal.addEventListener('click', () => {
        homeworkDetailsModal.classList.add('hidden');
        homeworkDetailsModal.style.display = 'none';
        console.log('Homework details modal closed.');
    });
}

if (homeworkDetailsModal) {
    homeworkDetailsModal.addEventListener('click', (e) => {
        if (e.target === homeworkDetailsModal) {
            homeworkDetailsModal.classList.add('hidden');
            homeworkDetailsModal.style.display = 'none';
            console.log('Homework details modal closed by outside click.');
        }
    });
}

// Chart.js Initialization and Updates
function initCharts() {
    console.log('Initializing/Updating dashboard charts...');

    // Data for charts (example, replace with real data from Supabase fetches)
    const studentAttendanceData = {
        labels: ['Present', 'Absent', 'Leave'],
        datasets: [{
            data: [
                new Set(attendanceRecords.filter(r => r.status === 'Present').map(r => r.student_id)).size,
                new Set(attendanceRecords.filter(r => r.status === 'Absent').map(r => r.student_id)).size,
                new Set(attendanceRecords.filter(r => r.status === 'Leave').map(r => r.student_id)).size
            ],
            backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
            hoverOffset: 4
        }]
    };

    const teacherAttendanceData = {
        labels: ['Present', 'Absent', 'Leave'],
        datasets: [{
            data: [
                new Set(teacherAttendanceRecords.filter(r => r.status === 'Present').map(r => r.teacher_id)).size,
                new Set(teacherAttendanceRecords.filter(r => r.status === 'Absent').map(r => r.teacher_id)).size,
                new Set(teacherAttendanceRecords.filter(r => r.status === 'Leave').map(r => r.teacher_id)).size
            ],
            backgroundColor: ['#2196F3', '#FF5722', '#FFEB3B'],
            hoverOffset: 4
        }]
    };

    // Monthly Revenue Data
    const monthlyRevenueData = {
        labels: [], // e.g., ['Jan', 'Feb', 'Mar']
        datasets: [{
            label: 'Monthly Revenue (₹)',
            data: [], // e.g., [12000, 15000, 13000]
            backgroundColor: 'rgba(79, 70, 229, 0.5)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 1,
            fill: true
        }]
    };

    // Populate monthly revenue data for the last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        monthlyRevenueData.labels.push(monthName);

        const monthRevenue = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return inv.status === 'Paid' && invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
        }).reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
        monthlyRevenueData.datasets[0].data.push(monthRevenue);
    }

    // Get contexts
    const studentAttendanceCtx = document.getElementById('studentAttendanceChart')?.getContext('2d');
    const teacherAttendanceCtx = document.getElementById('teacherAttendanceChart')?.getContext('2d');
    const monthlyRevenueCtx = document.getElementById('monthlyRevenueChart')?.getContext('2d');

    // Destroy existing charts before re-initializing
    safeDestroy(studentAttendanceChartInstance);
    safeDestroy(teacherAttendanceChartInstance);
    safeDestroy(financeOverviewChartInstance); // Renamed from monthlyRevenueChartInstance for clarity

    // Initialize Student Attendance Chart
    if (studentAttendanceCtx) {
        studentAttendanceChartInstance = new Chart(studentAttendanceCtx, {
            type: 'doughnut',
            data: studentAttendanceData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Student Attendance Overview'
                    }
                }
            }
        });
    }

    // Initialize Teacher Attendance Chart
    if (teacherAttendanceCtx) {
        teacherAttendanceChartInstance = new Chart(teacherAttendanceCtx, {
            type: 'doughnut',
            data: teacherAttendanceData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Teacher Attendance Overview'
                    }
                }
            }
        });
    }

    // Initialize Monthly Revenue Chart
    if (monthlyRevenueCtx) {
        financeOverviewChartInstance = new Chart(monthlyRevenueCtx, {
            type: 'line',
            data: monthlyRevenueData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Last 6 Months Revenue Trend'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue (₹)'
                        }
                    }
                }
            }
        });
    }
    console.log('Dashboard charts initialized/updated.');
}

// Reports Module Charts
function initReportsCharts() {
    console.log('Initializing/Updating reports charts...');

    // Sample Data for Reports (replace with actual filtered data)
    const reportsAttendanceData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Present',
            data: [80, 85, 75, 90, 88, 92],
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
        }, {
            label: 'Absent',
            data: [10, 8, 15, 5, 7, 3],
            backgroundColor: 'rgba(255, 99, 132, 0.6)'
        }]
    };

    const reportsPerformanceData = {
        labels: ['Math', 'Science', 'English', 'History'],
        datasets: [{
            label: 'Average Score (%)',
            data: [78, 85, 70, 82],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
        }]
    };

    const reportsStudentStatusData = {
        labels: ['Active', 'Inactive', 'Graduated'],
        datasets: [{
            data: [students.filter(s => s.status === 'Active').length, students.filter(s => s.status === 'Inactive').length, 0], // Assuming no graduated status in current data
            backgroundColor: ['#36A2EB', '#FFCE56', '#4BC0C0']
        }]
    };

    const reportsClassPerformanceData = {
        labels: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
        datasets: [{
            label: 'Avg. Performance Score',
            data: [75, 80, 78, 85],
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    };

    // Get contexts
    const reportsAttendanceCtx = document.getElementById('reportsAttendanceChart')?.getContext('2d');
    const reportsPerformanceCtx = document.getElementById('reportsPerformanceChart')?.getContext('2d');
    const reportsStudentStatusCtx = document.getElementById('reportsStudentStatusChart')?.getContext('2d');
    const reportsClassPerformanceCtx = document.getElementById('reportsClassPerformanceChart')?.getContext('2d');

    // Destroy existing charts before re-initializing
    safeDestroy(reportsAttendanceChart);
    safeDestroy(reportsPerformanceChart);
    safeDestroy(reportsStudentStatusChart);
    safeDestroy(reportsClassPerformanceChart);

    // Initialize Reports Attendance Chart
    if (reportsAttendanceCtx) {
        reportsAttendanceChart = new Chart(reportsAttendanceCtx, {
            type: 'bar',
            data: reportsAttendanceData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Student Attendance Summary' }
                },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // Initialize Reports Performance Chart
    if (reportsPerformanceCtx) {
        reportsPerformanceChart = new Chart(reportsPerformanceCtx, {
            type: 'polarArea',
            data: reportsPerformanceData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Student Performance by Subject' }
                }
            }
        });
    }

    // Initialize Reports Student Status Chart
    if (reportsStudentStatusCtx) {
        reportsStudentStatusChart = new Chart(reportsStudentStatusCtx, {
            type: 'pie',
            data: reportsStudentStatusData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Student Status Distribution' }
                }
            }
        });
    }

    // Initialize Reports Class Performance Chart
    if (reportsClassPerformanceCtx) {
        reportsClassPerformanceChart = new Chart(reportsClassPerformanceCtx, {
            type: 'line',
            data: reportsClassPerformanceData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Class-wise Average Performance' }
                },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
    console.log('Reports charts initialized/updated.');
}

function applyReportFilters() {
    alert('Applying report filters... (Functionality to be implemented)');
    // This function would typically re-fetch data based on the selected filters
    // and then update the charts with the new data.
    // For now, it's a placeholder.
    initReportsCharts(); // Re-render charts with potentially new data
}

// Event listeners for modals
if (closeStudentModal) closeStudentModal.addEventListener('click', () => { studentModal.classList.add('hidden'); studentModal.style.display = 'none'; studentForm.reset(); });
if (studentModal) studentModal.addEventListener('click', (e) => { if (e.target === studentModal) { studentModal.classList.add('hidden'); studentModal.style.display = 'none'; studentForm.reset(); } });
if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'System';

        const id = document.getElementById('studentId').value;
        const name = document.getElementById('studentFullName').value;
        const fatherName = document.getElementById('studentFatherName').value;
        const motherName = document.getElementById('studentMotherName').value;
        const studentClass = document.getElementById('studentClass').value;
        const rollNo = document.getElementById('studentRollNo').value;
        const aadharNo = document.getElementById('studentAadharNo').value;
        const bloodGroup = document.getElementById('studentBloodGroup').value;
        const admissionNo = document.getElementById('studentAdmissionNo').value;
        const admissionDate = document.getElementById('studentAdmissionDate').value;
        const fatherAadhar = document.getElementById('studentFatherAadhar').value;
        const motherAadhar = document.getElementById('studentMotherAadhar').value;
        const email = document.getElementById('studentEmail').value;
        const phone = document.getElementById('studentPhone').value;
        const status = document.getElementById('studentStatus').value;

        if (!name || !fatherName || !motherName || !studentClass || !rollNo || !aadharNo) {
            alert('Please fill in all required student fields.');
            console.warn('Student form submission failed: Missing required fields.');
            return;
        }

        const studentData = {
            name: name,
            father_name: fatherName,
            mother_name: motherName,
            class: studentClass,
            roll_no: rollNo,
            aadhar_no: aadharNo,
            blood_group: bloodGroup,
            admission_no: admissionNo,
            admission_date: admissionDate,
            father_aadhar: fatherAadhar,
            mother_aadhar: motherAadhar,
            email: email,
            phone: phone,
            status: status
        };

        try {
            let result;
            if (id) {
                // Update existing student
                result = await supabase.from('students').update(studentData).eq('id', id).select();
                alert('Student updated successfully!');
                await addAuditLog(userEmail, 'Updated Student', 'Students', `Updated student: ${name} (ID: ${id})`);
            } else {
                // Insert new student
                result = await supabase.from('students').insert(studentData).select();
                alert('Student added successfully!');
                await addAuditLog(userEmail, 'Added Student', 'Students', `Added new student: ${name}`);
            }

            if (result.error) throw result.error;

            await fetchStudents();
            if (studentModal) {
                studentModal.classList.add('hidden');
                studentModal.style.display = 'none';
            }
            studentForm.reset();
            console.log('Student form submitted successfully.');
        } catch (error) {
            alert('Error saving student: ' + error.message);
            console.error('Supabase error saving student:', error);
            await addAuditLog(userEmail, 'Student Save Failed', 'Students', `Error: ${error.message}`);
        }
    });
}

if (closeStudentDetailsModal) closeStudentDetailsModal.addEventListener('click', () => { studentDetailsModal.classList.add('hidden'); studentDetailsModal.style.display = 'none'; });
if (studentDetailsModal) studentDetailsModal.addEventListener('click', (e) => { if (e.target === studentDetailsModal) { studentDetailsModal.classList.add('hidden'); studentDetailsModal.style.display = 'none'; } });

if (closeTeacherModal) closeTeacherModal.addEventListener('click', () => { teacherModal.classList.add('hidden'); teacherModal.style.display = 'none'; teacherForm.reset(); });
if (teacherModal) teacherModal.addEventListener('click', (e) => { if (e.target === teacherModal) { teacherModal.classList.add('hidden'); teacherModal.style.display = 'none'; teacherForm.reset(); } });
if (teacherForm) {
    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'System';

        const id = document.getElementById('teacherId').value;
        const name = document.getElementById('teacherFullName').value;
        const subject = document.getElementById('teacherSubject').value;
        const email = document.getElementById('teacherEmail').value;
        const classes = document.getElementById('teacherClasses').value;

        if (!name || !subject || !email) {
            alert('Please fill in all required teacher fields.');
            console.warn('Teacher form submission failed: Missing required fields.');
            return;
        }

        const teacherData = {
            name: name,
            subject: subject,
            email: email,
            classes: classes
        };

        try {
            let result;
            if (id) {
                // Update existing teacher
                result = await supabase.from('teachers').update(teacherData).eq('id', id).select();
                alert('Teacher updated successfully!');
                await addAuditLog(userEmail, 'Updated Teacher', 'Teachers', `Updated teacher: ${name} (ID: ${id})`);
            } else {
                // Insert new teacher
                result = await supabase.from('teachers').insert(teacherData).select();
                alert('Teacher added successfully!');
                await addAuditLog(userEmail, 'Added Teacher', 'Teachers', `Added new teacher: ${name}`);
            }

            if (result.error) throw result.error;

            await fetchTeachers();
            if (teacherModal) {
                teacherModal.classList.add('hidden');
                teacherModal.style.display = 'none';
            }
            teacherForm.reset();
            console.log('Teacher form submitted successfully.');
        } catch (error) {
            alert('Error saving teacher: ' + error.message);
            console.error('Supabase error saving teacher:', error);
            await addAuditLog(userEmail, 'Teacher Save Failed', 'Teachers', `Error: ${error.message}`);
        }
    });
}

if (closeTeacherDetailsModal) closeTeacherDetailsModal.addEventListener('click', () => { teacherDetailsModal.classList.add('hidden'); teacherDetailsModal.style.display = 'none'; });
if (teacherDetailsModal) teacherDetailsModal.addEventListener('click', (e) => { if (e.target === teacherDetailsModal) { teacherDetailsModal.classList.add('hidden'); teacherDetailsModal.style.display = 'none'; } });

if (closeUserModal) closeUserModal.addEventListener('click', () => { userModal.classList.add('hidden'); userModal.style.display = 'none'; userForm.reset(); });
if (userModal) userModal.addEventListener('click', (e) => { if (e.target === userModal) { userModal.classList.add('hidden'); userModal.style.display = 'none'; userForm.reset(); } });
if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'System';

        const id = document.getElementById('userId').value;
        const fullName = document.getElementById('userFullName').value;
        const email = document.getElementById('userEmail').value;
        const role = document.getElementById('userRole').value;
        const password = document.getElementById('userPassword').value;
        const status = document.getElementById('userStatus').value;

        if (!fullName || !email || !role || !status) {
            alert('Please fill in all required user fields.');
            console.warn('User form submission failed: Missing required fields.');
            return;
        }

        try {
            let authResult;
            let profileResult;

            if (id) {
                // Update existing user
                // Update profile table
                profileResult = await supabase.from('profiles').update({
                    full_name: fullName,
                    email: email,
                    role: role,
                    status: status
                }).eq('id', id).select();

                if (profileResult.error) throw profileResult.error;

                // Update auth.users email/password if provided (requires admin privileges)
                if (password) {
                    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(id, {
                        email: email,
                        password: password
                    });
                    if (updateAuthError) throw updateAuthError;
                } else {
                    // If password is not provided, just update email in auth.users
                    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(id, {
                        email: email
                    });
                    if (updateAuthError) throw updateAuthError;
                }

                alert('User updated successfully!');
                await addAuditLog(userEmail, 'Updated User', 'User Management', `Updated user: ${fullName} (ID: ${id})`);

            } else {
                // Add new user
                // Create user in auth.users
                authResult = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: role,
                            status: status
                        }
                    }
                });

                if (authResult.error) throw authResult.error;
                if (!authResult.data.user) throw new Error('User creation failed, no user data returned.');

                // Insert into profiles table (if not automatically handled by trigger)
                // It's good practice to explicitly insert if you don't have a trigger
                profileResult = await supabase.from('profiles').insert({
                    id: authResult.data.user.id,
                    full_name: fullName,
                    email: email,
                    role: role,
                    status: status
                }).select();

                if (profileResult.error) throw profileResult.error;

                alert('User added successfully! A confirmation email might be sent to the user.');
                await addAuditLog(userEmail, 'Added User', 'User Management', `Added new user: ${fullName}`);
            }

            await fetchProfiles();
            if (userModal) {
                userModal.classList.add('hidden');
                userModal.style.display = 'none';
            }
            userForm.reset();
            console.log('User form submitted successfully.');
        } catch (error) {
            alert('Error saving user: ' + error.message);
            console.error('Supabase error saving user:', error);
            await addAuditLog(userEmail, 'User Save Failed', 'User Management', `Error: ${error.message}`);
        }
    });
}

if (closeAnnouncementModal) closeAnnouncementModal.addEventListener('click', () => { announcementModal.classList.add('hidden'); announcementModal.style.display = 'none'; announcementForm.reset(); });
if (announcementModal) announcementModal.addEventListener('click', (e) => { if (e.target === announcementModal) { announcementModal.classList.add('hidden'); announcementModal.style.display = 'none'; announcementForm.reset(); } });
if (announcementForm) {
    announcementForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'System';

        const id = document.getElementById('announcementId').value;
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        const status = document.getElementById('announcementStatus').value;
        const datePosted = new Date().toISOString().split('T')[0]; // Current date

        if (!title || !content || !status) {
            alert('Please fill in all required announcement fields.');
            console.warn('Announcement form submission failed: Missing required fields.');
            return;
        }

        const announcementData = {
            title: title,
            content: content,
            date_posted: datePosted,
            status: status
        };

        try {
            let result;
            if (id) {
                // Update existing announcement
                result = await supabase.from('announcements').update(announcementData).eq('id', id).select();
                alert('Announcement updated successfully!');
                await addAuditLog(userEmail, 'Updated Announcement', 'Announcements', `Updated announcement: ${title} (ID: ${id})`);
            } else {
                // Insert new announcement
                result = await supabase.from('announcements').insert(announcementData).select();
                alert('Announcement published successfully!');
                await addAuditLog(userEmail, 'Published Announcement', 'Announcements', `Published new announcement: ${title}`);
            }

            if (result.error) throw result.error;

            await fetchAnnouncements();
            if (announcementModal) {
                announcementModal.classList.add('hidden');
                announcementModal.style.display = 'none';
            }
            announcementForm.reset();
            console.log('Announcement form submitted successfully.');
        } catch (error) {
            alert('Error saving announcement: ' + error.message);
            console.error('Supabase error saving announcement:', error);
            await addAuditLog(userEmail, 'Announcement Save Failed', 'Announcements', `Error: ${error.message}`);
        }
    });
}
