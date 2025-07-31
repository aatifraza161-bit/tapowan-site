// Merged and Fixed script.js

// --- Global Variables ---

let notifications = [];
let profiles = []; // Renamed from 'users' to match Supabase 'profiles' table
let announcements = [];
let students = [];
let teachers = [];
let payrollEntries = [];
let invoices = [];
let studentAttendanceRecords = [];
let teacherAttendanceRecords = [];
let schoolEvents = [];
let holidays = []; // Static holiday data
let auditLogs = [];
let backups = []; // Simulated backups

// Supabase Client Initialization (Replace with your actual keys)
const SUPABASE_URL = 'https://wjmvgdaoehgymnhzqeuv.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbXZnZGFvZWhneW1uaHpxZXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzM2ODgsImV4cCI6MjA2OTQ0OTY4OH0.NnrLIIu3e8DrkjcKtexZs50kV0kPYH25Oz7dc_lsiDA'; // Replace with your actual Supabase Anon Key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Chart.js instances
let attendanceChartInstance = null;
let performanceChartInstance = null;

// FullCalendar instance
let calendar;

// --- DOM Element References ---
let loginUi, schoolSiteUi, loginForm, emailInput, passwordInput, selectedRoleInput, roleButtons,
    forgotPasswordLink, forgotPasswordModal, closeForgotPasswordModal, forgotPasswordForm, forgotEmailInput, typedWelcome,
    navItems, moduleTabs, modulesContainer, currentModuleTitle, loggedInUserName, userProfileToggle, userDropdown, logoutButton,
    notificationButton, notificationCount, notificationDropdown, notificationList, newCount, markAllReadBtn,
    viewAllNotificationsLink, viewAllModal, closeViewAllModal, viewAllNotificationList, modalMarkAllReadBtn,
    darkModeToggle, totalStudentsCount, totalTeachersCount, monthlyRevenue, upcomingEventsCount, recentActivityList,
    profileModule, profileForm, profilePictureInput, profilePicturePreview, fullNameInput, profileEmailInput, roleSelect, phoneInput, addressTextarea,
    userManagementModule, userTableBody, userModal, userModalTitle, closeUserModal, userForm, userIdInput, userFullNameInput, userEmailInput, userRoleSelect, userPasswordInput, userStatusSelect, userFormSubmitBtn,
    announcementsModule, announcementTableBody, announcementModal, announcementModalTitle, closeAnnouncementModal, announcementForm, announcementIdInput, announcementTitleInput, announcementContentTextarea, announcementStatusSelect, announcementFormSubmitBtn,
    studentsModule, studentTableBody, studentModal, studentModalTitle, closeStudentModal, studentForm, studentIdInput, studentFullNameInput, studentFatherNameInput, studentMotherNameInput, studentClassSelect, studentRollNoInput, studentAadharNoInput, studentEmailInput, studentPhoneInput, studentStatusSelect, studentFormSubmitBtn, searchRollInput, searchClassSelect, applySearchButton,
    teachersModule, teacherTableBody, teacherModal, teacherModalTitle, closeTeacherModal, teacherForm, teacherIdInput, teacherFullNameInput, teacherSubjectSelect, teacherEmailInput, teacherClassesInput, teacherFormSubmitBtn,
    payrollModule, payrollTableBody, openPayrollModalBtn, payrollModal, closePayrollModalBtn, payrollForm, payrollPeriodInput, staffCountInput, totalAmountInput,
    financeModule, financeTableBody, openAddInvoiceModalBtn, addInvoiceModal, closeAddInvoiceModalBtn, addInvoiceForm, invoiceNumberInput, invoiceDateInput, invoiceAmountInput, invoiceStatusSelect,
    attendanceModule, attendanceTableBody, attendanceModal, attendanceModalTitle, closeAttendanceModal, attendanceForm, attendanceIdInput, attendanceStudentSelect, attendanceDateInput, attendanceStatusSelect, attendanceRemarksTextarea, attendanceFormSubmitBtn, attendanceStudentNameFilter, attendanceClassFilter, attendanceDateFilter, applyAttendanceFilter, attendanceTotalStudents, attendanceTotalPresent, attendanceTotalAbsent, registerStudentFingerprintBtn, verifyStudentFingerprintBtn,
    teacherAttendanceModule, teacherAttendanceTableBody, teacherAttendanceModal, teacherAttendanceModalTitle, closeTeacherAttendanceModal, teacherAttendanceForm, teacherAttendanceIdInput, teacherAttendanceTeacherSelect, teacherAttendanceDateInput, teacherAttendanceStatusSelect, teacherAttendanceRemarksTextarea, teacherAttendanceFormSubmitBtn, teacherAttendanceNameFilter, teacherAttendanceSubjectFilter, teacherAttendanceDateFilter, applyTeacherAttendanceFilter, teacherAttendanceTotalTeachers, teacherAttendanceTotalPresent, teacherAttendanceTotalAbsent, registerTeacherFingerprintBtn, verifyTeacherFingerprintBtn,
    calendarModule, fullCalendarEl, holidayListContainer, reportsModule;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DOM element references
    loginUi = document.getElementById('login-ui');
    schoolSiteUi = document.getElementById('school-site-ui');
    loginForm = document.getElementById('loginForm');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    selectedRoleInput = document.getElementById('selectedRole');
    roleButtons = document.querySelectorAll('.role-button');
    forgotPasswordLink = document.getElementById('forgotPasswordLink');
    forgotPasswordModal = document.getElementById('forgotPasswordModal');
    closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
    forgotPasswordForm = document.getElementById('forgotPasswordForm');
    forgotEmailInput = document.getElementById('forgotEmail');
    typedWelcome = document.getElementById('typed-welcome');

    navItems = document.querySelectorAll('.nav-item');
    moduleTabs = document.getElementById('moduleTabs');
    modulesContainer = document.getElementById('modulesContainer');
    currentModuleTitle = document.getElementById('currentModuleTitle');
    loggedInUserName = document.getElementById('loggedInUserName');
    userProfileToggle = document.getElementById('userProfileToggle');
    userDropdown = document.getElementById('userDropdown');
    logoutButton = document.getElementById('logoutButton');

    notificationButton = document.getElementById('notificationButton');
    notificationCount = document.getElementById('notificationCount');
    notificationDropdown = document.getElementById('notificationDropdown');
    notificationList = document.getElementById('notificationList');
    newCount = document.getElementById('newCount');
    markAllReadBtn = document.getElementById('markAllReadBtn');
    viewAllNotificationsLink = document.getElementById('viewAllNotificationsLink');
    viewAllModal = document.getElementById('viewAllModal');
    closeViewAllModal = document.getElementById('closeViewAllModal');
    viewAllNotificationList = document.getElementById('viewAllNotificationList');
    modalMarkAllReadBtn = document.getElementById('modalMarkAllReadBtn');

    darkModeToggle = document.getElementById('darkModeToggle');

    // Dashboard Stats
    totalStudentsCount = document.getElementById('totalStudentsCount');
    totalTeachersCount = document.getElementById('totalTeachersCount');
    monthlyRevenue = document.getElementById('monthlyRevenue');
    upcomingEventsCount = document.getElementById('upcomingEventsCount');
    recentActivityList = document.getElementById('recentActivityList');

    // Profile Module
    profileModule = document.getElementById('profileModule');
    profileForm = document.getElementById('profileForm');
    profilePictureInput = document.getElementById('profilePicture');
    profilePicturePreview = document.getElementById('profilePicturePreview');
    fullNameInput = document.getElementById('fullName');
    profileEmailInput = document.getElementById('profileEmail'); // Corrected ID
    roleSelect = document.getElementById('role');
    phoneInput = document.getElementById('phone');
    addressTextarea = document.getElementById('address');

    // User Management Module
    userManagementModule = document.getElementById('user-managementModule');
    userTableBody = document.getElementById('userTableBody');
    userModal = document.getElementById('userModal');
    userModalTitle = document.getElementById('userModalTitle');
    closeUserModal = document.getElementById('closeUserModal');
    userForm = document.getElementById('userForm');
    userIdInput = document.getElementById('userId');
    userFullNameInput = document.getElementById('userFullName');
    userEmailInput = document.getElementById('userEmail');
    userRoleSelect = document.getElementById('userRole');
    userPasswordInput = document.getElementById('userPassword');
    userStatusSelect = document.getElementById('userStatus');
    userFormSubmitBtn = document.getElementById('userFormSubmitBtn');

    // Announcements Module
    announcementsModule = document.getElementById('announcementsModule');
    announcementTableBody = document.getElementById('announcementTableBody');
    announcementModal = document.getElementById('announcementModal');
    announcementModalTitle = document.getElementById('announcementModalTitle');
    closeAnnouncementModal = document.getElementById('closeAnnouncementModal');
    announcementForm = document.getElementById('announcementForm');
    announcementIdInput = document.getElementById('announcementId');
    announcementTitleInput = document.getElementById('announcementTitle');
    announcementContentTextarea = document.getElementById('announcementContent');
    announcementStatusSelect = document.getElementById('announcementStatus');
    announcementFormSubmitBtn = document.getElementById('announcementFormSubmitBtn');

    // Students Module
    studentsModule = document.getElementById('studentsModule');
    studentTableBody = document.getElementById('studentTableBody');
    studentModal = document.getElementById('studentModal');
    studentModalTitle = document.getElementById('studentModalTitle');
    closeStudentModal = document.getElementById('closeStudentModal');
    studentForm = document.getElementById('studentForm');
    studentIdInput = document.getElementById('studentId');
    studentFullNameInput = document.getElementById('studentFullName');
    studentFatherNameInput = document.getElementById('studentFatherName');
    studentMotherNameInput = document.getElementById('studentMotherName');
    studentClassSelect = document.getElementById('studentClass');
    studentRollNoInput = document.getElementById('studentRollNo');
    studentAadharNoInput = document.getElementById('studentAadharNo');
    studentEmailInput = document.getElementById('studentEmail');
    studentPhoneInput = document.getElementById('studentPhone');
    studentStatusSelect = document.getElementById('studentStatus');
    studentFormSubmitBtn = document.getElementById('studentFormSubmitBtn');
    searchRollInput = document.getElementById('searchRoll');
    searchClassSelect = document.getElementById('searchClass');
    applySearchButton = document.getElementById('applySearch');

    // Teachers Module
    teachersModule = document.getElementById('teachersModule');
    teacherTableBody = document.getElementById('teacherTableBody');
    teacherModal = document.getElementById('teacherModal');
    teacherModalTitle = document.getElementById('teacherModalTitle');
    closeTeacherModal = document.getElementById('closeTeacherModal');
    teacherForm = document.getElementById('teacherForm');
    teacherIdInput = document.getElementById('teacherId');
    teacherFullNameInput = document.getElementById('teacherFullName');
    teacherSubjectSelect = document.getElementById('teacherSubject');
    teacherEmailInput = document.getElementById('teacherEmail');
    teacherClassesInput = document.getElementById('teacherClasses');
    teacherFormSubmitBtn = document.getElementById('teacherFormSubmitBtn');

    // Payroll Module
    payrollModule = document.getElementById('payrollModule');
    payrollTableBody = document.getElementById('payrollTableBody');
    openPayrollModalBtn = document.getElementById('openPayrollModalBtn');
    payrollModal = document.getElementById('payrollModal');
    closePayrollModalBtn = document.getElementById('closePayrollModalBtn');
    payrollForm = document.getElementById('payrollForm');
    payrollPeriodInput = document.getElementById('payrollPeriod');
    staffCountInput = document.getElementById('staffCount');
    totalAmountInput = document.getElementById('totalAmount');

    // Finance Module
    financeModule = document.getElementById('financeModule');
    financeTableBody = document.getElementById('financeTableBody');
    openAddInvoiceModalBtn = document.getElementById('openAddInvoiceModalBtn');
    addInvoiceModal = document.getElementById('addInvoiceModal');
    closeAddInvoiceModalBtn = document.getElementById('closeAddInvoiceModalBtn');
    addInvoiceForm = document.getElementById('addInvoiceForm');
    invoiceNumberInput = document.getElementById('invoiceNumber');
    invoiceDateInput = document.getElementById('invoiceDate');
    invoiceAmountInput = document.getElementById('invoiceAmount');
    invoiceStatusSelect = document.getElementById('invoiceStatus');

    // Attendance Module
    attendanceModule = document.getElementById('attendanceModule');
    attendanceTableBody = document.getElementById('attendanceTableBody');
    attendanceModal = document.getElementById('attendanceModal');
    attendanceModalTitle = document.getElementById('attendanceModalTitle');
    closeAttendanceModal = document.getElementById('closeAttendanceModal');
    attendanceForm = document.getElementById('attendanceForm');
    attendanceIdInput = document.getElementById('attendanceId');
    attendanceStudentSelect = document.getElementById('attendanceStudentSelect');
    attendanceDateInput = document.getElementById('attendanceDate');
    attendanceStatusSelect = document.getElementById('attendanceStatus');
    attendanceRemarksTextarea = document.getElementById('attendanceRemarks');
    attendanceFormSubmitBtn = document.getElementById('attendanceFormSubmitBtn');
    attendanceStudentNameFilter = document.getElementById('attendanceStudentNameFilter');
    attendanceClassFilter = document.getElementById('attendanceClassFilter');
    attendanceDateFilter = document.getElementById('attendanceDateFilter');
    applyAttendanceFilter = document.getElementById('applyAttendanceFilter');
    attendanceTotalStudents = document.getElementById('attendanceTotalStudents');
    attendanceTotalPresent = document.getElementById('attendanceTotalPresent');
    attendanceTotalAbsent = document.getElementById('attendanceTotalAbsent');
    registerStudentFingerprintBtn = document.getElementById('registerStudentFingerprintBtn');
    verifyStudentFingerprintBtn = document.getElementById('verifyStudentFingerprintBtn');

    // Teacher Attendance Module
    teacherAttendanceModule = document.getElementById('teacher-attendanceModule');
    teacherAttendanceTableBody = document.getElementById('teacherAttendanceTableBody');
    teacherAttendanceModal = document.getElementById('teacherAttendanceModal');
    teacherAttendanceModalTitle = document.getElementById('teacherAttendanceModalTitle');
    closeTeacherAttendanceModal = document.getElementById('closeTeacherAttendanceModal');
    teacherAttendanceForm = document.getElementById('teacherAttendanceForm');
    teacherAttendanceIdInput = document.getElementById('teacherAttendanceId');
    teacherAttendanceTeacherSelect = document.getElementById('teacherAttendanceTeacherSelect');
    teacherAttendanceDateInput = document.getElementById('teacherAttendanceDate');
    teacherAttendanceStatusSelect = document.getElementById('teacherAttendanceStatus');
    teacherAttendanceRemarksTextarea = document.getElementById('teacherAttendanceRemarks');
    teacherAttendanceFormSubmitBtn = document.getElementById('teacherAttendanceFormSubmitBtn');
    teacherAttendanceNameFilter = document.getElementById('teacherAttendanceNameFilter');
    teacherAttendanceSubjectFilter = document.getElementById('teacherAttendanceSubjectFilter');
    teacherAttendanceDateFilter = document.getElementById('teacherAttendanceDateFilter');
    applyTeacherAttendanceFilter = document.getElementById('applyTeacherAttendanceFilter');
    teacherAttendanceTotalTeachers = document.getElementById('teacherAttendanceTotalTeachers');
    teacherAttendanceTotalPresent = document.getElementById('teacherAttendanceTotalPresent');
    teacherAttendanceTotalAbsent = document.getElementById('teacherAttendanceTotalAbsent');
    registerTeacherFingerprintBtn = document.getElementById('registerTeacherFingerprintBtn');
    verifyTeacherFingerprintBtn = document.getElementById('verifyTeacherFingerprintBtn');

    // Calendar Module
    calendarModule = document.getElementById('calendarModule');
    fullCalendarEl = document.getElementById('calendar-full');
    holidayListContainer = document.getElementById('holidayList');

    // Reports Module
    reportsModule = document.getElementById('reportsModule');

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleModal(forgotPasswordModal, true);
    });
    closeForgotPasswordModal.addEventListener('click', () => toggleModal(forgotPasswordModal, false));
    forgotPasswordForm.addEventListener('submit', handleForgotPassword);

    roleButtons.forEach(button => {
        button.addEventListener('click', () => {
            roleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedRoleInput.value = button.dataset.role;
        });
    });

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const module = item.dataset.module;
            showModule(module);
        });
    });

    moduleTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab')) {
            const module = e.target.dataset.tab;
            showModule(module);
        }
    });

    document.querySelectorAll('.open-module').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const module = e.target.dataset.module;
            showModule(module);
        });
    });

    userProfileToggle.addEventListener('click', () => {
        userDropdown.classList.toggle('hidden');
    });

    logoutButton.addEventListener('click', handleLogout);

    document.addEventListener('click', (event) => {
        if (userProfileToggle && userDropdown && !userProfileToggle.contains(event.target) && !userDropdown.contains(event.target)) {
            userDropdown.classList.add('hidden');
        }
        // Check if notificationDropdown exists before trying to access its properties
        if (notificationButton && notificationDropdown && viewAllModal && !notificationButton.contains(event.target) && !notificationDropdown.contains(event.target) && !viewAllModal.contains(event.target)) {
            notificationDropdown.classList.add('hidden');
        }
    });

    notificationButton.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('hidden');
    });
    markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    viewAllNotificationsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAllNotifications();
        toggleModal(notificationDropdown, false);
    });
    closeViewAllModal.addEventListener('click', () => toggleModal(viewAllModal, false));
    modalMarkAllReadBtn.addEventListener('click', markAllNotificationsAsRead);

    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Modal close buttons
    if (closeUserModal) closeUserModal.addEventListener('click', () => toggleModal(userModal, false));
    if (closeAnnouncementModal) closeAnnouncementModal.addEventListener('click', () => toggleModal(announcementModal, false));
    if (closeStudentModal) closeStudentModal.addEventListener('click', () => toggleModal(studentModal, false));
    if (closeTeacherModal) closeTeacherModal.addEventListener('click', () => toggleModal(teacherModal, false));
    if (openPayrollModalBtn) openPayrollModalBtn.addEventListener('click', () => toggleModal(payrollModal, true)); // Added listener for opening payroll modal
    if (closePayrollModalBtn) closePayrollModalBtn.addEventListener('click', () => toggleModal(payrollModal, false));
    if (openAddInvoiceModalBtn) openAddInvoiceModalBtn.addEventListener('click', () => { // Added listener for opening add invoice modal
        if (addInvoiceForm) addInvoiceForm.reset();
        if (addInvoiceForm) addInvoiceForm.dataset.editId = ''; // Clear edit ID
        toggleModal(addInvoiceModal, true);
    });
    if (closeAddInvoiceModalBtn) closeAddInvoiceModalBtn.addEventListener('click', () => toggleModal(addInvoiceModal, false));
    if (closeAttendanceModal) closeAttendanceModal.addEventListener('click', () => toggleModal(attendanceModal, false));
    if (closeTeacherAttendanceModal) closeTeacherAttendanceModal.addEventListener('click', () => toggleModal(teacherAttendanceModal, false));

    // Student Module Specific Listeners
    if (applySearchButton) applySearchButton.addEventListener('click', filterStudents);
    if (searchRollInput) searchRollInput.addEventListener('input', filterStudents);
    if (searchClassSelect) searchClassSelect.addEventListener('change', filterStudents);

    // Attendance Module Specific Listeners
    if (applyAttendanceFilter) applyAttendanceFilter.addEventListener('click', filterStudentAttendance);
    if (attendanceStudentNameFilter) attendanceStudentNameFilter.addEventListener('input', filterStudentAttendance);
    if (attendanceClassFilter) attendanceClassFilter.addEventListener('change', filterStudentAttendance);
    if (attendanceDateFilter) attendanceDateFilter.addEventListener('change', filterStudentAttendance);
    if (registerStudentFingerprintBtn) registerStudentFingerprintBtn.addEventListener('click', () => {
        showToast('Student fingerprint registration initiated (simulated).', 'info');
    });
    if (verifyStudentFingerprintBtn) verifyStudentFingerprintBtn.addEventListener('click', () => {
        showToast('Student fingerprint verification initiated (simulated). Marking present if successful.', 'info');
        if (attendanceStatusSelect) attendanceStatusSelect.value = 'Present';
        showToast('Student marked Present via fingerprint (simulated).', 'success');
    });

    // Teacher Attendance Module Specific Listeners
    if (applyTeacherAttendanceFilter) applyTeacherAttendanceFilter.addEventListener('click', filterTeacherAttendance);
    if (teacherAttendanceNameFilter) teacherAttendanceNameFilter.addEventListener('input', filterTeacherAttendance);
    if (teacherAttendanceSubjectFilter) teacherAttendanceSubjectFilter.addEventListener('change', filterTeacherAttendance);
    if (teacherAttendanceDateFilter) teacherAttendanceDateFilter.addEventListener('change', filterTeacherAttendance);
    if (registerTeacherFingerprintBtn) registerTeacherFingerprintBtn.addEventListener('click', () => {
        showToast('Teacher fingerprint registration initiated (simulated).', 'info');
    });
    if (verifyTeacherFingerprintBtn) verifyTeacherFingerprintBtn.addEventListener('click', () => {
        showToast('Teacher fingerprint verification initiated (simulated). Marking present if successful.', 'info');
        if (teacherAttendanceStatusSelect) teacherAttendanceStatusSelect.value = 'Present';
        showToast('Teacher marked Present via fingerprint (simulated).', 'success');
    });

    // Forms
    if (profileForm) profileForm.addEventListener('submit', profileFormSubmitHandler);
    if (profilePictureInput) profilePictureInput.addEventListener('change', profilePictureChangeHandler);
    if (userForm) userForm.addEventListener('submit', userFormSubmitHandler);
    if (announcementForm) announcementForm.addEventListener('submit', announcementFormSubmitHandler);
    if (studentForm) studentForm.addEventListener('submit', studentFormSubmitHandler);
    if (teacherForm) teacherForm.addEventListener('submit', teacherFormSubmitHandler);
    if (payrollForm) payrollForm.addEventListener('submit', payrollFormSubmitHandler);
    if (addInvoiceForm) addInvoiceForm.addEventListener('submit', addInvoiceFormSubmitHandler);
    if (attendanceForm) attendanceForm.addEventListener('submit', attendanceFormSubmitHandler);
    if (teacherAttendanceForm) teacherAttendanceForm.addEventListener('submit', teacherAttendanceFormSubmitHandler);

    // --- Initial Load ---
    console.log('DOMContentLoaded fired.');
    applyTheme();
    await loadNotifications(); // Load notifications from Supabase

    // Check Supabase session initially
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Initial Supabase session check. Session:', session, 'Error:', error);

    if (session) {
        const userEmail = session.user?.email;
        const userData = await fetchUserData(userEmail);

        if (!userData) {
            console.error('Error fetching user data from public.profiles: User data not found or inconsistent. Forcing logout.');
            showToast('Failed to retrieve user role. Please log in again.', 'error');
            await supabase.auth.signOut();
            renderLoginUi();
            return;
        }

        localStorage.setItem('loggedInUserRole', userData.role);
        localStorage.setItem('loggedInUserName', userData.full_name || userEmail.split('@')[0]);
        console.log('Session found on DOMContentLoaded. Calling renderSchoolSite().');
        renderSchoolSite();
    } else {
        console.log('No session found on DOMContentLoaded. Calling renderLoginUi().');
        renderLoginUi();
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session?.user.id)
                .single();

            if (profileError && profileError.code === 'PGRST116') {
                console.warn('No profile found for new user, creating one.');
                // Attempt to create a basic profile if none exists
                await supabase
                    .from('profiles')
                    .upsert({
                        id: session.user.id,
                        email: session.user.email,
                        full_name: session.user.email.split('@')[0],
                        role: 'student', // Default role for new sign-ups
                        status: 'Active'
                    });
            } else if (profileError) {
                console.error('Profile fetch error on auth state change:', profileError);
                showToast('Error fetching user profile. Please try again.', 'error');
                await supabase.auth.signOut();
                renderLoginUi();
                return;
            }

            const userEmail = session.user.email;
            const userData = await fetchUserData(userEmail);

            if (!userData) {
                console.error('Error fetching user data on auth state change: User data not found. Forcing logout.');
                showToast('Failed to retrieve user role. Please log in again.', 'error');
                await supabase.auth.signOut();
                renderLoginUi();
                return;
            }
            localStorage.setItem('loggedInUserRole', userData.role);
            localStorage.setItem('loggedInUserName', userData.full_name || userEmail.split('@')[0]);
            renderSchoolSite();

            const userId = session.user.id;
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId);
            console.log('User data from public.profiles table on auth state change (for debugging):', data);
        } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('loggedInUserRole');
            localStorage.removeItem('loggedInUserName');
            renderLoginUi();
        }
    });
});

