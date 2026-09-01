"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiGlobe, FiPlus, FiTrash2, FiAlertTriangle, FiX } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/components/common/DialogProvider";
import { useConfirm } from "@/components/common/DialogProvider";

const EMPTY_FORM = { label: "", ipOrCidr: "", notes: "" };

export default function ipAllowlistPage() {
    const toast = useToast();
    const confirmDialog = useConfirm();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.IP_ALLOWLIST);
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
        if (!formData.label.trim() || !formData.ipOrCidr.trim()) {
            toast.error("Label and IP/CIDR are required");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.IP_ALLOWLIST, formData);
            toast.success("Entry added");
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add entry");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (item: any) => {
        try {
            await axiosInstance.put(`${API_ENDPOINTS.IP_ALLOWLIST}/${item._id}`, { isActive: !item.isActive });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update entry");
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog({ title: "Remove entry?", description: "This IP/CIDR entry will be permanently removed from the list.", confirmLabel: "Delete", danger: true });
        if (!confirmed) return;
        try {
            await axiosInstance.delete(`${API_ENDPOINTS.IP_ALLOWLIST}/${id}`);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to remove entry");
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
                    <h1 className="page-title">IP Allowlist</h1>
                    <p className="page-subtitle">Manage the list of trusted IP addresses and network ranges. — {data.length} entries.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}><FiPlus /> Add Entry</button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "12px", padding: "14px 18px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", marginBottom: "20px" }}>
                <FiAlertTriangle style={{ color: "#d97706", flexShrink: 0 }} size={20} />
                <div style={{ fontSize: "13px", color: "#92400e", fontWeight: 600 }}>
                    This list is stored for reference only — requests are <strong>not currently restricted</strong> based on it. Enforcement is not yet built.
                </div>
            </div>

            {data.length === 0 ? (
                <EmptyState
                    title="No Entries Yet"
                    description="Add trusted IP addresses or CIDR ranges to keep track of them here."
                    icon={FiGlobe}
                    actionLabel="Add Entry"
                    onAction={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
                />
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Allowlist Entries</h3>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Label</th>
                                    <th>IP / CIDR</th>
                                    <th>Notes</th>
                                    <th>Active</th>
                                    <th>Added</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: any) => (
                                    <tr key={item._id}>
                                        <td style={{ fontWeight: 600 }}>{item.label}</td>
                                        <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{item.ipOrCidr}</td>
                                        <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.notes || '-'}</td>
                                        <td>
                                            <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                                                <input type="checkbox" checked={item.isActive} onChange={() => handleToggleActive(item)} />
                                            </label>
                                        </td>
                                        <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" style={{ padding: "6px 10px", color: "#ef4444" }} onClick={() => handleDelete(item._id)}><FiTrash2 /></button>
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
                    <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "32px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Add IP/CIDR Entry</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Label *</label>
                                <input required type="text" className="form-input" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} placeholder="e.g. HQ Office" />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>IP Address or CIDR *</label>
                                <input required type="text" className="form-input" value={formData.ipOrCidr} onChange={e => setFormData({ ...formData, ipOrCidr: e.target.value })} placeholder="e.g. 203.0.113.4 or 203.0.113.0/24" />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Notes</label>
                                <textarea className="form-input" rows={2} style={{ resize: "none" }} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Adding..." : "Add Entry"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
