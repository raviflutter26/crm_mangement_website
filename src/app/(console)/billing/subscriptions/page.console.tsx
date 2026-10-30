"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiEdit2, FiRefreshCw, FiXCircle, FiPackage } from "react-icons/fi";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { useConfirm, useToast } from "@/components/common/DialogProvider";
import { describeError, type FetchError } from "@/lib/fetchError";
import { Field, Modal, PageHeader, StatusPill, fmtDate, inr } from "@/components/common/ui";

interface Plan {
    key: string; name: string; pricePerEmployee: number; seatLimit: number; annualDiscountPct: number; isActive: boolean; features?: string[];
}
interface SubRow {
    organizationId: string; organization: string; plan: Plan | null; billingCycle: "monthly" | "annual"; seats: number; seatsUsed: number;
    status: string; currentPeriodStart: string; currentPeriodEnd: string; trialEndsAt?: string | null; periodAmount: number | null; mrr: number;
}

export default function SubscriptionsPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subs, setSubs] = useState<SubRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<FetchError[]>([]);
    const [statusFilter, setStatusFilter] = useState("");

    const [editing, setEditing] = useState<SubRow | null>(null);
    const [form, setForm] = useState({ planKey: "", seats: "", billingCycle: "monthly", status: "active" });
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [planForm, setPlanForm] = useState({ name: "", pricePerEmployee: "", seatLimit: "", annualDiscountPct: "", isActive: true });
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const errs: FetchError[] = [];
        const [p, s] = await Promise.allSettled([
            axiosInstance.get("/api/billing/plans", { params: { all: "true" } }),
            axiosInstance.get("/api/billing/subscriptions", { params: statusFilter ? { status: statusFilter } : {} }),
        ]);
        if (p.status === "fulfilled") setPlans(p.value.data.data || []); else errs.push(describeError(p.reason));
        if (s.status === "fulfilled") setSubs(s.value.data.data || []); else errs.push(describeError(s.reason));
        setErrors(errs);
        setLoading(false);
    }, [statusFilter]);

    useEffect(() => { load(); }, [load]);

    const openEdit = (row: SubRow) => {
        setEditing(row);
        setForm({ planKey: row.plan?.key || "", seats: String(row.seats), billingCycle: row.billingCycle, status: row.status });
    };

    const saveSub = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            await axiosInstance.patch(`/api/billing/subscriptions/${editing.organizationId}`, {
                planKey: form.planKey, seats: Number(form.seats), billingCycle: form.billingCycle, status: form.status,
            });
            toast.success(`Subscription for ${editing.organization} updated.`);
            setEditing(null);
            await load();
        } catch (err) {
            toast.error(describeError(err).message);
        } finally {
            setSaving(false);
        }
    };

    const cancelSub = async (row: SubRow) => {
        const ok = await confirm({
            title: `Cancel ${row.organization}'s subscription?`,
            description: "No further invoices will be raised. The organization is not suspended — do that separately if needed.",
            confirmLabel: "Cancel subscription", danger: true,
        });
        if (!ok) return;
        try {
            await axiosInstance.post(`/api/billing/subscriptions/${row.organizationId}/cancel`, { reason: "Cancelled by platform admin" });
            toast.success("Subscription cancelled.");
            await load();
        } catch (err) {
            toast.error(describeError(err).message);
        }
    };

    const openPlan = (p: Plan) => {
        setEditingPlan(p);
        setPlanForm({ name: p.name, pricePerEmployee: String(p.pricePerEmployee), seatLimit: String(p.seatLimit), annualDiscountPct: String(p.annualDiscountPct), isActive: p.isActive });
    };

    const savePlan = async () => {
        if (!editingPlan) return;
        setSaving(true);
        try {
            await axiosInstance.put(`/api/billing/plans/${editingPlan.key}`, {
                name: planForm.name, pricePerEmployee: Number(planForm.pricePerEmployee), seatLimit: Number(planForm.seatLimit),
                annualDiscountPct: Number(planForm.annualDiscountPct), isActive: planForm.isActive,
            });
            toast.success(`${planForm.name} plan saved.`);
            setEditingPlan(null);
            await load();
        } catch (err) {
            toast.error(describeError(err).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading && subs.length === 0 && plans.length === 0) return <div style={{ padding: "40px" }}><LoadingSkeleton /></div>;

    const selectedPlan = plans.find(p => p.key === form.planKey);

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingBottom: "40px" }}>
            <PageHeader
                title="Subscriptions"
                subtitle="Plan catalogue and every organization's subscription. Billing is manual: invoices are raised here and settled offline."
                actions={<button className="btn btn-secondary" onClick={load}><FiRefreshCw /> Refresh</button>}
            />
            <ErrorState errors={errors} onRetry={load} />

            <h2 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", margin: "8px 0 12px" }}>Plan catalogue</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                {plans.map(p => (
                    <div key={p.key} className="card" style={{ padding: "20px", opacity: p.isActive ? 1 : 0.6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>{p.name}</div>
                            <button className="btn btn-secondary btn-sm" onClick={() => openPlan(p)} aria-label={`Edit ${p.name} plan`}><FiEdit2 /> Edit</button>
                        </div>
                        <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "8px", color: "var(--text-primary)" }}>{inr(p.pricePerEmployee)}<span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}> / employee / month</span></div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>Up to {p.seatLimit.toLocaleString()} seats · annual −{p.annualDiscountPct}%{p.isActive ? "" : " · inactive"}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 12px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>Organizations ({subs.length})</h2>
                <select className="form-input" style={{ maxWidth: "180px" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
                    <option value="">All statuses</option>
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past due</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {subs.length === 0 ? (
                <EmptyState title="No subscriptions" description="No organization matches this filter." icon={FiPackage} />
            ) : (
                <div className="card"><div className="table-wrapper"><table>
                    <thead><tr>
                        <th>Organization</th><th>Plan</th><th>Cycle</th><th>Seats (used / limit)</th><th>Status</th><th>Current period</th><th>Per period</th><th>MRR</th><th></th>
                    </tr></thead>
                    <tbody>
                        {subs.map(r => (
                            <tr key={r.organizationId}>
                                <td style={{ fontWeight: 600 }}>{r.organization}</td>
                                <td>{r.plan?.name || "—"}</td>
                                <td style={{ textTransform: "capitalize" }}>{r.billingCycle}</td>
                                <td style={{ color: r.seatsUsed > r.seats ? "var(--error)" : undefined }}>{r.seatsUsed} / {r.seats}</td>
                                <td><StatusPill status={r.status} /></td>
                                <td style={{ fontSize: "12px" }}>{fmtDate(r.currentPeriodStart)} – {fmtDate(r.currentPeriodEnd)}</td>
                                <td>{inr(r.periodAmount)}</td>
                                <td>{inr(r.mrr)}</td>
                                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)} style={{ marginRight: "6px" }}><FiEdit2 /> Change</button>
                                    {r.status !== "cancelled" && (
                                        <button className="btn btn-secondary btn-sm" onClick={() => cancelSub(r)} style={{ color: "var(--error)" }}><FiXCircle /> Cancel</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table></div></div>
            )}

            {editing && (
                <Modal title={`Change ${editing.organization}`} onClose={() => setEditing(null)} footer={<>
                    <button className="btn btn-secondary" onClick={() => setEditing(null)}>Close</button>
                    <button className="btn btn-primary" onClick={saveSub} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                </>}>
                    <Field label="Plan">
                        <select className="form-input" value={form.planKey} onChange={e => setForm({ ...form, planKey: e.target.value })}>
                            {plans.filter(p => p.isActive || p.key === form.planKey).map(p => <option key={p.key} value={p.key}>{p.name} — {inr(p.pricePerEmployee)}/employee</option>)}
                        </select>
                    </Field>
                    <Field label="Seats" hint={`${editing.seatsUsed} in use${selectedPlan ? ` · plan allows up to ${selectedPlan.seatLimit}` : ""}. Also sets the organization's employee limit.`}>
                        <input className="form-input" type="number" min={1} value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} />
                    </Field>
                    <Field label="Billing cycle">
                        <select className="form-input" value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })}>
                            <option value="monthly">Monthly</option>
                            <option value="annual">Annual{selectedPlan ? ` (−${selectedPlan.annualDiscountPct}%)` : ""}</option>
                        </select>
                    </Field>
                    <Field label="Status" hint="past_due is normally set by the billing run; it never suspends the organization.">
                        <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                            <option value="trial">Trial</option>
                            <option value="active">Active</option>
                            <option value="past_due">Past due</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </Field>
                </Modal>
            )}

            {editingPlan && (
                <Modal title={`Edit ${editingPlan.name} plan`} onClose={() => setEditingPlan(null)} footer={<>
                    <button className="btn btn-secondary" onClick={() => setEditingPlan(null)}>Close</button>
                    <button className="btn btn-primary" onClick={savePlan} disabled={saving}>{saving ? "Saving..." : "Save plan"}</button>
                </>}>
                    <Field label="Name"><input className="form-input" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} /></Field>
                    <Field label="Price per employee / month (₹, excl. GST)" hint="Applies to invoices raised from the next billing period.">
                        <input className="form-input" type="number" min={0} value={planForm.pricePerEmployee} onChange={e => setPlanForm({ ...planForm, pricePerEmployee: e.target.value })} />
                    </Field>
                    <Field label="Seat limit"><input className="form-input" type="number" min={1} value={planForm.seatLimit} onChange={e => setPlanForm({ ...planForm, seatLimit: e.target.value })} /></Field>
                    <Field label="Annual discount (%)"><input className="form-input" type="number" min={0} max={100} value={planForm.annualDiscountPct} onChange={e => setPlanForm({ ...planForm, annualDiscountPct: e.target.value })} /></Field>
                    <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px" }}>
                        <input type="checkbox" checked={planForm.isActive} onChange={e => setPlanForm({ ...planForm, isActive: e.target.checked })} /> Available for new subscriptions
                    </label>
                </Modal>
            )}
        </div>
    );
}
