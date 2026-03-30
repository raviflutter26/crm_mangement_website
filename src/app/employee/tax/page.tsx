"use client";

import React, { useState } from "react";
import { FiFileText, FiDownload, FiPlus, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiLock, FiCalendar } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

export default function TaxPage() {
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Tax Docs & Declarations</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Manage your investment declarations, Form 16, and TDS certificates.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiPlus size={18} /> NEW DECLARATION
                </button>
            </motion.div>

            <div className="card" style={{ background: "#fef3c7", border: "1px solid #fcd34d", padding: "24px", marginBottom: "32px" }}>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                    <FiAlertCircle size={24} style={{ color: "#d97706", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#92400e" }}>Quarterly Declaration Pending</div>
                        <p style={{ fontSize: "13px", color: "#b45309", marginTop: "4px", lineHeight: "1.5" }}>
                            The window for Q4 investment declarations is open. Please submit your proofs by April 15, 2026 to avoid excessive TDS deduction.
                        </p>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ fontWeight: 800, background: "white" }}>RESOLVE NOW</button>
                </div>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                <div className="card" style={{ border: "1px solid var(--border-light)", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Key Tax Documents</h3>
                        <FiLock style={{ color: "#94a3b8" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <TaxDocRow name="Form 16 (FY 2025-24)" date="May 15, 2026" size="1.2 MB" />
                        <TaxDocRow name="Form 12BB (Investment)" date="Mar 30, 2026" size="450 KB" />
                        <TaxDocRow name="TDS Certificate (Q3)" date="Feb 10, 2026" size="680 KB" />
                    </div>
                </div>

                <div className="card" style={{ border: "1px solid var(--border-light)", padding: "24px", background: "white" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Regime Selection</h3>
                        <span style={{ fontSize: "10px", fontWeight: 800, padding: "4px 10px", borderRadius: "6px", background: "#f0fdf4", color: "#10b981", border: "1px solid #dcfce7" }}>ACTIVE</span>
                    </div>
                    
                    <div style={{ padding: "24px", borderRadius: "16px", background: "#f8fafc", border: "1px solid #f1f5f9", marginBottom: "20px" }}>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginBottom: "8px" }}>SELECTED REGIME</div>
                        <div style={{ fontSize: "20px", fontWeight: 900, color: "#1e293b" }}>Old Tax Regime</div>
                        <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px", lineHeight: "1.5" }}>
                            You can switch to the New Tax Regime during the next declaration window (April 2026).
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)", fontSize: "13px", fontWeight: 800 }}>
                        <FiCalendar /> View Regime Comparison
                    </div>
                </div>
            </div>
        </div>
    );
}

function TaxDocRow({ name, date, size }: any) {
    return (
        <div style={{ 
            padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", gap: "16px", background: "#f8fafc"
        }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "white", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                <FiFileText size={20} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>{name}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Generated on {date} • {size}</div>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ padding: "8px", borderRadius: "8px" }}><FiDownload /></button>
        </div>
    );
}
