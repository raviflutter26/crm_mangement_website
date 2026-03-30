"use client";

import React, { useState } from "react";
import { FiBriefcase, FiMapPin, FiClock, FiPlus, FiArrowLeft, FiCheckCircle, FiTrendingUp, FiActivity } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AllowancePage() {
    const claims = [
        { id: "ALW-882", type: "Site Daily Allowance", site: "Solar Plant Alpha", days: 5, rate: "₹500/day", total: "₹2,500", status: "Processed" },
        { id: "ALW-883", type: "Night Shift Allowance", site: "Warehouse West", days: 2, rate: "₹750/night", total: "₹1,500", status: "Pending" }
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Site Allowances</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Claim special field-duty, night-shift, and site-specific hardship allowances.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiPlus size={18} /> NEW ALLOWANCE CLAIM
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <AllowanceStat label="CURRENT MONTH" val="₹4,000" color="var(--primary)" icon={FiBriefcase} />
                <AllowanceStat label="SITE DAYS" val="14 Days" color="#3b82f6" icon={FiMapPin} />
                <AllowanceStat label="APPROVAL RATE" val="100%" color="#10b981" icon={FiCheckCircle} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Allowance Claim History</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>March 2026 Management</div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {claims.map((claim, idx) => (
                            <motion.div 
                                key={claim.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                    padding: "20px", borderRadius: "18px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "20px", background: "#f8fafc"
                                }}
                            >
                                <div style={{ 
                                    width: "48px", height: "48px", borderRadius: "14px", 
                                    background: "white", color: "var(--primary)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid #e2e8f0"
                                }}>
                                    <FiTrendingUp size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>{claim.type}</div>
                                        <span style={{ 
                                            fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
                                            background: claim.status === 'Processed' ? '#dcfce7' : '#fef3c7',
                                            color: claim.status === 'Processed' ? '#10b981' : '#d97706'
                                        }}>
                                            {claim.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{claim.site} • {claim.days} Units @ {claim.rate}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "18px", fontWeight: 950, color: "#0f172a" }}>{claim.total}</div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 800 }}>ID: {claim.id}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AllowanceStat({ label, val, color, icon: Icon }: any) {
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