// --- Utility Functions ---

/**
 * Displays a toast notification.
 * @param {string} message - The message to display.
 * @param {string} type - The type of notification (e.g., 'success', 'error', 'info').
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || (() => {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'fixed bottom-4 right-4 z-[1000] space-y-2';
        document.body.appendChild(div);
        return div;
    })();

    const toast = document.createElement('div');
    toast.className = `p-3 rounded-lg shadow-md text-white flex items-center space-x-2 animate-slideInRight`;

    let bgColor = 'bg-gray-700';
    let icon = '<i class="fas fa-info-circle"></i>';

    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            icon = '<i class="fas fa-times-circle"></i>';
            break;
        case 'warning':
            bgColor = 'bg-yellow-500';
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
        default:
            bgColor = 'bg-blue-500';
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }

    toast.classList.add(bgColor);
    toast.innerHTML = `${icon} <span>${message}</span>`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('animate-slideOutRight');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

/**
 * Toggles the visibility of a modal.
 * @param {HTMLElement} modalElement - The modal element to toggle.
 * @param {boolean} show - Whether to show or hide the modal.
 */
function toggleModal(modalElement, show) {
    if (show) {
        modalElement.classList.remove('hidden');
        modalElement.classList.add('flex');
    } else {
        modalElement.classList.add('hidden');
        modalElement.classList.remove('flex');
    }
}

/**
 * Types out a welcome message character by character.
 * @param {string} message - The message to type.
 * @param {HTMLElement} element - The DOM element to type into.
 * @param {number} delay - Delay between characters in ms.
 */
function typeWriter(message, element, delay = 50) {
    let i = 0;
    element.textContent = ''; // Clear existing text
    function type() {
        if (i < message.length) {
            element.textContent += message.charAt(i);
            i++;
            setTimeout(type, delay);
        }
    }
    type();
}

/**
 * Fetches data from Supabase.
 * @param {string} tableName - The name of the table to fetch from.
 * @param {string} [filterColumn] - Optional column to filter by.
 * @param {string} [filterValue] - Optional value to filter by.
 * @returns {Promise<Array>} - A promise that resolves to an array of data.
 */
