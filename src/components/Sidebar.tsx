"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiGrid, FiUsers, FiClock, FiCalendar, FiDollarSign, FiBriefcase, FiSettings, FiHelpCircle, FiZap } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

interface SidebarProps {
    activePage: string;
    setActivePage: (page: string) => void;
}

const menuItemsBase: { id: string; label: string; icon: any; badge?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: FiGrid },
    { id: "employees", label: "Employees", icon: FiUsers },
    { id: "attendance", label: "Attendance", icon: FiClock },
    { id: "leaves", label: "Leave Management", icon: FiCalendar },
    { id: "payroll", label: "Payroll", icon: FiDollarSign },
];

const secondaryItems = [
    { id: "departments", label: "Departments", icon: FiBriefcase },
    { id: "settings", label: "Settings", icon: FiSettings },
    { id: "help", label: "Help & Support", icon: FiHelpCircle },
];

export default function Sidebar({ activePage, setActivePage }: SidebarProps) {
    const [empCount, setEmpCount] = useState<string>("");
    const [leaveCount, setLeaveCount] = useState<string>("");

    useEffect(() => {
        const fetchCounts = async () => {
            const token = localStorage.getItem('ravi_zoho_token');
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

    const menuItems = menuItemsBase.map(item => {
        if (item.id === "employees" && empCount) return { ...item, badge: empCount };
        if (item.id === "leaves" && leaveCount && leaveCount !== "0") return { ...item, badge: leaveCount };
        return item;
    });

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
                <div className="sidebar-section-title">Main Menu</div>
                {menuItems.map((item) => (
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

                <div className="sidebar-section-title">Others</div>
                {secondaryItems.map((item) => (
                    <div
                        key={item.id}
                        className={`sidebar-item ${activePage === item.id ? "active" : ""}`}
                        onClick={() => setActivePage(item.id)}
                    >
                        <span className="sidebar-item-icon"><item.icon /></span>
                        {item.label}
                    </div>
                ))}

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
