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

    // In-app notifications (topbar bell)
    NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
    NOTIFICATIONS_READ: (id: string) => `${API_BASE_URL}/api/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: `${API_BASE_URL}/api/notifications/read-all`,

    // Dashboard
    DASHBOARD: `${API_BASE_URL}/api/dashboard`,

    // Employees
    EMPLOYEES: `${API_BASE_URL}/api/employees`,
    // Colleagues of the caller (any role); public work fields only.
    EMPLOYEES_TEAM: `${API_BASE_URL}/api/employees/team`,

    // Departments
    DEPARTMENTS: `${API_BASE_URL}/api/departments`,

    // Attendance
    ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    ATTENDANCE_TODAY_SUMMARY: `${API_BASE_URL}/api/attendance/today-summary`,
    ATTENDANCE_CHECK_IN: `${API_BASE_URL}/api/attendance/check-in`,
    ATTENDANCE_CHECK_OUT: `${API_BASE_URL}/api/attendance/check-out`,
    ATTENDANCE_REGULARIZE: `${API_BASE_URL}/api/attendance/regularize`,
    ATTENDANCE_MONTHLY_REPORT: `${API_BASE_URL}/api/attendance/monthly-report`,
    // Field operations: today's site/GPS check-ins, and each employee's last known position.
    ATTENDANCE_FIELD_TODAY: `${API_BASE_URL}/api/attendance/field-today`,
    ATTENDANCE_LAST_LOCATIONS: `${API_BASE_URL}/api/attendance/last-locations`,
    ATTENDANCE_SETTINGS: `${API_BASE_URL}/api/attendance-config`,

    // Leave
    LEAVES: `${API_BASE_URL}/api/leaves`,

    // Payroll
    PAYROLL: `${API_BASE_URL}/api/payroll`,
    PAYROLL_SUMMARY: `${API_BASE_URL}/api/payroll/summary`,

    // Payroll Runs
    PAYROLL_RUNS: `${API_BASE_URL}/api/payroll-runs`,
    PAYROLL_RUNS_INITIATE: `${API_BASE_URL}/api/payroll-runs/initiate`,
    // Each branch the caller reaches with its run for ?month=&year= (per-branch payroll).
    PAYROLL_RUNS_OVERVIEW: `${API_BASE_URL}/api/payroll-runs/overview`,

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
    // Scope-aware branch list: only the branches the caller holds.
    BRANCH_LIST: `${API_BASE_URL}/api/branches`,
    // Shift definitions live at /api/shifts; /api/organizations/shifts matched GET /organizations/:id.
    SHIFTS: `${API_BASE_URL}/api/shifts`,
    HOLIDAYS: `${API_BASE_URL}/api/organizations/holidays`,

    // Recruitment
    JOB_POSTINGS: `${API_BASE_URL}/api/recruitment/job-postings`,
    CANDIDATES: `${API_BASE_URL}/api/recruitment/candidates`,
    CANDIDATE_STATUS: (id: string) => `${API_BASE_URL}/api/recruitment/candidates/${id}/status`,
    CANDIDATE_CONVERT: (id: string) => `${API_BASE_URL}/api/recruitment/candidates/${id}/convert`,
    INTERVIEWS: `${API_BASE_URL}/api/recruitment/interviews`,
    INTERVIEW_FEEDBACK: (id: string) => `${API_BASE_URL}/api/recruitment/interviews/${id}/feedback`,

    // Performance
    GOALS: `${API_BASE_URL}/api/performance/goals`,
    APPRAISALS: `${API_BASE_URL}/api/performance/appraisals`,
    APPRAISAL_SELF_REVIEW: (id: string) => `${API_BASE_URL}/api/performance/appraisals/${id}/self-review`,
    APPRAISAL_MANAGER_REVIEW: (id: string) => `${API_BASE_URL}/api/performance/appraisals/${id}/manager-review`,
    APPRAISAL_FINALIZE: (id: string) => `${API_BASE_URL}/api/performance/appraisals/${id}/finalize`,
    APPRAISAL_CYCLES: `${API_BASE_URL}/api/performance/cycles`,

    // Exits (resignation, termination, F&F) and transfers
    SEPARATIONS: `${API_BASE_URL}/api/separations`,
    SEPARATIONS_MY: `${API_BASE_URL}/api/separations/my`,
    SEPARATION_TERMINATE: `${API_BASE_URL}/api/separations/terminate`,
    TRANSFERS: `${API_BASE_URL}/api/transfers`,
    EMPLOYEE_TRANSFERS: (empId: string) => `${API_BASE_URL}/api/employees/${empId}/transfers`,

    // Expenses
    EXPENSES: `${API_BASE_URL}/api/expenses`,

    // Assets
    ASSETS: `${API_BASE_URL}/api/assets`,
    ASSETS_MY: `${API_BASE_URL}/api/assets/my`,

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
    PAYOUTS_EMPLOYEES: `${API_BASE_URL}/api/payouts/employees`,
    PAYOUTS_RECONCILIATION: `${API_BASE_URL}/api/payouts/reconciliation`,
    PAYOUTS_REFRESH_STATUS: (payoutId: string) => `${API_BASE_URL}/api/payouts/${payoutId}/refresh-status`,

    // Payslip PDF, loans, tax declarations, statutory filing files
    PAYSLIP_PDF: (payrollId: string) => `${API_BASE_URL}/api/payroll/${payrollId}/payslip.pdf`,
    LOANS: `${API_BASE_URL}/api/loans`,
    TAX_DECLARATIONS: `${API_BASE_URL}/api/tax-declarations`,
    TAX_DECLARATIONS_MY: `${API_BASE_URL}/api/tax-declarations/my`,
    TAX_DECLARATION_VERIFY: (id: string) => `${API_BASE_URL}/api/tax-declarations/${id}/verify`,
    STATUTORY_FILING: (kind: "ecr" | "esic" | "pt" | "form24q") => `${API_BASE_URL}/api/statutory/filings/${kind}`,
    FORM16: (employeeId: string) => `${API_BASE_URL}/api/statutory/filings/form16/${employeeId}`,

    // Bank
    BANK_IFSC: (code: string) => `${API_BASE_URL}/api/bank/ifsc/${code}`,
    BANK_UPDATE: `${API_BASE_URL}/api/bank/update`,
    BANK_EMPLOYEE: (empId: string) => `${API_BASE_URL}/api/employees/${empId}/bank`,
    BANK_VERIFY: (empId: string) => `${API_BASE_URL}/api/payouts/bank/verify/${empId}`,

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

    // Skills
    SKILLS: `${API_BASE_URL}/api/skills`,
    SKILLS_MY: `${API_BASE_URL}/api/skills/my`,

    // Tax Documents
    TAX_DOCUMENTS: `${API_BASE_URL}/api/tax-documents`,
    TAX_DOCUMENTS_MY: `${API_BASE_URL}/api/tax-documents/my`,

    // Revenue & Invoicing
    REVENUE_SUMMARY: `${API_BASE_URL}/api/revenue/summary`,
    REVENUE_BY_PROJECT: `${API_BASE_URL}/api/revenue/by-project`,
    INVOICES: `${API_BASE_URL}/api/revenue/invoices`,
    INVOICE_BY_ID: (id: string) => `${API_BASE_URL}/api/revenue/invoices/${id}`,
    INVOICE_PAYMENTS: (id: string) => `${API_BASE_URL}/api/revenue/invoices/${id}/payments`,

    // IP Allowlist
    IP_ALLOWLIST: `${API_BASE_URL}/api/ip-allowlist`,

    // Authentication: MFA, Sessions, SSO config
    MFA_SETUP: `${API_BASE_URL}/api/auth/mfa/setup`,
    MFA_VERIFY: `${API_BASE_URL}/api/auth/mfa/verify`,
    MFA_DISABLE: `${API_BASE_URL}/api/auth/mfa/disable`,
    SESSIONS: `${API_BASE_URL}/api/auth/sessions`,
    SESSIONS_REVOKE_ALL: `${API_BASE_URL}/api/auth/sessions/revoke-all`,
    SSO_CONFIG: `${API_BASE_URL}/api/auth/sso-config`,
};

export default API_ENDPOINTS;
