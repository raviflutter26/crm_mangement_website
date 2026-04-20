"use client";

import React, { useState, useEffect } from "react";
import { FiTarget, FiTrendingUp, FiCheckCircle, FiClock, FiActivity, FiArrowLeft, FiPlus, FiBox, FiStar, FiFileText } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function AppraisalsPage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.APPRAISALS);
                setReviews(res.data.data || []);
            } catch (err) { console.error("Fetch error:", err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Performance Appraisals</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Annual and quarterly performance cycles, ratings, and feedback history.</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ background: "white", padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-light)", fontSize: "14px", fontWeight: 800, color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FiStar fill="var(--primary)" /> Top Performer (Q4)
                    </div>
                </div>
            </motion.div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Appraisal History & Records</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>FY 2025 Performance Cycle</div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {reviews.map((rev, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                    padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "24px", background: "#f8fafc"
                                }}
                            >
                                <div style={{ 
                                    width: "56px", height: "56px", borderRadius: "18px", 
                                    background: "white", color: "var(--primary)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid #e2e8f0"
                                }}>
                                    <FiFileText size={28} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ fontSize: "16px", fontWeight: 900, color: "#1e293b" }}>{rev.cycle}</div>
                                        <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "6px", background: "#f0fdf4", color: "#10b981", border: "1px solid #dcfce7" }}>{rev.status.toUpperCase()}</span>
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>Reviewed by {rev.reviewer} • {rev.date}</div>
                                    <p style={{ fontSize: "13px", color: "#1e293b", marginTop: "12px", fontWeight: 600, borderLeft: "3px solid var(--primary)", paddingLeft: "12px" }}>
                                        "{rev.feedback}"
                                    </p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", marginBottom: "4px" }}>RATING</div>
                                    <div style={{ fontSize: "28px", fontWeight: 950, color: "var(--primary)" }}>{rev.rating.split(' / ')[0]}</div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 800 }}>/ 5.0</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