async function fetchData(tableName, filterColumn = null, filterValue = null) {
    try {
        let query = supabase.from(tableName).select('*');
        if (filterColumn && filterValue) {
            query = query.eq(filterColumn, filterValue);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Error fetching ${tableName}:`, error.message);
        showToast(`Error fetching ${tableName}: ${error.message}`, 'error');
        return [];
    }
}

/**
 * Inserts data into a Supabase table.
 * @param {string} tableName - The name of the table to insert into.
 * @param {object} record - The record to insert.
 * @returns {Promise<object|null>} - A promise that resolves to the inserted record or null on error.
 */
async function insertData(tableName, record) {
    try {
        const { data, error } = await supabase.from(tableName).insert([record]).select();
        if (error) throw error;
        showToast(`${tableName.slice(0, -1)} added successfully!`, 'success');
        return data[0];
    } catch (error) {
        console.error(`Error adding ${tableName.slice(0, -1)}:`, error.message);
        showToast(`Error adding ${tableName.slice(0, -1)}: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Updates data in a Supabase table.
 * @param {string} tableName - The name of the table to update.
 * @param {object} record - The record with updated data.
 * @param {string} id - The ID of the record to update.
 * @returns {Promise<object|null>} - A promise that resolves to the updated record or null on error.
 */
async function updateData(tableName, record, id) {
    try {
        const { data, error } = await supabase.from(tableName).update(record).eq('id', id).select();
        if (error) throw error;
        showToast(`${tableName.slice(0, -1)} updated successfully!`, 'success');
        return data[0];
    } catch (error) {
        console.error(`Error updating ${tableName.slice(0, -1)}:`, error.message);
        showToast(`Error updating ${tableName.slice(0, -1)}: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Deletes data from a Supabase table.
 * @param {string} tableName - The name of the table to delete from.
 * @param {string} id - The ID of the record to delete.
 * @returns {Promise<boolean>} - A promise that resolves to true if successful, false otherwise.
 */
async function deleteData(tableName, id) {
    try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
        showToast(`${tableName.slice(0, -1)} deleted successfully!`, 'success');
        return true;
    } catch (error) {
        console.error(`Error deleting ${tableName.slice(0, -1)}:`, error.message);
        showToast(`Error deleting ${tableName.slice(0, -1)}: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Fetches user data from the 'profiles' table by email.
 * @param {string} userEmail - The email of the user to fetch.
 * @returns {Promise<object|null>} - A promise that resolves to the user data or null on error.
 */
async function fetchUserData(email) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.warn(`No user profile found with email: ${email}`);
                return null;
            }
            throw new Error(`Error fetching user data: ${error.message}`);
        }
        return data;

    } catch (error) {
        console.error('Profile fetch error:', error);
        return null;
    }
}

/**
 * Adds an entry to the audit logs table in Supabase.
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
            console.error('Error adding audit log:', error);
        } else {
            console.log('Audit log added:', data);
        }
    } catch (err) {
        console.error('Unexpected error in addAuditLog:', err);
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

// --- Authentication Functions ---

async function handleLogin(event) {
    event.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    const role = selectedRoleInput.value;

    showToast('Authenticating...', 'info');

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('Auth Error:', authError);
            showToast(`Login failed: ${authError.message}`, 'error');
            await addAuditLog(email, 'Login Failed', 'Authentication', `Error: ${authError.message}`);
            return;
        }

        const userData = await fetchUserData(email);
        if (!userData) {
            await supabase.auth.signOut();
            showToast('Login failed: User profile not found. Please contact support.', 'error');
            await addAuditLog(email, 'Login Failed', 'Authentication', 'User profile not found.');
            return;
        }

        // Role mismatch check:
        // An admin user can log in as any role (for testing/management purposes in a demo).
        // Other roles must match their registered role.
        if (userData.role !== role && role !== 'admin') {
            await supabase.auth.signOut();
            showToast(`Login failed: You are registered as a ${userData.role}, not a ${role}. Please select your correct role.`, 'error');
            await addAuditLog(email, 'Login Failed (Role Mismatch)', 'Authentication', `User ${email} attempted login as ${role}, but actual role is ${userData.role}.`);
            return;
        }

        localStorage.setItem('loggedInUserRole', userData.role);
        localStorage.setItem('loggedInUserName', userData.full_name || email.split('@')[0]);

        showToast('Login successful! Redirecting...', 'success');
        await addAuditLog(email, 'Logged In', 'Authentication', `Successful login for role: ${userData.role}`);
        renderSchoolSite();

    } catch (error) {
        console.error('Login Error:', error);
        showToast(`Login failed: ${error.message}`, 'error');
        loginForm.reset();
        await addAuditLog(email, 'Login Failed (Unexpected)', 'Authentication', `Unexpected error: ${error.message}`);
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    const email = forgotEmailInput.value;
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password.html', // Ensure this path is correct
        });
        if (error) throw error;
        showToast(`Password reset link sent to ${email}. Please check your email.`, 'info');
        toggleModal(forgotPasswordModal, false);
        forgotPasswordForm.reset();
        await addAuditLog(email, 'Forgot Password Initiated', 'Authentication', 'Password reset link sent.');
    } catch (error) {
        console.error('Forgot password error:', error.message);
        showToast(`Forgot password failed: ${error.message}`, 'error');
        await addAuditLog(email, 'Forgot Password Failed', 'Authentication', `Failed to send reset link: ${error.message}`);
    }
}

async function handleLogout() {
    const userEmail = localStorage.getItem('loggedInUserName') || 'Unknown';
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.removeItem('loggedInUserRole');
        localStorage.removeItem('loggedInUserName');
        showToast('Logged out successfully!', 'info');
        await addAuditLog(userEmail, 'Logged Out', 'Authentication', 'User logged out');
        renderLoginUi();
    } catch (error) {
        console.error('Logout error:', error.message);
        showToast(`Logout failed: ${error.message}`, 'error');
        await addAuditLog(userEmail, 'Logout Failed', 'Authentication', `Error: ${error.message}`);
    }
}

// --- UI Rendering Functions ---

function renderLoginUi() {
    console.log('renderLoginUi() called.');
    if (loginUi) {
        loginUi.classList.remove('hidden');
        loginUi.style.display = 'flex'; // Ensure it's flex for centering
        document.body.style.justifyContent = 'center';
        document.body.style.alignItems = 'center';
        document.body.style.minHeight = '100vh';
        document.body.style.overflow = 'hidden';
    }
    if (schoolSiteUi) {
        schoolSiteUi.classList.add('hidden');
        schoolSiteUi.style.display = 'none';
    }
    typeWriter("Welcome to Tapowan Public School", typedWelcome);
    loginForm.reset();
    emailInput.value = '';
    passwordInput.value = '';
    selectedRoleInput.value = 'admin'; // Reset to default
    roleButtons.forEach(button => {
        if (button.dataset.role === 'admin') {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

async function renderSchoolSite() {
    console.log('renderSchoolSite() called.');
    if (loginUi) {
        loginUi.classList.add('hidden');
        loginUi.style.display = 'none';
    }
    if (schoolSiteUi) {
        schoolSiteUi.classList.remove('hidden');
        schoolSiteUi.style.display = 'flex';
        document.body.style.justifyContent = 'flex-start';
        document.body.style.alignItems = 'flex-start';
        document.body.style.minHeight = 'auto';
        document.body.style.overflow = 'auto';
    }

    const userRole = localStorage.getItem('loggedInUserRole') || 'Admin';
    const userName = localStorage.getItem('loggedInUserName') || 'Admin';
    if (loggedInUserName) loggedInUserName.textContent = userName;
    console.log(`Logged in as: ${userName} (${userRole})`);

    updateSidebarVisibility(userRole);
    await loadAllData(); // Load all data from Supabase
    initializeFullCalendar(); // Initialize calendar after data is loaded
    renderHolidayList(); // Render holidays after data is loaded
    renderReportsCharts(); // Render charts after data is loaded
    showModule('dashboard'); // Default to dashboard
}

/**
 * Updates UI elements (navigation, buttons) based on the logged-in user's role.
 */
function updateSidebarVisibility(role) {
    // Hide all nav items by default
    navItems.forEach(item => item.classList.add('hidden'));

    // Define module access based on role
    const accessMap = {
        'admin': [
            'dashboard', 'profile', 'announcements', 'calendar', 'reports',
            'user-management', 'roles-permissions', 'system-settings', 'audit-logs', 'backup-restore',
            'students', 'teachers', 'payroll', 'finance', 'attendance', 'teacher-attendance'
        ],
        'teacher': [
            'dashboard', 'profile', 'announcements', 'calendar', 'reports',
            'students', 'attendance'
        ],
        'student': [
            'dashboard', 'profile', 'announcements', 'calendar'
        ]
    };

    const allowedModules = accessMap[role] || [];

    navItems.forEach(item => {
        const module = item.dataset.module;
        if (allowedModules.includes(module)) {
            item.classList.remove('hidden');
        }
    });

    // Adjust visibility of section headers based on visible modules
    document.querySelectorAll('.nav-section').forEach(section => {
        const visibleItems = Array.from(section.querySelectorAll('.nav-item')).some(item => !item.classList.contains('hidden'));
        if (!visibleItems) {
            section.classList.add('hidden');
        } else {
            section.classList.remove('hidden');
        }
    });

    // Specific buttons/forms visibility (based on index.html structure)
    // These buttons are inside module content, so their visibility is handled when the module is shown.
    // However, if they were global buttons, this is where you'd toggle their visibility.
    // For example, if there was a global "Add Student" button:
    // const globalAddStudentBtn = document.getElementById('globalAddStudentBtn');
    // if (globalAddStudentBtn) {
    //     if (role === 'admin' || role === 'teacher') {
    //         globalAddStudentBtn.classList.remove('hidden');
    //     } else {
    //         globalAddStudentBtn.classList.add('hidden');
    //     }
    // }
}

function showModule(moduleName) {
    const userRole = localStorage.getItem('loggedInUserRole') || 'admin'; // Default to admin if not found

    const moduleAccess = {
        'dashboard': ['admin', 'teacher', 'student'],
        'profile': ['admin', 'teacher', 'student'],
        'announcements': ['admin', 'teacher', 'student'],
        'calendar': ['admin', 'teacher', 'student'],
        'reports': ['admin', 'teacher'],
        'user-management': ['admin'],
        'roles-permissions': ['admin'],
        'system-settings': ['admin'],
        'audit-logs': ['admin'],
        'backup-restore': ['admin'],
        'students': ['admin', 'teacher'],
        'teachers': ['admin'],
        'payroll': ['admin'],
        'finance': ['admin'],
        'attendance': ['admin', 'teacher'],
        'teacher-attendance': ['admin']
    };

    if (!moduleAccess[moduleName] || !moduleAccess[moduleName].includes(userRole)) {
        showToast('Access Denied: You do not have permission to view this module.', 'error');
        // Redirect to dashboard or a default accessible module
        if (moduleName !== 'dashboard') {
            showModule('dashboard');
        }
        return;
    }

    if (currentModuleTitle) currentModuleTitle.textContent = moduleName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // Hide all module content and remove active states
    if (modulesContainer) {
        modulesContainer.querySelectorAll('.module-content').forEach(content => content.classList.add('hidden'));
    }
    const dashboardMainContent = document.getElementById('dashboardMainContent');
    if (dashboardMainContent) dashboardMainContent.classList.add('hidden');

    navItems.forEach(item => item.classList.remove('active'));
    if (moduleTabs) moduleTabs.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    // Show the selected module content
    const moduleContent = document.getElementById(`${moduleName}Module`);
    if (moduleContent) {
        moduleContent.classList.remove('hidden');
        if (modulesContainer) modulesContainer.classList.remove('hidden'); // Ensure modules container is visible
    } else if (moduleName === 'dashboard') {
        if (dashboardMainContent) dashboardMainContent.classList.remove('hidden');
        if (modulesContainer) modulesContainer.classList.add('hidden'); // Hide modules container for dashboard
    } else {
        console.warn(`Module content for "${moduleName}" not found.`);
        showToast(`Module "${moduleName}" content not found.`, 'warning');
        showModule('dashboard'); // Fallback to dashboard
        return;
    }

    // Set active state for navigation and tabs
    const activeNavItem = document.querySelector(`.nav-item[data-module="${moduleName}"]`);
    if (activeNavItem) activeNavItem.classList.add('active');
    const activeTab = document.querySelector(`.tab[data-tab="${moduleName}"]`);
    if (activeTab) activeTab.classList.add('active');

    // Load data specific to the module
    switch (moduleName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'profile':
            loadProfileData();
            break;
        case 'user-management':
            loadUsers();
            break;
        case 'announcements':
            loadAnnouncements();
            break;
        case 'students':
            loadStudents();
            break;
        case 'teachers':
            loadTeachers();
            break;
        case 'payroll':
            loadPayrollEntries();
            break;
        case 'finance':
            loadInvoices();
            break;
        case 'attendance':
            loadStudentAttendance();
            populateStudentAttendanceDropdown();
            break;
        case 'teacher-attendance':
            loadTeacherAttendance();
            populateTeacherAttendanceDropdown();
            break;
        case 'calendar':
            loadCalendarEvents();
            renderHolidayList(); // Ensure holidays are rendered
            break;
        case 'reports':
            renderReportsCharts();
            break;
        case 'audit-logs':
            fetchAuditLogs(); // Renamed from loadAuditLogs for consistency with original script1.js
            break;
        case 'backup-restore':
            fetchBackups(); // Renamed from loadBackupHistory for consistency with original script1.js
            break;
        default:
            break;
    }

    // Close dropdowns if open
    if (notificationDropdown) notificationDropdown.classList.add('hidden');
    if (userDropdown) userDropdown.classList.add('hidden');
}

// --- Initial Data Load ---
async function loadAllData() {
    // Fetch all necessary data concurrently
    const [
        fetchedStudents,
        fetchedTeachers,
        fetchedPayrollEntries,
        fetchedInvoices,
        fetchedAnnouncements,
        fetchedAuditLogs,
        fetchedSchoolEvents,
        fetchedStudentAttendance,
        fetchedTeacherAttendance,
        fetchedProfiles
    ] = await Promise.all([
        fetchData('students'),
        fetchData('teachers'),
        fetchData('payroll'),
        fetchData('invoices'),
        fetchData('announcements'),
        fetchData('audit_logs'),
        fetchData('events'), // Assuming 'events' table for calendar events
        fetchData('student_attendance'),
        fetchData('teacher_attendance'),
        fetchData('profiles')
    ]);

    // Assign fetched data to global variables
    students = fetchedStudents;
    teachers = fetchedTeachers;
    payrollEntries = fetchedPayrollEntries;
    invoices = fetchedInvoices;
    announcements = fetchedAnnouncements;
    auditLogs = fetchedAuditLogs;
    schoolEvents = fetchedSchoolEvents;
    studentAttendanceRecords = fetchedStudentAttendance;
    teacherAttendanceRecords = fetchedTeacherAttendance;
    profiles = fetchedProfiles;

    // Static holiday data
    holidays = [
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

    // Simulated backups
    backups = JSON.parse(localStorage.getItem('backups')) || [
        { id: 'B001', backup_id: 'BK20231026-001', date: '2023-10-26 02:00:00', size: '150 MB', type: 'Full' },
        { id: 'B002', backup_id: 'BK20231025-001', date: '2023-10-25 02:00:00', size: '148 MB', type: 'Full' }
    ];

    updateDashboardStats();
    renderRecentActivity();
}

// --- Dashboard Functions ---

async function loadDashboardData() {
    // Data is already loaded by loadAllData, just update stats
    updateDashboardStats();
    initializeDashboardCalendar();
    renderRecentActivity();
}

function updateDashboardStats() {
    if (totalStudentsCount) totalStudentsCount.textContent = students.length.toLocaleString();
    if (totalTeachersCount) totalTeachersCount.textContent = teachers.length.toLocaleString();

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthRevenue = invoices.filter(inv => {
        const invDate = new Date(inv.invoice_date);
        return inv.status === 'Paid' && invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    }).reduce((sum, inv) => sum + (inv.amount || 0), 0);
    if (monthlyRevenue) monthlyRevenue.textContent = `$${currentMonthRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (upcomingEventsCount && calendar) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const upcoming = schoolEvents.filter(event => { // Use schoolEvents array
            const eventDate = new Date(event.event_date);
            return eventDate >= today;
        });
        upcomingEventsCount.textContent = upcoming.length.toLocaleString();
    } else if (upcomingEventsCount) {
        upcomingEventsCount.textContent = 'N/A';
    }
}

function displayRecentActivity(activities) {
    if (!recentActivityList) return;
    recentActivityList.innerHTML = '';
    if (activities.length === 0) {
        recentActivityList.innerHTML = '<p class="text-gray-500">No recent activity.</p>';
        return;
    }
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';
        activityItem.innerHTML = `
            <div class="icon-wrapper bg-blue-100 text-blue-600 text-sm">
                <i class="fas fa-info"></i>
            </div>
            <div>
                <p class="text-sm font-medium text-gray-800">${activity.action} in ${activity.module}</p>
                <p class="text-xs text-gray-500">by ${activity.user_email || 'System'} at ${new Date(activity.timestamp).toLocaleString()}</p>
            </div>
        `;
        recentActivityList.appendChild(activityItem);
    });
}

function initializeDashboardCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        // Destroy existing calendar instance if it exists
        if (calendarEl.fullCalendar) { // Check if FullCalendar instance is stored
            calendarEl.fullCalendar.destroy();
        }

        const dashboardCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: schoolEvents.map(event => ({
                title: event.title,
                start: event.event_date,
                description: event.description
            })),
            eventDidMount: function(info) {
                info.el.setAttribute('title', info.event.extendedProps.description || info.event.title);
            }
        });
        dashboardCalendar.render();
        calendarEl.fullCalendar = dashboardCalendar; // Store the instance
    }
}

// Render Recent Activity
function renderRecentActivity() {
    if (!recentActivityList) return;
    recentActivityList.innerHTML = '';
    // Use the global auditLogs array, sort by timestamp descending
    const recentLogs = [...auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 3);

    if (recentLogs.length === 0) {
        recentActivityList.innerHTML = '<p class="text-gray-500">No recent activity.</p>';
        return;
    }

    recentLogs.forEach(log => {
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
}

// --- Profile Module Functions ---

async function loadProfileData() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        showToast('User not logged in.', 'error');
        return;
    }
    const userEmail = user.email;

    const userData = await fetchUserData(userEmail);

    if (!userData) {
        showToast('Error loading profile data: User record not found in database.', 'error');
        return;
    }

    if (fullNameInput) fullNameInput.value = userData.full_name || '';
    if (profileEmailInput) profileEmailInput.value = userData.email || '';
    if (roleSelect) roleSelect.value = userData.role || '';
    if (phoneInput) phoneInput.value = userData.phone || '';
    if (addressTextarea) addressTextarea.value = userData.address || '';
    if (profilePicturePreview) profilePicturePreview.src = userData.profile_picture_url || 'https://via.placeholder.com/96/cccccc/ffffff?text=User';
}

async function profileFormSubmitHandler(event) {
    event.preventDefault();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        showToast('User not logged in.', 'error');
        return;
    }
    const userId = user.id;

    const updatedProfile = {
        full_name: fullNameInput.value,
        phone: phoneInput.value,
        address: addressTextarea.value,
    };

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updatedProfile)
            .eq('id', userId)
            .select();

        if (error) throw error;

        showToast('Profile updated successfully!', 'success');
        if (data && data[0] && data[0].full_name && loggedInUserName) {
            localStorage.setItem('loggedInUserName', data[0].full_name.split(' ')[0]);
            loggedInUserName.textContent = data[0].full_name.split(' ')[0];
        }
        await addAuditLog(user.email, 'Updated Profile', 'Profile', `Updated profile for ${updatedProfile.full_name}`);
    } catch (error) {
        console.error('Error updating profile:', error.message);
        showToast(`Error updating profile: ${error.message}`, 'error');
        await addAuditLog(user.email, 'Update Profile Failed', 'Profile', `Failed to update profile: ${error.message}`);
    }
}

async function profilePictureChangeHandler(event) {
    const file = event.target.files[0];
    if (!file) return;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        showToast('User not logged in.', 'error');
        return;
    }
    const userId = user.id;

    const filePath = `${userId}/${file.name}`;
    try {
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile_pictures')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
            .from('profile_pictures')
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ profile_picture_url: publicUrl })
            .eq('id', userId);

        if (updateError) throw updateError;

        if (profilePicturePreview) profilePicturePreview.src = publicUrl;
        showToast('Profile picture updated successfully!', 'success');
        await addAuditLog(user.email, 'Updated Profile Picture', 'Profile', `Updated profile picture for user ${user.email}`);
    } catch (error) {
        console.error('Error uploading profile picture:', error.message);
        showToast(`Error uploading profile picture: ${error.message}`, 'error');
        await addAuditLog(user.email, 'Update Profile Picture Failed', 'Profile', `Failed to update profile picture: ${error.message}`);
    }
}

// --- User Management Functions ---

async function loadUsers() {
    profiles = await fetchData('profiles'); // Use 'profiles' table
    displayUsers();
}

function displayUsers() {
    if (!userTableBody) return;
    userTableBody.innerHTML = '';
    if (profiles.length === 0) {
        userTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No users found.</td></tr>';
        return;
    }
    const currentUserRole = localStorage.getItem('loggedInUserRole');

    profiles.forEach(user => {
        const row = userTableBody.insertRow();
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${user.id}</td>
            <td class="py-3 px-4">${user.full_name || 'N/A'}</td>
            <td class="py-3 px-4">${user.email || 'N/A'}</td>
            <td class="py-3 px-4">${user.role || 'N/A'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${user.status}
                </span>
            </td>
            <td class="py-3 px-4">
                ${currentUserRole === 'admin' ? `
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="Edit User" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete User" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
    });
}

function showAddUserForm() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can add users.', 'error');
        return;
    }
    if (userModalTitle) userModalTitle.textContent = 'Add New User';
    if (userFormSubmitBtn) userFormSubmitBtn.textContent = 'Add User';
    if (userForm) userForm.reset();
    if (userIdInput) userIdInput.value = '';
    if (userPasswordInput) userPasswordInput.setAttribute('required', 'required');
    if (userModal) toggleModal(userModal, true);
}

