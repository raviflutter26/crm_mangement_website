"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiCheckCircle, FiLogIn, FiLogOut, FiCoffee, FiMapPin, FiActivity, FiZap } from "react-icons/fi";

interface AttendanceSession {
    checkIn: string;
    checkOut: string | null;
    status: string; // 'Working' | 'On Break' | 'Completed'
}

interface EmployeePunchWidgetProps {
    sessions: AttendanceSession[];
    forceCheckOut?: boolean;
    onCheckIn: () => Promise<void>;
    onCheckOut: () => Promise<void>;
    onBreak: () => Promise<void>;
    onResume: () => Promise<void>;
    onSync: () => Promise<void>;
}

export default function EmployeePunchWidget({
    sessions,
    forceCheckOut,
    onCheckIn,
    onCheckOut,
    onBreak,
    onResume,
    onSync
}: EmployeePunchWidgetProps) {
    const REQUIRED_HOURS = 9;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [liveHours, setLiveHours] = useState(0);
    const [loading, setLoading] = useState(false);

    const activeSession = sessions.find(s => !s.checkOut);
    const isWorking = activeSession ? (activeSession.status === "Working" || !activeSession.status) : (forceCheckOut);
    const isOnBreak = activeSession?.status === "On Break";

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Calculate live hours
    useEffect(() => {
        const calcLive = () => {
            let total = 0;
            sessions.forEach(s => {
                if (s.checkOut) {
                    const diff = new Date(s.checkOut).getTime() - new Date(s.checkIn).getTime();
                    total += diff / (1000 * 3600);
                } else if (s.status === "Working" || !s.checkOut) {
                    const diff = new Date().getTime() - new Date(s.checkIn).getTime();
                    total += diff / (1000 * 3600);
                }
            });
            setLiveHours(total);
        };

        calcLive();
        const interval = setInterval(calcLive, 1000);
        return () => clearInterval(interval);
    }, [sessions]);

    const formatDuration = (h: number) => {
        const totalSeconds = Math.floor(h * 3600);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const progressPercent = Math.min((liveHours / REQUIRED_HOURS) * 100, 100);
    const size = 200; // Increased size slightly
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    const firstCheckIn = sessions.length > 0 ? sessions[0].checkIn : null;
    const lastCheckOut = sessions.length > 0 && sessions[sessions.length - 1].checkOut ? sessions[sessions.length - 1].checkOut : null;

    const handleAction = async (action: () => Promise<void>) => {
        setLoading(true);
        try {
            await action();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: "#fff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
        }}>
            {/* Real-time Clock Header */}
            <div style={{
                padding: "24px",
                borderBottom: "1px solid #f8fafc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(to right, #fafafa, #fff)"
            }}>
                <div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Attendance Console</div>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "#1e293b", fontFamily: "monospace", letterSpacing: "-0.5px" }}>
                        {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                    </div>
                </div>
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={isWorking ? "working" : isOnBreak ? "break" : "idle"}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            padding: "8px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: 900,
                            background: isWorking ? "#f0fdf4" : isOnBreak ? "#fffbeb" : "#f1f5f9",
                            color: isWorking ? "#10b981" : isOnBreak ? "#f59e0b" : "#64748b",
                            border: `2px solid ${isWorking ? "#10b98120" : isOnBreak ? "#f59e0b20" : "#e2e8f0"}`,
                            boxShadow: isWorking ? "0 4px 12px rgba(16, 185, 129, 0.1)" : "none"
                        }}
                    >
                        <motion.span 
                            animate={isWorking ? { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] } : {}}
                            transition={isWorking ? { repeat: Infinity, duration: 1.5 } : {}}
                            style={{ 
                                width: 10, height: 10, borderRadius: "50%", 
                                background: isWorking ? "#10b981" : isOnBreak ? "#f59e0b" : "#64748b"
                            }} 
                        />
                        {isWorking ? "ACTIVE SHIFT" : isOnBreak ? "ON BREAK" : "OFF DUTY"}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Circular Progress & Timer */}
            <div style={{ padding: "40px 24px", textAlign: "center", background: "#fff" }}>
                <div style={{ position: "relative", display: "inline-block", width: size, height: size }}>
                    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                        <circle stroke="#f1f5f9" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
                        <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: strokeDashoffset }}
                            stroke={isWorking ? "var(--primary)" : isOnBreak ? "#f59e0b" : "#cbd5e1"}
                            fill="transparent"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={`${circumference} ${circumference}`}
                            r={radius}
                            cx={size / 2}
                            cy={size / 2}
                            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease" }}
                        />
                    </svg>
                    <div style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "2px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 800, textTransform: "uppercase" }}>Work Hours</div>
                            {isWorking && (
                                <motion.div 
                                    animate={{ opacity: [1, 0, 1] }} 
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} 
                                />
                            )}
                        </div>
                        <div style={{ fontSize: "36px", fontWeight: 900, color: "#0f172a", fontFamily: "monospace", lineHeight: 1 }}>
                            {formatDuration(liveHours).split(":")[0]}:{formatDuration(liveHours).split(":")[1]}
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#94a3b8", fontFamily: "monospace" }}>
                            :{formatDuration(liveHours).split(":")[2]}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <AnimatePresence mode="wait">
                        {!activeSession && !forceCheckOut ? (
                            <motion.button
                                key="checkin"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px -5px rgba(255, 122, 0, 0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAction(onCheckIn)}
                                disabled={loading}
                                style={{
                                    width: "100%", padding: "18px", borderRadius: "20px",
                                    background: "var(--primary)", color: "#fff", border: "none", fontWeight: 900,
                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                                    fontSize: "15px", letterSpacing: "0.5px"
                                }}
                            >
                                <FiLogIn size={20} /> Check-In
                            </motion.button>
                        ) : (
                            <div style={{ display: "flex", gap: "16px" }}>
                                <motion.button
                                    key="checkout"
                                    initial={{ flex: 1.2, opacity: 0, x: -20 }}
                                    animate={{ flex: 1.2, opacity: 1, x: 0 }}
                                    whileHover={{ scale: 1.02, boxShadow: "0 15px 30px -5px rgba(239, 68, 68, 0.4)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleAction(onCheckOut)}
                                    disabled={loading}
                                    style={{
                                        padding: "18px", borderRadius: "20px",
                                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", 
                                        color: "#fff", border: "none", fontWeight: 900,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                        fontSize: "15px", letterSpacing: "0.5px", boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.3)",
                                        animation: "pulse-red 2s infinite"
                                    }}
                                >
                                    <FiLogOut size={20} /> {forceCheckOut ? "Check Out (Previous)" : "Check Out"}
                                </motion.button>
                                
                                {isWorking && !forceCheckOut ? (
                                    <motion.button
                                        key="break"
                                        initial={{ flex: 0.8, opacity: 0 }}
                                        animate={{ flex: 0.8, opacity: 1 }}
                                        whileHover={{ flex: 1, background: "#fef3c7" }}
                                        onClick={() => handleAction(onBreak)}
                                        disabled={loading}
                                        style={{
                                            padding: "18px", borderRadius: "20px",
                                            background: "#fffbeb", color: "#f59e0b", border: "2px solid #fef3c7",
                                            fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                            fontSize: "14px", overflow: "hidden", whiteSpace: "nowrap", transition: "all 0.3s ease"
                                        }}
                                    >
                                        <FiCoffee size={20} /> BREAK
                                    </motion.button>
                                ) : !isWorking && isOnBreak ? (
                                    <motion.button
                                        key="resume"
                                        initial={{ flex: 0.8, opacity: 0 }}
                                        animate={{ flex: 0.8, opacity: 1 }}
                                        whileHover={{ flex: 1, background: "#f0fdf4" }}
                                        onClick={() => handleAction(onResume)}
                                        disabled={loading}
                                        style={{
                                            padding: "18px", borderRadius: "20px",
                                            background: "#f0fdf4", color: "#10b981", border: "2px solid #dcfce7",
                                            fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                            fontSize: "14px", overflow: "hidden", whiteSpace: "nowrap", transition: "all 0.3s ease"
                                        }}
                                    >
                                        <FiActivity size={20} /> RESUME
                                    </motion.button>
                                ) : null}
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Trouble shooting helper */}
                    {!isWorking && !isOnBreak && !forceCheckOut && (
                        <div style={{ marginTop: "16px", padding: "12px", borderRadius: "12px", background: "#f8fafc", border: "1px dashed #e2e8f0" }}>
                            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, marginBottom: "8px" }}>
                                Cannot Start? You might have an open session from another day.
                            </div>
                            <button 
                                onClick={() => handleAction(onSync)}
                                style={{ 
                                    background: "transparent", border: "none", color: "var(--primary)", 
                                    fontSize: "11px", fontWeight: 850, cursor: "pointer", textDecoration: "underline",
                                    display: "flex", alignItems: "center", gap: "4px", margin: "0 auto"
                                }}
                            >
                                <FiZap size={12} /> FORCE STATUS SYNC
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Attendance Summary */}
            <div style={{ background: "#fafafa", borderTop: "1px solid #f1f5f9", padding: "20px 24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px", letterSpacing: "1px" }}>First In</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>{firstCheckIn ? new Date(firstCheckIn as string).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--:--"}</div>
                    </div>
                    <div style={{ textAlign: "center", borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px", letterSpacing: "1px" }}>Break Time</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#f59e0b" }}>45m</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px", letterSpacing: "1px" }}>Compliance</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                            <FiCheckCircle size={14} /> 100%
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </div>
    );
}
