"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/lib/auth";
import { FiPlus, FiLayers, FiCalendar, FiTarget, FiEdit2, FiTrash2 } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useConfirm, useToast } from "@/components/common/DialogProvider";
import AddProjectPage from "@/page_components/projects/AddProjectPage";

interface ProjectsPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function ProjectsPage({ showNotify }: ProjectsPageProps) {
    const { user } = useAuth();
    const confirmDialog = useConfirm();
    const toast = useToast();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"list" | "form">("list");
    const [editingProject, setEditingProject] = useState<any>(null);

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

    const openAdd = () => { setEditingProject(null); setView("form"); };
    const openEdit = (p: any) => { setEditingProject(p); setView("form"); };
    const backToList = () => { setEditingProject(null); setView("list"); };
    const handleSaved = () => { backToList(); fetchData(); };

    const notify = (type: 'success' | 'failure' | 'warning', message: string) => {
        if (showNotify) showNotify(type, message);
        else if (type === 'failure') toast.error(message);
        else toast.info(message);
    };

    const handleDelete = async (id: string) => {
        const ok = await confirmDialog({
            title: "Delete this project?",
            description: "This action cannot be undone.",
            confirmLabel: "Delete",
            danger: true,
        });
        if (!ok) return;
        try { await axiosInstance.delete(`${API_ENDPOINTS.PROJECTS}/${id}`); fetchData(); }
        catch (err: any) { toast.error(err.response?.data?.message || err.message); }
    };

    if (view === "form") {
        return <AddProjectPage onBack={backToList} onSuccess={handleSaved} showNotify={notify} editProject={editingProject} />;
    }

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
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", minWidth: 0, flex: 1 }}>
                                    <div style={{ flexShrink: 0, width: "42px", height: "42px", borderRadius: "10px", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                        <FiLayers size={22} />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <h3 title={proj.name} style={{
                                            fontSize: "16px", fontWeight: "700", margin: 0, lineHeight: 1.3,
                                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                                        }}>{proj.name}</h3>
                                        <span className={`badge ${proj.status === 'Completed' ? 'active' : proj.status === 'In Progress' ? 'warning' : 'inactive'}`} style={{ marginTop: "8px", display: "inline-block" }}>{proj.status}</span>
                                        <div title={proj.client} style={{
                                            fontSize: "12px", color: "var(--text-muted)", marginTop: "6px",
                                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                        }}>{proj.client}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
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
        </>
    );
}
