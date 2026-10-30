"use client";

import React, { useState, useEffect } from "react";
import { FiDownload, FiCheckCircle, FiShield, FiArrowLeft, FiPlus, FiAlertCircle, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

const EMPTY_FORM = { name: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "", documentUrl: "" };

export default function CertificationsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [certs, setCerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.CERTIFICATIONS_MY);
            setCerts(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Certification name is required");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.CERTIFICATIONS, { ...formData, employee: user?._id });
            toast.success("Certification added");
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add certification");
        } finally {
            setSubmitting(false);
        }
    };

    const now = Date.now();
    const soon = now + 60 * 24 * 60 * 60 * 1000;
    const activeCount = certs.filter(c => c.status === 'Active').length;
    const expiringCount = certs.filter(c => c.status === 'Active' && c.expiryDate && new Date(c.expiryDate).getTime() < soon).length;
    const expiredCount = certs.filter(c => c.status === 'Expired').length;

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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Professional Certifications</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Showcase and manage your global industry certifications and internal credentials.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}
                    onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
                >
                    <FiPlus size={18} /> ADD NEW CERTIFICATION
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <CertStat label="ACTIVE CERTS" val={String(activeCount)} color="var(--primary)" icon={FiShield} />
                <CertStat label="EXPIRING SOON" val={String(expiringCount)} color="#f59e0b" icon={FiAlertCircle} />
                <CertStat label="EXPIRED" val={String(expiredCount)} color="#ef4444" icon={FiCheckCircle} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>My Certified Credentials</div>
                </div>
                <div style={{ padding: "24px" }}>
                   {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                   ) : certs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            <FiShield size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ fontWeight: 600 }}>No certifications added yet.</p>
                        </div>
                   ) : (
                   <div className="grid-3" style={{ gap: "24px" }}>
                       {certs.map((cert, idx) => (
                           <motion.div
                               key={cert._id}
                               initial={{ opacity: 0, scale: 0.95 }}
                               animate={{ opacity: 1, scale: 1 }}
                               transition={{ delay: idx * 0.1 }}
                               style={{
                                   padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9",
                                   background: "#f8fafc", position: "relative",
                                   display: "flex", flexDirection: "column", gap: "16px"
                               }}
                           >
                               <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "white", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                                   <FiShield size={24} />
                               </div>
                               <div>
                                   <h4 style={{ fontSize: "16px", fontWeight: 900, color: "#1e293b", minHeight: "44px" }}>{cert.name}</h4>
                                   <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 12px", fontWeight: 600 }}>{cert.issuer}</p>
                                   <div style={{ display: "flex", gap: "12px", fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
                                       {cert.credentialId && <span>ID: {cert.credentialId}</span>}
                                       <span>Exp: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}</span>
                                   </div>
                               </div>
                               <a
                                   href={cert.documentUrl || undefined}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="btn btn-secondary btn-sm"
                                   style={{ width: "100%", fontWeight: 800, borderRadius: "10px", textAlign: "center", opacity: cert.documentUrl ? 1 : 0.5, pointerEvents: cert.documentUrl ? "auto" : "none" }}
                               >
                                   <FiDownload /> {cert.documentUrl ? "VIEW DOCUMENT" : "NO DOCUMENT"}
                               </a>
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
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Add Certification</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Certification Name *</label>
                                <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Issuer</label>
                                <input type="text" className="form-input" value={formData.issuer} onChange={e => setFormData({ ...formData, issuer: e.target.value })} />
                            </div>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Issue Date</label>
                                    <input type="date" className="form-input" value={formData.issueDate} onChange={e => setFormData({ ...formData, issueDate: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Expiry Date</label>
                                    <input type="date" className="form-input" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Credential ID</label>
                                <input type="text" className="form-input" value={formData.credentialId} onChange={e => setFormData({ ...formData, credentialId: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Document Link</label>
                                <input type="url" placeholder="https://..." className="form-input" value={formData.documentUrl} onChange={e => setFormData({ ...formData, documentUrl: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Saving..." : "Add Certification"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function CertStat({ label, val, color, icon: Icon }: any) {
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
            <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={26} />
            </div>
        </div>
    );
}
