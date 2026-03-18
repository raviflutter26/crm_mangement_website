"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
    FiGrid, FiUsers, FiClock, FiCalendar, FiDollarSign, FiBriefcase,
    FiSettings, FiHelpCircle, FiZap, FiLayers, FiUserPlus, FiTarget,
    FiFileText, FiPackage, FiUser, FiBarChart2, FiShield, FiLock
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    badge?: string;
    roles: string[];
}

const menuItemsBase: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: FiGrid, roles: ["Admin", "HR", "Manager", "Employee"] },
    { id: "employees", label: "Employees", icon: FiUsers, roles: ["Admin", "HR", "Manager"] },
    { id: "attendance", label: "Attendance", icon: FiClock, roles: ["Admin", "HR", "Manager", "Employee"] },
    { id: "leaves", label: "Leave Management", icon: FiCalendar, roles: ["Admin", "HR", "Manager", "Employee"] },
    { id: "permissions", label: "Permissions", icon: FiClock, roles: ["Admin", "HR", "Manager", "Employee"] },
    { id: "payroll", label: "Payroll", icon: FiDollarSign, roles: ["Admin", "HR"] },
    { id: "payroll-reports", label: "Reports", icon: FiBarChart2, roles: ["Admin", "HR"] },
    { id: "statutory", label: "Statutory Reports", icon: FiShield, roles: ["Admin", "HR"] },
    { id: "salary-settings", label: "Salary Settings", icon: FiSettings, roles: ["Admin", "HR"] },
];

const moduleItems: MenuItem[] = [
    { id: "organization", label: "Organization", icon: FiLayers, roles: ["Admin", "HR"] },
    { id: "departments", label: "Departments", icon: FiBriefcase, roles: ["Admin", "HR"] },
    { id: "recruitment", label: "Recruitment", icon: FiUserPlus, roles: ["Admin", "HR"] },
    { id: "performance", label: "Performance", icon: FiTarget, roles: ["Admin", "HR", "Manager"] },
    { id: "expenses", label: "Expenses", icon: FiFileText, roles: ["Admin", "HR", "Manager", "Employee"] },
    { id: "compliance", label: "Compliance", icon: FiShield, roles: ["Admin"] },
    { id: "assets", label: "Assets", icon: FiPackage, roles: ["Admin", "HR"] },
];

const selfServiceItems: MenuItem[] = [
    { id: "self-service", label: "Self Service", icon: FiUser, roles: ["Admin", "HR", "Manager", "Employee"] },
    { id: "reports", label: "Reports & Analytics", icon: FiBarChart2, roles: ["Admin", "HR", "Manager"] },
    { id: "roles", label: "Role Management", icon: FiLock, roles: ["Admin"] },
];

const secondaryItems: MenuItem[] = [
    { id: "settings", label: "Settings", icon: FiSettings, roles: ["Admin", "HR", "Manager", "Employee"] },
    { id: "help", label: "Help & Support", icon: FiHelpCircle, roles: ["Admin", "HR", "Manager", "Employee"] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [empCount, setEmpCount] = useState<string>("");
    const [leaveCount, setLeaveCount] = useState<string>("");
    const [userRole, setUserRole] = useState<string>("Employee");
    const [backendPermissions, setBackendPermissions] = useState<any[]>([]);

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
                const dashRes = await axiosInstance.get(API_ENDPOINTS.DASHBOARD);
                if (dashRes.data?.data) {
                    setEmpCount(dashRes.data.data.employees?.total?.toString() || "");
                    setLeaveCount(dashRes.data.data.leaves?.pending?.toString() || "");
                }

                const user = JSON.parse(localStorage.getItem('ravi_zoho_user') || '{}');
                if (user.role === "Admin") {
                    try {
                        const permRes = await axiosInstance.get(API_ENDPOINTS.ROLE_PERMISSIONS);
                        if (permRes.data?.data) {
                            setBackendPermissions(permRes.data.data);
                        }
                    } catch (permErr) {
                        console.warn("Failed to fetch dynamic permissions", permErr);
                    }
                }
            } catch (err) {
                console.error("Failed to load sidebar dashboard data", err);
            }
        };
        fetchCounts();
    }, []);

    const filterByRole = (items: MenuItem[]) => {
        return items.filter(item => {
            const dynamicPerm = backendPermissions.find(p => p.module === item.id);
            if (dynamicPerm) {
                return dynamicPerm.roles.includes(userRole);
            }
            return item.roles.includes(userRole);
        });
    };

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
                {items.map((item) => {
                    const isActive = pathname === `/${item.id}`;
                    return (
                        <Link
                            key={item.id}
                            href={`/${item.id}`}
                            className={`sidebar-item ${isActive ? "active" : ""}`}
                        >
                            <span className="sidebar-item-icon"><item.icon /></span>
                            {item.label}
                            {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                        </Link>
                    );
                })}
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
            </nav>
        </aside>
    );
}
