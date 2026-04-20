"use client";

import React, { useState, useEffect } from "react";
import { FiAlertTriangle, FiPlus, FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiCamera, FiBarChart2, FiMapPin, FiActivity } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function IncidentPage() {
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.INCIDENTS_MY);
                setIncidents(res.data.data || []);
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Incident & Hazard Reports</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Report workplace hazards, near misses, or safety incidents immediately to the HSEQ team.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px", background: "#ef4444", border: "none" }}>
                    <FiPlus size={18} /> REPORT AN INCIDENT
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <IncidentStat label="REPORTS (YTD)" val="08" color="#ef4444" icon={FiAlertTriangle} />
                <IncidentStat label="UNDER REVIEW" val="02" color="#f59e0b" icon={FiClock} />
                <IncidentStat label="DAYS LTI FREE" val="142" color="#10b981" icon={FiActivity} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>My Safety Reports</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Real-time HSEQ Tracking</div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {incidents.map((inc, idx) => (
                            <motion.div 
                                key={inc.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                    padding: "20px", borderRadius: "18px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "20px", background: "white",
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)"
                                }}
                            >
                                <div style={{ 
                                    width: "48px", height: "48px", borderRadius: "12px", 
                                    background: inc.status === 'Resolved' ? '#f0fdf4' : '#fffbeb',
                                    color: inc.status === 'Resolved' ? '#10b981' : '#f59e0b',
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid #e2e8f0"
                                }}>
                                    <FiAlertTriangle size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>{inc.type}</div>
                                        <span style={{ 
                                            fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
                                            background: inc.severity === 'Low' ? '#f0fdf4' : '#fef2f2',
                                            color: inc.severity === 'Low' ? '#10b981' : '#ef4444'
                                        }}>
                                            {inc.severity.toUpperCase()} PRIORITY
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{inc.site} • {inc.date} • {inc.id}</div>
                                </div>
                                <div style={{ textAlign: "right", minWidth: "120px" }}>
                                    <div style={{ fontSize: "11px", fontWeight: 800, color: inc.status === 'Resolved' ? '#10b981' : '#f59e0b', textTransform: "uppercase" }}>{inc.status}</div>
                                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Update awaited</div>
                                </div>
                                <button className="btn btn-secondary btn-sm" style={{ padding: "8px", borderRadius: "8px" }}><FiFileText /></button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function IncidentStat({ label, val, color, icon: Icon }: any) {
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
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={28} />
            </div>
        </div>
    );
}
