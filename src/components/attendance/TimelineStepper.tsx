"use client";

import React from "react";
import { FiClock, FiLogIn, FiLogOut, FiCoffee, FiActivity, FiAlertCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

interface TimelineEvent {
    type: "Check-in" | "Break" | "Resume" | "Check-out";
    timestamp: string;
    duration?: string;
    status: "completed" | "active";
}

interface TimelineStepperProps {
    events: any[];
}

export default function TimelineStepper({ events }: TimelineStepperProps) {
    if (!events || events.length === 0) {
        return (
            <div style={{ 
                height: "100%", display: "flex", flexDirection: "column", 
                alignItems: "center", justifyContent: "center", padding: "60px 20px",
                textAlign: "center", minHeight: "400px"
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ position: "relative", marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <motion.path 
                            d="M40 80C40 57.9086 57.9086 40 80 40H160C182.091 40 200 57.9086 200 80V120C200 142.091 182.091 160 160 160H80C57.9086 160 40 142.091 40 120V80Z" 
                            fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 6"
                            animate={{ strokeDashoffset: [0, -20] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        />
                        <rect x="70" y="70" width="100" height="12" rx="6" fill="#f1f5f9" />
                        <rect x="70" y="94" width="60" height="12" rx="6" fill="#f1f5f9" />
                        <motion.circle 
                            cx="120" cy="120" r="24" fill="white" stroke="#e2e8f0" strokeWidth="2"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [0.8, 1, 0.8] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                        />
                        <path d="M120 110V120H130" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.div>
                <h4 style={{ fontSize: "18px", fontWeight: 900, color: "#1e293b", margin: "0 0 12px" }}>Awaiting Professional Activity</h4>
                <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "320px", lineHeight: "1.6", fontWeight: 500 }}>
                    Your shift timeline is currently empty. Use the <b>Check-In</b> action to begin recording your professional hours for today.
                </p>
                <Link href="/employee/check-in" className="btn btn-secondary" style={{ marginTop: "24px", fontWeight: 800, padding: "10px 24px", borderRadius: "12px" }}>
                    Go to Punch Console
                </Link>
            </div>
        );
    }

    // Transform raw sessions into flat timeline events
    const timelineEvents: TimelineEvent[] = [];
    events.forEach((session, idx) => {
        timelineEvents.push({
            type: "Check-in",
            timestamp: session.checkIn,
            status: "completed"
        });
        
        if (session.checkOut) {
            timelineEvents.push({
                type: "Check-out",
                timestamp: session.checkOut,
                duration: session.hours ? `${session.hours.toFixed(1)} hrs` : undefined,
                status: "completed"
            });
        }
    });

    return (
        <div style={{ padding: "10px 0" }}>
            {timelineEvents.map((event, idx) => (
                <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    style={{ position: "relative", paddingLeft: "48px", paddingBottom: "32px" }}
                >
                    {/* Stepper Line */}
                    {idx !== timelineEvents.length - 1 && (
                        <div style={{ 
                            position: "absolute", left: "19px", top: "40px", bottom: "0", 
                            width: "2px", background: "linear-gradient(to bottom, #FF7A00 0%, #f1f5f9 100%)",
                            opacity: 0.3
                        }} />
                    )}

                    {/* Elite Icon Node */}
                    <div style={{ 
                        position: "absolute", left: "0", top: "0", width: "40px", height: "40px", 
                        borderRadius: "12px", background: event.type === "Check-out" ? "#fef2f2" : "#f0fdf4",
                        border: `1px solid ${event.type === "Check-out" ? "#fecaca" : "#dcfce7"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: event.type === "Check-out" ? "#ef4444" : "#10b981",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.03)"
                    }}>
                        {event.type === "Check-in" ? <FiLogIn size={18} /> : 
                         event.type === "Check-out" ? <FiLogOut size={18} /> : 
                         event.type === "Break" ? <FiCoffee size={18} /> : <FiActivity size={18} />}
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.3px" }}>
                                {event.type}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                                <FiClock size={12} />
                                {new Date(event.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </div>
                        </div>
                        {event.duration && (
                            <div style={{ 
                                padding: "4px 12px", borderRadius: "20px", background: "#f8fafc", 
                                border: "1px solid #e2e8f0", fontSize: "11px", fontWeight: 800, color: "#475569"
                            }}>
                                {event.duration} Session
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
