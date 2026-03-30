"use client";

import React, { useState } from "react";
import { FiMapPin, FiNavigation, FiRadio, FiClock, FiCheckCircle, FiShield, FiAlertTriangle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function SiteAttendancePage() {
    const [status, setStatus] = useState<"idle" | "scanning" | "verified">("idle");
    const [location, setLocation] = useState<string>("Scanning GPS...");

    const handleScan = () => {
        setStatus("scanning");
        setTimeout(() => {
            setLocation("Solar Plant A-12, Sector 4");
            setStatus("verified");
        }, 2500);
    };

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)' }}>
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header"
            >
                <div>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950 }}>Site Attendance</h1>
                    <p className="page-subtitle">Geofenced location verification for field-based operations.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                   <div style={{ 
                       background: 'white', padding: '8px 16px', borderRadius: '12px', 
                       border: '1px solid var(--border-light)', display: 'flex', 
                       alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 
                    }}>
                       <FiShield style={{ color: '#10b981' }} /> Secure Endpoint
                   </div>
                </div>
            </motion.div>

            <div className="grid-2" style={{ gridTemplateColumns: "1fr 400px", gap: "32px", marginTop: "32px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Main Interaction Card */}
                    <motion.div 
                        className="card" 
                        style={{ 
                            padding: "40px", textAlign: "center", border: "1px solid var(--border-light)",
                            background: "linear-gradient(to bottom, #ffffff, #f8fafc)"
                        }}
                    >
                        <div style={{ 
                            width: "120px", height: "120px", borderRadius: "40px", 
                            background: status === 'verified' ? '#f0fdf4' : '#fff7ed',
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 32px", color: status === 'verified' ? '#10b981' : 'var(--primary)',
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)"
                        }}>
                            {status === 'scanning' ? <FiRadio className="rotate" size={48} /> : 
                             status === 'verified' ? <FiCheckCircle size={48} /> : 
                             <FiMapPin size={48} />}
                        </div>

                        <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>
                            {status === 'idle' ? "Ready to Verify" : 
                             status === 'scanning' ? "Synchronizing GPS..." : 
                             "Location Verified"}
                        </h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "400px", margin: "0 auto 32px" }}>
                            {status === 'idle' ? "Please ensure you are within the 500m geofence of your assigned site." : 
                             status === 'scanning' ? "Establishing secure connection with satellite mesh networks..." : 
                             `Successfully logged attendance at ${location}.`}
                        </p>

                        <AnimatePresence mode="wait">
                            {status === 'idle' ? (
                                <motion.button 
                                    key="scan-btn"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="btn btn-primary" 
                                    style={{ padding: "16px 48px", fontSize: "16px", fontWeight: 800, borderRadius: "16px" }}
                                    onClick={handleScan}
                                >
                                    <FiNavigation /> START VERIFICATION
                                </motion.button>
                            ) : status === 'verified' ? (
                                <motion.div 
                                    key="success-badge"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ 
                                        display: "inline-flex", alignItems: "center", gap: "10px", 
                                        background: "#f0fdf4", color: "#10b981", padding: "12px 24px",
                                        borderRadius: "100px", fontWeight: 800, fontSize: "14px",
                                        border: "1px solid #dcfce7"
                                    }}
                                >
                                    <FiCheckCircle /> AUTHENTICATED AT 09:42 AM
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </motion.div>

                    {/* Geofence Map Placeholder */}
                    <div className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--border-light)", height: "300px", position: "relative" }}>
                        <div style={{ position: "absolute", inset: 0, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ textAlign: "center", opacity: 0.5 }}>
                                <FiMapPin size={32} style={{ marginBottom: "12px" }} />
                                <div style={{ fontSize: "12px", fontWeight: 700 }}>HIGH-PRECISION MAP ENGINE</div>
                            </div>
                        </div>
                        {/* Mock Map Overlay */}
                        <div style={{ 
                            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                            width: "140px", height: "140px", borderRadius: "50%", background: "rgba(255, 122, 0, 0.1)",
                            border: "2px solid var(--primary)", borderStyle: "dashed"
                        }} />
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "20px" }}>Active Geofences</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <GeofenceTile name="Site A (Primary)" status="Active" dist="0.2km" />
                            <GeofenceTile name="Corporate HQ" status="Out of range" dist="24km" />
                            <GeofenceTile name="Warehouse West" status="Active" dist="1.5km" />
                        </div>
                    </div>

                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)", background: "#fff7ed" }}>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <FiAlertTriangle style={{ color: "var(--primary)", flexShrink: 0 }} size={20} />
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 800, color: "#92400e" }}>Compliance Note</div>
                                <div style={{ fontSize: "12px", color: "#b45309", marginTop: "4px", lineHeight: "1.5" }}>
                                    Your location is only tracked during the verification process. We value your privacy.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GeofenceTile({ name, status, dist }: any) {
    const isActive = status === 'Active';
    return (
        <div style={{ 
            display: "flex", justifyContent: "space-between", alignItems: "center", 
            padding: "16px", borderRadius: "12px", background: "#f8fafc",
            border: "1px solid #e2e8f0"
        }}>
            <div>
                <div style={{ fontSize: "13px", fontWeight: 800 }}>{name}</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{dist} from current pos</div>
            </div>
            <div style={{ 
                fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "6px",
                background: isActive ? "#f0fdf4" : "#f1f5f9",
                color: isActive ? "#10b981" : "#64748b"
            }}>
                {status.toUpperCase()}
            </div>
        </div>
    );
}
