"use client";

import React, { useState } from "react";
import { FiDownload, FiEye, FiFileText, FiFilter, FiCalendar, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

export default function EmployeePayslipsPage() {
    const [loading, setLoading] = useState(false);

    const payslips = [
        { id: "PS-2026-03", month: "March 2026", date: "2026-03-31", netPay: 75000, status: "Paid", type: "Regular" },
        { id: "PS-2026-02", month: "February 2026", date: "2026-02-28", netPay: 75000, status: "Paid", type: "Regular" },
        { id: "PS-2026-01", month: "January 2026", date: "2026-01-31", netPay: 75000, status: "Paid", type: "Regular" },
    ];

    return (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                        <Link href="/employee/dashboard" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                            <FiArrowLeft size={18} />
                        </Link>
                        <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>My Payslips</h1>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, marginLeft: "30px" }}>
                        View and download your monthly salary statements and tax documents.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary btn-sm"><FiFilter /> Filter</button>
                    <button className="btn btn-primary btn-sm"><FiDownload /> Export All</button>
                </div>
            </div>

            {/* 🚀 Current Month Summary Card (Branded Orange) */}
            <div className="card" style={{ 
                background: "linear-gradient(135deg, var(--primary) 0%, #FF8C00 100%)", 
                color: "white", border: "none",
                boxShadow: "0 10px 30px -10px rgba(255, 107, 0, 0.3)"
            }}>
                <div className="card-body" style={{ padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Last Salary Credited</div>
                        <div style={{ fontSize: "36px", fontWeight: 900 }}>₹75,000.00</div>
                        <div style={{ fontSize: "13px", color: "white", marginTop: "4px", fontWeight: 600, opacity: 0.9 }}>Paid on March 31, 2026</div>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button className="btn" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "white", fontWeight: 700 }}>
                            <FiEye /> View Details
                        </button>
                        <button className="btn" style={{ background: "white", color: "var(--primary)", border: "none", fontWeight: 800 }}>
                            <FiDownload /> Download March Statement
                        </button>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Statement History</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Month</th>
                                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Pay Date</th>
                                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Reference ID</th>
                                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Net Pay</th>
                                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                                    <th style={{ padding: "12px 20px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payslips.map((slip, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                        <td style={{ padding: "16px 20px" }}>
                                            <div style={{ fontWeight: 700, fontSize: "14px" }}>{slip.month}</div>
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{slip.type} Salary</div>
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: "13px" }}>{new Date(slip.date).toLocaleDateString()}</td>
                                        <td style={{ padding: "16px 20px", fontSize: "12px", fontFamily: "monospace", color: "var(--text-muted)" }}>{slip.id}</td>
                                        <td style={{ padding: "16px 20px", fontWeight: 800, fontSize: "14px" }}>₹{slip.netPay.toLocaleString()}</td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span style={{ padding: "4px 10px", borderRadius: "20px", background: "#ecfdf5", color: "#10b981", fontSize: "11px", fontWeight: 700 }}>
                                                {slip.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                <button className="btn btn-secondary btn-sm" title="View"><FiEye /></button>
                                                <button className="btn btn-secondary btn-sm" title="Download"><FiDownload /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
