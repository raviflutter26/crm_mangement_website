/**
 * Old platform-console paths that used to live inside the company app, mapped
 * to their address on the separate RIVO console. Build-time only: the notice
 * pages under src/app/(legacy) are pre-rendered from this list.
 */
export const CONSOLE_MOVED: Record<string, string> = {
    "": "/dashboard",
    dashboard: "/dashboard",
    analytics: "/analytics",
    "audit-log": "/audit-log",
    "demo-requests": "/demo-requests",
    health: "/infra",
    "infra/server": "/infra/server",
    "infra/database": "/infra/database",
    "infra/gateway": "/infra/gateway",
    "finance/subscriptions": "/billing/subscriptions",
    "finance/revenue": "/billing/revenue",
    seats: "/seats",
    organizations: "/organizations",
    "organizations/add": "/organizations/add",
    "organizations/edit": "/organizations/edit",
    "organizations/view": "/organizations/view",
    "organizations/pending": "/organizations/pending",
    "organizations/suspended": "/organizations/suspended",
    users: "/users",
    "users/invitations": "/users/invitations",
    "users/locked": "/users/locked",
    "auth/sso": "/security/sso",
    "auth/mfa": "/security/mfa",
    "auth/sessions": "/security/sessions",
    "auth/ip-allowlist": "/security/ip-allowlist",
    support: "/support",
    settings: "/settings",
    "settings/config": "/settings/config",
    "settings/email": "/settings/email",
    "settings/features": "/settings/features",
    leaves: "/dashboard",
    locations: "/dashboard",
};
