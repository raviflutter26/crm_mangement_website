"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { FiRefreshCw, FiUsers } from "react-icons/fi";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { describeError, type FetchError } from "@/lib/fetchError";
import { PageHeader, Stat, StatGrid, StatusPill } from "@/page_components/superadmin/ui";

interface SeatRow {
    organizationId: string; organization: string; plan: string; status: string;
    seatsUsed: number; seatLimit: number; utilization: number | null; overLimit: boolean;
}

export default function SeatsPage() {
    const [rows, setRows] = useState<SeatRow[]>([]);
    const [totals, setTotals] = useState({ used: 0, limit: 0, over: 0 });
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<FetchError[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get("/api/billing/seats");
            setRows(res.data.data.rows || []);
            setTotals(res.data.data.totals || { used: 0, limit: 0, over: 0 });
            setErrors([]);
        } catch (err) {
            setErrors([describeError(err)]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading && rows.length === 0) return <div style={{ padding: "40px" }}><LoadingSkeleton /></div>;

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingBottom: "40px" }}>
            <PageHeader
                title="Seats & Licenses"
                subtitle="Seats in use against each organization's subscription. Change seat counts under Subscriptions."
                actions={<>
                    <button className="btn btn-secondary" onClick={load}><FiRefreshCw /> Refresh</button>
                    <Link className="btn btn-primary" href="/superadmin/finance/subscriptions">Manage subscriptions</Link>
                </>}
            />
            <ErrorState errors={errors} onRetry={load} />
            <StatGrid>
                <Stat label="Seats in use" value={totals.used.toLocaleString()} sub="Users across all organizations" />
                <Stat label="Seats licensed" value={totals.limit.toLocaleString()} sub={totals.limit ? `${Math.round((totals.used / totals.limit) * 100)}% utilised` : "—"} tone="success" />
                <Stat label="Over limit" value={totals.over} sub="Organizations using more seats than licensed" tone="error" />
            </StatGrid>
            {rows.length === 0 ? (
                <EmptyState title="No organizations" description="There are no organizations yet." icon={FiUsers} />
            ) : (
                <div className="card"><div className="table-wrapper"><table>
                    <thead><tr><th>Organization</th><th>Plan</th><th>Subscription</th><th>Used</th><th>Limit</th><th style={{ width: "30%" }}>Utilisation</th></tr></thead>
                    <tbody>{rows.map(r => {
                        const pct = Math.min(100, r.utilization ?? 0);
                        return (
                            <tr key={r.organizationId}>
                                <td style={{ fontWeight: 600 }}>{r.organization}</td>
                                <td>{r.plan}</td>
                                <td><StatusPill status={r.status} /></td>
                                <td style={{ color: r.overLimit ? "var(--error)" : undefined, fontWeight: r.overLimit ? 700 : undefined }}>{r.seatsUsed}</td>
                                <td>{r.seatLimit}</td>
                                <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{ flex: 1, height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                                            <div style={{ width: `${pct}%`, height: "100%", background: r.overLimit ? "var(--error)" : pct > 85 ? "var(--warning)" : "var(--primary)" }} />
                                        </div>
                                        <span style={{ fontSize: "12px", minWidth: "44px", textAlign: "right" }}>{r.utilization == null ? "—" : `${r.utilization}%`}</span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}</tbody>
                </table></div></div>
            )}
        </div>
    );
}
