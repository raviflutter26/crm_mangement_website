"use client";

import React, { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiSearch, FiFilter, FiDownload, FiActivity, FiShield, FiClock, FiLoader,
} from "react-icons/fi";
import { motion } from "framer-motion";
import EmptyState from "@/components/common/EmptyState";

interface AuditLog {
    id: string;
    ts: string;
    actor: string;
    action: string;
    target: string;
    ip: string;
    severity: string;
}

const PAGE_SIZE = 50;

const SEVERITY_BADGE: Record<string, { bg: string; color: string }> = {
    info: { bg: "#eff6ff", color: "#3b82f6" },
    warning: { bg: "#fffbeb", color: "#f59e0b" },
    critical: { bg: "#fef2f2", color: "#ef4444" },
};

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    // Server-side filters: the actor box and paging go to the API, which used to
    // ignore the actor and only ever return the newest 20 entries.
    const [actorInput, setActorInput] = useState("");
    const [actor, setActor] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });

    const fetchLogs = useCallback(async () => {
        try {
            const res = await axiosInstance.get("/api/superadmin/audit-log", { params: { actor: actor || undefined, page, limit: PAGE_SIZE } });
            setLogs(res.data?.data ?? []);
            setPagination({ total: res.data?.pagination?.total ?? 0, totalPages: res.data?.pagination?.totalPages || 1 });
            setError(false);
        } catch (err) {
            console.error("Failed to load audit logs", err);
            setLogs([]);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [actor, page]);

    const exportCsv = () => {
        const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const header = ["Time", "Actor", "Action", "Target", "IP", "Severity"];
        const csv = [header.join(","), ...filteredLogs.map(l => [l.ts, l.actor, l.action, l.target, l.ip, l.severity].map(esc).join(","))].join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-log-page-${page}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = logs.filter((l) =>
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.actor?.toLowerCase().includes(search.toLowerCase()) ||
        l.target?.toLowerCase().includes(search.toLowerCase())
    );

    const countBySeverity = (sev: string) => logs.filter((l) => (l.severity ?? "info").toLowerCase() === sev).length;

    if (loading && logs.length === 0 && !error) return <div className="loading-container"><FiLoader className="rotate" /></div>;

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)" }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header"
                style={{ marginBottom: "32px" }}
            >
                <div>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 900 }}>System Audit Log</h1>
                    <p className="page-subtitle">Historical trail of all administrative and security actions across the platform.</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button className="btn btn-secondary" onClick={exportCsv} disabled={filteredLogs.length === 0} style={{ fontWeight: 800 }}>
                        <FiDownload /> EXPORT CSV
                    </button>
                </div>
            </motion.div>

            {/* Metrics Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <MetricBox label="TOTAL EVENTS" val={pagination.total} color="var(--primary)" />
                <MetricBox label="INFO (THIS PAGE)" val={countBySeverity("info")} color="#3b82f6" />
                <MetricBox label="WARNING (THIS PAGE)" val={countBySeverity("warning")} color="#f59e0b" />
                <MetricBox label="CRITICAL (THIS PAGE)" val={countBySeverity("critical")} color="#ef4444" />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", overflow: "hidden" }}>
                <div className="card-header" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ position: "relative", width: "400px" }}>
                        <FiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input
                            type="text"
                            placeholder="Search by action, actor, or target..."
                            className="form-input"
                            style={{ paddingLeft: "42px", borderRadius: "12px", background: "#f8fafc" }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <form
                        onSubmit={(e) => { e.preventDefault(); setPage(1); setActor(actorInput.trim()); }}
                        style={{ display: "flex", gap: "8px", alignItems: "center" }}
                    >
                        <input
                            type="text"
                            placeholder="Actor name or email"
                            className="form-input"
                            style={{ borderRadius: "12px", background: "#f8fafc", width: "220px" }}
                            value={actorInput}
                            onChange={(e) => setActorInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
                            <FiFilter /> FILTER
                        </button>
                    </form>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {error && logs.length === 0 ? (
                        <div style={{ padding: "24px" }}>
                            <EmptyState
                                title="Audit log unavailable"
                                description="Couldn't reach the audit service. Try refreshing in a moment."
                                icon={FiShield}
                                actionLabel="Retry"
                                onAction={() => { setLoading(true); fetchLogs(); }}
                                className="py-16"
                            />
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "#f8fafc" }}>
                                <tr>
                                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: 800, color: "#64748b", textAlign: "left" }}>ACTION</th>
                                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: 800, color: "#64748b", textAlign: "left" }}>ACTOR</th>
                                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: 800, color: "#64748b", textAlign: "left" }}>TARGET</th>
                                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: 800, color: "#64748b", textAlign: "left" }}>IP ADDRESS</th>
                                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: 800, color: "#64748b", textAlign: "left" }}>SEVERITY</th>
                                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: 800, color: "#64748b", textAlign: "left" }}>DATETIME</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log, idx) => {
                                    const sevKey = (log.severity ?? "info").toLowerCase();
                                    const sevStyle = SEVERITY_BADGE[sevKey] ?? SEVERITY_BADGE.info;
                                    const initial = (log.actor || "S").charAt(0).toUpperCase();
                                    return (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{ borderBottom: "1px solid #f1f5f9" }}
                                        >
                                            <td style={{ padding: "16px 24px" }}>
                                                <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>{log.action}</div>
                                            </td>
                                            <td style={{ padding: "16px 24px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800 }}>
                                                        {initial}
                                                    </div>
                                                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{log.actor || "System"}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px 24px" }}>
                                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>{log.target || "—"}</span>
                                            </td>
                                            <td style={{ padding: "16px 24px" }}>
                                                <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#475569" }}>{log.ip || "—"}</div>
                                            </td>
                                            <td style={{ padding: "16px 24px" }}>
                                                <span style={{
                                                    padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 800,
                                                    background: sevStyle.bg, color: sevStyle.color,
                                                }}>
                                                    {(log.severity ?? "Info").toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px 24px" }}>
                                                <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <FiClock /> {new Date(log.ts).toLocaleString()}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    {!error && pagination.totalPages > 1 && (
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", padding: "16px 24px", fontSize: "13px" }}>
                            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                            <span>Page {page} of {pagination.totalPages}</span>
                            <button className="btn btn-secondary btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    )}
                    {!error && filteredLogs.length === 0 && (
                        <div style={{ padding: "80px", textAlign: "center" }}>
                            <FiActivity size={48} style={{ color: "#e2e8f0", marginBottom: "16px" }} />
                            <div style={{ fontWeight: 800, color: "#64748b" }}>
                                {logs.length === 0 ? "No audit events recorded yet" : `No logs found for "${search}"`}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricBox({ label, val, color }: { label: string; val: number; color: string }) {
    return (
        <div className="card" style={{ padding: "20px", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", marginBottom: "8px" }}>{label}</div>
            <div style={{ fontSize: "24px", fontWeight: 950, color: color }}>{val}</div>
        </div>
    );
}
