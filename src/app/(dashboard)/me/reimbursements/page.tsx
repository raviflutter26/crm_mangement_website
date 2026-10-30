"use client";

import React, { useState, useEffect } from "react";
import { FiDollarSign, FiPlus, FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiPaperclip, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

const EMPTY_FORM = {
    category: "Fuel / Transport",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    site: "",
    description: "",
    receiptUrl: "",
};

export default function ReimbursementPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.REIMBURSEMENTS_MY);
            setExpenses(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || formData.amount <= 0) {
            toast.error("Enter a valid amount");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.REIMBURSEMENTS, { ...formData, employee: user?._id });
            toast.success("Claim submitted");
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit claim");
        } finally {
            setSubmitting(false);
        }
    };

    const totalClaimed = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const pendingTotal = expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + (e.amount || 0), 0);
    const disbursedTotal = expenses.filter(e => e.status === 'Disbursed').reduce((s, e) => s + (e.amount || 0), 0);

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
                    <Link href="/dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Reimbursements</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Claim travel, lodging, and logistical expenses with digital receipt verification.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}
                    onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
                >
                    <FiPlus size={18} /> NEW REIMBURSEMENT CLAIM
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <ExpenseStat label="TOTAL CLAIMED" val={`₹${totalClaimed.toLocaleString()}`} color="var(--primary)" icon={FiDollarSign} />
                <ExpenseStat label="PENDING APPROVAL" val={`₹${pendingTotal.toLocaleString()}`} color="#f59e0b" icon={FiClock} />
                <ExpenseStat label="DISBURSED" val={`₹${disbursedTotal.toLocaleString()}`} color="#10b981" icon={FiCheckCircle} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", overflow: "hidden" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Recent Claims & Expenses</div>
                </div>
                <div style={{ padding: "24px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                    ) : expenses.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            <FiDollarSign size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ fontWeight: 600 }}>No claims filed yet.</p>
                        </div>
                    ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {expenses.map((exp, idx) => (
                            <motion.div
                                key={exp._id}
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
                                            background: exp.status === 'Approved' || exp.status === 'Disbursed' ? '#ecfdf5' : exp.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                                            color: exp.status === 'Approved' || exp.status === 'Disbursed' ? '#10b981' : exp.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                                        }}>
                                            {exp.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{exp.site || 'No site'} • {exp.date ? new Date(exp.date).toLocaleDateString() : '-'}</div>
                                </div>
                                <div style={{ textAlign: "right", minWidth: "140px" }}>
                                    <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>₹{exp.amount?.toLocaleString()}</div>
                                </div>
                                {exp.receiptUrl && (
                                    <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: "10px", borderRadius: "10px" }} title="View Receipt"><FiPaperclip /></a>
                                )}
                            </motion.div>
                        ))}
                    </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "32px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>New Reimbursement Claim</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Category</label>
                                    <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option>Fuel / Transport</option>
                                        <option>Meals & Lodging</option>
                                        <option>Equipment</option>
                                        <option>Communication</option>
                                        <option>Medical</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Amount (₹) *</label>
                                    <input required type="number" min={0} className="form-input" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Date</label>
                                    <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Site</label>
                                    <input type="text" className="form-input" value={formData.site} onChange={e => setFormData({ ...formData, site: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Receipt Link</label>
                                <input type="url" placeholder="https://..." className="form-input" value={formData.receiptUrl} onChange={e => setFormData({ ...formData, receiptUrl: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Description</label>
                                <textarea className="form-input" rows={3} style={{ resize: "none" }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Submitting..." : "Submit Claim"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
