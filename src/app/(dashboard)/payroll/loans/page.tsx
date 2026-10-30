"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import ErrorState from "@/components/common/ErrorState";
import { settleAll, unwrap, type FetchError } from "@/lib/fetchError";
import { useToast } from "@/components/common/DialogProvider";
import { FiPlus, FiX, FiDollarSign, FiCheckCircle, FiTrash2 } from "react-icons/fi";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n: any) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

type Loan = {
    _id: string;
    employee?: { _id: string; firstName?: string; lastName?: string; employeeId?: string };
    type: "loan" | "advance";
    principal: number;
    emiAmount: number;
    balance: number;
    startMonth: number;
    startYear: number;
    status: "active" | "closed";
    notes?: string;
    repayments?: { month: number; year: number; amount: number }[];
};

const blank = () => {
    const d = new Date();
    return { employee: "", type: "loan", principal: "", emiAmount: "", startMonth: d.getMonth() + 1, startYear: d.getFullYear(), notes: "" };
};

export default function LoansPage() {
    const toast = useToast();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<FetchError[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>(blank());
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<"active" | "closed" | "all">("active");

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { results, errors: errs } = await settleAll([
            axiosInstance.get(API_ENDPOINTS.LOANS),
            axiosInstance.get(API_ENDPOINTS.PAYOUTS_EMPLOYEES),
        ]);
        setLoans(unwrap<Loan[]>(results[0], []));
        setEmployees(unwrap<any[]>(results[1], []));
        setErrors(errs);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.LOANS, {
                ...form,
                principal: Number(form.principal),
                emiAmount: Number(form.emiAmount),
            });
            toast.success("Loan created — EMIs are deducted from payroll runs and recovered once each run is paid");
            setShowForm(false);
            setForm(blank());
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not create the loan");
        } finally { setSaving(false); }
    };

    const close = async (loan: Loan) => {
        try {
            await axiosInstance.put(`${API_ENDPOINTS.LOANS}/${loan._id}`, { status: "closed" });
            toast.success("Loan closed");
            fetchData();
        } catch (err: any) { toast.error(err.response?.data?.message || "Could not close the loan"); }
    };

    const remove = async (loan: Loan) => {
        try {
            await axiosInstance.delete(`${API_ENDPOINTS.LOANS}/${loan._id}`);
            toast.success("Loan deleted");
            fetchData();
        } catch (err: any) { toast.error(err.response?.data?.message || "Could not delete the loan"); }
    };

    const shown = loans.filter(l => filter === "all" || l.status === filter);
    const outstanding = loans.filter(l => l.status === "active").reduce((t, l) => t + (l.balance || 0), 0);
    const monthlyEmi = loans.filter(l => l.status === "active").reduce((t, l) => t + Math.min(l.emiAmount || 0, l.balance || 0), 0);

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E1B4B", margin: 0 }}>Loans &amp; Advances</h1>
                    <p style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>
                        EMIs are deducted in each payroll run; the balance falls only when that run is paid.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}><FiPlus size={14} /> New Loan</button>
            </div>

            <ErrorState errors={errors} onRetry={fetchData} title="Loans could not be loaded" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                    { label: "Active loans", value: loans.filter(l => l.status === "active").length, color: "#6366F1", bg: "#EEF2FF" },
                    { label: "Outstanding balance", value: fmt(outstanding), color: "#F59E0B", bg: "#FEF3C7" },
                    { label: "Next month's EMIs", value: fmt(monthlyEmi), color: "#10B981", bg: "#D1FAE5" },
                ].map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: `1px solid ${s.bg}` }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8EAFF", overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 8 }}>
                    {(["active", "closed", "all"] as const).map(f => (
                        <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(f)}>
                            {f[0].toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th><th>Type</th><th>Principal</th><th>EMI</th><th>Balance</th>
                                <th>Starts</th><th>Recovered</th><th>Status</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Loading…</td></tr>
                            ) : shown.length === 0 ? (
                                <tr><td colSpan={9} style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>
                                    <FiDollarSign size={28} style={{ opacity: 0.4 }} /><div>No {filter === "all" ? "" : filter} loans</div>
                                </td></tr>
                            ) : shown.map(l => (
                                <tr key={l._id}>
                                    <td style={{ fontWeight: 600 }}>
                                        {l.employee?.firstName} {l.employee?.lastName}
                                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{l.employee?.employeeId}</div>
                                    </td>
                                    <td style={{ textTransform: "capitalize" }}>{l.type}</td>
                                    <td style={{ fontFamily: "monospace" }}>{fmt(l.principal)}</td>
                                    <td style={{ fontFamily: "monospace" }}>{fmt(l.emiAmount)}</td>
                                    <td style={{ fontFamily: "monospace", fontWeight: 800, color: "#6366F1" }}>{fmt(l.balance)}</td>
                                    <td>{MONTHS[l.startMonth - 1]} {l.startYear}</td>
                                    <td>{l.repayments?.length || 0} EMI(s)</td>
                                    <td>
                                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: l.status === "active" ? "#EEF2FF" : "#D1FAE5", color: l.status === "active" ? "#6366F1" : "#059669" }}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                        {l.status === "active" && (
                                            <button className="btn btn-secondary btn-sm" title="Close early" onClick={() => close(l)}><FiCheckCircle size={13} /> Close</button>
                                        )}
                                        {!l.repayments?.length && (
                                            <button className="btn btn-secondary btn-sm" title="Delete" onClick={() => remove(l)} style={{ marginLeft: 6 }}><FiTrash2 size={13} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card" style={{ width: "100%", maxWidth: 480, padding: 28 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>New Loan / Advance</h2>
                            <button className="btn btn-secondary" style={{ padding: 8 }} onClick={() => setShowForm(false)}><FiX /></button>
                        </div>
                        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <label style={{ fontSize: 12, fontWeight: 700 }}>Employee
                                <select className="form-input" required value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })}>
                                    <option value="">Select…</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} {emp.employeeId ? `(${emp.employeeId})` : ""}</option>
                                    ))}
                                </select>
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <label style={{ fontSize: 12, fontWeight: 700 }}>Type
                                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="loan">Loan</option>
                                        <option value="advance">Salary advance</option>
                                    </select>
                                </label>
                                <label style={{ fontSize: 12, fontWeight: 700 }}>Principal (₹)
                                    <input className="form-input" type="number" min={1} required value={form.principal} onChange={e => setForm({ ...form, principal: e.target.value })} />
                                </label>
                                <label style={{ fontSize: 12, fontWeight: 700 }}>Monthly EMI (₹)
                                    <input className="form-input" type="number" min={1} required value={form.emiAmount} onChange={e => setForm({ ...form, emiAmount: e.target.value })} />
                                </label>
                                <label style={{ fontSize: 12, fontWeight: 700 }}>First deduction
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <select className="form-input" value={form.startMonth} onChange={e => setForm({ ...form, startMonth: Number(e.target.value) })}>
                                            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                        </select>
                                        <input className="form-input" type="number" style={{ width: 90 }} value={form.startYear} onChange={e => setForm({ ...form, startYear: Number(e.target.value) })} />
                                    </div>
                                </label>
                            </div>
                            <label style={{ fontSize: 12, fontWeight: 700 }}>Notes
                                <input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </label>
                            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>{saving ? "Saving…" : "Create"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
