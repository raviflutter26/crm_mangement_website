"use client";

import React, { useState, useEffect } from "react";
import { FiTarget, FiTrendingUp, FiCheckCircle, FiClock, FiActivity, FiArrowLeft, FiPlus, FiBox } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function TargetsPage() {
    const [targets, setTargets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.GOALS);
                setTargets(res.data.data || []);
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>My Targets & KPIs</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Monitor your professional goals, performance metrics, and operational targets.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiPlus size={18} /> SET NEW GOAL
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <TargetStat label="KPI ACHIEVEMENT" val="88%" color="var(--primary)" icon={FiTrendingUp} />
                <TargetStat label="GOALS ACTIVE" val="04" color="#3b82f6" icon={FiTarget} />
                <TargetStat label="BONUS ELIGIBILITY" val="Tier 1" color="#10b981" icon={FiCheckCircle} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Operational KPI Matrix</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>FY 2026 - Q1 Performance</div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div className="grid-2" style={{ gap: "24px" }}>
                        {targets.map((target, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                    padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9",
                                    background: "#f8fafc", display: "flex", flexDirection: "column", gap: "20px"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "white", color: target.color, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                                            <FiBox size={20} />
                                        </div>
                                        <h4 style={{ fontSize: "15px", fontWeight: 900, color: "#1e293b" }}>{target.name}</h4>
                                    </div>
                                    <span style={{ 
                                        fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px",
                                        background: target.status === 'Completed' ? '#dcfce7' : target.status === 'Critical' ? '#fee2e2' : '#f1f5f9',
                                        color: target.status === 'Completed' ? '#10b981' : target.status === 'Critical' ? '#ef4444' : '#64748b'
                                    }}>
                                        {target.status.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 800, marginBottom: "8px" }}>
                                        <span>PROGRESS: {target.current} / {target.goal} {target.unit}</span>
                                        <span>{Math.round((target.current / target.goal) * 100)}%</span>
                                    </div>
                                    <div style={{ height: "10px", background: "white", borderRadius: "5px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                        <div style={{ height: "100%", width: `${(target.current / target.goal) * 100}%`, background: target.color }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TargetStat({ label, val, color, icon: Icon }: any) {
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
