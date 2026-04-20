"use client";

import React, { useState, useEffect } from "react";
import { FiShield, FiTrendingUp, FiArrowLeft, FiClock, FiFileText, FiPieChart, FiDollarSign, FiActivity } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function EsiPfPage() {
    const [contributions, setContributions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.PAYROLL);
                setContributions(res.data.data || []);
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <Link href="/employee/dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>ESI & PF Benefits</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Monitor your Employee Provident Fund (EPF) and State Insurance (ESI) contributions.</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ background: "white", padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-light)", fontSize: "13px", fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiShield /> UAN Active
                  </div>
                </div>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <BenefitStat label="PF BALANCE (EST.)" val="₹1,42,500" color="var(--primary)" icon={FiDollarSign} />
                <BenefitStat label="MONTHLY CONTRIB." val="₹3,600" color="#3b82f6" icon={FiActivity} />
                <BenefitStat label="ESI COVERAGE" val="Family" color="#10b981" icon={FiShield} />
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: "1fr 400px", gap: "32px" }}>
                <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0" }}>
                    <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Contribution History</div>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>FY 2025-24 Summary</div>
                    </div>
                    <div style={{ padding: "0" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                                    <th style={{ padding: "16px 24px", textAlign: "left", fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Month</th>
                                    <th style={{ padding: "16px 24px", textAlign: "right", fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Employee Share</th>
                                    <th style={{ padding: "16px 24px", textAlign: "right", fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Employer Share</th>
                                    <th style={{ padding: "16px 24px", textAlign: "center", fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contributions.map((c, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "16px 24px", fontWeight: 800, fontSize: "14px" }}>{c.month}</td>
                                        <td style={{ padding: "16px 24px", textAlign: "right", fontSize: "14px", fontWeight: 700 }}>{c.employee}</td>
                                        <td style={{ padding: "16px 24px", textAlign: "right", fontSize: "14px", fontWeight: 700 }}>{c.employer}</td>
                                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                                            <span style={{ padding: "4px 10px", borderRadius: "6px", background: "#f0fdf4", color: "#10b981", fontSize: "11px", fontWeight: 800 }}>{c.status.toUpperCase()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)", background: "linear-gradient(to right, #1e293b, #0f172a)", color: "white" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <FiPieChart style={{ color: "var(--primary)" }} /> Statutory Breakdown
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <BreakdownRow label="EPF (Employee)" val="12.0%" />
                            <BreakdownRow label="EPF (Employer)" val="3.67%" />
                            <BreakdownRow label="EPS (Employer)" val="8.33%" />
                            <BreakdownRow label="ESI (Employee)" val="0.75%" />
                        </div>
                    </div>

                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)" }}>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <FiFileText size={24} style={{ color: "var(--primary)", flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 800 }}>UAN / ESI Documents</div>
                                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Download your UAN card and ESI medical eligibility certificate.</p>
                                <button className="btn btn-secondary btn-sm" style={{ marginTop: "12px", fontWeight: 800 }}>DOWNLOAD ALL</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BenefitStat({ label, val, color, icon: Icon }: any) {
    return (
        <div style={{ 
            background: "white", padding: "24px", borderRadius: "20px", 
            border: "1px solid var(--border-light)", display: "flex", 
            justifyContent: "space-between", alignItems: "center" 
        }}>
            <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", marginBottom: "8px" }}>{label}</div>
                <div style={{ fontSize: "28px", fontWeight: 950, color: "#0f172a" }}>{val}</div>
            </div>
            <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={24} />
            </div>
        </div>
    );
}

function BreakdownRow({ label, val }: any) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "13px", opacity: 0.8 }}>{label}</div>
            <div style={{ fontSize: "14px", fontWeight: 900 }}>{val}</div>
        </div>
    );
}
