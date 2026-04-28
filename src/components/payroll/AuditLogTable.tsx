"use client";

import { FiUser, FiCheck, FiCreditCard, FiPlay, FiLock, FiShield, FiFileText } from "react-icons/fi";

interface AuditEntry {
    _id: string;
    action: string;
    actor?: string;
    actorRole?: string;
    entity?: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
    createdAt: string;
    status?: "success" | "failure" | "warning";
}

interface AuditLogTableProps {
    logs: AuditEntry[];
    loading?: boolean;
}

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    run_payroll:     { label: "Run Payroll",     icon: FiPlay,     color: "#6366F1", bg: "#EEF2FF" },
    approve_payroll: { label: "Approve Payroll", icon: FiCheck,    color: "#10B981", bg: "#D1FAE5" },
    lock_payroll:    { label: "Lock Payroll",    icon: FiLock,     color: "#F59E0B", bg: "#FEF3C7" },
    disburse:        { label: "Disburse",        icon: FiCreditCard, color: "#3B82F6", bg: "#DBEAFE" },
    retry_payout:    { label: "Retry Payout",    icon: FiShield,   color: "#EF4444", bg: "#FEE2E2" },
    view_payslip:    { label: "View Payslip",    icon: FiFileText, color: "#8B5CF6", bg: "#EDE9FE" },
    update_bank:     { label: "Update Bank",     icon: FiUser,     color: "#F97316", bg: "#FFF7ED" },
};

export default function AuditLogTable({ logs, loading }: AuditLogTableProps) {
    if (loading) {
        return (
            <div className="payroll-table-card">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton-row" style={{ height: 48, marginBottom: 4 }} />
                ))}
            </div>
        );
    }

    return (
        <div className="payroll-table-card">
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Performed By</th>
                            <th>Role</th>
                            <th>Entity</th>
                            <th>Details</th>
                            <th>IP Address</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, i) => {
                            const cfg = ACTION_CONFIG[log.action] || { label: log.action, icon: FiFileText, color: "#64748B", bg: "#F3F4F6" };
                            const Icon = cfg.icon;
                            return (
                                <tr key={i}>
                                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                        {new Date(log.createdAt).toLocaleString("en-IN", {
                                            day: "2-digit", month: "short", year: "2-digit",
                                            hour: "2-digit", minute: "2-digit", second: "2-digit"
                                        })}
                                    </td>
                                    <td>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700 }}>
                                            <Icon size={12} />{cfg.label}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{log.actor || "System"}</td>
                                    <td>
                                        <span style={{ fontSize: 11, padding: "2px 8px", background: "#F1F5F9", borderRadius: 6, fontWeight: 600, color: "#475569", textTransform: "capitalize" }}>
                                            {log.actorRole || "admin"}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13, color: "#475569" }}>
                                        {log.entity && <span style={{ fontWeight: 600 }}>{log.entity}</span>}
                                        {log.entityId && <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94A3B8", marginLeft: 6 }}>#{log.entityId?.slice(-6)}</span>}
                                    </td>
                                    <td style={{ fontSize: 12, color: "#64748B", maxWidth: 200 }}>
                                        <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {log.details || "—"}
                                        </span>
                                    </td>
                                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "#94A3B8" }}>{log.ipAddress || "—"}</td>
                                    <td>
                                        <span style={{
                                            padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            background: log.status === "failure" ? "#FEE2E2" : log.status === "warning" ? "#FEF3C7" : "#D1FAE5",
                                            color: log.status === "failure" ? "#DC2626" : log.status === "warning" ? "#D97706" : "#059669"
                                        }}>
                                            {log.status || "success"}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ textAlign: "center", padding: "60px 20px" }}>
                                    <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                                    <div style={{ fontWeight: 700 }}>No audit entries yet</div>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>All payroll actions will be logged here for compliance</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
