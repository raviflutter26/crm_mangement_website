"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { 
    FiDownload, FiFilter, FiSearch, FiCalendar, FiUsers, FiDollarSign, FiBarChart2
} from "react-icons/fi";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const YEARS = [2024, 2025, 2026];

export default function StatutoryPage({ showNotify }: { showNotify: (type: any, msg: string) => void }) {
    const [activeTab, setActiveTab] = useState<"dashboard" | "pf" | "esi">("dashboard");
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [department, setDepartment] = useState("All");
    const [departments, setDepartments] = useState<any[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDepartments();
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === "pf") fetchPFReport();
        if (activeTab === "esi") fetchESIReport();
    }, [activeTab, month, year, department]);

    const fetchDepartments = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.DEPARTMENTS);
            setDepartments(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchStats = async () => {
        try {
            const res = await axiosInstance.get(`${API_BASE_URL}/api/statutory/dashboard`);
            setStats(res.data.data);
        } catch (err) { console.error(err); }
    };

    const fetchPFReport = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`${API_BASE_URL}/api/statutory/pf-report`, {
                params: { month, year, department }
            });
            setData(res.data.data);
        } catch (err) {
            showNotify('failure', "Failed to fetch PF report");
        } finally { setLoading(false); }
    };

    const fetchESIReport = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`${API_BASE_URL}/api/statutory/esi-report`, {
                params: { month, year, department }
            });
            setData(res.data.data);
        } catch (err) {
            showNotify('failure', "Failed to fetch ESI report");
        } finally { setLoading(false); }
    };

    const exportToCSV = () => {
        if (data.length === 0) return;
        const headers = activeTab === "pf" 
            ? ["Employee ID", "Name", "UAN", "PF Number", "Basic Salary", "Employee PF", "Employer PF"]
            : ["Employee ID", "Name", "ESI Number", "Gross Salary", "Employee ESI", "Employer ESI"];
        
        const rows = data.map(item => activeTab === "pf" 
            ? [item.employeeId, item.name, item.uan, item.pfNumber, item.basicSalary, item.employeePF, item.employerPF]
            : [item.employeeId, item.name, item.esiNumber, item.grossSalary, item.employeeESI, item.employerESI]
        );

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${activeTab.toUpperCase()}_Report_${month}_${year}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotify('success', "Report exported successfully!");
    };

    return (
        <div style={{ padding: "0 40px 40px", height: "100%", overflowY: "auto" }}>
            <div style={{ padding: "20px 0", borderBottom: "1px solid var(--border)", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Statutory Modules</h1>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>PF, ESI, and Statutory Compliance Reports</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="form-input" style={{ width: "130px" }}>
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="form-input" style={{ width: "100px" }}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="form-input" style={{ width: "150px" }}>
                        <option value="All">All Departments</option>
                        {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "30px", borderBottom: "1px solid var(--border)" }}>
                <button onClick={() => setActiveTab("dashboard")} style={{ padding: "12px 20px", border: "none", background: "none", cursor: "pointer", fontWeight: 600, color: activeTab === "dashboard" ? "var(--primary)" : "var(--text-muted)", borderBottom: activeTab === "dashboard" ? "2px solid var(--primary)" : "none" }}>Dashboard</button>
                <button onClick={() => setActiveTab("pf")} style={{ padding: "12px 20px", border: "none", background: "none", cursor: "pointer", fontWeight: 600, color: activeTab === "pf" ? "var(--primary)" : "var(--text-muted)", borderBottom: activeTab === "pf" ? "2px solid var(--primary)" : "none" }}>PF Report</button>
                <button onClick={() => setActiveTab("esi")} style={{ padding: "12px 20px", border: "none", background: "none", cursor: "pointer", fontWeight: 600, color: activeTab === "esi" ? "var(--primary)" : "var(--text-muted)", borderBottom: activeTab === "esi" ? "2px solid var(--primary)" : "none" }}>ESI Report</button>
            </div>

            {activeTab === "dashboard" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
                    <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "#E3F2FD", color: "#1976D2", display: "flex", alignItems: "center", justifyContent: "center" }}><FiUsers size={24} /></div>
                        <div><p style={{ fontSize: "12px", color: "var(--text-muted)" }}>PF Employees</p><h3 style={{ fontSize: "20px", fontWeight: 700 }}>{stats?.totalPFEmployees || 0}</h3></div>
                    </div>
                    <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "#F1F8E9", color: "#388E3C", display: "flex", alignItems: "center", justifyContent: "center" }}><FiUsers size={24} /></div>
                        <div><p style={{ fontSize: "12px", color: "var(--text-muted)" }}>ESI Employees</p><h3 style={{ fontSize: "20px", fontWeight: 700 }}>{stats?.totalESIEmployees || 0}</h3></div>
                    </div>
                    <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "#FFF3E0", color: "#F57C00", display: "flex", alignItems: "center", justifyContent: "center" }}><FiDollarSign size={24} /></div>
                        <div><p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total PF (Last Month)</p><h3 style={{ fontSize: "20px", fontWeight: 700 }}>₹{stats?.totalPFContribution?.toLocaleString() || 0}</h3></div>
                    </div>
                    <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "#F3E5F5", color: "#7B1FA2", display: "flex", alignItems: "center", justifyContent: "center" }}><FiDollarSign size={24} /></div>
                        <div><p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total ESI (Last Month)</p><h3 style={{ fontSize: "20px", fontWeight: 700 }}>₹{stats?.totalESIContribution?.toLocaleString() || 0}</h3></div>
                    </div>
                </div>
            )}

            {(activeTab === "pf" || activeTab === "esi") && (
                <div className="card">
                    <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ fontWeight: 700 }}>{activeTab === "pf" ? "Provident Fund (PF) Report" : "Employee State Insurance (ESI) Report"}</h4>
                        <button className="btn btn-secondary" onClick={exportToCSV} disabled={data.length === 0}><FiDownload /> Export CSV</button>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Emp ID</th>
                                    <th>Employee Name</th>
                                    {activeTab === "pf" ? (
                                        <><th>UAN</th><th>PF Number</th><th>Basic Salary</th><th>Employee PF</th><th>Employer PF</th></>
                                    ) : (
                                        <><th>ESI Number</th><th>Gross Salary</th><th>Employee ESI</th><th>Employer ESI</th></>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>Loading data...</td></tr>
                                ) : data.length > 0 ? (
                                    data.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.employeeId}</td>
                                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                                            {activeTab === "pf" ? (
                                                <><td>{item.uan}</td><td>{item.pfNumber}</td><td>₹{item.basicSalary?.toLocaleString()}</td><td>₹{item.employeePF?.toLocaleString()}</td><td>₹{item.employerPF?.toLocaleString()}</td></>
                                            ) : (
                                                <><td>{item.esiNumber}</td><td>₹{item.grossSalary?.toLocaleString()}</td><td>₹{item.employeeESI?.toLocaleString()}</td><td>₹{item.employerESI?.toLocaleString()}</td></>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>No records found for the selected period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5001";
