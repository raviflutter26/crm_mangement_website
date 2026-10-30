/**
 * Old company-app URLs → new neutral URLs (tenant surface).
 *
 * Used at BUILD time only, by the redirect pages under src/app/(legacy): each
 * old path is pre-rendered as a tiny page that replaces itself with the new
 * URL (query string and hash kept). Static export has no server redirects, so
 * this is how bookmarks, e-mailed links and stored notification links keep
 * working. Old platform-console paths are handled separately (consoleMoved.ts).
 */

const ME: Record<string, string> = {
    allowance: "/me/allowances", announcements: "/me/announcements", appraisals: "/me/appraisals",
    assets: "/me/assets", attendance: "/me/attendance", certifications: "/me/certifications",
    "check-in": "/me/check-in", documents: "/me/documents", "esi-pf": "/me/esi-pf",
    incident: "/me/incidents", "job-card": "/me/job-cards", leaves: "/me/leaves",
    payslips: "/me/payslips", ppe: "/me/ppe", profile: "/me/profile",
    reimbursement: "/me/reimbursements", resignation: "/me/resignation",
    "resignation/letter": "/me/resignation/letter", safety: "/me/safety", settings: "/me/settings",
    "shift-schedule": "/me/shift-schedule", "site-attendance": "/me/site-attendance",
    skills: "/me/skills", targets: "/me/targets", tax: "/me/tax", team: "/me/team",
    timesheets: "/me/timesheets", training: "/me/training", "travel-request": "/me/travel",
    dashboard: "/dashboard",
};

const PAYROLL: Record<string, string> = {
    attendance: "/payroll/attendance", audit: "/payroll/audit", employees: "/payroll/employees",
    loans: "/payroll/loans", payouts: "/payroll/payouts", "payroll-runs": "/payroll/runs",
    reports: "/payroll/reports",
};

const prefixed = (prefix: string, map: Record<string, string>) =>
    Object.fromEntries(Object.entries(map).map(([k, v]) => [`${prefix}/${k}`, v]));

/** Old path (no leading slash) → new path. The bare prefixes map to /dashboard or the module root. */
export const LEGACY_ROUTES: Record<string, Record<string, string>> = {
    admin: {
        "": "/dashboard",
        dashboard: "/dashboard",
        analytics: "/analytics",
        statutory: "/statutory",
        "dashboard/payroll": "/payroll",
        ...prefixed("dashboard/payroll", PAYROLL),
    },
    hr: {
        "": "/dashboard", dashboard: "/dashboard", attendance: "/attendance", employees: "/employees",
        leaves: "/leaves", recruitment: "/recruitment", statutory: "/statutory",
    },
    manager: {
        "": "/dashboard", dashboard: "/dashboard", attendance: "/attendance", employees: "/employees",
        leaves: "/leaves", projects: "/projects",
    },
    employee: { "": "/dashboard", ...ME },
    "payroll-module": { "": "/payroll", ...PAYROLL },
};

/** Old single-segment company-app pages that were renamed. */
export const RENAMED_ROUTES: Record<string, string> = {
    "attendance-settings": "/attendance/settings",
    "leave-settings": "/leaves/policy",
    "salary-components": "/salary/components",
    "salary-settings": "/salary/settings",
    "compliance-logs": "/compliance/logs",
    "permission-settings": "/permissions/policy",
    "payroll-reports": "/payroll/reports",
    organization: "/branches",
    organizations: "/branches",
    "self-service": "/me",
};

/** generateStaticParams() for a legacy prefix's catch-all ([...slug]). */
export function legacyParams(prefix: keyof typeof LEGACY_ROUTES) {
    return Object.keys(LEGACY_ROUTES[prefix]).filter(Boolean).map(k => ({ slug: k.split("/") }));
}

/** The new URL for /<prefix>/<slug...>; unknown sub-paths fall back to the prefix's root. */
export function legacyTarget(prefix: keyof typeof LEGACY_ROUTES, slug: string[] = []): string {
    const map = LEGACY_ROUTES[prefix];
    return map[slug.join("/")] ?? map[""] ?? "/dashboard";
}
