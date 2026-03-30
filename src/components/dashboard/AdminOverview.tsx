"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import {
    FiUsers, FiDollarSign, FiClock, FiBriefcase, FiCheck, FiX, FiPieChart,
    FiPlus, FiFileText, FiSend, FiInbox, FiActivity, FiUserPlus, FiMapPin, FiAlertTriangle, FiCheckCircle, FiBarChart2
} from "react-icons/fi";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { motion } from "framer-motion";

interface AdminOverviewProps {
    data: any;
    userName: string;
    filter: string;
    setFilter: (f: string) => void;
    onRefresh: () => void;
}

const DEPT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AdminOverview({ data, userName, filter, setFilter, onRefresh }: AdminOverviewProps) {
    const router = useRouter();

    const handleLeaveAction = async (leaveId: string, action: 'Approved' | 'Rejected') => {
        try {
            await axiosInstance.put(`${API_ENDPOINTS.LEAVES}/${leaveId}/status`, { status: action });
            onRefresh();
        } catch (err) {
            console.error('Failed to update leave status', err);
        }
    };

    const hr = new Date().getHours();
    const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";

    // Format Data
    const attendanceTrends = (data.attendanceTrends || []).map((d: any) => ({
        day: new Date(d._id + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" }),
        Present: d.present,
        Absent: Math.max(0, (data.employees?.active || 48) - d.present)
    }));

    const deptData = (data.departmentDistribution || []).map((d: any) => ({
        name: d._id || "Unassigned",
        value: d.count,
    }));

    const totalPayrollCr = (data.payroll?.totalPayroll || 0) / 10000000;
    const payrollFormatted = totalPayrollCr >= 1
        ? `₹${totalPayrollCr.toFixed(2)}Cr`
        : `₹${((data.payroll?.totalPayroll || 0) / 100000).toFixed(2)}L`;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "24px" }}>

            {/* 1. Hero Banner */}
            <div style={{
                background: "linear-gradient(135deg, var(--primary) 0%, #FF8C00 100%)",
                borderRadius: "16px", padding: "24px 32px", color: "white",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                boxShadow: "0 10px 30px -10px rgba(255, 107, 0, 0.4)",
                position: "relative", overflow: "hidden"
            }}>
                <div style={{ zIndex: 1 }}>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
                        {greeting}, {userName} <span style={{ fontSize: "20px" }}>👋</span>
                    </h1>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", margin: "0 0 20px 0", fontWeight: 500 }}>
                        Here is what's happening across your solar operations today.
                    </p>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", fontWeight: 800, background: "#f59e0b", color: "#fff", padding: "6px 12px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "6px" }}>
                            {data.employees?.newThisMonth || 3} new employees this month
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 800, background: "#ef4444", color: "#fff", padding: "6px 12px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "6px" }}>
                            1 incident open
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 800, background: "#10b981", color: "#fff", padding: "6px 12px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "6px" }}>
                            6 sites active
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 800, background: "#3b82f6", color: "#fff", padding: "6px 12px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "6px" }}>
                            {data.leaves?.pending || 5} pending approvals
                        </span>
                    </div>
                </div>

                <div style={{ fontSize: "70px", zIndex: 1, textShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>☀️</div>
                <div style={{ position: "absolute", right: "-30px", top: "-30px", width: "200px", height: "200px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "50%", filter: "blur(30px)" }} />
            </div>

            {/* 2. Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
                {[
                    { label: "Add Employee", icon: FiUserPlus, path: "/employees", color: "#3b82f6" },
                    { label: "Process Payroll", icon: FiDollarSign, path: "/payroll", color: "#f59e0b" },
                    { label: "Approve Leaves", icon: FiInbox, path: "/leaves", color: "#10b981" },
                    { label: "New Site / Project", icon: FiBriefcase, path: "/projects", color: "#8b5cf6" },
                    { label: "Generate Report", icon: FiBarChart2, action: () => alert("Generating Report..."), color: "#06b6d4" },
                    { label: "Send Announcement", icon: FiSend, action: () => alert("Opening Announcement Modal..."), color: "#ec4899" }
                ].map((action, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -4, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)", borderColor: action.color }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => action.path ? router.push(action.path) : action.action?.()}
                        style={{
                            background: "var(--bg-secondary)", border: "1px solid var(--border)",
                            borderRadius: "16px", padding: "20px 10px",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
                            cursor: "pointer", transition: "border-color 0.2s"
                        }}
                    >
                        <div style={{ color: action.color, fontSize: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <action.icon />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center", lineHeight: "1.2" }}>{action.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* 3. Numbers Row (KPIs) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
                {[
                    { val: data.employees?.active || 48, label: "Total Employees", sub: `↑ ${data.employees?.newThisMonth || 3} this month`, subColor: "#10b981" },
                    { val: `${data.attendance?.attendanceRate || 91}%`, label: "Attendance Today", sub: `${data.attendance?.presentToday || 44} / ${data.employees?.active || 48} present`, subColor: "#10b981" },
                    { val: "6", label: "Active Sites", sub: "Chennai & suburbs", subColor: "var(--text-muted)" },
                    { val: payrollFormatted, label: "Monthly Payroll", sub: "Disbursed amount", subColor: "var(--text-muted)" },
                    { val: data.leaves?.pending || 5, label: "Pending Approvals", sub: `↑ 2 since yesterday`, subColor: "#ef4444" },
                    { val: "1", label: "Open Incidents", sub: "Needs attention", subColor: "#ef4444" }
                ].map((stat, i) => (
                    <div key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
                        <div style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>{stat.val}</div>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)", marginTop: "12px" }}>{stat.label}</div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: stat.subColor, marginTop: "4px" }}>{stat.sub}</div>
                    </div>
                ))}
            </div>

            {/* 4. Charts Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Weekly Attendance */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Weekly attendance</h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500 }}>Present vs absent — last 7 days</p>
                        </div>
                        <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 8, height: 8, background: "#3b82f6", borderRadius: "50%" }} /> Present</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 8, height: 8, background: "#ef4444", borderRadius: "50%" }} /> Absent</div>
                        </div>
                    </div>
                    {(attendanceTrends.length > 0) ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={attendanceTrends} barGap={4} margin={{ left: -25, bottom: 0, top: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                                <XAxis dataKey="day" axisLine={{ stroke: "var(--border)" }} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 600 }} />
                                <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontWeight: 600 }} />
                                <Bar dataKey="Present" stackId="a" fill="#3b82f6" maxBarSize={40} />
                                <Bar dataKey="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>No attendance data</div>
                    )}
                </div>

                {/* Headcount by dept */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Headcount by dept</h3>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500 }}>Total: {data.employees?.active || 48} employees</p>
                    </div>
                    {deptData.length > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", height: "260px" }}>
                            <div style={{ flex: 1, height: "100%" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} stroke="none">
                                            {deptData.map((d: any, i: number) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontWeight: 600 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "40%", paddingLeft: "16px" }}>
                                {deptData.map((d: any, i: number) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 600 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: "2px", background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                                        <span style={{ color: "var(--text-secondary)", flex: 1 }}>{d.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>No department data</div>
                    )}
                </div>
            </div>

            {/* 5. Main Operations Row (3 Columns) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                {/* Site / Project Status */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Site / project status</h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500 }}>Active field operations</p>
                        </div>
                        <a href="#" style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 800, textDecoration: "none" }}>View all</a>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {[
                            { name: "Anna Nagar — Block A", workers: "8 workers", status: "Live", color: "#10b981", bg: "#d1fae5" },
                            { name: "Tambaram Industrial", workers: "6 workers", status: "Live", color: "#10b981", bg: "#d1fae5" },
                            { name: "Porur Residential", workers: "4 workers", status: "In progress", color: "#f59e0b", bg: "#fef3c7" },
                            { name: "Sholinganallur Plot", workers: "5 workers", status: "In progress", color: "#f59e0b", bg: "#fef3c7" },
                            { name: "Avadi Factory Roof", workers: "3 assigned", status: "Pending", color: "#64748b", bg: "#f1f5f9" }
                        ].map((site, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: i !== 4 ? "12px" : 0, borderBottom: i !== 4 ? "1px solid var(--border-light)" : "none" }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: site.color }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)" }}>{site.name}</div>
                                </div>
                                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>{site.workers}</div>
                                <div style={{ fontSize: "10px", fontWeight: 800, background: site.bg, color: site.color, padding: "4px 10px", borderRadius: "100px" }}>
                                    {site.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leave Requests */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Leave requests</h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500 }}>Pending approvals</p>
                        </div>
                        <a href="/leaves" style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 800, textDecoration: "none" }}>View all</a>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {(data.leaveApprovals && data.leaveApprovals.length > 0 ? data.leaveApprovals : [
                            { employee: { firstName: "Ravi", lastName: "Kumar" }, leaveType: "Sick Leave - 1 day", startDate: new Date("2026-03-31") },
                            { employee: { firstName: "Suresh", lastName: "M" }, leaveType: "Casual Leave - 2 days", startDate: new Date("2026-04-01") },
                            { employee: { firstName: "Karthik", lastName: "R" }, leaveType: "Earned Leave - 3 days", startDate: new Date("2026-04-04") },
                            { employee: { firstName: "Murugan", lastName: "S" }, leaveType: "Sick Leave - 1 day", startDate: new Date("2026-04-02") }
                        ]).slice(0, 4).map((l: any, i: number) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: i !== 3 ? "12px" : 0, borderBottom: i !== 3 ? "1px solid var(--border-light)" : "none" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>{l.employee?.firstName} {l.employee?.lastName}</div>
                                    <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)" }}>{l.leaveType}</div>
                                </div>
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", width: "40px", textAlign: "right" }}>
                                    {new Date(l.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button onClick={() => l._id && handleLeaveAction(l._id, 'Approved')} style={{ width: "32px", height: "32px", background: "#f0fdf4", color: "#10b981", border: "1px solid #dcfce7", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><FiCheck size={16} /></button>
                                    <button onClick={() => l._id && handleLeaveAction(l._id, 'Rejected')} style={{ width: "32px", height: "32px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><FiX size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Safety & Incidents */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Safety & Incidents</h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500 }}>This month</p>
                        </div>
                        <a href="/incidents" style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 800, textDecoration: "none" }}>View all</a>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                        <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
                            <FiAlertTriangle color="#f59e0b" size={18} style={{ marginTop: "2px" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>Rooftop slip — Porur site</div>
                                <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", marginTop: "2px" }}>Reported 30 Mar • Minor injury</div>
                            </div>
                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#ef4444", background: "#fef2f2", padding: "4px 10px", borderRadius: "100px", alignSelf: "flex-start", border: "1px solid #fee2e2" }}>Open</div>
                        </div>

                        <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
                            <FiActivity color="#64748b" size={18} style={{ marginTop: "2px" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>Electrical fault — Tambaram</div>
                                <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", marginTop: "2px" }}>Reported 22 Mar • Equipment</div>
                            </div>
                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#10b981", background: "#f0fdf4", padding: "4px 10px", borderRadius: "100px", alignSelf: "flex-start", border: "1px solid #dcfce7" }}>Closed</div>
                        </div>

                        <div style={{ display: "flex", gap: "12px", paddingBottom: "12px" }}>
                            <FiAlertTriangle color="#ef4444" size={18} style={{ marginTop: "2px" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>PPE not worn — Anna Nagar</div>
                                <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", marginTop: "2px" }}>Reported 18 Mar • Warning issued</div>
                            </div>
                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#10b981", background: "#f0fdf4", padding: "4px 10px", borderRadius: "100px", alignSelf: "flex-start", border: "1px solid #dcfce7" }}>Closed</div>
                        </div>
                    </div>

                    {/* Bottom Summary Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "auto" }}>
                        <div style={{ textAlign: "center", flex: 1 }}>
                            <div style={{ fontSize: "16px", fontWeight: 900, color: "#ef4444" }}>1</div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Open</div>
                        </div>
                        <div style={{ textAlign: "center", flex: 1 }}>
                            <div style={{ fontSize: "16px", fontWeight: 900, color: "#10b981" }}>2</div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Closed</div>
                        </div>
                        <div style={{ textAlign: "center", flex: 1 }}>
                            <div style={{ fontSize: "16px", fontWeight: 900, color: "var(--text-primary)" }}>3</div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Total</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Bottom Grids Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
                {/* Recent Hires */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Recent hires</h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500 }}>Last 30 days</p>
                        </div>
                        <a href="/employees" style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 800, textDecoration: "none" }}>View all</a>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {((data.recentHires?.length > 0) ? data.recentHires.slice(0, 3) : [
                            { firstName: "Ravi", lastName: "Kumar", designation: "Solar Technician", createdAt: new Date("2026-03-23") },
                            { firstName: "Priya", lastName: "S", designation: "Factory Operator", createdAt: new Date("2026-03-18") },
                            { firstName: "Karthik", lastName: "M", designation: "Field Supervisor", createdAt: new Date("2026-03-10") }
                        ]).map((h: any, i: number) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", borderBottom: i !== 2 ? "1px solid var(--border-light)" : "none", paddingBottom: i !== 2 ? "12px" : "0" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, #FF8C00 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, boxShadow: "0 4px 10px rgba(255,107,0,0.2)" }}>
                                    {h.firstName[0]}{h.lastName[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>{h.firstName} {h.lastName}</div>
                                    <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", marginTop: "2px" }}>{h.designation}</div>
                                </div>
                                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>
                                    {new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payroll - monthly */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Payroll — monthly (₹ Cr)</h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500 }}>Net disbursement trend</p>
                        </div>
                    </div>
                    {/* Mock data to match screenshot curve if no API data */}
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={(data.payrollTrends || []).length > 0 ? data.payrollTrends.map((d: any) => ({
                            month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d._id.month - 1],
                            total: d.total / 10000000 
                        })) : [
                            { month: 'Oct', total: 2.8 }, { month: 'Nov', total: 2.9 }, 
                            { month: 'Dec', total: 3.1 }, { month: 'Jan', total: 3.0 }, 
                            { month: 'Feb', total: 3.1 }, { month: 'Mar', total: 3.2 }
                        ]} margin={{ left: -20, bottom: -5, top: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                            <XAxis dataKey="month" axisLine={{ stroke: "var(--border)" }} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(1)} domain={[2.7, 3.3]} tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 600 }} />
                            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontWeight: 600 }} formatter={(v: number) => [`₹${v.toFixed(2)} Cr`, 'Payroll']} />
                            <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={4} fillOpacity={0} activeDot={{ r: 6, fill: "#f59e0b", stroke: "white", strokeWidth: 2 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
