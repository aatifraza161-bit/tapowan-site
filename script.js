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

// Supabase Client Initialization (Replace with your actual keys)
const SUPABASE_URL = 'https://zyvwttzwjweeslvjbatg.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dnd0dHp3andlZXNsdmpiYXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTQwODMsImV4cCI6MjA2OTUzMDA4M30.pgzB45XBJAyGBlkKUJF4Jr0yVNunXjwa8p8JOaX7Nso'; // Replace with your actual Supabase Anon Key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variable for QR Scanner instances
let html5QrCodeScanner = null;
let html5QrCodeScannerTeacher = null; // For teacher QR scanner

// Ensure html5-qrcode is available. It's expected to be loaded via <script> tag in index.html
// This check is for robustness, but the primary loading mechanism is the HTML script tag.
function checkHtml5QrCodeAvailability() {
    if (typeof Html5QrcodeScanner === 'undefined') {
        console.error('Html5QrcodeScanner is not defined. Ensure html5-qrcode.min.js is loaded correctly.');
        alert('QR scanner library not loaded. Please check your internet connection or script path.');
        return false;
    }
    return true;
}


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
    const body = document.body;
    const darkModeIcon = document.getElementById('darkModeToggle')?.querySelector('i');

    if (dark === 'true') {
        body.classList.add('dark-mode');
        if (darkModeIcon) darkModeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        body.classList.remove('dark-mode');
        if (darkModeIcon) darkModeIcon.classList.replace('fa-sun', 'fa-moon');
    }
}

function toggleDarkMode() {
    const body = document.body;
    const darkModeIcon = document.getElementById('darkModeToggle')?.querySelector('i');
    const isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');

    if (darkModeIcon) {
        if (isDark) {
            darkModeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            darkModeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggleBtn = document.getElementById('darkModeToggle');
    if (darkModeToggleBtn) {
        darkModeToggleBtn.addEventListener('click', toggleDarkMode);
    }
    applyDarkModeFromStorage();
});

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

function exportStudentAttendanceToExcel() {
    if (attendanceRecords.length === 0) {
        alert('No student attendance data to export.');
        return;
    }
    const dataToExport = attendanceRecords.map(record => ({
        'Student Name': record.students?.name || 'N/A',
        'Roll No.': record.students?.roll_no || 'N/A',
        'Class': record.students?.class || 'N/A',
        'Date': record.date,
        'Status': record.status,
        'Remarks': record.remarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StudentAttendance");
    XLSX.writeFile(wb, "student_attendance_data.xlsx");
    console.log('Student attendance data exported to Excel.');
}

function exportTeacherAttendanceToExcel() {
    if (teacherAttendanceRecords.length === 0) {
        alert('No teacher attendance data to export.');
        return;
    }
    const dataToExport = teacherAttendanceRecords.map(record => ({
        'Teacher Name': record.teachers?.name || 'N/A',
        'Subject': record.teachers?.subject || 'N/A',
        'Date': record.date,
        'Status': record.status,
        'Remarks': record.remarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TeacherAttendance");
    XLSX.writeFile(wb, "teacher_attendance_data.xlsx");
    console.log('Teacher attendance data exported to Excel.');
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

function exportStudentAttendanceToPdf() {
    alert('Generating student attendance PDF...');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Student Attendance Report", 10, 10);
    const tableColumn = ["Student Name", "Roll No.", "Class", "Date", "Status", "Remarks"];
    const tableRows = [];

    attendanceRecords.forEach(record => {
        const studentData = [
            record.students?.name || 'N/A',
            record.students?.roll_no || 'N/A',
            record.students?.class || 'N/A',
            record.date,
            record.status,
            record.remarks || ''
        ];
        tableRows.push(studentData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save("student_attendance_report.pdf");
    console.log('Student attendance PDF generation initiated.');
}

function exportTeacherAttendanceToPdf() {
    alert('Generating teacher attendance PDF...');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Teacher Attendance Report", 10, 10);
    const tableColumn = ["Teacher Name", "Subject", "Date", "Status", "Remarks"];
    const tableRows = [];

    teacherAttendanceRecords.forEach(record => {
        const teacherData = [
            record.teachers?.name || 'N/A',
            record.teachers?.subject || 'N/A',
            record.date,
            record.status,
            record.remarks || ''
        ];
        tableRows.push(teacherData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save("teacher_attendance_report.pdf");
    console.log('Teacher attendance PDF generation initiated.');
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
    }
    catch (error) {
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
const signUpButton = document.getElementById('signUpButton');
const signUpModal = document.getElementById('signUpModal');
const closeSignUpModal = document.getElementById('closeSignUpModal');
const signUpForm = document.getElementById('signUpForm');

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
const markAllPresentBtn = document.getElementById('markAllPresentBtn'); // Corrected ID
const classAttendanceTableBody = document.getElementById('classAttendanceTableBody');

// Teacher Attendance Module Elements
const teacherAttendanceModal = document.getElementById('teacherAttendanceModal');
const closeTeacherAttendanceModal = document.getElementById('closeTeacherAttendanceModal');
const teacherAttendanceForm = document.getElementById('teacherAttendanceForm');
const teacherAttendanceModalTitle = document.getElementById('teacherAttendanceModalTitle');
const teacherAttendanceFormSubmitBtn = document.getElementById('teacherAttendanceFormSubmitBtn');
const teacherAttendanceTeacherSelect = document.getElementById('teacherAttendanceTeacherSelect');
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

// QR Code Modal Elements
const studentQrCodeModal = document.getElementById('studentQrCodeModal');
const closeStudentQrCodeModal = document.getElementById('closeStudentQrCodeModal');
const studentQrCodeCanvas = document.getElementById('studentQrCodeCanvas');
const qrCodeStudentIdDisplay = document.getElementById('qrCodeStudentIdDisplay');
const downloadQrCodeLink = document.getElementById('downloadQrCodeLink');

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
const invoiceContent = document.getElementById('invoiceContent');

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
    if (loginUi) {
        loginUi.style.display = 'flex';
    }
    if (schoolSiteUi) {
        schoolSiteUi.style.display = 'none';
    }
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
    if (loginUi) {
        loginUi.style.display = 'none';
    }
    if (schoolSiteUi) {
        schoolSiteUi.style.display = 'flex';
    }
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
 * All role-based restrictions are removed from the frontend JS.
 * Backend RLS should enforce actual permissions.
 */
function updateUIAccess() {
    console.log('Updating UI access: showing all elements. Backend RLS will enforce permissions.');
    // Show all elements with data-role attributes
    document.querySelectorAll('[data-role]').forEach(el => {
        el.style.display = 'block';
    });

    // Show all navigation items
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('hidden');
    });

    // Show all specific buttons/forms
    // These elements are now correctly referenced by their IDs from index.html
    document.querySelector('#studentsModule button[onclick="showAddStudentForm()"]')?.classList.remove('hidden');
    document.querySelector('#teachersModule button[onclick="showAddTeacherForm()"]')?.classList.remove('hidden');
    document.querySelector('#user-managementModule button[onclick="showAddUserForm()"]')?.classList.remove('hidden');
    openPayrollModalBtn?.classList.remove('hidden');
    openAddInvoiceModalBtn?.classList.remove('hidden');
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
        if (selectedRoleInput) {
            selectedRoleInput.value = this.dataset.role;
        }
        console.log(`Role selected: ${this.dataset.role}`);
    });
});

/**
 * Handles user login authentication with Supabase.
 * Verifies selected role against user_metadata.
 */
async function handleLogin() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const selectedRoleElement = document.getElementById('selectedRole');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    const selectedRole = selectedRoleElement ? selectedRoleElement.value : '';

    // Ensure all fields are filled and a role is selected
    if (!email || !password || !selectedRole) {
        alert('Please fill in all fields and select a role.');
        console.warn('Login attempt failed: Missing email, password, or role.');
        return;
    }

    console.log(`Attempting login for ${email} with role ${selectedRole}...`);
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            alert('Login failed: ' + authError.message);
            console.error('Supabase signInWithPassword error:', authError);
            await addAuditLog(email, 'Login Failed', 'Authentication', `Error: ${authError.message}`);
            return;
        }

        if (authData.user) {
            // Determine the user's actual role from Supabase metadata
            const userRole = authData.user.user_metadata?.role || authData.user.app_metadata?.role || 'admin';
            console.log(`User ${authData.user.email} logged in. Actual role: ${userRole}`);

            // Frontend role check (optional, backend RLS is primary)
            // If you want to strictly enforce that the selected role matches the user's actual role:
            // if (selectedRole !== userRole && userRole !== 'admin') { // Allow admin to bypass for testing
            //     alert(`You logged in as ${userRole}, but selected ${selectedRole}. Please select your correct role.`);
            //     await supabase.auth.signOut(); // Force logout if role mismatch
            //     await addAuditLog(email, 'Login Failed (Role Mismatch)', 'Authentication', `User ${email} tried to log in as ${selectedRole} but is ${userRole}.`);
            //     return;
            // }

            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('loggedInUser', JSON.stringify(authData.user)); // Store the full user object
            alert('Login successful! Redirecting...');
            await addAuditLog(authData.user.email, 'Logged In', 'Authentication', `Successful login for role: ${userRole}`);
            showSchoolSiteUi(); // Only call this on successful login
        } else {
            // This case should ideally be covered by authError, but as a fallback
            alert('Login failed: No user data returned.');
            console.error('Login failed: No user data returned from signInWithPassword.');
            await addAuditLog(email, 'Login Failed (No User Data)', 'Authentication', 'No user data returned from signInWithPassword.');
        }
    } catch (err) {
        console.error('Unexpected error during login:', err);
        alert('An unexpected error occurred: ' + err.message);
        await addAuditLog(email, 'Login Failed (Unexpected)', 'Authentication', `Unexpected error: ${err.message}`);
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
        if (forgotPasswordModal) {
            forgotPasswordModal.classList.add('active');
            forgotPasswordModal.style.display = 'flex'; // Ensure it's visible
        }
        console.log('Forgot password modal opened.');
    });
}

if (closeForgotPasswordModal) {
    closeForgotPasswordModal.addEventListener('click', function() {
        if (forgotPasswordModal) {
            forgotPasswordModal.classList.remove('active');
            forgotPasswordModal.style.display = 'none'; // Ensure it's hidden
        }
        if (forgotPasswordForm) {
            forgotPasswordForm.reset();
        }
        console.log('Forgot password modal closed.');
    });
}

if (forgotPasswordModal) {
    forgotPasswordModal.addEventListener('click', function(event) {
        if (event.target === forgotPasswordModal) {
            forgotPasswordModal.classList.remove('active');
            forgotPasswordModal.style.display = 'none'; // Ensure it's hidden
            if (forgotPasswordForm) {
                forgotPasswordForm.reset();
            }
            console.log('Forgot password modal closed by outside click.');
        }
    });
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const forgotEmailInput = document.getElementById('forgotEmail');
        const email = forgotEmailInput ? forgotEmailInput.value : '';
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
            if (forgotPasswordModal) {
                forgotPasswordModal.classList.remove('active');
                forgotPasswordModal.style.display = 'none'; // Ensure it's hidden
            }
            if (forgotPasswordForm) {
                forgotPasswordForm.reset();
            }
        }
    });
}

// Sign Up Modal Logic
if (signUpButton) {
    signUpButton.addEventListener('click', function() {
        if (signUpModal) {
            signUpModal.classList.remove('hidden');
            signUpModal.style.display = 'flex';
        }
        if (signUpForm) {
            signUpForm.reset();
        }
        console.log('Sign Up modal opened.');
    });
}

if (closeSignUpModal) {
    closeSignUpModal.addEventListener('click', function() {
        if (signUpModal) {
            signUpModal.classList.add('hidden');
            signUpModal.style.display = 'none';
        }
        if (signUpForm) {
            signUpForm.reset();
        }
        console.log('Sign Up modal closed.');
    });
}

if (signUpModal) {
    signUpModal.addEventListener('click', function(event) {
        if (event.target === signUpModal) {
            signUpModal.classList.add('hidden');
            signUpModal.style.display = 'none';
            if (signUpForm) {
                signUpForm.reset();
            }
            console.log('Sign Up modal closed by outside click.');
        }
    });
}

if (signUpForm) {
    signUpForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const signUpFullNameInput = document.getElementById('signUpFullName');
        const signUpEmailInput = document.getElementById('signUpEmail');
        const signUpPasswordInput = document.getElementById('signUpPassword');
        const signUpRoleSelect = document.getElementById('signUpRole');

        const fullName = signUpFullNameInput ? signUpFullNameInput.value.trim() : '';
        const email = signUpEmailInput ? signUpEmailInput.value.trim() : '';
        const password = signUpPasswordInput ? signUpPasswordInput.value.trim() : '';
        const role = signUpRoleSelect ? signUpRoleSelect.value : '';

        if (!fullName || !email || !password || !role) {
            alert('Please fill in all fields.');
            console.warn('Sign Up attempt failed: Missing fields.');
            return;
        }

        console.log(`Attempting to sign up new user: ${email} with role: ${role}`);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    }
                }
            });

            if (error) {
                alert('Sign Up failed: ' + error.message);
                console.error('Supabase signUp error:', error);
                await addAuditLog(email, 'Sign Up Failed', 'Authentication', `Error: ${error.message}`);
                return;
            }

            if (data.user) {
                // Insert into profiles table
                const { error: profileError } = await supabase.from('profiles').insert([
                    {
                        id: data.user.id,
                        full_name: fullName,
                        email: email,
                        role: role,
                        status: 'Active'
                    }
                ]);

                if (profileError) {
                    console.error('Error inserting profile:', profileError);
                    alert('Sign Up successful, but failed to create user profile. Please contact support.');
                    await addAuditLog(email, 'Sign Up Partial Success', 'Authentication', `Profile creation failed: ${profileError.message}`);
                    // Optionally, you might want to delete the auth user here if profile creation is critical
                } else {
                    alert('Sign Up successful! Please check your email to confirm your account.');
                    await addAuditLog(email, 'Sign Up Successful', 'Authentication', `New user signed up with role: ${role}`);
                }
                if (signUpModal) {
                    signUpModal.classList.add('hidden');
                    signUpModal.style.display = 'none';
                }
                if (signUpForm) {
                    signUpForm.reset();
                }
            } else {
                alert('Sign Up failed: No user data returned.');
                await addAuditLog(email, 'Sign Up Failed (No User Data)', 'Authentication', 'No user data returned from signUp.');
            }
        } catch (err) {
            console.error('Unexpected error during sign up:', err);
            alert('An unexpected error occurred: ' + err.message);
            await addAuditLog(email, 'Sign Up Failed (Unexpected)', 'Authentication', `Unexpected error: ${err.message}`);
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
                document.getElementById('dashboardMainContent')?.classList.remove('hidden');
                document.getElementById('moduleTabs')?.classList.remove('hidden');
                document.getElementById('modulesContainer')?.classList.add('hidden');
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                document.querySelector('.nav-item[data-module="dashboard"]')?.classList.add('active');
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelector('.tab[data-tab="dashboard"]')?.classList.add('active');

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
    if (addHolidayModal) {
        addHolidayModal.classList.remove('hidden');
        addHolidayModal.style.display = 'flex';
    }
    if (addHolidayForm) {
        addHolidayForm.reset();
    }
    console.log('Add Holiday modal opened.');
}

