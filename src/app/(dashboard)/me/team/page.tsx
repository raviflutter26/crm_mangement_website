"use client";

import React, { useState, useEffect } from "react";
import { FiUsers, FiSearch, FiMail, FiPhone, FiMapPin, FiArrowLeft, FiMessageSquare, FiUser, FiActivity, FiBriefcase } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";

export default function TeamDirectoryPage() {
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Colleagues in the same department, the caller's reports and manager —
                // not the full staff roster, which employees may not read.
                const res = await axiosInstance.get(API_ENDPOINTS.EMPLOYEES_TEAM);
                setTeam((res.data.data || []).map((u: any) => ({
                    id: u._id,
                    name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
                    role: u.designation || u.role || "",
                    dept: u.department || "-",
                    site: u.location || "-",
                    status: u.status || "Active",
                    email: u.email,
                })));
            } catch (err: any) {
                console.error("Fetch error:", err);
                setError(err.response?.data?.message || "Could not load your team.");
            }
            finally { setLoading(false); }
        };
        fetchData();
    }, [])

    const term = search.trim().toLowerCase();
    const visible = term
        ? team.filter(m => [m.name, m.role, m.dept, m.email].some((v: string) => v?.toLowerCase().includes(term)))
        : team;

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
                    <Link href="/dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Team Directory</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Connect with colleagues, find site experts, and view organizational hierarchy.</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                   <div style={{ position: "relative" }}>
                        <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input 
                            type="text" 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Find colleague..." 
                            style={{ width: "240px", padding: "10px 10px 10px 40px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px" }} 
                        />
                   </div>
                </div>
            </motion.div>

            {error && <div role="alert" style={{ color: "#ef4444", fontWeight: 600, fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

            <div className="grid-3" style={{ gap: "24px" }}>
                {loading ? null : visible.length === 0 ? (
                            <EmptyState icon={FiUsers} title={"No colleagues listed"} description={"Your team directory shows people in your department, your manager and your reports."} />
                        ) : visible.map((member, idx) => (
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
                           {String(member.status).toUpperCase()}
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
                            <a title="Email" href={`mailto:${member.email}`} className="btn btn-secondary" style={{ flex: 1, borderRadius: "12px" }}><FiMail /></a>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
