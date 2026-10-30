/**
 * The company app's route registry (tenant surface).
 *
 * Every page under src/app/(dashboard) must have an entry here: the Sidebar is
 * generated from it and the layout's RouteGuard refuses any path that is not
 * registered or that the signed-in role may not use. A sub-path inherits the
 * entry of its longest registered prefix (e.g. /exits/letter → /exits).
 *
 * roles: company roles allowed in. 'owner' is implied wherever 'admin' is
 *   listed (an owner is the company's top administrator, mirroring
 *   ROLE_IMPLIES in the backend's middleware/auth.js).
 * module: the backend ModulePermission key (GET /api/role-permissions). When an
 *   admin has stored a grant for that key, it replaces `roles` for admins/HR —
 *   the same rule the Sidebar has always applied.
 * group / parent: where the entry sits in the staff menu. selfGroup: where a
 *   /me entry sits in the employee menu. menu: false keeps it out of the menu.
 */
import type { IconType } from "react-icons";
import {
    FiGrid, FiUsers, FiClock, FiCalendar, FiDollarSign, FiBriefcase,
    FiSettings, FiHelpCircle, FiZap, FiLayers, FiUserPlus, FiTarget,
    FiFileText, FiPackage, FiUser, FiBarChart2, FiShield, FiLock, FiLogOut, FiActivity,
    FiSearch, FiGlobe, FiKey, FiMail, FiTag, FiMapPin, FiPlay, FiCreditCard, FiShuffle,
    FiHome, FiPercent, FiSliders,
} from "react-icons/fi";
import { COMPANY_ROLES, type CompanyRole } from "@/lib/surface";

export type Role = CompanyRole;
export type BadgeKey = "employees" | "pendingLeaves";

export interface TenantRoute {
    path: string;
    label: string;
    icon?: IconType;
    roles: readonly Role[];
    module?: string;
    group?: StaffGroup;
    /** id of a parent menu entry (rendered as an expandable item). */
    parent?: string;
    selfGroup?: SelfGroup;
    menu?: boolean;
    badge?: BadgeKey;
    badgeText?: string;
    badgeColor?: "green" | "red" | "orange" | "gray";
}

export const STAFF_GROUPS = [
    "COMMAND CENTER", "ORGANISATION", "HUMAN CAPITAL", "FIELD OPERATIONS",
    "SAFETY & COMPLIANCE", "FINANCE & BILLING", "ACCESS CONTROL", "ASSETS",
    "PLATFORM SETTINGS", "MY SELF-SERVICE",
] as const;
export type StaffGroup = (typeof STAFF_GROUPS)[number];

export const SELF_GROUPS = [
    "HOME", "ATTENDANCE & TIME", "LEAVE & TRAVEL", "PAYROLL & BENEFITS",
    "SAFETY & COMPLIANCE", "TRAINING & SKILLS", "PERFORMANCE", "MORE",
] as const;
export type SelfGroup = (typeof SELF_GROUPS)[number];

/** Expandable parents in the staff menu. */
export const MENU_PARENTS: Record<string, { label: string; icon: IconType; group: StaffGroup; module?: string; roles: readonly Role[] }> = {
    payroll: { label: "Payroll", icon: FiDollarSign, group: "FINANCE & BILLING", module: "payroll-module", roles: ["admin", "hr"] },
    self: { label: "My Workspace", icon: FiUser, group: "MY SELF-SERVICE", roles: ["admin", "hr", "manager"] },
};

const ALL: readonly Role[] = COMPANY_ROLES;
const STAFF: readonly Role[] = ["admin", "hr", "manager"];
const ADMIN: readonly Role[] = ["admin"];
const ADMIN_HR: readonly Role[] = ["admin", "hr"];
const ADMIN_MGR: readonly Role[] = ["admin", "manager"];

