"use client";

import React, { useState, useEffect } from "react";
import { FiAlertTriangle, FiPlus, FiArrowLeft, FiClock, FiFileText, FiActivity, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

const EMPTY_FORM = {
    type: "Hazard Report",
    site: "",
    description: "",
    severity: "Medium",
    date: new Date().toISOString().slice(0, 10),
};

export default function IncidentPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.INCIDENTS_MY);
            setIncidents(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.site.trim()) {
            toast.error("Site is required");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.INCIDENTS, { ...formData, reportedBy: user?._id });
            toast.success("Incident reported");
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to report incident");
        } finally {
            setSubmitting(false);
        }
    };

    const thisYear = new Date().getFullYear();
    const reportsYTD = incidents.filter(i => new Date(i.date).getFullYear() === thisYear).length;
    const underReview = incidents.filter(i => i.status === 'Reported' || i.status === 'In-Progress').length;
    const lastInjury = incidents
        .filter(i => i.type === 'Injury')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const daysLtiFree = lastInjury
        ? Math.floor((Date.now() - new Date(lastInjury.date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)' }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header"
                style={{ marginBottom: "32px" }}
            >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <Link href="/dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Incident & Hazard Reports</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Report workplace hazards, near misses, or safety incidents immediately to the HSEQ team.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px", background: "#ef4444", border: "none" }}
                    onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
                >
                    <FiPlus size={18} /> REPORT AN INCIDENT
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <IncidentStat label="REPORTS (YTD)" val={String(reportsYTD)} color="#ef4444" icon={FiAlertTriangle} />
                <IncidentStat label="UNDER REVIEW" val={String(underReview)} color="#f59e0b" icon={FiClock} />
                <IncidentStat label="DAYS LTI FREE" val={daysLtiFree === null ? "—" : String(daysLtiFree)} color="#10b981" icon={FiActivity} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>My Safety Reports</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Real-time HSEQ Tracking</div>
                </div>
                <div style={{ padding: "24px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                    ) : incidents.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            <FiAlertTriangle size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ fontWeight: 600 }}>No reports filed yet.</p>
                        </div>
                    ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {incidents.map((inc, idx) => (
                            <motion.div
                                key={inc._id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{
                                    padding: "20px", borderRadius: "18px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "20px", background: "white",
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)"
                                }}
                            >
                                <div style={{
                                    width: "48px", height: "48px", borderRadius: "12px",
                                    background: inc.status === 'Resolved' || inc.status === 'Closed' ? '#f0fdf4' : '#fffbeb',
                                    color: inc.status === 'Resolved' || inc.status === 'Closed' ? '#10b981' : '#f59e0b',
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid #e2e8f0"
                                }}>
                                    <FiAlertTriangle size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>{inc.type}</div>
                                        <span style={{
                                            fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
                                            background: inc.severity === 'Low' ? '#f0fdf4' : '#fef2f2',
                                            color: inc.severity === 'Low' ? '#10b981' : '#ef4444'
                                        }}>
                                            {(inc.severity || 'Medium').toUpperCase()} PRIORITY
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{inc.site} • {inc.date ? new Date(inc.date).toLocaleDateString() : '-'}</div>
                                </div>
                                <div style={{ textAlign: "right", minWidth: "120px" }}>
                                    <div style={{ fontSize: "11px", fontWeight: 800, color: inc.status === 'Resolved' || inc.status === 'Closed' ? '#10b981' : '#f59e0b', textTransform: "uppercase" }}>{inc.status}</div>
                                </div>
                                <button className="btn btn-secondary btn-sm" style={{ padding: "8px", borderRadius: "8px" }} title={inc.description || "No additional description"}><FiFileText /></button>
                            </motion.div>
                        ))}
                    </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "32px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Report an Incident</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Type</label>
                                    <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option>Near Miss</option>
                                        <option>Hazard Report</option>
                                        <option>Injury</option>
                                        <option>Property Damage</option>
                                        <option>Environmental</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Severity</label>
                                    <select className="form-input" value={formData.severity} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Site *</label>
                                <input required type="text" className="form-input" value={formData.site} onChange={e => setFormData({ ...formData, site: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Date</label>
                                <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Description</label>
                                <textarea className="form-input" rows={4} style={{ resize: "none" }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="What happened?" />
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2, background: "#ef4444", border: "none" }} disabled={submitting}>{submitting ? "Submitting..." : "Submit Report"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function IncidentStat({ label, val, color, icon: Icon }: any) {
    return (
        <div style={{
            background: "white", padding: "24px", borderRadius: "20px",
            border: "1px solid var(--border-light)", display: "flex",
            justifyContent: "space-between", alignItems: "center"
        }}>
            <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "28px", fontWeight: 950, color: "#0f172a" }}>{val}</div>
            </div>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={28} />
            </div>
        </div>
    );
}
