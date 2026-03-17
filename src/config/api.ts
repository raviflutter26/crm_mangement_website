// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5001";
export const API_BASE_URL = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

export const API_ENDPOINTS = {
    // Auth
    AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
    AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
    AUTH_USERS: `${API_BASE_URL}/api/auth/users`,
    AUTH_FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    AUTH_RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,

    // Dashboard
    DASHBOARD: `${API_BASE_URL}/api/dashboard`,

    // Employees
    EMPLOYEES: `${API_BASE_URL}/api/employees`,

    // Departments
    DEPARTMENTS: `${API_BASE_URL}/api/departments`,

    // Attendance
    ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    ATTENDANCE_TODAY_SUMMARY: `${API_BASE_URL}/api/attendance/today-summary`,
    ATTENDANCE_CHECK_IN: `${API_BASE_URL}/api/attendance/check-in`,
    ATTENDANCE_CHECK_OUT: `${API_BASE_URL}/api/attendance/check-out`,
    ATTENDANCE_REGULARIZE: `${API_BASE_URL}/api/attendance/regularize`,
    ATTENDANCE_MONTHLY_REPORT: `${API_BASE_URL}/api/attendance/monthly-report`,

    // Leave
    LEAVES: `${API_BASE_URL}/api/leaves`,

    // Payroll
    PAYROLL: `${API_BASE_URL}/api/payroll`,
    PAYROLL_SUMMARY: `${API_BASE_URL}/api/payroll/summary`,

    // Payroll Runs
    PAYROLL_RUNS: `${API_BASE_URL}/api/payroll-runs`,
    PAYROLL_RUNS_INITIATE: `${API_BASE_URL}/api/payroll-runs/initiate`,

    // Compliance
    COMPLIANCE: `${API_BASE_URL}/api/compliance`,
    COMPLIANCE_PT_SLABS: `${API_BASE_URL}/api/compliance/pt-slabs`,

    // Salary Structures
    SALARY_STRUCTURES: `${API_BASE_URL}/api/salary-structures`,

    // Organization
    DESIGNATIONS: `${API_BASE_URL}/api/organization/designations`,
    BRANCHES: `${API_BASE_URL}/api/organization/branches`,
    LOCATIONS: `${API_BASE_URL}/api/organization/locations`,
    SHIFTS: `${API_BASE_URL}/api/organization/shifts`,
    HOLIDAYS: `${API_BASE_URL}/api/organization/holidays`,

    // Recruitment
    JOB_POSTINGS: `${API_BASE_URL}/api/recruitment/job-postings`,
    CANDIDATES: `${API_BASE_URL}/api/recruitment/candidates`,

    // Performance
    GOALS: `${API_BASE_URL}/api/performance/goals`,
    APPRAISALS: `${API_BASE_URL}/api/performance/appraisals`,

    // Expenses
    EXPENSES: `${API_BASE_URL}/api/expenses`,

    // Assets
    ASSETS: `${API_BASE_URL}/api/assets`,

    // Support Tickets
    SUPPORT_TICKETS: `${API_BASE_URL}/api/support-tickets`,

    // Permissions
    PERMISSIONS_REQUEST: `${API_BASE_URL}/api/permissions/request`,
    PERMISSIONS_MINE: `${API_BASE_URL}/api/permissions/my-permissions`,
    PERMISSIONS_TEAM: `${API_BASE_URL}/api/permissions/team-permissions`,
    PERMISSIONS_APPROVE: (id: string) => `${API_BASE_URL}/api/permissions/${id}/approve`,
    PERMISSIONS_CANCEL: (id: string) => `${API_BASE_URL}/api/permissions/${id}/cancel`,

    // Role Permissions management
    ROLE_PERMISSIONS: `${API_BASE_URL}/api/role-permissions`,

    // Payroll Reports
    PAYROLL_REPORTS: `${API_BASE_URL}/api/payroll/reports`,
    PAYROLL_REPORTS_EXPORT: `${API_BASE_URL}/api/payroll/reports/export`,
};

export default API_ENDPOINTS;
