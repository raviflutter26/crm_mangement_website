import { describe, expect, test } from "vitest";
import fs from "fs";
import path from "path";
import { TENANT_ROUTES, findTenantRoute, tenantAccess, roleMayUse } from "../routes";
import { LEGACY_ROUTES, RENAMED_ROUTES, legacyTarget } from "../legacyRoutes";

const DASHBOARD_DIR = path.resolve(__dirname, "../../app/(dashboard)");

/** Every page.tsx under (dashboard) as its URL. */
function tenantPages(dir = DASHBOARD_DIR, base = ""): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
        if (e.isDirectory()) return tenantPages(path.join(dir, e.name), `${base}/${e.name}`);
        return e.name === "page.tsx" ? [base || "/"] : [];
    });
}

describe("tenant route registry", () => {
    test("every company-app page is covered by a registry entry", () => {
        for (const p of tenantPages()) expect(findTenantRoute(p), p).toBeDefined();
    });

    test("every registry entry has a page", () => {
        const pages = new Set(tenantPages());
        for (const r of TENANT_ROUTES) expect(pages.has(r.path), r.path).toBe(true);
    });

    test("no URL carries a role name", () => {
        for (const r of TENANT_ROUTES) expect(r.path).not.toMatch(/^\/(admin|hr|manager|employee|superadmin|payroll-module)(\/|$)/);
    });

    test("sub-paths inherit the longest prefix", () => {
        expect(findTenantRoute("/exits/letter/")?.path).toBe("/exits");
        expect(findTenantRoute("/attendance/settings")?.path).toBe("/attendance/settings");
        expect(findTenantRoute("/payroll/runs")?.path).toBe("/payroll/runs");
    });

    test("guard decisions", () => {
        expect(tenantAccess("/payroll/runs", "employee")).toBe("forbidden");
        expect(tenantAccess("/payroll/runs", "hr")).toBe("ok");
        expect(tenantAccess("/billing", "owner")).toBe("ok");          // owner implies admin
        expect(tenantAccess("/billing", "hr")).toBe("forbidden");
        expect(tenantAccess("/me/payslips", "manager")).toBe("ok");      // /me is open to every company role
        expect(tenantAccess("/dashboard", "employee")).toBe("ok");
        expect(tenantAccess("/nowhere", "admin")).toBe("unknown");
        expect(tenantAccess("/dashboard", "superadmin")).toBe("forbidden"); // not a company role
    });

    test("stored module grants replace static roles, except on always-open pages", () => {
        const grants = [{ module: "recruitment", roles: ["admin"] }, { module: "dashboard", roles: [] }];
        expect(tenantAccess("/recruitment", "hr", grants)).toBe("forbidden");
        expect(tenantAccess("/dashboard", "hr", grants)).toBe("ok");
        expect(roleMayUse({ roles: ["admin"], module: "roles" }, "hr", [{ module: "roles", roles: ["hr"] }])).toBe(true);
    });
});

describe("legacy redirects", () => {
    test("every old URL points at a registered page", () => {
        const targets = [
            ...Object.values(LEGACY_ROUTES).flatMap(m => Object.values(m)),
            ...Object.values(RENAMED_ROUTES),
        ];
        for (const t of targets) expect(TENANT_ROUTES.some(r => r.path === t) || t.startsWith("/me/"), t).toBe(true);
    });

    test("examples", () => {
        expect(legacyTarget("admin", ["dashboard", "payroll", "payroll-runs"])).toBe("/payroll/runs");
        expect(legacyTarget("employee", ["travel-request"])).toBe("/me/travel");
        expect(legacyTarget("hr", ["statutory"])).toBe("/statutory");
        expect(legacyTarget("payroll-module")).toBe("/payroll");
        expect(legacyTarget("manager", ["unknown"])).toBe("/dashboard");
    });
});
