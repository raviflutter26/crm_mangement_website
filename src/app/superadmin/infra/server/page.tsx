"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiRefreshCw } from "react-icons/fi";
import ErrorState from "@/components/common/ErrorState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { describeError, type FetchError } from "@/lib/fetchError";
import { PageHeader, Stat, StatGrid, fmtDateTime } from "@/page_components/superadmin/ui";

/** Live figures for the API process answering this request (one instance, not a cluster view). */
export default function ServerInfraPage() {
    const [d, setD] = useState<any>(null);
    const [errors, setErrors] = useState<FetchError[]>([]);
    const [auto, setAuto] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await axiosInstance.get("/api/system/infra/server");
            setD(res.data.data);
            setErrors([]);
        } catch (err) {
            setErrors([describeError(err)]);
        }
    }, []);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        if (!auto) return;
        const t = setInterval(load, 10000);
        return () => clearInterval(t);
    }, [auto, load]);

    if (!d && errors.length === 0) return <div style={{ padding: "40px" }}><LoadingSkeleton /></div>;
    const ms = (v: number | null | undefined) => (v == null ? "—" : `${v} ms`);

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)", minHeight: "100vh", paddingBottom: "40px" }}>
            <PageHeader
                title="Server"
                subtitle="The API process that answered this request. With several instances behind a load balancer, each reports itself."
                actions={<>
                    <label style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "13px" }}>
                        <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} /> Auto-refresh (10s)
                    </label>
                    <button className="btn btn-secondary" onClick={load}><FiRefreshCw /> Refresh</button>
                </>}
            />
            <ErrorState errors={errors} onRetry={load} />
            {d && <>
                <StatGrid>
                    <Stat label="Uptime" value={d.process.uptime} sub={`PID ${d.process.pid} · ${d.host}`} />
                    <Stat label="Node.js" value={d.process.nodeVersion} sub={`${d.process.platform} · ${d.process.env || "env unset"}`} tone="success" />
                    <Stat label="Memory RSS" value={`${d.memory.rssMb} MB`} sub={`Heap ${d.memory.heapUsedMb} / ${d.memory.heapTotalMb} MB`} tone="warning" />
                    <Stat label="Load average" value={d.cpu.loadAverage.join(" · ")} sub={`1 / 5 / 15 min on ${d.cpu.count} CPU(s)`} />
                    <Stat label="Event-loop delay p99" value={ms(d.eventLoopDelayMs.p99)} sub={`mean ${ms(d.eventLoopDelayMs.mean)} · max ${ms(d.eventLoopDelayMs.max)}`} tone={d.eventLoopDelayMs.p99 > 100 ? "error" : "primary"} />
                </StatGrid>
                <div className="card"><div className="table-wrapper"><table>
                    <tbody>
                        <tr><td>CPU model</td><td>{d.cpu.model || "—"}</td></tr>
                        <tr><td>External memory</td><td>{d.memory.externalMb} MB</td></tr>
                        <tr><td>Host memory free / total</td><td>{d.memory.systemFreeMb} / {d.memory.systemTotalMb} MB</td></tr>
                        <tr><td>Event-loop p50</td><td>{ms(d.eventLoopDelayMs.p50)} ({d.eventLoopDelayMs.samples} samples since first view)</td></tr>
                        <tr><td>Measured at</td><td>{fmtDateTime(d.measuredAt)}</td></tr>
                    </tbody>
                </table></div></div>
            </>}
        </div>
    );
}
