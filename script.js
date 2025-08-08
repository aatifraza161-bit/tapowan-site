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
        const cdnUrl2 = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/dist/html5-qrcode.min.js'; // Corrected CDN path
        const localUrl = '/lib/html5-qrcode.min.js'; // Local fallback path

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
            .catch(() => {
                console.warn('Attempting to load html5-qrcode from local fallback...');
                return loadScript(localUrl);
            })
            .then(resolve)
            .catch((e) => {
                console.error('Failed to load html5-qrcode library from all sources:', e);
                alert('Failed to load QR scanner library. Please check your internet connection or ensure local files are present.');
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

// --- Data Fetching Functions (from Supabase) ---

async function fetchStudents() {
    console.log('Fetching students...');
    try {
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
        initCharts(); // Re-initialize charts after student data update
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
        initCharts(); // Re-initialize charts after teacher data update
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
        initCharts(); // Re-initialize charts after invoice data update
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
        const { data, error } = await supabase.from('attendance').select('*');
        if (error) {
            console.error('Error fetching student attendance records:', error);
            console.error('Supabase RLS or DB error details for student attendance:', error.message, error.details, error.hint);
            if (error.code === '403') {
                console.error("Received 403 Forbidden for student attendance. Check RLS policies for 'attendance' table.");
            }
            throw error; // Re-throw to ensure finally block is reached
        }
        attendanceRecords = data; // CORRECTED: Assign to attendanceRecords
        console.log('Student attendance records fetched successfully:', attendanceRecords.length);
    } catch (error) {
        console.error('Caught error fetching student attendance, setting attendanceRecords to empty array.');
        attendanceRecords = [];
    } finally {
        // Ensure renderAttendanceTable is called after data is fetched
        renderAttendanceTable();
        // Also update dashboard stats that rely on attendance
        updateDashboardStats();
        initCharts(); // Re-initialize charts after attendance data update
    }
}

async function fetchTeacherAttendanceRecords() {
    console.log('Fetching teacher attendance records...');
    try {
        const { data, error } = await supabase.from('teacher_attendance').select('*');
        if (error) {
            console.error('Error fetching teacher attendance records:', error);
            console.error('Supabase RLS or DB error details for teacher attendance:', error.message, error.details, error.hint);
            if (error.code === '403') {
                console.error("Received 403 Forbidden for teacher attendance. Check RLS policies for 'teacher_attendance' table.");
            }
            throw error; // Re-throw to ensure finally block is reached
        }
        teacherAttendanceRecords = data; // CORRECTED: Assign to teacherAttendanceRecords
        console.log('Teacher attendance records fetched successfully:', teacherAttendanceRecords.length);
    } catch (error) {
        console.error('Caught error fetching teacher attendance, setting teacherAttendanceRecords to empty array.');
        teacherAttendanceRecords = [];
    } finally {
        renderTeacherAttendanceTable();
        updateDashboardStats();
        initCharts(); // Re-initialize charts after teacher attendance data update
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
        fetchHomework() // Fetch homework
    ]);
    console.log('All initial data loaded.');
    updateDashboardStats();
    renderHolidayList();
    initCharts(); // Initialize all charts on dashboard load
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
const loggedInUserName = document.getElementById('loggedInUserName');
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

const searchTeacherNameInput = document.getElementById('searchTeacherName');
const searchTeacherSubjectSelect = document.getElementById('searchTeacherSubject');
const applyTeacherSearchButton = document.getElementById('applyTeacherSearch');
const teacherModal = document.getElementById('teacherModal');
const closeTeacherModal = document.getElementById('closeTeacherModal');
const teacherForm = document.getElementById('teacherForm');
const teacherTableBody = document.getElementById('teacherTableBody');
const teacherModalTitle = document.getElementById('teacherModalTitle');
const teacherFormSubmitBtn = document.getElementById('teacherFormSubmitBtn');

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
const monthlyRevenue = document.getElementById('monthlyRevenue');
const upcomingEventsCount = document.getElementById('upcomingEventsCount');
const studentsPresentToday = document.getElementById('studentsPresentToday');
const teachersPresentToday = document.getElementById('teachersPresentToday');

// Chart.js instances (These are for dashboard charts, not reports)
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
const teacherAttendanceTableBody = document.getElementById('teacherAttendanceTableBody');
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
const darkModeIcon = darkModeToggle.querySelector('i');

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

    if (calendar && !calendar.isRendered) { // Check if calendar is not already rendered
        calendar.render();
    }
    initCharts(); // Initialize all charts on dashboard load
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
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) addStudentBtn.classList.remove('hidden');
    const addTeacherBtn = document.getElementById('addTeacherBtn');
    if (addTeacherBtn) addTeacherBtn.classList.remove('hidden');
    const addUserBtn = document.getElementById('addUserBtn');
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
            const userRole = authData.user.raw_user_meta_data?.role || authData.user.app_metadata?.role || 'admin';
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
        console.log('Forgot password modal opened.');
    });
}

if (closeForgotPasswordModal) {
    closeForgotPasswordModal.addEventListener('click', function() {
        forgotPasswordModal.classList.remove('active');
        forgotPasswordForm.reset();
        console.log('Forgot password modal closed.');
    });
}

if (forgotPasswordModal) {
    forgotPasswordModal.addEventListener('click', function(event) {
        if (event.target === forgotPasswordModal) {
            forgotPasswordModal.classList.remove('active');
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
                showLoginUi();
                // Reset UI elements to default dashboard view
                document.querySelectorAll('.module-content').forEach(m => m.classList.add('hidden'));
                document.getElementById('dashboardMainContent').classList.remove('hidden');
                document.getElementById('moduleTabs').classList.remove('hidden');
                document.getElementById('modulesContainer').classList.add('hidden');
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                document.querySelector('.nav-item[data-module="dashboard"]').classList.add('active');
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelector('.tab[data-tab="dashboard"]').classList.add('active');
                console.log('Logout successful. UI reset.');
            } catch (error) {
                console.error('Error logging out:', error);
                alert('Error logging out: ' + error.message);
                await addAuditLog(loggedInUser ? loggedInUser.email : 'Unknown', 'Logout Failed', 'Authentication', `Error: ${error.message}`);
            }
        }
    });
}


// Holiday Data (still static for now)
const holidays = [
    { date: '2023-01-01', name: 'New Year\'s Day' },
    { date: '2023-01-16', name: 'Martin Luther King, Jr. Day' },
    { date: '2023-02-20', name: 'Presidents\' Day' },
    { date: '2023-03-17', name: 'St. Patrick\'s Day (Observed)' },
    { date: '2023-04-07', name: 'Good Friday' },
    { date: '2023-05-29', name: 'Memorial Day' },
    { date: '2023-06-19', name: 'Juneteenth' },
    { date: '2023-07-04', name: 'Independence Day' },
    { date: '2023-09-04', name: 'Labor Day' },
    { date: '2023-10-09', name: 'Columbus Day' },
    { date: '2023-11-10', name: 'Veterans Day (Observed)' },
    { date: '2023-11-23', name: 'Thanksgiving Day' },
    { date: '2023-12-25', name: 'Christmas Day' },
    { date: '2024-01-01', name: 'New Year\'s Day' },
    { date: '2024-01-15', name: 'Martin Luther King, Jr. Day' },
    { date: '2024-02-19', name: 'Presidents\' Day' },
    { date: '2024-03-29', name: 'Good Friday' },
    { date: '2024-05-27', name: 'Memorial Day' },
    { date: '2024-06-19', name: 'Juneteenth' },
    { date: '2024-07-04', name: 'Independence Day' },
    { date: '2024-09-02', name: 'Labor Day' },
    { date: '2024-10-14', name: 'Columbus Day' },
    { date: '2024-11-11', name: 'Veterans Day' },
    { date: '2024-11-28', name: 'Thanksgiving Day' },
    { date: '2024-12-25', name: 'Christmas Day' },
];

