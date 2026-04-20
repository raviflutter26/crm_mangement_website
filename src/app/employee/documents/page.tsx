"use client";

import React, { useState } from "react";
import { FiFileText, FiDownload, FiFolder, FiSearch, FiArrowLeft, FiPlus, FiGrid, FiList, FiClock, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.EMPLOYEE_DOCUMENTS_MY);
                setDocuments(res.data.data || []);
            } catch (err) { console.error("Fetch error:", err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [])

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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>My Documents</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Secure digital vault for your employment records, IDs, and site-specific manuals.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiPlus size={18} /> UPLOAD NEW DOCUMENT
                </button>
            </motion.div>

            <div className="grid-4" style={{ marginBottom: "32px", gap: "24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                <FolderStat label="PERSONAL" count="08 Files" color="var(--primary)" icon={FiFolder} />
                <FolderStat label="CORPORATE" count="12 Files" color="#3b82f6" icon={FiShield} />
                <FolderStat label="OPERATIONS" count="24 Files" color="#10b981" icon={FiFileText} />
                <FolderStat label="HISTORY" count="04 Files" color="#94a3b8" icon={FiClock} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                        <div style={{ position: "relative", flex: 0.5 }}>
                            <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                            <input 
                                type="text" 
                                placeholder="Search vault..." 
                                style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px" }} 
                            />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                       <button className="btn btn-secondary btn-sm"><FiList /></button>
                       <button className="btn btn-secondary btn-sm"><FiGrid /></button>
                    </div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div className="grid-2" style={{ gap: "16px" }}>
                        {documents.map((doc, idx) => (
                            <motion.div 
                                key={idx}
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
                                           {doc.type} • {doc.size} • Updated {doc.date}
                                        </div>
                                    </div>
                                </div>
                                <button className="btn btn-secondary btn-sm" style={{ borderRadius: "10px", padding: "8px" }}><FiDownload /></button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
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
