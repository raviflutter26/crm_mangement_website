"use client";

import { useAuth, dashboardPathFor } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

/**
 * Whether a role may enter an area guarded for `allowedRoles`. An owner is
 * admitted wherever an admin is, mirroring ROLE_IMPLIES in the backend's
 * middleware/auth.js.
 */
function isAllowed(role: string, allowedRoles: string[]) {
    const allowed = allowedRoles.map(r => r.toLowerCase());
    const effective = role === 'owner' ? ['owner', 'admin'] : [role];
    return effective.some(r => allowed.includes(r));
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const userRole = user?.role?.toLowerCase() || "";
    const permitted = !!user && isAllowed(userRole, allowedRoles);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (!loading && user && !permitted) {
            // Redirect to their own dashboard if they don't have access to this role group
            router.push(dashboardPathFor(userRole));
        }
    }, [user, loading, permitted, userRole, router]);

    if (loading || !permitted) {
        return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "italic", color: "#64748B" }}>Verifying access...</div>;
    }

    return <>{children}</>;
}