async function editUser(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can edit users.', 'error');
        return;
    }
    const user = profiles.find(u => u.id === id);
    if (user) {
        if (userModalTitle) userModalTitle.textContent = 'Edit User';
        if (userFormSubmitBtn) userFormSubmitBtn.textContent = 'Save Changes';
        if (userIdInput) userIdInput.value = user.id;
        if (userFullNameInput) userFullNameInput.value = user.full_name;
        if (userEmailInput) userEmailInput.value = user.email;
        if (userRoleSelect) userRoleSelect.value = user.role;
        if (userStatusSelect) userStatusSelect.value = user.status;
        if (userPasswordInput) {
            userPasswordInput.value = '';
            userPasswordInput.removeAttribute('required');
        }
        if (userModal) toggleModal(userModal, true);
    }
}

async function userFormSubmitHandler(event) {
    event.preventDefault();
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can manage user accounts.', 'error');
        return;
    }

    const id = userIdInput.value;
    const email = userEmailInput.value;
    const password = userPasswordInput.value;
    const fullName = userFullNameInput.value;
    const role = userRoleSelect.value;
    const status = userStatusSelect.value;

    const loggedInUserEmail = localStorage.getItem('loggedInUserName');

    if (id) {
        // Update existing user in 'profiles' table
        const updatedUser = await updateData('profiles', { full_name: fullName, email, role, status }, id);
        if (updatedUser) {
            profiles = profiles.map(u => u.id === id ? updatedUser : u);
            displayUsers();
            toggleModal(userModal, false);
            await addAuditLog(loggedInUserEmail, 'Updated User', 'User Management', `Updated user: ${fullName} (ID: ${id})`);
        }
    } else {
        // Add new user via Supabase Auth and then to 'profiles' table
        try {
            // WARNING: Direct client-side creation of users with specific roles
            // or admin-level operations (like setting email_confirm: true)
            // should ideally be done via a secure backend function (e.g., Supabase Edge Function)
            // that uses the `service_role` key. Exposing the `service_role` key client-side
            // is a severe security risk. This is for demonstration purposes only.
            // In a production environment, replace this with a call to a secure backend endpoint.
            const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // <<< REPLACE WITH YOUR ACTUAL SERVICE ROLE KEY IN A SECURE BACKEND CONTEXT

            if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY' || !SERVICE_ROLE_KEY) {
                showToast('Service Role Key is not configured. Cannot create user with specific role from client-side. This operation should be done via a secure backend.', 'error');
                await addAuditLog(loggedInUserEmail, 'Add User Failed', 'User Management', 'Service Role Key not configured for user creation.');
                return;
            }

            // This part would typically be in a Supabase Edge Function or a Node.js backend
            // using the Supabase Admin client with the service_role key.
            // For demonstration, it's here, but be aware of the security implications.
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true, // Auto-confirm email for admin-created users
                user_metadata: {
                    full_name: fullName,
                    role: role
                }
            });

            if (authError) {
                if (authError.message.includes('User already registered')) {
                    showToast('User with this email already exists in authentication system. Please use a different email or reset password.', 'warning');
                } else {
                    throw authError;
                }
                await addAuditLog(loggedInUserEmail, 'Add User Failed', 'User Management', `Auth signup failed: ${authError.message}`);
                return;
            }

            if (!authData.user) {
                throw new Error('Supabase Auth signup succeeded but no user object was returned.');
            }

            const addedUser = await insertData('profiles', {
                id: authData.user.id,
                full_name: fullName,
                email: email,
                role: role,
                status: status
            });

            if (addedUser) {
                profiles.push(addedUser);
                displayUsers();
                toggleModal(userModal, false);
                showToast('User created and added successfully!', 'success');
                await addAuditLog(loggedInUserEmail, 'Added User', 'User Management', `Added new user: ${fullName} (ID: ${addedUser.id})`);
            } else {
                console.error('Failed to add user to public.profiles table after auth signup. Auth user created, but database record missing.');
                showToast('User created in Auth, but failed to add to user list. Please check database.', 'warning');
                await addAuditLog(loggedInUserEmail, 'Add User Failed', 'User Management', 'Auth user created, but profile record missing.');
            }

        } catch (error) {
            console.error('Error adding new user:', error.message);
            showToast(`Error adding user: ${error.message}`, 'error');
            await addAuditLog(loggedInUserEmail, 'Add User Failed', 'User Management', `Unexpected error: ${error.message}`);
        }
    }
}

async function deleteUser(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can delete users.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this user? This will also attempt to delete their authentication record.')) {
        const loggedInUserEmail = localStorage.getItem('loggedInUserName');
        try {
            const deletedProfile = profiles.find(p => p.id === id);

            // Delete from profiles table first
            const success = await deleteData('profiles', id);
            if (success) {
                // WARNING: Direct client-side deletion of auth users is not allowed for security.
                // You would typically call a Supabase Edge Function or a backend API endpoint
                // that has the necessary service_role key to perform this action.
                // In a production environment, replace this with a call to a secure backend endpoint.
                const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // <<< REPLACE WITH YOUR ACTUAL SERVICE ROLE KEY IN A SECURE BACKEND CONTEXT

                if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY' || !SERVICE_ROLE_KEY) {
                    showToast('Service Role Key is not configured. Cannot delete user from auth.users table from client-side. This operation should be done via a secure backend.', 'warning');
                    await addAuditLog(loggedInUserEmail, 'Delete User Failed', 'User Management', `Auth user not deleted for ${deletedProfile?.full_name || id} due to missing service role key.`);
                } else {
                    // This part would typically be in a Supabase Edge Function or a Node.js backend
                    // using the Supabase Admin client with the service_role key.
                    // For demonstration, it's here, but be aware of the security implications.
                    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
                    if (authDeleteError) throw authDeleteError;
                }

                profiles = profiles.filter(u => u.id !== id);
                displayUsers();
                showToast('User and authentication record deleted successfully!', 'success');
                await addAuditLog(loggedInUserEmail, 'Deleted User', 'User Management', `Deleted user: ${deletedProfile?.full_name || id}`);
            }
        } catch (error) {
            console.error('Error deleting user:', error.message);
            showToast(`Error deleting user: ${error.message}`, 'error');
            await addAuditLog(loggedInUserEmail, 'Delete User Failed', 'User Management', `Error: ${error.message}`);
        }
    }
}

// --- Announcements Module Functions ---

async function loadAnnouncements() {
    announcements = await fetchData('announcements');
    displayAnnouncements();
}

function displayAnnouncements() {
    if (!announcementTableBody) return;
    announcementTableBody.innerHTML = '';
    if (announcements.length === 0) {
        announcementTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No announcements found.</td></tr>';
        return;
    }
    const currentUserRole = localStorage.getItem('loggedInUserRole');

    announcements.forEach(announcement => {
        const row = announcementTableBody.insertRow();
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${announcement.title}</td>
            <td class="py-3 px-4">${announcement.content ? announcement.content.substring(0, 50) + (announcement.content.length > 50 ? '...' : '') : 'N/A'}</td>
            <td class="py-3 px-4">${announcement.date_posted ? new Date(announcement.date_posted).toLocaleDateString() : 'N/A'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${announcement.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${announcement.status || 'N/A'}
                </span>
            </td>
            <td class="py-3 px-4">
                ${currentUserRole === 'admin' || currentUserRole === 'teacher' ? `
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="Edit Announcement" onclick="editAnnouncement('${announcement.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete Announcement" onclick="deleteAnnouncement('${announcement.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
    });
}

function showAddAnnouncementModal() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can add announcements.', 'error');
        return;
    }
    if (announcementModalTitle) announcementModalTitle.textContent = 'Add New Announcement';
    if (announcementFormSubmitBtn) announcementFormSubmitBtn.textContent = 'Publish Announcement';
    if (announcementForm) announcementForm.reset();
    if (announcementIdInput) announcementIdInput.value = '';
    if (announcementModal) toggleModal(announcementModal, true);
}

function editAnnouncement(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can edit announcements.', 'error');
        return;
    }
    const announcement = announcements.find(a => a.id === id);
    if (announcement) {
        if (announcementModalTitle) announcementModalTitle.textContent = 'Edit Announcement';
        if (announcementFormSubmitBtn) announcementFormSubmitBtn.textContent = 'Save Changes';
        if (announcementIdInput) announcementIdInput.value = announcement.id;
        if (announcementTitleInput) announcementTitleInput.value = announcement.title || '';
        if (announcementContentTextarea) announcementContentTextarea.value = announcement.content || '';
        if (announcementStatusSelect) announcementStatusSelect.value = announcement.status || 'Active';
        if (announcementModal) toggleModal(announcementModal, true);
    }
}

async function announcementFormSubmitHandler(event) {
    event.preventDefault();
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can manage announcements.', 'error');
        return;
    }

    const id = announcementIdInput.value;
    const newAnnouncement = {
        title: announcementTitleInput.value,
        content: announcementContentTextarea.value,
        date_posted: new Date().toISOString(),
        status: announcementStatusSelect.value,
    };

    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    let auditAction = '';
    let auditDetails = '';

    if (id) {
        const updatedAnnouncement = await updateData('announcements', newAnnouncement, id);
        if (updatedAnnouncement) {
            announcements = announcements.map(a => a.id === id ? updatedAnnouncement : a);
            displayAnnouncements();
            toggleModal(announcementModal, false);
            auditAction = 'Updated Announcement';
            auditDetails = `Updated: "${newAnnouncement.title}" (ID: ${id})`;
        }
    } else {
        const addedAnnouncement = await insertData('announcements', newAnnouncement);
        if (addedAnnouncement) {
            announcements.push(addedAnnouncement);
            displayAnnouncements();
            toggleModal(announcementModal, false);
            auditAction = 'Published Announcement';
            auditDetails = `Published: "${newAnnouncement.title}"`;
        }
    }
    if (auditAction) {
        await addAuditLog(loggedInUserEmail, auditAction, 'Announcements', auditDetails);
    }
}

async function deleteAnnouncement(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can delete announcements.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this announcement?')) {
        const loggedInUserEmail = localStorage.getItem('loggedInUserName');
        const deletedAnnouncement = announcements.find(a => a.id === id);
        const success = await deleteData('announcements', id);
        if (success) {
            announcements = announcements.filter(a => a.id !== id);
            displayAnnouncements();
            await addAuditLog(loggedInUserEmail, 'Deleted Announcement', 'Announcements', `Deleted: "${deletedAnnouncement?.title}" (ID: ${deletedAnnouncement?.id})`);
        }
    }
}

// --- Students Module Functions ---

async function loadStudents() {
    students = await fetchData('students');
    displayStudents(students);
}

function displayStudents(filteredStudents) {
    if (!studentTableBody) return;
    studentTableBody.innerHTML = '';
    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">No students found.</td></tr>';
        return;
    }
    const currentUserRole = localStorage.getItem('loggedInUserRole');

    filteredStudents.forEach(student => {
        const row = studentTableBody.insertRow();
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${student.id || 'N/A'}</td>
            <td class="py-3 px-4">${student.full_name || 'N/A'}</td>
            <td class="py-3 px-4">${student.father_name || 'N/A'}</td>
            <td class="py-3 px-4">${student.mother_name || 'N/A'}</td>
            <td class="py-3 px-4">${student.class || 'N/A'}</td>
            <td class="py-3 px-4">${student.roll_no || 'N/A'}</td>
            <td class="py-3 px-4">${student.aadhar_no || 'N/A'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${student.status || 'N/A'}
                </span>
            </td>
            <td class="py-3 px-4">
                ${currentUserRole === 'admin' || currentUserRole === 'teacher' ? `
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="Edit Student" onclick="editStudent('${student.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete Student" onclick="deleteStudent('${student.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
    });
}

function showAddStudentForm() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can add students.', 'error');
        return;
    }
    if (studentModalTitle) studentModalTitle.textContent = 'Add New Student';
    if (studentFormSubmitBtn) studentFormSubmitBtn.textContent = 'Add Student';
    if (studentForm) studentForm.reset();
    if (studentIdInput) studentIdInput.value = '';
    if (studentModal) toggleModal(studentModal, true);
}

function editStudent(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can edit students.', 'error');
        return;
    }
    const student = students.find(s => s.id === id);
    if (student) {
        if (studentModalTitle) studentModalTitle.textContent = 'Edit Student';
        if (studentFormSubmitBtn) studentFormSubmitBtn.textContent = 'Save Changes';
        if (studentIdInput) studentIdInput.value = student.id;
        if (studentFullNameInput) studentFullNameInput.value = student.full_name || '';
        if (studentFatherNameInput) studentFatherNameInput.value = student.father_name || '';
        if (studentMotherNameInput) studentMotherNameInput.value = student.mother_name || '';
        if (studentClassSelect) studentClassSelect.value = student.class || '';
        if (studentRollNoInput) studentRollNoInput.value = student.roll_no || '';
        if (studentAadharNoInput) studentAadharNoInput.value = student.aadhar_no || '';
        if (studentEmailInput) studentEmailInput.value = student.email || '';
        if (studentPhoneInput) studentPhoneInput.value = student.phone || '';
        if (studentStatusSelect) studentStatusSelect.value = student.status || 'Active';
        if (studentModal) toggleModal(studentModal, true);
    }
}

