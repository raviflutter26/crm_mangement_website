"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import AuditLogTable from "@/components/payroll/AuditLogTable";
import { FiShield, FiRefreshCw, FiFilter } from "react-icons/fi";

const ACTION_TYPES = ["all", "run_payroll", "approve_payroll", "lock_payroll", "disburse", "retry_payout", "view_payslip", "update_bank"];

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterAction, setFilterAction] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    const fetchLogs = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.PAYROLL_AUDIT_LOGS).catch(() => ({ data: { data: [] } }));
            setLogs(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const filtered = logs.filter(l => {
        const actionMatch = filterAction === "all" || l.action === filterAction;
        const statusMatch = filterStatus === "all" || l.status === filterStatus;
        return actionMatch && statusMatch;
    });

    const successCount = logs.filter(l => l.status !== "failure").length;
    const failureCount = logs.filter(l => l.status === "failure").length;

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E1B4B", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                        <FiShield size={22} style={{ color: "#6366F1" }} /> Audit Logs
                    </h1>
                    <p style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>
                        Complete audit trail of all payroll actions for compliance & governance
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={() => fetchLogs(true)} disabled={refreshing}>
                    <FiRefreshCw size={14} className={refreshing ? "spin" : ""} />
                    {refreshing ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                    { label: "Total Events", value: logs.length, color: "#6366F1", bg: "#EEF2FF" },
                    { label: "Successful", value: successCount, color: "#10B981", bg: "#D1FAE5" },
                    { label: "Failures", value: failureCount, color: "#EF4444", bg: "#FEE2E2" },
                ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: `1px solid ${s.bg}` }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Compliance banner */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", background: "linear-gradient(135deg, #1E1B4B, #3730A3)", borderRadius: 14, marginBottom: 24, color: "#fff" }}>
                <FiShield size={18} style={{ flexShrink: 0, color: "#A5B4FC" }} />
                <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Compliance & Governance</div>
                    <div style={{ fontSize: 12, color: "#C7D2FE", marginTop: 2 }}>
                        All payroll actions are immutably logged with actor identity, IP address, and timestamp for RBI and SEBI compliance.
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <FiFilter size={14} style={{ color: "#64748B" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Filter:</span>
                </div>
                <select className="form-input" style={{ width: 180 }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                    {ACTION_TYPES.map(a => (
                        <option key={a} value={a}>{a === "all" ? "All Actions" : a.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                </select>
                <select className="form-input" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="failure">Failure</option>
                    <option value="warning">Warning</option>
                </select>
                {(filterAction !== "all" || filterStatus !== "all") && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setFilterAction("all"); setFilterStatus("all"); }}>
                        Clear Filters
                    </button>
                )}
                <span style={{ marginLeft: "auto", fontSize: 13, color: "#94A3B8" }}>Showing {filtered.length} of {logs.length} events</span>
            </div>

            {/* Audit Table */}
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8EAFF", overflow: "hidden" }}>
                <AuditLogTable logs={filtered} loading={loading} />
            </div>
        </>
    );
}
