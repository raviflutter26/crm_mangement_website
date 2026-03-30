"use client";

import React, { useState } from "react";
import { FiZap, FiTarget, FiArrowLeft, FiPlus, FiCheckCircle, FiActivity, FiTrendingUp, FiPieChart } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SkillsPage() {
    const skills = [
        { name: "Solar Inverter Maintenance", level: "Expert", progress: 95, icon: FiZap, color: "var(--primary)" },
        { name: "Electrical Circuitry", level: "Advanced", progress: 82, icon: FiActivity, color: "#3b82f6" },
        { name: "Project Management", level: "Intermediate", progress: 60, icon: FiTarget, color: "#10b981" },
        { name: "Field Compliance", level: "Expert", progress: 90, icon: FiPieChart, color: "#f59e0b" }
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Solar & Technical Skills</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Inventory of your verified field skills and professional competencies.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiPlus size={18} /> ADD SKILL / COMPETENCY
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <SkillStat label="TOTAL SKILLS" val="12" color="var(--primary)" icon={FiZap} />
                <SkillStat label="EXPERTISE LEVEL" val="Elite" color="#10b981" icon={FiTrendingUp} />
                <SkillStat label="SKILL GROWTH" val="+12%" color="#3b82f6" icon={FiActivity} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Skill Matrix & Proficiency</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>FY 2026 Inventory</div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div className="grid-2" style={{ gap: "24px" }}>
                        {skills.map((skill, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                    padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9",
                                    background: "#f8fafc", display: "flex", flexDirection: "column", gap: "20px"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                        <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "white", color: skill.color, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                                            <skill.icon size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: "16px", fontWeight: 900, color: "#1e293b" }}>{skill.name}</h4>
                                            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", fontWeight: 700 }}>Proficiency: {skill.level}</p>
                                        </div>
                                    </div>
                                    <FiCheckCircle style={{ color: "#10b981" }} size={20} />
                                </div>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 800, marginBottom: "8px" }}>
                                        <span>PROFICIENCY SCORE</span>
                                        <span>{skill.progress}%</span>
                                    </div>
                                    <div style={{ height: "8px", background: "white", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${skill.progress}%`, background: skill.color }} />
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

function SkillStat({ label, val, color, icon: Icon }: any) {
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
