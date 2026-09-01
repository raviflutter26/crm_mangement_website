"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiFileText, FiDownload, FiArrowLeft, FiPlus, FiUpload, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS, API_BASE_URL } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

const DOC_TYPES = ["Form 16", "Form 12BB", "TDS Certificate", "Investment Declaration", "Other"];
const currentFY = () => {
    const now = new Date();
    const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // Indian FY starts April
    return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
};

export default function TaxDocumentsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState(DOC_TYPES[0]);
    const [financialYear, setFinancialYear] = useState(currentFY());
    const [quarter, setQuarter] = useState("");

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.TAX_DOCUMENTS_MY);
            setDocs(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please choose a file");
            return;
        }
        setSubmitting(true);
        try {
            const form = new FormData();
            form.append("file", file);
            form.append("documentType", documentType);
            form.append("financialYear", financialYear);
            if (quarter) form.append("quarter", quarter);
            form.append("employee", user?._id || "");
            await axiosInstance.post(`${API_ENDPOINTS.TAX_DOCUMENTS}/upload`, form, {
                headers: { "Content-Type": undefined },
            });
            toast.success("Document uploaded");
            setShowModal(false);
            setFile(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Upload failed");
        } finally {
            setSubmitting(false);
        }
    };

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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Tax Documents</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Your Form 16, TDS certificates, and investment declarations.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}
                    onClick={() => setShowModal(true)}
                >
                    <FiPlus size={18} /> NEW DOCUMENT
                </button>
            </motion.div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>My Tax Documents</div>
                </div>
                <div style={{ padding: "24px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                    ) : docs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            <FiFileText size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ fontWeight: 600 }}>No tax documents uploaded yet.</p>
                        </div>
                    ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {docs.map((doc, idx) => (
                            <motion.div
                                key={doc._id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{
                                    padding: "20px", borderRadius: "18px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "20px", background: "#f8fafc"
                                }}
                            >
                                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "white", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                                    <FiFileText size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "14px", fontWeight: 800 }}>{doc.documentType}{doc.quarter ? ` — ${doc.quarter}` : ''}</div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", fontWeight: 600 }}>FY {doc.financialYear} • {doc.fileSize || '-'}</div>
                                </div>
                                <span style={{
                                    fontSize: "10px", fontWeight: 800, padding: "4px 10px", borderRadius: "6px",
                                    background: doc.status === 'Verified' ? '#ecfdf5' : doc.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                                    color: doc.status === 'Verified' ? '#10b981' : doc.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                                }}>
                                    {doc.status?.toUpperCase()}
                                </span>
                                {doc.fileUrl && (
                                    <a href={`${API_BASE_URL}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: "10px", borderRadius: "10px" }}>
                                        <FiDownload />
                                    </a>
                                )}
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
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Upload Tax Document</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{ border: "2px dashed #cbd5e1", borderRadius: "16px", padding: "28px", textAlign: "center", cursor: "pointer", background: "#f8fafc" }}
                            >
                                <FiUpload size={24} style={{ color: "var(--primary)", marginBottom: "6px" }} />
                                <div style={{ fontSize: "13px", fontWeight: 700 }}>{file ? file.name : "Click to choose a file"}</div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                    style={{ display: "none" }}
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Document Type</label>
                                <select className="form-input" value={documentType} onChange={e => setDocumentType(e.target.value)}>
                                    {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Financial Year</label>
                                    <input type="text" className="form-input" value={financialYear} onChange={e => setFinancialYear(e.target.value)} placeholder="2025-26" />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Quarter (optional)</label>
                                    <select className="form-input" value={quarter} onChange={e => setQuarter(e.target.value)}>
                                        <option value="">—</option>
                                        <option value="Q1">Q1</option>
                                        <option value="Q2">Q2</option>
                                        <option value="Q3">Q3</option>
                                        <option value="Q4">Q4</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Uploading..." : "Upload"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
