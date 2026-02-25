"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiDollarSign, FiDownload, FiFilter, FiTrendingUp, FiCheckCircle, FiClock, FiFileText, FiAlertCircle } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

export default function PayrollPage() {
    const [summary, setSummary] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showFilters, setShowFilters] = useState(false);
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState("");

    // Modal state for Running Payroll
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        employee: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basicSalary: 0,
        taxDeductions: 0
    });
    const [dialogState, setDialogState] = useState<{ show: boolean, type: "success" | "error" | "", title: string, message: string }>({ show: false, type: "", title: "", message: "" });

    const getToken = async () => {
        let token = localStorage.getItem('ravi_zoho_token');
        if (!token) { window.location.reload(); throw new Error("No token"); }
        return token;
    };

    const fetchPayroll = async () => {
        try {
            setLoading(true);
            const token = await getToken();

            const [summaryRes, recordsRes, employeesRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.PAYROLL_SUMMARY),
                axiosInstance.get(API_ENDPOINTS.PAYROLL),
                axiosInstance.get(API_ENDPOINTS.EMPLOYEES)
            ]);

            setSummary(summaryRes.data.data);
            setRecords(recordsRes.data.data || []);
            setEmployees(employeesRes.data.data || []);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('ravi_zoho_token');
            }
            console.error("Failed to fetch payroll data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, []);

    const handleInputChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRunPayrollSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const token = await getToken();
            const payload = {
                employee: formData.employee,
                month: Number(formData.month),
                year: Number(formData.year),
                earnings: {
                    basic: Number(formData.basicSalary) || 0,
                    hra: 0, da: 0, ta: 0, specialAllowance: 0, bonus: 0, overtime: 0, otherEarnings: 0
                },
                deductions: {
                    tax: Number(formData.taxDeductions) || 0,
                    pf: 0, esi: 0, professionalTax: 0, loanDeduction: 0, otherDeductions: 0
                },
                paymentStatus: "Paid" // Defaulting to Paid to show success on UI easily
            };

            await axiosInstance.post(API_ENDPOINTS.PAYROLL, payload);

            setShowModal(false);
            setFormData({ ...formData, basicSalary: 0, taxDeductions: 0 }); // reset
            setDialogState({ show: true, type: "success", title: "Payroll Generated", message: "Payroll has been successfully processed for this user." });
            fetchPayroll();
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('ravi_zoho_token');
                setDialogState({ show: true, type: "error", title: "Session Expired", message: "Your session has expired. Please log in again." });
            } else {
                console.error("Payroll Error", err);
                let errMsg = err.response?.data?.message || err.message;
                if (errMsg.includes("Duplicate value")) {
                    errMsg = "Payroll already exists for this employee for the selected month and year.";
                }
                setDialogState({ show: true, type: "error", title: "Action Failed", message: errMsg });
            }
        }
    };

    const handleDownloadPayslip = (rec: any) => {
        const empName = `${rec.employee?.firstName || ""} ${rec.employee?.lastName || ""}`.trim();
        const content = `======================================\n` +
            `                 PAYSLIP\n` +
            `======================================\n` +
            `Employee Name:  ${empName}\n` +
            `Designation:    ${rec.employee?.designation || ""}\n` +
            `Month / Year:   ${months[rec.month - 1]} ${rec.year}\n` +
            `--------------------------------------\n` +
            `Gross Earnings: Rs ${parseFloat(rec.totalEarnings || 0).toLocaleString()}\n` +
            `Tax Deductions: Rs ${parseFloat(rec.totalDeductions || 0).toLocaleString()}\n` +
            `--------------------------------------\n` +
            `NET PAY:        Rs ${parseFloat(rec.netPay || 0).toLocaleString()}\n` +
            `--------------------------------------\n` +
            `Status:         ${rec.paymentStatus}\n` +
            `======================================`;

        const encodedUri = encodeURI(`data:text/plain;charset=utf-8,${content}`);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Payslip_${empName.replace(/ /g, "_")}_${rec.month}_${rec.year}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportBankFormat = () => {
        if (records.length === 0) {
            setDialogState({ show: true, type: "error", title: "Export Failed", message: "No payroll records to export." });
            return;
        }

        const headers = ["Beneficiary Name", "Account Number", "IFSC", "Amount", "Remarks"];
        const rows = records.map(rec => [
            `${rec.employee?.firstName || ""} ${rec.employee?.lastName || ""}`.trim(),
            "000000000000", // Placeholder for actual account number
            "ZOHO0000001", // Placeholder for IFSC
            rec.netPay || 0,
            `Salary ${months[rec.month - 1]} ${rec.year}`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Bank_Export_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center" }}>Loading Payroll...</div>;
    }

    const payrollStats = [
        { label: "Total Payroll", value: `₹${(summary?.totalNetPay || 0).toLocaleString()}`, icon: FiDollarSign, color: "blue" },
        { label: "Total Earnings", value: `₹${(summary?.totalEarnings || 0).toLocaleString()}`, icon: FiTrendingUp, color: "green" },
        { label: "Pending Payments", value: summary?.pending || 0, icon: FiClock, color: "orange" },
        { label: "Processed", value: summary?.paid || 0, icon: FiCheckCircle, color: "purple" },
    ];

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payroll Management</h1>
                    <p className="page-subtitle">Manage salaries, taxes, and pay slips</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}><FiFilter /> Filter</button>
                    <button className="btn btn-secondary" onClick={handleExportBankFormat}><FiDownload /> Export Bank Format</button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FiDollarSign /> Run Payroll
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            {showFilters && (
                <div className="card" style={{ padding: "15px", marginBottom: "20px", display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                        <select className="form-input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                            <option value="">All Months</option>
                            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <select className="form-input" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                            <option value="">All Years</option>
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                        </select>
                    </div>
                    <button className="btn btn-secondary" onClick={() => { setFilterMonth(""); setFilterYear(""); }}>Clear Filters</button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
                {payrollStats.map((stat, i) => (
                    <div key={i} className={`stat-card ${stat.color}`}>
                        <div className="stat-card-header">
                            <div className={`stat-card-icon ${stat.color}`}><stat.icon /></div>
                        </div>
                        <div className="stat-card-value">{stat.value}</div>
                        <div className="stat-card-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Payroll Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Recent Pay Runs</h3>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Month/Year</th>
                                <th>Gross Pay</th>
                                <th>Deductions</th>
                                <th>Net Pay</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records
                                .filter(rec => filterMonth ? rec.month === Number(filterMonth) : true)
                                .filter(rec => filterYear ? rec.year === Number(filterYear) : true)
                                .map((rec, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>
                                            {rec.employee?.firstName} {rec.employee?.lastName}
                                        </td>
                                        <td>{rec.month} / {rec.year}</td>
                                        <td style={{ color: "var(--success)" }}>₹{(rec.totalEarnings || 0).toLocaleString()}</td>
                                        <td style={{ color: "var(--error)" }}>₹{(rec.totalDeductions || 0).toLocaleString()}</td>
                                        <td style={{ fontWeight: 800 }}>₹{(rec.netPay || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${rec.paymentStatus?.toLowerCase()}`}>
                                                {rec.paymentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "5px" }} onClick={() => handleDownloadPayslip(rec)}>
                                                <FiFileText size={14} /> Payslip
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>

                    {records.filter(rec => filterMonth ? rec.month === Number(filterMonth) : true)
                        .filter(rec => filterYear ? rec.year === Number(filterYear) : true).length === 0 && (
                            <div className="empty-state">
                                <FiDollarSign className="empty-state-icon" style={{ opacity: 0.5 }} />
                                <h3>No Payroll Records Found</h3>
                                <p>It looks like payroll hasn't been run for this period yet.</p>
                                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                    <FiDollarSign /> Run First Payroll
                                </button>
                            </div>
                        )}
                </div>
            </div>

            {/* Run Payroll Modal Validation */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div className="card animate-in" style={{ width: "500px", padding: "25px" }}>
                        <h2 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ padding: "8px", background: "var(--primary)", color: "white", borderRadius: "8px", display: "flex" }}><FiDollarSign /></div>
                            Run Employee Payroll
                        </h2>

                        <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "14px", lineHeight: "1.5" }}>
                            Easily generate a payslip record. The system will automatically calculate the Gross and Net Pay metrics for you!
                        </p>

                        <form onSubmit={handleRunPayrollSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Select Employee</label>
                                <select required name="employee" value={formData.employee} onChange={handleInputChange} className="form-input">
                                    <option value="">-- Choose Employee --</option>
                                    {employees.map((emp) => (
                                        <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "flex", gap: "15px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Payroll Month</label>
                                    <select required name="month" value={formData.month} onChange={handleInputChange} className="form-input">
                                        {months.map((m, index) => (
                                            <option key={index + 1} value={index + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Year</label>
                                    <input type="number" required name="year" value={formData.year} onChange={handleInputChange} className="form-input" min="2020" max="2030" />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Basic Salary (₹)</label>
                                    <input type="number" required name="basicSalary" value={formData.basicSalary} onChange={handleInputChange} className="form-input" placeholder="e.g. 50000" min="0" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Tax Deductions (₹)</label>
                                    <input type="number" required name="taxDeductions" value={formData.taxDeductions} onChange={handleInputChange} className="form-input" placeholder="e.g. 2000" min="0" />
                                </div>
                            </div>

                            <div style={{ padding: "12px", background: "var(--bg-primary)", borderRadius: "8px", marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Estimated Net Pay:</span>
                                <span style={{ fontSize: "20px", fontWeight: "bold", color: "var(--success)" }}>
                                    ₹{Math.max(0, Number(formData.basicSalary || 0) - Number(formData.taxDeductions || 0)).toLocaleString()}
                                </span>
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>Process Payroll</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success/Error Dialog */}
            {dialogState.show && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2000,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div className="card animate-in" style={{ width: "400px", padding: "25px", textAlign: "center" }}>
                        <div style={{
                            width: "60px", height: "60px", borderRadius: "30px",
                            background: dialogState.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: dialogState.type === "success" ? "var(--success)" : "var(--error)",
                            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
                        }}>
                            {dialogState.type === "success" ? <FiCheckCircle size={30} /> : <FiAlertCircle size={30} />}
                        </div>
                        <h2 style={{ marginBottom: "10px", fontSize: "18px" }}>{dialogState.title}</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "25px", lineHeight: "1.5" }}>
                            {dialogState.message}
                        </p>
                        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setDialogState({ ...dialogState, show: false })}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
