"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiClock, FiCalendar, FiCheckSquare, FiAlertCircle, FiTrendingUp, FiMapPin, FiActivity, FiArrowRight, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

// Components
import EmployeePunchWidget from "@/components/attendance/EmployeePunchWidget";
import TimelineStepper from "@/components/attendance/TimelineStepper";


export default function EmployeeDashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAlreadyCheckedIn, setIsAlreadyCheckedIn] = useState(false);

    const fetchDashboard = async () => {
        try {
            const params = user?.organizationId ? `?organizationId=${user.organizationId}` : "";
            const res = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD}${params}`);
            setData(res.data.data);
            
            // Proactive Check: If today's sessions are empty, check general attendance history for this SPECIFIC employee
            if (!res.data.data?.attendanceToday?.sessions?.length) {
                // Determine the correct ID to scan: use employeeId first, fallback to user.id
                const targetId = user?.employeeId || user?._id;
                
                if (targetId) {
                    const historyRes = await axiosInstance.get(`${API_ENDPOINTS.ATTENDANCE}?employeeId=${targetId}`);
                    const history = historyRes.data.data || [];
                    
                    // Elite Deep Scan: Only count it if the record belongs to the targetId
                    const hasOpenSession = history.some((h: any) => 
                        (h.employee?._id === targetId || h.employee === targetId) && 
                        h.sessions?.some((s: any) => !s.checkOut)
                    );
                    setIsAlreadyCheckedIn(hasOpenSession);
                }
            } else {
                setIsAlreadyCheckedIn(false);
            }
            
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const handleCheckIn = async () => {
        try {
            await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_IN, { employeeId: user?._id });
            await fetchDashboard();
        } catch (err: any) {
            const msg = err.response?.data?.message || "";
            if (msg.includes("Already checked in")) {
                setIsAlreadyCheckedIn(true);
                // Optionally refresh to see if data arrives
                await fetchDashboard();
            } else {
                alert(msg || "Failed to check in");
            }
        }
    };

    const handleCheckOut = async () => {
        await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_OUT, { employeeId: user?._id });
        await fetchDashboard();
    };

    const handleBreak = async () => {
        await fetchDashboard();
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 1s linear infinite" }} />
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Initializing Self Service Console...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const hr = new Date().getHours();
    const greeting = hr < 12 ? "Good Morning" : hr < 17 ? "Good Afternoon" : "Good Evening";

    return (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* 🚀 Vibrant Hero Banner (Branded Orange) */}
            <div style={{
                background: "linear-gradient(135deg, var(--primary) 0%, #FF8C00 100%)",
                borderRadius: "24px", padding: "40px", color: "white",
                position: "relative", overflow: "hidden",
                boxShadow: "0 10px 30px -10px rgba(255, 107, 0, 0.4)"
            }}>
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                        <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", border: "1px solid rgba(255,255,255,0.3)" }}>
                            Employee Self Service
                        </span>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>•</span>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                            {new Date().toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                    <h1 style={{ fontSize: "36px", fontWeight: 900, margin: "0 0 8px 0", letterSpacing: "-1px" }}>
                        {greeting}, {user?.firstName}! <span style={{ fontSize: "32px" }}>🚀</span>
                    </h1>
                    <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.9)", maxWidth: "550px", margin: 0, fontWeight: 500 }}>
                        Your attendance and performance metrics are stable for the current cycle. Keep up the great work!
                    </p>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "32px" }}>
                        <div style={{ 
                            background: "rgba(255,255,255,0.15)", padding: "12px 24px", borderRadius: "18px", 
                            border: "1px solid rgba(255,255,255,0.2)", minWidth: "160px",
                            backdropFilter: "blur(10px)"
                        }}>
                            <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Shift Progress</div>
                            <div style={{ fontSize: "18px", fontWeight: 900, display: "flex", alignItems: "center", gap: "8px" }}>
                                {isAlreadyCheckedIn ? (
                                    <motion.div 
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}
                                    />
                                ) : null}
                                4h 30m Left
                            </div>
                            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", marginTop: "8px" }}>
                                <div style={{ width: "60%", height: "100%", background: "white", borderRadius: "2px" }} />
                            </div>
                        </div>
                        <div style={{ 
                            background: "rgba(255,255,255,0.15)", padding: "12px 24px", borderRadius: "18px", 
                            border: "1px solid rgba(255,255,255,0.2)", minWidth: "160px",
                            backdropFilter: "blur(10px)"
                        }}>
                            <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Next Holiday</div>
                            <div style={{ fontSize: "18px", fontWeight: 900 }}>Good Friday</div>
                            <div style={{ fontSize: "11px", opacity: 0.9, marginTop: "4px", fontWeight: 600 }}>In 3 Days</div>
                        </div>
                        <div style={{ 
                            background: "rgba(255,255,255,0.15)", padding: "12px 24px", borderRadius: "18px", 
                            border: "1px solid rgba(255,255,255,0.2)", minWidth: "160px",
                            backdropFilter: "blur(10px)"
                        }}>
                            <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Team Status</div>
                            <div style={{ fontSize: "18px", fontWeight: 900 }}>12 Active</div>
                            <div style={{ fontSize: "11px", opacity: 0.9, marginTop: "4px", fontWeight: 600 }}>2 On Leave</div>
                        </div>
                    </div>
                </div>

                {/* Abstract decorative elements */}
                <div style={{ position: "absolute", right: "-30px", bottom: "-30px", width: "240px", height: "240px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "50%", filter: "blur(40px)" }} />
                <div style={{ position: "absolute", right: "8%", top: "12%", opacity: 0.1, fontSize: "140px", fontWeight: 900 }}>Z</div>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: "360px 1fr", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Punch Widget */}
                    <div style={{ position: "relative" }}>
                        {(data?.attendanceToday?.sessions?.length > 0 && !data?.attendanceToday?.sessions[data.attendanceToday.sessions.length - 1].checkOut) || isAlreadyCheckedIn ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ 
                                    position: "absolute", top: "18px", right: "18px", zIndex: 10,
                                    display: "flex", alignItems: "center", gap: "6px",
                                    padding: "4px 10px", borderRadius: "20px", background: "#f0fdf4",
                                    border: "1px solid #dcfce7", fontSize: "10px", fontWeight: 800, color: "#10b981"
                                }}
                            >
                                <motion.span 
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}
                                />
                                LIVE SHIFT
                            </motion.div>
                        ) : null}
                        <EmployeePunchWidget
                            sessions={data?.attendanceToday?.sessions || []}
                            forceCheckOut={isAlreadyCheckedIn}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                            onBreak={handleBreak}
                            onResume={handleBreak}
                            onSync={fetchDashboard}
                        />
                    </div>

                    {/* Holiday Card - Unified Light Branded Theme */}
                    <div className="card" style={{ border: "1px solid var(--border-light)" }}>
                        <div className="card-header" style={{ padding: "16px 20px" }}>
                            <h3 className="card-title" style={{ fontSize: "14px", fontWeight: 800 }}>Upcoming Holidays</h3>
                            <FiCalendar style={{ color: "var(--primary)" }} />
                        </div>
                        <div className="card-body" style={{ background: "var(--bg-secondary)", borderRadius: "0 0 16px 16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ background: "white", padding: "14px", borderRadius: "14px", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>Holi Celebration</div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 500 }}>March 29, 2026 • Monday</div>
                                </div>
                                <div style={{ background: "white", padding: "14px", borderRadius: "14px", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>Good Friday</div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 500 }}>April 02, 2026 • Friday</div>
                                </div>
                            </div>
                            <button className="btn btn-secondary btn-sm" style={{ width: "100%", marginTop: "16px", fontWeight: 700 }}>
                                View Full Calendar
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Stats Row */}
                    <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                        <div className="stat-card blue">
                            <div className="stat-card-header">
                                <div className="stat-card-icon blue"><FiCalendar /></div>
                                <div className="stat-card-change up">+0 Days</div>
                            </div>
                            <div className="stat-card-value">14 Days</div>
                            <div className="stat-card-label">Available Leave</div>
                        </div>
                        <div className="stat-card orange">
                            <div className="stat-card-header">
                                <div className="stat-card-icon orange"><FiCheckSquare /></div>
                                <div className="stat-card-change">Pending</div>
                            </div>
                            <div className="stat-card-value">02 Items</div>
                            <div className="stat-card-label">My Approvals</div>
                        </div>
                        <div className="stat-card green">
                            <div className="stat-card-header">
                                <div className="stat-card-icon green"><FiTrendingUp /></div>
                                <div className="stat-card-change up">Excellent</div>
                            </div>
                            <div className="stat-card-value">98.4%</div>
                            <div className="stat-card-label">Attendance Score</div>
                        </div>
                    </div>


                    {/* Timeline Activity - Elite Stepper UI */}
                    <div className="card" style={{ border: "1px solid var(--border-light)" }}>
                        <div className="card-header" style={{ padding: "20px 24px" }}>
                            <h3 className="card-title" style={{ fontSize: "16px", fontWeight: 800 }}>Daily Activity Timeline</h3>
                            <Link href="/employee/attendance" className="btn btn-secondary btn-sm" style={{ textDecoration: "none", fontWeight: 700 }}>
                                Professional Log
                            </Link>
                        </div>
                        <div className="card-body" style={{ minHeight: "400px", background: "white", borderRadius: "0 0 24px 24px" }}>
                            <TimelineStepper events={data?.attendanceToday?.sessions || []} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