export const TENANT_ROUTES: readonly TenantRoute[] = [
    // ── Command centre ─────────────────────────────────────────────
    { path: "/dashboard", label: "Dashboard", icon: FiGrid, roles: ALL, module: "dashboard", group: "COMMAND CENTER", selfGroup: "HOME" },
    { path: "/analytics", label: "Analytics & Reports", icon: FiBarChart2, roles: ADMIN, module: "analytics", group: "COMMAND CENTER" },
    { path: "/reports", label: "Reports", icon: FiFileText, roles: ADMIN_HR, module: "reports", group: "COMMAND CENTER" },

    // ── Organisation ───────────────────────────────────────────────
    { path: "/branches", label: "Organization & Branches", icon: FiHome, roles: ADMIN, module: "organization", group: "ORGANISATION" },
    { path: "/departments", label: "Departments", icon: FiBriefcase, roles: ADMIN_HR, module: "departments", group: "ORGANISATION" },
    { path: "/employees", label: "Employees", icon: FiUsers, roles: STAFF, module: "employees", group: "ORGANISATION", badge: "employees", badgeColor: "green" },
    { path: "/locations", label: "Sites & Locations", icon: FiMapPin, roles: ADMIN_HR, module: "locations", group: "ORGANISATION" },
    { path: "/projects", label: "Project Management", icon: FiLayers, roles: ADMIN_MGR, module: "projects", group: "ORGANISATION" },
    { path: "/vendors", label: "Vendors & Contractors", icon: FiUserPlus, roles: ADMIN, module: "vendors", group: "ORGANISATION" },

    // ── Human capital ──────────────────────────────────────────────
    { path: "/recruitment", label: "Recruitment", icon: FiSearch, roles: ADMIN_HR, module: "recruitment", group: "HUMAN CAPITAL" },
    { path: "/attendance", label: "Attendance tracking", icon: FiClock, roles: STAFF, module: "attendance", group: "HUMAN CAPITAL" },
    { path: "/leaves", label: "Leave management", icon: FiCalendar, roles: STAFF, module: "leaves", group: "HUMAN CAPITAL", badge: "pendingLeaves", badgeColor: "red" },
    { path: "/permissions", label: "Permission requests", icon: FiClock, roles: STAFF, module: "permissions", group: "HUMAN CAPITAL" },
    { path: "/shifts", label: "Shift & Roster", icon: FiCalendar, roles: ADMIN_HR, module: "shifts", group: "HUMAN CAPITAL" },
    { path: "/performance", label: "Performance", icon: FiTarget, roles: STAFF, module: "performance", group: "HUMAN CAPITAL" },
    { path: "/training", label: "Training & Certifications", icon: FiTarget, roles: ADMIN_HR, module: "training", group: "HUMAN CAPITAL" },
    { path: "/exits", label: "Exits & F&F", icon: FiLogOut, roles: STAFF, module: "exits", group: "HUMAN CAPITAL" },
    { path: "/transfers", label: "Transfers", icon: FiShuffle, roles: ADMIN_HR, module: "transfers", group: "HUMAN CAPITAL" },

    // ── Field operations ───────────────────────────────────────────
    { path: "/field-tracking", label: "Field Team Tracking", icon: FiMapPin, roles: ADMIN_MGR, module: "field-tracking", group: "FIELD OPERATIONS" },
    { path: "/job-cards", label: "Job Cards / Work Logs", icon: FiBriefcase, roles: ADMIN_MGR, module: "job-cards", group: "FIELD OPERATIONS" },
    { path: "/timesheets", label: "Timesheets", icon: FiFileText, roles: STAFF, module: "timesheets", group: "FIELD OPERATIONS" },
    { path: "/travel", label: "Travel & Site Visits", icon: FiMapPin, roles: ADMIN_MGR, module: "travel", group: "FIELD OPERATIONS" },
    { path: "/inventory", label: "Inventory & Materials", icon: FiPackage, roles: ADMIN_MGR, module: "inventory", group: "FIELD OPERATIONS" },

    // ── Safety & compliance ────────────────────────────────────────
    { path: "/safety-inductions", label: "Safety Inductions", icon: FiShield, roles: ADMIN_HR, module: "safety-inductions", group: "SAFETY & COMPLIANCE" },
    { path: "/incidents", label: "Incident Reports", icon: FiActivity, roles: STAFF, module: "incidents", group: "SAFETY & COMPLIANCE" },
    { path: "/ppe-records", label: "PPE & Tool Records", icon: FiPackage, roles: ADMIN_MGR, module: "ppe-records", group: "SAFETY & COMPLIANCE" },
    { path: "/compliance", label: "Compliance & Licences", icon: FiFileText, roles: ADMIN_HR, module: "compliance", group: "SAFETY & COMPLIANCE" },

    // ── Finance & billing ──────────────────────────────────────────
    { path: "/payroll", label: "Overview", icon: FiGrid, roles: ADMIN_HR, module: "payroll-module", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/payroll/employees", label: "Employees & Bank", icon: FiUsers, roles: ADMIN_HR, module: "payroll-module/employees", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/payroll/attendance", label: "Attendance", icon: FiClock, roles: ADMIN_HR, module: "payroll-module/attendance", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/payroll/runs", label: "Payroll Runs", icon: FiPlay, roles: ADMIN_HR, module: "payroll-module/payroll-runs", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/payroll/payouts", label: "Payout Status", icon: FiCreditCard, roles: ADMIN_HR, module: "payroll-module/payouts", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/payroll/loans", label: "Loans", icon: FiDollarSign, roles: ADMIN_HR, module: "payroll-module/loans", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/payroll/reports", label: "Reports", icon: FiBarChart2, roles: ADMIN_HR, module: "payroll-module/reports", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/payroll/audit", label: "Audit Logs", icon: FiShield, roles: ADMIN_HR, module: "payroll-module/audit", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/statutory", label: "Statutory (PF/ESI/PT)", icon: FiPercent, roles: ADMIN_HR, module: "statutory", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/salary/components", label: "Salary Components", icon: FiSliders, roles: ADMIN_HR, module: "salary-components", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/salary/settings", label: "Salary Settings", icon: FiSettings, roles: ADMIN_HR, module: "salary-settings", group: "FINANCE & BILLING", parent: "payroll" },
    { path: "/reimbursements", label: "Reimbursements", icon: FiFileText, roles: STAFF, module: "reimbursements", group: "FINANCE & BILLING" },
    { path: "/expenses", label: "Expenses", icon: FiFileText, roles: STAFF, module: "expenses", group: "FINANCE & BILLING" },
    { path: "/allowances", label: "Site Allowances", icon: FiBriefcase, roles: ADMIN_MGR, module: "allowances", group: "FINANCE & BILLING" },
    { path: "/revenue", label: "Project Financials", icon: FiFileText, roles: ADMIN, module: "revenue", group: "FINANCE & BILLING" },

    // ── Access control ─────────────────────────────────────────────
    { path: "/roles", label: "Roles & Permissions", icon: FiLock, roles: ADMIN, module: "roles", group: "ACCESS CONTROL" },
    { path: "/authentication", label: "Authentication", icon: FiKey, roles: ADMIN, module: "authentication", group: "ACCESS CONTROL" },
    { path: "/ip-allowlist", label: "IP Allowlist", icon: FiGlobe, roles: ADMIN, module: "ip-allowlist", group: "ACCESS CONTROL" },

    // ── Assets ─────────────────────────────────────────────────────
    { path: "/assets", label: "Asset Management", icon: FiPackage, roles: ADMIN_HR, module: "assets", group: "ASSETS" },
    { path: "/location-tracking", label: "Location Tracking", icon: FiMapPin, roles: ADMIN, module: "location-tracking", group: "ASSETS" },

    // ── Platform settings ──────────────────────────────────────────
    { path: "/email-settings", label: "Email & Notifications", icon: FiMail, roles: ADMIN, module: "email-settings", group: "PLATFORM SETTINGS" },
    { path: "/support-tickets", label: "Support Tickets", icon: FiTag, roles: ADMIN, module: "support-tickets", group: "PLATFORM SETTINGS" },
    { path: "/announcements", label: "Announcements", icon: FiMail, roles: ADMIN_HR, module: "announcements", group: "PLATFORM SETTINGS" },
    { path: "/compliance/logs", label: "Compliance & Logs", icon: FiFileText, roles: ADMIN, module: "compliance-logs", group: "PLATFORM SETTINGS" },
    { path: "/attendance/settings", label: "Attendance Rules", icon: FiClock, roles: ADMIN, module: "attendance-settings", group: "PLATFORM SETTINGS" },
    { path: "/permissions/policy", label: "Permission Policy", icon: FiShield, roles: ADMIN, module: "permission-settings", group: "PLATFORM SETTINGS" },
    { path: "/leaves/policy", label: "Leave Policy", icon: FiCalendar, roles: ADMIN, module: "leave-settings", group: "PLATFORM SETTINGS" },
    { path: "/settings", label: "General Settings", icon: FiSettings, roles: ADMIN, module: "settings", group: "PLATFORM SETTINGS" },
    { path: "/billing", label: "Billing", icon: FiCreditCard, roles: ADMIN, module: "billing", group: "PLATFORM SETTINGS" },
    { path: "/help", label: "Help", icon: FiHelpCircle, roles: ALL, menu: false },

    // ── Self-service (/me): every company role ─────────────────────
    { path: "/me", label: "Self Service", icon: FiUser, roles: ALL, menu: false },
    { path: "/me/profile", label: "My Profile", icon: FiUser, roles: ALL, selfGroup: "HOME", parent: "self" },
    { path: "/me/check-in", label: "Check-In / Check-out", icon: FiClock, roles: ALL, selfGroup: "ATTENDANCE & TIME", parent: "self" },
    { path: "/me/attendance", label: "My Attendance", icon: FiClock, roles: ALL, selfGroup: "ATTENDANCE & TIME", parent: "self" },
    { path: "/me/site-attendance", label: "Site Attendance", icon: FiMapPin, roles: ALL, selfGroup: "ATTENDANCE & TIME", parent: "self", badgeText: "Field", badgeColor: "orange" },
    { path: "/me/job-cards", label: "Job Card / Work Log", icon: FiBriefcase, roles: ALL, selfGroup: "ATTENDANCE & TIME", parent: "self", badgeText: "Field", badgeColor: "orange" },
    { path: "/me/shift-schedule", label: "Shift Schedule", icon: FiCalendar, roles: ALL, selfGroup: "ATTENDANCE & TIME", parent: "self", badgeText: "Factory", badgeColor: "gray" },
    { path: "/me/timesheets", label: "Timesheets", icon: FiFileText, roles: ALL, selfGroup: "ATTENDANCE & TIME", parent: "self" },
    { path: "/me/leaves", label: "Leave Request", icon: FiCalendar, roles: ALL, selfGroup: "LEAVE & TRAVEL", parent: "self", badge: "pendingLeaves", badgeColor: "orange" },
    { path: "/me/travel", label: "Travel / Site Visit Request", icon: FiMapPin, roles: ALL, selfGroup: "LEAVE & TRAVEL", parent: "self", badgeText: "Field", badgeColor: "orange" },
    { path: "/me/reimbursements", label: "Travel Reimbursement", icon: FiFileText, roles: ALL, selfGroup: "LEAVE & TRAVEL", parent: "self" },
    { path: "/me/payslips", label: "Pay Slips", icon: FiDollarSign, roles: ALL, selfGroup: "PAYROLL & BENEFITS", parent: "self" },
    { path: "/me/allowances", label: "Site Allowance Claims", icon: FiBriefcase, roles: ALL, selfGroup: "PAYROLL & BENEFITS", parent: "self", badgeText: "Field", badgeColor: "orange" },
    { path: "/me/esi-pf", label: "ESI / PF Details", icon: FiShield, roles: ALL, selfGroup: "PAYROLL & BENEFITS", parent: "self" },
    { path: "/me/tax", label: "Tax Documents", icon: FiFileText, roles: ALL, selfGroup: "PAYROLL & BENEFITS", parent: "self" },
    { path: "/me/safety", label: "Safety Induction Status", icon: FiShield, roles: ALL, selfGroup: "SAFETY & COMPLIANCE", parent: "self" },
    { path: "/me/incidents", label: "Incident / Hazard Report", icon: FiActivity, roles: ALL, selfGroup: "SAFETY & COMPLIANCE", parent: "self" },
    { path: "/me/ppe", label: "PPE & Tool Checklist", icon: FiPackage, roles: ALL, selfGroup: "SAFETY & COMPLIANCE", parent: "self", badgeText: "Field", badgeColor: "orange" },
    { path: "/me/training", label: "Training Courses", icon: FiBriefcase, roles: ALL, selfGroup: "TRAINING & SKILLS", parent: "self" },
    { path: "/me/certifications", label: "Certifications", icon: FiTarget, roles: ALL, selfGroup: "TRAINING & SKILLS", parent: "self" },
    { path: "/me/skills", label: "Solar & Technical Skills", icon: FiZap, roles: ALL, selfGroup: "TRAINING & SKILLS", parent: "self", badgeText: "Field", badgeColor: "orange" },
    { path: "/me/targets", label: "My Targets", icon: FiTarget, roles: ALL, selfGroup: "PERFORMANCE", parent: "self" },
    { path: "/me/appraisals", label: "Appraisals", icon: FiTarget, roles: ALL, selfGroup: "PERFORMANCE", parent: "self" },
    { path: "/me/announcements", label: "Announcements", icon: FiMail, roles: ALL, selfGroup: "MORE", parent: "self" },
    { path: "/me/documents", label: "My Documents", icon: FiFileText, roles: ALL, selfGroup: "MORE", parent: "self" },
    { path: "/me/assets", label: "My Assets", icon: FiPackage, roles: ALL, selfGroup: "MORE", parent: "self" },
    { path: "/me/team", label: "Team Directory", icon: FiUsers, roles: ALL, selfGroup: "MORE", parent: "self" },
    { path: "/me/resignation", label: "Resignation", icon: FiLogOut, roles: ALL, selfGroup: "MORE", parent: "self" },
    { path: "/me/settings", label: "Settings", icon: FiSettings, roles: ALL, selfGroup: "MORE", parent: "self" },
];

