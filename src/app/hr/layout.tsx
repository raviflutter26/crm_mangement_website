"use client";

import { useAuth } from "@/lib/auth";
import RoleGuard from "@/components/guards/RoleGuard";
import { FiGrid, FiUsers, FiClock, FiCalendar, FiBriefcase, FiLogOut, FiShield } from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HRLayout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();
    const pathname = usePathname();

    const menuItems = [
        { name: 'Dashboard', icon: <FiGrid />, href: '/hr/dashboard' },
        { name: 'Employees', icon: <FiUsers />, href: '/hr/employees' },
        { name: 'Attendance', icon: <FiClock />, href: '/hr/attendance' },
        { name: 'Leaves', icon: <FiCalendar />, href: '/hr/leaves' },
        { name: 'Recruitment', icon: <FiBriefcase />, href: '/hr/recruitment' },
        { name: 'Statutory', icon: <FiShield />, href: '/hr/statutory' },
    ];

    return (
        <RoleGuard allowedRoles={['hr']}>
            <div style={{ display: "flex", height: "100vh", background: "#F8FAFC" }}>
                <div style={{ width: "260px", background: "#1E293B", color: "#fff", display: "flex", flexDirection: "column", padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px", padding: "0 8px" }}>
                        <div style={{ padding: "6px", background: "#F59E0B", borderRadius: "8px" }}>
                            <FiUsers size={20} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.5px" }}>HR Portal</span>
                    </div>

                    <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        {menuItems.map((item) => {
                            const active = pathname.startsWith(item.href);
                            return (
                                <Link key={item.name} href={item.href} style={{
                                    display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                                    borderRadius: "10px", textDecoration: "none", color: active ? "#fff" : "#94A3B8",
                                    background: active ? "rgba(255,255,255,0.1)" : "transparent",
                                    fontWeight: active ? 600 : 500, transition: "all 0.2s"
                                }}>
                                    {item.icon} {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
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
