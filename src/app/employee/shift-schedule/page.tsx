"use client";

import React, { useState, useEffect } from "react";
import { FiCalendar, FiClock, FiMapPin, FiChevronLeft, FiChevronRight, FiUsers, FiSunset, FiSunrise, FiMoon } from "react-icons/fi";
import { motion } from "framer-motion";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function ShiftSchedulePage() {
    const [days, setDays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.SHIFTS);
                setDays(res.data.data || []);
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950 }}>Shift Schedule</h1>
                    <p className="page-subtitle">Personalized shift calendar and factory-site assignments.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" style={{ padding: "10px 16px", borderRadius: "10px" }}><FiChevronLeft /></button>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "14px" }}>March - April 2026</div>
                    <button className="btn btn-secondary" style={{ padding: "10px 16px", borderRadius: "10px" }}><FiChevronRight /></button>
                </div>
            </motion.div>

            <div className="grid-7" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", marginBottom: "32px" }}>
                {days.map((day, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{ 
                            padding: "16px", borderRadius: "16px", textAlign: "center",
                            background: day.current ? "linear-gradient(to bottom, var(--primary), #FF8C00)" : "white",
                            color: day.current ? "white" : "var(--text-primary)",
                            border: day.current ? "none" : "1px solid var(--border-light)",
                            boxShadow: day.current ? "0 10px 20px -5px rgba(255, 122, 0, 0.3)" : "none"
                        }}
                    >
                        <div style={{ fontSize: "11px", fontWeight: 800, opacity: day.current ? 0.8 : 0.4 }}>{day.d.toUpperCase()}</div>
                        <div style={{ fontSize: "24px", fontWeight: 900, marginTop: "4px" }}>{day.date}</div>
                        {day.shift !== "OFF" && (
                            <div style={{ 
                                marginTop: "12px", width: "6px", height: "6px", 
                                borderRadius: "50%", background: day.current ? "white" : "var(--primary)", 
                                margin: "12px auto 0" 
                            }} />
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: "1fr 360px", gap: "32px" }}>
                <div className="card" style={{ padding: "32px", border: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 900 }}>Today's Deployment</h3>
                        <div style={{ 
                            background: "#f0fdf4", color: "#10b981", padding: "6px 12px", 
                            borderRadius: "8px", fontSize: "11px", fontWeight: 800, border: "1px solid #dcfce7" 
                        }}>CONFIRMED</div>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <ShiftDetail icon={FiClock} label="Shift Window" val="06:00 AM - 02:00 PM (Morning)" color="var(--primary)" />
                        <ShiftDetail icon={FiMapPin} label="Assigned Location" val="Solar Plant Alpha, Zone 4" color="#3b82f6" />
                        <ShiftDetail icon={FiUsers} label="Reporting Manager" val="Vikram Singh (Operations)" color="#10b981" />
                    </div>

                    <div style={{ 
                        marginTop: "40px", padding: "24px", borderRadius: "20px", 
                        background: "#f8fafc", border: "1px solid #e2e8f0",
                        display: "flex", alignItems: "center", gap: "20px"
                    }}>
                        <div style={{ 
                            width: "60px", height: "60px", borderRadius: "16px", 
                            background: "white", color: "var(--primary)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                        }}>
                            <FiSunrise size={32} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>Punctuality Bonus Active</div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", fontWeight: 600 }}>Check-in within 5 mins to earn 50 reward points.</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "20px" }}>Shift Breakdown</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <BreakdownRow icon={FiSunrise} label="Morning Shift" count="12 days" />
                            <BreakdownRow icon={FiSunset} label="Afternoon Shift" count="08 days" />
                            <BreakdownRow icon={FiMoon} label="Night Shift" count="02 days" />
                        </div>
                    </div>

                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)", background: "linear-gradient(to bottom, #1e293b, #0f172a)", color: "white" }}>
                        <div style={{ fontSize: "13px", fontWeight: 800, opacity: 0.8, marginBottom: "12px" }}>Next Shift Swap</div>
                        <div style={{ fontSize: "16px", fontWeight: 900 }}>April 05, 2026</div>
                        <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }}>Transitioning to General (09:00 - 17:00)</div>
                        <button className="btn btn-primary" style={{ width: "100%", marginTop: "20px", fontWeight: 800, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                            SWAP REQUEST
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShiftDetail({ icon: Icon, label, val, color }: any) {
    return (
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `${color}10`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} />
            </div>
            <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b", marginTop: "2px" }}>{val}</div>
            </div>
        </div>
    );
}

function BreakdownRow({ icon: Icon, label, count }: any) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon size={14} style={{ color: "#64748b" }} />
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>{label}</div>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>{count}</div>
        </div>
    );
}
