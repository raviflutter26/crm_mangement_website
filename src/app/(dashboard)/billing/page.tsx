"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/lib/auth";
import { FiFileText, FiRefreshCw } from "react-icons/fi";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { describeError, type FetchError } from "@/lib/fetchError";
import { PageHeader, Stat, StatGrid, StatusPill, fmtDate, inr } from "@/page_components/superadmin/ui";

/**
 * The organization's own plan, seat usage and invoices. Read-only: plan and
 * seat changes are made by the platform team, and invoices are paid offline.
 */
export default function BillingPage() {
    const { user } = useAuth();
    const role = String(user?.role || "").toLowerCase();
    const allowed = role === "owner" || role === "admin";
    const [d, setD] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<FetchError[]>([]);

    const load = useCallback(async () => {
        if (!allowed) { setLoading(false); return; }
        setLoading(true);
        try {
            const res = await axiosInstance.get("/api/billing/me");
            setD(res.data.data);
            setErrors([]);
        } catch (err) {
            setErrors([describeError(err)]);
        } finally {
            setLoading(false);
        }
    }, [allowed]);

    useEffect(() => { load(); }, [load]);

    if (!allowed) {
        return (
            <div className="page-content">
                <PageHeader title="Billing" />
                <div role="alert" className="card" style={{ padding: "20px" }}>Only your organization's owner or admin can view billing.</div>
            </div>
        );
    }
    if (loading && !d) return <div style={{ padding: "40px" }}><LoadingSkeleton /></div>;

    const sub = d?.subscription;
    const plan = d?.plan;
    const pct = d && d.seatLimit ? Math.min(100, Math.round((d.seatsUsed / d.seatLimit) * 100)) : 0;

    return (
        <div className="page-content" style={{ paddingBottom: "40px" }}>
            <PageHeader
                title="Billing"
                subtitle="Your plan, seat usage and invoices. To change plan or seats, contact the RIVO team."
                actions={<button className="btn btn-secondary" onClick={load}><FiRefreshCw /> Refresh</button>}
            />
            <ErrorState errors={errors} onRetry={load} />
            {d && <>
                <StatGrid>
                    <Stat label="Plan" value={plan?.name || "—"} sub={plan ? `${inr(plan.pricePerEmployee)} per employee / month + GST` : undefined} />
                    <Stat label="Status" value={<StatusPill status={sub?.status} />} sub={sub?.status === "trial" && sub?.trialEndsAt ? `Trial ends ${fmtDate(sub.trialEndsAt)}` : `Billed ${sub?.billingCycle}`} tone="success" />
                    <Stat label="Seats" value={`${d.seatsUsed} / ${d.seatLimit}`} sub={`${pct}% used`} tone={d.seatsUsed > d.seatLimit ? "error" : "primary"} />
                    <Stat label="Current period" value={inr(sub?.periodAmount)} sub={`${fmtDate(sub?.currentPeriodStart)} – ${fmtDate(sub?.currentPeriodEnd)} · excl. GST`} />
                    <Stat label="Outstanding" value={inr(d.outstanding)} sub="Issued, not yet paid" tone={d.outstanding > 0 ? "warning" : "success"} />
                </StatGrid>

                {sub?.status === "past_due" && (
                    <div role="alert" className="card" style={{ padding: "14px 18px", marginBottom: "16px", borderLeft: "3px solid var(--error)", fontSize: "13px" }}>
                        An invoice is more than 15 days past its due date. Please arrange payment or contact the RIVO team.
                    </div>
                )}

                <h2 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 12px", color: "var(--text-primary)" }}>Invoices</h2>
                {d.invoices.length === 0 ? (
                    <EmptyState title="No invoices yet" description="Invoices appear here at the start of each billing period." icon={FiFileText} />
                ) : (
                    <div className="card"><div className="table-wrapper"><table>
                        <thead><tr><th>Invoice</th><th>Period</th><th>Seats</th><th>Subtotal</th><th>GST 18%</th><th>Total</th><th>Due</th><th>Status</th></tr></thead>
                        <tbody>{d.invoices.map((i: any) => (
                            <tr key={i._id}>
                                <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{i.invoiceNumber}</td>
                                <td style={{ fontSize: "12px" }}>{fmtDate(i.periodStart)} – {fmtDate(i.periodEnd)}</td>
                                <td>{i.seats}</td>
                                <td>{inr(i.subtotal)}</td>
                                <td>{inr(i.gstAmount)}</td>
                                <td style={{ fontWeight: 700 }}>{inr(i.total)}</td>
                                <td style={{ fontSize: "12px" }}>{fmtDate(i.dueDate)}</td>
                                <td><StatusPill status={i.status} />{i.status === "paid" && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Paid {fmtDate(i.paidAt)}</div>}</td>
                            </tr>
                        ))}</tbody>
                    </table></div></div>
                )}
            </>}
        </div>
    );
}
