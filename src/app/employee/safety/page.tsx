"use client";

import React, { useState } from "react";
import { FiShield, FiAlertOctagon, FiCheckCircle, FiClock, FiFileText, FiZap, FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SafetyPage() {
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Safety & Compliance</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Monitor your health and safety induction status, certificates, and site-specific protocols.</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                   <div style={{ 
                       background: "#f0fdf4", padding: "8px 20px", borderRadius: "12px", 
                       border: "1px solid #dcfce7", display: "flex", 
                       alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 800, color: "#10b981" 
                   }}>
                      <FiCheckCircle /> Site-Ready Status
                   </div>
                </div>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <SafetyStat label="LAST INDUCTION" val="Feb 12, 2026" color="#10b981" icon={FiClock} />
                <SafetyStat label="ACTIVE CERTS" val="04" color="var(--primary)" icon={FiShield} />
                <SafetyStat label="COMPLIANCE" val="100%" color="#3b82f6" icon={FiCheckCircle} />
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: "1fr 400px", gap: "32px" }}>
                <div className="card" style={{ border: "1px solid var(--border-light)", padding: "24px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "24px" }}>Mandatory Certifications</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <SafetyCertRow name="Electrical Safety (Level 2)" expiry="May 30, 2026" status="Active" icon={FiZap} />
                        <SafetyCertRow name="Working at Heights" expiry="Oct 12, 2026" status="Active" icon={FiShield} />
                        <SafetyCertRow name="First Aid & Emergency" expiry="Jan 05, 2027" status="Active" icon={FiActivity} />
                    </div>
                    <button className="btn btn-secondary" style={{ width: "100%", marginTop: "32px", fontWeight: 800 }}>UPLOAD NEW CERTIFICATE</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div className="card" style={{ padding: "24px", border: "1px solid #fee2e2", background: "#fef2f2" }}>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <FiAlertOctagon size={24} style={{ color: "#ef4444", flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 800, color: "#991b1b" }}>Pending Site Protocol</div>
                                <p style={{ fontSize: "12px", color: "#b91c1c", marginTop: "4px", lineHeight: "1.5" }}>
                                    Site "Solar Alpha Zone 4" has updated its high-voltage protocols. Please review and sign before your next visit.
                                </p>
                                <button className="btn btn-primary btn-sm" style={{ marginTop: "12px", background: "#ef4444", border: "none", borderRadius: "10px" }}>REVIEW NOW</button>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "16px" }}>Site Safety Contacts</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                           <ContactRow name="Safety Officer" person="John Doe" phone="+91 99999 88888" />
                           <ContactRow name="Medical Lead" person="Dr. Sarah" phone="+91 88888 77777" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SafetyStat({ label, val, color, icon: Icon }: any) {
    return (
        <div style={{ 
            background: "white", padding: "24px", borderRadius: "20px", 
            border: "1px solid var(--border-light)", display: "flex", 
            justifyContent: "space-between", alignItems: "center" 
        }}>
            <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "22px", fontWeight: 950, color: "#0f172a" }}>{val}</div>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={24} />
            </div>
        </div>
    );
}

function SafetyCertRow({ name, expiry, status, icon: Icon }: any) {
    return (
        <div style={{ 
            padding: "16px", borderRadius: "16px", border: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", gap: "20px", background: "#f8fafc"
        }}>
            <div style={{ 
                width: "40px", height: "40px", borderRadius: "12px", 
                background: "white", color: "var(--primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid #e2e8f0"
            }}>
                <Icon size={22} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>{name}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Expires on {expiry}</div>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#10b981", background: "#f0fdf4", padding: "4px 8px", borderRadius: "4px" }}>{status.toUpperCase()}</span>
        </div>
    );
}

function ContactRow({ name, person, phone }: any) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <div>
               <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8" }}>{name.toUpperCase()}</div>
               <div style={{ fontSize: "14px", fontWeight: 800 }}>{person}</div>
           </div>
           <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>{phone}</div>
        </div>
    );
}

function FiActivity({ size, style }: any) {
    return (
      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} style={style} xmlns="http://www.w3.org/2000/svg"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
    );
}