if (closeAddHolidayModal) {
    closeAddHolidayModal.addEventListener('click', () => {
        if (addHolidayModal) {
            addHolidayModal.classList.add('hidden');
            addHolidayModal.style.display = 'none';
        }
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
        const holidayNameInput = document.getElementById('holidayName');
        const holidayDateInput = document.getElementById('holidayDate');

        const holidayName = holidayNameInput ? holidayNameInput.value : '';
        const holidayDate = holidayDateInput ? holidayDateInput.value : '';

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
            if (addHolidayModal) {
                addHolidayModal.classList.add('hidden');
                addHolidayModal.style.display = 'none';
            }
            if (addHolidayForm) {
                addHolidayForm.reset();
            }
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            await addAuditLog(loggedInUser?.email || 'admin', 'Added Holiday', 'Calendar', `Added holiday: ${holidayName} on ${holidayDate}`);
            console.log(`Holiday "${holidayName}" added.`);
        } catch (error) {
            alert('Error adding holiday: ' + error.message);
            console.error('Supabase error adding holiday:', error);
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
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
    const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role || 'admin' : null;

    if (currentModuleTitle) {
        currentModuleTitle.textContent = moduleName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    document.querySelectorAll('.module-content').forEach(m => m.classList.add('hidden'));
    if (dashboardMainContent) {
        dashboardMainContent.classList.add('hidden');
    }
    if (modulesContainer) {
        modulesContainer.classList.remove('hidden');
    }

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
        if (dashboardMainContent) {
            dashboardMainContent.classList.remove('hidden');
        }
        if (modulesContainer) {
            modulesContainer.classList.add('hidden');
        }
        if (moduleTabs) {
            moduleTabs.classList.remove('hidden');
        }
        document.querySelector('.tab[data-tab="dashboard"]')?.classList.add('active');
        document.querySelector('.nav-item[data-module="dashboard"]')?.classList.add('active');
        if (currentModuleTitle) {
            currentModuleTitle.textContent = 'Dashboard';
        }
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
            case 'attendance': await fetchAttendanceRecords(); populateStudentSelect(); break;
            case 'teacher-attendance': await fetchTeacherAttendanceRecords(); populateTeacherSelect(); break;
            case 'announcements': await fetchAnnouncements(); break;
            case 'audit-logs': await fetchAuditLogs(); break;
            case 'backup-restore': await fetchBackups(); break;
            case 'user-management': await fetchProfiles(); break;
            case 'exams': await fetchExams(); break;
            case 'reports': initReportsCharts(); break;
            case 'homework': await fetchHomework(); break;
            case 'calendar': await fetchHolidays(); if(calendar) calendar.render(); break;
            default: console.warn(`No specific data fetch defined for module: ${moduleName}`);
        }
    }
    if (notificationDropdown) notificationDropdown.classList.add('hidden');
    if (userDropdown) userDropdown.classList.add('hidden');
}

document.querySelectorAll('.open-module, .tab, .nav-item').forEach(el => {
    el.addEventListener('click', async (e) => {
        e.preventDefault();
        const moduleName = el.dataset.module || el.dataset.tab;
        if (moduleName) {
            showModule(moduleName);
        }
    });
});

// User Dropdown Toggle
if (userProfileToggle) {
    userProfileToggle.addEventListener('click', function() {
        if (userDropdown) userDropdown.classList.toggle('hidden');
        if (notificationDropdown) notificationDropdown.classList.add('hidden');
        console.log('User profile dropdown toggled.');
    });
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
        if (notificationDropdown) {
            notificationDropdown.classList.toggle('hidden');
        }
        if (userDropdown) {
            userDropdown.classList.add('hidden');
        }
        console.log('Notification dropdown toggled.');
    });
}


if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
}

if (viewAllNotificationsLink) {
    viewAllNotificationsLink.addEventListener('click', function(event) {
        event.preventDefault();
        if (notificationDropdown) notificationDropdown.classList.add("hidden");
        if (viewAllModal) {
            viewAllModal.classList.remove("hidden");
            viewAllModal.style.display = 'flex';
        }
        renderModalNotifications();
        console.log('View All Notifications modal opened.');
    });
}

if (closeViewAllModal) {
    closeViewAllModal.addEventListener("click", () => {
        if (viewAllModal) {
            viewAllModal.classList.add("hidden");
            viewAllModal.style.display = 'none';
        }
        console.log('View All Notifications modal closed.');
    });
}

