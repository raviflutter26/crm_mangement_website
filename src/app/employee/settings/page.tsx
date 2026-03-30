"use client";

import React, { useState } from "react";
import { FiSettings, FiLock, FiBell, FiUser, FiGlobe, FiShield, FiArrowLeft, FiChevronRight, FiMoon, FiSmartphone, FiLogOut } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
    const { logout } = useAuth();
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Portal Settings</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Manage your account security, notification preferences, and application theme.</p>
                </div>
            </motion.div>

            <div className="grid-2" style={{ gridTemplateColumns: "300px 1fr", gap: "48px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <SettingsTab active icon={FiUser} label="Profile & Basic Info" />
                    <SettingsTab icon={FiLock} label="Security & Password" />
                    <SettingsTab icon={FiBell} label="Notifications" badge="New" />
                    <SettingsTab icon={FiSmartphone} label="Devices & Sessions" />
                    <SettingsTab icon={FiGlobe} label="Language & Region" />
                    <SettingsTab icon={FiShield} label="Privacy & Data" />
                    <div style={{ margin: "20px 0", borderTop: "1px solid #f1f5f9" }} />
                    <button 
                        onClick={() => logout()}
                        style={{ 
                            display: "flex", alignItems: "center", gap: "12px", padding: "12px", 
                            borderRadius: "10px", background: "transparent", border: "none",
                            color: "#ef4444", fontSize: "14px", fontWeight: 800, cursor: "pointer",
                            width: "100%", textAlign: "left"
                        }}
                    >
                        <FiLogOut /> Sign Out from Portal
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div className="card" style={{ padding: "32px", border: "1px solid var(--border-light)", background: "white" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "32px" }}>Personal Information</h3>
                        <div className="grid-2" style={{ gap: "24px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <label style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Work Email</label>
                                <div style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", fontWeight: 600, color: "#64748b" }}>
                                    employee.portal@ravizoho.com
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <label style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Phone Number</label>
                                <div style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", fontSize: "14px", fontWeight: 600 }}>
                                    +91 98765 43210
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: "40px" }}>
                           <h4 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "20px" }}>Display Preferences</h4>
                           <div style={{ padding: "20px", borderRadius: "16px", border: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                               <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                   <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "white", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                                       <FiMoon size={20} />
                                   </div>
                                   <div>
                                       <div style={{ fontSize: "14px", fontWeight: 800 }}>Elite Dark Mode</div>
                                       <div style={{ fontSize: "12px", color: "#64748b" }}>Switch to the high-density night aesthetic.</div>
                                   </div>
                               </div>
                               <div style={{ 
                                   width: "48px", height: "24px", borderRadius: "20px", 
                                   background: "#e2e8f0", position: "relative", cursor: "pointer"
                               }}>
                                   <div style={{ 
                                       position: "absolute", left: "2px", top: "2px", 
                                       width: "20px", height: "20px", borderRadius: "50%", background: "white",
                                       boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                   }} />
                               </div>
                           </div>
                        </div>

                        <div style={{ marginTop: "40px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button className="btn btn-secondary">Discard Changes</button>
                            <button className="btn btn-primary">Save Preferences</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsTab({ active, icon: Icon, label, badge }: any) {
    return (
        <div style={{ 
            display: "flex", alignItems: "center", gap: "12px", padding: "14px", 
            borderRadius: "14px", background: active ? "#f8fafc" : "transparent",
            color: active ? "var(--primary)" : "#64748b", fontWeight: 800,
            fontSize: "14px", cursor: "pointer", transition: "all 0.2s ease",
            border: active ? "1px solid var(--border-light)" : "1px solid transparent"
        }}>
            <Icon size={18} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge && <span style={{ fontSize: "9px", background: "#3b82f6", color: "white", padding: "2px 6px", borderRadius: "4px" }}>{badge}</span>}
            <FiChevronRight style={{ opacity: active ? 1 : 0.4 }} />
        </div>
    );
}
