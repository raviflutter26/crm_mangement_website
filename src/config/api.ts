// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
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
    ATTENDANCE_SETTINGS: `${API_BASE_URL}/api/attendance-config`,

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

    // Salary Components
    SALARY_COMPONENTS: `${API_BASE_URL}/api/salary-components`,

    // Organization
    LOCATIONS: `${API_BASE_URL}/api/locations`,
    DESIGNATIONS: `${API_BASE_URL}/api/organizations/designations`,
    BRANCHES: `${API_BASE_URL}/api/organizations/branches`,
    SHIFTS: `${API_BASE_URL}/api/organizations/shifts`,
    HOLIDAYS: `${API_BASE_URL}/api/organizations/holidays`,

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
    PERMISSIONS_QUOTA: `${API_BASE_URL}/api/permissions/quota`,
    PERMISSIONS_CONFIG: `${API_BASE_URL}/api/admin/config/permission`,
    PERMISSIONS_APPROVE: (id: string) => `${API_BASE_URL}/api/permissions/${id}/approve`,
    PERMISSIONS_CANCEL: (id: string) => `${API_BASE_URL}/api/permissions/${id}/cancel`,

    // Role Permissions management
    ROLE_PERMISSIONS: `${API_BASE_URL}/api/role-permissions`,

    // Payroll Reports
    PAYROLL_REPORTS: `${API_BASE_URL}/api/payroll/reports`,
    PAYROLL_REPORTS_EXPORT: `${API_BASE_URL}/api/payroll/reports/export`,

    // Payouts (RazorpayX)
    PAYOUTS_INITIATE: `${API_BASE_URL}/api/payouts/initiate`,
    PAYOUTS_PREPARE: (empId: string) => `${API_BASE_URL}/api/payouts/prepare/${empId}`,
    PAYOUTS_STATUS: `${API_BASE_URL}/api/payouts/status`,
    PAYOUTS_BY_RUN: (runId: string) => `${API_BASE_URL}/api/payouts/run/${runId}`,
    PAYOUTS_RETRY: (payoutId: string) => `${API_BASE_URL}/api/payouts/${payoutId}/retry`,
    PAYOUTS_HISTORY: `${API_BASE_URL}/api/payouts/history`,

    // Bank
    BANK_IFSC: (code: string) => `${API_BASE_URL}/api/bank/ifsc/${code}`,
    BANK_UPDATE: `${API_BASE_URL}/api/bank/update`,
    BANK_EMPLOYEE: (empId: string) => `${API_BASE_URL}/api/employees/${empId}/bank`,
    BANK_VERIFY: (empId: string) => `${API_BASE_URL}/api/employees/${empId}/bank/verify`,

    // Payroll Lock
    PAYROLL_LOCK: (runId: string) => `${API_BASE_URL}/api/payroll-runs/${runId}/lock`,
    PAYROLL_UNLOCK: (runId: string) => `${API_BASE_URL}/api/payroll-runs/${runId}/unlock`,

    // Payroll Attendance Integration
    PAYROLL_ATTENDANCE_SUMMARY: `${API_BASE_URL}/api/payroll/attendance-summary`,

    // Salary Structures (per employee)
    EMPLOYEE_SALARY_STRUCTURE: (empId: string) => `${API_BASE_URL}/api/employees/${empId}/salary-structure`,

    // Audit Logs
    PAYROLL_AUDIT_LOGS: `${API_BASE_URL}/api/payroll/audit-logs`,

    // ─── NEW Phase 2 Modules ─────────────────────────────────────

    // Projects
    PROJECTS: `${API_BASE_URL}/api/projects`,

    // Vendors
    VENDORS: `${API_BASE_URL}/api/vendors`,

    // Job Cards / Work Logs
    JOB_CARDS: `${API_BASE_URL}/api/job-cards`,
    JOB_CARDS_MY: `${API_BASE_URL}/api/job-cards/my`,

    // Travel Requests
    TRAVEL_REQUESTS: `${API_BASE_URL}/api/travel-requests`,
    TRAVEL_REQUESTS_MY: `${API_BASE_URL}/api/travel-requests/my`,

    // Incidents
    INCIDENTS: `${API_BASE_URL}/api/incidents`,
    INCIDENTS_MY: `${API_BASE_URL}/api/incidents/my`,

    // PPE Records
    PPE_RECORDS: `${API_BASE_URL}/api/ppe-records`,
    PPE_RECORDS_MY: `${API_BASE_URL}/api/ppe-records/my`,

    // Reimbursements
    REIMBURSEMENTS: `${API_BASE_URL}/api/reimbursements`,
    REIMBURSEMENTS_MY: `${API_BASE_URL}/api/reimbursements/my`,

    // Site Allowances
    SITE_ALLOWANCES: `${API_BASE_URL}/api/site-allowances`,
    SITE_ALLOWANCES_MY: `${API_BASE_URL}/api/site-allowances/my`,

    // Training
    TRAININGS: `${API_BASE_URL}/api/trainings`,

    // Certifications
    CERTIFICATIONS: `${API_BASE_URL}/api/certifications`,
    CERTIFICATIONS_MY: `${API_BASE_URL}/api/certifications/my`,

    // Announcements
    ANNOUNCEMENTS: `${API_BASE_URL}/api/announcements`,

    // Employee Documents
    EMPLOYEE_DOCUMENTS: `${API_BASE_URL}/api/employee-documents`,
    EMPLOYEE_DOCUMENTS_MY: `${API_BASE_URL}/api/employee-documents/my`,

    // Timesheets
    TIMESHEETS: `${API_BASE_URL}/api/timesheets`,
    TIMESHEETS_MY: `${API_BASE_URL}/api/timesheets/my`,
};

export default API_ENDPOINTS;
