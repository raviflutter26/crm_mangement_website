"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiPlus, FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiArrowLeft, FiPieChart, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";

export default function EmployeeLeavesPage() {
    const { user } = useAuth();
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form Stats
    const [leaveType, setLeaveType] = useState("Sick Leave");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [reason, setReason] = useState("");

    const fetchLeaves = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.LEAVES);
            setHistory(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch leaves", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleApplyLeave = async () => {
        if (!fromDate || !toDate || !reason) {
            alert("Please fill in all fields");
            return;
        }

        const s = new Date(fromDate);
        const eDate = new Date(toDate);
        const diffTime = Math.abs(eDate.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.LEAVES, {
                leaveType: leaveType,
                startDate: fromDate,
                endDate: toDate,
                reason,
                employee: user?._id,
                totalDays: diffDays > 0 ? diffDays : 1
            });
            setShowRequestModal(false);
            fetchLeaves();
            // Reset form
            setFromDate("");
            setToDate("");
            setReason("");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to submit leave request");
        } finally {
            setSubmitting(false);
        }
    };

    const balances = [
        { type: "Earned Leave", total: 12, used: history.filter(h => h.leaveType === 'Earned Leave' && h.status === 'Approved').length, available: 10, color: "#3b82f6" },
        { type: "Sick Leave", total: 8, used: history.filter(h => h.leaveType === 'Sick Leave' && h.status === 'Approved').length, available: 7, color: "#ef4444" },
        { type: "Casual Leave", total: 6, used: history.filter(h => h.leaveType === 'Casual Leave' && h.status === 'Approved').length, available: 2, color: "#f59e0b" },
    ];

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 1s linear infinite" }} />
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Syncing leave calendar...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                        <Link href="/employee/dashboard" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                            <FiArrowLeft size={18} />
                        </Link>
                        <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>Leave Management</h1>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, marginLeft: "30px" }}>
                        Manage your time-off requests and view your annual leave balances.
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowRequestModal(true)}>
                    <FiPlus /> Apply for Leave
                </button>
            </div>

            {/* Leave Balances Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                {balances.map((bal, i) => (
                    <div key={i} className="card" style={{ padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>{bal.type}</div>
                            <FiPieChart style={{ color: bal.color }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <div>
                                <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)" }}>{bal.available}</div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Days Available</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>{bal.used} / {bal.total}</div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Used this year</div>
                            </div>
                        </div>
                        <div style={{ marginTop: "16px", height: "6px", background: "var(--bg-hover)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(bal.used / bal.total) * 100}%`, background: bal.color }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* History Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Leave History & Status</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                        {history.length > 0 ? (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                                        <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Leave Type</th>
                                        <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Duration</th>
                                        <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Days</th>
                                        <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Reason</th>
                                        <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((h, i) => {
                                        const start = new Date(h.startDate);
                                        const end = new Date(h.endDate);
                                        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

                                        return (
                                            <tr key={h._id || i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                                <td style={{ padding: "16px 20px", fontWeight: 700, fontSize: "14px" }}>{h.leaveType}</td>
                                                <td style={{ padding: "16px 20px" }}>
                                                    <div style={{ fontSize: "13px", fontWeight: 600 }}>
                                                        {start.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })} — {end.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px 20px" }}>
                                                    <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)" }}>{days} Day{days > 1 ? 's' : ''}</span>
                                                </td>
                                                <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.reason}</td>
                                                <td style={{ padding: "16px 20px" }}>
                                                    <span style={{
                                                        padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px",
                                                        background: h.status === "Approved" ? "#ecfdf5" : h.status === "Pending" ? "#fffbeb" : "#fef2f2",
                                                        color: h.status === "Approved" ? "#10b981" : h.status === "Pending" ? "#f59e0b" : "#ef4444"
                                                    }}>
                                                        {h.status === "Approved" ? <FiCheckCircle /> : h.status === "Pending" ? <FiClock /> : <FiXCircle />}
                                                        {h.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                                <FiAlertCircle size={40} style={{ marginBottom: "16px", opacity: 0.3 }} />
                                <p style={{ fontSize: "14px", fontWeight: 600 }}>No leave applications found.</p>
                                <p style={{ fontSize: "12px", opacity: 0.8 }}>Use the "Apply for Leave" button to submit your first request.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Apply Leave Modal */}
            {showRequestModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card animate-in" style={{ width: "100%", maxWidth: "500px", padding: "32px", animation: "slideUp 0.3s ease-out" }}>
                        <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>Request New Leave</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>Leave Type</label>
                                <select 
                                    className="btn btn-secondary" 
                                    style={{ width: "100%", textAlign: "left" }}
                                    value={leaveType}
                                    onChange={(e) => setLeaveType(e.target.value)}
                                >
                                    <option>Sick Leave</option>
                                    <option>Casual Leave</option>
                                    <option>Earned Leave</option>
                                </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>From Date</label>
                                    <input 
                                        type="date" 
                                        className="btn btn-secondary" 
                                        style={{ width: "100%", textAlign: "left" }} 
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>To Date</label>
                                    <input 
                                        type="date" 
                                        className="btn btn-secondary" 
                                        style={{ width: "100%", textAlign: "left" }} 
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>Reason for Leave</label>
                                <textarea 
                                    placeholder="Describe the reason for your time-off request..." 
                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", minHeight: "100px", fontSize: "14px", outline: "none", background: "var(--bg-primary)", color: "var(--text-primary)" }} 
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowRequestModal(false)} disabled={submitting}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleApplyLeave} disabled={submitting}>
                                {submitting ? "Submitting..." : "Submit Application"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
