"use client";

import { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiBarChart2, FiUsers, FiDollarSign, FiCalendar, FiClock,
    FiTrendingUp, FiPieChart, FiDownload, FiFileText, FiFile, FiChevronDown
} from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { API_ENDPOINTS } from "@/config/api";

const CHART_COLORS = ["#1A73E8", "#34A853", "#FF6D00", "#7C3AED", "#EA4335", "#FBBC04"];

interface ReportsPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function ReportsPage({ showNotify }: ReportsPageProps) {
    const [activeReport, setActiveReport] = useState("overview");
    const [dashData, setDashData] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [payroll, setPayroll] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

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

    // Close export menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ──── Data builders ────
    const deptDistribution = (() => {
        const counts: any = {};
        employees.forEach(e => { counts[e.department || "Unassigned"] = (counts[e.department || "Unassigned"] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    })();

    const leaveStatusData = (() => {
        const counts: any = { Approved: 0, Pending: 0, Rejected: 0 };
        leaves.forEach(l => { const s = (l.status || "Pending"); counts[s] = (counts[s] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    })();

    const monthlyPayrollData = (() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.map((m, i) => {
            const total = payroll.filter(p => { const d = new Date(p.createdAt); return d.getMonth() === i; }).reduce((sum, p) => sum + (p.netPay || p.totalEarnings || 0), 0);
            return { name: m, amount: total };
        });
    })();

    const attendanceStatusData = (() => {
        const counts: any = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
        attendance.forEach(a => { const s = a.status || "Present"; counts[s] = (counts[s] || 0) + 1; });
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

    // ──── Export helpers ────
    const getReportData = () => {
        let headers: string[] = [];
        let rows: string[][] = [];

        if (activeReport === "overview" || activeReport === "headcount") {
            headers = ["First Name", "Last Name", "Email", "Employee ID", "Department", "Designation", "Joining Date", "Status"];
            rows = employees.map(e => [e.firstName || "", e.lastName || "", e.email || "", e.employeeId || "", e.department || "", e.designation || "", e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString() : "", e.status || ""]);
        } else if (activeReport === "attendance") {
            headers = ["Employee Name", "Date", "Check-In", "Check-Out", "Status", "Total Hours", "Late", "Regularized"];
            rows = attendance.map(a => [`${a.employee?.firstName || ""} ${a.employee?.lastName || ""}`, new Date(a.date).toLocaleDateString(), a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "-", a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "-", a.status || "", String(a.totalHours || 0), a.isLate ? "Yes" : "No", a.isRegularized ? "Yes" : "No"]);
        } else if (activeReport === "leave") {
            headers = ["Employee Name", "Leave Type", "From Date", "To Date", "Total Days", "Reason", "Status"];
            rows = leaves.map(l => [`${l.employee?.firstName || ""} ${l.employee?.lastName || ""}`, l.leaveType || "", new Date(l.startDate).toLocaleDateString(), new Date(l.endDate).toLocaleDateString(), String(l.totalDays || 1), (l.reason || "").replace(/"/g, '""'), l.status || ""]);
        } else if (activeReport === "payroll" || activeReport === "cost") {
            headers = ["Employee Name", "Month/Year", "Gross Earnings", "PF", "ESI", "Prof Tax", "TDS", "Total Deductions", "Net Pay", "Status"];
            rows = payroll.map(p => [`${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`, `${p.month}/${p.year}`, String(p.totalEarnings || 0), String(p.deductions?.pf || 0), String(p.deductions?.esi || 0), String(p.deductions?.professionalTax || 0), String(p.deductions?.tax || 0), String(p.totalDeductions || 0), String(p.netPay || 0), p.paymentStatus || ""]);
        }
        return { headers, rows };
    };

    const downloadCSV = () => {
        const { headers, rows } = getReportData();
        const csvContent = headers.join(",") + "\n" + rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
        downloadFile(csvContent, "text/csv;charset=utf-8;", "csv");
        setShowExportMenu(false);
    };

    const downloadDOCX = () => {
        const { headers, rows } = getReportData();
        const title = reports.find(r => r.id === activeReport)?.label || "Report";
        let html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#FF6D00;font-size:22px}h2{color:#333;font-size:16px;margin-top:20px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f97316;color:white;font-weight:700}tr:nth-child(even){background:#f9f9f9}.meta{color:#666;font-size:12px;margin-bottom:20px}</style></head><body>`;
        html += `<h1>📊 ${title} Report</h1>`;
        html += `<p class="meta">Generated on: ${new Date().toLocaleString()} | Ravi Zoho HRMS Enterprise</p>`;
        html += `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
        rows.forEach(row => { html += `<tr>${row.map(c => `<td>${c}</td>`).join("")}</tr>`; });
        html += `</tbody></table>`;
        html += `<p style="margin-top:30px;font-size:10px;color:#999">This report is auto-generated by Ravi Zoho HRMS. Confidential.</p></body></html>`;
        downloadFile(html, "application/vnd.ms-word", "doc");
        setShowExportMenu(false);
    };

    const downloadPDF = () => {
        const { headers, rows } = getReportData();
        const title = reports.find(r => r.id === activeReport)?.label || "Report";
        let html = `<html><head><meta charset="utf-8"><style>@page{size:landscape;margin:15mm}body{font-family:'Helvetica Neue',Arial,sans-serif;padding:0;margin:0}h1{color:#f97316;font-size:20px;margin-bottom:4px}h2{color:#666;font-size:12px;font-weight:400;margin-bottom:15px}table{width:100%;border-collapse:collapse}th{background:#1f2937;color:white;padding:10px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}td{border-bottom:1px solid #e5e7eb;padding:8px;font-size:11px;color:#374151}tr:nth-child(even){background:#f9fafb}.footer{margin-top:30px;text-align:center;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #f97316;padding-bottom:10px;margin-bottom:20px}</style></head><body>`;
        html += `<div class="header"><div><h1>📊 ${title} Report</h1><h2>Generated: ${new Date().toLocaleString()} | Total Records: ${rows.length}</h2></div></div>`;
        html += `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
        rows.forEach(row => { html += `<tr>${row.map(c => `<td>${c}</td>`).join("")}</tr>`; });
        html += `</tbody></table>`;
        html += `<div class="footer">Ravi Zoho HRMS Enterprise Edition © 2026 | Confidential & Proprietary</div></body></html>`;

        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); }, 500);
        }
        setShowExportMenu(false);
    };

    const downloadFile = (content: string, type: string, ext: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${activeReport}_report_${new Date().toISOString().split('T')[0]}.${ext}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        if (showNotify) showNotify('success', `Report downloaded as ${ext.toUpperCase()}!`);
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>Loading Reports & Analytics...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reports & Analytics</h1>
                    <p className="page-subtitle">Comprehensive HR analytics and data-driven insights</p>
                </div>
                <div style={{ position: "relative" }} ref={exportRef}>
                    <button className="btn btn-primary" onClick={() => setShowExportMenu(!showExportMenu)}>
                        <FiDownload /> Export Report <FiChevronDown style={{ marginLeft: "4px" }} />
                    </button>
                    {showExportMenu && (
                        <div style={{
                            position: "absolute", top: "100%", right: 0, marginTop: "6px",
                            background: "var(--bg-card)", border: "1px solid var(--border)",
                            borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                            minWidth: "220px", zIndex: 100, overflow: "hidden",
                            animation: "fadeInDown 0.2s ease-out"
                        }}>
                            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Choose Format
                            </div>
                            {[
                                { label: "PDF Document", desc: "Print-optimized, opens print dialog", icon: "📄", fn: downloadPDF, color: "#EA4335" },
                                { label: "Word Document (.doc)", desc: "Editable document with table", icon: "📝", fn: downloadDOCX, color: "#1A73E8" },
                                { label: "CSV Spreadsheet", desc: "Raw data for Excel/Sheets", icon: "📊", fn: downloadCSV, color: "#34A853" },
                            ].map((opt, i) => (
                                <div key={i} onClick={opt.fn}
                                    style={{
                                        padding: "14px 16px", cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: "12px",
                                        borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                                        transition: "background 0.15s"
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    <span style={{ fontSize: "22px" }}>{opt.icon}</span>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{opt.label}</div>
                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{opt.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Report Selector Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
                {reports.map(r => (
                    <button key={r.id} onClick={() => setActiveReport(r.id)}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "10px 20px", borderRadius: "10px",
                            fontSize: "13px", fontWeight: 600, cursor: "pointer",
                            background: activeReport === r.id ? r.color : "var(--bg-card)",
                            color: activeReport === r.id ? "white" : "var(--text-secondary)",
                            border: activeReport === r.id ? "none" : "1px solid var(--border)",
                            boxShadow: activeReport === r.id ? `0 4px 14px ${r.color}35` : "none",
                            transition: "all 0.2s"
                        }}
                    >
                        <r.icon size={14} /> {r.label}
                    </button>
                ))}
            </div>

            {/* ──── OVERVIEW ──── */}
            {activeReport === "overview" && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                        {[
                            { label: "Total Employees", value: employees.length, icon: FiUsers, color: "#1A73E8", bg: "#1A73E810" },
                            { label: "Attendance Records", value: attendance.length, icon: FiClock, color: "#34A853", bg: "#34A85310" },
                            { label: "Leave Requests", value: leaves.length, icon: FiCalendar, color: "#FF6D00", bg: "#FF6D0010" },
                            { label: "Payroll Records", value: payroll.length, icon: FiDollarSign, color: "#7C3AED", bg: "#7C3AED10" },
                        ].map((stat, i) => (
                            <div key={i} className="card" style={{ padding: "20px", borderLeft: `4px solid ${stat.color}`, display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color, fontSize: "22px" }}>
                                    <stat.icon />
                                </div>
                                <div>
                                    <div style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, marginTop: "4px" }}>{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div className="card" style={{ padding: "24px" }}>
                            <h3 style={{ marginBottom: "20px", fontWeight: 700, fontSize: "15px" }}>🏢 Department Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={deptDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                                        {deptDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card" style={{ padding: "24px" }}>
                            <h3 style={{ marginBottom: "20px", fontWeight: 700, fontSize: "15px" }}>📊 Leave Status Overview</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={leaveStatusData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'var(--bg-secondary)' }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                                    <Bar dataKey="value" fill="#7C3AED" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}

            {/* ──── HEADCOUNT ──── */}
            {activeReport === "headcount" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Employee Headcount by Department</h3></div>
                    <div style={{ padding: "20px" }}>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={deptDistribution} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={12} width={120} />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
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
                                        <td style={{ fontWeight: 700 }}>{d.value}</td>
                                        <td>{employees.length > 0 ? ((d.value / employees.length) * 100).toFixed(1) : 0}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ──── ATTENDANCE ──── */}
            {activeReport === "attendance" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Attendance Analysis</h3></div>
                    <div style={{ padding: "20px" }}>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie data={attendanceStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name}: ${value}`}>
                                    {attendanceStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ──── LEAVE ──── */}
            {activeReport === "leave" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Leave Analysis</h3></div>
                    <div style={{ padding: "20px" }}>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={leaveStatusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
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
                                        <td style={{ fontWeight: 600 }}>{l.employee?.firstName || "-"} {l.employee?.lastName || ""}</td>
                                        <td>{l.leaveType || "-"}</td>
                                        <td>{l.startDate ? new Date(l.startDate).toLocaleDateString() : "-"}</td>
                                        <td>{l.endDate ? new Date(l.endDate).toLocaleDateString() : "-"}</td>
                                        <td style={{ fontWeight: 600 }}>{l.totalDays || 1}</td>
                                        <td><span className={`badge ${l.status?.toLowerCase()}`}>{l.status}</span></td>
                                    </tr>
                                ))}
                                {leaves.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No leave data available.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ──── PAYROLL ──── */}
            {activeReport === "payroll" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Monthly Payroll Trend</h3></div>
                    <div style={{ padding: "20px" }}>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={monthlyPayrollData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} formatter={(value: any) => [fmt(value), "Amount"]} />
                                <Line type="monotone" dataKey="amount" stroke="#1A73E8" strokeWidth={3} dot={{ fill: "#1A73E8", strokeWidth: 2, r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Employee</th><th>Gross</th><th>PF</th><th>ESI</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead>
                            <tbody>
                                {payroll.slice(0, 20).map((p: any) => (
                                    <tr key={p._id}>
                                        <td style={{ fontWeight: 600 }}>{p.employee?.firstName || "-"} {p.employee?.lastName || ""}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(p.totalEarnings || 0)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(p.deductions?.pf || 0)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(p.deductions?.esi || 0)}</td>
                                        <td style={{ fontFamily: "monospace", color: "var(--error)" }}>{fmt(p.totalDeductions || 0)}</td>
                                        <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{fmt(p.netPay || 0)}</td>
                                        <td><span className={`badge ${p.paymentStatus === "Paid" ? "paid" : "pending"}`}>{p.paymentStatus || "pending"}</span></td>
                                    </tr>
                                ))}
                                {payroll.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No payroll data available.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ──── COST ANALYSIS ──── */}
            {activeReport === "cost" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Cost Analysis Summary</h3></div>
                    <div style={{ padding: "24px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                            {[
                                { label: "Total Payroll Cost", value: fmt(payroll.reduce((s, p) => s + (p.totalEarnings || 0), 0)), icon: "💰", color: "#f97316" },
                                { label: "Avg Cost per Employee", value: fmt(employees.length > 0 ? Math.round(payroll.reduce((s, p) => s + (p.totalEarnings || 0), 0) / employees.length) : 0), icon: "👤", color: "#1A73E8" },
                                { label: "Total Deductions", value: fmt(payroll.reduce((s, p) => s + (p.totalDeductions || 0), 0)), icon: "📉", color: "#EA4335" },
                            ].map((card, i) => (
                                <div key={i} style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", textAlign: "center", borderTop: `3px solid ${card.color}` }}>
                                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>{card.icon}</div>
                                    <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "monospace" }}>{card.value}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", fontWeight: 600 }}>{card.label}</div>
                                </div>
                            ))}
                        </div>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={monthlyPayrollData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} formatter={(value: any) => [fmt(value), "Cost"]} />
                                <Bar dataKey="amount" fill="#FF6D00" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <style>{`@keyframes fadeInDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </>
    );
}
