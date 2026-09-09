"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { FiDollarSign, FiTrendingUp, FiAlertCircle, FiClock, FiPlus, FiRefreshCw } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { settleAll, unwrap, describeError, type FetchError } from "@/lib/fetchError";
import { useToast } from "@/components/common/DialogProvider";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
    Draft: { bg: "#F1F5F9", fg: "#64748B" },
    Sent: { bg: "#EEF2FF", fg: "#4338CA" },
    "Partially Paid": { bg: "#FEF3C7", fg: "#B45309" },
    Paid: { bg: "#D1FAE5", fg: "#047857" },
    Overdue: { bg: "#FEE2E2", fg: "#B91C1C" },
    Cancelled: { bg: "#F1F5F9", fg: "#94A3B8" },
};

const EMPTY_INVOICE = { invoiceNumber: "", client: "", subtotal: "", taxRate: "18", issueDate: "", dueDate: "", notes: "" };

export default function RevenuePage() {
    const toast = useToast();
    const [summary, setSummary] = useState<any>(null);
    const [byProject, setByProject] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<FetchError[]>([]);

    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [form, setForm] = useState<any>(EMPTY_INVOICE);
    const [saving, setSaving] = useState(false);

    const [payingInvoice, setPayingInvoice] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState("");

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const { results, errors: errs } = await settleAll([
            axiosInstance.get(API_ENDPOINTS.REVENUE_SUMMARY),
            axiosInstance.get(API_ENDPOINTS.REVENUE_BY_PROJECT),
            axiosInstance.get(API_ENDPOINTS.INVOICES),
        ]);
        const [sumRes, projRes, invRes] = results;
        setSummary(unwrap(sumRes, null));
        setByProject(unwrap<any[]>(projRes, []));
        setInvoices(unwrap<any[]>(invRes, []));
        setErrors(errs);
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleCreate = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.INVOICES, {
                ...form,
                subtotal: Number(form.subtotal) || 0,
                taxRate: Number(form.taxRate) || 0,
                issueDate: form.issueDate || new Date().toISOString(),
                dueDate: form.dueDate || undefined,
                status: "Sent",
            });
            toast.success("Invoice created");
            setShowInvoiceModal(false);
            setForm(EMPTY_INVOICE);
            fetchAll();
        } catch (err) {
            toast.error(describeError(err).message);
        } finally {
            setSaving(false);
        }
    };

    const handleRecordPayment = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.INVOICE_PAYMENTS(payingInvoice._id), {
                amount: Number(paymentAmount),
            });
            toast.success("Payment recorded");
            setPayingInvoice(null);
            setPaymentAmount("");
            fetchAll();
        } catch (err) {
            toast.error(describeError(err).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>Loading...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const maxMonthly = Math.max(1, ...(summary?.monthly || []).map((m: any) => Math.max(m.invoiced, m.collected)));

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Revenue</h1>
                    <p className="page-subtitle">
                        Invoiced and collected revenue{summary?.year ? ` for ${summary.year}` : ""} — {invoices.length} invoice{invoices.length === 1 ? "" : "s"}.
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-secondary" onClick={fetchAll}><FiRefreshCw /> Refresh</button>
                    <button className="btn btn-primary" onClick={() => setShowInvoiceModal(true)}><FiPlus /> New Invoice</button>
                </div>
            </div>

            <ErrorState errors={errors} onRetry={fetchAll} title="Revenue data could not be loaded" />

            {/* Headline figures. Draft invoices are deliberately excluded — they are not revenue. */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                <StatCard label="Total Invoiced" val={fmt(summary?.totalInvoiced)} icon={FiDollarSign} color="#6366F1" />
                <StatCard label="Collected" val={fmt(summary?.totalCollected)} icon={FiTrendingUp} color="#10B981" />
                <StatCard label="Outstanding" val={fmt(summary?.totalOutstanding)} icon={FiClock} color="#F59E0B" />
                <StatCard label="Overdue" val={fmt(summary?.totalOverdue)} icon={FiAlertCircle} color="#EF4444"
                    sub={summary?.overdueCount ? `${summary.overdueCount} invoice(s)` : undefined} />
            </div>

            {invoices.length === 0 && errors.length === 0 ? (
                <EmptyState
                    title="No invoices yet"
                    description="Revenue is calculated from invoices you raise. Create your first invoice to start tracking earnings."
                    icon={FiDollarSign}
                    actionLabel="New Invoice"
                    onAction={() => setShowInvoiceModal(true)}
                />
            ) : (
                <>
                    {/* Monthly trend */}
                    {summary?.monthly && (
                        <div className="card" style={{ marginBottom: 24 }}>
                            <div className="card-header">
                                <h3 className="card-title">Monthly Trend — {summary.year}</h3>
                                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#6366F1", marginRight: 6 }} />Invoiced</span>
                                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#10B981", marginRight: 6 }} />Collected</span>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "24px", height: 200 }}>
                                {summary.monthly.map((m: any) => (
                                    <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140, width: "100%", justifyContent: "center" }}>
                                            <div title={`Invoiced ${fmt(m.invoiced)}`} style={{ width: "40%", background: "#6366F1", borderRadius: "4px 4px 0 0", height: `${(m.invoiced / maxMonthly) * 100}%`, minHeight: m.invoiced > 0 ? 3 : 0 }} />
                                            <div title={`Collected ${fmt(m.collected)}`} style={{ width: "40%", background: "#10B981", borderRadius: "4px 4px 0 0", height: `${(m.collected / maxMonthly) * 100}%`, minHeight: m.collected > 0 ? 3 : 0 }} />
                                        </div>
                                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{MONTHS[m.month - 1]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Invoices */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="card-header"><h3 className="card-title">Invoices</h3></div>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Invoice #</th><th>Client</th><th>Project</th><th>Issued</th>
                                        <th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((inv: any) => {
                                        const paid = (inv.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
                                        const due = Math.max(0, (inv.total || 0) - paid);
                                        const c = STATUS_COLORS[inv.status] || STATUS_COLORS.Draft;
                                        return (
                                            <tr key={inv._id}>
                                                <td style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>{inv.invoiceNumber}</td>
                                                <td>{inv.client}</td>
                                                <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{inv.project?.name || "—"}</td>
                                                <td style={{ fontSize: 13 }}>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "—"}</td>
                                                <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                                                <td style={{ color: "#047857", fontWeight: 600 }}>{fmt(paid)}</td>
                                                <td style={{ color: due > 0 ? "#B45309" : "var(--text-muted)", fontWeight: 600 }}>{fmt(due)}</td>
                                                <td>
                                                    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg }}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    {due > 0 && inv.status !== "Cancelled" && (
                                                        <button className="btn btn-secondary btn-sm" onClick={() => { setPayingInvoice(inv); setPaymentAmount(String(due)); }}>
                                                            Record Payment
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Revenue against project budgets — the honest version of what this page used to show. */}
                    {byProject.length > 0 && (
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">Revenue by Project</h3></div>
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr><th>Project</th><th>Client</th><th>Budget</th><th>Invoiced</th><th>Collected</th><th>Invoices</th></tr>
                                    </thead>
                                    <tbody>
                                        {byProject.map((r: any, i: number) => (
                                            <tr key={r.projectId || i}>
                                                <td style={{ fontWeight: 600 }}>{r.projectName}</td>
                                                <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.client}</td>
                                                <td style={{ fontSize: 13 }}>{fmt(r.budget)}</td>
                                                <td style={{ fontWeight: 700 }}>{fmt(r.invoiced)}</td>
                                                <td style={{ color: "#047857", fontWeight: 600 }}>{fmt(r.collected)}</td>
                                                <td style={{ fontSize: 13 }}>{r.invoiceCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {showInvoiceModal && (
                <Modal title="New Invoice" onClose={() => setShowInvoiceModal(false)}>
                    <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <Field label="Invoice Number" required value={form.invoiceNumber} onChange={(v: string) => setForm({ ...form, invoiceNumber: v })} placeholder="INV-001" />
                        <Field label="Client" required value={form.client} onChange={(v: string) => setForm({ ...form, client: v })} placeholder="Acme Pvt Ltd" />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Field label="Subtotal (₹)" required type="number" value={form.subtotal} onChange={(v: string) => setForm({ ...form, subtotal: v })} />
                            <Field label="GST %" type="number" value={form.taxRate} onChange={(v: string) => setForm({ ...form, taxRate: v })} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Field label="Issue Date" type="date" value={form.issueDate} onChange={(v: string) => setForm({ ...form, issueDate: v })} />
                            <Field label="Due Date" type="date" value={form.dueDate} onChange={(v: string) => setForm({ ...form, dueDate: v })} />
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                            Total incl. tax: <strong>{fmt(Math.round((Number(form.subtotal) || 0) * (1 + (Number(form.taxRate) || 0) / 100)))}</strong>
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Create Invoice"}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {payingInvoice && (
                <Modal title={`Record Payment — ${payingInvoice.invoiceNumber}`} onClose={() => setPayingInvoice(null)}>
                    <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <Field label="Amount (₹)" required type="number" value={paymentAmount} onChange={setPaymentAmount} />
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setPayingInvoice(null)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Record Payment"}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}

function StatCard({ label, val, icon: Icon, color, sub }: any) {
    return (
        <div className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                <div style={{ fontSize: "24px", fontWeight: 900, marginTop: "4px" }}>{val}</div>
                {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
            </div>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}15`, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} />
            </div>
        </div>
    );
}

function Modal({ title, children, onClose }: any) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
                <div className="card-header"><h3 className="card-title">{title}</h3></div>
                <div style={{ padding: 24 }}>{children}</div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", required, placeholder }: any) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{label}{required && " *"}</span>
            <input className="form-input" type={type} value={value} required={required} placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)} />
        </label>
    );
}
