"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";
import { FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiSearch } from "react-icons/fi";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n: any) => (n === null || n === undefined ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`);

type Row = {
    payrollId: string;
    employeeName?: string;
    employeeId?: string;
    netPay: number;
    paymentStatus: string;
    transactionId: string | null;
    transactionStatus: string | null;
    transactionAmount: number | null;
    providerStatus: string | null;
    providerError: string | null;
    issues: string[];
};

type Result = {
    run: { runId: string; month: number; year: number; status: string };
    providerChecked: boolean;
    summary: { records: number; transactions: number; mismatches: number };
    rows: Row[];
    mismatches: Row[];
};

/**
 * Payout vs payroll record vs RazorpayX comparison for one run, with a
 * per-payout "pull status from RazorpayX" action.
 */
export default function PayoutReconciliation({ onChanged, branchId }: { onChanged?: () => void; branchId?: string }) {
    const toast = useToast();
    const [runs, setRuns] = useState<any[]>([]);
    const [runId, setRunId] = useState("");
    const [result, setResult] = useState<Result | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        // Runs are per branch; narrowed to the selected branch when there is one.
        axiosInstance.get(API_ENDPOINTS.PAYROLL_RUNS, { params: branchId ? { branchId } : {} })
            .then(res => {
                const list = (res.data.data || []).filter((r: any) => ["locked", "paid"].includes(r.status));
                setRuns(list);
                setRunId(list[0]?._id || "");
                setResult(null);
            })
            .catch(() => setRuns([]));
    }, [branchId]);

    const reconcile = async () => {
        if (!runId) return;
        setLoading(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.PAYOUTS_RECONCILIATION, { params: { runId } });
            setResult(res.data.data);
        } catch (e: any) {
            setResult(null);
            toast.error(e.response?.data?.message || "Reconciliation failed");
        } finally { setLoading(false); }
    };

    const refresh = async (transactionId: string) => {
        setRefreshing(transactionId);
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.PAYOUTS_REFRESH_STATUS(transactionId));
            const d = res.data.data;
            toast.success(d.changed ? `Updated to ${d.status} (RazorpayX: ${d.providerStatus})` : `No change (RazorpayX: ${d.providerStatus})`);
            await reconcile();
            onChanged?.();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Could not refresh from RazorpayX");
        } finally { setRefreshing(null); }
    };

    const rows = result ? (showAll ? result.rows : result.mismatches) : [];

    return (
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8EAFF", overflow: "hidden", marginTop: 24 }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1E1B4B", flex: 1 }}>Reconciliation</div>
                <select className="form-input" style={{ width: 240 }} value={runId} onChange={e => setRunId(e.target.value)}>
                    {runs.length === 0 && <option value="">No locked or paid runs</option>}
                    {runs.map(r => <option key={r._id} value={r._id}>{r.runId} — {MONTHS[(r.month || 1) - 1]} {r.year}{r.branchId?.name ? ` · ${r.branchId.name}` : ""} ({r.status})</option>)}
                </select>
                <button className="btn btn-primary btn-sm" onClick={reconcile} disabled={!runId || loading}>
                    <FiSearch size={13} /> {loading ? "Checking…" : "Reconcile"}
                </button>
            </div>

            {result && (
                <div style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 12, fontSize: 13 }}>
                        {result.summary.mismatches === 0 ? (
                            <span style={{ color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><FiCheckCircle /> All {result.summary.records} record(s) agree</span>
                        ) : (
                            <span style={{ color: "#DC2626", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><FiAlertTriangle /> {result.summary.mismatches} mismatch(es) in {result.summary.records} record(s)</span>
                        )}
                        <span style={{ color: "#64748B" }}>
                            {result.providerChecked ? "Compared with RazorpayX live status." : "RazorpayX keys are not configured — local comparison only."}
                        </span>
                        <label style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", color: "#475569", fontWeight: 600 }}>
                            <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} /> Show all records
                        </label>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Employee</th><th>Net pay</th><th>Record</th><th>Payout</th><th>RazorpayX</th><th>Issues</th><th></th></tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 30, color: "#94A3B8" }}>Nothing to show</td></tr>
                                ) : rows.map(r => (
                                    <tr key={r.payrollId}>
                                        <td style={{ fontWeight: 600 }}>{r.employeeName}<div style={{ fontSize: 11, color: "#94A3B8" }}>{r.employeeId}</div></td>
                                        <td style={{ fontFamily: "monospace" }}>{fmt(r.netPay)}</td>
                                        <td>{r.paymentStatus}</td>
                                        <td>{r.transactionStatus || "—"}{r.transactionAmount !== null && r.transactionAmount !== r.netPay ? ` (${fmt(r.transactionAmount)})` : ""}</td>
                                        <td>{r.providerStatus || (r.providerError ? <span title={r.providerError} style={{ color: "#DC2626" }}>error</span> : "—")}</td>
                                        <td style={{ fontSize: 12, color: r.issues.length ? "#B91C1C" : "#059669" }}>{r.issues.length ? r.issues.join("; ") : "OK"}</td>
                                        <td style={{ textAlign: "right" }}>
                                            {r.transactionId && result.providerChecked && (
                                                <button className="btn btn-secondary btn-sm" onClick={() => refresh(r.transactionId!)} disabled={refreshing === r.transactionId} title="Pull status from RazorpayX">
                                                    <FiRefreshCw size={12} className={refreshing === r.transactionId ? "spin" : ""} /> Refresh
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
