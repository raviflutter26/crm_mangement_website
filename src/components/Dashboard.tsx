"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiUsers, FiUserCheck, FiCalendar, FiTrendingUp, FiArrowUp, FiArrowDown, FiClock, FiActivity, FiChevronRight, FiCheckCircle } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dialogState, setDialogState] = useState({ show: false, message: "" });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                let token = localStorage.getItem('ravi_zoho_token');
                if (!token) { window.location.reload(); return; }

                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD);
                setData(res.data.data);
            } catch (err) {
                console.error("Failed to fetch dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center" }}>Loading Dashboard...</div>;
    }

    if (!data) {
        return <div style={{ padding: "40px", textAlign: "center", color: "red" }}>Failed to load dashboard data.</div>;
    }

    const stats = [
        { label: "Total Employees", value: data.employees.total, icon: FiUsers, color: "blue", change: "Overall", up: true },
        { label: "Present Today", value: data.attendance.presentToday, icon: FiUserCheck, color: "green", change: `${data.attendance.attendanceRate}% Rate`, up: true },
        { label: "Pending Leaves", value: data.leaves.pending, icon: FiCalendar, color: "orange", change: "To Review", up: false },
        { label: "Attendance Rate", value: `${data.attendance.attendanceRate}%`, icon: FiTrendingUp, color: "purple", change: "Daily", up: true },
    ];

    const handleGenerateReport = () => {
        if (!data) return;

        const reportContent = `Ravi Zoho System Report
Date: ${new Date().toLocaleDateString()}

Total Employees: ${data.employees.total}
Present Today: ${data.attendance.presentToday}
Attendance Rate: ${data.attendance.attendanceRate}%
Pending Leaves: ${data.leaves.pending}

Department Breakdown:
${data.departmentDistribution.map((d: any) => `${d._id || 'Unassigned'}: ${d.count}`).join('\n')}
`;

        const encodedUri = encodeURI(`data:text/plain;charset=utf-8,${reportContent}`);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `HR_Report_${new Date().toISOString().split('T')[0]}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDialogState({ show: true, message: "Report generated successfully!" });
        setTimeout(() => setDialogState({ show: false, message: "" }), 3000);
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Welcome back, Ravi! Here&apos;s your HR overview.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary">
                        <FiClock /> Last 30 Days
                    </button>
                    <button className="btn btn-primary" onClick={handleGenerateReport}>
                        <FiActivity /> Generate Report
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className={`stat-card ${stat.color}`}>
                        <div className="stat-card-header">
                            <div className={`stat-card-icon ${stat.color}`}>
                                <stat.icon />
                            </div>
                            <span className={`stat-card-change ${stat.up ? "up" : "down"}`}>
                                {stat.up ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />} {stat.change}
                            </span>
                        </div>
                        <div className="stat-card-value">{stat.value}</div>
                        <div className="stat-card-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ marginBottom: "24px" }}>
                {/* Recent Leaves */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Leave Requests</h3>
                        <button className="btn btn-secondary btn-sm">View All <FiChevronRight size={14} /></button>
                    </div>
                    <div className="card-body">
                        {data.recentLeaves && data.recentLeaves.length > 0 ? (
                            data.recentLeaves.map((leave: any, i: number) => (
                                <div key={i} style={{
                                    padding: "14px",
                                    background: "var(--bg-card)",
                                    borderRadius: "12px",
                                    marginBottom: i < data.recentLeaves.length - 1 ? "10px" : "0",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                        <div style={{ fontWeight: 600 }}>{leave.employee?.firstName} {leave.employee?.lastName}</div>
                                        <span className={`badge ${leave.status.toLowerCase()}`}>{leave.status}</span>
                                    </div>
                                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                                        {leave.leaveType} • {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No recent leaves</div>
                        )}
                    </div>
                </div>

                {/* Department Distribution */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Department Distribution</h3>
                    </div>
                    <div className="card-body" style={{ padding: "20px" }}>
                        {data.departmentDistribution && data.departmentDistribution.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {data.departmentDistribution.map((dept: any, i: number) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "var(--bg-card)", borderRadius: "8px" }}>
                                        <span style={{ fontWeight: 500 }}>{dept._id || "Unassigned"}</span>
                                        <span className="badge active">{dept.count} Employees</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No department data</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Success Toast */}
            {dialogState.show && (
                <div style={{
                    position: "fixed", bottom: "20px", right: "20px",
                    background: "rgba(34, 197, 94, 0.9)", color: "white",
                    padding: "12px 20px", borderRadius: "8px", zIndex: 3000,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px",
                    fontWeight: 600, animation: "fadeIn 0.3s ease-out"
                }}>
                    <FiCheckCircle size={20} /> {dialogState.message}
                </div>
            )}
        </>
    );
}
