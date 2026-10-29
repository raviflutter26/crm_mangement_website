"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiCheck, FiPlay, FiRefreshCw, FiSlash, FiDollarSign } from "react-icons/fi";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { useConfirm, useToast } from "@/components/common/DialogProvider";
import { describeError, type FetchError } from "@/lib/fetchError";
import { Field, Modal, PageHeader, Stat, StatGrid, StatusPill, fmtDate, inr } from "@/page_components/superadmin/ui";

interface Revenue {
    mrr: number; arr: number; collected: number;
    outstanding: { total: number; count: number };
    subscriptions: Record<string, number>;
    byPlan: { plan: string; subscriptions: number; seats: number; mrr: number }[];
}
interface Invoice {
    _id: string; invoiceNumber: string; organizationId?: { _id: string; name: string } | null; periodStart: string; periodEnd: string;
    seats: number; subtotal: number; gstAmount: number; total: number; status: string; dueDate: string; paidAt?: string; paymentReference?: string;
}

export default function PlatformRevenuePage() {
    const toast = useToast();
    const confirm = useConfirm();
    const [rev, setRev] = useState<Revenue | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [orgs, setOrgs] = useState<{ organizationId: string; organization: string }[]>([]);
    const [filters, setFilters] = useState({ status: "", organizationId: "", from: "", to: "", overdue: false });
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<FetchError[]>([]);
    const [paying, setPaying] = useState<Invoice | null>(null);
    const [payForm, setPayForm] = useState({ reference: "", paidAt: "", note: "" });
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const params: Record<string, string> = {};
        if (filters.status) params.status = filters.status;
        if (filters.organizationId) params.organizationId = filters.organizationId;
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        if (filters.overdue) params.overdue = "true";
        const [r, i, s] = await Promise.allSettled([
            axiosInstance.get("/api/billing/revenue"),
            axiosInstance.get("/api/billing/invoices", { params: { ...params, limit: 200 } }),
            axiosInstance.get("/api/billing/subscriptions"),
        ]);
        const errs: FetchError[] = [];
        if (r.status === "fulfilled") setRev(r.value.data.data); else errs.push(describeError(r.reason));
        if (i.status === "fulfilled") setInvoices(i.value.data.data || []); else errs.push(describeError(i.reason));
        if (s.status === "fulfilled") setOrgs(s.value.data.data || []);
        setErrors(errs);
        setLoading(false);
    }, [filters]);

    useEffect(() => { load(); }, [load]);

    const runBilling = async () => {
        setBusy(true);
        try {
            const res = await axiosInstance.post("/api/billing/invoices/run");
            const d = res.data.data;
            toast.success(`Billing run: ${d.invoicesCreated} invoice(s) raised, ${d.flaggedPastDue} flagged past due.`);
            await load();
        } catch (err) {
            toast.error(describeError(err).message);
        } finally {
            setBusy(false);
        }
    };

    const markPaid = async () => {
        if (!paying) return;
        if (!payForm.reference.trim()) { toast.error("Enter the payment reference (UTR, cheque no., etc.)."); return; }
        setBusy(true);
        try {
            await axiosInstance.post(`/api/billing/invoices/${paying._id}/mark-paid`, {
                reference: payForm.reference, paidAt: payForm.paidAt || undefined, note: payForm.note || undefined,
            });
            toast.success(`${paying.invoiceNumber} marked paid.`);
            setPaying(null);
            await load();
        } catch (err) {
            toast.error(describeError(err).message);
        } finally {
            setBusy(false);
        }
    };

    const voidInv = async (inv: Invoice) => {
        const ok = await confirm({ title: `Void ${inv.invoiceNumber}?`, description: "A void invoice is no longer owed and cannot be paid.", confirmLabel: "Void invoice", danger: true });
        if (!ok) return;
        try {
            await axiosInstance.post(`/api/billing/invoices/${inv._id}/void`, { reason: "Voided by platform admin" });
            toast.success("Invoice voided.");
            await load();
        } catch (err) {
            toast.error(describeError(err).message);
        }
    };

    const exportCsv = () => {
        const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const head = ["Invoice", "Organization", "Period start", "Period end", "Seats", "Subtotal", "GST", "Total", "Status", "Due", "Paid at", "Reference"];
        const rows = invoices.map(i => [i.invoiceNumber, i.organizationId?.name, fmtDate(i.periodStart), fmtDate(i.periodEnd), i.seats, i.subtotal, i.gstAmount, i.total, i.status, fmtDate(i.dueDate), fmtDate(i.paidAt), i.paymentReference]);
        const csv = [head, ...rows].map(r => r.map(esc).join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `platform-invoices-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading && !rev) return <div style={{ padding: "40px" }}><LoadingSkeleton /></div>;

    const now = Date.now();

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingBottom: "40px" }}>
            <PageHeader
                title="Platform Revenue"
                subtitle="MRR and ARR from active subscriptions; invoices raised per billing period with 18% GST, settled manually."
                actions={<>
                    <button className="btn btn-secondary" onClick={load}><FiRefreshCw /> Refresh</button>
                    {invoices.length > 0 && <button className="btn btn-secondary" onClick={exportCsv}>Export CSV</button>}
                    <button className="btn btn-primary" onClick={runBilling} disabled={busy}><FiPlay /> Run billing now</button>
                </>}
            />
            <ErrorState errors={errors} onRetry={load} />

            {rev && (
                <StatGrid>
                    <Stat label="MRR" value={inr(rev.mrr)} sub={`${rev.subscriptions.active || 0} active subscription(s)`} tone="primary" />
                    <Stat label="ARR" value={inr(rev.arr)} sub="MRR × 12" tone="success" />
                    <Stat label="Outstanding" value={inr(rev.outstanding.total)} sub={`${rev.outstanding.count} issued, unpaid`} tone="warning" />
                    <Stat label="Collected" value={inr(rev.collected)} sub="All paid invoices" tone="success" />
                    <Stat label="Past due" value={rev.subscriptions.past_due || 0} sub={`Trial ${rev.subscriptions.trial || 0} · Cancelled ${rev.subscriptions.cancelled || 0}`} tone="error" />
                </StatGrid>
            )}

            {rev && rev.byPlan.length > 0 && (
                <div className="card" style={{ marginBottom: "24px" }}><div className="table-wrapper"><table>
                    <thead><tr><th>Plan</th><th>Active subscriptions</th><th>Seats</th><th>MRR</th></tr></thead>
                    <tbody>{rev.byPlan.map(p => (
                        <tr key={p.plan}><td style={{ fontWeight: 600 }}>{p.plan}</td><td>{p.subscriptions}</td><td>{p.seats}</td><td>{inr(p.mrr)}</td></tr>
                    ))}</tbody>
                </table></div></div>
            )}

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "12px" }}>
                <Field label="Status">
                    <select className="form-input" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, overdue: false })}>
                        <option value="">All</option><option value="issued">Issued</option><option value="paid">Paid</option><option value="void">Void</option><option value="draft">Draft</option>
                    </select>
                </Field>
                <Field label="Organization">
                    <select className="form-input" value={filters.organizationId} onChange={e => setFilters({ ...filters, organizationId: e.target.value })}>
                        <option value="">All</option>
                        {orgs.map(o => <option key={o.organizationId} value={o.organizationId}>{o.organization}</option>)}
                    </select>
                </Field>
                <Field label="Period from"><input className="form-input" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} /></Field>
                <Field label="Period to"><input className="form-input" type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} /></Field>
                <label style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "13px", marginBottom: "14px" }}>
                    <input type="checkbox" checked={filters.overdue} onChange={e => setFilters({ ...filters, overdue: e.target.checked })} /> Overdue only
                </label>
            </div>

            {invoices.length === 0 ? (
                <EmptyState title="No invoices" description="Nothing matches these filters. Invoices are raised by the daily billing run, or with “Run billing now”." icon={FiDollarSign} />
            ) : (
                <div className="card"><div className="table-wrapper"><table>
                    <thead><tr><th>Invoice</th><th>Organization</th><th>Period</th><th>Seats</th><th>Subtotal</th><th>GST 18%</th><th>Total</th><th>Status</th><th>Due</th><th></th></tr></thead>
                    <tbody>{invoices.map(i => {
                        const overdue = i.status === "issued" && new Date(i.dueDate).getTime() < now;
                        return (
                            <tr key={i._id}>
                                <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{i.invoiceNumber}</td>
                                <td>{i.organizationId?.name || "—"}</td>
                                <td style={{ fontSize: "12px" }}>{fmtDate(i.periodStart)} – {fmtDate(i.periodEnd)}</td>
                                <td>{i.seats}</td>
                                <td>{inr(i.subtotal)}</td>
                                <td>{inr(i.gstAmount)}</td>
                                <td style={{ fontWeight: 700 }}>{inr(i.total)}</td>
                                <td><StatusPill status={i.status} />{i.status === "paid" && i.paymentReference && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{i.paymentReference}</div>}</td>
                                <td style={{ color: overdue ? "var(--error)" : undefined, fontSize: "12px" }}>{fmtDate(i.dueDate)}{overdue ? " · overdue" : ""}</td>
                                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                    {i.status === "issued" && <>
                                        <button className="btn btn-primary btn-sm" style={{ marginRight: "6px" }} onClick={() => { setPaying(i); setPayForm({ reference: "", paidAt: "", note: "" }); }}><FiCheck /> Mark paid</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => voidInv(i)}><FiSlash /> Void</button>
                                    </>}
                                </td>
                            </tr>
                        );
                    })}</tbody>
                </table></div></div>
            )}

            {paying && (
                <Modal title={`Record payment — ${paying.invoiceNumber}`} onClose={() => setPaying(null)} footer={<>
                    <button className="btn btn-secondary" onClick={() => setPaying(null)}>Close</button>
                    <button className="btn btn-primary" onClick={markPaid} disabled={busy}>{busy ? "Saving..." : `Mark ${inr(paying.total)} paid`}</button>
                </>}>
                    <Field label="Payment reference" hint="UTR / NEFT / cheque number — required.">
                        <input className="form-input" value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} />
                    </Field>
                    <Field label="Paid on"><input className="form-input" type="date" value={payForm.paidAt} onChange={e => setPayForm({ ...payForm, paidAt: e.target.value })} /></Field>
                    <Field label="Note"><textarea className="form-input" rows={2} value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} /></Field>
                </Modal>
            )}
        </div>
    );
}