async function studentFormSubmitHandler(event) {
    event.preventDefault();
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can manage student data.', 'error');
        return;
    }

    const id = studentIdInput.value;
    const newStudent = {
        full_name: studentFullNameInput.value,
        father_name: studentFatherNameInput.value,
        mother_name: studentMotherNameInput.value,
        class: studentClassSelect.value,
        roll_no: studentRollNoInput.value,
        aadhar_no: studentAadharNoInput.value,
        email: studentEmailInput.value,
        phone: studentPhoneInput.value,
        status: studentStatusSelect.value,
    };

    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    let auditAction = '';
    let auditDetails = '';

    if (id) {
        const updatedStudent = await updateData('students', newStudent, id);
        if (updatedStudent) {
            students = students.map(s => s.id === id ? updatedStudent : s);
            displayStudents(students);
            toggleModal(studentModal, false);
            auditAction = 'Updated Student';
            auditDetails = `Updated student: ${newStudent.full_name} (ID: ${id})`;
        }
    } else {
        const addedStudent = await insertData('students', newStudent);
        if (addedStudent) {
            students.push(addedStudent);
            displayStudents(students);
            toggleModal(studentModal, false);
            auditAction = 'Added Student';
            auditDetails = `Added new student: ${newStudent.full_name} (ID: ${addedStudent.id})`;
        }
    }
    if (auditAction) {
        await addAuditLog(loggedInUserEmail, auditAction, 'Students', auditDetails);
    }
}

async function deleteStudent(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can delete students.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this student?')) {
        const loggedInUserEmail = localStorage.getItem('loggedInUserName');
        const deletedStudent = students.find(s => s.id === id);
        const success = await deleteData('students', id);
        if (success) {
            students = students.filter(s => s.id !== id);
            displayStudents(students);
            await addAuditLog(loggedInUserEmail, 'Deleted Student', 'Students', `Deleted student: ${deletedStudent?.full_name} (ID: ${deletedStudent?.id})`);
        }
    }
}

function filterStudents() {
    const rollNoFilter = searchRollInput.value.toLowerCase();
    const classFilter = searchClassSelect.value;

    const filtered = students.filter(student => {
        const matchesRoll = (student.roll_no || '').toLowerCase().includes(rollNoFilter);
        const matchesClass = classFilter === '' || student.class === classFilter;
        return matchesRoll && matchesClass;
    });
    displayStudents(filtered);
}

// --- Teachers Module Functions ---

async function loadTeachers() {
    teachers = await fetchData('teachers');
    displayTeachers(teachers);
}

