"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FiGrid, FiUsers, FiClock, FiPlay, FiCreditCard,
    FiBarChart2, FiShield
} from "react-icons/fi";

const NAV = [
    { label: "Overview",         icon: FiGrid,       href: "/admin/dashboard/payroll" },
    { label: "Employees & Bank", icon: FiUsers,      href: "/admin/dashboard/payroll/employees" },
    { label: "Attendance",       icon: FiClock,      href: "/admin/dashboard/payroll/attendance" },
    { label: "Payroll Runs",     icon: FiPlay,       href: "/admin/dashboard/payroll/payroll-runs" },
    { label: "Payout Status",    icon: FiCreditCard, href: "/admin/dashboard/payroll/payouts" },
    { label: "Reports",          icon: FiBarChart2,  href: "/admin/dashboard/payroll/reports" },
    { label: "Audit Logs",       icon: FiShield,     href: "/admin/dashboard/payroll/audit" },
];

export default function PayrollModuleLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
            {/* ── Horizontal Tab Bar (replaces the second sidebar) ─────────── */}
            <div style={{
                background: "#1E1B4B",
                padding: "0 20px",
                display: "flex",
                alignItems: "center",
                gap: 2,
                overflowX: "auto",
                flexShrink: 0,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
                {/* Module badge */}
                <div style={{
                    color: "#A5B4FC",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.8px",
                    whiteSpace: "nowrap",
                    padding: "0 16px 0 4px",
                    borderRight: "1px solid rgba(255,255,255,0.12)",
                    marginRight: 6,
                }}>
                    💰 PAYROLL
                </div>

                {NAV.map((item) => {
                    const exact = item.href === "/admin/dashboard/payroll";
                    const active = exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "13px 14px",
                                textDecoration: "none",
                                color: active ? "#fff" : "#94A3B8",
                                fontWeight: active ? 700 : 500,
                                fontSize: 13,
                                whiteSpace: "nowrap",
                                borderBottom: active ? "2px solid #818CF8" : "2px solid transparent",
                                marginBottom: -1,
                                transition: "all 0.15s",
                            }}
                        >
                            <item.icon size={13} />
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            {/* ── Page Content ──────────────────────────────────────────────── */}
            <div style={{ flex: 1, padding: "32px 36px", background: "#F0F4FF" }}>
                {children}
            </div>
        </div>
    );
}
