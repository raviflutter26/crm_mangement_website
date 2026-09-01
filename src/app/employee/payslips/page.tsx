"use client";

import React, { useState, useEffect } from "react";
import { FiDownload, FiEye, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import PayslipModal from "@/components/payroll/PayslipModal";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmt = (n: any) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function EmployeePayslipsPage() {
    const { user } = useAuth();
    const [payslips, setPayslips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?._id) return;
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.PAYROLL, { params: { employee: user._id, limit: 24 } });
                setPayslips(res.data.data || []);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?._id]);

    const latest = payslips[0];

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>Loading...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

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
                        View and download your monthly salary statements.
                    </p>
                </div>
            </div>

            {/* Current Month Summary Card */}
            {latest ? (
                <div className="card" style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, #FF8C00 100%)",
                    color: "white", border: "none",
                    boxShadow: "0 10px 30px -10px rgba(255, 107, 0, 0.3)"
                }}>
                    <div className="card-body" style={{ padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Last Salary — {MONTHS[(latest.month || 1) - 1]} {latest.year}</div>
                            <div style={{ fontSize: "36px", fontWeight: 900 }}>{fmt(latest.netPay)}</div>
                            <div style={{ fontSize: "13px", color: "white", marginTop: "4px", fontWeight: 600, opacity: 0.9 }}>
                                {latest.paymentStatus === 'Paid' && latest.paymentDate ? `Paid on ${new Date(latest.paymentDate).toLocaleDateString()}` : latest.paymentStatus}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button className="btn" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "white", fontWeight: 700 }} onClick={() => setSelected(latest)}>
                                <FiEye /> View Details
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No payslips available yet. They'll appear here once payroll has been processed for you.
                </div>
            )}

            {/* History Table */}
            {payslips.length > 0 && (
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
                                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Net Pay</th>
                                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                                    <th style={{ padding: "12px 20px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payslips.map((slip) => (
                                    <tr key={slip._id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                        <td style={{ padding: "16px 20px" }}>
                                            <div style={{ fontWeight: 700, fontSize: "14px" }}>{MONTHS[(slip.month || 1) - 1]} {slip.year}</div>
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: "13px" }}>{slip.paymentDate ? new Date(slip.paymentDate).toLocaleDateString() : '-'}</td>
                                        <td style={{ padding: "16px 20px", fontWeight: 800, fontSize: "14px" }}>{fmt(slip.netPay)}</td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span style={{
                                                padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                                                background: slip.paymentStatus === 'Paid' ? '#ecfdf5' : slip.paymentStatus === 'Failed' ? '#fef2f2' : '#fffbeb',
                                                color: slip.paymentStatus === 'Paid' ? '#10b981' : slip.paymentStatus === 'Failed' ? '#ef4444' : '#f59e0b'
                                            }}>
                                                {slip.paymentStatus}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                <button className="btn btn-secondary btn-sm" title="View" onClick={() => setSelected(slip)}><FiEye /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            )}

            {selected && <PayslipModal data={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}
