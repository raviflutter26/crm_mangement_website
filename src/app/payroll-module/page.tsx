"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import PayrollKPICards from "@/components/payroll/PayrollKPICards";
import PayrollTrendChart from "@/components/payroll/PayrollTrendChart";
import { FiPlay, FiCheckCircle, FiCreditCard, FiRefreshCw, FiArrowRight, FiCalendar } from "react-icons/fi";
import Link from "next/link";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    draft:      { label: "Draft",      color: "#64748B", bg: "#F3F4F6" },
    processing: { label: "Processing", color: "#3B82F6", bg: "#DBEAFE" },
    review:     { label: "In Review",  color: "#F59E0B", bg: "#FEF3C7" },
    approved:   { label: "Approved",   color: "#10B981", bg: "#D1FAE5" },
    locked:     { label: "Locked",     color: "#8B5CF6", bg: "#EDE9FE" },
    paid:       { label: "Paid",       color: "#059669", bg: "#A7F3D0" },
};
const fmt = (n: number | undefined) => `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function buildTrend(runs: any[]) {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const run = runs.find(r => r.month === d.getMonth() + 1 && r.year === d.getFullYear());
        return { month: MONTHS[d.getMonth()], netPay: run?.totalNetPay || 0, grossPay: run?.totalGrossPay || 0, deductions: run?.totalDeductions || 0 };
    });
}

export default function PayrollDashboardPage() {
    const [summary, setSummary] = useState<any>({});
    const [runs, setRuns] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAll = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const [sumRes, runsRes, payoutsRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.PAYROLL_SUMMARY).catch(() => ({ data: { data: {} } })),
                axiosInstance.get(API_ENDPOINTS.PAYROLL_RUNS).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.PAYOUTS_STATUS).catch(() => ({ data: { data: {} } })),
            ]);
            setSummary(sumRes.data.data || {});
            setRuns((runsRes.data.data || []).slice(0, 6));
            setPayouts(payoutsRes.data.data || {});
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.5px", margin: 0 }}>Payroll Overview</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Real-time payroll dashboard with RazorpayX disbursement tracking</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-secondary" onClick={() => fetchAll(true)} disabled={refreshing}>
                        <FiRefreshCw size={14} className={refreshing ? "spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh"}
                    </button>
                    <Link href="/payroll-module/payroll-runs">
                        <button className="btn btn-primary"><FiPlay size={14} /> Run Payroll</button>
                    </Link>
                </div>
            </div>

            <PayrollKPICards summary={{ ...summary, pendingPayouts: payouts.pending || 0, failedPayouts: payouts.failed || 0 }} loading={loading} />

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginTop: 28 }}>
                <div style={{ background: "var(--bg-secondary)", borderRadius: 20, padding: "24px 28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: 16, marginBottom: 4 }}>Payroll Trend</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Last 6 months disbursement</div>
                    <PayrollTrendChart data={buildTrend(runs)} type="area" height={240} />
                </div>
                <div style={{ background: "var(--bg-secondary)", borderRadius: 20, padding: "24px 28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: 16, marginBottom: 20 }}>Quick Actions</div>
                    {[
                        { label: "Run Monthly Payroll",  icon: FiPlay,         href: "/payroll-module/payroll-runs", color: "var(--primary)" },
                        { label: "View Payout Status",   icon: FiCreditCard,   href: "/payroll-module/payouts",      color: "#10B981" },
                        { label: "Payroll Reports",      icon: FiCheckCircle,  href: "/payroll-module/reports",      color: "#F59E0B" },
                        { label: "View Audit Trail",     icon: FiCalendar,     href: "/payroll-module/audit",        color: "#8B5CF6" },
                    ].map((item, i) => (
                        <Link key={i} href={item.href} style={{ textDecoration: "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 12, marginBottom: 8, border: "1px solid var(--border)", transition: "all 0.18s", cursor: "pointer" }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = item.color)}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(255,122,0,0.1)`, color: item.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <item.icon size={16} />
                                </div>
                                <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{item.label}</span>
                                <FiArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div style={{ background: "var(--bg-secondary)", borderRadius: 20, padding: "24px 28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: 16 }}>Recent Payroll Runs</div>
                    <Link href="/payroll-module/payroll-runs" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        View All <FiArrowRight size={13} />
                    </Link>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead><tr><th>Run ID</th><th>Month/Year</th><th>Employees</th><th>Gross Pay</th><th>Net Pay</th><th>Status</th></tr></thead>
                        <tbody>
                            {loading ? Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton-pulse" style={{ height: 18, borderRadius: 6 }} /></td>)}</tr>
                            )) : runs.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)", fontSize: 14 }}>
                                    No payroll runs yet. <Link href="/payroll-module/payroll-runs" style={{ color: "var(--primary)", fontWeight: 600 }}>Start your first run →</Link>
                                </td></tr>
                            ) : runs.map((run: any) => {
                                const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.draft;
                                return (
                                    <tr key={run._id}>
                                        <td style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>{run.runId}</td>
                                        <td>{MONTHS[(run.month || 1) - 1]} {run.year}</td>
                                        <td>{run.totalEmployees || 0}</td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(run.totalGrossPay)}</td>
                                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}>{fmt(run.totalNetPay)}</td>
                                        <td><span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.label}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
