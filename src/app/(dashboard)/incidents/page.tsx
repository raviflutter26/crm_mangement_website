"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiActivity, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/common/DialogProvider";

const EMPTY_FORM = {
    type: "Hazard Report",
    site: "",
    description: "",
    severity: "Medium",
    date: new Date().toISOString().slice(0, 10),
};

const STATUSES = ["Reported", "In-Progress", "Resolved", "Closed"];

export default function incidentsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.INCIDENTS);
            setData(res.data.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.site.trim()) {
            toast.error("Site is required");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.INCIDENTS, { ...formData, reportedBy: user?._id });
            toast.success("Incident logged");
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to log incident");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            await axiosInstance.put(`${API_ENDPOINTS.INCIDENTS}/${id}`, { status });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update status");
        } finally {
            setUpdatingId(null);
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
                    <h1 className="page-title">Incident Reports</h1>
                    <p className="page-subtitle">Track workplace incidents, near misses, and hazard reports. — {data.length} records found.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}><FiPlus /> Add New</button>
                </div>
            </div>

            {data.length === 0 ? (
                <EmptyState
                    title="No Records Found"
                    description="Get started by adding your first record to this module."
                    icon={FiActivity}
                    actionLabel="Add New"
                    onAction={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
                />
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Incident Reports</h3>
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
                                    <th>Type</th>
                                    <th>Site</th>
                                    <th>Reported By</th>
                                    <th>Severity</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: any, i: number) => (
                                    <tr key={item._id || i}>
                                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{item.type}</td>
                                        <td style={{ fontSize: "13px" }}>{item.site}</td>
                                        <td style={{ fontSize: "13px" }}>{item.reportedBy ? `${item.reportedBy.firstName || ''} ${item.reportedBy.lastName || ''}`.trim() : '-'}</td>
                                        <td><span className={`badge ${item.severity === 'Low' ? 'active' : item.severity === 'Critical' ? 'inactive' : 'pending'}`}>{item.severity}</span></td>
                                        <td>
                                            <select
                                                className="form-input"
                                                style={{ padding: "4px 8px", fontSize: "12px", fontWeight: 700 }}
                                                value={item.status}
                                                disabled={updatingId === item._id}
                                                onChange={e => handleStatusChange(item._id, e.target.value)}
                                            >
                                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
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
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Log an Incident</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Type</label>
                                    <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option>Near Miss</option>
                                        <option>Hazard Report</option>
                                        <option>Injury</option>
                                        <option>Property Damage</option>
                                        <option>Environmental</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Severity</label>
                                    <select className="form-input" value={formData.severity} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Site *</label>
                                <input required type="text" className="form-input" value={formData.site} onChange={e => setFormData({ ...formData, site: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Date</label>
                                <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Description</label>
                                <textarea className="form-input" rows={3} style={{ resize: "none" }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Saving..." : "Log Incident"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