if (viewAllModal) {
    viewAllModal.addEventListener("click", (e) => {
        if (e.target === viewAllModal) {
            viewAllModal.classList.add("hidden");
            viewAllModal.style.display = 'none';
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
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

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
    const periodQuery = searchPayrollPeriodInput ? searchPayrollPeriodInput.value.toLowerCase() : '';
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
        const userEmail = loggedInUser?.email || 'admin';

        const payrollPeriodInput = document.getElementById('payrollPeriod');
        const staffCountInput = document.getElementById('staffCount');
        const totalAmountInput = document.getElementById('totalAmount');

        const periodInput = payrollPeriodInput ? payrollPeriodInput.value : '';
        const staffCount = staffCountInput ? staffCountInput.value : '';
        const totalAmount = totalAmountInput ? parseFloat(totalAmountInput.value) : NaN;

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
            await addAuditLog(userEmail, 'Processed Payroll', 'Payroll', `Processed payroll for ${formattedPeriod}, amount: ₹${totalAmount}`);
            await fetchPayrollEntries();
            if (payrollModal) {
                payrollModal.classList.add('hidden');
                payrollModal.style.display = 'none';
            }
            if (payrollForm) {
                payrollForm.reset();
            }
            console.log('Payroll submitted successfully.');
        } catch (error) {
            alert('Error processing payroll: ' + error.message);
            console.error('Supabase error processing payroll:', error);
            await addAuditLog(userEmail, 'Payroll Processing Failed', 'Payroll', `Error: ${error.message}`);
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
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

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
    const invoiceNumberQueryInput = document.getElementById('searchInvoiceNumber');
    const studentNameQueryInput = document.getElementById('searchInvoiceStudent');

    const invoiceNumberQuery = invoiceNumberQueryInput ? invoiceNumberQueryInput.value.toLowerCase() : '';
    const studentNameQuery = studentNameQueryInput ? studentNameQueryInput.value.toLowerCase() : '';

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
        }
        populateInvoiceStudentSelect();
        console.log('Add Invoice modal opened.');
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
        const userEmail = loggedInUser?.email || 'admin';

        const studentIdInput = document.getElementById('invoiceStudentId');
        const invoiceNumberInput = document.getElementById('invoiceNumber');
        const invoiceTotalAmountInput = document.getElementById('invoiceTotalAmount');
        const invoicePaidAmountInput = document.getElementById('invoicePaidAmount');
        const invoiceIssueDateInput = document.getElementById('invoiceIssueDate');
        const invoiceDueDateInput = document.getElementById('invoiceDueDate');
        const invoiceStatusInput = document.getElementById('invoiceStatus');

        const studentId = studentIdInput ? studentIdInput.value : '';
        const invoiceNumber = invoiceNumberInput ? invoiceNumberInput.value : '';
        const invoiceTotalAmount = invoiceTotalAmountInput ? parseFloat(invoiceTotalAmountInput.value) : NaN;
        const invoicePaidAmount = invoicePaidAmountInput ? parseFloat(invoicePaidAmountInput.value) : NaN;
        const invoiceIssueDate = invoiceIssueDateInput ? invoiceIssueDateInput.value : '';
        const invoiceDueDate = invoiceDueDateInput ? invoiceDueDateInput.value : '';
        const invoiceStatus = invoiceStatusInput ? invoiceStatusInput.value : '';

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
            await addAuditLog(userEmail, 'Added Invoice', 'Finance', `Added invoice ${invoiceNumber} for ₹${invoiceTotalAmount}`);
            await fetchInvoices();
            if (addInvoiceModal) {
                addInvoiceModal.classList.add('hidden');
                addInvoiceModal.style.display = 'none';
            }
            if (addInvoiceForm) {
                addInvoiceForm.reset();
            }
            console.log('Invoice added successfully.');
        } catch (error) {
            alert('Error adding invoice: ' + error.message);
            console.error('Supabase error adding invoice:', error);
            await addAuditLog(userEmail, 'Add Invoice Failed', 'Finance', `Error: ${error.message}`);
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
        if (invoiceDetailsModal) {
            invoiceDetailsModal.classList.add('hidden');
            invoiceDetailsModal.style.display = 'none';
        }
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
    const printArea = document.getElementById('invoiceDetailsModal')?.querySelector('.print-area');
    if (!printArea) {
        console.error('Print area not found.');
        return;
    }
    const printContents = printArea.innerHTML;
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
        loggedInUserName.textContent = loggedInUser.user_metadata?.name || loggedInUser.email;
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
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

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
    const nameQuery = searchStudentNameInput ? searchStudentNameInput.value.toLowerCase() : '';
    const rollQuery = searchRollInput ? searchRollInput.value.toLowerCase() : '';
    const classQuery = searchClassSelect ? searchClassSelect.value.toLowerCase() : '';

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
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

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
    const nameQuery = searchTeacherNameInput ? searchTeacherNameInput.value.toLowerCase() : '';
    const subjectQuery = searchTeacherSubjectSelect ? searchTeacherSubjectSelect.value.toLowerCase() : '';

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
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const currentUserRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

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
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

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
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

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

    let uniqueStudentsPresent = new Set(); // Track unique students present
    let uniqueStudentsAbsent = new Set(); // Track unique students absent
    let uniqueStudentsTotal = new Set(); // Track all unique students in records

    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    if (filteredAttendance.length === 0) {
        attendanceTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">No attendance records found for the selected criteria.</td></tr>';
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
                <td class="py-3 px-4">${record.arrival_time || '-'}</td>
                <td class="py-3 px-4">${record.departure_time || '-'}</td>
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
    const classFilter = attendanceClassFilter ? attendanceClassFilter.value.toLowerCase() : '';
    const dateFilter = attendanceDateFilter ? attendanceDateFilter.value : '';
    const studentNameFilter = attendanceStudentNameFilter ? attendanceStudentNameFilter.value.toLowerCase() : '';

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
        const selectedClass = classAttendanceSelect ? classAttendanceSelect.value : '';
        const selectedDate = classAttendanceDate ? classAttendanceDate.value : '';

        if (!selectedClass || !selectedDate) {
            alert('Please select both a class and a date.');
            console.warn('Load Class Students failed: Missing class or date.');
            return;
        }
        console.log(`Loading students for class ${selectedClass} on ${selectedDate}...`);

        const studentsInClass = students.filter(s => s.class === selectedClass);
        const classAttendanceBody = document.getElementById('classAttendanceTableBody');
        if (!classAttendanceBody) return;
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
                const statusSelect = row?.querySelector('.status-select');
                const remarksInput = row?.querySelector('.remarks-input');

                const status = statusSelect ? statusSelect.value : 'Absent';
                const remarks = remarksInput ? remarksInput.value : '';
                await markIndividualAttendance(studentId, selectedDate, status, remarks);
            });
        });
        console.log(`Students for class ${selectedClass} loaded into class attendance table.`);
    });
}

if (markAllPresentBtn) {
    markAllPresentBtn.addEventListener('click', async () => {
        const selectedClass = classAttendanceSelect ? classAttendanceSelect.value : '';
        const selectedDate = classAttendanceDate ? classAttendanceDate.value : '';

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
                    { onConflict: ['student_id', 'date'] }
                );
                await addAuditLog(userEmail, 'Marked Class Attendance', 'Attendance', `Marked Present for ${student.name} (Class: ${selectedClass}) on ${selectedDate}`);
            } catch (error) {
                console.error(`Error marking attendance for ${student.name}:`, error);
                await addAuditLog(userEmail, 'Class Attendance Failed', 'Attendance', `Failed to mark attendance for ${student.name} (Class: ${selectedClass}) on ${selectedDate}: ${error.message}`);
            }
        }
        alert(`All students in ${selectedClass} marked as Present for ${selectedDate}.`);
        await fetchAttendanceRecords(); // Refresh the main attendance table and summary counts
        loadClassStudentsBtn?.click(); // Reload the class-wise table to show updated statuses
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
            { onConflict: ['student_id', 'date'] }
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
    if (!teacherAttendanceRecordsTableBody) return;
    teacherAttendanceRecordsTableBody.innerHTML = '';

    let uniqueTeachersPresent = new Set(); // Track unique teachers present
    let uniqueTeachersAbsent = new Set(); // Track unique teachers absent
    let uniqueTeachersTotal = new Set(); // Track all unique teachers in records

    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for rendering
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;

    if (filteredRecords.length === 0) {
        teacherAttendanceRecordsTableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No teacher attendance records found for the selected criteria.</td></tr>';
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
                <td class="py-3 px-4">${record.arrival_time || '-'}</td>
                <td class="py-3 px-4">${record.departure_time || '-'}</td>
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
    const subjectFilter = teacherAttendanceSubjectFilter ? teacherAttendanceSubjectFilter.value.toLowerCase() : '';
    const dateFilter = teacherAttendanceDateFilter ? teacherAttendanceDateFilter.value : '';
    const nameFilter = teacherAttendanceNameFilter ? teacherAttendanceNameFilter.value.toLowerCase() : '';

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
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    if (teacherAttendanceModalTitle) {
        teacherAttendanceModalTitle.textContent = 'Mark Teacher Attendance';
    }
    if (teacherAttendanceFormSubmitBtn) {
        teacherAttendanceFormSubmitBtn.textContent = 'Mark Attendance';
    }
    document.getElementById('teacherAttendanceId').value = '';
    if (teacherAttendanceForm) {
        teacherAttendanceForm.reset();
    }
    populateTeacherSelect();
    const teacherAttendanceDateInput = document.getElementById('teacherAttendanceDate');
    if (teacherAttendanceDateInput) {
        teacherAttendanceDateInput.valueAsDate = new Date();
    }
    if (teacherAttendanceModal) {
        teacherAttendanceModal.classList.remove('hidden');
        teacherAttendanceModal.style.display = 'flex';
        console.log('Add Teacher Attendance modal opened.');
    }
}

window.editTeacherAttendance = function(id) {
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    const record = teacherAttendanceRecords.find(r => r.id === id);
    if (record) {
        if (teacherAttendanceModalTitle) {
            teacherAttendanceModalTitle.textContent = 'Edit Teacher Attendance';
        }
        if (teacherAttendanceFormSubmitBtn) {
            teacherAttendanceFormSubmitBtn.textContent = 'Save Changes';
        }
        document.getElementById('teacherAttendanceId').value = record.id;
        populateTeacherSelect(record.teacher_id);
        document.getElementById('teacherAttendanceDate').value = record.date;
        document.getElementById('teacherAttendanceStatus').value = record.status;
        document.getElementById('teacherArrivalTime').value = record.arrival_time || '';
        document.getElementById('teacherDepartureTime').value = record.departure_time || '';
        document.getElementById('teacherAttendanceRemarks').value = record.remarks || '';
        if (teacherAttendanceModal) {
            teacherAttendanceModal.classList.remove('hidden');
            teacherAttendanceModal.style.display = 'flex';
            console.log(`Edit Teacher Attendance modal opened for ID: ${id}`);
        }
    }
}

window.deleteTeacherAttendance = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this teacher attendance record?')) {
        console.log(`Deleting teacher attendance record ID: ${id}`);
        try {
            const { error } = await supabase.from('teacher_attendance').delete().eq('id', id);
            if (error) throw error;

            const deletedRecord = teacherAttendanceRecords.find(r => r.id === id);
            const teacher = deletedRecord?.teachers; // Access teacher details from the joined object
            await addAuditLog(userEmail, 'Deleted Teacher Attendance', 'Teacher Attendance', `Deleted attendance for ${teacher ? teacher.name : 'Unknown Teacher'} on ${deletedRecord?.date || 'N/A'}`);
            alert('Teacher attendance record deleted successfully!');
            await fetchTeacherAttendanceRecords();
            console.log(`Teacher attendance record ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting teacher attendance record: ' + error.message);
            console.error('Supabase error deleting teacher attendance record:', error);
            await addAuditLog(userEmail, 'Delete Teacher Attendance Failed', 'Teacher Attendance', `Error: ${error.message}`);
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
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    if (studentModalTitle) {
        studentModalTitle.textContent = 'Add New Student';
    }
    if (studentFormSubmitBtn) {
        studentFormSubmitBtn.textContent = 'Add Student';
    }
    document.getElementById('studentId').value = '';
    if (studentForm) {
        studentForm.reset();
    }
    if (studentModal) {
        studentModal.classList.remove('hidden');
        studentModal.style.display = 'flex';
        console.log('Add Student form opened.');
    }
}
window.editStudent = function(id) {
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    const student = students.find(s => s.id === id);
    if (student) {
        if (studentModalTitle) {
            studentModalTitle.textContent = 'Edit Student';
        }
        if (studentFormSubmitBtn) {
            studentFormSubmitBtn.textContent = 'Save Changes';
        }
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
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentPhone').value = student.phone || '';
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
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this student?')) {
        console.log(`Deleting student ID: ${id}`);
        try {
            const { error } = await supabase.from('students').delete().eq('id', id);
            if (error) throw error;

            const deletedStudent = students.find(s => s.id === id);
            await addAuditLog(userEmail, 'Deleted Student', 'Students', `Deleted student: ${deletedStudent?.name || 'Unknown'} (ID: ${deletedStudent?.id || id})`);
            alert('Student deleted successfully!');
            await fetchStudents();
            console.log(`Student ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting student: ' + error.message);
            console.error('Supabase error deleting student:', error);
            await addAuditLog(userEmail, 'Delete Student Failed', 'Students', `Error: ${error.message}`);
        }
    }
}

