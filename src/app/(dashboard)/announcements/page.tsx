"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiMail, FiPlus, FiTrash2 } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useConfirm, useToast } from "@/components/common/DialogProvider";

const CATEGORIES = ["General", "Policy Update", "Meeting", "Achievement", "Emergency", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const PRIORITY_COLORS: Record<string, string> = { Low: "active", Medium: "pending", High: "leave", Urgent: "inactive" };

const EMPTY_FORM = { title: "", body: "", category: "General", priority: "Medium", expiresAt: "" };

// Admin/HR view: publish announcements that every employee sees on
// /me/announcements. The poster is stamped server-side from the token.
export default function AnnouncementsAdminPage() {
    const toast = useToast();
    const confirmDialog = useConfirm();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.ANNOUNCEMENTS);
            setData(res.data.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => { setFormData(EMPTY_FORM); setShowModal(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error("A title is required");
            return;
        }
        setSubmitting(true);
        try {
            const payload = { ...formData };
            if (!payload.expiresAt) delete payload.expiresAt;
            await axiosInstance.post(API_ENDPOINTS.ANNOUNCEMENTS, payload);
            toast.success("Announcement published");
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to publish announcement");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        const ok = await confirmDialog({
            title: "Delete this announcement?",
            description: "Employees will no longer see it.",
            confirmLabel: "Delete",
            danger: true,
        });
        if (!ok) return;
        try {
            await axiosInstance.delete(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete announcement");
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
                    <h1 className="page-title">Announcements</h1>
                    <p className="page-subtitle">Publish news and policy updates to every employee. — {data.length} published.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Announcement</button>
                </div>
            </div>

            {data.length === 0 ? (
                <EmptyState
                    title="No Announcements Yet"
                    description="Publish your first announcement to reach every employee."
                    icon={FiMail}
                    actionLabel="New Announcement"
                    onAction={openCreate}
                />
            ) : (
                <div className="card">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Priority</th>
                                    <th>Published</th>
                                    <th>Expires</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: any) => (
                                    <tr key={item._id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{item.title}</div>
                                            {item.body && <div style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "420px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.body}</div>}
                                        </td>
                                        <td>{item.category || "General"}</td>
                                        <td><span className={`badge ${PRIORITY_COLORS[item.priority] || "pending"}`}>{item.priority || "Medium"}</span></td>
                                        <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td>
                                        <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "-"}</td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(item._id)} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "520px", maxHeight: "85vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>New Announcement</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Title *</label>
                                <input required type="text" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Message</label>
                                <textarea className="form-input" value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} rows={4} style={{ resize: "none" }} /></div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Category</label>
                                    <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Priority</label>
                                    <select className="form-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select></div>
                            </div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Expires On</label>
                                <input type="date" className="form-input" value={formData.expiresAt} onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} /></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Publishing..." : "Publish"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
