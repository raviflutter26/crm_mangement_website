"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { describeError, type FetchError } from "@/lib/fetchError";
import { PageHeader, Stat, StatGrid, fmtDateTime } from "@/page_components/superadmin/ui";

/** Request rate, error rate and latency from the API's in-memory rolling window (per instance, reset on restart). */
export default function GatewayInfraPage() {
    const [d, setD] = useState<any>(null);
    const [errors, setErrors] = useState<FetchError[]>([]);
    const [windowS, setWindowS] = useState(60);

    const load = useCallback(async () => {
        try {
            const res = await axiosInstance.get("/api/system/infra/gateway", { params: { window: windowS } });
            setD(res.data.data);
            setErrors([]);
        } catch (err) {
            setErrors([describeError(err)]);
        }
    }, [windowS]);

    useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

    if (!d && errors.length === 0) return <div style={{ padding: "40px" }}><LoadingSkeleton /></div>;
    const ms = (v: number | null) => (v == null ? "—" : `${v} ms`);
    const maxReq = d ? Math.max(1, ...d.series.map((s: any) => s.requests)) : 1;

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingBottom: "40px" }}>
            <PageHeader
                title="API Gateway"
                subtitle="Traffic measured inside the API process over a rolling window. Per instance; resets when the process restarts."
                actions={<>
                    <select className="form-input" value={windowS} onChange={e => setWindowS(Number(e.target.value))} aria-label="Window">
                        <option value={60}>Last 1 minute</option>
                        <option value={300}>Last 5 minutes</option>
                    </select>
                    <button className="btn btn-secondary" onClick={load}><FiRefreshCw /> Refresh</button>
                </>}
            />
            <ErrorState errors={errors} onRetry={load} />
            {d && !d.mountedGlobally && (
                <div role="status" className="card" style={{ padding: "14px 18px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "center", borderLeft: "3px solid var(--warning)", fontSize: "13px" }}>
                    <FiAlertCircle /> Measuring {d.scope}. Mount the request-metrics middleware in the API app to cover all traffic.
                </div>
            )}
            {d && <>
                <StatGrid>
                    <Stat label="Requests" value={d.requests.toLocaleString()} sub={`${d.requestRatePerSec}/s over ${d.windowSeconds}s`} />
                    <Stat label="Error rate (5xx)" value={`${d.errorRate}%`} sub={`${d.serverErrors} server · ${d.clientErrors} client (4xx)`} tone={d.errorRate > 1 ? "error" : "success"} />
                    <Stat label="Latency p50" value={ms(d.latencyMs.p50)} sub={`${d.latencyMs.samples} samples`} />
                    <Stat label="Latency p95" value={ms(d.latencyMs.p95)} sub={`p99 ${ms(d.latencyMs.p99)}`} tone="warning" />
                </StatGrid>
                <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px" }}>REQUESTS PER MINUTE (LAST 5)</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "120px" }}>
                        {d.series.map((s: any) => (
                            <div key={s.minutesAgo} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                                <div title={`${s.requests} requests, ${s.errors} errors`} style={{ width: "100%", height: `${(s.requests / maxReq) * 90}px`, minHeight: "2px", background: s.errors ? "var(--error)" : "var(--primary)", borderRadius: "4px 4px 0 0" }} />
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.minutesAgo === 0 ? "now" : `-${s.minutesAgo}m`} · {s.requests}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <h2 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 12px", color: "var(--text-primary)" }}>Busiest routes since {fmtDateTime(d.collectingSince)}</h2>
                <div className="card"><div className="table-wrapper"><table>
                    <thead><tr><th>Route</th><th style={{ textAlign: "right" }}>Requests</th><th style={{ textAlign: "right" }}>5xx</th><th style={{ textAlign: "right" }}>Avg latency</th></tr></thead>
                    <tbody>{d.topRoutes.length === 0
                        ? <tr><td colSpan={4} style={{ color: "var(--text-muted)" }}>No requests recorded yet.</td></tr>
                        : d.topRoutes.map((r: any) => (
                            <tr key={r.route}><td style={{ fontFamily: "monospace", fontSize: "12px" }}>{r.route}</td><td style={{ textAlign: "right" }}>{r.count}</td><td style={{ textAlign: "right" }}>{r.errors}</td><td style={{ textAlign: "right" }}>{r.avgMs} ms</td></tr>
                        ))}</tbody>
                </table></div></div>
            </>}
        </div>
    );
}
