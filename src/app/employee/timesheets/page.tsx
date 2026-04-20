"use client";

import React, { useState, useEffect } from "react";
import { FiFileText, FiDownload, FiCheckSquare, FiClock, FiPlus, FiAlertCircle, FiTrendingUp, FiMoreHorizontal } from "react-icons/fi";
import { motion } from "framer-motion";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function TimesheetsPage() {
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.TIMESHEETS_MY);
                setTimesheets(res.data.data || []);
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950 }}>My Timesheets</h1>
                    <p className="page-subtitle">Track, submit, and review weekly work hour submissions.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" style={{ padding: "12px 24px", fontWeight: 800, borderRadius: "14px" }}>
                        <FiDownload /> DOWNLOAD HISTORICAL
                    </button>
                    <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                        <FiPlus size={18} /> SUBMIT THIS WEEK
                    </button>
                </div>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <StatsCard label="TOTAL HOURS (MAR)" val="164.5h" color="var(--primary)" icon={FiClock} />
                <StatsCard label="APPROVAL RATE" val="94.2%" color="#10b981" icon={FiTrendingUp} />
                <StatsCard label="PENDING SUBMISSION" val="1" color="#f59e0b" icon={FiAlertCircle} />
            </div>

            <div className="card" style={{ padding: "0", border: "1px solid var(--border-light)", overflow: "hidden" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Submission History</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Last updated 2 hours ago</div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {timesheets.map((ts, idx) => (
                            <motion.div 
                                key={ts.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{ 
                                    padding: "20px", borderRadius: "18px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "24px", background: "white",
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)"
                                }}
                            >
                                <div style={{ 
                                    width: "48px", height: "48px", borderRadius: "14px", 
                                    background: "#f8fafc", color: "var(--primary)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid #e2e8f0"
                                }}>
                                    <FiFileText size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>{ts.week}</div>
                                        <span style={{ 
                                            fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px",
                                            background: ts.status === 'Approved' ? '#f0fdf4' : ts.status === 'Rejected' ? '#fef2f2' : '#f1f5f9',
                                            color: ts.status === 'Approved' ? '#10b981' : ts.status === 'Rejected' ? '#ef4444' : '#64748b'
                                        }}>
                                            {ts.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{ts.id} • {ts.sub}</div>
                                </div>
                                <div style={{ textAlign: "right", minWidth: "120px" }}>
                                    <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>{ts.hours}</div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Total Tracked</div>
                                </div>
                                <button className="btn btn-secondary" style={{ padding: "10px", borderRadius: "10px" }}>
                                    <FiMoreHorizontal />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ label, val, color, icon: Icon }: any) {
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
