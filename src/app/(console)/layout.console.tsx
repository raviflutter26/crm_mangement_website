"use client";

import ConsoleSidebar from "@/components/console/ConsoleSidebar";
import ConsoleGuard from "@/components/console/ConsoleGuard";
import Topbar from "@/components/common/Topbar";
import { useAuth } from "@/lib/auth";
import { roleAllowedOnSurface } from "@/lib/surface";

/** Shell for every signed-in console page (console build only). */
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    // Until the user is confirmed for this surface, render only the guard (it redirects).
    if (loading || !user || !roleAllowedOnSurface(user.role)) return <ConsoleGuard>{null}</ConsoleGuard>;
    return (
        <div className="page-wrapper">
            <ConsoleSidebar />
            <div className="main-content">
                <Topbar />
                <div className="page-content animate-in">
                    <ConsoleGuard>{children}</ConsoleGuard>
                </div>
            </div>
        </div>
    );
}
