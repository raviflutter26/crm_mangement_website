"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiRefreshCw } from "react-icons/fi";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import ErrorState from "@/components/common/ErrorState";
import { describeError, type FetchError } from "@/lib/fetchError";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { PageHeader, Stat, StatGrid, StatusPill, fmtDate, inr } from "@/components/common/ui";

interface Pending { leave: number; regularization: number; claims: number; total: number }
interface BranchRow {
    _id: string | null; name: string; code: string | null;
    headcount: number; presentToday: number; onLeaveToday: number;
    pendingApprovals: Pending;
    payroll: { status: string | null; runId: string | null; netPay: number };
}
interface OwnerDashboard {
    asOf: string; month: number; year: number;
    branches: BranchRow[];
    totals: { headcount: number; presentToday: number; onLeaveToday: number; pendingApprovals: Pending; payrollNetPay: number; branchCount: number; branchesWithRun: number };
    subscription: null | {
        plan: string | null; status: string; seatsUsed: number; seatLimit: number;
        trialEndsAt: string | null; readOnlyUntil: string | null;
        latestInvoice: null | { _id: string; number: string; status: string; amount: number; dueDate: string | null; createdAt: string };
    };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border, #E2E8F0)", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "12px", borderBottom: "1px solid var(--border-light, #F1F5F9)", fontSize: 14, whiteSpace: "nowrap" };
const num: React.CSSProperties = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };

/**
 * The company-wide view for the owner (and group-wide admins): every branch's
 * headcount, today's attendance and leave, pending approvals, this month's
 * payroll run, company totals and the subscription. Reads GET /api/dashboard/owner.
 */
export default function OwnerOverview() {
    const [data, setData] = useState<OwnerDashboard | null>(null);
    const [error, setError] = useState<FetchError | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD}/owner`);
            setData(res.data.data);
        } catch (err) {
            setError(describeError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading && !data) return <LoadingSkeleton />;
    if (error && !data) return <ErrorState errors={[error]} onRetry={load} title="The company overview could not be loaded" />;
    if (!data) return null;

    const { totals, branches, subscription: sub } = data;
    const period = `${MONTHS[data.month - 1] || data.month} ${data.year}`;
    const pendingDetail = (p: Pending) => `${p.leave} leave · ${p.regularization} regularization · ${p.claims} claims`;

    return (
        <div>
            <PageHeader
                title="Company overview"
                subtitle={`All branches as of ${new Date(data.asOf).toLocaleString()}`}
                actions={<button type="button" className="btn btn-secondary" onClick={load} disabled={loading}><FiRefreshCw /> Refresh</button>}
            />

            <StatGrid>
                <Stat label="Headcount" value={totals.headcount} sub={`${totals.branchCount} branch${totals.branchCount === 1 ? "" : "es"}`} />
                <Stat label="Present today" value={totals.presentToday} sub={totals.headcount ? `${Math.round((totals.presentToday / totals.headcount) * 100)}% of headcount` : undefined} tone="success" />
                <Stat label="On leave today" value={totals.onLeaveToday} tone="warning" />
                <Stat label="Pending approvals" value={totals.pendingApprovals.total} sub={pendingDetail(totals.pendingApprovals)} tone="danger" />
                <Stat label={`Net pay · ${period}`} value={inr(totals.payrollNetPay)} sub={`${totals.branchesWithRun} of ${totals.branchCount} branches have a run`} />
            </StatGrid>

            <div className="card" style={{ marginTop: 24, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Branches</h2>
                    <Link href="/branches" style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>Manage branches →</Link>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={th}>Branch</th>
                                <th style={{ ...th, textAlign: "right" }}>Headcount</th>
                                <th style={{ ...th, textAlign: "right" }}>Present</th>
                                <th style={{ ...th, textAlign: "right" }}>On leave</th>
                                <th style={{ ...th, textAlign: "right" }}>Pending approvals</th>
                                <th style={th}>Payroll · {period}</th>
                                <th style={{ ...th, textAlign: "right" }}>Net pay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branches.length === 0 && (
                                <tr><td style={{ ...td, color: "#64748B" }} colSpan={7}>No branches yet.</td></tr>
                            )}
                            {branches.map(b => (
                                <tr key={b._id ?? "unassigned"}>
                                    <td style={td}>
                                        <div style={{ fontWeight: 700 }}>{b.name}</div>
                                        {b.code && <div style={{ fontSize: 12, color: "#64748B" }}>{b.code}</div>}
                                    </td>
                                    <td style={num}>{b.headcount}</td>
                                    <td style={num}>{b.presentToday}</td>
                                    <td style={num}>{b.onLeaveToday}</td>
                                    <td style={num} title={pendingDetail(b.pendingApprovals)}>{b.pendingApprovals.total}</td>
                                    <td style={td}>{b.payroll.status ? <StatusPill status={b.payroll.status} /> : <span style={{ color: "#94A3B8" }}>Not started</span>}</td>
                                    <td style={num}>{b.payroll.runId ? inr(b.payroll.netPay) : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                        {branches.length > 1 && (
                            <tfoot>
                                <tr style={{ fontWeight: 800 }}>
                                    <td style={td}>Company total</td>
                                    <td style={num}>{totals.headcount}</td>
                                    <td style={num}>{totals.presentToday}</td>
                                    <td style={num}>{totals.onLeaveToday}</td>
                                    <td style={num}>{totals.pendingApprovals.total}</td>
                                    <td style={td}>{totals.branchesWithRun}/{totals.branchCount} runs</td>
                                    <td style={num}>{inr(totals.payrollNetPay)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Subscription</h2>
                    <Link href="/billing" style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>Billing & invoices →</Link>
                </div>
                {!sub ? (
                    <p style={{ color: "#64748B", margin: 0 }}>No subscription details are available yet.</p>
                ) : (
                    <StatGrid>
                        <Stat label="Plan" value={sub.plan || "—"} sub={<StatusPill status={sub.status} />} />
                        <Stat label="Seats" value={`${sub.seatsUsed} / ${sub.seatLimit}`} sub={sub.seatLimit ? `${Math.max(sub.seatLimit - sub.seatsUsed, 0)} free` : undefined} tone={sub.seatLimit && sub.seatsUsed >= sub.seatLimit ? "danger" : "primary"} />
                        {sub.readOnlyUntil
                            ? <Stat label="Read-only until" value={fmtDate(sub.readOnlyUntil)} tone="danger" />
                            : <Stat label="Trial ends" value={fmtDate(sub.trialEndsAt)} />}
                        <Stat
                            label="Latest invoice"
                            value={sub.latestInvoice ? inr(sub.latestInvoice.amount) : "—"}
                            sub={sub.latestInvoice ? <><StatusPill status={sub.latestInvoice.status} /> {sub.latestInvoice.number}{sub.latestInvoice.dueDate ? ` · due ${fmtDate(sub.latestInvoice.dueDate)}` : ""}</> : "No invoices yet"}
                        />
                    </StatGrid>
                )}
            </div>
        </div>
    );
}
