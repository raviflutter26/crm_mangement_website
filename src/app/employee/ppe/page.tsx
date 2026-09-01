"use client";

import React, { useState, useEffect } from "react";
import { FiPackage, FiShield, FiCheckCircle, FiArrowLeft, FiAlertTriangle, FiPlus, FiClock, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

export default function PpePage() {
    const toast = useToast();
    const [kit, setKit] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedId, setSelectedId] = useState("");
    const [reason, setReason] = useState("");

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.PPE_RECORDS_MY);
            setKit(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId) {
            toast.error("Select an item to request a replacement for");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.put(`${API_ENDPOINTS.PPE_RECORDS}/${selectedId}`, { condition: "Damaged", notes: reason });
            toast.success("Replacement requested");
            setShowModal(false);
            setSelectedId("");
            setReason("");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit request");
        } finally {
            setSubmitting(false);
        }
    };

    const issuedCount = kit.filter(k => k.status === 'Issued').length;
    const needsAttention = kit.filter(k => k.condition === 'Wear Detected' || k.condition === 'Damaged').length;
    const upcomingInspections = kit
        .map(k => k.nextInspection ? new Date(k.nextInspection).getTime() : null)
        .filter((t): t is number => t !== null && t > Date.now())
        .sort((a, b) => a - b);
    const nextInspectionDays = upcomingInspections.length
        ? Math.ceil((upcomingInspections[0] - Date.now()) / (1000 * 60 * 60 * 24))
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
                    <Link href="/employee/dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>PPE & Tools Checklist</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Track your assigned Personal Protective Equipment and shop-floor tools inventory.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}
                    onClick={() => { setSelectedId(""); setReason(""); setShowModal(true); }}
                >
                    <FiPlus size={18} /> REQUEST REPLACEMENT
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <PpeStat label="ITEMS ISSUED" val={String(issuedCount)} color="var(--primary)" icon={FiPackage} />
                <PpeStat label="NEEDS ATTENTION" val={String(needsAttention)} color="#f59e0b" icon={FiAlertTriangle} />
                <PpeStat label="NEXT INSPECTION" val={nextInspectionDays === null ? "—" : `${nextInspectionDays} Days`} color="#3b82f6" icon={FiClock} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>My Inventory & Gear</div>
                </div>
                <div style={{ padding: "24px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                    ) : kit.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            <FiShield size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ fontWeight: 600 }}>No PPE items assigned yet.</p>
                        </div>
                    ) : (
                    <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        {kit.map((item, idx) => (
                            <motion.div
                                key={item._id || idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{
                                    padding: "20px", borderRadius: "20px", border: "1px solid #f1f5f9",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    background: item.condition === 'Wear Detected' || item.condition === 'Damaged' ? '#fff7ed' : '#ffffff'
                                }}
                            >
                                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                    <div style={{
                                        width: "44px", height: "44px", borderRadius: "12px",
                                        background: item.condition === 'Wear Detected' || item.condition === 'Damaged' ? '#ffedd5' : '#f8fafc',
                                        color: item.condition === 'Wear Detected' || item.condition === 'Damaged' ? 'var(--primary)' : '#64748b',
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        <FiShield size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>{item.item}</div>
                                        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>Issued: {item.issueDate ? new Date(item.issueDate).toLocaleDateString() : '-'}</div>
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px",
                                    background: item.condition === 'Wear Detected' || item.condition === 'Damaged' ? '#fde68a' : '#f1f5f9',
                                    color: item.condition === 'Wear Detected' || item.condition === 'Damaged' ? '#92400e' : '#64748b'
                                }}>
                                    {(item.condition || 'New').toUpperCase()}
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
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Request Replacement</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Item *</label>
                                <select required className="form-input" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                                    <option value="">Select item...</option>
                                    {kit.map((item: any) => (
                                        <option key={item._id} value={item._id}>{item.item}{item.serialNumber ? ` (${item.serialNumber})` : ""}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Reason</label>
                                <textarea className="form-input" rows={3} style={{ resize: "none" }} value={reason} onChange={e => setReason(e.target.value)} placeholder="What's wrong with it?" />
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

function PpeStat({ label, val, color, icon: Icon }: any) {
    return (
        <div style={{
            background: "white", padding: "24px", borderRadius: "20px",
            border: "1px solid var(--border-light)", display: "flex",
            justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
        }}>
            <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "28px", fontWeight: 950, color: "#0f172a" }}>{val}</div>
            </div>
            <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={26} />
            </div>
        </div>
    );
}
