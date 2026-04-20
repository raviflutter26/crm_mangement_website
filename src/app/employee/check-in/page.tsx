"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiClock, FiMapPin, FiLogIn, FiLogOut, FiCoffee, FiActivity, FiArrowLeft, FiNavigation, FiInfo } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import EmployeePunchWidget from "@/components/attendance/EmployeePunchWidget";

export default function AttendancePunchPage() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAlreadyCheckedIn, setIsAlreadyCheckedIn] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchStatus = async () => {
        try {
            const params = user?.organizationId ? `?organizationId=${user.organizationId}` : "";
            const res = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD}${params}`);
            setData(res.data.data);
            
            // Check global history for any open session if today is empty
            if (!res.data.data?.attendanceToday?.sessions?.length && user?.employeeId) {
                const historyRes = await axiosInstance.get(`${API_ENDPOINTS.ATTENDANCE}?employeeId=${user.employeeId}`);
                const history = historyRes.data.data || [];
                const hasOpenSession = history.some((h: any) => h.sessions?.some((s: any) => !s.checkOut));
                if (hasOpenSession) setIsAlreadyCheckedIn(true);
            } else {
                setIsAlreadyCheckedIn(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [user]);

    const handleAction = async (action: () => Promise<void>) => {
        setLoading(true);
        try {
            await action();
            await fetchStatus();
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_IN, { employeeId: user?._id });
            await fetchStatus();
        } catch (err: any) {
            if (err.response?.data?.message?.includes("Already checked in")) {
                setIsAlreadyCheckedIn(true);
                await fetchStatus();
            }
        }
    };

    const handleCheckOut = async () => {
        await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_OUT, { employeeId: user?._id });
        await fetchStatus();
    };

    if (loading && !data) return <div className="page-loader">Initializing Attendance System...</div>;

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                    maxWidth: "800px", margin: "0 auto", padding: "40px 20px" 
                }}
            >
                {/* Header Section */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                            <Link href="/employee/dashboard" style={{ color: "var(--text-muted)", display: "flex" }}>
                                <FiArrowLeft size={20} />
                            </Link>
                            <h1 style={{ fontSize: "32px", fontWeight: 950, margin: 0, letterSpacing: "-1px" }}>Daily Punch</h1>
                        </div>
                        <p style={{ color: "var(--text-muted)", margin: 0, marginLeft: "32px", fontWeight: 600 }}>
                            Track your time and location for today's work cycle.
                        </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "1px" }}>Current Time</div>
                        <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "monospace" }}>
                            {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
                    {/* The Primary Punch Widget (Zoho Style) */}
                    <div style={{ transform: "scale(1.05)", transformOrigin: "top center" }}>
                        <EmployeePunchWidget
                            sessions={data?.attendanceToday?.sessions || []}
                            forceCheckOut={isAlreadyCheckedIn}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                            onBreak={async () => {}}
                            onResume={async () => {}}
                            onSync={fetchStatus}
                        />
                    </div>

                    {/* Secondary Info Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "40px" }}>
                        <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                <div style={{ padding: "10px", background: "#f0f9ff", color: "#0ea5e9", borderRadius: "12px" }}>
                                    <FiNavigation size={20} />
                                </div>
                                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Location Tagging</h3>
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, fontWeight: 600 }}>
                                Your IP and GPS coordinates are logged per punch to ensure compliance with field-service guidelines.
                            </div>
                            <div style={{ marginTop: "16px", padding: "10px", background: "var(--bg-secondary)", borderRadius: "10px", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)" }}>
                                Current IP: 192.168.1.1 (Static)
                            </div>
                        </div>

                        <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                <div style={{ padding: "10px", background: "#fdf2f8", color: "#db2777", borderRadius: "12px" }}>
                                    <FiInfo size={20} />
                                </div>
                                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Shift Guidelines</h3>
                            </div>
                            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                                <li style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#db2777" }} /> Standard Shift: 9 Hours
                                </li>
                                <li style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#db2777" }} /> Break Policy: 45 Mins
                                </li>
                                <li style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#db2777" }} /> Overtime: Standard 1.5x
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
