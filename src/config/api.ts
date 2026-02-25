// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://59cwtf0p-5001.inc1.devtunnels.ms";
export const API_BASE_URL = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

export const API_ENDPOINTS = {
    // Auth
    AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
    AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,

    // Dashboard
    DASHBOARD: `${API_BASE_URL}/api/dashboard`,

    // Employees
    EMPLOYEES: `${API_BASE_URL}/api/employees`,

    // Departments
    DEPARTMENTS: `${API_BASE_URL}/api/departments`,

    // Attendance
    ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    ATTENDANCE_TODAY_SUMMARY: `${API_BASE_URL}/api/attendance/today-summary`,

    // Leave
    LEAVES: `${API_BASE_URL}/api/leaves`,

    // Payroll
    PAYROLL: `${API_BASE_URL}/api/payroll`,
    PAYROLL_SUMMARY: `${API_BASE_URL}/api/payroll/summary`,
};

export default API_ENDPOINTS;
