"use client";

import React, { useState } from "react";
import { FiBriefcase, FiPlus, FiClock, FiCheckCircle, FiEdit3, FiTrash2, FiFileText, FiActivity, FiTag } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function JobCardPage() {
    const [jobs, setJobs] = useState([
        { id: 1, site: "Solar Plant Alpha", task: "Inverter Maintenance", status: "Ongoing", time: "2h 15m" },
        { id: 2, site: "Commercial Complex B", task: "Panel Cleaning", status: "Completed", time: "1h 45m" }
    ]);

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)' }}>
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header" 
                style={{ marginBottom: "32px" }}
            >
                <div>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950 }}>Job Card Log</h1>
                    <p className="page-subtitle">Track precise work hours and tasks across different project sites.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiPlus size={18} /> NEW JOB ENTRY
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <StatsCard label="TOTAL HOURS" val="4.0h" color="var(--primary)" icon={FiClock} />
                <StatsCard label="JOBS LOGGED" val="2" color="#3b82f6" icon={FiFileText} />
                <StatsCard label="EFFICIENCY" val="92%" color="#10b981" icon={FiActivity} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", overflow: "hidden" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Recent Work Logs</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>March 30, 2026</div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {jobs.map((job, idx) => (
                            <motion.div 
                                key={job.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                    padding: "20px", borderRadius: "16px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "24px",
                                    background: job.status === 'Ongoing' ? '#fff7ed' : '#f8fafc'
                                }}
                            >
                                <div style={{ 
                                    width: "48px", height: "48px", borderRadius: "14px", 
                                    background: job.status === 'Ongoing' ? '#ffedd5' : '#f1f5f9',
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: job.status === 'Ongoing' ? 'var(--primary)' : '#64748b'
                                }}>
                                    <FiBriefcase size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>{job.site}</div>
                                        <span style={{ 
                                            fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px",
                                            background: job.status === 'Ongoing' ? '#fde68a' : '#dcfce7',
                                            color: job.status === 'Ongoing' ? '#92400e' : '#10b981'
                                        }}>
                                            {job.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{job.task}</div>
                                </div>
                                <div style={{ textAlign: "right", minWidth: "100px" }}>
                                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a" }}>{job.time}</div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Logged Duration</div>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button className="btn btn-secondary btn-sm" style={{ padding: "10px", borderRadius: "10px" }}><FiEdit3 /></button>
                                    <button className="btn btn-secondary btn-sm" style={{ padding: "10px", borderRadius: "10px", color: "#ef4444" }}><FiTrash2 /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
                {jobs.length === 0 && (
                    <div style={{ padding: "80px", textAlign: "center" }}>
                        <FiTag size={48} style={{ color: "#e2e8f0", marginBottom: "16px" }} />
                        <div style={{ fontWeight: 800, color: "#64748b" }}>No work logs found for today.</div>
                    </div>
                )}
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
