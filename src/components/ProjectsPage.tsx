"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/lib/auth";
import { FiPlus, FiLayers, FiCalendar, FiTarget, FiActivity, FiEdit2, FiTrash2, FiCheckCircle } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";

interface ProjectsPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function ProjectsPage({ showNotify }: ProjectsPageProps) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<any>({ status: 'Planning', progress: 0 });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.PROJECTS, {
                params: { organizationId: user?.organizationId }
            });
            setProjects(res.data.data || []);
        } catch (err) { 
            console.error("Fetch error:", err);
            showNotify?.('failure', "Failed to load projects");
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => { setIsEditing(false); setFormData({ status: 'Planning', progress: 0 }); setShowModal(true); };
    const openEdit = (p: any) => {
        setIsEditing(true); setEditId(p._id);
        setFormData({ name: p.name, client: p.client, description: p.description, status: p.status, progress: p.progress, startDate: p.startDate?.split('T')[0], endDate: p.endDate?.split('T')[0], budget: p.budget, site: p.site });
        setShowModal(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (isEditing) { await axiosInstance.put(`${API_ENDPOINTS.PROJECTS}/${editId}`, formData); }
            else { await axiosInstance.post(API_ENDPOINTS.PROJECTS, formData); }
            setShowModal(false); fetchData();
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this project?")) return;
        try { await axiosInstance.delete(`${API_ENDPOINTS.PROJECTS}/${id}`); fetchData(); }
        catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const stats = [
        { label: "Total Projects", value: projects.length, color: "#1A73E8" },
        { label: "In Progress", value: projects.filter(p => p.status === 'In Progress').length, color: "#FF6D00" },
        { label: "Completed", value: projects.filter(p => p.status === 'Completed').length, color: "#34A853" },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Project Management</h1>
                    <p className="page-subtitle">Track project timelines, status, and client deliverables.</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><FiPlus /> New Project</button>
            </div>

            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
                        <div className="stat-card-value">{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "30vh", flexDirection: "column", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : projects.length === 0 ? (
                <EmptyState title="No Projects Initiated" description="Create your first project to begin tracking progress." icon={FiLayers} actionLabel="New Project" onAction={openAdd} />
            ) : (
                <div className="grid-3">
                    {projects.map((proj) => (
                        <div key={proj._id} className="card animate-in" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                        <FiLayers size={22} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "16px", fontWeight: "700" }}>{proj.name}</h3>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                            <span className={`badge ${proj.status === 'Completed' ? 'active' : proj.status === 'In Progress' ? 'warning' : 'inactive'}`}>{proj.status}</span>
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{proj.client}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(proj)}><FiEdit2 /></button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(proj._id)} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                </div>
                            </div>
                            <div style={{ marginTop: "8px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Progress</span>
                                    <span style={{ fontSize: "12px", fontWeight: 800 }}>{proj.progress || 0}%</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", background: "var(--bg-secondary)", borderRadius: "10px", overflow: "hidden" }}>
                                    <div style={{ width: `${proj.progress || 0}%`, height: "100%", background: "var(--primary)", transition: "width 0.5s ease" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div style={{ padding: "10px", background: "var(--bg-primary)", borderRadius: "8px" }}>
                                    <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Start Date</div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                        <FiCalendar /> {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : '-'}
                                    </div>
                                </div>
                                <div style={{ padding: "10px", background: "var(--bg-primary)", borderRadius: "8px" }}>
                                    <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>End Date</div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                        <FiTarget /> {proj.endDate ? new Date(proj.endDate).toLocaleDateString() : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "520px", maxHeight: "85vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit" : "New"} Project</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Project Name *</label>
                                <input required type="text" className="form-input" value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Client</label>
                                    <input type="text" className="form-input" value={formData.client || ""} onChange={e => setFormData({ ...formData, client: e.target.value })} /></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Site</label>
                                    <input type="text" className="form-input" value={formData.site || ""} onChange={e => setFormData({ ...formData, site: e.target.value })} /></div>
                            </div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Status</label>
                                    <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Planning">Planning</option><option value="In Progress">In Progress</option>
                                        <option value="On Hold">On Hold</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Progress (%)</label>
                                    <input type="number" className="form-input" min={0} max={100} value={formData.progress || 0} onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })} /></div>
                            </div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Start Date</label>
                                    <input type="date" className="form-input" value={formData.startDate || ""} onChange={e => setFormData({ ...formData, startDate: e.target.value })} /></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>End Date</label>
                                    <input type="date" className="form-input" value={formData.endDate || ""} onChange={e => setFormData({ ...formData, endDate: e.target.value })} /></div>
                            </div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Budget (₹)</label>
                                <input type="number" className="form-input" value={formData.budget || ""} onChange={e => setFormData({ ...formData, budget: parseFloat(e.target.value) })} /></div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Description</label>
                                <textarea className="form-input" value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} style={{ resize: "none" }} /></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? "Save" : "Create Project"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