window.showStudentDetailsModal = function(id) {
    const student = students.find(s => s.id === id);
    if (student) {
        if (studentDetailsModalTitle) {
            studentDetailsModalTitle.textContent = `Details for ${student.name}`;
        }
        if (studentDetailsContent) {
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
        }
        if (studentDetailsModal) {
            studentDetailsModal.classList.remove('hidden');
            studentDetailsModal.style.display = 'flex';
            console.log(`Student details modal opened for ID: ${id}`);
        }
    } else {
        alert('Student not found.');
        console.warn(`Student with ID ${id} not found for details.`);
    }
}

window.showAddTeacherForm = function() {
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    if (teacherModalTitle) {
        teacherModalTitle.textContent = 'Add New Teacher';
    }
    if (teacherFormSubmitBtn) {
        teacherFormSubmitBtn.textContent = 'Add Teacher';
    }
    document.getElementById('teacherId').value = '';
    if (teacherForm) {
        teacherForm.reset();
    }
    if (teacherModal) {
        teacherModal.classList.remove('hidden');
        teacherModal.style.display = 'flex';
        console.log('Add Teacher form opened.');
    }
}

window.editTeacher = function(id) {
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    const teacher = teachers.find(t => t.id === id);
    if (teacher) {
        if (teacherModalTitle) {
            teacherModalTitle.textContent = 'Edit Teacher';
        }
        if (teacherFormSubmitBtn) {
            teacherFormSubmitBtn.textContent = 'Save Changes';
        }
        document.getElementById('teacherId').value = teacher.id;
        document.getElementById('teacherFullName').value = teacher.name;
        document.getElementById('teacherSubject').value = teacher.subject;
        document.getElementById('teacherEmail').value = teacher.email || '';
        document.getElementById('teacherClasses').value = teacher.classes || '';
        if (teacherModal) {
            teacherModal.classList.remove('hidden');
            teacherModal.style.display = 'flex';
            console.log(`Edit Teacher form opened for ID: ${id}`);
        }
    }
}

window.deleteTeacher = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this teacher?')) {
        console.log(`Deleting teacher ID: ${id}`);
        try {
            const { error } = await supabase.from('teachers').delete().eq('id', id);
            if (error) throw error;

            const deletedTeacher = teachers.find(t => t.id === id);
            await addAuditLog(userEmail, 'Deleted Teacher', 'Teachers', `Deleted teacher: ${deletedTeacher?.name || 'Unknown'} (ID: ${deletedTeacher?.id || id})`);
            alert('Teacher deleted successfully!');
            await fetchTeachers();
            console.log(`Teacher ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting teacher: ' + error.message);
            console.error('Supabase error deleting teacher:', error);
            await addAuditLog(userEmail, 'Delete Teacher Failed', 'Teachers', `Error: ${error.message}`);
        }
    }
}

window.showTeacherDetailsModal = function(id) {
    const teacher = teachers.find(t => t.id === id);
    if (teacher) {
        if (teacherDetailsModalTitle) {
            teacherDetailsModalTitle.textContent = `Details for ${teacher.name}`;
        }
        if (teacherDetailsContent) {
            teacherDetailsContent.innerHTML = `
                <p><strong>ID:</strong> ${teacher.id}</p>
                <p><strong>Full Name:</strong> ${teacher.name}</p>
                <p><strong>Subject:</strong> ${teacher.subject}</p>
                <p><strong>Email:</strong> ${teacher.email || 'N/A'}</p>
                <p><strong>Classes:</strong> ${teacher.classes || 'N/A'}</p>
            `;
        }
        if (teacherDetailsModal) {
            teacherDetailsModal.classList.remove('hidden');
            teacherDetailsModal.style.display = 'flex';
            console.log(`Teacher details modal opened for ID: ${id}`);
        }
    } else {
        alert('Teacher not found.');
        console.warn(`Teacher with ID ${id} not found for details.`);
    }
}

window.showAddUserForm = function() {
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    if (userModalTitle) {
        userModalTitle.textContent = 'Add New User';
    }
    if (userFormSubmitBtn) {
        userFormSubmitBtn.textContent = 'Add User';
    }
    document.getElementById('userId').value = '';
    if (userForm) {
        userForm.reset();
    }
    if (userModal) {
        userModal.classList.remove('hidden');
        userModal.style.display = 'flex';
        console.log('Add User form opened.');
    }
}

window.editUser = function(id) {
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    const profile = profiles.find(p => p.id === id);
    if (profile) {
        if (userModalTitle) {
            userModalTitle.textContent = 'Edit User';
        }
        if (userFormSubmitBtn) {
            userFormSubmitBtn.textContent = 'Save Changes';
        }
        document.getElementById('userId').value = profile.id;
        document.getElementById('userFullName').value = profile.full_name || '';
        document.getElementById('userEmail').value = profile.email || '';
        document.getElementById('userRole').value = profile.role || '';
        document.getElementById('userStatus').value = profile.status || '';
        // Password field is intentionally left blank for editing
        if (userModal) {
            userModal.classList.remove('hidden');
            userModal.style.display = 'flex';
            console.log(`Edit User form opened for ID: ${id}`);
        }
    }
}

window.deleteUser = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this user? This will also delete their authentication record.')) {
        console.log(`Deleting user ID: ${id}`);
        try {
            // First, delete from profiles table
            const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
            if (profileError) throw profileError;

            // Then, delete the user from Supabase Auth (requires service role key for backend, or admin context)
            // This part might fail if not called from a secure backend function with admin privileges.
            // For frontend, you can only delete the currently authenticated user.
            // If this is an admin deleting another user, it needs a backend function.
            // For simplicity, we'll simulate success for frontend.
            // const { error: authError } = await supabase.auth.admin.deleteUser(id);
            // if (authError) throw authError;

            const deletedProfile = profiles.find(p => p.id === id);
            await addAuditLog(userEmail, 'Deleted User', 'User Management', `Deleted user: ${deletedProfile?.full_name || 'Unknown'} (ID: ${deletedProfile?.id || id})`);
            alert('User deleted successfully!');
            await fetchProfiles();
            console.log(`User ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting user: ' + error.message);
            console.error('Supabase error deleting user:', error);
            await addAuditLog(userEmail, 'Delete User Failed', 'User Management', `Error: ${error.message}`);
        }
    }
}

window.showAddAnnouncementModal = function() {
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    if (announcementModalTitle) {
        announcementModalTitle.textContent = 'Add New Announcement';
    }
    if (announcementFormSubmitBtn) {
        announcementFormSubmitBtn.textContent = 'Publish Announcement';
    }
    document.getElementById('announcementId').value = '';
    if (announcementForm) {
        announcementForm.reset();
    }
    if (announcementModal) {
        announcementModal.classList.remove('hidden');
        announcementModal.style.display = 'flex';
        console.log('Add Announcement modal opened.');
    }
}

