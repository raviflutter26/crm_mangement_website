"use client";

import React, { useState } from "react";
import { FiUsers, FiSearch, FiMail, FiPhone, FiMapPin, FiArrowLeft, FiMessageSquare, FiUser, FiActivity, FiBriefcase } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function TeamDirectoryPage() {
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.EMPLOYEES);
                setTeam(res.data.data || []);
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Team Directory</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Connect with colleagues, find site experts, and view organizational hierarchy.</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                   <div style={{ position: "relative" }}>
                        <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input 
                            type="text" 
                            placeholder="Find colleague..." 
                            style={{ width: "240px", padding: "10px 10px 10px 40px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px" }} 
                        />
                   </div>
                </div>
            </motion.div>

            <div className="grid-3" style={{ gap: "24px" }}>
                {team.map((member, idx) => (
                    <motion.div 
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{ 
                            padding: "32px", borderRadius: "28px", border: "1px solid #f1f5f9",
                            background: "white", textAlign: "center", position: "relative",
                            boxShadow: "0 10px 20px -10px rgba(0,0,0,0.02)"
                        }}
                    >
                        <div style={{ 
                            width: "80px", height: "80px", borderRadius: "30px", 
                            background: "var(--bg-secondary)", color: "var(--primary)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 20px", fontSize: "28px", fontWeight: 800,
                            border: "1px solid #f1f5f9"
                        }}>
                            {member.name.charAt(0)}
                        </div>
                        <div style={{ 
                            position: "absolute", top: "24px", right: "24px", 
                            padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 800,
                            background: member.status === 'On Site' ? '#ffedd5' : member.status === 'Active' ? '#f0fdf4' : '#f1f5f9',
                            color: member.status === 'On Site' ? 'var(--primary)' : member.status === 'Active' ? '#10b981' : '#64748b',
                            border: "1px solid currentColor", opacity: 0.8
                        }}>
                           {member.status.toUpperCase()}
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#1e293b", margin: 0 }}>{member.name}</h3>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)", marginTop: "4px" }}>{member.role}</p>
                        <div style={{ 
                            marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px", 
                            fontSize: "12px", color: "#64748b", fontWeight: 600, padding: "16px",
                            background: "#f8fafc", borderRadius: "16px"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><FiBriefcase /> {member.dept}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><FiMapPin /> {member.site}</div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                            <button title="Email" className="btn btn-secondary" style={{ flex: 1, borderRadius: "12px" }}><FiMail /></button>
                            <button title="Call" className="btn btn-secondary" style={{ flex: 1, borderRadius: "12px" }}><FiPhone /></button>
                            <button title="Message" className="btn btn-secondary" style={{ flex: 1, borderRadius: "12px" }}><FiMessageSquare /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
