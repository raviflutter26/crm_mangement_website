"use client";

import React, { useState } from "react";
import { FiMapPin, FiCalendar, FiBriefcase, FiPlus, FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function TravelRequestPage() {
    const [requests, setRequests] = useState([
        { id: "TR-2026-001", site: "Solar Plant Alpha", type: "Site Visit", date: "April 05, 2026", status: "Approved", purpose: "Inverter diagnostic and software update." },
        { id: "TR-2026-002", site: "Warehouse West", type: "Material Pickup", date: "April 08, 2026", status: "Pending", purpose: "Collect spare PV modules for Zone 4." }
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <Link href="/employee/dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Travel Requests</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Manage site visits, field work travel, and logistical authorizations.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiPlus size={18} /> NEW TRAVEL REQUEST
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <TravelStat label="TOTAL TRIPS" val="12" color="var(--primary)" icon={FiMapPin} />
                <TravelStat label="UPCOMING" val="2" color="#3b82f6" icon={FiCalendar} />
                <TravelStat label="APPROVED" val="10" color="#10b981" icon={FiCheckCircle} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", overflow: "hidden" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Active & Recent Requests</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>2026 Management Cycle</div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {requests.map((req, idx) => (
                            <motion.div 
                                key={req.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                    padding: "24px", borderRadius: "20px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "24px",
                                    background: "white", transition: "all 0.3s ease"
                                }}
                                whileHover={{ scale: 1.01, borderColor: "var(--primary)" }}
                            >
                                <div style={{ 
                                    width: "56px", height: "56px", borderRadius: "18px", 
                                    background: req.status === 'Approved' ? '#f0fdf4' : '#fffbeb',
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: req.status === 'Approved' ? '#10b981' : '#f59e0b',
                                    flexShrink: 0
                                }}>
                                    <FiBriefcase size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>{req.site}</div>
                                        <span style={{ 
                                            fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px",
                                            background: req.status === 'Approved' ? '#dcfce7' : '#fef3c7',
                                            color: req.status === 'Approved' ? '#10b981' : '#d97706'
                                        }}>
                                            {req.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{req.purpose}</div>
                                    <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>
                                            <FiTag size={12} /> {req.type}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>
                                            <FiCalendar size={12} /> {req.date}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right", minWidth: "120px" }}>
                                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", marginBottom: "4px" }}>Request ID</div>
                                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a", fontFamily: "monospace" }}>{req.id}</div>
                                </div>
                                <FiChevronRight style={{ color: "#e2e8f0" }} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TravelStat({ label, val, color, icon: Icon }: any) {
    return (
        <div style={{ 
            background: "white", padding: "28px", borderRadius: "24px", 
            border: "1px solid var(--border-light)", display: "flex", 
            justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
        }}>
            <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1.5px", marginBottom: "8px", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "32px", fontWeight: 950, color: "#0f172a" }}>{val}</div>
            </div>
            <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={28} />
            </div>
        </div>
    );
}

function FiTag({ size, style }: any) {
    return (
      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} style={style} xmlns="http://www.w3.org/2000/svg"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7" y2="7"></line></svg>
    );
}
