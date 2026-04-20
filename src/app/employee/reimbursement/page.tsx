"use client";

import React, { useState, useEffect } from "react";
import { FiDollarSign, FiPlus, FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiCamera, FiTrash2, FiEdit3, FiPaperclip } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export default function ReimbursementPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.REIMBURSEMENTS_MY);
                setExpenses(res.data.data || []);
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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Reimbursements</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Claim travel, lodging, and logistical expenses with digital receipt verification.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}>
                    <FiPlus size={18} /> NEW REIMBURSEMENT CLAIM
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <ExpenseStat label="TOTAL CLAIMED" val="₹18,500" color="var(--primary)" icon={FiDollarSign} />
                <ExpenseStat label="PENDING APPROVAL" val="₹3,200" color="#f59e0b" icon={FiClock} />
                <ExpenseStat label="DISBURSED (YTD)" val="₹15,300" color="#10b981" icon={FiCheckCircle} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", overflow: "hidden" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Recent Claims & Expenses</div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Active Period: FY 2026-25</div>
                </div>
                <div style={{ padding: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {expenses.map((exp, idx) => (
                            <motion.div 
                                key={exp.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                    padding: "20px", borderRadius: "18px", border: "1px solid #f1f5f9",
                                    display: "flex", alignItems: "center", gap: "24px",
                                    background: "white", transition: "all 0.3s ease"
                                }}
                            >
                                <div style={{ 
                                    width: "50px", height: "50px", borderRadius: "16px", 
                                    background: "#f8fafc", color: "var(--primary)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid #e2e8f0"
                                }}>
                                    <FiFileText size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>{exp.category}</div>
                                        <span style={{ 
                                            fontSize: "10px", fontWeight: 800, padding: "4px 10px", borderRadius: "6px",
                                            background: exp.status === 'Approved' ? '#ecfdf5' : '#fffbeb',
                                            color: exp.status === 'Approved' ? '#10b981' : '#f59e0b'
                                        }}>
                                            {exp.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{exp.site} • {exp.date}</div>
                                </div>
                                <div style={{ textAlign: "right", minWidth: "140px" }}>
                                    <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>{exp.amount}</div>
                                    <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 800, textTransform: "uppercase" }}>{exp.id}</div>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button className="btn btn-secondary btn-sm" style={{ padding: "10px", borderRadius: "10px" }} title="View Receipt"><FiPaperclip /></button>
                                    <button className="btn btn-secondary btn-sm" style={{ padding: "10px", borderRadius: "10px", color: "#ef4444" }}><FiTrash2 /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
                <div style={{ padding: "32px", background: "#f8fafc", textAlign: "center", borderTop: "1px solid #f1f5f9" }}>
                   <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, margin: 0 }}>
                     <FiCamera style={{ marginRight: "8px" }} /> Tip: Use the mobile app to scan receipts instantly for faster processing.
                   </p>
                </div>
            </div>
        </div>
    );
}

function ExpenseStat({ label, val, color, icon: Icon }: any) {
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
