"use client";

import React, { useState } from "react";
import { FiBookOpen, FiPlayCircle, FiCheckCircle, FiClock, FiStar, FiPlus, FiArrowLeft, FiFileText } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

export default function TrainingPage() {
    const courses = [
        { id: "TRN-101", title: "Solar Inverter Advanced Diagnostics", progress: 75, duration: "4h 20m", status: "In-Progress", img: "#ebf5ff" },
        { id: "TRN-102", title: "Smart Grid Integration Protocols", progress: 100, duration: "2h 45m", status: "Completed", img: "#f0fdf4" },
        { id: "TRN-103", title: "High-Voltage Safety Reset 2026", progress: 10, duration: "1h 30m", status: "New", img: "#fff7ed" }
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Training & Courses</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Advance your career with role-specific training modules and certifications.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiBookOpen size={18} /> COURSE CATALOG
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <TrainingStat label="COMPLETED" val="08" color="#10b981" icon={FiCheckCircle} />
                <TrainingStat label="IN PROGRESS" val="02" color="var(--primary)" icon={FiPlayCircle} />
                <TrainingStat label="SKILL SCORE" val="920" color="#3b82f6" icon={FiStar} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "24px", background: "white" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "24px" }}>Active Learning Path</h3>
                <div className="grid-3" style={{ gap: "24px" }}>
                    {courses.map((course, idx) => (
                        <motion.div 
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            style={{ 
                                padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9",
                                background: "#f8fafc", position: "relative", overflow: "hidden",
                                display: "flex", flexDirection: "column", gap: "16px"
                            }}
                        >
                            <div style={{ width: "100%", height: "120px", background: course.img, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FiPlayCircle size={48} style={{ color: "rgba(0,0,0,0.1)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", marginBottom: "4px" }}>{course.status}</div>
                                <h4 style={{ fontSize: "16px", fontWeight: 850, lineHeight: "1.4", color: "#1e293b", minHeight: "44px" }}>{course.title}</h4>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FiClock /> {course.duration}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FiFileText /> 12 Lessons</div>
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 800, marginBottom: "6px" }}>
                                    <span>PROGRESS</span>
                                    <span>{course.progress}%</span>
                                </div>
                                <div style={{ height: "6px", background: "white", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${course.progress}%`, background: "var(--primary)" }} />
                                </div>
                            </div>
                            <button className="btn btn-secondary" style={{ width: "100%", marginTop: "8px", fontWeight: 800 }}>{course.status === 'Completed' ? 'REVISIT' : 'CONTINUE'}</button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TrainingStat({ label, val, color, icon: Icon }: any) {
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
