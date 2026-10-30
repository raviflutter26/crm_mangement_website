"use client";

import React, { useState, useEffect } from "react";
import { FiBriefcase, FiMapPin, FiPlus, FiArrowLeft, FiCheckCircle, FiTrendingUp, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

const now = new Date();
const EMPTY_FORM = {
    type: "Site Daily Allowance",
    site: "",
    days: 1,
    rate: 0,
    period: { month: now.getMonth() + 1, year: now.getFullYear() },
};

export default function AllowancePage() {
    const { user } = useAuth();
    const toast = useToast();
    const [claims, setClaims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.SITE_ALLOWANCES_MY);
            setClaims(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.site.trim() || !formData.rate) {
            toast.error("Site and rate are required");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.SITE_ALLOWANCES, { ...formData, employee: user?._id });
            toast.success("Allowance claim submitted");
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit claim");
        } finally {
            setSubmitting(false);
        }
    };

    const thisMonthTotal = claims
        .filter(c => c.period?.month === now.getMonth() + 1 && c.period?.year === now.getFullYear())
        .reduce((s, c) => s + (c.totalAmount || 0), 0);
    const totalSiteDays = claims.reduce((s, c) => s + (c.days || 0), 0);
    const processedCount = claims.filter(c => c.status === 'Processed').length;
    const approvalRate = claims.length ? Math.round((processedCount / claims.length) * 100) : null;

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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Site Allowances</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Claim special field-duty, night-shift, and site-specific hardship allowances.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}
                    onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
                >
                    <FiPlus size={18} /> NEW ALLOWANCE CLAIM
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <AllowanceStat label="CURRENT MONTH" val={`₹${thisMonthTotal.toLocaleString()}`} color="var(--primary)" icon={FiBriefcase} />
                <AllowanceStat label="TOTAL SITE DAYS" val={`${totalSiteDays} Days`} color="#3b82f6" icon={FiMapPin} />
                <AllowanceStat label="PROCESSED RATE" val={approvalRate === null ? "—" : `${approvalRate}%`} color="#10b981" icon={FiCheckCircle} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Allowance Claim History</div>
                </div>
                <div style={{ padding: "24px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                    ) : claims.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            <FiBriefcase size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ fontWeight: 600 }}>No claims filed yet.</p>
                        </div>
                    ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {claims.map((claim, idx) => (
                            <motion.div
                                key={claim._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{
                                    padding: "20px", borderRadius: "18px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "20px", background: "#f8fafc"
                                }}
                            >
                                <div style={{
                                    width: "48px", height: "48px", borderRadius: "14px",
                                    background: "white", color: "var(--primary)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid #e2e8f0"
                                }}>
                                    <FiTrendingUp size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>{claim.type}</div>
                                        <span style={{
                                            fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
                                            background: claim.status === 'Processed' ? '#dcfce7' : claim.status === 'Rejected' ? '#fef2f2' : '#fef3c7',
                                            color: claim.status === 'Processed' ? '#10b981' : claim.status === 'Rejected' ? '#ef4444' : '#d97706'
                                        }}>
                                            {claim.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{claim.site} • {claim.days} Days @ ₹{claim.rate}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "18px", fontWeight: 950, color: "#0f172a" }}>₹{(claim.totalAmount || claim.days * claim.rate).toLocaleString()}</div>
                                </div>
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
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>New Allowance Claim</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Type</label>
                                <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option>Site Daily Allowance</option>
                                    <option>Night Shift Allowance</option>
                                    <option>Hazard Pay</option>
                                    <option>Remote Area Allowance</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Site *</label>
                                <input required type="text" className="form-input" value={formData.site} onChange={e => setFormData({ ...formData, site: e.target.value })} />
                            </div>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Days</label>
                                    <input type="number" min={1} className="form-input" value={formData.days} onChange={e => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Rate per Day (₹) *</label>
                                    <input required type="number" min={0} className="form-input" value={formData.rate} onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Submitting..." : "Submit Claim"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function AllowanceStat({ label, val, color, icon: Icon }: any) {
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
