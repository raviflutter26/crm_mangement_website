"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const userRole = user?.role?.toLowerCase() || "";
        const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

        if (!loading && !user) {
            router.push('/login');
        } else if (!loading && user && !normalizedAllowed.includes(userRole)) {
            // Redirect to their own dashboard if they don't have access to this role group
            switch (userRole) {
                case 'superadmin': router.push('/superadmin/dashboard'); break;
                case 'admin': router.push('/admin/dashboard'); break;
                case 'hr': router.push('/hr/dashboard'); break;
                case 'manager': router.push('/manager/dashboard'); break;
                default: router.push('/employee/dashboard'); break;
            }
        }
    }, [user, loading, allowedRoles, router]);

    const userRole = user?.role?.toLowerCase() || "";
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    if (loading || !user || !normalizedAllowed.includes(userRole)) {
        return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "italic", color: "#64748B" }}>Verifying access...</div>;
    }

    return <>{children}</>;
}
