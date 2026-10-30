"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiFileText, FiDownload, FiFolder, FiSearch, FiArrowLeft, FiPlus, FiClock, FiShield, FiX, FiUpload } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS, API_BASE_URL } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

const CATEGORIES = ["Personal", "Corporate", "Operations", "Compliance", "Tax", "Other"];

export default function DocumentsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [docName, setDocName] = useState("");
    const [category, setCategory] = useState("Personal");

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.EMPLOYEE_DOCUMENTS_MY);
            setDocuments(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
        if (f && !docName) setDocName(f.name.replace(/\.[^/.]+$/, ""));
    };

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
            form.append("name", docName || file.name);
            form.append("category", category);
            form.append("employee", user?._id || "");
            await axiosInstance.post(`${API_ENDPOINTS.EMPLOYEE_DOCUMENTS}/upload`, form, {
                headers: { "Content-Type": undefined },
            });
            toast.success("Document uploaded");
            setShowModal(false);
            setFile(null);
            setDocName("");
            setCategory("Personal");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Upload failed");
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = documents.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()));
    const countByCategory = (cats: string[]) => documents.filter(d => cats.includes(d.category)).length;

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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>My Documents</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Secure digital vault for your employment records, IDs, and site-specific manuals.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}
                    onClick={() => setShowModal(true)}
                >
                    <FiPlus size={18} /> UPLOAD NEW DOCUMENT
                </button>
            </motion.div>

            <div className="grid-4" style={{ marginBottom: "32px", gap: "24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                <FolderStat label="PERSONAL" count={`${countByCategory(["Personal"])} Files`} color="var(--primary)" icon={FiFolder} />
                <FolderStat label="CORPORATE" count={`${countByCategory(["Corporate"])} Files`} color="#3b82f6" icon={FiShield} />
                <FolderStat label="OPERATIONS" count={`${countByCategory(["Operations"])} Files`} color="#10b981" icon={FiFileText} />
                <FolderStat label="COMPLIANCE" count={`${countByCategory(["Compliance", "Tax"])} Files`} color="#94a3b8" icon={FiClock} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                        <div style={{ position: "relative", flex: 0.5 }}>
                            <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                            <input
                                type="text"
                                placeholder="Search vault..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px" }}
                            />
                        </div>
                    </div>
                </div>
                <div style={{ padding: "24px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            <FiFileText size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ fontWeight: 600 }}>{documents.length === 0 ? "No documents uploaded yet." : "No documents match your search."}</p>
                        </div>
                    ) : (
                    <div className="grid-2" style={{ gap: "16px" }}>
                        {filtered.map((doc, idx) => (
                            <motion.div
                                key={doc._id || idx}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{
                                    padding: "20px", borderRadius: "20px", border: "1px solid #f1f5f9",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    background: "#f8fafc", transition: "all 0.3s ease"
                                }}
                                whileHover={{ scale: 1.01, borderColor: "var(--primary)", background: "white" }}
                            >
                                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "white", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                                        <FiFileText size={24} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>{doc.name}</div>
                                        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 800, marginTop: "4px" }}>
                                           {doc.type} • {doc.size} • Uploaded {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '-'}
                                        </div>
                                    </div>
                                </div>
                                <a
                                    href={doc.fileUrl ? `${API_BASE_URL}${doc.fileUrl}` : undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    style={{ borderRadius: "10px", padding: "8px" }}
                                >
                                    <FiDownload />
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
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Upload Document</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: "2px dashed #cbd5e1", borderRadius: "16px", padding: "32px",
                                    textAlign: "center", cursor: "pointer", background: "#f8fafc",
                                }}
                            >
                                <FiUpload size={28} style={{ color: "var(--primary)", marginBottom: "8px" }} />
                                <div style={{ fontSize: "13px", fontWeight: 700 }}>{file ? file.name : "Click to choose a file"}</div>
                                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>PDF, image, Word or Excel — up to 10MB</div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Document Name</label>
                                <input type="text" className="form-input" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Aadhaar Card" />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Category</label>
                                <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
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

function FolderStat({ label, count, color, icon: Icon }: any) {
    return (
        <div style={{
            background: "white", padding: "20px", borderRadius: "20px",
            border: "1px solid var(--border-light)", textAlign: "center",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)"
        }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon size={24} />
            </div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px" }}>{label}</div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#1e293b", marginTop: "4px" }}>{count}</div>
        </div>
    );
}