// Initialize calendar
if (calendarEl && typeof FullCalendar !== 'undefined') {
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
    // Render calendar only if a session exists (this is fine as it doesn't log in the user)
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            console.log('Calendar rendered due to existing session.');
            calendar.render();
        } else {
            console.log('No session found, calendar not rendered initially.');
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

        holidays.push({ name: holidayName, date: holidayDate });
        renderHolidayList();
        if (calendar) {
            calendar.addEvent({
                title: holidayName,
                start: holidayDate,
                allDay: true,
                classNames: ['holiday'],
                display: 'background'
            });
        }
        alert('Holiday added successfully!');
        addHolidayModal.classList.add('hidden');
        addHolidayModal.style.display = 'none';
        addHolidayForm.reset();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        await addAuditLog(loggedInUser?.email || 'admin', 'Added Holiday', 'Calendar', `Added holiday: ${holidayName} on ${holidayDate}`);
        console.log(`Holiday "${holidayName}" added.`);
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role || 'admin' : null;

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
        initCharts(); // Re-initialize dashboard charts
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
            default: console.warn(`No specific data fetch defined for module: ${moduleName}`);
        }
    }
    if (notificationDropdown) notificationDropdown.classList.remove('active');
    if (userDropdown) userDropdown.classList.remove('active');
}

document.querySelectorAll('.open-module, .tab, .nav-item, .user-dropdown-item').forEach(el => {
    el.addEventListener('click', async (e) => {
        e.preventDefault();
        const moduleName = el.dataset.module || el.dataset.tab;
        if (moduleName) {
            showModule(moduleName);
        }
    });
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
        notificationDropdown.classList.toggle('active');
        if (userDropdown) userDropdown.classList.remove('active');
        console.log('Notification dropdown toggled.');
    });
}

document.addEventListener('click', function(event) {
    if (notificationDropdown && !notificationDropdown.contains(event.target) && (!notificationButton || !notificationButton.contains(event.target))) {
        notificationDropdown.classList.remove('active');
    }
});

if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
}

if (viewAllNotificationsLink) {
    viewAllNotificationsLink.addEventListener('click', function(event) {
        event.preventDefault();
        if (notificationDropdown) notificationDropdown.classList.remove("active");
        if (viewAllModal) viewAllModal.classList.add("active");
        renderModalNotifications();
        console.log('View All Notifications modal opened.');
    });
}

if (closeViewAllModal) {
    closeViewAllModal.addEventListener("click", () => {
        if (viewAllModal) viewAllModal.classList.remove("active");
        console.log('View All Notifications modal closed.');
    });
}

