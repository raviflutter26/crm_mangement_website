"use client";

import { useAuth } from "@/lib/auth";
import Topbar from "@/components/common/Topbar";
import Sidebar from "@/components/common/Sidebar";
import RoleGuard from "@/components/guards/RoleGuard";

export default function PayrollModuleLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    return (
        <RoleGuard allowedRoles={["admin", "hr"]}>
            <div className="page-wrapper">
                <Sidebar />
                {/* ── Right Panel: Topbar + Content ───────────────────── */}
                <div className="main-content">
                    <Topbar />
                    <div className="page-content animate-in">
                        {children}
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