function displayTeachers(filteredTeachers) {
    if (!teacherTableBody) return;
    teacherTableBody.innerHTML = '';
    if (filteredTeachers.length === 0) {
        teacherTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No teachers found.</td></tr>';
        return;
    }
    const currentUserRole = localStorage.getItem('loggedInUserRole');

    filteredTeachers.forEach(teacher => {
        const row = teacherTableBody.insertRow();
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${teacher.id || 'N/A'}</td>
            <td class="py-3 px-4">${teacher.full_name || 'N/A'}</td>
            <td class="py-3 px-4">${teacher.subject || 'N/A'}</td>
            <td class="py-3 px-4">${teacher.classes || 'N/A'}</td>
            <td class="py-3 px-4">
                ${currentUserRole === 'admin' ? `
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="Edit Teacher" onclick="editTeacher('${teacher.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete Teacher" onclick="deleteTeacher('${teacher.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
    });
}

function showAddTeacherForm() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can add teachers.', 'error');
        return;
    }
    if (teacherModalTitle) teacherModalTitle.textContent = 'Add New Teacher';
    if (teacherFormSubmitBtn) teacherFormSubmitBtn.textContent = 'Add Teacher';
    if (teacherForm) teacherForm.reset();
    if (teacherIdInput) teacherIdInput.value = '';
    if (teacherModal) toggleModal(teacherModal, true);
}

function editTeacher(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can edit teachers.', 'error');
        return;
    }
    const teacher = teachers.find(t => t.id === id);
    if (teacher) {
        if (teacherModalTitle) teacherModalTitle.textContent = 'Edit Teacher';
        if (teacherFormSubmitBtn) teacherFormSubmitBtn.textContent = 'Save Changes';
        if (teacherIdInput) teacherIdInput.value = teacher.id;
        if (teacherFullNameInput) teacherFullNameInput.value = teacher.full_name || '';
        if (teacherSubjectSelect) teacherSubjectSelect.value = teacher.subject || '';
        if (teacherEmailInput) teacherEmailInput.value = teacher.email || '';
        if (teacherClassesInput) teacherClassesInput.value = teacher.classes || '';
        if (teacherModal) toggleModal(teacherModal, true);
    }
}

async function teacherFormSubmitHandler(event) {
    event.preventDefault();
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can manage teacher data.', 'error');
        return;
    }

    const id = teacherIdInput.value;
    const newTeacher = {
        full_name: teacherFullNameInput.value,
        subject: teacherSubjectSelect.value,
        email: teacherEmailInput.value,
        classes: teacherClassesInput.value,
    };

    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    let auditAction = '';
    let auditDetails = '';

    if (id) {
        const updatedTeacher = await updateData('teachers', newTeacher, id);
        if (updatedTeacher) {
            teachers = teachers.map(t => t.id === id ? updatedTeacher : t);
            displayTeachers(teachers);
            toggleModal(teacherModal, false);
            auditAction = 'Updated Teacher';
            auditDetails = `Updated teacher: ${newTeacher.full_name} (ID: ${id})`;
        }
    } else {
        const addedTeacher = await insertData('teachers', newTeacher);
        if (addedTeacher) {
            teachers.push(addedTeacher);
            displayTeachers(teachers);
            toggleModal(teacherModal, false);
            auditAction = 'Added Teacher';
            auditDetails = `Added new teacher: ${newTeacher.full_name} (ID: ${addedTeacher.id})`;
        }
    }
    if (auditAction) {
        await addAuditLog(loggedInUserEmail, auditAction, 'Teachers', auditDetails);
    }
}

async function deleteTeacher(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can delete teachers.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this teacher?')) {
        const loggedInUserEmail = localStorage.getItem('loggedInUserName');
        const deletedTeacher = teachers.find(t => t.id === id);
        const success = await deleteData('teachers', id);
        if (success) {
            teachers = teachers.filter(t => t.id !== id);
            displayTeachers(teachers);
            await addAuditLog(loggedInUserEmail, 'Deleted Teacher', 'Teachers', `Deleted teacher: ${deletedTeacher?.full_name} (ID: ${deletedTeacher?.id})`);
        }
    }
}

// --- Payroll Module Functions ---

async function loadPayrollEntries() {
    payrollEntries = await fetchData('payroll');
    displayPayrollEntries();
}

function displayPayrollEntries() {
    if (!payrollTableBody) return;
    payrollTableBody.innerHTML = '';
    if (payrollEntries.length === 0) {
        payrollTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No payroll entries found.</td></tr>';
        return;
    }
    const currentUserRole = localStorage.getItem('loggedInUserRole');

    payrollEntries.forEach(entry => {
        const row = payrollTableBody.insertRow();
        row.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (entry.status) {
            case 'Processed': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Processing': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            case 'Pending': statusBgClass = 'bg-blue-100'; statusTextColorClass = 'text-blue-800'; break;
            default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
        }
        row.innerHTML = `
            <td class="py-3 px-4">${entry.period || 'N/A'}</td>
            <td class="py-3 px-4">${entry.staff_count || 0}</td>
            <td class="py-3 px-4">$${parseFloat(entry.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 ${statusBgClass} ${statusTextColorClass} text-xs rounded-full">${entry.status || 'N/A'}</span>
            </td>
            <td class="py-3 px-4">
                ${currentUserRole === 'admin' ? `
                <button class="text-red-600 hover:text-red-800" title="Delete Payroll Entry" onclick="deletePayrollEntry('${entry.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
    });
}

async function payrollFormSubmitHandler(event) {
    event.preventDefault();
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can process payroll.', 'error');
        return;
    }

    const periodInput = payrollPeriodInput.value;
    const staffCount = parseInt(staffCountInput.value);
    const totalAmount = parseFloat(totalAmountInput.value);

    if (!periodInput || isNaN(staffCount) || isNaN(totalAmount)) {
        showToast('Please fill in all fields correctly.', 'warning');
        return;
    }

    const [year, monthNum] = periodInput.split('-');
    const date = new Date(year, monthNum - 1);
    const formattedPeriod = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    const newPayrollEntry = {
        period: formattedPeriod,
        staff_count: staffCount,
        total_amount: totalAmount,
        status: 'Processed',
        date_processed: new Date().toISOString()
    };

    const loggedInUserEmail = localStorage.getItem('loggedInUserName');

    const addedEntry = await insertData('payroll', newPayrollEntry);
    if (addedEntry) {
        payrollEntries.push(addedEntry);
        displayPayrollEntries();
        toggleModal(payrollModal, false);
        await addAuditLog(loggedInUserEmail, 'Processed Payroll', 'Payroll', `Processed payroll for ${formattedPeriod}, amount: $${totalAmount}`);
    }
}

async function deletePayrollEntry(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can delete payroll entries.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this payroll entry?')) {
        const loggedInUserEmail = localStorage.getItem('loggedInUserName');
        const deletedEntry = payrollEntries.find(e => e.id === id);
        const success = await deleteData('payroll', id);
        if (success) {
            payrollEntries = payrollEntries.filter(e => e.id !== id);
            displayPayrollEntries();
            await addAuditLog(loggedInUserEmail, 'Deleted Payroll Entry', 'Payroll', `Deleted payroll entry for period: ${deletedEntry?.period}`);
        }
    }
}

// --- Finance Module Functions ---

async function loadInvoices() {
    invoices = await fetchData('invoices');
    displayInvoices();
}

function displayInvoices() {
    if (!financeTableBody) return;
    financeTableBody.innerHTML = '';
    if (invoices.length === 0) {
        financeTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No invoices found.</td></tr>';
        return;
    }
    const currentUserRole = localStorage.getItem('loggedInUserRole');

    invoices.forEach(invoice => {
        const row = financeTableBody.insertRow();
        row.className = 'border-b hover:bg-gray-50';
        let statusBgClass = '';
        let statusTextColorClass = '';
        switch (invoice.status) {
            case 'Paid': statusBgClass = 'bg-green-100'; statusTextColorClass = 'text-green-800'; break;
            case 'Pending': statusBgClass = 'bg-yellow-100'; statusTextColorClass = 'text-yellow-800'; break;
            case 'Overdue': statusBgClass = 'bg-red-100'; statusTextColorClass = 'text-red-800'; break;
            default: statusBgClass = 'bg-gray-100'; statusTextColorClass = 'text-gray-800'; break;
        }
        row.innerHTML = `
            <td class="py-3 px-4">${invoice.invoice_number || 'N/A'}</td>
            <td class="py-3 px-4">${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}</td>
            <td class="py-3 px-4">$${(invoice.amount || 0).toFixed(2)}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusBgClass} ${statusTextColorClass}">
                    ${invoice.status || 'N/A'}
                </span>
            </td>
            <td class="py-3 px-4">
                ${currentUserRole === 'admin' ? `
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="Edit Invoice" onclick="editInvoice('${invoice.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete Invoice" onclick="deleteInvoice('${invoice.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
    });
}

async function addInvoiceFormSubmitHandler(event) {
    event.preventDefault();
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can add invoices.', 'error');
        return;
    }

    const id = addInvoiceForm.dataset.editId;
    const invoiceData = {
        invoice_number: invoiceNumberInput.value,
        invoice_date: invoiceDateInput.value,
        amount: parseFloat(invoiceAmountInput.value),
        status: invoiceStatusSelect.value,
    };

    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    let auditAction = '';
    let auditDetails = '';

    if (id) {
        const updatedInvoice = await updateData('invoices', invoiceData, id);
        if (updatedInvoice) {
            invoices = invoices.map(i => i.id === id ? updatedInvoice : i);
            displayInvoices();
            toggleModal(addInvoiceModal, false);
            auditAction = 'Updated Invoice';
            auditDetails = `Updated invoice: ${invoiceData.invoice_number} (ID: ${id})`;
        }
    } else {
        const addedInvoice = await insertData('invoices', invoiceData);
        if (addedInvoice) {
            invoices.push(addedInvoice);
            displayInvoices();
            toggleModal(addInvoiceModal, false);
            auditAction = 'Added Invoice';
            auditDetails = `Added new invoice: ${invoiceData.invoice_number} (ID: ${addedInvoice.id})`;
        }
    }
    if (auditAction) {
        await addAuditLog(loggedInUserEmail, auditAction, 'Finance', auditDetails);
    }
}

function editInvoice(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can edit invoices.', 'error');
        return;
    }
    const invoice = invoices.find(i => i.id === id);
    if (invoice) {
        if (invoiceNumberInput) invoiceNumberInput.value = invoice.invoice_number || '';
        if (invoiceDateInput) invoiceDateInput.value = invoice.invoice_date || '';
        if (invoiceAmountInput) invoiceAmountInput.value = invoice.amount || 0;
        if (invoiceStatusSelect) invoiceStatusSelect.value = invoice.status || 'Pending';
        if (addInvoiceForm) addInvoiceForm.dataset.editId = invoice.id;
        if (addInvoiceModal) toggleModal(addInvoiceModal, true);
    }
}

async function deleteInvoice(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can delete invoices.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this invoice?')) {
        const loggedInUserEmail = localStorage.getItem('loggedInUserName');
        const deletedInvoice = invoices.find(i => i.id === id);
        const success = await deleteData('invoices', id);
        if (success) {
            invoices = invoices.filter(i => i.id !== id);
            displayInvoices();
            await addAuditLog(loggedInUserEmail, 'Deleted Invoice', 'Finance', `Deleted invoice: ${deletedInvoice?.invoice_number}`);
        }
    }
}

// --- Attendance Module Functions (Student) ---

async function loadStudentAttendance() {
    studentAttendanceRecords = await fetchData('student_attendance');
    displayStudentAttendance(studentAttendanceRecords);
    updateStudentAttendanceSummary(studentAttendanceRecords);
}

function displayStudentAttendance(filteredRecords) {
    if (!attendanceTableBody) return;
    attendanceTableBody.innerHTML = '';
    if (filteredRecords.length === 0) {
        attendanceTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No student attendance records found.</td></tr>';
        return;
    }
    const currentUserRole = localStorage.getItem('loggedInUserRole');

    filteredRecords.forEach(record => {
        const student = students.find(s => s.id === record.student_id);
        const studentName = student ? student.full_name : 'Unknown Student';
        const studentClass = student ? student.class : 'N/A';
        const studentRollNo = student ? student.roll_no : 'N/A';

        const row = attendanceTableBody.insertRow();
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${studentName}</td>
            <td class="py-3 px-4">${studentRollNo}</td>
            <td class="py-3 px-4">${studentClass}</td>
            <td class="py-3 px-4">${record.attendance_date ? new Date(record.attendance_date).toLocaleDateString() : 'N/A'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${record.status === 'Present' ? 'bg-green-100 text-green-800' : record.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${record.status || 'N/A'}
                </span>
            </td>
            <td class="py-3 px-4">${record.remarks || 'N/A'}</td>
            <td class="py-3 px-4">
                ${currentUserRole === 'admin' || currentUserRole === 'teacher' ? `
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="Edit Attendance" onclick="editStudentAttendance('${record.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete Attendance" onclick="deleteStudentAttendance('${record.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
    });
}

function updateStudentAttendanceSummary(records) {
    if (attendanceTotalStudents) attendanceTotalStudents.textContent = students.length;
    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    if (attendanceTotalPresent) attendanceTotalPresent.textContent = presentCount;
    if (attendanceTotalAbsent) attendanceTotalAbsent.textContent = absentCount;
}

function populateStudentAttendanceDropdown() {
    if (!attendanceStudentSelect) return;
    attendanceStudentSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.full_name || 'Unknown'} (Roll No: ${student.roll_no || 'N/A'})`;
        attendanceStudentSelect.appendChild(option);
    });
}

function showAddAttendanceModal() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can mark student attendance.', 'error');
        return;
    }
    if (attendanceModalTitle) attendanceModalTitle.textContent = 'Mark Attendance';
    if (attendanceFormSubmitBtn) attendanceFormSubmitBtn.textContent = 'Mark Attendance';
    if (attendanceForm) attendanceForm.reset();
    if (attendanceIdInput) attendanceIdInput.value = '';
    if (attendanceDateInput) attendanceDateInput.valueAsDate = new Date();
    if (attendanceModal) toggleModal(attendanceModal, true);
}

function editStudentAttendance(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can edit student attendance.', 'error');
        return;
    }
    const record = studentAttendanceRecords.find(r => r.id === id);
    if (record) {
        if (attendanceModalTitle) attendanceModalTitle.textContent = 'Edit Attendance';
        if (attendanceFormSubmitBtn) attendanceFormSubmitBtn.textContent = 'Save Changes';
        if (attendanceIdInput) attendanceIdInput.value = record.id;
        if (attendanceStudentSelect) attendanceStudentSelect.value = record.student_id || '';
        if (attendanceDateInput) attendanceDateInput.value = record.attendance_date || '';
        if (attendanceStatusSelect) attendanceStatusSelect.value = record.status || 'Present';
        if (attendanceRemarksTextarea) attendanceRemarksTextarea.value = record.remarks || '';
        if (attendanceModal) toggleModal(attendanceModal, true);
    }
}

async function attendanceFormSubmitHandler(event) {
    event.preventDefault();
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can mark student attendance.', 'error');
        return;
    }

    const id = attendanceIdInput.value;
    const newRecord = {
        student_id: attendanceStudentSelect.value,
        attendance_date: attendanceDateInput.value,
        status: attendanceStatusSelect.value,
        remarks: attendanceRemarksTextarea.value,
    };

    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    let auditAction = '';
    let auditDetails = '';

    if (id) {
        const updatedRecord = await updateData('student_attendance', newRecord, id);
        if (updatedRecord) {
            studentAttendanceRecords = studentAttendanceRecords.map(r => r.id === id ? updatedRecord : r);
            displayStudentAttendance(studentAttendanceRecords);
            updateStudentAttendanceSummary(studentAttendanceRecords);
            toggleModal(attendanceModal, false);
            auditAction = 'Updated Attendance';
            auditDetails = `Updated attendance for student ${newRecord.student_id} on ${newRecord.attendance_date} to ${newRecord.status}`;
        }
    } else {
        const addedRecord = await insertData('student_attendance', newRecord);
        if (addedRecord) {
            studentAttendanceRecords.push(addedRecord);
            displayStudentAttendance(studentAttendanceRecords);
            updateStudentAttendanceSummary(studentAttendanceRecords);
            toggleModal(attendanceModal, false);
            auditAction = 'Marked Attendance';
            auditDetails = `Marked ${newRecord.status} for student ${newRecord.student_id} on ${newRecord.attendance_date}`;
        }
    }
    if (auditAction) {
        await addAuditLog(loggedInUserEmail, auditAction, 'Attendance', auditDetails);
    }
}

async function deleteStudentAttendance(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can delete student attendance records.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this attendance record?')) {
        const loggedInUserEmail = localStorage.getItem('loggedInUserName');
        const deletedRecord = studentAttendanceRecords.find(r => r.id === id);
        const success = await deleteData('student_attendance', id);
        if (success) {
            studentAttendanceRecords = studentAttendanceRecords.filter(r => r.id !== id);
            displayStudentAttendance(studentAttendanceRecords);
            updateStudentAttendanceSummary(studentAttendanceRecords);
            await addAuditLog(loggedInUserEmail, 'Deleted Attendance', 'Attendance', `Deleted attendance record for ${deletedRecord?.student_id} on ${deletedRecord?.attendance_date}`);
        }
    }
}

function filterStudentAttendance() {
    const nameFilter = attendanceStudentNameFilter.value.toLowerCase();
    const classFilter = attendanceClassFilter.value;
    const dateFilter = attendanceDateFilter.value;

    const filtered = studentAttendanceRecords.filter(record => {
        const student = students.find(s => s.id === record.student_id);
        const studentName = student ? student.full_name.toLowerCase() : '';
        const studentClass = student ? student.class : '';

        const matchesName = studentName.includes(nameFilter);
        const matchesClass = classFilter === '' || studentClass === classFilter;
        const matchesDate = dateFilter === '' || record.attendance_date === dateFilter;

        return matchesName && matchesClass && matchesDate;
    });
    displayStudentAttendance(filtered);
    updateStudentAttendanceSummary(filtered);
}

// --- Teacher Attendance Module Functions ---

async function loadTeacherAttendance() {
    teacherAttendanceRecords = await fetchData('teacher_attendance');
    displayTeacherAttendance(teacherAttendanceRecords);
    updateTeacherAttendanceSummary(teacherAttendanceRecords);
}

function displayTeacherAttendance(filteredRecords) {
    if (!teacherAttendanceTableBody) return;
    teacherAttendanceTableBody.innerHTML = '';
    if (filteredRecords.length === 0) {
        teacherAttendanceTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No teacher attendance records found.</td></tr>';
        return;
    }
    const currentUserRole = localStorage.getItem('loggedInUserRole');

    filteredRecords.forEach(record => {
        const teacher = teachers.find(t => t.id === record.teacher_id);
        const teacherName = teacher ? teacher.full_name : 'Unknown Teacher';
        const teacherSubject = teacher ? teacher.subject : 'N/A';

        const row = teacherAttendanceTableBody.insertRow();
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${teacherName}</td>
            <td class="py-3 px-4">${teacherSubject}</td>
            <td class="py-3 px-4">${record.attendance_date ? new Date(record.attendance_date).toLocaleDateString() : 'N/A'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${record.status === 'Present' ? 'bg-green-100 text-green-800' : record.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${record.status || 'N/A'}
                </span>
            </td>
            <td class="py-3 px-4">${record.remarks || 'N/A'}</td>
            <td class="py-3 px-4">
                ${currentUserRole === 'admin' ? `
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="Edit Attendance" onclick="editTeacherAttendance('${record.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete Attendance" onclick="deleteTeacherAttendance('${record.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
    });
}

function updateTeacherAttendanceSummary(records) {
    if (teacherAttendanceTotalTeachers) teacherAttendanceTotalTeachers.textContent = teachers.length;
    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    if (teacherAttendanceTotalPresent) teacherAttendanceTotalPresent.textContent = presentCount;
    if (teacherAttendanceTotalAbsent) teacherAttendanceTotalAbsent.textContent = absentCount;
}

function populateTeacherAttendanceDropdown() {
    if (!teacherAttendanceTeacherSelect) return;
    teacherAttendanceTeacherSelect.innerHTML = '<option value="">Select Teacher</option>';
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = `${teacher.full_name || 'Unknown'} (${teacher.subject || 'N/A'})`;
        teacherAttendanceTeacherSelect.appendChild(option);
    });
}

function showAddTeacherAttendanceModal() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can mark teacher attendance.', 'error');
        return;
    }
    if (teacherAttendanceModalTitle) teacherAttendanceModalTitle.textContent = 'Mark Teacher Attendance';
    if (teacherAttendanceFormSubmitBtn) teacherAttendanceFormSubmitBtn.textContent = 'Mark Attendance';
    if (teacherAttendanceForm) teacherAttendanceForm.reset();
    if (teacherAttendanceIdInput) teacherAttendanceIdInput.value = '';
    if (teacherAttendanceDateInput) teacherAttendanceDateInput.valueAsDate = new Date();
    if (teacherAttendanceModal) toggleModal(teacherAttendanceModal, true);
}

function editTeacherAttendance(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can edit teacher attendance.', 'error');
        return;
    }
    const record = teacherAttendanceRecords.find(r => r.id === id);
    if (record) {
        if (teacherAttendanceModalTitle) teacherAttendanceModalTitle.textContent = 'Edit Attendance';
        if (teacherAttendanceFormSubmitBtn) teacherAttendanceFormSubmitBtn.textContent = 'Save Changes';
        if (teacherAttendanceIdInput) teacherAttendanceIdInput.value = record.id;
        if (teacherAttendanceTeacherSelect) teacherAttendanceTeacherSelect.value = record.teacher_id || '';
        if (teacherAttendanceDateInput) teacherAttendanceDateInput.value = record.attendance_date || '';
        if (teacherAttendanceStatusSelect) teacherAttendanceStatusSelect.value = record.status || 'Present';
        if (teacherAttendanceRemarksTextarea) teacherAttendanceRemarksTextarea.value = record.remarks || '';
        if (teacherAttendanceModal) toggleModal(teacherAttendanceModal, true);
    }
}

async function teacherAttendanceFormSubmitHandler(event) {
    event.preventDefault();
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can manage teacher attendance.', 'error');
        return;
    }

    const id = teacherAttendanceIdInput.value;
    const newRecord = {
        teacher_id: teacherAttendanceTeacherSelect.value,
        attendance_date: teacherAttendanceDateInput.value,
        status: teacherAttendanceStatusSelect.value,
        remarks: teacherAttendanceRemarksTextarea.value,
    };

    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    let auditAction = '';
    let auditDetails = '';

    if (id) {
        const updatedRecord = await updateData('teacher_attendance', newRecord, id);
        if (updatedRecord) {
            teacherAttendanceRecords = teacherAttendanceRecords.map(r => r.id === id ? updatedRecord : r);
            displayTeacherAttendance(teacherAttendanceRecords);
            updateTeacherAttendanceSummary(teacherAttendanceRecords);
            toggleModal(teacherAttendanceModal, false);
            auditAction = 'Updated Teacher Attendance';
            auditDetails = `Updated attendance for teacher ${newRecord.teacher_id} on ${newRecord.attendance_date} to ${newRecord.status}`;
        }
    } else {
        const addedRecord = await insertData('teacher_attendance', newRecord);
        if (addedRecord) {
            teacherAttendanceRecords.push(addedRecord);
            displayTeacherAttendance(teacherAttendanceRecords);
            updateTeacherAttendanceSummary(teacherAttendanceRecords);
            toggleModal(teacherAttendanceModal, false);
            auditAction = 'Marked Teacher Attendance';
            auditDetails = `Marked ${newRecord.status} for teacher ${newRecord.teacher_id} on ${newRecord.attendance_date}`;
        }
    }
    if (auditAction) {
        await addAuditLog(loggedInUserEmail, auditAction, 'Teacher Attendance', auditDetails);
    }
}

async function deleteTeacherAttendance(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can delete teacher attendance records.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this attendance record?')) {
        const loggedInUserEmail = localStorage.getItem('loggedInUserName');
        const deletedRecord = teacherAttendanceRecords.find(r => r.id === id);
        const success = await deleteData('teacher_attendance', id);
        if (success) {
            teacherAttendanceRecords = teacherAttendanceRecords.filter(r => r.id !== id);
            displayTeacherAttendance(teacherAttendanceRecords);
            updateTeacherAttendanceSummary(teacherAttendanceRecords);
            await addAuditLog(loggedInUserEmail, 'Deleted Teacher Attendance', 'Teacher Attendance', `Deleted attendance record for ${deletedRecord?.teacher_id} on ${deletedRecord?.attendance_date}`);
        }
    }
}

