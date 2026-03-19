"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiDollarSign, FiDownload, FiTrendingUp, FiCheckCircle, FiClock,
    FiFileText, FiAlertCircle, FiPlay, FiThumbsUp, FiCreditCard,
    FiUsers, FiXCircle, FiChevronRight, FiShield
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STATUS_BADGE: any = {
    draft: "pending", processing: "processing", review: "pending",
    approved: "active", paid: "paid", failed: "rejected",
    Pending: "pending", Paid: "paid", Processing: "processing", Failed: "rejected",
};

interface PayrollProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function PayrollPage({ showNotify }: PayrollProps) {
    const [activeTab, setActiveTab] = useState<"runs" | "records" | "payslip">("runs");
    const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
    const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [complianceSettings, setComplianceSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState("");
    const [showRunModal, setShowRunModal] = useState(false);
    const [runMonth, setRunMonth] = useState(new Date().getMonth() + 1);
    const [runYear, setRunYear] = useState(new Date().getFullYear());
    const [runningPayroll, setRunningPayroll] = useState(false);
    const [selectedRun, setSelectedRun] = useState<any>(null);
    const [showPayslipModal, setShowPayslipModal] = useState(false);
    const [payslipData, setPayslipData] = useState<any>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [runsRes, recordsRes, summaryRes, compRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.PAYROLL_RUNS).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.PAYROLL).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.PAYROLL_SUMMARY).catch(() => ({ data: { data: {} } })),
                axiosInstance.get(API_ENDPOINTS.COMPLIANCE).catch(() => ({ data: { data: null } })),
            ]);
            setPayrollRuns(runsRes.data.data || []);
            setPayrollRecords(recordsRes.data.data || []);
            setSummary(summaryRes.data.data || {});
            setComplianceSettings(compRes.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleInitiateRun = async () => {
        setRunningPayroll(true);
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.PAYROLL_RUNS_INITIATE, { month: runMonth, year: runYear });
            showToast(res.data.message || "Payroll processed!");
            setShowRunModal(false);
            fetchAll();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to initiate payroll run");
        } finally { setRunningPayroll(false); }
    };

    const handleApprove = async (id: string) => {
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.PAYROLL_RUNS}/${id}/approve`);
            showToast("Payroll approved! ✅");
            fetchAll();
        } catch (err: any) { alert(err.response?.data?.message || "Approval failed"); }
    };

    const handlePay = async (id: string) => {
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.PAYOUTS_INITIATE, { runId: id });
            if (showNotify) showNotify('success', res.data.message || "Payroll disbursed via RazorpayX! 💰");
            fetchAll();
        } catch (err: any) { 
            const msg = err.response?.data?.message || "Payment failed";
            if (showNotify) showNotify('failure', msg);
            else alert(msg);
        }
    };

    const viewRunDetails = async (run: any) => {
        try {
            const res = await axiosInstance.get(`${API_ENDPOINTS.PAYROLL_RUNS}/${run._id}`);
            setSelectedRun(res.data.data);
        } catch (err) { setSelectedRun(run); }
    };

    const openPayslip = (rec: any) => {
        setPayslipData(rec);
        setShowPayslipModal(true);
    };

    const downloadPayslipHTML = () => {
        if (!payslipData) return;
        const emp = payslipData.employee || {};
        const html = `<!DOCTYPE html><html><head><title>Payslip - ${emp.firstName} ${emp.lastName}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px} table{width:100%;border-collapse:collapse;margin:10px 0} td,th{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f0f0f0} .header{text-align:center;margin-bottom:20px} .total{font-weight:bold;background:#f8f8f8} .amount{text-align:right;font-family:monospace}</style></head><body>
<div class="header"><h2>PAYSLIP</h2><p>Month: ${MONTHS[(payslipData.month || 1) - 1]} ${payslipData.year}</p></div>
<table><tr><th>Employee Name</th><td>${emp.firstName || ""} ${emp.lastName || ""}</td><th>Employee ID</th><td>${emp.employeeId || "-"}</td></tr>
<tr><th>Department</th><td>${emp.department || "-"}</td><th>Designation</th><td>${emp.designation || "-"}</td></tr>
<tr><th>Working Days</th><td>${payslipData.workingDays || 0}</td><th>Present Days</th><td>${payslipData.presentDays || 0}</td></tr></table>
<table><tr><th colspan="2">Earnings</th><th colspan="2">Deductions</th></tr>
<tr><td>Basic</td><td class="amount">${fmt(payslipData.earnings?.basic)}</td><td>PF</td><td class="amount">${fmt(payslipData.deductions?.pf)}</td></tr>
<tr><td>HRA</td><td class="amount">${fmt(payslipData.earnings?.hra)}</td><td>ESI</td><td class="amount">${fmt(payslipData.deductions?.esi)}</td></tr>
<tr><td>DA</td><td class="amount">${fmt(payslipData.earnings?.da)}</td><td>Prof. Tax</td><td class="amount">${fmt(payslipData.deductions?.professionalTax)}</td></tr>
<tr><td>TA</td><td class="amount">${fmt(payslipData.earnings?.ta)}</td><td>TDS</td><td class="amount">${fmt(payslipData.deductions?.tax)}</td></tr>
<tr><td>Spl. Allowance</td><td class="amount">${fmt(payslipData.earnings?.specialAllowance)}</td><td>Loan</td><td class="amount">${fmt(payslipData.deductions?.loanDeduction)}</td></tr>
<tr class="total"><td>Total Earnings</td><td class="amount">${fmt(payslipData.totalEarnings)}</td><td>Total Deductions</td><td class="amount">${fmt(payslipData.totalDeductions)}</td></tr></table>
<table><tr class="total"><td><b>NET PAY</b></td><td class="amount" style="font-size:18px"><b>${fmt(payslipData.netPay)}</b></td></tr></table>
<p style="text-align:center;margin-top:40px;font-size:12px;color:#999">This is a computer-generated payslip. No signature required.</p></body></html>`;

        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payslip_${emp.employeeId || "emp"}_${payslipData.month}_${payslipData.year}.html`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Payslip downloaded! 📄");
    };

    const fmt = (n: any) => `₹${(n || 0).toLocaleString("en-IN")}`;

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Payroll...</div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payroll Management</h1>
                    <p className="page-subtitle">Process payroll, manage compliance, and generate payslips</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowRunModal(true)}>
                    <FiPlay /> Run Payroll
                </button>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-card-header"><div className="stat-card-icon blue"><FiDollarSign /></div></div>
                    <div className="stat-card-value">{fmt(summary?.totalNetPay || 0)}</div>
                    <div className="stat-card-label">Net Payroll</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-card-header"><div className="stat-card-icon green"><FiTrendingUp /></div></div>
                    <div className="stat-card-value">{fmt(summary?.totalEarnings || 0)}</div>
                    <div className="stat-card-label">Gross Earnings</div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-card-header"><div className="stat-card-icon orange"><FiShield /></div></div>
                    <div className="stat-card-value">{fmt(summary?.totalDeductions || 0)}</div>
                    <div className="stat-card-label">Total Deductions</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-card-header"><div className="stat-card-icon purple"><FiUsers /></div></div>
                    <div className="stat-card-value">{summary?.employeeCount || 0}</div>
                    <div className="stat-card-label">Employees Processed</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <button className={`btn ${activeTab === "runs" ? "btn-primary" : "btn-secondary"}`} onClick={() => { setActiveTab("runs"); setSelectedRun(null); }}>
                    <FiPlay /> Payroll Runs
                </button>
                <button className={`btn ${activeTab === "records" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("records")}>
                    <FiFileText /> Individual Records
                </button>
            </div>

            {/* Payroll Runs OR Selected Run Detail */}
            {activeTab === "runs" && !selectedRun && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Payroll Runs</h3></div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Run ID</th><th>Month</th><th>Employees</th><th>Gross Pay</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {payrollRuns.map((run: any) => (
                                    <tr key={run._id}>
                                        <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{run.runId}</td>
                                        <td>{MONTHS[(run.month || 1) - 1]} {run.year}</td>
                                        <td>{run.totalEmployees}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(run.totalGrossPay)}</td>
                                        <td style={{ fontFamily: "monospace", color: "var(--error)" }}>{fmt(run.totalDeductions)}</td>
                                        <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{fmt(run.totalNetPay)}</td>
                                        <td><span className={`badge ${STATUS_BADGE[run.status]}`}>{run.status}</span></td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => viewRunDetails(run)} title="View details"><FiChevronRight size={14} /></button>
                                                {run.status === "review" && <button className="btn btn-primary btn-sm" onClick={() => handleApprove(run._id)} title="Approve"><FiThumbsUp size={14} /></button>}
                                                {run.status === "approved" && <button className="btn btn-primary btn-sm" onClick={() => handlePay(run._id)} title="Disburse"><FiCreditCard size={14} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {payrollRuns.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No payroll runs yet. Click &quot;Run Payroll&quot; to start.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Selected Run Details */}
            {activeTab === "runs" && selectedRun && (
                <div className="card">
                    <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 className="card-title">Run: {selectedRun.runId} — {MONTHS[(selectedRun.month || 1) - 1]} {selectedRun.year}</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRun(null)}>← Back</button>
                    </div>

                    {/* Compliance Summary */}
                    <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                        <div style={{ padding: "14px 16px", background: "var(--primary-bg-light)", borderRadius: "10px" }}>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total PF</div>
                            <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "monospace" }}>{fmt(selectedRun.totalPF)}</div>
                        </div>
                        <div style={{ padding: "14px 16px", background: "var(--secondary-bg-light)", borderRadius: "10px" }}>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total ESI</div>
                            <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "monospace" }}>{fmt(selectedRun.totalESI)}</div>
                        </div>
                        <div style={{ padding: "14px 16px", background: "var(--accent-bg-light)", borderRadius: "10px" }}>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total PT</div>
                            <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "monospace" }}>{fmt(selectedRun.totalPT)}</div>
                        </div>
                        <div style={{ padding: "14px 16px", background: "var(--error-bg-light)", borderRadius: "10px" }}>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total TDS</div>
                            <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "monospace" }}>{fmt(selectedRun.totalTDS)}</div>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Employee</th><th>Basic</th><th>HRA</th><th>PF</th><th>ESI</th><th>PT</th><th>TDS</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Payslip</th></tr></thead>
                            <tbody>
                                {(selectedRun.payrollRecords || []).map((rec: any) => (
                                    <tr key={rec._id}>
                                        <td style={{ fontWeight: 600 }}>{rec.employee?.firstName} {rec.employee?.lastName}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.earnings?.basic)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.earnings?.hra)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.deductions?.pf)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.deductions?.esi)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.deductions?.professionalTax)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.deductions?.tax)}</td>
                                        <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{fmt(rec.totalEarnings)}</td>
                                        <td style={{ fontFamily: "monospace", color: "var(--error)" }}>{fmt(rec.totalDeductions)}</td>
                                        <td style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--secondary)" }}>{fmt(rec.netPay)}</td>
                                        <td><button className="btn btn-secondary btn-sm" onClick={() => openPayslip(rec)}><FiDownload size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Individual Records Tab */}
            {activeTab === "records" && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Individual Payroll Records</h3></div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Employee</th><th>Month/Year</th><th>Gross</th><th>PF</th><th>ESI</th><th>PT</th><th>TDS</th><th>Net Pay</th><th>Status</th><th>Payslip</th></tr></thead>
                            <tbody>
                                {payrollRecords.map((rec: any) => (
                                    <tr key={rec._id}>
                                        <td style={{ fontWeight: 600 }}>{rec.employee?.firstName} {rec.employee?.lastName}</td>
                                        <td>{MONTHS[(rec.month || 1) - 1]} {rec.year}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.totalEarnings)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.deductions?.pf)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.deductions?.esi)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.deductions?.professionalTax)}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(rec.deductions?.tax)}</td>
                                        <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{fmt(rec.netPay)}</td>
                                        <td><span className={`badge ${STATUS_BADGE[rec.paymentStatus]}`}>{rec.paymentStatus}</span></td>
                                        <td><button className="btn btn-secondary btn-sm" onClick={() => openPayslip(rec)}><FiDownload size={14} /></button></td>
                                    </tr>
                                ))}
                                {payrollRecords.length === 0 && <tr><td colSpan={10} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No payroll records.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showRunModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--overlay-bg)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "520px", padding: "0" }}>
                        <div style={{ padding: "24px 24px 0", borderBottom: "1px solid var(--border)" }}>
                            <h2 style={{ marginBottom: "4px" }}>🚀 Run Payroll</h2>
                            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>Process monthly salaries with automated PF, ESI, PT, TDS calculations</p>
                        </div>
                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div className="grid-2">
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: 600 }}>Month</label>
                                    <select className="form-input" value={runMonth} onChange={e => setRunMonth(parseInt(e.target.value))}>
                                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: 600 }}>Year</label>
                                    <select className="form-input" value={runYear} onChange={e => setRunYear(parseInt(e.target.value))}>
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ background: "var(--primary-bg-light)", borderRadius: "10px", padding: "16px", border: "1px solid var(--border)" }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "var(--primary)" }}>Payroll will automatically calculate:</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "13px" }}>
                                    <div>✅ PF ({complianceSettings?.pf?.employeeContribution || 12}% + {complianceSettings?.pf?.employerContribution || 12}%)</div>
                                    <div>✅ ESI ({complianceSettings?.esi?.employeeContribution || 0.75}% + {complianceSettings?.esi?.employerContribution || 3.25}%)</div>
                                    <div>✅ Professional Tax (state-wise)</div>
                                    <div>✅ TDS (as per tax regime)</div>
                                    <div>✅ Attendance-based pro-rata</div>
                                    <div>✅ RazorpayX Payouts Integrated</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
                                <button className="btn btn-secondary" onClick={() => setShowRunModal(false)} disabled={runningPayroll}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleInitiateRun} disabled={runningPayroll}
                                    style={{ minWidth: "160px" }}>
                                    {runningPayroll ? (
                                        <><FiClock className="spin" /> Processing...</>
                                    ) : (
                                        <><FiPlay /> Process Payroll</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payslip Modal */}
            {showPayslipModal && payslipData && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--overlay-bg)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "600px", maxHeight: "80vh", overflow: "auto" }}>
                        <div style={{ padding: "24px" }}>
                            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                <h2 style={{ fontSize: "20px" }}>Payslip</h2>
                                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{MONTHS[(payslipData.month || 1) - 1]} {payslipData.year}</p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px", fontSize: "13px" }}>
                                <div><strong>Name:</strong> {payslipData.employee?.firstName} {payslipData.employee?.lastName}</div>
                                <div><strong>Employee ID:</strong> {payslipData.employee?.employeeId}</div>
                                <div><strong>Department:</strong> {payslipData.employee?.department || "-"}</div>
                                <div><strong>Designation:</strong> {payslipData.employee?.designation || "-"}</div>
                                <div><strong>Working Days:</strong> {payslipData.workingDays}</div>
                                <div><strong>Present Days:</strong> {payslipData.presentDays}</div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {/* Earnings */}
                                <div>
                                    <h4 style={{ color: "var(--secondary)", marginBottom: "10px", fontSize: "14px" }}>💰 Earnings</h4>
                                    {[
                                        { l: "Basic", v: payslipData.earnings?.basic },
                                        { l: "HRA", v: payslipData.earnings?.hra },
                                        { l: "DA", v: payslipData.earnings?.da },
                                        { l: "TA", v: payslipData.earnings?.ta },
                                        { l: "Spl. Allowance", v: payslipData.earnings?.specialAllowance },
                                    ].map((r, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", borderBottom: "1px solid var(--border)" }}>
                                            <span>{r.l}</span><span style={{ fontFamily: "monospace" }}>{fmt(r.v)}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontWeight: 700, color: "var(--secondary)" }}>
                                        <span>Total Earnings</span><span style={{ fontFamily: "monospace" }}>{fmt(payslipData.totalEarnings)}</span>
                                    </div>
                                </div>
                                {/* Deductions */}
                                <div>
                                    <h4 style={{ color: "var(--error)", marginBottom: "10px", fontSize: "14px" }}>📉 Deductions</h4>
                                    {[
                                        { l: "PF", v: payslipData.deductions?.pf },
                                        { l: "ESI", v: payslipData.deductions?.esi },
                                        { l: "Prof. Tax", v: payslipData.deductions?.professionalTax },
                                        { l: "TDS", v: payslipData.deductions?.tax },
                                        { l: "Loan", v: payslipData.deductions?.loanDeduction },
                                    ].map((r, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", borderBottom: "1px solid var(--border)" }}>
                                            <span>{r.l}</span><span style={{ fontFamily: "monospace" }}>{fmt(r.v)}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontWeight: 700, color: "var(--error)" }}>
                                        <span>Total Deductions</span><span style={{ fontFamily: "monospace" }}>{fmt(payslipData.totalDeductions)}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: "16px", padding: "16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", textAlign: "center" }}>
                                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Net Pay</div>
                                <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "monospace", color: "var(--primary)" }}>{fmt(payslipData.netPay)}</div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                                <button className="btn btn-secondary" onClick={() => setShowPayslipModal(false)}>Close</button>
                                <button className="btn btn-primary" onClick={downloadPayslipHTML}><FiDownload /> Download Payslip</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "var(--success-bg)", color: "white", padding: "12px 20px", borderRadius: "8px", zIndex: 3000, boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, animation: "fadeInUp 0.3s ease-out" }}>
                    <FiCheckCircle size={20} /> {toast}
                </div>
            )}
        </>
    );
}
