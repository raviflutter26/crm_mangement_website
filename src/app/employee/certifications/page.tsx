"use client";

import React, { useState, useEffect } from "react";
import { FiTarget, FiDownload, FiCheckCircle, FiClock, FiShield, FiArrowLeft, FiPlus, FiAlertCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function CertificationsPage() {
    const [certs, setCerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.CERTIFICATIONS_MY);
                setCerts(res.data.data || []);
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Professional Certifications</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Showcase and manage your global industry certifications and internal credentials.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiPlus size={18} /> ADD NEW CERTIFICATION
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <CertStat label="ACTIVE CERTS" val="03" color="var(--primary)" icon={FiShield} />
                <CertStat label="VERIFIED" val="03" color="#10b981" icon={FiCheckCircle} />
                <CertStat label="EXPIRING SOON" val="01" color="#f59e0b" icon={FiAlertCircle} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>My Certified Credentials</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>FY 2026 Inventory</div>
                </div>
                <div style={{ padding: "24px" }}>
                   <div className="grid-3" style={{ gap: "24px" }}>
                       {certs.map((cert, idx) => (
                           <motion.div 
                               key={cert.id}
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
                                       <span>ID: {cert.id}</span>
                                       <span>Exp: {cert.expiry}</span>
                                   </div>
                               </div>
                               <button className="btn btn-secondary btn-sm" style={{ width: "100%", fontWeight: 800, borderRadius: "10px" }}><FiDownload /> DOWNLOAD PDF</button>
                           </motion.div>
                       ))}
                   </div>
                </div>
            </div>
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