function filterTeacherAttendance() {
    const nameFilter = teacherAttendanceNameFilter.value.toLowerCase();
    const subjectFilter = teacherAttendanceSubjectFilter.value;
    const dateFilter = teacherAttendanceDateFilter.value;

    const filtered = teacherAttendanceRecords.filter(record => {
        const teacher = teachers.find(t => t.id === record.teacher_id);
        const teacherName = teacher ? teacher.full_name.toLowerCase() : '';
        const teacherSubject = teacher ? teacher.subject : '';

        const matchesName = nameFilter === '' || teacherName.includes(nameFilter);
        const matchesSubject = subjectFilter === '' || teacherSubject === subjectFilter;
        const matchesDate = dateFilter === '' || record.attendance_date === dateFilter;

        return matchesName && matchesSubject && matchesDate;
    });
    displayTeacherAttendance(filtered);
    updateTeacherAttendanceSummary(filtered);
}

// --- Calendar Module Functions ---

function initializeFullCalendar() {
    if (!fullCalendarEl) return;

    // Destroy existing calendar instance if it exists
    if (fullCalendarEl.fullCalendar) {
        fullCalendarEl.fullCalendar.destroy();
    }

    calendar = new FullCalendar.Calendar(fullCalendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        editable: true,
        selectable: true,
        events: schoolEvents.map(event => ({
            id: event.id,
            title: event.title,
            start: event.event_date,
            description: event.description,
            allDay: event.all_day || false,
            color: event.color || '#3788d8'
        })),
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
        dateClick: function(info) {
            const currentUserRole = localStorage.getItem('loggedInUserRole');
            if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
                showToast('Access Denied: Only admin and teachers can add calendar events.', 'error');
                return;
            }
            const title = prompt('Enter event title:');
            if (title) {
                const newEvent = {
                    title: title,
                    event_date: info.dateStr,
                    description: prompt('Enter event description (optional):') || '',
                    all_day: info.allDay,
                    color: '#3788d8'
                };
                addCalendarEvent(newEvent);
            }
        },
        eventClick: function(info) {
            const currentUserRole = localStorage.getItem('loggedInUserRole');
            if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
                showToast('Access Denied: Only admin and teachers can edit/delete calendar events.', 'error');
                return;
            }
            if (confirm(`Edit or Delete "${info.event.title}"?`)) {
                const newTitle = prompt('Edit title:', info.event.title);
                if (newTitle !== null) {
                    if (newTitle.trim() === '') {
                        deleteCalendarEvent(info.event.id);
                    } else {
                        const newDescription = prompt('Edit description:', info.event.extendedProps.description || '');
                        updateCalendarEvent(info.event.id, { title: newTitle, description: newDescription });
                    }
                }
            }
        },
        eventDrop: function(info) {
            const currentUserRole = localStorage.getItem('loggedInUserRole');
            if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
                showToast('Access Denied: Only admin and teachers can move calendar events.', 'error');
                info.revert(); // Revert the drag
                return;
            }
            updateCalendarEvent(info.event.id, { event_date: info.event.startStr });
        },
        eventResize: function(info) {
            const currentUserRole = localStorage.getItem('loggedInUserRole');
            if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
                showToast('Access Denied: Only admin and teachers can resize calendar events.', 'error');
                info.revert(); // Revert the resize
                return;
            }
            updateCalendarEvent(info.event.id, { event_date: info.event.startStr, end_date: info.event.endStr });
        }
    });
    calendar.render();
    fullCalendarEl.fullCalendar = calendar; // Store calendar instance on the element
}

async function loadCalendarEvents() {
    schoolEvents = await fetchData('events');
    if (fullCalendarEl && fullCalendarEl.fullCalendar) {
        fullCalendarEl.fullCalendar.setOption('events', schoolEvents.map(event => ({
            id: event.id,
            title: event.title,
            start: event.event_date,
            description: event.description,
            allDay: event.all_day || false,
            color: event.color || '#3788d8'
        })));
    }
}

async function addCalendarEvent(event) {
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    const addedEvent = await insertData('events', event);
    if (addedEvent) {
        schoolEvents.push(addedEvent);
        if (fullCalendarEl && fullCalendarEl.fullCalendar) {
            fullCalendarEl.fullCalendar.addEvent({
                id: addedEvent.id,
                title: addedEvent.title,
                start: addedEvent.event_date,
                description: addedEvent.description,
                allDay: addedEvent.all_day,
                color: addedEvent.color
            });
        }
        await addAuditLog(loggedInUserEmail, 'Added Calendar Event', 'Calendar', `Added event: "${addedEvent.title}"`);
    }
}

async function updateCalendarEvent(id, updates) {
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    const updatedEvent = await updateData('events', updates, id);
    if (updatedEvent) {
        schoolEvents = schoolEvents.map(e => e.id === id ? updatedEvent : e);
        await addAuditLog(loggedInUserEmail, 'Updated Calendar Event', 'Calendar', `Updated event: "${updatedEvent.title}"`);
    }
}

async function deleteCalendarEvent(id) {
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    if (confirm('Are you sure you want to delete this event?')) {
        const deletedEvent = schoolEvents.find(e => e.id === id);
        const success = await deleteData('events', id);
        if (success) {
            schoolEvents = schoolEvents.filter(e => e.id !== id);
            if (fullCalendarEl && fullCalendarEl.fullCalendar) {
                const eventToRemove = fullCalendarEl.fullCalendar.getEventById(id);
                if (eventToRemove) eventToRemove.remove();
            }
            await addAuditLog(loggedInUserEmail, 'Deleted Calendar Event', 'Calendar', `Deleted event: "${deletedEvent?.title}"`);
        }
    }
}

function renderHolidayList() {
    if (!holidayListContainer) return;
    holidayListContainer.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingHolidays = holidays
        .filter(holiday => new Date(holiday.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (upcomingHolidays.length === 0) {
        holidayListContainer.innerHTML = '<p class="text-gray-500">No upcoming holidays.</p>';
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
}

// --- Reports Module Functions ---

function renderReportsCharts() {
    const attendanceCtx = document.getElementById('attendanceChart');
    const performanceCtx = document.getElementById('performanceChart');

    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
        attendanceChartInstance = null;
    }
    if (performanceChartInstance) {
        performanceChartInstance.destroy();
        performanceChartInstance = null;
    }

    if (attendanceCtx && typeof Chart !== 'undefined') {
        attendanceChartInstance = new Chart(attendanceCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Average Attendance (%)',
                    data: [95, 92, 96, 90, 93, 97],
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderColor: 'rgba(79, 70, 229, 1)',
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

    if (performanceCtx && typeof Chart !== 'undefined') {
        performanceChartInstance = new Chart(performanceCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{
                    label: 'Average Exam Score',
                    data: [78, 82, 80, 85],
                    fill: false,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    tension: 0.1
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
}

// --- Audit Logs Module Functions ---

async function fetchAuditLogs() {
    auditLogs = await fetchData('audit_logs');
    displayAuditLogs(auditLogs);
}

function displayAuditLogs(logs) {
    const auditLogTableBody = document.getElementById('auditLogTableBody');
    if (!auditLogTableBody) return;
    auditLogTableBody.innerHTML = '';
    if (logs.length === 0) {
        auditLogTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No audit logs found.</td></tr>';
        return;
    }
    logs.forEach(log => {
        const row = auditLogTableBody.insertRow();
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
            <td class="py-3 px-4">${log.user_email || 'N/A'}</td>
            <td class="py-3 px-4">${log.action || 'N/A'}</td>
            <td class="py-3 px-4">${log.module || 'N/A'}</td>
            <td class="py-3 px-4">${log.details || 'N/A'}</td>
        `;
    });
}

// --- Backup & Restore Module Functions ---

async function fetchBackups() {
    // Backups are simulated, keeping that for now
    backups = JSON.parse(localStorage.getItem('backups')) || [
        { id: 'B001', backup_id: 'BK20231026-001', date: '2023-10-26 02:00:00', size: '150 MB', type: 'Full' },
        { id: 'B002', backup_id: 'BK20231025-001', date: '2023-10-25 02:00:00', size: '148 MB', type: 'Full' }
    ];
    displayBackupHistory(backups);
}

function displayBackupHistory(backups) {
    const backupTableBody = document.getElementById('backupTableBody');
    if (!backupTableBody) return;
    backupTableBody.innerHTML = '';
    if (backups.length === 0) {
        backupTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No backup history found.</td></tr>';
        return;
    }
    const currentUserRole = localStorage.getItem('loggedInUserRole');

    backups.forEach(backup => {
        const row = backupTableBody.insertRow();
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${backup.backup_id || 'N/A'}</td>
            <td class="py-3 px-4">${backup.date ? new Date(backup.date).toLocaleString() : 'N/A'}</td>
            <td class="py-3 px-4">${backup.size || 'N/A'}</td>
            <td class="py-3 px-4">${backup.type || 'N/A'}</td>
            <td class="py-3 px-4">
                ${currentUserRole === 'admin' ? `
                <button class="text-green-600 hover:text-green-800 mr-3" title="Download Backup" onclick="downloadBackup('${backup.id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="text-blue-600 hover:text-blue-800 mr-3" title="Restore from Backup" onclick="restoreBackup('${backup.id}')">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete Backup" onclick="deleteBackup('${backup.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
    });
}

function downloadBackup(id) {
    showToast(`Downloading backup ${id} (simulated).`, 'info');
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    addAuditLog(loggedInUserEmail, 'Downloaded Backup', 'Backup/Restore', `Downloaded backup: ${id}`);
}

function restoreBackup(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can restore backups.', 'error');
        return;
    }
    if (confirm(`Are you sure you want to restore from backup ${id}? This will overwrite current data.`)) {
        showToast(`Restoring from backup ${id} (simulated).`, 'warning');
        const loggedInUserEmail = localStorage.getItem('loggedInUserName');
        addAuditLog(loggedInUserEmail, 'Restored from Backup', 'Backup/Restore', `Restored from backup: ${id}`);
    }
}

async function deleteBackup(id) {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can delete backups.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this backup record?')) {
        const loggedInUserEmail = localStorage.getItem('loggedInUserName');
        // For simulated backups, just remove from array
        backups = backups.filter(b => b.id !== id);
        localStorage.setItem('backups', JSON.stringify(backups));
        displayBackupHistory(backups);
        showToast('Backup record deleted successfully!', 'success');
        await addAuditLog(loggedInUserEmail, 'Deleted Backup Record', 'Backup/Restore', `Deleted backup record: ${id}`);
    }
}

// --- Notification Functions ---

async function loadNotifications() {
    // Fetch notifications from Supabase (assuming a 'notifications' table)
    // You might want to filter by user_id if notifications are user-specific
    notifications = await fetchData('notifications');
    updateNotificationUI();
}

function updateNotificationUI() {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (notificationCount) {
        notificationCount.textContent = unreadCount > 0 ? unreadCount : '';
        notificationCount.classList.toggle('hidden', unreadCount === 0);
    }
    if (newCount) newCount.textContent = `${unreadCount} New`;

    if (!notificationList) return;
    notificationList.innerHTML = '';
    const recentNotifications = notifications.filter(n => !n.is_read).slice(0, 3);
    if (recentNotifications.length === 0) {
        notificationList.innerHTML = '<p class="text-gray-500 text-center py-4">No new notifications.</p>';
    } else {
        recentNotifications.forEach(n => {
            const notificationItem = document.createElement('div');
            notificationItem.className = 'notification-item';
            notificationItem.innerHTML = `
                <p>${n.message || 'N/A'}</p>
                <span class="timestamp">${n.created_at ? new Date(n.created_at).toLocaleString() : 'N/A'}</span>
            `;
            notificationItem.addEventListener('click', () => markNotificationAsRead(n.id));
            notificationList.appendChild(notificationItem);
        });
    }
}

async function markNotificationAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        const updated = await updateData('notifications', { is_read: true }, id);
        if (updated) {
            notification.is_read = true;
            updateNotificationUI();
            showToast('Notification marked as read.', 'info');
            const loggedInUserEmail = localStorage.getItem('loggedInUserName');
            await addAuditLog(loggedInUserEmail, 'Notification Read', 'Notifications', `Notification "${notification.message}" marked as read.`);
        }
    }
}

async function markAllNotificationsAsRead() {
    const unreadNotificationIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadNotificationIds.length > 0) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadNotificationIds);

        if (error) {
            console.error('Error marking all notifications as read:', error.message);
            showToast('Error marking all notifications as read.', 'error');
            return;
        }
    }

    notifications.forEach(n => n.is_read = true);
    updateNotificationUI();
    showToast('All notifications marked as read.', 'success');
    if (notificationDropdown) toggleModal(notificationDropdown, false);
    if (viewAllModal) toggleModal(viewAllModal, false);
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    await addAuditLog(loggedInUserEmail, 'All Notifications Read', 'Notifications', 'All notifications marked as read.');
}

function showAllNotifications() {
    if (!viewAllNotificationList) return;
    viewAllNotificationList.innerHTML = '';
    if (notifications.length === 0) {
        viewAllNotificationList.innerHTML = '<p class="text-gray-500 text-center py-4">No notifications to display.</p>';
    } else {
        notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        notifications.forEach(n => {
            const notificationItem = document.createElement('div');
            notificationItem.className = `notification-item p-3 border-b border-gray-200 ${n.is_read ? 'bg-gray-50' : 'bg-blue-50 font-semibold'}`;
            notificationItem.innerHTML = `
                <p>${n.message || 'N/A'}</p>
                <span class="text-xs text-gray-500">${n.created_at ? new Date(n.created_at).toLocaleString() : 'N/A'}</span>
            `;
            notificationItem.addEventListener('click', () => {
                markNotificationAsRead(n.id);
                showAllNotifications(); // Re-render to update read status
            });
            viewAllNotificationList.appendChild(notificationItem);
        });
    }
    if (viewAllModal) toggleModal(viewAllModal, true);
}

// --- Dark Mode Toggle ---
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDarkMode = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (darkModeToggle) darkModeToggle.querySelector('i').className = isDarkMode ? 'fas fa-sun text-yellow-400' : 'fas fa-moon text-gray-600';
}

function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        if (darkModeToggle) darkModeToggle.querySelector('i').className = 'fas fa-sun text-yellow-400';
    } else {
        document.documentElement.classList.remove('dark');
        if (darkModeToggle) darkModeToggle.querySelector('i').className = 'fas fa-moon text-gray-600';
    }
}

// --- Voice Assistant (Speech Recognition) ---
function startVoiceAssistant() {
    if (!('webkitSpeechRecognition' in window)) {
        showToast('Speech recognition not supported in this browser.', 'error');
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        showToast('Voice assistant listening...', 'info');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        showToast(`You said: "${transcript}"`, 'info');
        processVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        showToast(`Voice assistant error: ${event.error}`, 'error');
    };

    recognition.onend = () => {
        showToast('Voice assistant stopped.', 'info');
    };

    recognition.start();
}

