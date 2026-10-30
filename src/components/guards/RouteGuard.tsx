"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiLock } from "react-icons/fi";
import { useAuth } from "@/lib/auth";
import { roleAllowedOnSurface } from "@/lib/surface";
import { tenantAccess, findTenantRoute } from "@/config/routes";
import { useModuleGrants } from "./ModuleGrants";

const Centered = ({ children }: { children: ReactNode }) => (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ textAlign: "center", maxWidth: 440 }}>{children}</div>
    </div>
);

/**
 * The company app's page guard. Every page under the (dashboard) layout passes
 * through here: the path must be in the route registry (src/config/routes.ts)
 * and the signed-in role must be allowed to use it — otherwise a 403 screen is
 * shown. Signed-out visitors go to /login; anyone whose role does not belong
 * on this surface (the RIVO team) goes to /wrong-app.
 *
 * This only decides which screens are offered. The API re-authorises every
 * request on the server.
 */
export default function RouteGuard({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const { grants, ready } = useModuleGrants();
    const pathname = usePathname() || "/";
    const router = useRouter();

    const wrongSurface = !!user && !roleAllowedOnSurface(user.role);

    useEffect(() => {
        if (loading) return;
        if (!user) router.replace("/login");
        else if (wrongSurface) router.replace("/wrong-app");
    }, [loading, user, wrongSurface, router]);

    if (loading || !user || wrongSurface || !ready) {
        return <Centered><p style={{ fontStyle: "italic", color: "#64748B" }}>Verifying access...</p></Centered>;
    }

    const access = tenantAccess(pathname, user.role, grants);
    if (access !== "ok") {
        const label = findTenantRoute(pathname)?.label;
        return (
            <Centered>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "#FEF2F2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>
                    <FiLock />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
                    {access === "unknown" ? "Page not found" : "You don't have access to this page"}
                </h1>
                <p style={{ color: "#64748B", margin: "0 0 20px", lineHeight: 1.5 }}>
                    {access === "unknown"
                        ? "This address is not part of RIVO."
                        : `${label ? `“${label}” is` : "This page is"} not available for your role. If you need it, ask your company administrator.`}
                </p>
                <Link href="/dashboard" className="btn btn-primary">Go to dashboard</Link>
            </Centered>
        );
    }

    return <>{children}</>;
}
