"use client";

import React, { useState, useEffect } from "react";
import { FiPackage, FiShield, FiCheckCircle, FiArrowLeft, FiAlertTriangle, FiPlus, FiGrid, FiClock, FiActivity } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function PpePage() {
    const [kit, setKit] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.PPE_RECORDS_MY);
                setKit(res.data.data || []);
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>PPE & Tools Checklist</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Track your assigned Personal Protective Equipment and shop-floor tools inventory.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiPlus size={18} /> REQUEST REPLACEMENT
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <PpeStat label="KIT COMPLETION" val="100%" color="#10b981" icon={FiCheckCircle} />
                <PpeStat label="ITEMS ISSUED" val="04" color="var(--primary)" icon={FiPackage} />
                <PpeStat label="NEXT INSPECTION" val="15 Days" color="#3b82f6" icon={FiShield} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>My Inventory & Gear</div>
                    <div style={{ display: "flex", gap: "12px" }}>
                       <button className="btn btn-secondary btn-sm"><FiGrid /> Batch Verify</button>
                    </div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        {kit.map((item, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{ 
                                    padding: "20px", borderRadius: "20px", border: "1px solid #f1f5f9",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    background: item.condition === 'Wear Detected' ? '#fff7ed' : '#ffffff'
                                }}
                            >
                                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                    <div style={{ 
                                        width: "44px", height: "44px", borderRadius: "12px", 
                                        background: item.condition === 'Wear Detected' ? '#ffedd5' : '#f8fafc',
                                        color: item.condition === 'Wear Detected' ? 'var(--primary)' : '#64748b',
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        <FiShield size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>{item.item}</div>
                                        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>Issued: {item.issue}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ 
                                        fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px",
                                        background: item.condition === 'Wear Detected' ? '#fde68a' : '#f1f5f9',
                                        color: item.condition === 'Wear Detected' ? '#92400e' : '#64748b'
                                    }}>
                                        {item.condition.toUpperCase()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
                <div style={{ padding: "24px", background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
                   <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <FiAlertTriangle style={{ color: "var(--primary)" }} />
                      <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, margin: 0 }}>
                        Mandatory compliance: Site supervisors will verify your S3 boots condition at Solar Alpha Zone 4.
                      </p>
                   </div>
                </div>
            </div>
        </div>
    );
}

function PpeStat({ label, val, color, icon: Icon }: any) {
    return (
        <div style={{ 
            background: "white", padding: "24px", borderRadius: "20px", 
            border: "1px solid var(--border-light)", display: "flex", 
            justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
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