/** Paths every company role may open whatever the module grants say. */
const ALWAYS_OPEN = (path: string) => path === "/dashboard" || path === "/help" || path === "/me" || path.startsWith("/me/");

/** "/a/b/" → "/a/b"; "" → "/". */
export function normalizePath(pathname: string | null | undefined): string {
    const p = (pathname || "/").split("?")[0].split("#")[0];
    return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p || "/";
}

/** The registry entry governing a path: exact match, else the longest registered prefix. */
export function findTenantRoute(pathname: string): TenantRoute | undefined {
    const p = normalizePath(pathname);
    let best: TenantRoute | undefined;
    for (const r of TENANT_ROUTES) {
        if (p === r.path || p.startsWith(r.path + "/")) {
            if (!best || r.path.length > best.path.length) best = r;
        }
    }
    return best;
}

/** A backend ModulePermission row as returned by GET /api/role-permissions. */
export interface ModuleGrant { module: string; roles?: string[] }

/** Roles a user effectively holds: an owner also holds admin. */
export function effectiveRoles(role: string | null | undefined): string[] {
    const r = String(role || "").toLowerCase().trim();
    return r === "owner" ? ["owner", "admin"] : r ? [r] : [];
}

/**
 * May `role` use an entry? Static roles, replaced by a stored module grant when
 * one exists (same rule the Sidebar has always used). Unknown roles — including
 * anything that is not a company role — never pass.
 */
export function roleMayUse(
    entry: { path?: string; roles: readonly string[]; module?: string },
    role: string | null | undefined,
    grants: readonly ModuleGrant[] = [],
): boolean {
    const eff = effectiveRoles(role);
    if (!eff.some(r => (COMPANY_ROLES as readonly string[]).includes(r))) return false;
    if (entry.path && ALWAYS_OPEN(entry.path)) return true;
    const grant = entry.module ? grants.find(g => g.module === entry.module) : undefined;
    const allowed = (grant ? grant.roles || [] : entry.roles).map(r => String(r).toLowerCase().trim());
    return eff.some(r => allowed.includes(r));
}

/** Guard decision for a pathname: 'ok', 'forbidden' (role may not use it) or 'unknown' (not registered). */
export function tenantAccess(pathname: string, role: string | null | undefined, grants: readonly ModuleGrant[] = []): "ok" | "forbidden" | "unknown" {
    const entry = findTenantRoute(pathname);
    if (!entry) return "unknown";
    return roleMayUse(entry, role, grants) ? "ok" : "forbidden";
}