function processVoiceCommand(command) {
    if (command.includes('open dashboard')) {
        showModule('dashboard');
    } else if (command.includes('open students')) {
        showModule('students');
    } else if (command.includes('open teachers')) {
        showModule('teachers');
    } else if (command.includes('open payroll')) {
        showModule('payroll');
    } else if (command.includes('open finance')) {
        showModule('finance');
    } else if (command.includes('open attendance')) {
        showModule('attendance');
    } else if (command.includes('open calendar')) {
        showModule('calendar');
    } else if (command.includes('open reports')) {
        showModule('reports');
    } else if (command.includes('open user management')) {
        showModule('user-management');
    } else if (command.includes('add student')) {
        showModule('students');
        showAddStudentForm();
    } else if (command.includes('add teacher')) {
        showModule('teachers');
        showAddTeacherForm();
    } else if (command.includes('mark student attendance')) {
        showModule('attendance');
        showAddAttendanceModal();
    } else if (command.includes('mark teacher attendance')) {
        showModule('teacher-attendance');
        showAddTeacherAttendanceModal();
    } else if (command.includes('logout')) {
        handleLogout();
    } else if (command.includes('dark mode on')) {
        if (!document.documentElement.classList.contains('dark')) {
            toggleDarkMode();
        }
    } else if (command.includes('light mode on')) {
        if (document.documentElement.classList.contains('dark')) {
            toggleDarkMode();
        }
    } else {
        showToast('Command not recognized. Please try again.', 'warning');
    }
}

// --- WebAuthn Integration ---

// Student Fingerprint Registration
if (registerStudentFingerprintBtn) {
    registerStudentFingerprintBtn.addEventListener('click', async () => {
        const currentUserRole = localStorage.getItem('loggedInUserRole');
        if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
            showToast('Access Denied: Only admin and teachers can register student fingerprints.', 'error');
            return;
        }
        const studentId = attendanceStudentSelect.value;
        if (!studentId) {
            showToast('Please select a student first.', 'warning');
            return;
        }
        const student = students.find(s => s.id === studentId);
        if (!student) {
            showToast('Selected student not found.', 'error');
            return;
        }

        const loggedInUserEmail = localStorage.getItem('loggedInUserName');

        try {
            const challenge = new Uint8Array(16);
            window.crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.create({
                publicKey: {
                    rp: {
                        name: "Tapowan Public School"
                    },
                    user: {
                        id: new TextEncoder().encode(student.id),
                        name: student.email || student.id,
                        displayName: student.full_name
                    },
                    challenge: challenge,
                    pubKeyCredParams: [{
                        type: "public-key",
                        alg: -7 // ES256
                    }, {
                        type: "public-key",
                        alg: -257 // RS256
                    }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        residentKey: "required"
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            });

            const { error } = await supabase.from('students').update({
                fingerprint_credential: {
                    id: arrayBufferToBase64(credential.rawId),
                    publicKey: arrayBufferToBase64(credential.response.getPublicKey()),
                    authenticatorData: arrayBufferToBase64(credential.response.authenticatorData),
                    clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
                }
            }).eq('id', student.id);

            if (error) throw error;

            showToast(`Fingerprint registered successfully for ${student.full_name}!`, 'success');
            await addAuditLog(loggedInUserEmail, 'Registered Fingerprint', 'Attendance', `Registered fingerprint for student: ${student.full_name} (ID: ${student.id})`);
            await loadStudents(); // Reload students to update data
        } catch (error) {
            console.error("Fingerprint registration failed:", error);
            showToast(`Fingerprint registration failed: ${error.message || error}`, 'error');
            await addAuditLog(loggedInUserEmail, 'Fingerprint Registration Failed', 'Attendance', `Failed to register fingerprint for student: ${student.full_name} - ${error.message}`);
        }
    });
}

// Student Fingerprint Verification
if (verifyStudentFingerprintBtn) {
    verifyStudentFingerprintBtn.addEventListener('click', async () => {
        const currentUserRole = localStorage.getItem('loggedInUserRole');
        // Allow admin, teacher, or student (if they have a fingerprint registered for themselves) to verify
        if (!['admin', 'teacher', 'student'].includes(currentUserRole)) {
            showToast('Access Denied: You do not have permission to verify student fingerprints.', 'error');
            return;
        }
        const studentId = attendanceStudentSelect.value;
        if (!studentId) {
            showToast('Please select a student first.', 'warning');
            return;
        }
        const student = students.find(s => s.id === studentId);
        if (!student) {
            showToast('Selected student not found.', 'error');
            return;
        }
        if (!student.fingerprint_credential) {
            showToast('No fingerprint registered for this student. Please register one first.', 'warning');
            return;
        }

        const loggedInUserEmail = localStorage.getItem('loggedInUserName');

        try {
            const challenge = new Uint8Array(16);
            window.crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    allowCredentials: [{
                        id: base64ToArrayBuffer(student.fingerprint_credential.id),
                        type: "public-key"
                    }],
                    userVerification: "required",
                    timeout: 60000
                }
            });

            showToast(`Fingerprint verified successfully for ${student.full_name}! Attendance marked as Present.`, 'success');
            if (attendanceStatusSelect) attendanceStatusSelect.value = 'Present';
            // Automatically submit attendance form
            if (attendanceFormSubmitBtn) attendanceFormSubmitBtn.click();
            await addAuditLog(loggedInUserEmail, 'Verified Fingerprint', 'Attendance', `Verified fingerprint for student: ${student.full_name} (ID: ${student.id}) - Marked Present`);
        } catch (error) {
            console.error("Fingerprint verification failed:", error);
            showToast(`Fingerprint verification failed: ${error.message || error}`, 'error');
            await addAuditLog(loggedInUserEmail, 'Fingerprint Verification Failed', 'Attendance', `Failed to verify fingerprint for student: ${student.full_name} - ${error.message}`);
        }
    });
}

// Teacher Fingerprint Registration
if (registerTeacherFingerprintBtn) {
    registerTeacherFingerprintBtn.addEventListener('click', async () => {
        const currentUserRole = localStorage.getItem('loggedInUserRole');
        if (currentUserRole !== 'admin') {
            showToast('Access Denied: Only admin can register teacher fingerprints.', 'error');
            return;
        }
        const teacherId = teacherAttendanceTeacherSelect.value;
        if (!teacherId) {
            showToast('Please select a teacher first.', 'warning');
            return;
        }
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) {
            showToast('Selected teacher not found.', 'error');
            return;
        }

        const loggedInUserEmail = localStorage.getItem('loggedInUserName');

        try {
            const challenge = new Uint8Array(16);
            window.crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.create({
                publicKey: {
                    rp: {
                        name: "Tapowan Public School"
                    },
                    user: {
                        id: new TextEncoder().encode(teacher.id),
                        name: teacher.email || teacher.id,
                        displayName: teacher.full_name
                    },
                    challenge: challenge,
                    pubKeyCredParams: [{
                        type: "public-key",
                        alg: -7
                    }, {
                        type: "public-key",
                        alg: -257
                    }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        residentKey: "required"
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            });

            const { error } = await supabase.from('teachers').update({
                fingerprint_credential: {
                    id: arrayBufferToBase64(credential.rawId),
                    publicKey: arrayBufferToBase64(credential.response.getPublicKey()),
                    authenticatorData: arrayBufferToBase64(credential.response.authenticatorData),
                    clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
                }
            }).eq('id', teacher.id);

            if (error) throw error;

            showToast(`Fingerprint registered successfully for ${teacher.full_name}!`, 'success');
            await addAuditLog(loggedInUserEmail, 'Registered Fingerprint', 'Attendance', `Registered fingerprint for teacher: ${teacher.full_name} (ID: ${teacher.id})`);
            await loadTeachers(); // Reload teachers to update data
        } catch (error) {
            console.error("Fingerprint registration failed:", error);
            showToast(`Fingerprint registration failed: ${error.message || error}`, 'error');
            await addAuditLog(loggedInUserEmail, 'Fingerprint Registration Failed', 'Attendance', `Failed to register fingerprint for teacher: ${teacher.full_name} - ${error.message}`);
        }
    });
}

// Teacher Fingerprint Verification
if (verifyTeacherFingerprintBtn) {
    verifyTeacherFingerprintBtn.addEventListener('click', async () => {
        const currentUserRole = localStorage.getItem('loggedInUserRole');
        if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
            showToast('Access Denied: You do not have permission to verify teacher fingerprints.', 'error');
            return;
        }
        const teacherId = teacherAttendanceTeacherSelect.value;
        if (!teacherId) {
            showToast('Please select a teacher first.', 'warning');
            return;
        }
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) {
            showToast('Selected teacher not found.', 'error');
            return;
        }
        if (!teacher.fingerprint_credential) {
            showToast('No fingerprint registered for this teacher. Please register one first.', 'warning');
            return;
        }

        const loggedInUserEmail = localStorage.getItem('loggedInUserName');

        try {
            const challenge = new Uint8Array(16);
            window.crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    allowCredentials: [{
                        id: base64ToArrayBuffer(teacher.fingerprint_credential.id),
                        type: "public-key"
                    }],
                    userVerification: "required",
                    timeout: 60000
                }
            });

            showToast(`Fingerprint verified successfully for ${teacher.full_name}! Attendance marked as Present.`, 'success');
            if (teacherAttendanceStatusSelect) teacherAttendanceStatusSelect.value = 'Present';
            // Automatically submit attendance form
            if (teacherAttendanceFormSubmitBtn) teacherAttendanceFormSubmitBtn.click();
            await addAuditLog(loggedInUserEmail, 'Verified Fingerprint', 'Teacher Attendance', `Verified fingerprint for teacher: ${teacher.full_name} (ID: ${teacher.id})`);
        } catch (error) {
            console.error("Fingerprint verification failed:", error);
            showToast(`Fingerprint verification failed: ${error.message || error}`, 'error');
            await addAuditLog(loggedInUserEmail, 'Fingerprint Verification Failed', 'Teacher Attendance', `Failed to verify fingerprint for teacher: ${teacher.full_name} - ${error.message}`);
        }
    });
}

// --- Export to Excel Functionality ---
function exportToExcel(data, filename) {
    if (typeof XLSX === 'undefined') {
        showToast('Excel export library (SheetJS) not loaded. Please ensure it is included in your HTML.', 'error');
        console.error('XLSX library is not available. Please ensure it is included in your HTML.');
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, filename);
}

// Export Students to Excel
window.exportStudentsToExcel = function() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can export student data.', 'error');
        return;
    }
    const studentData = students.map(student => ({
        ID: student.id,
        Name: student.full_name,
        "Father's_Name": student.father_name,
        "Mother's_Name": student.mother_name,
        Class: student.class,
        Roll_No: student.roll_no,
        Aadhar_No: student.aadhar_no,
        Email: student.email,
        Phone: student.phone,
        Status: student.status
    }));
    exportToExcel(studentData, 'students_data.xlsx');
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    addAuditLog(loggedInUserEmail, 'Exported Data', 'Students', 'Exported student data to Excel.');
}

// Export Teachers to Excel
window.exportTeachersToExcel = function() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can export teacher data.', 'error');
        return;
    }
    const teacherData = teachers.map(teacher => ({
        ID: teacher.id,
        Name: teacher.full_name,
        Subject: teacher.subject,
        Email: teacher.email,
        Classes: teacher.classes
    }));
    exportToExcel(teacherData, 'teachers_data.xlsx');
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    addAuditLog(loggedInUserEmail, 'Exported Data', 'Teachers', 'Exported teacher data to Excel.');
}

// Export Users to Excel (Now exports from profiles data)
window.exportUsersToExcel = function() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can export user data.', 'error');
        return;
    }
    const userData = profiles.map(profile => ({
        ID: profile.id,
        "Full Name": profile.full_name,
        Email: profile.email,
        Role: profile.role,
        Status: profile.status
    }));
    exportToExcel(userData, 'users_data.xlsx');
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    addAuditLog(loggedInUserEmail, 'Exported Data', 'User Management', 'Exported user profile data to Excel.');
}

// Export Payroll to Excel
window.exportPayrollToExcel = function() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can export payroll data.', 'error');
        return;
    }
    const payrollData = payrollEntries.map(entry => ({
        Period: entry.period,
        Staff_Count: entry.staff_count,
        Total_Amount: entry.total_amount,
        Status: entry.status
    }));
    exportToExcel(payrollData, 'payroll_data.xlsx');
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    addAuditLog(loggedInUserEmail, 'Exported Data', 'Payroll', 'Exported payroll data to Excel.');
}

// Export Invoices to Excel
window.exportInvoicesToExcel = function() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can export invoice data.', 'error');
        return;
    }
    const invoiceData = invoices.map(invoice => ({
        Invoice_Number: invoice.invoice_number,
        Date: invoice.invoice_date,
        Amount: invoice.amount,
        Status: invoice.status
    }));
    exportToExcel(invoiceData, 'invoices_data.xlsx');
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    addAuditLog(loggedInUserEmail, 'Exported Data', 'Finance', 'Exported invoice data to Excel.');
}

// Export Announcements to Excel
window.exportAnnouncementsToExcel = function() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can export announcements.', 'error');
        return;
    }
    const announcementData = announcements.map(announcement => ({
        Title: announcement.title,
        Content: announcement.content,
        Date_Posted: announcement.date_posted,
        Status: announcement.status
    }));
    exportToExcel(announcementData, 'announcements_data.xlsx');
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    addAuditLog(loggedInUserEmail, 'Exported Data', 'Announcements', 'Exported announcement data to Excel.');
}

// Export Student Attendance to Excel
window.exportStudentAttendanceToExcel = function() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        showToast('Access Denied: Only admin and teachers can export student attendance data.', 'error');
        return;
    }
    const attendanceExportData = studentAttendanceRecords.map(record => {
        const student = students.find(s => s.id === record.student_id);
        return {
            Student_Name: student ? student.full_name : 'Unknown',
            Roll_No: student ? student.roll_no : 'N/A',
            Class: student ? student.class : 'N/A',
            Date: record.attendance_date ? new Date(record.attendance_date).toLocaleDateString() : 'N/A',
            Status: record.status,
            Remarks: record.remarks
        };
    });
    exportToExcel(attendanceExportData, 'student_attendance_data.xlsx');
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    addAuditLog(loggedInUserEmail, 'Exported Data', 'Attendance', 'Exported student attendance data to Excel.');
}

// Export Teacher Attendance to Excel
window.exportTeacherAttendanceToExcel = function() {
    const currentUserRole = localStorage.getItem('loggedInUserRole');
    if (currentUserRole !== 'admin') {
        showToast('Access Denied: Only admin can export teacher attendance data.', 'error');
        return;
    }
    const teacherAttendanceExportData = teacherAttendanceRecords.map(record => {
        const teacher = teachers.find(t => t.id === record.teacher_id);
        return {
            Teacher_Name: teacher ? teacher.full_name : 'Unknown',
            Subject: teacher ? teacher.subject : 'N/A',
            Date: record.attendance_date ? new Date(record.attendance_date).toLocaleDateString() : 'N/A',
            Status: record.status,
            Remarks: record.remarks
        };
    });
    exportToExcel(teacherAttendanceExportData, 'teacher_attendance_data.xlsx');
    const loggedInUserEmail = localStorage.getItem('loggedInUserName');
    addAuditLog(loggedInUserEmail, 'Exported Data', 'Teacher Attendance', 'Exported teacher attendance data to Excel.');
}
