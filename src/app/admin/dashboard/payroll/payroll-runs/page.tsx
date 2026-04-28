"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import PayslipModal from "@/components/payroll/PayslipModal";
import {
    FiPlay, FiThumbsUp, FiCreditCard, FiLock, FiDownload,
    FiChevronRight, FiClock, FiCheckCircle, FiAlertCircle
} from "react-icons/fi";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmt = (n: any) => `₹${(n || 0).toLocaleString("en-IN")}`;

const FLOW = [
    { key: "draft",      label: "Draft",      icon: FiClock,        color: "#64748B", bg: "#F3F4F6" },
    { key: "processing", label: "Processing",  icon: FiClock,        color: "#3B82F6", bg: "#DBEAFE" },
    { key: "review",     label: "In Review",   icon: FiAlertCircle,  color: "#F59E0B", bg: "#FEF3C7" },
    { key: "approved",   label: "Approved",    icon: FiThumbsUp,     color: "#10B981", bg: "#D1FAE5" },
    { key: "locked",     label: "Locked",      icon: FiLock,         color: "#8B5CF6", bg: "#EDE9FE" },
    { key: "paid",       label: "Paid",        icon: FiCheckCircle,  color: "#059669", bg: "#A7F3D0" },
];

export default function PayrollRunsPage() {
    const [runs, setRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRun, setSelectedRun] = useState<any>(null);
    const [runModal, setRunModal] = useState(false);
    const [runMonth, setRunMonth] = useState(new Date().getMonth() + 1);
    const [runYear, setRunYear] = useState(new Date().getFullYear());
    const [running, setRunning] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);
    const [payslipData, setPayslipData] = useState<any>(null);
    const [complianceSettings, setComplianceSettings] = useState<any>(null);
    const [toast, setToast] = useState("");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

    const fetchRuns = useCallback(async () => {
        setLoading(true);
        try {
            const [runsRes, compRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.PAYROLL_RUNS).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.COMPLIANCE).catch(() => ({ data: { data: null } })),
            ]);
            setRuns(runsRes.data.data || []);
            setComplianceSettings(compRes.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchRuns(); }, [fetchRuns]);

    const handleRun = async () => {
        setRunning(true);
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.PAYROLL_RUNS_INITIATE, { month: runMonth, year: runYear });
            showToast(res.data.message || "Payroll run initiated!");
            setRunModal(false);
            fetchRuns();
        } catch (e: any) { alert(e.response?.data?.message || "Failed to run payroll"); }
        finally { setRunning(false); }
    };

    const handleApprove = async (id: string) => {
        setProcessing(id);
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.PAYROLL_RUNS}/${id}/approve`);
            showToast("Payroll approved! ✅"); fetchRuns();
        } catch (e: any) { alert(e.response?.data?.message || "Approval failed"); }
        finally { setProcessing(null); }
    };

    const handleLock = async (id: string) => {
        setProcessing(id);
        try {
            await axiosInstance.post(API_ENDPOINTS.PAYROLL_LOCK(id));
            showToast("Payroll locked 🔒 — Ready for disbursement"); fetchRuns();
        } catch (e: any) { alert(e.response?.data?.message || "Lock failed"); }
        finally { setProcessing(null); }
    };

    const handleDisburse = async (id: string) => {
        setProcessing(id);
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.PAYOUTS_INITIATE, { runId: id });
            showToast(res.data.message || "Disbursement initiated via RazorpayX! 💸"); fetchRuns();
        } catch (e: any) { alert(e.response?.data?.message || "Disbursement failed"); }
        finally { setProcessing(null); }
    };

    const loadRunDetail = async (run: any) => {
        try {
            const res = await axiosInstance.get(`${API_ENDPOINTS.PAYROLL_RUNS}/${run._id}`);
            setSelectedRun(res.data.data || run);
        } catch { setSelectedRun(run); }
    };

    const getFlowItem = (status: string) => FLOW.find(f => f.key === status) || FLOW[0];

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E1B4B", margin: 0 }}>Payroll Runs</h1>
                    <p style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>
                        Generate, approve, lock and disburse monthly salaries
                    </p>
                </div>
                {!selectedRun && (
                    <button className="btn btn-primary" onClick={() => setRunModal(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <FiPlay size={14} /> Run Payroll
                    </button>
                )}
                {selectedRun && (
                    <button className="btn btn-secondary" onClick={() => setSelectedRun(null)}>← Back to Runs</button>
                )}
            </div>

            {/* Status Flow Stepper */}
            {!selectedRun && (
                <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#fff", borderRadius: 16, padding: "16px 24px", marginBottom: 24, border: "1px solid #E8EAFF", overflowX: "auto" }}>
                    {FLOW.map((step, i) => (
                        <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: step.bg, color: step.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <step.icon size={16} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: step.color, marginTop: 6, textAlign: "center" }}>{step.label}</span>
                            </div>
                            {i < FLOW.length - 1 && <div style={{ width: 40, height: 2, background: "#E2E8F0", flexShrink: 0, margin: "0 8px" }} />}
                        </div>
                    ))}
                </div>
            )}

            {/* Runs Table */}
            {!selectedRun && (
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8EAFF", overflow: "hidden" }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Run ID</th>
                                    <th>Month/Year</th>
                                    <th>Employees</th>
                                    <th>Gross Pay</th>
                                    <th>Deductions</th>
                                    <th>Net Pay</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="skeleton-pulse" style={{ height: 16, borderRadius: 6 }} /></td>)}</tr>
                                    ))
                                ) : runs.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: "center", padding: "72px 20px" }}>
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                                        <div style={{ fontWeight: 700, color: "#1E293B" }}>No payroll runs yet</div>
                                        <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>Click "Run Payroll" to generate your first monthly payroll</div>
                                    </td></tr>
                                ) : (
                                    runs.map((run: any) => {
                                        const flow = getFlowItem(run.status);
                                        const isProcessing = processing === run._id;
                                        return (
                                            <tr key={run._id}>
                                                <td style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>{run.runId}</td>
                                                <td style={{ fontWeight: 600 }}>{MONTHS[(run.month || 1) - 1]} {run.year}</td>
                                                <td>{run.totalEmployees || 0}</td>
                                                <td style={{ fontFamily: "monospace" }}>{fmt(run.totalGrossPay)}</td>
                                                <td style={{ fontFamily: "monospace", color: "#EF4444" }}>{fmt(run.totalDeductions)}</td>
                                                <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#6366F1" }}>{fmt(run.totalNetPay)}</td>
                                                <td>
                                                    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: flow.bg, color: flow.color }}>
                                                        {flow.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => loadRunDetail(run)} title="View details">
                                                            <FiChevronRight size={14} />
                                                        </button>
                                                        {run.status === "review" && (
                                                            <button className="btn btn-primary btn-sm" onClick={() => handleApprove(run._id)} disabled={isProcessing} title="Approve">
                                                                <FiThumbsUp size={13} /> {isProcessing ? "…" : "Approve"}
                                                            </button>
                                                        )}
                                                        {run.status === "approved" && (
                                                            <button className="btn btn-primary btn-sm" onClick={() => handleLock(run._id)} disabled={isProcessing} title="Lock payroll" style={{ background: "#8B5CF6" }}>
                                                                <FiLock size={13} /> {isProcessing ? "…" : "Lock"}
                                                            </button>
                                                        )}
                                                        {run.status === "locked" && (
                                                            <button className="btn btn-primary btn-sm" onClick={() => handleDisburse(run._id)} disabled={isProcessing} title="Disburse via RazorpayX">
                                                                <FiCreditCard size={13} /> {isProcessing ? "…" : "Disburse"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Run Detail */}
            {selectedRun && (
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8EAFF" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: "#1E1B4B" }}>
                                Run: {selectedRun.runId} — {MONTHS[(selectedRun.month || 1) - 1]} {selectedRun.year}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            {selectedRun.status === "review" && <button className="btn btn-primary btn-sm" onClick={() => handleApprove(selectedRun._id)}><FiThumbsUp size={13} /> Approve</button>}
                            {selectedRun.status === "approved" && <button className="btn btn-primary btn-sm" onClick={() => handleLock(selectedRun._id)} style={{ background: "#8B5CF6" }}><FiLock size={13} /> Lock</button>}
                            {selectedRun.status === "locked" && <button className="btn btn-primary btn-sm" onClick={() => handleDisburse(selectedRun._id)}><FiCreditCard size={13} /> Disburse via RazorpayX</button>}
                        </div>
                    </div>
                    {/* Compliance Summary */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, padding: "16px 24px", borderBottom: "1px solid #F1F5F9" }}>
                        {[
                            { label: "Total PF", value: fmt(selectedRun.totalPF), color: "#6366F1" },
                            { label: "Total ESI", value: fmt(selectedRun.totalESI), color: "#10B981" },
                            { label: "Total PT", value: fmt(selectedRun.totalPT), color: "#F59E0B" },
                            { label: "Total TDS", value: fmt(selectedRun.totalTDS), color: "#EF4444" },
                        ].map((s, i) => (
                            <div key={i} style={{ padding: "14px 16px", background: "#F8FAFC", borderRadius: 12 }}>
                                <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>{s.label}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color: s.color, marginTop: 4 }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                    {/* Records Table */}
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th><th>Basic</th><th>HRA</th><th>PF</th><th>ESI</th><th>PT</th><th>TDS</th>
                                    <th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Payslip</th>
                                </tr>
                            </thead>
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
                                        <td style={{ fontFamily: "monospace", color: "#EF4444" }}>{fmt(rec.totalDeductions)}</td>
                                        <td style={{ fontFamily: "monospace", fontWeight: 800, color: "#6366F1" }}>{fmt(rec.netPay)}</td>
                                        <td><button className="btn btn-secondary btn-sm" onClick={() => setPayslipData(rec)}><FiDownload size={13} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Run Modal */}
            {runModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: 540, padding: "32px 36px" }}>
                        <h2 style={{ marginBottom: 8, fontSize: 22 }}>🚀 Run Payroll</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
                            Calculate salaries with PF, ESI, PT, TDS and attendance-based pro-rata
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
                            <div>
                                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Month</label>
                                <select className="form-input" value={runMonth} onChange={e => setRunMonth(+e.target.value)} style={{ padding: "12px 14px", borderRadius: 8 }}>
                                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Year</label>
                                <select className="form-input" value={runYear} onChange={e => setRunYear(+e.target.value)} style={{ padding: "12px 14px", borderRadius: 8 }}>
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ background: "#EEF2FF", borderRadius: 16, padding: "20px 24px", marginBottom: 32, fontSize: 13 }}>
                            <div style={{ fontWeight: 800, color: "#4F46E5", marginBottom: 16, fontSize: 14 }}>Payroll will automatically calculate:</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, color: "#475569", lineHeight: 1.4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>✅ <span>PF ({complianceSettings?.pf?.employeeContribution || 12}% employee)</span></div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>✅ <span>ESI ({complianceSettings?.esi?.employeeContribution || 0.75}%)</span></div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>✅ <span>Professional Tax (state-wise)</span></div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>✅ <span>TDS (as per tax regime)</span></div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>✅ <span>Attendance-based pro-rata</span></div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>✅ <span>RazorpayX payout-ready</span></div>
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                            <button className="btn btn-secondary" onClick={() => setRunModal(false)} disabled={running}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleRun} disabled={running} style={{ minWidth: 160 }}>
                                {running ? <><FiClock className="spin" /> Processing…</> : <><FiPlay size={14} /> Process Payroll</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payslip Modal */}
            {payslipData && <PayslipModal data={payslipData} onClose={() => setPayslipData(null)} />}

            {toast && (
                <div style={{ position: "fixed", bottom: 24, right: 24, background: "#059669", color: "#fff", padding: "12px 20px", borderRadius: 12, zIndex: 3000, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    <FiCheckCircle size={18} /> {toast}
                </div>
            )}
        </>
    );
}
