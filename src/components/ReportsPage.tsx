"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiBarChart2, FiUsers, FiDollarSign, FiCalendar, FiClock,
    FiTrendingUp, FiTrendingDown, FiPieChart, FiDownload
} from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { API_ENDPOINTS } from "@/config/api";

const CHART_COLORS = ["#1A73E8", "#34A853", "#FF6D00", "#7C3AED", "#EA4335", "#FBBC04"];

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState("overview");
    const [dashData, setDashData] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [payroll, setPayroll] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dRes, eRes, aRes, lRes, pRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.DASHBOARD).catch(() => ({ data: { data: {} } })),
                axiosInstance.get(API_ENDPOINTS.EMPLOYEES).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.ATTENDANCE).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.LEAVES).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.PAYROLL).catch(() => ({ data: { data: [] } })),
            ]);
            setDashData(dRes.data.data);
            setEmployees(eRes.data.data || []);
            setAttendance(aRes.data.data || []);
            setLeaves(lRes.data.data || []);
            setPayroll(pRes.data.data || []);
        } catch (err) { console.error("Fetch error", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // Build chart data
    const deptDistribution = (() => {
        const counts: any = {};
        employees.forEach(e => { counts[e.department || "Unassigned"] = (counts[e.department || "Unassigned"] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    })();

    const leaveStatusData = (() => {
        const counts: any = { approved: 0, pending: 0, rejected: 0 };
        leaves.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    })();

    const monthlyPayrollData = (() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.map((m, i) => {
            const total = payroll.filter(p => {
                const d = new Date(p.createdAt);
                return d.getMonth() === i;
            }).reduce((sum, p) => sum + (p.netPay || p.totalEarnings || 0), 0);
            return { name: m, amount: total };
        });
    })();

    const attendanceStatusData = (() => {
        const counts: any = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
        attendance.forEach(a => {
            const s = a.status || "Present";
            counts[s] = (counts[s] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    })();

    const reports = [
        { id: "overview", label: "Overview", icon: FiBarChart2, color: "#1A73E8" },
        { id: "headcount", label: "Headcount", icon: FiUsers, color: "#34A853" },
        { id: "attendance", label: "Attendance", icon: FiClock, color: "#FF6D00" },
        { id: "leave", label: "Leave", icon: FiCalendar, color: "#7C3AED" },
        { id: "payroll", label: "Payroll", icon: FiDollarSign, color: "#EA4335" },
        { id: "cost", label: "Cost Analysis", icon: FiTrendingUp, color: "#FBBC04" },
    ];

    const handleExport = () => {
        let headers: string[] = [];
        let rows: string[][] = [];
        let filename = `report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

        if (activeReport === "overview" || activeReport === "headcount") {
            headers = ["First Name", "Last Name", "Email", "Employee ID", "Department", "Designation", "Joining Date", "Status", "Manager"];
            rows = employees.map(e => [
                `"${e.firstName}"`,
                `"${e.lastName}"`,
                `"${e.email}"`,
                `"${e.employeeId || ""}"`,
                `"${e.department || ""}"`,
                `"${e.designation || ""}"`,
                `"${e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString() : ""}"`,
                `"${e.status || ""}"`,
                `"${e.manager || ""}"`
            ]);
        } else if (activeReport === "attendance") {
            headers = ["Employee Name", "Date", "Check-In", "Check-Out", "Status", "Total Hours", "Late Duration", "Is Late", "Regularized"];
            rows = attendance.map(a => [
                `"${a.employee?.firstName || ""} ${a.employee?.lastName || ""}"`,
                `"${new Date(a.date).toLocaleDateString()}"`,
                `"${a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "-"}"`,
                `"${a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "-"}"`,
                `"${a.status}"`,
                `"${a.totalHours || 0}"`,
                `"${a.lateDuration || 0}"`,
                `"${a.isLate ? "Yes" : "No"}"`,
                `"${a.isRegularized ? "Yes" : "No"}"`
            ]);
        } else if (activeReport === "leave") {
            headers = ["Employee Name", "Leave Type", "From Date", "To Date", "Total Days", "Reason", "Status", "Applied On"];
            rows = leaves.map(l => [
                `"${l.employee?.firstName || ""} ${l.employee?.lastName || ""}"`,
                `"${l.leaveType || ""}"`,
                `"${new Date(l.startDate).toLocaleDateString()}"`,
                `"${new Date(l.endDate).toLocaleDateString()}"`,
                `"${l.days || 1}"`,
                `"${(l.reason || "").replace(/"/g, '""')}"`,
                `"${l.status}"`,
                `"${new Date(l.createdAt).toLocaleDateString()}"`
            ]);
        } else if (activeReport === "payroll" || activeReport === "cost") {
            headers = ["Employee Name", "Month/Year", "Basic", "HRA", "Allowances", "Gross Earnings", "PF Deduction", "ESI Deduction", "TDS", "Other Deductions", "Total Deductions", "Net Pay", "Status"];
            rows = payroll.map(p => [
                `"${p.employee?.firstName || ""} ${p.employee?.lastName || ""}"`,
                `"${p.month}/${p.year}"`,
                `"${p.basic || 0}"`,
                `"${p.hra || 0}"`,
                `"${p.allowances || 0}"`,
                `"${p.totalEarnings || 0}"`,
                `"${p.pf || 0}"`,
                `"${p.esi || 0}"`,
                `"${p.tds || 0}"`,
                `"${p.otherDeductions || 0}"`,
                `"${p.totalDeductions || 0}"`,
                `"${p.netPay || 0}"`,
                `"${p.status}"`
            ]);
        }

        const csvContent = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Reports...</div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reports & Analytics</h1>
                    <p className="page-subtitle">Comprehensive HR analytics and data-driven insights</p>
                </div>
                <button className="btn btn-secondary" onClick={handleExport}><FiDownload /> Export Report</button>
            </div>

            {/* Report Selector */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
                {reports.map(r => (
                    <button 
                        key={r.id} 
                        className={`btn ${activeReport === r.id ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setActiveReport(r.id)} 
                        style={{ 
                            fontSize: "13px", 
                            fontWeight: 600,
                            padding: "10px 20px",
                            borderRadius: "10px",
                            background: activeReport === r.id ? "#FF6D00" : "var(--bg-secondary)",
                            color: activeReport === r.id ? "white" : "var(--text-primary)",
                            border: activeReport === r.id ? "none" : "1px solid var(--border)",
                            boxShadow: activeReport === r.id ? "0 4px 12px rgba(255, 109, 0, 0.2)" : "none"
                        }}
                    >
                        <r.icon style={{ marginRight: "8px" }} /> {r.label}
                    </button>
                ))}
            </div>

            {/* Overview Dashboard */}
            {activeReport === "overview" && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
                        {[
                            { label: "Total Employees", value: employees.length, icon: FiUsers, color: "#1A73E8" },
                            { label: "Attendance Records", value: attendance.length, icon: FiClock, color: "#34A853" },
                            { label: "Leave Requests", value: leaves.length, icon: FiCalendar, color: "#FF6D00" },
                            { label: "Payroll Records", value: payroll.length, icon: FiDollarSign, color: "#7C3AED" },
                        ].map((stat, i) => (
                            <div key={i} className="card" style={{ 
                                padding: "24px", 
                                borderTop: `4px solid ${stat.color}`,
                                display: "flex",
                                alignItems: "center",
                                gap: "20px"
                            }}>
                                <div style={{ 
                                    width: "48px", 
                                    height: "48px", 
                                    borderRadius: "12px", 
                                    background: `${stat.color}15`, 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    color: stat.color,
                                    fontSize: "22px"
                                }}>
                                    <stat.icon />
                                </div>
                                <div>
                                    <div style={{ fontSize: "28px", fontWeight: 800 }}>{stat.value}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div className="card" style={{ padding: "24px" }}>
                            <h3 style={{ marginBottom: "20px", fontWeight: 700, fontSize: "16px" }}>Department Distribution</h3>
                            <ResponsiveContainer width="100%" height={320}>
                                <PieChart>
                                    <Pie 
                                        data={deptDistribution} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60}
                                        outerRadius={100} 
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {deptDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "var(--shadow-lg)" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card" style={{ padding: "24px" }}>
                            <h3 style={{ marginBottom: "20px", fontWeight: 700, fontSize: "16px" }}>Leave Status Overview</h3>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={leaveStatusData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'var(--bg-secondary)' }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "var(--shadow-lg)" }} />
                                    <Bar dataKey="value" fill="#7C3AED" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}

            {/* Headcount */}
            {activeReport === "headcount" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Employee Headcount by Department</h3></div>
                    <div style={{ padding: "20px" }}>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={deptDistribution} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={12} width={120} />
                                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                                <Bar dataKey="value" fill="#1A73E8" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Department</th><th>Headcount</th><th>% of Total</th></tr></thead>
                            <tbody>
                                {deptDistribution.map((d: any, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                                        <td>{d.value}</td>
                                        <td>{employees.length > 0 ? ((d.value / employees.length) * 100).toFixed(1) : 0}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Attendance Report */}
            {activeReport === "attendance" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Attendance Analysis</h3></div>
                    <div style={{ padding: "20px" }}>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie data={attendanceStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name}: ${value}`}>
                                    {attendanceStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Leave Report */}
            {activeReport === "leave" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Leave Analysis</h3></div>
                    <div style={{ padding: "20px" }}>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={leaveStatusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                                <Bar dataKey="value" fill="#34A853" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
                            <tbody>
                                {leaves.slice(0, 20).map((l: any) => (
                                    <tr key={l._id}>
                                        <td style={{ fontWeight: 600 }}>{l.employee?.firstName || l.employeeName || "-"} {l.employee?.lastName || ""}</td>
                                        <td>{l.leaveType || l.type || "-"}</td>
                                        <td>{l.startDate ? new Date(l.startDate).toLocaleDateString() : "-"}</td>
                                        <td>{l.endDate ? new Date(l.endDate).toLocaleDateString() : "-"}</td>
                                        <td>{l.days || 1}</td>
                                        <td><span className={`badge ${l.status === "approved" ? "approved" : l.status === "rejected" ? "rejected" : "pending"}`}>{l.status}</span></td>
                                    </tr>
                                ))}
                                {leaves.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No leave data.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payroll Report */}
            {activeReport === "payroll" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Monthly Payroll Trend</h3></div>
                    <div style={{ padding: "20px" }}>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={monthlyPayrollData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} formatter={(value: any) => [`₹${value.toLocaleString()}`, "Amount"]} />
                                <Line type="monotone" dataKey="amount" stroke="#1A73E8" strokeWidth={3} dot={{ fill: "#1A73E8", strokeWidth: 2, r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Employee</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead>
                            <tbody>
                                {payroll.slice(0, 20).map((p: any) => (
                                    <tr key={p._id}>
                                        <td style={{ fontWeight: 600 }}>{p.employee?.firstName || p.employeeName || "-"} {p.employee?.lastName || ""}</td>
                                        <td style={{ fontFamily: "monospace" }}>₹{(p.totalEarnings || 0).toLocaleString()}</td>
                                        <td style={{ fontFamily: "monospace", color: "var(--error)" }}>₹{(p.totalDeductions || 0).toLocaleString()}</td>
                                        <td style={{ fontWeight: 700, fontFamily: "monospace" }}>₹{(p.netPay || 0).toLocaleString()}</td>
                                        <td><span className={`badge ${p.status === "paid" ? "paid" : p.status === "processing" ? "processing" : "pending"}`}>{p.status || "pending"}</span></td>
                                    </tr>
                                ))}
                                {payroll.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No payroll data.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cost Analysis */}
            {activeReport === "cost" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Cost Analysis Summary</h3></div>
                    <div style={{ padding: "24px" }}>
                        <div className="grid-3">
                            <div style={{ padding: "20px", background: "var(--bg-primary)", borderRadius: "12px", textAlign: "center" }}>
                                <FiDollarSign style={{ fontSize: "28px", color: "var(--primary)", marginBottom: "8px" }} />
                                <div style={{ fontSize: "24px", fontWeight: 800 }}>₹{payroll.reduce((s, p) => s + (p.totalEarnings || 0), 0).toLocaleString()}</div>
                                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Total Payroll Cost</div>
                            </div>
                            <div style={{ padding: "20px", background: "var(--bg-primary)", borderRadius: "12px", textAlign: "center" }}>
                                <FiUsers style={{ fontSize: "28px", color: "var(--secondary)", marginBottom: "8px" }} />
                                <div style={{ fontSize: "24px", fontWeight: 800 }}>
                                    ₹{employees.length > 0 ? Math.round(payroll.reduce((s, p) => s + (p.totalEarnings || 0), 0) / employees.length).toLocaleString() : 0}
                                </div>
                                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Avg Cost per Employee</div>
                            </div>
                            <div style={{ padding: "20px", background: "var(--bg-primary)", borderRadius: "12px", textAlign: "center" }}>
                                <FiTrendingUp style={{ fontSize: "28px", color: "var(--accent)", marginBottom: "8px" }} />
                                <div style={{ fontSize: "24px", fontWeight: 800 }}>₹{payroll.reduce((s, p) => s + (p.totalDeductions || 0), 0).toLocaleString()}</div>
                                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Total Deductions</div>
                            </div>
                        </div>
                        <div style={{ marginTop: "24px" }}>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={monthlyPayrollData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                                    <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }} formatter={(value: any) => [`₹${value.toLocaleString()}`, "Cost"]} />
                                    <Bar dataKey="amount" fill="#FF6D00" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
