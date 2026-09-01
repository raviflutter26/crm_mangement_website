"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiBriefcase, FiPlus, FiSearch, FiX, FiCheck } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/components/common/DialogProvider";

const now = new Date();
const EMPTY_FORM = {
    employee: "",
    type: "Site Daily Allowance",
    site: "",
    days: 1,
    rate: 0,
    period: { month: now.getMonth() + 1, year: now.getFullYear() },
};

export default function allowancesPage() {
    const toast = useToast();
    const [data, setData] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);
    const [actingId, setActingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [aRes, empRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.SITE_ALLOWANCES),
                axiosInstance.get(API_ENDPOINTS.EMPLOYEES),
            ]);
            setData(aRes.data.data || []);
            setEmployees(empRes.data.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employee || !formData.site.trim() || !formData.rate) {
            toast.error("Employee, site and rate are required");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.SITE_ALLOWANCES, formData);
            toast.success("Allowance claim created");
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create claim");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecision = async (id: string, status: 'Processed' | 'Rejected') => {
        setActingId(id);
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.SITE_ALLOWANCES}/${id}/approve`, { status });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update claim");
        } finally {
            setActingId(null);
        }
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>Loading...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Site Allowances</h1>
                    <p className="page-subtitle">Manage site-based daily allowances, night shift pay, and hazard compensation. — {data.length} records found.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}><FiPlus /> Add New</button>
                </div>
            </div>

            {data.length === 0 ? (
                <EmptyState
                    title="No Records Found"
                    description="Get started by adding your first record to this module."
                    icon={FiBriefcase}
                    actionLabel="Add New"
                    onAction={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
                />
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Site Allowances</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FiSearch style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{data.length} total</span>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Site</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: any, i: number) => (
                                    <tr key={item._id || i}>
                                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{item.employee ? `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.trim() : '-'}</td>
                                        <td style={{ fontSize: "13px" }}>{item.type}</td>
                                        <td style={{ fontSize: "13px" }}>{item.site}</td>
                                        <td style={{ fontSize: "13px", fontWeight: 700 }}>₹{(item.totalAmount || item.days * item.rate).toLocaleString()}</td>
                                        <td><span className={`badge ${item.status === 'Processed' ? 'active' : item.status === 'Rejected' ? 'inactive' : 'pending'}`}>{item.status}</span></td>
                                        <td>
                                            {item.status === 'Pending' ? (
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button className="btn btn-secondary btn-sm" style={{ padding: "6px 10px", color: "#10b981" }} disabled={actingId === item._id} onClick={() => handleDecision(item._id, 'Processed')}><FiCheck /></button>
                                                    <button className="btn btn-secondary btn-sm" style={{ padding: "6px 10px", color: "#ef4444" }} disabled={actingId === item._id} onClick={() => handleDecision(item._id, 'Rejected')}><FiX /></button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "32px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>New Allowance Claim</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Employee *</label>
                                <select required className="form-input" value={formData.employee} onChange={e => setFormData({ ...formData, employee: e.target.value })}>
                                    <option value="">Select employee...</option>
                                    {employees.map((emp: any) => (
                                        <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Type</label>
                                <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option>Site Daily Allowance</option>
                                    <option>Night Shift Allowance</option>
                                    <option>Hazard Pay</option>
                                    <option>Remote Area Allowance</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Site *</label>
                                <input required type="text" className="form-input" value={formData.site} onChange={e => setFormData({ ...formData, site: e.target.value })} />
                            </div>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Days</label>
                                    <input type="number" min={1} className="form-input" value={formData.days} onChange={e => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Rate per Day (₹) *</label>
                                    <input required type="number" min={0} className="form-input" value={formData.rate} onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Creating..." : "Create Claim"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
