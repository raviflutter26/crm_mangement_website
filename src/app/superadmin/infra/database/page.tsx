"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiRefreshCw } from "react-icons/fi";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { describeError, type FetchError } from "@/lib/fetchError";
import { PageHeader, Stat, StatGrid, fmtDateTime } from "@/page_components/superadmin/ui";

/** MongoDB connection state, db.stats() and the largest collections. Backups are managed by the database host, not here. */
export default function DatabaseInfraPage() {
    const [d, setD] = useState<any>(null);
    const [errors, setErrors] = useState<FetchError[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get("/api/system/infra/database");
            setD(res.data.data);
            setErrors([]);
        } catch (err) {
            setErrors([describeError(err)]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading && !d) return <div style={{ padding: "40px" }}><LoadingSkeleton /></div>;

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingBottom: "40px" }}>
            <PageHeader
                title="Database"
                subtitle="Live MongoDB figures from the API's connection. Backups and replication are configured at the database host."
                actions={<button className="btn btn-secondary" onClick={load}><FiRefreshCw /> Refresh</button>}
            />
            <ErrorState errors={errors} onRetry={load} />
            {d && !d.connected && (
                <div role="alert" className="card" style={{ padding: "20px", borderLeft: "3px solid var(--error)" }}>Database is {d.state}.</div>
            )}
            {d?.connected && <>
                <StatGrid>
                    <Stat label="Connection" value={d.state} sub={`${d.name}${d.host ? ` @ ${d.host}` : ""}`} tone="success" />
                    <Stat label="Ping" value={`${d.pingMs} ms`} sub="Round trip from the API" />
                    <Stat label="Collections" value={d.stats.collections} sub={`${d.stats.indexes} indexes (${d.stats.indexSizeMb} MB)`} />
                    <Stat label="Documents" value={Number(d.stats.objects).toLocaleString()} sub={`avg ${d.stats.avgObjSizeBytes} bytes`} />
                    <Stat label="Data / storage" value={`${d.stats.dataSizeMb} MB`} sub={`${d.stats.storageSizeMb} MB on disk`} tone="warning" />
                </StatGrid>
                <h2 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 12px", color: "var(--text-primary)" }}>Largest collections</h2>
                <div className="card"><div className="table-wrapper"><table>
                    <thead><tr><th>Collection</th><th style={{ textAlign: "right" }}>Documents (estimated)</th></tr></thead>
                    <tbody>{d.topCollections.map((c: any) => (
                        <tr key={c.name}><td style={{ fontFamily: "monospace", fontSize: "12px" }}>{c.name}</td><td style={{ textAlign: "right" }}>{Number(c.documents).toLocaleString()}</td></tr>
                    ))}</tbody>
                </table></div></div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>Measured {fmtDateTime(d.measuredAt)}</p>
            </>}
        </div>
    );
}