if (viewAllModal) {
    viewAllModal.addEventListener("click", (e) => {
        if (e.target === viewAllModal) {
            viewAllModal.classList.remove("active");
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
        const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    location.reload(); // Reload to restore original page state and scripts
    console.log('Invoice print initiated.');
}


async function updateLoggedInUserName() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser && loggedInUserName) {
        loggedInUserName.textContent = loggedInUser.raw_user_meta_data?.name || loggedInUser.email;
        console.log(`Logged in user name updated to: ${loggedInUserName.textContent}`);
    }
}

// User Dropdown Functionality
if (userProfileToggle) {
    userProfileToggle.addEventListener('click', function(event) {
        event.stopPropagation();
        if (userDropdown) userDropdown.classList.toggle('active');
        if (notificationDropdown) notificationDropdown.classList.remove('active');
        console.log('User profile dropdown toggled.');
    });
}

document.addEventListener('click', function(event) {
    if (userDropdown && !userDropdown.contains(event.target) && (!userProfileToggle || !userProfileToggle.contains(event.target))) {
        userDropdown.classList.remove('active');
    }
});

// Student Search and Render Functionality
function renderStudentTable(filteredStudents = students) {
    if (!studentTableBody) return;
    studentTableBody.innerHTML = '';
    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = '<tr><td colspan="15" class="text-center py-4 text-gray-500">No students found matching your criteria.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
                <button class="text-purple-600" title="Show QR Code" onclick="showStudentQrCodeModal('${student.id}')">
                    <i class="fas fa-qrcode"></i>
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
// FIX: Corrected typo from searchRollRollInput to searchRollInput
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
                <button class="text-red-600" title="Delete Teacher" onclick="deleteTeacher('${teacher.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="text-purple-600" title="Show QR Code" onclick="showTeacherQrCodeModal('${teacher.id}')">
                    <i class="fas fa-qrcode"></i>
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
    const currentUserRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

    if (filteredAttendance.length === 0) {
        attendanceTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No attendance records found for the selected criteria.</td></tr>';
    } else {
        filteredAttendance.forEach(record => {
            const student = students.find(s => s.id === record.student_id);
            if (!student) {
                console.warn(`Student with ID ${record.student_id} not found for attendance record.`);
                return; // Skip if student data is not found
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
        const student = students.find(s => s.id === record.student_id);
        if (!student) return false;

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
    if (!teacherAttendanceTableBody) return;
    teacherAttendanceTableBody.innerHTML = '';

    let totalPresent = 0;
    let totalAbsent = 0;
    let uniqueTeachersPresent = new Set(); // Track unique teachers present
    let uniqueTeachersAbsent = new Set(); // Track unique teachers absent
    let uniqueTeachersTotal = new Set(); // Track all unique teachers in records

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

    if (filteredRecords.length === 0) {
        teacherAttendanceTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No teacher attendance records found for the selected criteria.</td></tr>';
    } else {
        filteredRecords.forEach(record => {
            const teacher = teachers.find(t => t.id === record.teacher_id);
            if (!teacher) {
                console.warn(`Teacher with ID ${record.teacher_id} not found for attendance record.`);
                return;
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
                </td>
            `;
            teacherAttendanceTableBody.appendChild(newRow);
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
        const teacher = teachers.find(t => t.id === record.teacher_id);
        if (!teacher) return false;

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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    if (confirm('Are you sure you want to delete this teacher attendance record?')) {
        console.log(`Deleting teacher attendance record ID: ${id}`);
        try {
            const { error } = await supabase.from('teacher_attendance').delete().eq('id', id);
            if (error) throw error;

            const deletedRecord = teacherAttendanceRecords.find(r => r.id === id);
            const teacher = teachers.find(s => s.id === deletedRecord.teacher_id);
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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

window.showAddTeacherForm = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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

window.showAddUserForm = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    
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
            document.getElementById('userFullName').value = loggedInUser.raw_user_meta_data?.name || '';
            document.getElementById('userEmail').value = loggedInUser.email || '';
            document.getElementById('userRole').value = loggedInUser.raw_user_meta_data?.role || '';
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    if (confirm('Are you sure you want to delete this announcement?')) {
        console.log(`Deleting announcement ID: ${id}`);
        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;

            const deletedAnnouncement = announcements.find(a => a.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Announcement', 'Announcements', `Deleted: "${deletedAnnouncement.title}" (ID: ${deletedAnnouncement.id})`);
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

// Student Attendance Module Modals and Functions
window.showAddAttendanceModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    if (confirm('Are you sure you want to delete this attendance record?')) {
        console.log(`Deleting attendance record ID: ${id}`);
        try {
            const { error } = await supabase.from('attendance').delete().eq('id', id);
            if (error) throw error;

            const deletedRecord = attendanceRecords.find(r => r.id === id);
            const student = students.find(s => s.id === deletedRecord.student_id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Attendance', 'Attendance', `Deleted attendance for ${student ? student.name : 'Unknown Student'} on ${deletedRecord.date}`);
            alert('Attendance record deleted successfully!');
            await fetchAttendanceRecords(); // Refresh attendance table and summary counts
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
        option.textContent = `${student.name} (Roll No: ${student.roll_no}, Class: ${student.class})`;
        if (student.id === selectedStudentId) {
            option.selected = true;
        }
        attendanceStudentSelect.appendChild(option);
    });
    console.log('Student select populated.');
}

// Close modal event listeners
if (studentModal) studentModal.addEventListener('click', function(e) { if (e.target === studentModal || e.target.closest('.close-button')) { studentModal.classList.add('hidden'); studentModal.style.display = 'none'; studentForm.reset(); console.log('Student modal closed.'); } });
if (teacherModal) teacherModal.addEventListener('click', function(e) { if (e.target === teacherModal || e.target.closest('.close-button')) { teacherModal.classList.add('hidden'); teacherModal.style.display = 'none'; teacherForm.reset(); console.log('Teacher modal closed.'); } });
if (userModal) userModal.addEventListener('click', function(e) { if (e.target === userModal || e.target.closest('.close-button')) { userModal.classList.add('hidden'); userModal.style.display = 'none'; userForm.reset(); console.log('User modal closed.'); } });
if (announcementModal) announcementModal.addEventListener('click', function(e) { if (e.target === announcementModal || e.target.closest('.close-button')) { announcementModal.classList.add('hidden'); announcementModal.style.display = 'none'; announcementForm.reset(); console.log('Announcement modal closed.'); } });
if (attendanceModal) attendanceModal.addEventListener('click', function(e) { if (e.target === attendanceModal || e.target.closest('.close-button')) { attendanceModal.classList.add('hidden'); attendanceModal.style.display = 'none'; attendanceForm.reset(); console.log('Attendance modal closed.'); } });
if (closeTeacherAttendanceModal) closeTeacherAttendanceModal.addEventListener('click', function() { if (teacherAttendanceModal) { teacherAttendanceModal.classList.add('hidden'); teacherAttendanceModal.style.display = 'none'; } teacherAttendanceForm.reset(); console.log('Teacher Attendance modal closed.'); });
if (closeExamModal) closeExamModal.addEventListener('click', () => { examModal.classList.add('hidden'); examForm.reset(); console.log('Exam modal closed.'); });
if (closeGenerateResultsModal) closeGenerateResultsModal.addEventListener('click', () => { generateResultsModal.classList.add('hidden'); generateResultsModal.style.display = 'none'; generateResultsForm.reset(); console.log('Generate Results modal closed.'); });
if (closeAddHomeworkModal) closeAddHomeworkModal.addEventListener('click', () => { addHomeworkModal.classList.add('hidden'); addHomeworkModal.style.display = 'none'; homeworkForm.reset(); console.log('Add Homework modal closed.'); });
if (closeHomeworkDetailsModal) closeHomeworkDetailsModal.addEventListener('click', () => { homeworkDetailsModal.classList.add('hidden'); homeworkDetailsModal.style.display = 'none'; console.log('Homework Details modal closed.'); });


// NEW: Close QR Code Modal event listeners
if (closeStudentQrCodeModal) {
    closeStudentQrCodeModal.addEventListener('click', () => {
        if (studentQrCodeModal) {
            studentQrCodeModal.classList.add('hidden');
            studentQrCodeModal.style.display = 'none';
            console.log('Student QR Code modal closed.');
        }
    });
}
if (studentQrCodeModal) {
    studentQrCodeModal.addEventListener('click', (e) => {
        if (e.target === studentQrCodeModal) {
            studentQrCodeModal.classList.add('hidden');
            studentQrCodeModal.style.display = 'none';
            console.log('Student QR Code modal closed by outside click.');
        }
    });
}

// NEW: Close Teacher QR Code Modal event listeners
if (closeTeacherQrCodeModal) {
    closeTeacherQrCodeModal.addEventListener('click', () => {
        if (teacherQrCodeModal) {
            teacherQrCodeModal.classList.add('hidden');
            teacherQrCodeModal.style.display = 'none';
            console.log('Teacher QR Code modal closed.');
        }
    });
}
if (teacherQrCodeModal) {
    teacherQrCodeModal.addEventListener('click', (e) => {
        if (e.target === teacherQrCodeModal) {
            teacherQrCodeModal.classList.add('hidden');
            teacherQrCodeModal.style.display = 'none';
            console.log('Teacher QR Code modal closed by outside click.');
        }
    });
}


// Add/Edit Student Form Submission
if (studentForm) {
    studentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';
        const form = e.target;
        const id = document.getElementById('studentId').value;
        const fullName = document.getElementById('studentFullName').value;
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

        const studentData = {
            name: fullName,
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
            status: status,
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        console.log(`Submitting student form (ID: ${id || 'new'})...`);
        try {
            if (id) {
                const { error } = await supabase.from('students').update(studentData).eq('id', id);
                if (error) throw error;
                alert('Student updated successfully!');
                operationSuccess = true;
                auditAction = 'Updated Student';
                auditDetails = `Updated student: ${fullName} (ID: ${id})`;
            } else {
                const { data, error } = await supabase.from('students').insert([studentData]).select();
                if (error) throw error;
                alert('Student added successfully!');
                operationSuccess = true;
                auditAction = 'Added Student';
                auditDetails = `Added new student: ${data[0].name} (ID: ${data[0].id})`;
            }
        } catch (error) {
            alert((id ? 'Error updating' : 'Error adding') + ' student: ' + error.message);
            console.error('Supabase error submitting student form:', error);
            auditAction = (id ? 'Update Student Failed' : 'Add Student Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(userEmail, auditAction, 'Students', auditDetails);
            await fetchStudents();
            if (studentModal) {
                studentModal.classList.add('hidden');
                studentModal.style.display = 'none';
            }
            form.reset();
            console.log('Student form submitted successfully.');
        }
    });
}

// Add/Edit Teacher Form Submission
if (teacherForm) {
    teacherForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';
        const form = e.target;
        const id = document.getElementById('teacherId').value;
        const fullName = document.getElementById('teacherFullName').value;
        const subject = document.getElementById('teacherSubject').value;
        const email = document.getElementById('teacherEmail').value;
        const classes = document.getElementById('teacherClasses').value;

        const teacherData = {
            name: fullName,
            subject: subject,
            email: email,
            classes: classes,
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        console.log(`Submitting teacher form (ID: ${id || 'new'})...`);
        try {
            if (id) {
                const { error } = await supabase.from('teachers').update(teacherData).eq('id', id);
                if (error) throw error;
                alert('Teacher updated successfully!');
                operationSuccess = true;
                auditAction = 'Updated Teacher';
                auditDetails = `Updated teacher: ${fullName} (ID: ${id})`;
            } else {
                const { data, error } = await supabase.from('teachers').insert([teacherData]).select();
                if (error) throw error;
                alert('Teacher added successfully!');
                operationSuccess = true;
                auditAction = 'Added Teacher';
                auditDetails = `Added new teacher: ${data[0].name} (ID: ${data[0].id})`;
            }
        } catch (error) {
            alert((id ? 'Error updating' : 'Error adding') + ' teacher: ' + error.message);
            console.error('Supabase error submitting teacher form:', error);
            auditAction = (id ? 'Update Teacher Failed' : 'Add Teacher Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(userEmail, auditAction, 'Teachers', auditDetails);
            await fetchTeachers();
            if (teacherModal) {
                teacherModal.classList.add('hidden');
                teacherModal.style.display = 'none';
            }
            form.reset();
            console.log('Teacher form submitted successfully.');
        }
    });
}

// Add/Edit User Form Submission (Interacts with Supabase Auth and Profiles table)
if (userForm) {
    userForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';
        const form = e.target;
        const id = document.getElementById('userId').value;
        const fullName = document.getElementById('userFullName').value;
        const email = document.getElementById('userEmail').value;
        const role = document.getElementById('userRole').value;
        const password = document.getElementById('userPassword').value;
        const status = document.getElementById('userStatus').value;

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        console.log(`Submitting user form (ID: ${id || 'new'})...`);
        try {
            if (id) {
                // Update existing user profile
                const profileData = {
                    full_name: fullName,
                    email: email,
                    role: role,
                    status: status
                };
                const { error: profileError } = await supabase.from('profiles').update(profileData).eq('id', id);
                if (profileError) throw profileError;
                console.log(`User profile ID ${id} updated in public.profiles.`);

                // Update Supabase Auth user metadata (requires service role key for other users)
                // For self-update, client-side auth.updateUser is sufficient.
                if (loggedInUser.id === id) {
                    const { data, error: authUpdateError } = await supabase.auth.updateUser({
                        email: email,
                        data: {
                            name: fullName,
                            role: role
                        }
                    });
                    if (authUpdateError) throw authUpdateError;
                    localStorage.setItem('loggedInUser', JSON.stringify(data.user)); // Update local storage
                    updateLoggedInUserName();
                    console.log(`Self-user auth data updated for ID: ${id}.`);
                } else {
                    // For updating other users, use admin API (requires service role key)
                    const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // <<< REPLACE THIS WITH YOUR ACTUAL SERVICE ROLE KEY
                    if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY' || !SERVICE_ROLE_KEY) {
                        alert('Service Role Key is not configured. Cannot update other user roles/emails from client-side.');
                        auditAction = 'Updated User Profile (Auth Update Failed)';
                        auditDetails = `Updated profile for ${fullName} (ID: ${id}), but auth.users update failed due to missing service role key.`;
                        operationSuccess = true; // Consider profile update as success
                        console.warn('Service Role Key missing, auth.users update skipped for other user.');
                    } else {
                        const { data, error: authUpdateError } = await supabase.auth.admin.updateUserById(id, {
                            email: email,
                            user_metadata: {
                                name: fullName,
                                role: role
                            },
                            password: password || undefined
                        });
                        if (authUpdateError) throw authUpdateError;
                        auditAction = 'Updated User (Admin)';
                        auditDetails = `Updated user ${fullName} (ID: ${id}) by admin.`;
                        operationSuccess = true;
                        console.log(`Other user auth data updated for ID: ${id} by admin.`);
                    }
                }
                if (!operationSuccess) { // If operationSuccess wasn't set by admin update
                    alert('User profile updated successfully!');
                    operationSuccess = true;
                    auditAction = 'Updated User Profile';
                    auditDetails = `Updated user profile: ${fullName} (ID: ${id})`;
                }
            } else {
                // Create new user (requires service role key on server-side for setting role directly)
                // This is client-side for demonstration, but in production, it should be a secure backend call.
                const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // <<< REPLACE THIS WITH YOUR ACTUAL SERVICE ROLE KEY
                if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY' || !SERVICE_ROLE_KEY) {
                    alert('Service Role Key is not configured. Cannot create user with specific role from client-side.');
                    console.warn('Service Role Key missing, user creation skipped.');
                    return;
                }

                const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
                    email: email,
                    password: password,
                    email_confirm: true, // Auto-confirm email for admin-created users
                    user_metadata: {
                        full_name: fullName,
                        role: role
                    }
                });
                if (signUpError) throw signUpError;
                console.log(`New user created in auth.users: ${newUser.user.id}`);

                // Also create a profile entry for the new user
                const { error: profileInsertError } = await supabase.from('profiles').insert([
                    {
                        id: newUser.user.id,
                        full_name: fullName,
                        email: email,
                        role: role,
                        status: 'Active' // Default status for new users
                    }
                ]);
                if (profileInsertError) throw profileInsertError;
                console.log(`New user profile created in public.profiles for ID: ${newUser.user.id}`);

                alert('User added successfully!');
                operationSuccess = true;
                auditAction = 'Added User';
                auditDetails = `Added new user: ${fullName} (ID: ${newUser.user.id})`;
            }
        } catch (error) {
            alert((id ? 'Error updating' : 'Error adding') + ' user: ' + error.message);
            console.error('Supabase Auth/DB error submitting user form:', error);
            auditAction = (id ? 'Update User Failed' : 'Add User Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(userEmail, auditAction, 'User Management', auditDetails);
            await fetchProfiles(); // Re-fetch profiles to update the table
            if (userModal) {
                userModal.classList.add('hidden');
                userModal.style.display = 'none';
            }
            form.reset();
            console.log('User form submitted successfully.');
        }
    });
}

// Add/Edit Announcement Form Submission
if (announcementForm) {
    announcementForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';
        const form = e.target;
        const id = document.getElementById('announcementId').value;
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        const status = document.getElementById('announcementStatus').value;
        const datePosted = new Date().toISOString().split('T')[0];

        const announcementData = {
            title: title,
            content: content,
            date_posted: datePosted,
            status: status
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        console.log(`Submitting announcement form (ID: ${id || 'new'})...`);
        try {
            const { data, error } = await supabase.from('announcements').upsert(
                { ...announcementData, id: id || undefined },
                { onConflict: 'id' }
            ).select();

            if (error) throw error;

            if (id) {
                alert('Announcement updated successfully!');
                auditAction = 'Updated Announcement';
                auditDetails = `Updated: "${title}" (ID: ${id})`;
            } else {
                alert('Announcement published successfully!');
                auditAction = 'Published Announcement';
                auditDetails = `Published: "${title}" (ID: ${data[0].id})`;
            }
            operationSuccess = true;

        } catch (error) {
            alert((id ? 'Error updating' : 'Error publishing') + ' announcement: ' + error.message);
            console.error('Supabase error submitting announcement form:', error);
            auditAction = (id ? 'Update Announcement Failed' : 'Publish Announcement Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(userEmail, auditAction, 'Announcements', auditDetails);
            await fetchAnnouncements();
            if (announcementModal) {
                announcementModal.classList.add('hidden');
                announcementModal.style.display = 'none';
            }
            form.reset();
            console.log('Announcement form submitted successfully.');
        }
    });
}

// Student Attendance Form Submission
if (attendanceForm) {
    attendanceForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';
        const form = e.target;
        const id = document.getElementById('attendanceId').value;
        const studentId = document.getElementById('attendanceStudentSelect').value;
        const date = document.getElementById('attendanceDate').value;
        const status = document.getElementById('attendanceStatus').value;
        const remarks = document.getElementById('attendanceRemarks').value;

        if (!studentId || !date || !status) {
            alert('Please fill in all required fields.');
            console.warn('Attendance form submission failed: Missing student, date, or status.');
            return;
        }

        const student = students.find(s => s.id === studentId);
        if (!student) {
            alert('Selected student not found.');
            console.error(`Selected student ID ${studentId} not found.`);
            return;
        }

        const attendanceData = {
            student_id: studentId,
            date: date,
            status: status,
            remarks: remarks
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        console.log(`Submitting attendance form for student ${student.name} (ID: ${id || 'new'})...`);
        try {
            const { data, error } = await supabase.from('attendance').upsert(
                { ...attendanceData, id: id || undefined },
                { onConflict: ['student_id', 'date'] } // Use student_id and date for conflict resolution
            ).select();

            if (error) throw error;

            if (id) {
                alert('Attendance updated successfully!');
                auditAction = 'Updated Attendance';
                auditDetails = `Updated attendance for ${student.name} on ${date} to ${status}`;
            } else {
                alert('Attendance marked successfully!');
                auditAction = 'Marked Attendance';
                auditDetails = `Marked attendance for ${student.name} on ${date} as ${status}`;
            }
            operationSuccess = true;

        } catch (error) {
            alert((id ? 'Error updating' : 'Error marking') + ' attendance: ' + error.message);
            console.error('Supabase error submitting attendance form:', error);
            auditAction = (id ? 'Update Attendance Failed' : 'Mark Attendance Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(userEmail, auditAction, 'Attendance', auditDetails);
            await fetchAttendanceRecords(); // Refresh attendance table and summary counts
            if (attendanceModal) {
                attendanceModal.classList.add('hidden');
                attendanceModal.style.display = 'none';
            }
            form.reset();
            console.log('Attendance form submitted successfully.');
        }
    });
}

// Teacher Attendance Form Submission
if (teacherAttendanceForm) {
    teacherAttendanceForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';
        const form = e.target;
        const id = document.getElementById('teacherAttendanceId').value;
        const teacherId = document.getElementById('teacherAttendanceTeacherSelect').value;
        const date = document.getElementById('teacherAttendanceDate').value;
        const status = document.getElementById('teacherAttendanceStatus').value;
        const remarks = document.getElementById('teacherAttendanceRemarks').value;

        if (!teacherId || !date || !status) {
            alert('Please fill in all required fields.');
            console.warn('Teacher attendance form submission failed: Missing teacher, date, or status.');
            return;
        }

        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) {
            alert('Selected teacher not found.');
            console.error(`Selected teacher ID ${teacherId} not found.`);
            return;
        }

        const teacherAttendanceData = {
            teacher_id: teacherId,
            date: date,
            status: status,
            remarks: remarks
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        console.log(`Submitting teacher attendance form for teacher ${teacher.name} (ID: ${id || 'new'})...`);
        try {
            const { data, error } = await supabase.from('teacher_attendance').upsert(
                { ...teacherAttendanceData, id: id || undefined },
                { onConflict: ['teacher_id', 'date'] } // Use teacher_id and date for conflict resolution
            ).select();

            if (error) throw error;

            if (id) {
                alert('Teacher attendance updated successfully!');
                auditAction = 'Updated Teacher Attendance';
                auditDetails = `Updated attendance for ${teacher.name} on ${date} to ${status}`;
            } else {
                alert('Teacher attendance marked successfully!');
                auditAction = 'Marked Teacher Attendance';
                auditDetails = `Marked attendance for ${teacher.name} on ${date} as ${status}`;
            }
            operationSuccess = true;

        } catch (error) {
            alert((id ? 'Error updating' : 'Error marking') + ' teacher attendance: ' + error.message);
            console.error('Supabase error submitting teacher attendance form:', error);
            auditAction = (id ? 'Update Teacher Attendance Failed' : 'Mark Teacher Attendance Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(userEmail, auditAction, 'Teacher Attendance', auditDetails);
            await fetchTeacherAttendanceRecords(); // Refresh teacher attendance table and summary counts
            if (teacherAttendanceModal) {
                teacherAttendanceModal.classList.add('hidden');
                teacherAttendanceModal.style.display = 'none';
            }
            form.reset();
            console.log('Teacher attendance form submitted successfully.');
        }
    });
}

// Exam Module Functions
function renderExams(filteredExams = exams) {
    if (!examTableBody) return;
    examTableBody.innerHTML = '';
    if (filteredExams.length === 0) {
        examTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No exams found.</td></tr>';
        return;
    }
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

    filteredExams.forEach(exam => {
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
    console.log('Exams table rendered.');
}

window.showAddExamModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    examForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';
        const form = e.target;
        const id = document.getElementById('examId').value;
        const examName = document.getElementById('examName').value;
        const examClass = document.getElementById('examClass').value;
        const examSubject = document.getElementById('examSubject').value;
        const examDate = document.getElementById('examDate').value;
        const examMaxMarks = document.getElementById('examMaxMarks').value;

        const examData = {
            exam_name: examName,
            class: examClass,
            subject: examSubject,
            date: examDate,
            max_marks: examMaxMarks,
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        console.log(`Submitting exam form (ID: ${id || 'new'})...`);
        try {
            const { data, error } = await supabase.from('exams').upsert(
                { ...examData, id: id || undefined },
                { onConflict: 'id' }
            ).select();

            if (error) throw error;

            if (id) {
                alert('Exam updated successfully!');
                auditAction = 'Updated Exam';
                auditDetails = `Updated exam: ${examName} (ID: ${id})`;
            } else {
                alert('Exam added successfully!');
                auditAction = 'Added Exam';
                auditDetails = `Added new exam: ${examName} (ID: ${data[0].id})`;
            }
            operationSuccess = true;

        } catch (error) {
            alert((id ? 'Error updating' : 'Error adding') + ' exam: ' + error.message);
            console.error('Supabase error submitting exam form:', error);
            auditAction = (id ? 'Update Exam Failed' : 'Add Exam Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(userEmail, auditAction, 'Exams', auditDetails);
            await fetchExams();
            if (examModal) {
                examModal.classList.add('hidden');
                examModal.style.display = 'none';
            }
            form.reset();
            console.log('Exam form submitted successfully.');
        }
    });
}

window.showGenerateResultsModal = function() {
    generateResultsModal.classList.remove('hidden');
    generateResultsModal.style.display = 'flex';
    generateResultsForm.reset();
    console.log('Generate Results modal opened.');
}

if (generateResultsForm) {
    generateResultsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const selectedClass = document.getElementById('resultsClassFilter').value;
        const examType = document.getElementById('resultsExamTypeFilter').value;

        if (!selectedClass || !examType) {
            alert('Please select both Class and Exam Type.');
            console.warn('Generate Results failed: Missing class or exam type.');
            return;
        }

        alert(`Generating PDF report for ${examType} exams in ${selectedClass}. (Functionality to be implemented)`);
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        await addAuditLog(loggedInUser?.email || 'admin', 'Generated Exam Report', 'Exams', `Generated report for ${examType} exams in ${selectedClass}`);
        generateResultsModal.classList.add('hidden');
        generateResultsModal.style.display = 'none';
        console.log('Exam report generation initiated.');
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;

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
                <button class="text-blue-600 mr-3" title="View Details" onclick="showHomeworkDetailsModal('${homework.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="text-green-600 mr-3" title="Edit Homework" onclick="editHomework('${homework.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600" title="Delete Homework" onclick="deleteHomework('${homework.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        homeworkTableBody.appendChild(newRow);
    });
    console.log('Homework table rendered.');
}

window.showAddHomeworkModal = function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
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
    const userRole = loggedInUser ? loggedInUser.raw_user_meta_data?.role || loggedInUser.app_metadata?.role : null;
    if (confirm('Are you sure you want to delete this homework assignment?')) {
        console.log(`Deleting homework ID: ${id}`);
        try {
            const { error } = await supabase.from('homework').delete().eq('id', id);
            if (error) throw error;

            const deletedHomework = homeworkAssignments.find(h => h.id === id);
            await addAuditLog(loggedInUser?.email || 'admin', 'Deleted Homework', 'Homework', `Deleted homework: "${deletedHomework.title}" (ID: ${deletedHomework.id})`);
            alert('Homework assignment deleted successfully!');
            await fetchHomework();
            console.log(`Homework ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting homework assignment: ' + error.message);
            console.error('Supabase error deleting homework assignment:', error);
            await addAuditLog(loggedInUser?.email || 'admin', 'Delete Homework Failed', 'Homework', `Error: ${error.message}`);
        }
    }
}

if (homeworkForm) {
    homeworkForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';
        const form = e.target;
        const id = document.getElementById('homeworkId').value;
        const title = document.getElementById('homeworkTitle').value;
        const homeworkClass = document.getElementById('homeworkClass').value;
        const subject = document.getElementById('homeworkSubject').value;
        const assignedDate = document.getElementById('homeworkAssignedDate').value;
        const dueDate = document.getElementById('homeworkDueDate').value;
        const description = document.getElementById('homeworkDescription').value;

        const homeworkData = {
            title: title,
            class: homeworkClass,
            subject: subject,
            assigned_date: assignedDate,
            due_date: dueDate,
            description: description,
        };

        let operationSuccess = false;
        let auditAction = '';
        let auditDetails = '';

        console.log(`Submitting homework form (ID: ${id || 'new'})...`);
        try {
            const { data, error } = await supabase.from('homework').upsert(
                { ...homeworkData, id: id || undefined },
                { onConflict: 'id' }
            ).select();

            if (error) throw error;

            if (id) {
                alert('Homework assignment updated successfully!');
                auditAction = 'Updated Homework';
                auditDetails = `Updated homework: "${title}" (ID: ${id})`;
            } else {
                alert('Homework assignment added successfully!');
                auditAction = 'Added Homework';
                auditDetails = `Added new homework: "${title}" (ID: ${data[0].id})`;
            }
            operationSuccess = true;

        } catch (error) {
            alert((id ? 'Error updating' : 'Error adding') + ' homework assignment: ' + error.message);
            console.error('Supabase error submitting homework form:', error);
            auditAction = (id ? 'Update Homework Failed' : 'Add Homework Failed');
            auditDetails = `Error: ${error.message}`;
        }

        if (operationSuccess) {
            await addAuditLog(userEmail, auditAction, 'Homework', auditDetails);
            await fetchHomework();
            if (addHomeworkModal) {
                addHomeworkModal.classList.add('hidden');
                addHomeworkModal.style.display = 'none';
            }
            form.reset();
            console.log('Homework form submitted successfully.');
        }
    });
}

window.filterHomework = function() {
    const classFilter = filterHomeworkClass.value.toLowerCase();
    const subjectFilter = filterHomeworkSubject.value.toLowerCase();
    const dueDateFilter = filterHomeworkDueDate.value;

    const filtered = homeworkAssignments.filter(homework => {
        const classMatch = classFilter === '' || homework.class.toLowerCase() === classFilter;
        const subjectMatch = subjectFilter === '' || homework.subject.toLowerCase() === subjectFilter;
        const dueDateMatch = dueDateFilter === '' || homework.due_date === dueDateFilter;
        return classMatch && subjectMatch && dueDateMatch;
    });
    renderHomeworkTable(filtered);
    console.log('Homework filtered.');
}

window.showHomeworkDetailsModal = function(id) {
    const homework = homeworkAssignments.find(h => h.id === id);
    if (homework) {
        homeworkDetailsContent.innerHTML = `
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
        alert('Homework details not found.');
        console.warn(`Homework details not found for ID: ${id}.`);
    }
}

window.exportHomeworkToExcel = function() {
    console.log('Exporting homework to Excel...');
    const data = homeworkAssignments.map(h => ({
        ID: h.id,
        Title: h.title,
        Class: h.class,
        Subject: h.subject,
        'Assigned Date': h.assigned_date,
        'Due Date': h.due_date,
        Description: h.description
    }));

    // This part assumes XLSX library is loaded globally.
    // If not, you'll need to include it (e.g., via CDN or npm).
    // For this example, I'm assuming it's available.
    if (typeof XLSX === 'undefined') {
        alert('XLSX library not found. Cannot export to Excel.');
        console.error('XLSX library is required for Excel export.');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Homework Assignments");
    XLSX.writeFile(wb, "homework_assignments.xlsx");
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    addAuditLog(loggedInUser?.email || 'admin', 'Exported Homework', 'Homework', 'Exported all homework assignments to Excel.');
    console.log('Homework exported to Excel.');
}

window.generateHomeworkReport = function() {
    alert('Generating homework report PDF. (Functionality to be implemented)');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    addAuditLog(loggedInUser?.email || 'admin', 'Generated Homework Report', 'Homework', 'Generated homework report PDF.');
    console.log('Homework report generation initiated.');
}


// Chart.js Initialization and Update Functions
function destroyChart(chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    return chartInstance;
}

function initCharts() {
    console.log('Initializing dashboard charts...');
    // Destroy existing instances before creating new ones
    financeOverviewChartInstance = destroyChart(financeOverviewChartInstance);
    studentAttendanceChartInstance = destroyChart(studentAttendanceChartInstance);
    teacherAttendanceChartInstance = destroyChart(teacherAttendanceChartInstance);
    monthlyAttendanceTrendChartInstance = destroyChart(monthlyAttendanceTrendChartInstance);

    // Financial Overview Chart
    const financeCtx = document.getElementById('financeOverviewChart');
    if (financeCtx) {
        const totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
        const totalPending = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue').reduce((sum, inv) => sum + (parseFloat(inv.amount) - parseFloat(inv.paid_amount || 0)), 0);

        financeOverviewChartInstance = new Chart(financeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Total Revenue', 'Pending/Overdue'],
                datasets: [{
                    data: [totalRevenue, totalPending],
                    backgroundColor: ['#4CAF50', '#FFC107'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false,
                        text: 'Financial Overview'
                    }
                }
            }
        });
    }

    // Student Attendance Overview (Last 7 Days)
    const studentAttendanceCtx = document.getElementById('studentAttendanceChart');
    if (studentAttendanceCtx) {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse(); // Get dates from 7 days ago to today

        const studentAttendanceData = last7Days.map(date => {
            const presentCount = new Set(attendanceRecords.filter(rec => rec.date === date && rec.status === 'Present').map(rec => rec.student_id)).size;
            const absentCount = new Set(attendanceRecords.filter(rec => rec.date === date && rec.status === 'Absent').map(rec => rec.student_id)).size;
            return { date, presentCount, absentCount };
        });

        studentAttendanceChartInstance = new Chart(studentAttendanceCtx, {
            type: 'bar',
            data: {
                labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Present',
                        data: studentAttendanceData.map(d => d.presentCount),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Absent',
                        data: studentAttendanceData.map(d => d.absentCount),
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false,
                        text: 'Student Attendance Overview (Last 7 Days)'
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Teacher Attendance Overview (Last 7 Days)
    const teacherAttendanceCtx = document.getElementById('teacherAttendanceChart');
    if (teacherAttendanceCtx) {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const teacherAttendanceData = last7Days.map(date => {
            const presentCount = new Set(teacherAttendanceRecords.filter(rec => rec.date === date && rec.status === 'Present').map(rec => rec.teacher_id)).size;
            const absentCount = new Set(teacherAttendanceRecords.filter(rec => rec.date === date && rec.status === 'Absent').map(rec => rec.teacher_id)).size;
            return { date, presentCount, absentCount };
        });

        teacherAttendanceChartInstance = new Chart(teacherAttendanceCtx, {
            type: 'bar',
            data: {
                labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Present',
                        data: teacherAttendanceData.map(d => d.presentCount),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Absent',
                        data: teacherAttendanceData.map(d => d.absentCount),
                        backgroundColor: 'rgba(255, 159, 64, 0.6)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false,
                        text: 'Teacher Attendance Overview (Last 7 Days)'
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Monthly Attendance Trend
    const monthlyAttendanceTrendCtx = document.getElementById('monthlyAttendanceTrend');
    if (monthlyAttendanceTrendCtx) {
        const monthlyData = {};
        attendanceRecords.forEach(record => {
            const monthYear = new Date(record.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { present: 0, absent: 0 };
            }
            if (record.status === 'Present') {
                monthlyData[monthYear].present++;
            } else if (record.status === 'Absent') {
                monthlyData[monthYear].absent++;
            }
        });

        const labels = Object.keys(monthlyData).sort((a, b) => new Date(a) - new Date(b));
        const presentCounts = labels.map(label => monthlyData[label].present);
        const absentCounts = labels.map(label => monthlyData[label].absent);

        monthlyAttendanceTrendChartInstance = new Chart(monthlyAttendanceTrendCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Present',
                        data: presentCounts,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Absent',
                        data: absentCounts,
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false,
                        text: 'Monthly Attendance Trend'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    console.log('Dashboard charts initialized.');
}

function initReportsCharts() {
    console.log('Initializing reports charts...');
    // Destroy existing instances before creating new ones
    reportsAttendanceChart = destroyChart(reportsAttendanceChart);
    reportsPerformanceChart = destroyChart(reportsPerformanceChart);
    reportsStudentStatusChart = destroyChart(reportsStudentStatusChart);
    reportsClassPerformanceChart = destroyChart(reportsClassPerformanceChart);

    // Sample data for reports charts (replace with actual filtered data)
    const sampleReportsData = {
        attendance: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            present: [65, 59, 80, 81, 56, 55],
            absent: [10, 20, 15, 12, 25, 18]
        },
        performance: {
            labels: ['Math', 'Science', 'English', 'History'],
            scores: [85, 78, 90, 70]
        },
        studentStatus: {
            labels: ['Active', 'Inactive', 'Graduated'],
            counts: [students.filter(s => s.status === 'Active').length, students.filter(s => s.status === 'Inactive').length, 0] // Assuming no graduated status in current data
        },
        classPerformance: {
            labels: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
            averages: [75, 80, 70, 85]
        }
    };

    // Student Attendance Summary Chart
    const reportsAttendanceCtx = document.getElementById('reportsAttendanceChart');
    if (reportsAttendanceCtx) {
        reportsAttendanceChart = new Chart(reportsAttendanceCtx, {
            type: 'line',
            data: {
                labels: sampleReportsData.attendance.labels,
                datasets: [{
                    label: 'Present',
                    data: sampleReportsData.attendance.present,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }, {
                    label: 'Absent',
                    data: sampleReportsData.attendance.absent,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Student Performance by Subject Chart
    const reportsPerformanceCtx = document.getElementById('reportsPerformanceChart');
    if (reportsPerformanceCtx) {
        reportsPerformanceChart = new Chart(reportsPerformanceCtx, {
            type: 'bar',
            data: {
                labels: sampleReportsData.performance.labels,
                datasets: [{
                    label: 'Average Score',
                    data: sampleReportsData.performance.scores,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Student Status Distribution Chart
    const reportsStudentStatusCtx = document.getElementById('reportsStudentStatusChart');
    if (reportsStudentStatusCtx) {
        reportsStudentStatusChart = new Chart(reportsStudentStatusCtx, {
            type: 'pie',
            data: {
                labels: sampleReportsData.studentStatus.labels,
                datasets: [{
                    data: sampleReportsData.studentStatus.counts,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    // Class-wise Average Performance Chart
    const reportsClassPerformanceCtx = document.getElementById('reportsClassPerformanceChart');
    if (reportsClassPerformanceCtx) {
        reportsClassPerformanceChart = new Chart(reportsClassPerformanceCtx, {
            type: 'bar',
            data: {
                labels: sampleReportsData.classPerformance.labels,
                datasets: [{
                    label: 'Average Performance',
                    data: sampleReportsData.classPerformance.averages,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    console.log('Reports charts initialized.');
}

window.applyReportFilters = function() {
    alert('Applying report filters. (Functionality to update charts based on filters to be implemented)');
    initReportsCharts(); // Re-render charts with potentially new filtered data
    console.log('Report filters applied.');
}

window.exportReportsToPdf = function() {
    alert('Exporting reports to PDF. (Functionality to be implemented)');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    addAuditLog(loggedInUser?.email || 'admin', 'Exported Reports', 'Reports', 'Exported reports to PDF.');
    console.log('Reports export to PDF initiated.');
}


// QR Code Generation and Scanning
window.showStudentQrCodeModal = function(studentId) {
    console.log(`Showing QR code for student ID: ${studentId}`);
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('Student not found.');
        console.warn(`Student not found for QR code generation: ${studentId}.`);
        return;
    }

    const qrData = JSON.stringify({ type: 'student', id: student.id, name: student.name, class: student.class });
    const canvas = document.getElementById('studentQrCodeCanvas');
    const qrCodeStudentIdDisplay = document.getElementById('qrCodeStudentIdDisplay');
    const downloadLink = document.getElementById('downloadQrCodeLink');

    if (canvas) {
        new QRious({
            element: canvas,
            value: qrData,
            size: 200,
            padding: 10
        });
        qrCodeStudentIdDisplay.textContent = `Student ID: ${student.id}`;
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = `student_${student.id}_qr_code.png`;
    }

    if (studentQrCodeModal) {
        studentQrCodeModal.classList.remove('hidden');
        studentQrCodeModal.style.display = 'flex';
        console.log('Student QR Code modal opened.');
    }
}

window.printStudentQrCode = function() {
    console.log('Printing student QR code...');
    const printContents = document.getElementById('studentQrCodeModal').innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    location.reload(); // Reload to restore original page state and scripts
    console.log('Student QR Code print initiated.');
}

window.startQrAttendance = async function() {
    if (!qrScannerSection || !qrVideo) {
        console.warn('QR scanner elements not found.');
        return;
    }

    qrScannerSection.classList.remove('hidden');
    qrScannerSection.style.display = 'block';

    console.log('Waiting for html5-qrcode library to load...');
    await html5QrCodeLoaded; // Ensure the library is loaded
    console.log('html5-qrcode library loaded. Initializing scanner.');

    if (!html5QrCodeScanner) {
        html5QrCodeScanner = new Html5QrcodeScanner(
            "qrVideo",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false // disable creative commons branding
        );
    }

    html5QrCodeScanner.render(onScanSuccess, onScanError);
    alert('QR scanner started. Please scan a student QR code.');
    console.log('Student QR scanner started.');
}

window.stopQrAttendance = async function() {
    if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
        console.log("Stopping student QR scanning...");
        try {
            await html5QrCodeScanner.stop();
            console.log("Student QR scanning stopped successfully.");
        } catch (err) {
            console.warn("Error stopping student QR scanner:", err);
        }
    }
    if (qrScannerSection) {
        qrScannerSection.classList.add('hidden');
        qrScannerSection.style.display = 'none';
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    console.log(`Student QR Code scanned: ${decodedText}`);
    try {
        const qrData = JSON.parse(decodedText);
        if (qrData.type === 'student' && qrData.id) {
            const studentId = qrData.id;
            const student = students.find(s => s.id === studentId);
            if (student) {
                const today = new Date().toISOString().split('T')[0];
                const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
                const userEmail = loggedInUser?.email || 'System';

                const attendanceData = {
                    student_id: studentId,
                    date: today,
                    status: 'Present',
                    remarks: 'QR Scan'
                };

                console.log(`Marking attendance for student ${student.name} via QR scan...`);
                const { data, error } = await supabase.from('attendance').upsert(
                    { ...attendanceData },
                    { onConflict: ['student_id', 'date'] }
                ).select();

                if (error) throw error;

                alert(`Attendance marked for ${student.name} (ID: ${student.id}) as Present.`);
                await addAuditLog(userEmail, 'Marked Attendance (QR)', 'Attendance', `Marked Present for ${student.name} (ID: ${student.id}) via QR scan.`);
                await fetchAttendanceRecords(); // Refresh attendance table and dashboard stats
                console.log(`Attendance marked successfully for student ${student.name}.`);
            } else {
                alert('Student not found for scanned QR code.');
                console.warn(`Student not found for scanned QR ID: ${studentId}.`);
            }
        } else {
            alert('Invalid QR code format for student attendance.');
            console.warn('Invalid QR code format for student attendance:', decodedText);
        }
    } catch (e) {
        console.error('Error parsing student QR code data:', e);
        alert('Error processing QR code. Please ensure it is a valid student QR.');
    }
    // REMOVED: await stopQrAttendance(); // Keep scanner active for multiple scans
}

function onScanError(errorMessage) {
    // console.warn(`QR Scan Error: ${errorMessage}`); // Too verbose for console
}

// Teacher QR Code Generation and Scanning
window.showTeacherQrCodeModal = function(teacherId) {
    console.log(`Showing QR code for teacher ID: ${teacherId}`);
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) {
        alert('Teacher not found.');
        console.warn(`Teacher not found for QR code generation: ${teacherId}.`);
        return;
    }

    const qrData = JSON.stringify({ type: 'teacher', id: teacher.id, name: teacher.name, subject: teacher.subject });
    const canvas = document.getElementById('teacherQrCodeCanvas');
    const qrCodeTeacherIdDisplay = document.getElementById('qrCodeTeacherIdDisplay');
    const downloadLink = document.getElementById('downloadTeacherQrCodeLink');

    if (canvas) {
        new QRious({
            element: canvas,
            value: qrData,
            size: 200,
            padding: 10
        });
        qrCodeTeacherIdDisplay.textContent = `Teacher ID: ${teacher.id}`;
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = `teacher_${teacher.id}_qr_code.png`;
    }

    if (teacherQrCodeModal) {
        teacherQrCodeModal.classList.remove('hidden');
        teacherQrCodeModal.style.display = 'flex';
        console.log('Teacher QR Code modal opened.');
    }
}

window.printTeacherQrCode = function() {
    console.log('Printing teacher QR code...');
    const printContents = document.getElementById('teacherQrCodeModal').innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    location.reload(); // Reload to restore original page state and scripts
    console.log('Teacher QR Code print initiated.');
}

window.startTeacherQrAttendance = async function() {
    if (!teacherQrScannerSection || !teacherQrVideo) {
        console.warn('Teacher QR scanner elements not found.');
        return;
    }

    teacherQrScannerSection.classList.remove('hidden');
    teacherQrScannerSection.style.display = 'block';

    console.log('Waiting for html5-qrcode library to load for teacher scanner...');
    await html5QrCodeLoaded; // Ensure the library is loaded
    console.log('html5-qrcode library loaded. Initializing teacher scanner.');

    if (!html5QrCodeScannerTeacher) {
        html5QrCodeScannerTeacher = new Html5QrcodeScanner(
            "teacherQrVideo",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false // disable creative commons branding
        );
    }

    html5QrCodeScannerTeacher.render(onTeacherScanSuccess, onTeacherScanError);
    alert('Teacher QR scanner started. Please scan a teacher QR code.');
    console.log('Teacher QR scanner started.');
}

window.stopTeacherQrAttendance = async function() {
    if (html5QrCodeScannerTeacher && html5QrCodeScannerTeacher.isScanning) {
        console.log("Stopping teacher QR scanning...");
        try {
            await html5QrCodeScannerTeacher.stop();
            console.log("Teacher QR scanning stopped successfully.");
        } catch (err) {
            console.warn("Error stopping teacher QR scanner:", err);
        }
    }
    if (teacherQrScannerSection) {
        teacherQrScannerSection.classList.add('hidden');
        teacherQrScannerSection.style.display = 'none';
    }
}

async function onTeacherScanSuccess(decodedText, decodedResult) {
    console.log(`Teacher QR Code scanned: ${decodedText}`);
    try {
        const qrData = JSON.parse(decodedText);
        if (qrData.type === 'teacher' && qrData.id) {
            const teacherId = qrData.id;
            const teacher = teachers.find(t => t.id === teacherId);
            if (teacher) {
                const today = new Date().toISOString().split('T')[0];
                const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
                const userEmail = loggedInUser?.email || 'System';

                const attendanceData = {
                    teacher_id: teacherId,
                    date: today,
                    status: 'Present',
                    remarks: 'QR Scan'
                };

                console.log(`Marking attendance for teacher ${teacher.name} via QR scan...`);
                const { data, error } = await supabase.from('teacher_attendance').upsert(
                    { ...attendanceData },
                    { onConflict: ['teacher_id', 'date'] }
                ).select();

                if (error) throw error;

                alert(`Attendance marked for Teacher ${teacher.name} (ID: ${teacher.id}) as Present.`);
                await addAuditLog(userEmail, 'Marked Teacher Attendance (QR)', 'Teacher Attendance', `Marked Present for Teacher ${teacher.name} (ID: ${teacher.id}) via QR scan.`);
                await fetchTeacherAttendanceRecords(); // Refresh teacher attendance table and dashboard stats
                console.log(`Attendance marked successfully for teacher ${teacher.name}.`);
            } else {
                alert('Teacher not found for scanned QR code.');
                console.warn(`Teacher not found for scanned QR ID: ${teacherId}.`);
            }
        } else {
            alert('Invalid QR code format for teacher attendance.');
            console.warn('Invalid QR code format for teacher attendance:', decodedText);
        }
    } catch (e) {
        console.error('Error parsing Teacher QR code data:', e);
        alert('Error processing Teacher QR code. Please ensure it is a valid teacher QR.');
    }
    // REMOVED: await stopTeacherQrAttendance(); // Keep scanner active for multiple scans
}

function onTeacherScanError(errorMessage) {
    // console.warn(`Teacher QR Scan Error: ${errorMessage}`); // Too verbose for console
}

// Dark Mode Toggle
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
            console.log('Dark mode enabled.');
        } else {
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
            console.log('Light mode enabled.');
        }
        // Re-render charts to apply new theme colors if applicable
        initCharts();
        initReportsCharts();
    });

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeIcon.classList.remove('fa-moon');
        darkModeIcon.classList.add('fa-sun');
        console.log('Applied saved dark theme.');
    } else {
        document.body.classList.remove('dark-mode');
        darkModeIcon.classList.remove('fa-sun');
        darkModeIcon.classList.add('fa-moon');
        console.log('Applied saved light theme.');
    }
}

// Voice Assistant (Placeholder)
window.startVoiceAssistant = function() {
    alert('Voice Assistant functionality to be implemented.');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    addAuditLog(loggedInUser?.email || 'anonymous', 'Voice Assistant', 'Authentication', 'Attempted to start voice assistant.');
    console.log('Voice assistant initiated (placeholder).');
}