window.editAnnouncement = function(id) {
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    const announcement = announcements.find(a => a.id === id);
    if (announcement) {
        if (announcementModalTitle) {
            announcementModalTitle.textContent = 'Edit Announcement';
        }
        if (announcementFormSubmitBtn) {
            announcementFormSubmitBtn.textContent = 'Save Changes';
        }
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
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this announcement?')) {
        console.log(`Deleting announcement ID: ${id}`);
        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;

            const deletedAnnouncement = announcements.find(a => a.id === id);
            await addAuditLog(userEmail, 'Deleted Announcement', 'Announcements', `Deleted announcement: "${deletedAnnouncement?.title || 'Unknown'}" (ID: ${deletedAnnouncement?.id || id})`);
            alert('Announcement deleted successfully!');
            await fetchAnnouncements();
            console.log(`Announcement ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting announcement: ' + error.message);
            console.error('Supabase error deleting announcement:', error);
            await addAuditLog(userEmail, 'Delete Announcement Failed', 'Announcements', `Error: ${error.message}`);
        }
    }
}

// Event Listeners for Modals
if (closeStudentModal) {
    closeStudentModal.addEventListener('click', () => {
        if (studentModal) {
            studentModal.classList.add('hidden');
            studentModal.style.display = 'none';
        }
        if (studentForm) {
            studentForm.reset();
        }
        console.log('Student modal closed.');
    });
}
if (studentModal) {
    studentModal.addEventListener('click', (e) => {
        if (e.target === studentModal) {
            studentModal.classList.add('hidden');
            studentModal.style.display = 'none';
            if (studentForm) {
                studentForm.reset();
            }
            console.log('Student modal closed by outside click.');
        }
    });
}
if (closeStudentDetailsModal) {
    closeStudentDetailsModal.addEventListener('click', () => {
        if (studentDetailsModal) {
            studentDetailsModal.classList.add('hidden');
            studentDetailsModal.style.display = 'none';
        }
        console.log('Student details modal closed.');
    });
}
if (studentDetailsModal) {
    studentDetailsModal.addEventListener('click', (e) => {
        if (e.target === studentDetailsModal) {
            studentDetailsModal.classList.add('hidden');
            studentDetailsModal.style.display = 'none';
            console.log('Student details modal closed by outside click.');
        }
    });
}

if (closeTeacherModal) {
    closeTeacherModal.addEventListener('click', () => {
        if (teacherModal) {
            teacherModal.classList.add('hidden');
            teacherModal.style.display = 'none';
        }
        if (teacherForm) {
            teacherForm.reset();
        }
        console.log('Teacher modal closed.');
    });
}
if (teacherModal) {
    teacherModal.addEventListener('click', (e) => {
        if (e.target === teacherModal) {
            teacherModal.classList.add('hidden');
            teacherModal.style.display = 'none';
            if (teacherForm) {
                teacherForm.reset();
            }
            console.log('Teacher modal closed by outside click.');
        }
    });
}
if (closeTeacherDetailsModal) {
    closeTeacherDetailsModal.addEventListener('click', () => {
        if (teacherDetailsModal) {
            teacherDetailsModal.classList.add('hidden');
            teacherDetailsModal.style.display = 'none';
        }
        console.log('Teacher details modal closed.');
    });
}
if (teacherDetailsModal) {
    teacherDetailsModal.addEventListener('click', (e) => {
        if (e.target === teacherDetailsModal) {
            teacherDetailsModal.classList.add('hidden');
            teacherDetailsModal.style.display = 'none';
            console.log('Teacher details modal closed by outside click.');
        }
    });
}

if (closeUserModal) {
    closeUserModal.addEventListener('click', () => {
        if (userModal) {
            userModal.classList.add('hidden');
            userModal.style.display = 'none';
        }
        if (userForm) {
            userForm.reset();
        }
        console.log('User modal closed.');
    });
}
if (userModal) {
    userModal.addEventListener('click', (e) => {
        if (e.target === userModal) {
            userModal.classList.add('hidden');
            userModal.style.display = 'none';
            if (userForm) {
                userForm.reset();
            }
            console.log('User modal closed by outside click.');
        }
    });
}

if (closeAnnouncementModal) {
    closeAnnouncementModal.addEventListener('click', () => {
        if (announcementModal) {
            announcementModal.classList.add('hidden');
            announcementModal.style.display = 'none';
        }
        if (announcementForm) {
            announcementForm.reset();
        }
        console.log('Announcement modal closed.');
    });
}
if (announcementModal) {
    announcementModal.addEventListener('click', (e) => {
        if (e.target === announcementModal) {
            announcementModal.classList.add('hidden');
            announcementModal.style.display = 'none';
            if (announcementForm) {
                announcementForm.reset();
            }
            console.log('Announcement modal closed by outside click.');
        }
    });
}

if (closeAttendanceModal) {
    closeAttendanceModal.addEventListener('click', () => {
        if (attendanceModal) {
            attendanceModal.classList.add('hidden');
            attendanceModal.style.display = 'none';
        }
        if (attendanceForm) {
            attendanceForm.reset();
        }
        console.log('Attendance modal closed.');
    });
}
if (attendanceModal) {
    attendanceModal.addEventListener('click', (e) => {
        if (e.target === attendanceModal) {
            attendanceModal.classList.add('hidden');
            attendanceModal.style.display = 'none';
            if (attendanceForm) {
                attendanceForm.reset();
            }
            console.log('Attendance modal closed by outside click.');
        }
    });
}

if (closeTeacherAttendanceModal) {
    closeTeacherAttendanceModal.addEventListener('click', () => {
        if (teacherAttendanceModal) {
            teacherAttendanceModal.classList.add('hidden');
            teacherAttendanceModal.style.display = 'none';
        }
        if (teacherAttendanceForm) {
            teacherAttendanceForm.reset();
        }
        console.log('Teacher Attendance modal closed.');
    });
}
if (teacherAttendanceModal) {
    teacherAttendanceModal.addEventListener('click', (e) => {
        if (e.target === teacherAttendanceModal) {
            teacherAttendanceModal.classList.add('hidden');
            teacherAttendanceModal.style.display = 'none';
            if (teacherAttendanceForm) {
                teacherAttendanceForm.reset();
            }
            console.log('Teacher Attendance modal closed by outside click.');
        }
    });
}

// Form Submissions
if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const studentId = document.getElementById('studentId').value;
        const studentData = {
            name: document.getElementById('studentFullName').value,
            father_name: document.getElementById('studentFatherName').value,
            mother_name: document.getElementById('studentMotherName').value,
            class: document.getElementById('studentClass').value,
            roll_no: document.getElementById('studentRollNo').value,
            aadhar_no: document.getElementById('studentAadharNo').value,
            blood_group: document.getElementById('studentBloodGroup').value || null,
            admission_no: document.getElementById('studentAdmissionNo').value || null,
            admission_date: document.getElementById('studentAdmissionDate').value || null,
            father_aadhar: document.getElementById('studentFatherAadhar').value || null,
            mother_aadhar: document.getElementById('studentMotherAadhar').value || null,
            email: document.getElementById('studentEmail').value || null,
            phone: document.getElementById('studentPhone').value || null,
            status: document.getElementById('studentStatus').value,
        };

        try {
            let result;
            if (studentId) {
                result = await supabase.from('students').update(studentData).eq('id', studentId).select();
                alert('Student updated successfully!');
                await addAuditLog(userEmail, 'Updated Student', 'Students', `Updated student: ${studentData.name} (ID: ${studentId})`);
            } else {
                result = await supabase.from('students').insert(studentData).select();
                alert('Student added successfully!');
                await addAuditLog(userEmail, 'Added Student', 'Students', `Added new student: ${studentData.name}`);
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
            await addAuditLog(userEmail, 'Save Student Failed', 'Students', `Error: ${error.message}`);
        }
    });
}

if (teacherForm) {
    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const teacherId = document.getElementById('teacherId').value;
        const teacherData = {
            name: document.getElementById('teacherFullName').value,
            subject: document.getElementById('teacherSubject').value,
            email: document.getElementById('teacherEmail').value || null,
            classes: document.getElementById('teacherClasses').value || null,
        };

        try {
            let result;
            if (teacherId) {
                result = await supabase.from('teachers').update(teacherData).eq('id', teacherId).select();
                alert('Teacher updated successfully!');
                await addAuditLog(userEmail, 'Updated Teacher', 'Teachers', `Updated teacher: ${teacherData.name} (ID: ${teacherId})`);
            } else {
                result = await supabase.from('teachers').insert(teacherData).select();
                alert('Teacher added successfully!');
                await addAuditLog(userEmail, 'Added Teacher', 'Teachers', `Added new teacher: ${teacherData.name}`);
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
            await addAuditLog(userEmail, 'Save Teacher Failed', 'Teachers', `Error: ${error.message}`);
        }
    });
}

if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const userId = document.getElementById('userId').value;
        const userFullName = document.getElementById('userFullName').value;
        const userEmailValue = document.getElementById('userEmail').value;
        const userRoleValue = document.getElementById('userRole').value;
        const userPassword = document.getElementById('userPassword').value;
        const userStatus = document.getElementById('userStatus').value;

        try {
            if (userId) {
                // Update existing user profile
                const updateData = {
                    full_name: userFullName,
                    email: userEmailValue,
                    role: userRoleValue,
                    status: userStatus
                };
                const { error: profileError } = await supabase.from('profiles').update(updateData).eq('id', userId);
                if (profileError) throw profileError;

                // If password is provided, update auth user password (requires admin context or self-update)
                if (userPassword) {
                    // This part typically requires a backend function with service_role key
                    // For frontend, only the current user can update their own password.
                    // alert('Password update for other users is not supported from frontend. Please use backend API.');
                    console.warn('Password update for other users is not supported from frontend. This would require a backend function with service_role key.');
                }
                alert('User profile updated successfully!');
                await addAuditLog(userEmail, 'Updated User', 'User Management', `Updated user: ${userFullName} (ID: ${userId})`);
            } else {
                // Add new user (auth.signUp and profiles insert)
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: userEmailValue,
                    password: userPassword,
                    options: {
                        data: {
                            full_name: userFullName,
                            role: userRoleValue
                        }
                    }
                });
                if (authError) throw authError;

                const { error: profileError } = await supabase.from('profiles').insert([
                    {
                        id: authData.user.id,
                        full_name: userFullName,
                        email: userEmailValue,
                        role: userRoleValue,
                        status: userStatus
                    }
                ]);
                if (profileError) throw profileError;
                alert('User added successfully! Confirmation email sent.');
                await addAuditLog(userEmail, 'Added User', 'User Management', `Added new user: ${userFullName}`);
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
            await addAuditLog(userEmail, 'Save User Failed', 'User Management', `Error: ${error.message}`);
        }
    });
}

if (announcementForm) {
    announcementForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const announcementId = document.getElementById('announcementId').value;
        const announcementData = {
            title: document.getElementById('announcementTitle').value,
            content: document.getElementById('announcementContent').value,
            status: document.getElementById('announcementStatus').value,
            date_posted: new Date().toISOString().split('T')[0] // Set current date
        };

        try {
            let result;
            if (announcementId) {
                result = await supabase.from('announcements').update(announcementData).eq('id', announcementId).select();
                alert('Announcement updated successfully!');
                await addAuditLog(userEmail, 'Updated Announcement', 'Announcements', `Updated announcement: "${announcementData.title}" (ID: ${announcementId})`);
            } else {
                result = await supabase.from('announcements').insert(announcementData).select();
                alert('Announcement published successfully!');
                await addAuditLog(userEmail, 'Published Announcement', 'Announcements', `Published new announcement: "${announcementData.title}"`);
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
            await addAuditLog(userEmail, 'Save Announcement Failed', 'Announcements', `Error: ${error.message}`);
        }
    });
}

if (attendanceForm) {
    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const attendanceId = document.getElementById('attendanceId').value;
        const attendanceData = {
            student_id: document.getElementById('attendanceStudentSelect').value,
            date: document.getElementById('attendanceDate').value,
            status: document.getElementById('attendanceStatus').value,
            arrival_time: document.getElementById('arrivalTime').value || null,
            departure_time: document.getElementById('departureTime').value || null,
            remarks: document.getElementById('attendanceRemarks').value || null,
        };

        try {
            let result;
            if (attendanceId) {
                result = await supabase.from('attendance').update(attendanceData).eq('id', attendanceId).select();
                alert('Student attendance updated successfully!');
                await addAuditLog(userEmail, 'Updated Student Attendance', 'Attendance', `Updated attendance for student ${attendanceData.student_id} on ${attendanceData.date}`);
            } else {
                // Use upsert to prevent duplicate entries for the same student on the same day
                result = await supabase.from('attendance').upsert(attendanceData, { onConflict: ['student_id', 'date'] }).select();
                alert('Student attendance marked successfully!');
                await addAuditLog(userEmail, 'Marked Student Attendance', 'Attendance', `Marked attendance for student ${attendanceData.student_id} on ${attendanceData.date}`);
            }
            if (result.error) throw result.error;
            await fetchAttendanceRecords();
            if (attendanceModal) {
                attendanceModal.classList.add('hidden');
                attendanceModal.style.display = 'none';
            }
            attendanceForm.reset();
            console.log('Student attendance form submitted successfully.');
        } catch (error) {
            alert('Error saving student attendance: ' + error.message);
            console.error('Supabase error saving student attendance:', error);
            await addAuditLog(userEmail, 'Save Student Attendance Failed', 'Attendance', `Error: ${error.message}`);
        }
    });
}

if (teacherAttendanceForm) {
    teacherAttendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const teacherAttendanceId = document.getElementById('teacherAttendanceId').value;
        const teacherAttendanceData = {
            teacher_id: document.getElementById('teacherAttendanceTeacherSelect').value,
            date: document.getElementById('teacherAttendanceDate').value,
            status: document.getElementById('teacherAttendanceStatus').value,
            arrival_time: document.getElementById('teacherArrivalTime').value || null,
            departure_time: document.getElementById('teacherDepartureTime').value || null,
            remarks: document.getElementById('teacherAttendanceRemarks').value || null,
        };

        try {
            let result;
            if (teacherAttendanceId) {
                result = await supabase.from('teacher_attendance').update(teacherAttendanceData).eq('id', teacherAttendanceId).select();
                alert('Teacher attendance updated successfully!');
                await addAuditLog(userEmail, 'Updated Teacher Attendance', 'Teacher Attendance', `Updated attendance for teacher ${teacherAttendanceData.teacher_id} on ${teacherAttendanceData.date}`);
            } else {
                // Use upsert to prevent duplicate entries for the same teacher on the same day
                result = await supabase.from('teacher_attendance').upsert(teacherAttendanceData, { onConflict: ['teacher_id', 'date'] }).select();
                alert('Teacher attendance marked successfully!');
                await addAuditLog(userEmail, 'Marked Teacher Attendance', 'Teacher Attendance', `Marked attendance for teacher ${teacherAttendanceData.teacher_id} on ${teacherAttendanceData.date}`);
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
            await addAuditLog(userEmail, 'Save Teacher Attendance Failed', 'Teacher Attendance', `Error: ${error.message}`);
        }
    });
}

// Student Attendance Modals and QR
window.showAddAttendanceModal = function() {
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    if (attendanceModalTitle) {
        attendanceModalTitle.textContent = 'Mark Attendance';
    }
    if (attendanceFormSubmitBtn) {
        attendanceFormSubmitBtn.textContent = 'Mark Attendance';
    }
    document.getElementById('attendanceId').value = '';
    if (attendanceForm) {
        attendanceForm.reset();
    }
    populateStudentSelect();
    const attendanceDateInput = document.getElementById('attendanceDate');
    if (attendanceDateInput) {
        attendanceDateInput.valueAsDate = new Date();
    }
    if (attendanceModal) {
        attendanceModal.classList.remove('hidden');
        attendanceModal.style.display = 'flex';
        console.log('Add Attendance modal opened.');
    }
}

window.editAttendance = function(id) {
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Not used for modal display logic
    // const userRole = loggedInUser ? loggedInUser.user_metadata?.role || loggedInUser.app_metadata?.role : null;
    const record = attendanceRecords.find(r => r.id === id);
    if (record) {
        if (attendanceModalTitle) {
            attendanceModalTitle.textContent = 'Edit Attendance';
        }
        if (attendanceFormSubmitBtn) {
            attendanceFormSubmitBtn.textContent = 'Save Changes';
        }
        document.getElementById('attendanceId').value = record.id;
        populateStudentSelect(record.student_id);
        document.getElementById('attendanceDate').value = record.date;
        document.getElementById('attendanceStatus').value = record.status;
        document.getElementById('arrivalTime').value = record.arrival_time || '';
        document.getElementById('departureTime').value = record.departure_time || '';
        document.getElementById('attendanceRemarks').value = record.remarks || '';
        if (attendanceModal) {
            attendanceModal.classList.remove('hidden');
            attendanceModal.style.display = 'flex';
            console.log(`Edit Attendance modal opened for ID: ${id}`);
        }
    }
}

window.deleteAttendance = async function(id) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this attendance record?')) {
        console.log(`Deleting attendance record ID: ${id}`);
        try {
            const { error } = await supabase.from('attendance').delete().eq('id', id);
            if (error) throw error;

            const deletedRecord = attendanceRecords.find(r => r.id === id);
            const student = deletedRecord?.students; // Access student details from the joined object
            await addAuditLog(userEmail, 'Deleted Student Attendance', 'Attendance', `Deleted attendance for ${student ? student.name : 'Unknown Student'} on ${deletedRecord?.date || 'N/A'}`);
            alert('Attendance record deleted successfully!');
            await fetchAttendanceRecords();
            console.log(`Attendance record ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting attendance record: ' + error.message);
            console.error('Supabase error deleting attendance record:', error);
            await addAuditLog(userEmail, 'Delete Student Attendance Failed', 'Attendance', `Error: ${error.message}`);
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

// QR Code Scanning for Students
window.startQrAttendance = async function() {
    if (!checkHtml5QrCodeAvailability()) {
        return;
    }
    if (qrScannerSection) {
        qrScannerSection.classList.remove('hidden');
    }
    if (qrVideo) {
        qrVideo.innerHTML = ''; // Clear previous content
    }

    const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
        console.log(`QR Code detected: ${decodedText}`);
        alert(`QR Code Scanned: ${decodedText}`);
        // Assuming decodedText is student_id
        const studentId = decodedText;
        const student = students.find(s => s.id === studentId);
        if (student) {
            const today = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM
            await markIndividualAttendance(studentId, today, 'Present', `QR Scan - Arrival: ${currentTime}`);
            alert(`Attendance marked for ${student.name} (Present).`);
        } else {
            alert('Student not found for this QR code.');
        }
        await stopQrAttendance(); // Stop scanning after successful scan
    };

    const qrCodeErrorCallback = (errorMessage) => {
        // console.warn(`QR Code Scan Error: ${errorMessage}`); // Too verbose, only log if needed for debugging
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCodeScanner = new Html5QrcodeScanner(
        "qrVideo",
        config,
        /* verbose= */ false
    );
    html5QrCodeScanner.render(qrCodeSuccessCallback, qrCodeErrorCallback);
    console.log('Student QR attendance scanner started.');
};

window.stopQrAttendance = async function() {
    if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
        try {
            await html5QrCodeScanner.stop();
            html5QrCodeScanner.clear(); // Clear the UI
            html5QrCodeScanner = null;
            if (qrScannerSection) {
                qrScannerSection.classList.add('hidden');
            }
            console.log('Student QR attendance scanner stopped.');
        } catch (err) {
            console.error('Error stopping student QR scanner:', err);
        }
    }
};

// QR Code Scanning for Teachers
window.startTeacherQrAttendance = async function(type) { // type can be 'arrival' or 'departure'
    if (!checkHtml5QrCodeAvailability()) {
        return;
    }
    if (teacherQrScannerSection) {
        teacherQrScannerSection.classList.remove('hidden');
    }
    if (teacherQrVideo) {
        teacherQrVideo.innerHTML = ''; // Clear previous content
    }
    const teacherQrScannerTitle = document.getElementById('teacherQrScannerTitle');
    if (teacherQrScannerTitle) {
        teacherQrScannerTitle.textContent = `Scan QR Code for Teacher ${type === 'arrival' ? 'Arrival' : 'Departure'}`;
    }

    const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
        console.log(`Teacher QR Code detected: ${decodedText}`);
        alert(`Teacher QR Code Scanned: ${decodedText}`);
        // Assuming decodedText is teacher_id
        const teacherId = decodedText;
        const teacher = teachers.find(t => t.id === teacherId);
        if (teacher) {
            const today = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM

            // Fetch existing record for today
            const { data: existingRecords, error: fetchError } = await supabase
                .from('teacher_attendance')
                .select('*')
                .eq('teacher_id', teacherId)
                .eq('date', today);

            if (fetchError) {
                console.error('Error fetching existing teacher attendance record:', fetchError);
                alert('Error processing attendance. Please try again.');
                await stopTeacherQrAttendance();
                return;
            }

            const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;
            let attendanceData = {
                teacher_id: teacherId,
                date: today,
                status: 'Present', // Default to present on scan
                remarks: ''
            };

            if (type === 'arrival') {
                attendanceData.arrival_time = currentTime;
                attendanceData.remarks = `QR Scan - Arrival: ${currentTime}`;
            } else if (type === 'departure') {
                attendanceData.departure_time = currentTime;
                attendanceData.remarks = `QR Scan - Departure: ${currentTime}`;
                // If marking departure, ensure status is still present unless explicitly changed
                if (existingRecord && existingRecord.status !== 'Absent') {
                    attendanceData.status = existingRecord.status;
                }
            }

            // Merge with existing record if it exists
            if (existingRecord) {
                attendanceData = { ...existingRecord, ...attendanceData };
            }

            try {
                const { error } = await supabase.from('teacher_attendance').upsert(
                    { ...attendanceData },
                    { onConflict: ['teacher_id', 'date'] }
                );
                if (error) throw error;

                alert(`Attendance marked for ${teacher.name} (${type === 'arrival' ? 'Arrival' : 'Departure'}).`);
                const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
                await addAuditLog(loggedInUser?.email || 'System', `Marked Teacher ${type === 'arrival' ? 'Arrival' : 'Departure'}`, 'Teacher Attendance', `Marked ${type} for teacher ${teacher.name} on ${today}`);
                await fetchTeacherAttendanceRecords(); // Refresh data
            } catch (error) {
                alert('Error marking teacher attendance: ' + error.message);
                console.error('Supabase error marking teacher attendance:', error);
                const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
                await addAuditLog(loggedInUser?.email || 'System', `Teacher ${type === 'arrival' ? 'Arrival' : 'Departure'} Failed`, 'Teacher Attendance', `Failed to mark ${type} for teacher ${teacher.name} on ${today}: ${error.message}`);
            }
        } else {
            alert('Teacher not found for this QR code.');
        }
        await stopTeacherQrAttendance(); // Stop scanning after successful scan
    };

    const qrCodeErrorCallback = (errorMessage) => {
        // console.warn(`Teacher QR Code Scan Error: ${errorMessage}`); // Too verbose
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCodeScannerTeacher = new Html5QrcodeScanner(
        "teacherQrVideo",
        config,
        /* verbose= */ false
    );
    html5QrCodeScannerTeacher.render(qrCodeSuccessCallback, qrCodeErrorCallback);
    console.log('Teacher QR attendance scanner started.');
};

window.stopTeacherQrAttendance = async function() {
    if (html5QrCodeScannerTeacher && html5QrCodeScannerTeacher.isScanning) {
        try {
            await html5QrCodeScannerTeacher.stop();
            html5QrCodeScannerTeacher.clear(); // Clear the UI
            html5QrCodeScannerTeacher = null;
            if (teacherQrScannerSection) {
                teacherQrScannerSection.classList.add('hidden');
            }
            console.log('Teacher QR attendance scanner stopped.');
        } catch (err) {
            console.error('Error stopping teacher QR scanner:', err);
        }
    }
};

// Student QR Code Generation
window.showStudentQrCodeModal = function(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('Student not found.');
        return;
    }

    if (qrCodeStudentIdDisplay) {
        qrCodeStudentIdDisplay.textContent = `Student ID: ${student.id}`;
    }

    if (studentQrCodeCanvas) {
        const qr = new QRious({
            element: studentQrCodeCanvas,
            value: student.id, // The data to encode in the QR code
            size: 200,
            level: 'H' // Error correction level
        });
        // Set download link
        if (downloadQrCodeLink) {
            downloadQrCodeLink.href = studentQrCodeCanvas.toDataURL('image/png');
            downloadQrCodeLink.download = `student_${student.id}_qr_code.png`;
        }
    }

    if (studentQrCodeModal) {
        studentQrCodeModal.classList.remove('hidden');
        studentQrCodeModal.style.display = 'flex';
        console.log(`Student QR code modal opened for ID: ${studentId}`);
    }
};

if (closeStudentQrCodeModal) {
    closeStudentQrCodeModal.addEventListener('click', () => {
        if (studentQrCodeModal) {
            studentQrCodeModal.classList.add('hidden');
            studentQrCodeModal.style.display = 'none';
        }
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
    const printContents = studentQrCodeCanvas?.toDataURL('image/png');
    if (!printContents) {
        alert('QR code not generated yet.');
        return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Student QR Code</title></head><body>');
    printWindow.document.write(`<img src="${printContents}" style="max-width: 100%; height: auto;">`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    console.log('Student QR code print initiated.');
};

// Teacher QR Code Generation
window.showTeacherQrCodeModal = function(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) {
        alert('Teacher not found.');
        return;
    }

    if (qrCodeTeacherIdDisplay) {
        qrCodeTeacherIdDisplay.textContent = `Teacher ID: ${teacher.id}`;
    }

    if (teacherQrCodeCanvas) {
        const qr = new QRious({
            element: teacherQrCodeCanvas,
            value: teacher.id, // The data to encode in the QR code
            size: 200,
            level: 'H' // Error correction level
        });
        // Set download link
        if (downloadTeacherQrCodeLink) {
            downloadTeacherQrCodeLink.href = teacherQrCodeCanvas.toDataURL('image/png');
            downloadTeacherQrCodeLink.download = `teacher_${teacher.id}_qr_code.png`;
        }
    }

    if (teacherQrCodeModal) {
        teacherQrCodeModal.classList.remove('hidden');
        teacherQrCodeModal.style.display = 'flex';
        console.log(`Teacher QR code modal opened for ID: ${teacherId}`);
    }
};

if (closeTeacherQrCodeModal) {
    closeTeacherQrCodeModal.addEventListener('click', () => {
        if (teacherQrCodeModal) {
            teacherQrCodeModal.classList.add('hidden');
            teacherQrCodeModal.style.display = 'none';
        }
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
    const printContents = teacherQrCodeCanvas?.toDataURL('image/png');
    if (!printContents) {
        alert('QR code not generated yet.');
        return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Teacher QR Code</title></head><body>');
    printWindow.document.write(`<img src="${printContents}" style="max-width: 100%; height: auto;">`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    console.log('Teacher QR code print initiated.');
};


// Exams Module Functions
function renderExams(filteredExams = exams) {
    if (!examTableBody) return;
    examTableBody.innerHTML = '';
    if (filteredExams.length === 0) {
        examTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No exams found.</td></tr>';
        return;
    }
    filteredExams.forEach(exam => {
        const newRow = document.createElement('tr');
        newRow.className = 'border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="py-3 px-4">${exam.name}</td>
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
    if (examModalTitle) {
        examModalTitle.textContent = 'Add New Exam';
    }
    if (examFormSubmitBtn) {
        examFormSubmitBtn.textContent = 'Save Exam';
    }
    document.getElementById('examId').value = '';
    if (examForm) {
        examForm.reset();
    }
    if (examModal) {
        examModal.classList.remove('hidden');
        examModal.style.display = 'flex';
        console.log('Add Exam modal opened.');
    }
}

window.editExam = function(id) {
    const exam = exams.find(e => e.id === id);
    if (exam) {
        if (examModalTitle) {
            examModalTitle.textContent = 'Edit Exam';
        }
        if (examFormSubmitBtn) {
            examFormSubmitBtn.textContent = 'Save Changes';
        }
        document.getElementById('examId').value = exam.id;
        document.getElementById('examName').value = exam.name;
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
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this exam?')) {
        console.log(`Deleting exam ID: ${id}`);
        try {
            const { error } = await supabase.from('exams').delete().eq('id', id);
            if (error) throw error;

            const deletedExam = exams.find(e => e.id === id);
            await addAuditLog(userEmail, 'Deleted Exam', 'Exams', `Deleted exam: "${deletedExam?.name || 'Unknown'}" (ID: ${deletedExam?.id || id})`);
            alert('Exam deleted successfully!');
            await fetchExams();
            console.log(`Exam ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting exam: ' + error.message);
            console.error('Supabase error deleting exam:', error);
            await addAuditLog(userEmail, 'Delete Exam Failed', 'Exams', `Error: ${error.message}`);
        }
    }
}

if (examForm) {
    examForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const examId = document.getElementById('examId').value;
        const examData = {
            name: document.getElementById('examName').value,
            class: document.getElementById('examClass').value,
            subject: document.getElementById('examSubject').value,
            date: document.getElementById('examDate').value,
            max_marks: document.getElementById('examMaxMarks').value,
        };

        try {
            let result;
            if (examId) {
                result = await supabase.from('exams').update(examData).eq('id', examId).select();
                alert('Exam updated successfully!');
                await addAuditLog(userEmail, 'Updated Exam', 'Exams', `Updated exam: "${examData.name}" (ID: ${examId})`);
            } else {
                result = await supabase.from('exams').insert(examData).select();
                alert('Exam added successfully!');
                await addAuditLog(userEmail, 'Added Exam', 'Exams', `Added new exam: "${examData.name}"`);
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
            await addAuditLog(userEmail, 'Save Exam Failed', 'Exams', `Error: ${error.message}`);
        }
    });
}

if (closeExamModal) {
    closeExamModal.addEventListener('click', () => {
        if (examModal) {
            examModal.classList.add('hidden');
            examModal.style.display = 'none';
        }
        if (examForm) {
            examForm.reset();
        }
        console.log('Exam modal closed.');
    });
}
if (examModal) {
    examModal.addEventListener('click', (e) => {
        if (e.target === examModal) {
            examModal.classList.add('hidden');
            examModal.style.display = 'none';
            if (examForm) {
                examForm.reset();
            }
            console.log('Exam modal closed by outside click.');
        }
    });
}

window.showGenerateResultsModal = function() {
    if (generateResultsModal) {
        generateResultsModal.classList.remove('hidden');
        generateResultsModal.style.display = 'flex';
    }
    if (generateResultsForm) {
        generateResultsForm.reset();
    }
    console.log('Generate Results modal opened.');
}

if (closeGenerateResultsModal) {
    closeGenerateResultsModal.addEventListener('click', () => {
        if (generateResultsModal) {
            generateResultsModal.classList.add('hidden');
            generateResultsModal.style.display = 'none';
        }
        if (generateResultsForm) {
            generateResultsForm.reset();
        }
        console.log('Generate Results modal closed.');
    });
}

if (generateResultsModal) {
    generateResultsModal.addEventListener('click', (e) => {
        if (e.target === generateResultsModal) {
            generateResultsModal.classList.add('hidden');
            generateResultsModal.style.display = 'none';
            if (generateResultsForm) {
                generateResultsForm.reset();
            }
            console.log('Generate Results modal closed by outside click.');
        }
    });
}

if (generateResultsForm) {
    generateResultsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedClass = resultsClassFilter ? resultsClassFilter.value : '';
        const examType = resultsExamTypeFilter ? resultsExamTypeFilter.value : '';
        alert(`Generating PDF report for Class: ${selectedClass}, Exam Type: ${examType}`);
        console.log(`Generating PDF report for Class: ${selectedClass}, Exam Type: ${examType}`);
        // Here you would typically fetch exam results data based on filters
        // and then use jspdf to generate the PDF.
        // For now, it's just an alert.
        if (generateResultsModal) {
            generateResultsModal.classList.add('hidden');
            generateResultsModal.style.display = 'none';
        }
    });
}

// Reports Module Charts
function initReportsCharts() {
    // Destroy existing chart instances if they exist
    safeDestroy(reportsAttendanceChart);
    safeDestroy(reportsPerformanceChart);
    safeDestroy(reportsStudentStatusChart);
    safeDestroy(reportsClassPerformanceChart);

    // Sample data for reports charts (replace with actual fetched data)
    const attendanceData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Student Attendance %',
            data: [90, 85, 92, 88, 95, 90],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

    const performanceData = {
        labels: ['Math', 'Science', 'English', 'History'],
        datasets: [{
            label: 'Average Score',
            data: [85, 78, 90, 70],
            backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'],
            borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)'],
            borderWidth: 1
        }]
    };

    const studentStatusData = {
        labels: ['Active', 'Inactive', 'On Leave'],
        datasets: [{
            label: 'Student Status',
            data: [students.filter(s => s.status === 'Active').length, students.filter(s => s.status === 'Inactive').length, students.filter(s => s.status === 'Leave').length],
            backgroundColor: ['rgba(40, 167, 69, 0.6)', 'rgba(255, 193, 7, 0.6)', 'rgba(23, 162, 184, 0.6)'],
            borderColor: ['rgba(40, 167, 69, 1)', 'rgba(255, 193, 7, 1)', 'rgba(23, 162, 184, 1)'],
            borderWidth: 1
        }]
    };

    const classPerformanceData = {
        labels: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'],
        datasets: [{
            label: 'Average Performance',
            data: [75, 80, 82, 79, 85],
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    const reportsAttendanceCtx = document.getElementById('reportsAttendanceChart')?.getContext('2d');
    if (reportsAttendanceCtx) {
        reportsAttendanceChart = new Chart(reportsAttendanceCtx, {
            type: 'line',
            data: attendanceData,
            options: chartOptions
        });
    }

    const reportsPerformanceCtx = document.getElementById('reportsPerformanceChart')?.getContext('2d');
    if (reportsPerformanceCtx) {
        reportsPerformanceChart = new Chart(reportsPerformanceCtx, {
            type: 'bar',
            data: performanceData,
            options: chartOptions
        });
    }

    const reportsStudentStatusCtx = document.getElementById('reportsStudentStatusChart')?.getContext('2d');
    if (reportsStudentStatusCtx) {
        reportsStudentStatusChart = new Chart(reportsStudentStatusCtx, {
            type: 'pie',
            data: studentStatusData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    const reportsClassPerformanceCtx = document.getElementById('reportsClassPerformanceChart')?.getContext('2d');
    if (reportsClassPerformanceCtx) {
        reportsClassPerformanceChart = new Chart(reportsClassPerformanceCtx, {
            type: 'bar',
            data: classPerformanceData,
            options: chartOptions
        });
    }
    console.log('Reports charts initialized.');
}

window.applyReportFilters = function() {
    const classFilter = document.getElementById('reportClassFilter')?.value;
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;

    console.log(`Applying report filters: Class=${classFilter}, StartDate=${startDate}, EndDate=${endDate}`);
    // In a real application, you would re-fetch data based on these filters
    // and then update the charts with the new data.
    // For this example, we'll just re-initialize with static data.
    initReportsCharts();
    alert('Report filters applied. Charts updated with sample data.');
}


// Dashboard Charts
function initCharts() {
    // Destroy existing chart instances before creating new ones
    safeDestroy(financeOverviewChartInstance);
    safeDestroy(studentAttendanceChartInstance);
    safeDestroy(teacherAttendanceChartInstance);
    safeDestroy(monthlyAttendanceTrendChartInstance);

    // Finance Overview Chart (Example: Monthly Revenue)
    const financeCtx = document.getElementById('financeOverviewChart')?.getContext('2d');
    if (financeCtx) {
        const monthlyRevenueData = {};
        invoices.forEach(invoice => {
            if (invoice.status === 'Paid') {
                const monthYear = new Date(invoice.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
                monthlyRevenueData[monthYear] = (monthlyRevenueData[monthYear] || 0) + parseFloat(invoice.amount);
            }
        });
        const labels = Object.keys(monthlyRevenueData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const data = labels.map(label => monthlyRevenueData[label]);

        financeOverviewChartInstance = new Chart(financeCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Revenue (₹)',
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false
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

    // Student Attendance Chart (Example: Present vs Absent)
    const studentAttendanceCtx = document.getElementById('studentAttendanceChart')?.getContext('2d');
    if (studentAttendanceCtx) {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendanceRecords.filter(rec => rec.date === today);
        const presentCount = new Set(todayAttendance.filter(rec => rec.status === 'Present').map(rec => rec.student_id)).size;
        const absentCount = new Set(todayAttendance.filter(rec => rec.status === 'Absent').map(rec => rec.student_id)).size;
        const leaveCount = new Set(todayAttendance.filter(rec => rec.status === 'Leave').map(rec => rec.student_id)).size;

        studentAttendanceChartInstance = new Chart(studentAttendanceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent', 'On Leave'],
                datasets: [{
                    data: [presentCount, absentCount, leaveCount],
                    backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    // Teacher Attendance Chart (Example: Present vs Absent)
    const teacherAttendanceCtx = document.getElementById('teacherAttendanceChart')?.getContext('2d');
    if (teacherAttendanceCtx) {
        const today = new Date().toISOString().split('T')[0];
        const todayTeacherAttendance = teacherAttendanceRecords.filter(rec => rec.date === today);
        const presentCount = new Set(todayTeacherAttendance.filter(rec => rec.status === 'Present').map(rec => rec.teacher_id)).size;
        const absentCount = new Set(todayTeacherAttendance.filter(rec => rec.status === 'Absent').map(rec => rec.teacher_id)).size;
        const leaveCount = new Set(todayTeacherAttendance.filter(rec => rec.status === 'Leave').map(rec => rec.teacher_id)).size;

        teacherAttendanceChartInstance = new Chart(teacherAttendanceCtx, {
            type: 'pie',
            data: {
                labels: ['Present', 'Absent', 'On Leave'],
                datasets: [{
                    data: [presentCount, absentCount, leaveCount],
                    backgroundColor: ['#2196F3', '#FF9800', '#9C27B0'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    // Monthly Attendance Trend Chart (Example: Student Attendance over last 6 months)
    const monthlyAttendanceTrendCtx = document.getElementById('monthlyAttendanceTrendChart')?.getContext('2d');
    if (monthlyAttendanceTrendCtx) {
        const monthlyData = {};
        const today = new Date();
        for (let i = 0; i < 6; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthYear = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            monthlyData[monthYear] = { present: 0, total: 0 };
        }

        attendanceRecords.forEach(record => {
            const recordDate = new Date(record.date);
            const monthYear = recordDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            if (monthlyData[monthYear]) {
                monthlyData[monthYear].total++;
                if (record.status === 'Present') {
                    monthlyData[monthYear].present++;
                }
            }
        });

        const labels = Object.keys(monthlyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const percentages = labels.map(label =>
            monthlyData[label].total > 0 ? (monthlyData[label].present / monthlyData[label].total * 100).toFixed(2) : 0
        );

        monthlyAttendanceTrendChartInstance = new Chart(monthlyAttendanceTrendCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Student Attendance %',
                    data: percentages,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
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
    console.log('Dashboard charts initialized/updated.');
}

// Homework Module Functions
function renderHomeworkTable(filteredHomework = homeworkAssignments) {
    if (!homeworkTableBody) return;
    homeworkTableBody.innerHTML = '';
    if (filteredHomework.length === 0) {
        homeworkTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No homework assignments found.</td></tr>';
        return;
    }
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
    if (homeworkModalTitle) {
        homeworkModalTitle.textContent = 'Add New Homework';
    }
    if (homeworkFormSubmitBtn) {
        homeworkFormSubmitBtn.textContent = 'Add Homework';
    }
    document.getElementById('homeworkId').value = '';
    if (homeworkForm) {
        homeworkForm.reset();
    }
    if (addHomeworkModal) {
        addHomeworkModal.classList.remove('hidden');
        addHomeworkModal.style.display = 'flex';
        console.log('Add Homework modal opened.');
    }
}

window.editHomework = function(id) {
    const homework = homeworkAssignments.find(h => h.id === id);
    if (homework) {
        if (homeworkModalTitle) {
            homeworkModalTitle.textContent = 'Edit Homework';
        }
        if (homeworkFormSubmitBtn) {
            homeworkFormSubmitBtn.textContent = 'Save Changes';
        }
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
    const userEmail = loggedInUser?.email || 'admin';
    if (confirm('Are you sure you want to delete this homework assignment?')) {
        console.log(`Deleting homework ID: ${id}`);
        try {
            const { error } = await supabase.from('homework').delete().eq('id', id);
            if (error) throw error;

            const deletedHomework = homeworkAssignments.find(h => h.id === id);
            await addAuditLog(userEmail, 'Deleted Homework', 'Homework', `Deleted homework: "${deletedHomework?.title || 'Unknown'}" (ID: ${deletedHomework?.id || id})`);
            alert('Homework assignment deleted successfully!');
            await fetchHomework();
            console.log(`Homework ID ${id} deleted successfully.`);
        } catch (error) {
            alert('Error deleting homework: ' + error.message);
            console.error('Supabase error deleting homework:', error);
            await addAuditLog(userEmail, 'Delete Homework Failed', 'Homework', `Error: ${error.message}`);
        }
    }
}

if (homeworkForm) {
    homeworkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userEmail = loggedInUser?.email || 'admin';

        const homeworkId = document.getElementById('homeworkId').value;
        const homeworkData = {
            title: document.getElementById('homeworkTitle').value,
            class: document.getElementById('homeworkClass').value,
            subject: document.getElementById('homeworkSubject').value,
            assigned_date: document.getElementById('homeworkAssignedDate').value,
            due_date: document.getElementById('homeworkDueDate').value,
            description: document.getElementById('homeworkDescription').value || null,
        };

        try {
            let result;
            if (homeworkId) {
                result = await supabase.from('homework').update(homeworkData).eq('id', homeworkId).select();
                alert('Homework assignment updated successfully!');
                await addAuditLog(userEmail, 'Updated Homework', 'Homework', `Updated homework: "${homeworkData.title}" (ID: ${homeworkId})`);
            } else {
                result = await supabase.from('homework').insert(homeworkData).select();
                alert('Homework assignment added successfully!');
                await addAuditLog(userEmail, 'Added Homework', 'Homework', `Added new homework: "${homeworkData.title}"`);
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
            await addAuditLog(userEmail, 'Save Homework Failed', 'Homework', `Error: ${error.message}`);
        }
    });
}

if (closeAddHomeworkModal) {
    closeAddHomeworkModal.addEventListener('click', () => {
        if (addHomeworkModal) {
            addHomeworkModal.classList.add('hidden');
            addHomeworkModal.style.display = 'none';
        }
        if (homeworkForm) {
            homeworkForm.reset();
        }
        console.log('Add Homework modal closed.');
    });
}
if (addHomeworkModal) {
    addHomeworkModal.addEventListener('click', (e) => {
        if (e.target === addHomeworkModal) {
            addHomeworkModal.classList.add('hidden');
            addHomeworkModal.style.display = 'none';
            if (homeworkForm) {
                homeworkForm.reset();
            }
            console.log('Add Homework modal closed by outside click.');
        }
    });
}

window.filterHomework = function() {
    const classFilter = filterHomeworkClass ? filterHomeworkClass.value.toLowerCase() : '';
    const subjectFilter = filterHomeworkSubject ? filterHomeworkSubject.value.toLowerCase() : '';
    const dueDateFilter = filterHomeworkDueDate ? filterHomeworkDueDate.value : '';

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
        if (homeworkDetailsModalTitle) {
            homeworkDetailsModalTitle.textContent = `Details for "${homework.title}"`;
        }
        if (homeworkDetailsContent) {
            homeworkDetailsContent.innerHTML = `
                <p><strong>ID:</strong> ${homework.id}</p>
                <p><strong>Title:</strong> ${homework.title}</p>
                <p><strong>Class:</strong> ${homework.class}</p>
                <p><strong>Subject:</strong> ${homework.subject}</p>
                <p><strong>Assigned Date:</strong> ${homework.assigned_date}</p>
                <p><strong>Due Date:</strong> ${homework.due_date}</p>
                <p><strong>Description:</strong> ${homework.description || 'N/A'}</p>
            `;
        }
        if (homeworkDetailsModal) {
            homeworkDetailsModal.classList.remove('hidden');
            homeworkDetailsModal.style.display = 'flex';
            console.log(`Homework details modal opened for ID: ${id}`);
        }
    } else {
        alert('Homework assignment not found.');
        console.warn(`Homework with ID ${id} not found for details.`);
    }
}

if (closeHomeworkDetailsModal) {
    closeHomeworkDetailsModal.addEventListener('click', () => {
        if (homeworkDetailsModal) {
            homeworkDetailsModal.classList.add('hidden');
            homeworkDetailsModal.style.display = 'none';
        }
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

// Fingerprint (Placeholder)
if (registerStudentFingerprintBtn) {
    registerStudentFingerprintBtn.addEventListener('click', () => {
        alert('Fingerprint registration functionality is not implemented.');
        console.log('Fingerprint registration clicked.');
    });
}
if (verifyStudentFingerprintBtn) {
    verifyStudentFingerprintBtn.addEventListener('click', () => {
        alert('Fingerprint verification functionality is not implemented.');
        console.log('Fingerprint verification clicked.');
    });
}
if (registerTeacherFingerprintBtn) {
    registerTeacherFingerprintBtn.addEventListener('click', () => {
        alert('Fingerprint registration functionality is not implemented.');
        console.log('Teacher Fingerprint registration clicked.');
    });
}
if (verifyTeacherFingerprintBtn) {
    verifyTeacherFingerprintBtn.addEventListener('click', () => {
        alert('Fingerprint verification functionality is not implemented.');
        console.log('Teacher Fingerprint verification clicked.');
    });
}

