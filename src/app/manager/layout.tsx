"use client";

import { useAuth } from "@/lib/auth";
import RoleGuard from "@/components/guards/RoleGuard";
import { FiGrid, FiUsers, FiCheckSquare, FiClipboard, FiLogOut } from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();
    const pathname = usePathname();

    const menuItems = [
        { name: 'Dashboard', icon: <FiGrid />, href: '/manager/dashboard' },
        { name: 'My Team', icon: <FiUsers />, href: '/manager/team' },
        { name: 'Approvals', icon: <FiCheckSquare />, href: '/manager/approvals' },
        { name: 'Project Tracking', icon: <FiClipboard />, href: '/manager/projects' },
    ];

    return (
        <RoleGuard allowedRoles={['manager']}>
            <div style={{ display: "flex", height: "100vh", background: "#F8FAFC" }}>
                <div style={{ width: "260px", background: "#fff", display: "flex", flexDirection: "column", padding: "24px", borderRight: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px", padding: "0 8px" }}>
                        <div style={{ padding: "6px", background: "#8B5CF6", borderRadius: "8px", color: "white" }}>
                            <FiUsers size={20} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: "18px", color: "#1E293B", letterSpacing: "-0.5px" }}>Manager Portal</span>
                    </div>

                    <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        {menuItems.map((item) => {
                            const active = pathname.startsWith(item.href);
                            return (
                                <Link key={item.name} href={item.href} style={{
                                    display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                                    borderRadius: "10px", textDecoration: "none", color: active ? "#8B5CF6" : "#64748B",
                                    background: active ? "#F5F3FF" : "transparent",
                                    fontWeight: active ? 700 : 500, transition: "all 0.2s"
                                }}>
                                    {item.icon} {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "20px" }}>
                        <button onClick={() => logout()} style={{
                            display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px 16px",
                            background: "transparent", border: "none", color: "#F87171", cursor: "pointer",
                            fontSize: "15px", fontWeight: 600
                        }}>
                            <FiLogOut /> Sign Out
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
                    {children}
                </div>
            </div>
        </RoleGuard>
    );
}
