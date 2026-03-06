"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiGrid, FiUsers, FiClock, FiCalendar, FiDollarSign, FiBriefcase,
    FiSettings, FiHelpCircle, FiZap, FiLayers, FiUserPlus, FiTarget,
    FiFileText, FiPackage, FiUser, FiBarChart2, FiShield, FiLock
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

interface SidebarProps {
    activePage: string;
    setActivePage: (page: string) => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    badge?: string;
    roles: string[];
}

const menuItemsBase: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: FiGrid, roles: ["admin", "hr", "manager", "employee"] },
    { id: "employees", label: "Employees", icon: FiUsers, roles: ["admin", "hr"] },
    { id: "attendance", label: "Attendance", icon: FiClock, roles: ["admin", "hr", "manager", "employee"] },
    { id: "leaves", label: "Leave Management", icon: FiCalendar, roles: ["admin", "hr", "manager", "employee"] },
    { id: "permissions", label: "Permissions", icon: FiClock, roles: ["admin", "hr", "manager", "employee"] },
    { id: "payroll", label: "Payroll", icon: FiDollarSign, roles: ["admin", "hr"] },
];

const moduleItems: MenuItem[] = [
    { id: "organization", label: "Organization", icon: FiLayers, roles: ["admin", "hr"] },
    { id: "departments", label: "Departments", icon: FiBriefcase, roles: ["admin", "hr"] },
    { id: "recruitment", label: "Recruitment", icon: FiUserPlus, roles: ["admin", "hr"] },
    { id: "performance", label: "Performance", icon: FiTarget, roles: ["admin", "hr", "manager"] },
    { id: "expenses", label: "Expenses", icon: FiFileText, roles: ["admin", "hr", "manager", "employee"] },
    { id: "compliance", label: "Compliance", icon: FiShield, roles: ["admin"] },
    { id: "assets", label: "Assets", icon: FiPackage, roles: ["admin", "hr"] },
];

const selfServiceItems: MenuItem[] = [
    { id: "self-service", label: "Self Service", icon: FiUser, roles: ["admin", "hr", "manager", "employee"] },
    { id: "reports", label: "Reports", icon: FiBarChart2, roles: ["admin", "hr", "manager"] },
    { id: "roles", label: "Role Management", icon: FiLock, roles: ["admin"] },
];

const secondaryItems: MenuItem[] = [
    { id: "settings", label: "Settings", icon: FiSettings, roles: ["admin", "hr", "manager", "employee"] },
    { id: "help", label: "Help & Support", icon: FiHelpCircle, roles: ["admin", "hr", "manager", "employee"] },
];

export default function Sidebar({ activePage, setActivePage }: SidebarProps) {
    const [empCount, setEmpCount] = useState<string>("");
    const [leaveCount, setLeaveCount] = useState<string>("");
    const [userRole, setUserRole] = useState<string>("employee");

    useEffect(() => {
        const fetchCounts = async () => {
            const token = localStorage.getItem('ravi_zoho_token');
            const userStr = localStorage.getItem('ravi_zoho_user');

            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.role) setUserRole(user.role);
                } catch (e) {
                    console.error("Failed to parse user", e);
                }
            }

            if (!token) return;
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD);
                if (res.data?.data) {
                    setEmpCount(res.data.data.employees?.total?.toString() || "");
                    setLeaveCount(res.data.data.leaves?.pending?.toString() || "");
                }
            } catch (err) {
                console.error("Failed to load sidebar counts", err);
            }
        };
        fetchCounts();
    }, []);

    const filterByRole = (items: MenuItem[]) => items.filter(item => item.roles.includes(userRole));

    const menuItems = filterByRole(menuItemsBase).map(item => {
        if (item.id === "employees" && empCount) return { ...item, badge: empCount };
        if (item.id === "leaves" && leaveCount && leaveCount !== "0") return { ...item, badge: leaveCount };
        return item;
    });

    const renderSection = (title: string, items: MenuItem[]) => {
        if (items.length === 0) return null;

        return (
            <>
                <div className="sidebar-section-title">{title}</div>
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`sidebar-item ${activePage === item.id ? "active" : ""}`}
                        onClick={() => setActivePage(item.id)}
                    >
                        <span className="sidebar-item-icon"><item.icon /></span>
                        {item.label}
                        {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                    </div>
                ))}
            </>
        );
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">⚡</div>
                    <div>
                        <h2>Ravi Zoho</h2>
                        <p>HR & Payroll</p>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {renderSection("Main Menu", menuItems)}
                {renderSection("Modules", filterByRole(moduleItems))}
                {renderSection("Portal", filterByRole(selfServiceItems))}
                {renderSection("Others", filterByRole(secondaryItems))}

                {/* Sync Card */}
                <div style={{
                    margin: "20px 8px",
                    padding: "16px",
                    background: "linear-gradient(135deg, rgba(26, 115, 232, 0.15), rgba(124, 58, 237, 0.15))",
                    borderRadius: "12px",
                    border: "1px solid rgba(26, 115, 232, 0.2)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <FiZap style={{ color: "#FBBC04" }} />
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>Zoho Sync</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
                        Last synced 2 hours ago
                    </p>
                    <button className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                        Sync Now
                    </button>
                </div>
            </nav>
        </aside>
    );
}
