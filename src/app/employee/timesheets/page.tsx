"use client";

import React, { useState, useEffect } from "react";
import { FiFileText, FiClock, FiPlus, FiAlertCircle, FiTrendingUp, FiX, FiTrash2 } from "react-icons/fi";
import { motion } from "framer-motion";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

function mondayOf(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function toISODate(d: Date) {
    return d.toISOString().slice(0, 10);
}

const thisWeekStart = mondayOf(new Date());

export default function TimesheetsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState("");
    const [entries, setEntries] = useState<any[]>([{ date: toISODate(thisWeekStart), hours: 8, task: "", site: "" }]);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.TIMESHEETS_MY);
            setTimesheets(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const addEntry = () => setEntries([...entries, { date: toISODate(thisWeekStart), hours: 8, task: "", site: "" }]);
    const removeEntry = (idx: number) => setEntries(entries.filter((_, i) => i !== idx));
    const updateEntry = (idx: number, field: string, value: any) => {
        const next = [...entries];
        next[idx] = { ...next[idx], [field]: value };
        setEntries(next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const totalHours = entries.reduce((s, en) => s + (parseFloat(en.hours) || 0), 0);
        if (totalHours <= 0) {
            toast.error("Add at least one entry with hours");
            return;
        }
        const weekEnd = new Date(thisWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.TIMESHEETS, {
                employee: user?._id,
                weekStart: thisWeekStart.toISOString(),
                weekEnd: weekEnd.toISOString(),
                totalHours,
                overtimeHours: Math.max(0, totalHours - 40),
                status: "Submitted",
                notes,
                entries,
            });
            toast.success("Timesheet submitted");
            setShowModal(false);
            setNotes("");
            setEntries([{ date: toISODate(thisWeekStart), hours: 8, task: "", site: "" }]);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit timesheet");
        } finally {
            setSubmitting(false);
        }
    };

    const now = new Date();
    const monthTotal = timesheets
        .filter(ts => ts.weekStart && new Date(ts.weekStart).getMonth() === now.getMonth() && new Date(ts.weekStart).getFullYear() === now.getFullYear())
        .reduce((s, ts) => s + (ts.totalHours || 0), 0);
    const decided = timesheets.filter(ts => ts.status === 'Approved' || ts.status === 'Rejected');
    const approvalRate = decided.length ? Math.round((decided.filter(ts => ts.status === 'Approved').length / decided.length) * 100) : null;
    const hasThisWeek = timesheets.some(ts => ts.weekStart && toISODate(new Date(ts.weekStart)) === toISODate(thisWeekStart));

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)' }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header"
                style={{ marginBottom: "32px" }}
            >
                <div>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950 }}>My Timesheets</h1>
                    <p className="page-subtitle">Track, submit, and review weekly work hour submissions.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-primary"
                        style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}
                        onClick={() => setShowModal(true)}
                        disabled={hasThisWeek}
                        title={hasThisWeek ? "Already submitted for this week" : undefined}
                    >
                        <FiPlus size={18} /> {hasThisWeek ? "SUBMITTED THIS WEEK" : "SUBMIT THIS WEEK"}
                    </button>
                </div>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <StatsCard label="TOTAL HOURS (THIS MONTH)" val={`${monthTotal.toFixed(1)}h`} color="var(--primary)" icon={FiClock} />
                <StatsCard label="APPROVAL RATE" val={approvalRate === null ? "—" : `${approvalRate}%`} color="#10b981" icon={FiTrendingUp} />
                <StatsCard label="PENDING SUBMISSION" val={hasThisWeek ? "0" : "1"} color="#f59e0b" icon={FiAlertCircle} />
            </div>

            <div className="card" style={{ padding: "0", border: "1px solid var(--border-light)", overflow: "hidden" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Submission History</div>
                </div>
                <div style={{ padding: "24px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                    ) : timesheets.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            <FiFileText size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ fontWeight: 600 }}>No timesheets submitted yet.</p>
                        </div>
                    ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {timesheets.map((ts, idx) => (
                            <motion.div
                                key={ts._id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{
                                    padding: "20px", borderRadius: "18px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "24px", background: "white",
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)"
                                }}
                            >
                                <div style={{
                                    width: "48px", height: "48px", borderRadius: "14px",
                                    background: "#f8fafc", color: "var(--primary)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid #e2e8f0"
                                }}>
                                    <FiFileText size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>
                                            {ts.weekStart ? new Date(ts.weekStart).toLocaleDateString() : '-'} — {ts.weekEnd ? new Date(ts.weekEnd).toLocaleDateString() : '-'}
                                        </div>
                                        <span style={{
                                            fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px",
                                            background: ts.status === 'Approved' ? '#f0fdf4' : ts.status === 'Rejected' ? '#fef2f2' : '#f1f5f9',
                                            color: ts.status === 'Approved' ? '#10b981' : ts.status === 'Rejected' ? '#ef4444' : '#64748b'
                                        }}>
                                            {ts.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{ts.entries?.length || 0} entries{ts.notes ? ` • ${ts.notes}` : ''}</div>
                                </div>
                                <div style={{ textAlign: "right", minWidth: "120px" }}>
                                    <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>{ts.totalHours}h</div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Total Tracked</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "560px", padding: "32px", maxHeight: "90vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Submit This Week</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "-12px", marginBottom: "20px" }}>
                            Week of {thisWeekStart.toLocaleDateString()}
                        </p>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {entries.map((en, idx) => (
                                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 1fr 1fr auto", gap: "8px", alignItems: "end" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "11px", fontWeight: 700 }}>Date</label>
                                        <input type="date" className="form-input" value={en.date} onChange={e => updateEntry(idx, 'date', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "11px", fontWeight: 700 }}>Hrs</label>
                                        <input type="number" min={0} max={24} className="form-input" value={en.hours} onChange={e => updateEntry(idx, 'hours', parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "11px", fontWeight: 700 }}>Task</label>
                                        <input type="text" className="form-input" value={en.task} onChange={e => updateEntry(idx, 'task', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "11px", fontWeight: 700 }}>Site</label>
                                        <input type="text" className="form-input" value={en.site} onChange={e => updateEntry(idx, 'site', e.target.value)} />
                                    </div>
                                    <button type="button" className="btn btn-secondary" style={{ padding: "10px", color: "#ef4444" }} onClick={() => removeEntry(idx)} disabled={entries.length === 1}>
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="btn btn-secondary" style={{ alignSelf: "flex-start", fontSize: "12px", fontWeight: 700 }} onClick={addEntry}>
                                <FiPlus size={14} /> Add Day
                            </button>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Notes</label>
                                <textarea className="form-input" rows={2} style={{ resize: "none" }} value={notes} onChange={e => setNotes(e.target.value)} />
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Submitting..." : "Submit Timesheet"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatsCard({ label, val, color, icon: Icon }: any) {
    return (
        <div style={{
            background: "white", padding: "24px", borderRadius: "20px",
            border: "1px solid var(--border-light)", display: "flex",
            justifyContent: "space-between", alignItems: "center"
        }}>
            <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", marginBottom: "8px" }}>{label}</div>
                <div style={{ fontSize: "28px", fontWeight: 950, color: "#0f172a" }}>{val}</div>
            </div>
            <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={24} />
            </div>
        </div>
    );
}
