"use client";

import React, { useState, useEffect } from "react";
import { FiMapPin, FiCalendar, FiBriefcase, FiPlus, FiArrowLeft, FiCheckCircle, FiTag, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

const EMPTY_FORM = {
    type: "Site Visit",
    site: "",
    purpose: "",
    travelDate: new Date().toISOString().slice(0, 10),
    returnDate: "",
    transport: "",
    estimatedCost: 0,
    notes: "",
};

export default function TravelRequestPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.TRAVEL_REQUESTS_MY);
            setRequests(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.site.trim() || !formData.travelDate) {
            toast.error("Site and travel date are required");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.TRAVEL_REQUESTS, { ...formData, employee: user?._id });
            toast.success("Travel request submitted");
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit request");
        } finally {
            setSubmitting(false);
        }
    };

    const totalTrips = requests.length;
    const upcoming = requests.filter(r => r.status === 'Approved' && r.travelDate && new Date(r.travelDate).getTime() > Date.now()).length;
    const approved = requests.filter(r => r.status === 'Approved' || r.status === 'Completed').length;

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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Travel Requests</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Manage site visits, field work travel, and logistical authorizations.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}
                    onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
                >
                    <FiPlus size={18} /> NEW TRAVEL REQUEST
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <TravelStat label="TOTAL TRIPS" val={String(totalTrips)} color="var(--primary)" icon={FiMapPin} />
                <TravelStat label="UPCOMING" val={String(upcoming)} color="#3b82f6" icon={FiCalendar} />
                <TravelStat label="APPROVED" val={String(approved)} color="#10b981" icon={FiCheckCircle} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", overflow: "hidden" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Active & Recent Requests</div>
                </div>
                <div style={{ padding: "24px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                    ) : requests.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            <FiMapPin size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ fontWeight: 600 }}>No travel requests yet.</p>
                        </div>
                    ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {requests.map((req, idx) => (
                            <motion.div
                                key={req._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{
                                    padding: "24px", borderRadius: "20px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "24px",
                                    background: "white", transition: "all 0.3s ease"
                                }}
                                whileHover={{ scale: 1.01, borderColor: "var(--primary)" }}
                            >
                                <div style={{
                                    width: "56px", height: "56px", borderRadius: "18px",
                                    background: req.status === 'Approved' || req.status === 'Completed' ? '#f0fdf4' : req.status === 'Rejected' || req.status === 'Cancelled' ? '#fef2f2' : '#fffbeb',
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: req.status === 'Approved' || req.status === 'Completed' ? '#10b981' : req.status === 'Rejected' || req.status === 'Cancelled' ? '#ef4444' : '#f59e0b',
                                    flexShrink: 0
                                }}>
                                    <FiBriefcase size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>{req.site}</div>
                                        <span style={{
                                            fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px",
                                            background: req.status === 'Approved' || req.status === 'Completed' ? '#dcfce7' : req.status === 'Rejected' || req.status === 'Cancelled' ? '#fee2e2' : '#fef3c7',
                                            color: req.status === 'Approved' || req.status === 'Completed' ? '#10b981' : req.status === 'Rejected' || req.status === 'Cancelled' ? '#ef4444' : '#d97706'
                                        }}>
                                            {req.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{req.purpose}</div>
                                    <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>
                                            <FiTag size={12} /> {req.type}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>
                                            <FiCalendar size={12} /> {req.travelDate ? new Date(req.travelDate).toLocaleDateString() : '-'}
                                        </div>
                                    </div>
                                </div>
                                {req.estimatedCost > 0 && (
                                    <div style={{ textAlign: "right", minWidth: "100px" }}>
                                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", marginBottom: "4px" }}>Est. Cost</div>
                                        <div style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a" }}>₹{req.estimatedCost.toLocaleString()}</div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "32px", maxHeight: "90vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>New Travel Request</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Type</label>
                                <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option>Site Visit</option>
                                    <option>Material Pickup</option>
                                    <option>Client Meeting</option>
                                    <option>Training</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Site *</label>
                                <input required type="text" className="form-input" value={formData.site} onChange={e => setFormData({ ...formData, site: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Purpose</label>
                                <input type="text" className="form-input" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
                            </div>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Travel Date *</label>
                                    <input required type="date" className="form-input" value={formData.travelDate} onChange={e => setFormData({ ...formData, travelDate: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Return Date</label>
                                    <input type="date" className="form-input" value={formData.returnDate} onChange={e => setFormData({ ...formData, returnDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Transport</label>
                                    <input type="text" placeholder="e.g. Company car" className="form-input" value={formData.transport} onChange={e => setFormData({ ...formData, transport: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Est. Cost (₹)</label>
                                    <input type="number" min={0} className="form-input" value={formData.estimatedCost} onChange={e => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Notes</label>
                                <textarea className="form-input" rows={3} style={{ resize: "none" }} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Submitting..." : "Submit Request"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function TravelStat({ label, val, color, icon: Icon }: any) {
    return (
        <div style={{
            background: "white", padding: "28px", borderRadius: "24px",
            border: "1px solid var(--border-light)", display: "flex",
            justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
        }}>
            <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1.5px", marginBottom: "8px", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "32px", fontWeight: 950, color: "#0f172a" }}>{val}</div>
            </div>
            <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={28} />
            </div>
        </div>
    );
}
