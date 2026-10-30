/**
 * The RIVO platform console's route registry (console surface only; nothing
 * in the company app imports this file). The console sidebar is generated
 * from it and ConsoleGuard admits only registered paths.
 */
import type { IconType } from "react-icons";
import {
    FiGrid, FiUsers, FiClock, FiDollarSign, FiSettings, FiHelpCircle, FiLayers, FiUserPlus,
    FiTarget, FiBarChart2, FiShield, FiLock, FiSliders, FiActivity, FiGlobe, FiDatabase,
    FiServer, FiKey, FiMail, FiFlag, FiCreditCard,
} from "react-icons/fi";

export type ConsoleCountKey = "pendingOrgs" | "criticalLogs" | "lockedAccounts" | "pendingInvites" | "openTickets" | "newDemoRequests";

export interface ConsoleRoute {
    path: string;
    label: string;
    icon?: IconType;
    group: ConsoleGroup;
    /** id of an expandable parent in CONSOLE_PARENTS */
    parent?: string;
    count?: ConsoleCountKey;
    countColor?: "orange" | "red";
    menu?: boolean;
}

export const CONSOLE_GROUPS = ["COMMAND CENTER", "PLATFORM OPERATIONS", "BILLING & SUBSCRIPTIONS", "SECURITY", "SUPPORT & CONFIG"] as const;
export type ConsoleGroup = (typeof CONSOLE_GROUPS)[number];

export const CONSOLE_PARENTS: Record<string, { label: string; icon: IconType; group: ConsoleGroup; count?: ConsoleCountKey; countColor?: "orange" | "red" }> = {
    organizations: { label: "Organizations", icon: FiLayers, group: "COMMAND CENTER", count: "pendingOrgs", countColor: "orange" },
    users: { label: "Global Users", icon: FiUsers, group: "COMMAND CENTER", count: "lockedAccounts", countColor: "red" },
    infra: { label: "Infrastructure", icon: FiServer, group: "PLATFORM OPERATIONS" },
    settings: { label: "Platform Settings", icon: FiSettings, group: "SUPPORT & CONFIG" },
};

export const CONSOLE_ROUTES: readonly ConsoleRoute[] = [
    { path: "/dashboard", label: "Dashboard", icon: FiGrid, group: "COMMAND CENTER" },
    { path: "/analytics", label: "Analytics & Reports", icon: FiBarChart2, group: "COMMAND CENTER" },
    { path: "/demo-requests", label: "Demo Requests", icon: FiTarget, group: "COMMAND CENTER", count: "newDemoRequests", countColor: "orange" },
    { path: "/organizations", label: "All Organizations", icon: FiLayers, group: "COMMAND CENTER", parent: "organizations" },
    { path: "/organizations/pending", label: "Pending Approval", icon: FiLayers, group: "COMMAND CENTER", parent: "organizations", count: "pendingOrgs", countColor: "orange" },
    { path: "/organizations/suspended", label: "Suspended", icon: FiLayers, group: "COMMAND CENTER", parent: "organizations" },
    { path: "/organizations/add", label: "Add New", icon: FiUserPlus, group: "COMMAND CENTER", parent: "organizations" },
    { path: "/organizations/view", label: "Organization", group: "COMMAND CENTER", menu: false },
    { path: "/organizations/edit", label: "Edit Organization", group: "COMMAND CENTER", menu: false },
    { path: "/users", label: "All Users", icon: FiUsers, group: "COMMAND CENTER", parent: "users" },
    { path: "/users/invitations", label: "Invitations", icon: FiMail, group: "COMMAND CENTER", parent: "users", count: "pendingInvites", countColor: "orange" },
    { path: "/users/locked", label: "Locked Accounts", icon: FiLock, group: "COMMAND CENTER", parent: "users", count: "lockedAccounts", countColor: "red" },

    { path: "/infra", label: "System Health", icon: FiActivity, group: "PLATFORM OPERATIONS" },
    { path: "/infra/server", label: "Server", icon: FiServer, group: "PLATFORM OPERATIONS", parent: "infra" },
    { path: "/infra/database", label: "Database", icon: FiDatabase, group: "PLATFORM OPERATIONS", parent: "infra" },
    { path: "/infra/gateway", label: "Gateway", icon: FiGlobe, group: "PLATFORM OPERATIONS", parent: "infra" },

    { path: "/billing/subscriptions", label: "Subscriptions", icon: FiCreditCard, group: "BILLING & SUBSCRIPTIONS" },
    { path: "/billing/revenue", label: "Platform Revenue", icon: FiDollarSign, group: "BILLING & SUBSCRIPTIONS" },
    { path: "/seats", label: "Seats & Licenses", icon: FiUsers, group: "BILLING & SUBSCRIPTIONS" },

    { path: "/audit-log", label: "Audit Log", icon: FiShield, group: "SECURITY", count: "criticalLogs", countColor: "red" },
    { path: "/security", label: "Security", group: "SECURITY", menu: false },
    { path: "/security/sso", label: "SSO", icon: FiKey, group: "SECURITY" },
    { path: "/security/mfa", label: "MFA", icon: FiLock, group: "SECURITY" },
    { path: "/security/sessions", label: "Sessions", icon: FiClock, group: "SECURITY" },
    { path: "/security/ip-allowlist", label: "IP Allowlist", icon: FiGlobe, group: "SECURITY" },

    { path: "/support", label: "Support", icon: FiHelpCircle, group: "SUPPORT & CONFIG", count: "openTickets", countColor: "orange" },
    { path: "/settings", label: "Overview", icon: FiSettings, group: "SUPPORT & CONFIG", parent: "settings" },
    { path: "/settings/config", label: "General Config", icon: FiSliders, group: "SUPPORT & CONFIG", parent: "settings" },
    { path: "/settings/email", label: "Email Templates", icon: FiMail, group: "SUPPORT & CONFIG", parent: "settings" },
    { path: "/settings/features", label: "Feature Flags", icon: FiFlag, group: "SUPPORT & CONFIG", parent: "settings" },
];

export function isConsoleRoute(pathname: string): boolean {
    const p = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    return CONSOLE_ROUTES.some(r => p === r.path || p.startsWith(r.path + "/"));
}
