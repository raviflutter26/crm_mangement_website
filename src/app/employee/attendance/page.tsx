"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiDownload, FiFilter, FiCalendar, FiClock, FiActivity, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

// Components
import EmployeeAttendanceTable from "@/components/attendance/EmployeeAttendanceTable";

export default function EmployeeAttendancePage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRange, setFilterRange] = useState("this_month");

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.ATTENDANCE);
                const rawData = res.data.data || [];
                const mapped = rawData.map((rec: any) => ({
                    date: rec.date,
                    status: rec.status,
                    firstIn: rec.checkIn,
                    lastOut: rec.checkOut,
                    totalHours: rec.totalHours || 0,
                    breakTime: 45,
                    overtime: Math.max(0, (rec.totalHours || 0) - 9)
                }));
                setRecords(mapped);
            } catch (err) {
                console.error("Failed to fetch attendance history", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [filterRange]);

    const stats = [
        { label: "Total Days", value: records.length, icon: FiCalendar, color: "var(--primary)" },
        { label: "Present", value: records.filter(r => r.status === "Present" || r.status === "WFH").length, icon: FiActivity, color: "#10b981" },
        { label: "Late Days", value: 3, icon: FiClock, color: "#f59e0b" },
        { label: "Working Hours", value: "168h", icon: FiActivity, color: "#3b82f6" },
    ];

    return (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* High Density Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                        <Link href="/employee/dashboard" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                            <FiArrowLeft size={18} />
                        </Link>
                        <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>Attendance History</h1>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, marginLeft: "30px" }}>
                        Detailed logs and performance metrics for your current work cycle.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary btn-sm"><FiDownload /> Export Report</button>
                    <div style={{ position: "relative" }}>
                        <select 
                            className="btn btn-secondary btn-sm" 
                            value={filterRange}
                            onChange={(e) => setFilterRange(e.target.value)}
                            style={{ paddingRight: "32px", appearance: "none" }}
                        >
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="last_30_days">Last 30 Days</option>
                        </select>
                        <FiFilter style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5 }} />
                    </div>
                </div>
            </div>

            {/* Compact Stats Strip */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card" style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <stat.icon size={16} />
                            </div>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)" }}>{stat.value}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* History Card */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Detailed Records</h3>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                        Current Period: <span style={{ color: "var(--text-primary)" }}>Mar 01 - Mar 30, 2026</span>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <EmployeeAttendanceTable records={records} loading={loading} />
                </div>
            </div>
        </div>
    );
}
