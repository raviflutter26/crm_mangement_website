"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiDownload, FiFilter, FiCalendar, FiClock, FiActivity, FiArrowLeft, FiEdit3 } from "react-icons/fi";
import Link from "next/link";

// Components
import EmployeeAttendanceTable from "@/components/attendance/EmployeeAttendanceTable";

/** Start/end of the selected filter window, in local time. */
function rangeFor(filter: string): { start: Date; end: Date } {
    const now = new Date();
    if (filter === "last_month") {
        return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) };
    }
    if (filter === "last_30_days") {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
    }
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
}

const toLocalInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function EmployeeAttendancePage() {
    const [records, setRecords] = useState<any[]>([]);
    const [rawRecords, setRawRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRange, setFilterRange] = useState("this_month");
    const [refreshKey, setRefreshKey] = useState(0);

    // Regularization request form
    const [showRegularize, setShowRegularize] = useState(false);
    const [regForm, setRegForm] = useState({ date: "", checkIn: "09:00", checkOut: "18:00", reason: "" });
    const [regSubmitting, setRegSubmitting] = useState(false);
    const [regMessage, setRegMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const { start, end } = rangeFor(filterRange);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const { start, end } = rangeFor(filterRange);
                const res = await axiosInstance.get(API_ENDPOINTS.ATTENDANCE, {
                    params: { startDate: start.toISOString(), endDate: end.toISOString() },
                });
                const rawData = res.data.data || [];
                setRawRecords(rawData);
                const mapped = rawData.map((rec: any) => ({
                    date: rec.date,
                    status: rec.status,
                    firstIn: rec.checkIn,
                    lastOut: rec.checkOut,
                    totalHours: rec.totalHours || 0,
                    breakTime: rec.breakDuration || 0,
                    overtime: Math.max(0, (rec.totalHours || 0) - 9)
                }));
                setRecords(mapped);
            } catch (err) {
                console.error("Failed to fetch attendance history", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [filterRange, refreshKey]);

    const totalHours = rawRecords.reduce((acc, r) => acc + (r.totalHours || 0), 0);
    const stats = [
        { label: "Total Days", value: records.length, icon: FiCalendar, color: "var(--primary)" },
        { label: "Present", value: records.filter(r => r.status === "Present" || r.status === "WFH").length, icon: FiActivity, color: "#10b981" },
        { label: "Late Days", value: rawRecords.filter(r => r.isLate).length, icon: FiClock, color: "#f59e0b" },
        { label: "Working Hours", value: `${totalHours.toFixed(1)}h`, icon: FiActivity, color: "#3b82f6" },
    ];

    const regularizations = rawRecords.filter(r => r.regularizationStatus && r.regularizationStatus !== "none");

    const submitRegularization = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegSubmitting(true);
        setRegMessage(null);
        try {
            // Times are entered as local wall-clock times on the chosen day.
            const at = (hhmm: string) => (hhmm ? new Date(`${regForm.date}T${hhmm}:00`).toISOString() : undefined);
            await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_REGULARIZE, {
                date: regForm.date,
                checkIn: at(regForm.checkIn),
                checkOut: at(regForm.checkOut),
                reason: regForm.reason,
            });
            setRegMessage({ type: "success", text: "Regularization request submitted for approval." });
            setShowRegularize(false);
            setRegForm({ date: "", checkIn: "09:00", checkOut: "18:00", reason: "" });
            setRefreshKey(k => k + 1);
        } catch (err: any) {
            setRegMessage({ type: "error", text: err.response?.data?.message || "Could not submit the request." });
        } finally {
            setRegSubmitting(false);
        }
    };

    return (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* High Density Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                        <Link href="/dashboard" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                            <FiArrowLeft size={18} />
                        </Link>
                        <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>Attendance History</h1>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, marginLeft: "30px" }}>
                        Detailed logs and performance metrics for your current work cycle.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary btn-sm" onClick={() => { setRegMessage(null); setShowRegularize(true); }}><FiEdit3 /> Request Regularization</button>
                    <button className="btn btn-secondary btn-sm"><FiDownload /> Export Report</button>
                    <div style={{ position: "relative" }}>
                        <select 
                            className="btn btn-secondary btn-sm" 
                            value={filterRange}
                            onChange={(e) => setFilterRange(e.target.value)}
                            style={{ paddingRight: "32px", appearance: "none" }}
                        >
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="last_30_days">Last 30 Days</option>
                        </select>
                        <FiFilter style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5 }} />
                    </div>
                </div>
            </div>

            {/* Compact Stats Strip */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card" style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <stat.icon size={16} />
                            </div>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)" }}>{stat.value}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {regMessage && (
                <div className="card" style={{ padding: "12px 16px", borderLeft: `4px solid ${regMessage.type === "success" ? "#10b981" : "#ef4444"}`, fontSize: "13px", fontWeight: 600 }}>
                    {regMessage.text}
                </div>
            )}

            {regularizations.length > 0 && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">My Regularization Requests</h3></div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Date</th><th>Reason</th><th>Requested</th><th>Status</th></tr></thead>
                            <tbody>
                                {regularizations.map((r: any) => (
                                    <tr key={r._id}>
                                        <td>{new Date(r.date).toLocaleDateString()}</td>
                                        <td style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.regularizedReason}>{r.regularizedReason}</td>
                                        <td style={{ fontSize: "12px" }}>
                                            {r.requestedCheckIn ? new Date(r.requestedCheckIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                                            {" – "}
                                            {r.requestedCheckOut ? new Date(r.requestedCheckOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                                        </td>
                                        <td><span className={`badge ${r.regularizationStatus === "approved" ? "active" : r.regularizationStatus === "rejected" ? "inactive" : "pending"}`}>{r.regularizationStatus}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showRegularize && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div className="card animate-in" style={{ width: "100%", maxWidth: "480px", padding: "24px" }}>
                        <h2 style={{ marginBottom: "16px", fontSize: "18px" }}>Request Attendance Regularization</h2>
                        <form onSubmit={submitRegularization} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <label style={{ fontSize: "13px", fontWeight: 700 }}>
                                Date
                                <input type="date" required max={toLocalInput(new Date())} value={regForm.date} onChange={e => setRegForm({ ...regForm, date: e.target.value })} className="form-input" style={{ width: "100%", marginTop: "6px" }} />
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <label style={{ fontSize: "13px", fontWeight: 700 }}>
                                    Check-in
                                    <input type="time" value={regForm.checkIn} onChange={e => setRegForm({ ...regForm, checkIn: e.target.value })} className="form-input" style={{ width: "100%", marginTop: "6px" }} />
                                </label>
                                <label style={{ fontSize: "13px", fontWeight: 700 }}>
                                    Check-out
                                    <input type="time" value={regForm.checkOut} onChange={e => setRegForm({ ...regForm, checkOut: e.target.value })} className="form-input" style={{ width: "100%", marginTop: "6px" }} />
                                </label>
                            </div>
                            <label style={{ fontSize: "13px", fontWeight: 700 }}>
                                Reason
                                <textarea required rows={3} value={regForm.reason} onChange={e => setRegForm({ ...regForm, reason: e.target.value })} className="form-input" style={{ width: "100%", marginTop: "6px", resize: "none" }} />
                            </label>
                            {regMessage?.type === "error" && <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>{regMessage.text}</div>}
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRegularize(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={regSubmitting}>{regSubmitting ? "Submitting..." : "Submit Request"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Card */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Detailed Records</h3>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                        Current Period: <span style={{ color: "var(--text-primary)" }}>{start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - {end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <EmployeeAttendanceTable records={records} loading={loading} />
                </div>
            </div>
        </div>
    );
}
