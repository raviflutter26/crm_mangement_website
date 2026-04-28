"use client";

import { FiRefreshCw, FiExternalLink, FiCheckCircle, FiClock, FiXCircle, FiLoader } from "react-icons/fi";

interface Payout {
    _id: string;
    employeeName?: string;
    employeeId?: string;
    amount: number;
    razorpayPayoutId?: string;
    razorpayTransactionId?: string;
    status: "pending" | "processing" | "processed" | "failed" | "queued" | "reversed";
    mode?: string;
    createdAt: string;
    updatedAt?: string;
    failureReason?: string;
}

interface PayoutStatusTableProps {
    payouts: Payout[];
    onRetry: (payoutId: string) => void;
    retryingId?: string | null;
    loading?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    pending:    { label: "Pending",    color: "#F59E0B", bg: "#FEF3C7", icon: FiClock },
    queued:     { label: "Queued",     color: "#8B5CF6", bg: "#EDE9FE", icon: FiClock },
    processing: { label: "Processing", color: "#3B82F6", bg: "#DBEAFE", icon: FiLoader },
    processed:  { label: "Processed",  color: "#10B981", bg: "#D1FAE5", icon: FiCheckCircle },
    failed:     { label: "Failed",     color: "#EF4444", bg: "#FEE2E2", icon: FiXCircle },
    reversed:   { label: "Reversed",   color: "#6B7280", bg: "#F3F4F6", icon: FiXCircle },
};

const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function PayoutStatusTable({ payouts, onRetry, retryingId, loading }: PayoutStatusTableProps) {
    if (loading) {
        return (
            <div className="payroll-table-card">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton-row" />
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
                            <th>Employee</th>
                            <th>Amount</th>
                            <th>Mode</th>
                            <th>Payout ID</th>
                            <th>Status</th>
                            <th>Date/Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payouts.map((p) => {
                            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                            const Icon = cfg.icon;
                            return (
                                <tr key={p._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{p.employeeName || "—"}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.employeeId}</div>
                                    </td>
                                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{fmt(p.amount)}</td>
                                    <td>
                                        <span style={{ fontSize: 12, padding: "2px 8px", background: "#F1F5F9", borderRadius: 6, fontWeight: 600 }}>
                                            {p.mode?.toUpperCase() || "IMPS"}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                                            {p.razorpayPayoutId ? (
                                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                    {p.razorpayPayoutId.slice(0, 18)}…
                                                    <FiExternalLink size={12} style={{ color: "var(--primary)", cursor: "pointer" }} />
                                                </span>
                                            ) : "—"}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 5,
                                            padding: "4px 10px", borderRadius: 20,
                                            background: cfg.bg, color: cfg.color,
                                            fontSize: 12, fontWeight: 700
                                        }}>
                                            <Icon size={12} className={p.status === "processing" ? "spin" : ""} />
                                            {cfg.label}
                                        </span>
                                        {p.failureReason && (
                                            <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>{p.failureReason}</div>
                                        )}
                                    </td>
                                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                        {p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN", {
                                            day: "2-digit", month: "short", year: "2-digit",
                                            hour: "2-digit", minute: "2-digit"
                                        }) : "—"}
                                    </td>
                                    <td>
                                        {p.status === "failed" && (
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => onRetry(p._id)}
                                                disabled={retryingId === p._id}
                                                title="Retry payout"
                                            >
                                                <FiRefreshCw size={13} className={retryingId === p._id ? "spin" : ""} />
                                                {retryingId === p._id ? "Retrying…" : "Retry"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {payouts.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "60px 20px" }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
                                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>No payout transactions yet</div>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                                        Initiate a payroll run to start disbursements via RazorpayX
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
