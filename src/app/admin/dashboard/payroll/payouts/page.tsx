"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import PayoutStatusTable from "@/components/payroll/PayoutStatusTable";
import { FiRefreshCw, FiCreditCard, FiCheckCircle, FiAlertCircle, FiClock, FiActivity } from "react-icons/fi";

const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [summary, setSummary] = useState({ total: 0, pending: 0, processing: 0, processed: 0, failed: 0, totalAmount: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchPayouts = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.PAYOUTS_HISTORY).catch(() => ({ data: { data: [] } }));
            const data: any[] = res.data.data || [];
            setPayouts(data);
            const summ = {
                total: data.length,
                pending: data.filter(p => p.status === "pending" || p.status === "queued").length,
                processing: data.filter(p => p.status === "processing").length,
                processed: data.filter(p => p.status === "processed").length,
                failed: data.filter(p => p.status === "failed").length,
                totalAmount: data.filter(p => p.status === "processed").reduce((s, p) => s + (p.amount || 0), 0),
            };
            setSummary(summ);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    // Auto-refresh every 30s
    useEffect(() => {
        fetchPayouts();
        if (autoRefresh) {
            intervalRef.current = setInterval(() => fetchPayouts(true), 30000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [fetchPayouts, autoRefresh]);

    const handleRetry = async (payoutId: string) => {
        setRetryingId(payoutId);
        try {
            await axiosInstance.post(API_ENDPOINTS.PAYOUTS_RETRY(payoutId));
            fetchPayouts(true);
        } catch (e: any) { alert(e.response?.data?.message || "Retry failed"); }
        finally { setRetryingId(null); }
    };

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E1B4B", margin: 0 }}>RazorpayX Payout Status</h1>
                    <p style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>
                        Real-time payout tracking with auto-refresh every 30 seconds
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {/* Auto-refresh toggle */}
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                        <div
                            onClick={() => setAutoRefresh(p => !p)}
                            style={{
                                width: 40, height: 22, borderRadius: 11, position: "relative", cursor: "pointer",
                                background: autoRefresh ? "#6366F1" : "#CBD5E1", transition: "background 0.2s"
                            }}
                        >
                            <div style={{
                                position: "absolute", top: 3, left: autoRefresh ? 21 : 3,
                                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                            }} />
                        </div>
                        Auto-Refresh
                    </label>
                    <button className="btn btn-secondary" onClick={() => fetchPayouts(true)} disabled={refreshing}>
                        <FiRefreshCw size={14} className={refreshing ? "spin" : ""} />
                        {refreshing ? "Refreshing…" : "Refresh Now"}
                    </button>
                </div>
            </div>

            {/* Live indicator */}
            {autoRefresh && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "10px 16px", background: "#EEF2FF", borderRadius: 10, border: "1px solid #C7D2FE", width: "fit-content" }}>
                    <FiActivity size={14} style={{ color: "#6366F1" }} />
                    <span style={{ fontSize: 12, color: "#4338CA", fontWeight: 600 }}>Live — Auto-refreshing every 30s to reflect webhook updates</span>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366F1", animation: "pulse 1.5s infinite" }} />
                </div>
            )}

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
                {[
                    { label: "Total Payouts", value: summary.total, icon: FiCreditCard, color: "#6366F1", bg: "#EEF2FF" },
                    { label: "Pending", value: summary.pending, icon: FiClock, color: "#F59E0B", bg: "#FEF3C7" },
                    { label: "Processing", value: summary.processing, icon: FiRefreshCw, color: "#3B82F6", bg: "#DBEAFE" },
                    { label: "Processed", value: summary.processed, icon: FiCheckCircle, color: "#10B981", bg: "#D1FAE5" },
                    { label: "Failed", value: summary.failed, icon: FiAlertCircle, color: "#EF4444", bg: "#FEE2E2" },
                ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: `1px solid ${s.bg}` }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                            <s.icon size={16} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Total Disbursed Banner */}
            <div style={{
                background: "linear-gradient(135deg, #1E1B4B, #4F46E5)",
                borderRadius: 20, padding: "24px 32px", marginBottom: 24,
                display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff"
            }}>
                <div>
                    <div style={{ fontSize: 13, color: "#A5B4FC", fontWeight: 600, marginBottom: 6 }}>TOTAL DISBURSED VIA RAZORPAYX</div>
                    <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "monospace", letterSpacing: "-1px" }}>
                        {fmt(summary.totalAmount)}
                    </div>
                    <div style={{ fontSize: 12, color: "#C7D2FE", marginTop: 4 }}>Across {summary.processed} successful payouts</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#A5B4FC", marginBottom: 4 }}>Success Rate</div>
                    <div style={{ fontSize: 32, fontWeight: 900 }}>
                        {summary.total > 0 ? Math.round((summary.processed / summary.total) * 100) : 0}%
                    </div>
                </div>
            </div>

            {/* Payout Table */}
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8EAFF", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9", fontWeight: 800, fontSize: 15, color: "#1E1B4B" }}>
                    Payout Transactions
                </div>
                <PayoutStatusTable payouts={payouts} onRetry={handleRetry} retryingId={retryingId} loading={loading} />
            </div>
        </>
    );
}
