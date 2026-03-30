"use client";

import React, { useState } from "react";
import { FiMail, FiMessageSquare, FiBell, FiArrowLeft, FiClock, FiPlus, FiCheckCircle, FiChevronRight, FiMapPin, FiAward } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AnnouncementsPage() {
    const alerts = [
        { id: 1, title: "New Leave Policy - FY 2026", date: "Mar 30, 2026", category: "Policy", priority: "High", body: "Updated annual leave rollover limits and sick leave accumulation protocols for the new fiscal year.", icon: FiFileText },
        { id: 2, title: "Solar Plant Alpha Site Visit", date: "Mar 28, 2026", category: "Operations", priority: "Medium", body: "Scheduled maintenance visit for Zone 4. Safety gear mandatory.", icon: FiMapPin },
        { id: 3, title: "Quarterly Town Hall", date: "Mar 25, 2026", category: "Meeting", priority: "Low", body: "Join the leadership team for a review of Q1 milestones and future roadmap.", icon: FiAward }
    ];

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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Announcements</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Stay updated with corporate news, policy changes, and important site alerts.</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button className="btn btn-secondary" style={{ padding: "10px 20px", fontWeight: 800, borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FiBell /> Mark All Read
                    </button>
                </div>
            </motion.div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Latest News Feed</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Real-time Internal Comms</div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {alerts.map((alert, idx) => (
                            <motion.div 
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                    padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9",
                                    display: "flex", gap: "24px", background: "#f8fafc", transition: "all 0.3s ease",
                                    cursor: "pointer"
                                }}
                                whileHover={{ scale: 1.01, borderColor: "var(--primary)", background: "white" }}
                            >
                                <div style={{ 
                                    width: "56px", height: "56px", borderRadius: "18px", 
                                    background: "white", color: "var(--primary)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid #e2e8f0", flexShrink: 0
                                }}>
                                    <alert.icon size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <span style={{ fontSize: "10px", fontWeight: 800, padding: "4px 10px", borderRadius: "6px", background: "white", color: "var(--text-muted)", border: "1px solid #e2e8f0" }}>{alert.category.toUpperCase()}</span>
                                            <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#1e293b", margin: 0 }}>{alert.title}</h3>
                                        </div>
                                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>{alert.date}</div>
                                    </div>
                                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: "1.6", fontWeight: 600 }}>{alert.body}</p>
                                </div>
                                <FiChevronRight style={{ color: "#e2e8f0", marginTop: "4px" }} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function FiFileText({ size, style }: any) {
    return (
      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} style={style} xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
    );
}
