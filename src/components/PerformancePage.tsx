"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiTarget, FiTrendingUp, FiAward, FiStar,
    FiPlus, FiEdit2, FiTrash2, FiCheckCircle
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

const PRIORITY_COLORS: any = { low: "active", medium: "pending", high: "leave", critical: "inactive" };
const STATUS_COLORS: any = {
    "not-started": "pending", "in-progress": "processing", completed: "active", deferred: "inactive",
    draft: "pending", "self-review": "processing", "manager-review": "leave",
};

interface PerformancePageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function PerformancePage({ showNotify }: PerformancePageProps) {
    const [activeView, setActiveView] = useState<"goals" | "appraisals">("goals");
    const [goals, setGoals] = useState<any[]>([]);
    const [appraisals, setAppraisals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<any>({});
    const [toast, setToast] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [gRes, aRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.GOALS),
                axiosInstance.get(API_ENDPOINTS.APPRAISALS),
            ]);
            setGoals(gRes.data.data || []);
            setAppraisals(aRes.data.data || []);
        } catch (err) { console.error("Fetch error", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const openAddGoal = () => {
        setActiveView("goals"); setIsEditing(false);
        setFormData({ status: "not-started", priority: "medium", progress: 0, category: "individual" });
        setShowModal(true);
    };

    const openEditGoal = (item: any) => {
        setIsEditing(true); setEditId(item._id);
        setFormData({
            employeeName: item.employeeName || "", title: item.title || "",
            description: item.description || "", category: item.category || "individual",
            targetDate: item.targetDate ? new Date(item.targetDate).toISOString().split("T")[0] : "",
            status: item.status || "not-started", progress: item.progress || 0,
            priority: item.priority || "medium", weightage: item.weightage || 0,
        });
        setShowModal(true);
    };

    const openAddAppraisal = () => {
        setActiveView("appraisals"); setIsEditing(false);
        setFormData({ status: "draft", cycle: "2025-2026" });
        setShowModal(true);
    };

    const openEditAppraisal = (item: any) => {
        setActiveView("appraisals"); setIsEditing(true); setEditId(item._id);
        setFormData({
            employeeName: item.employeeName || "", reviewer: item.reviewer || "",
            cycle: item.cycle || "", period: item.period || "",
            selfRating: item.selfRating || "", managerRating: item.managerRating || "",
            finalRating: item.finalRating || "", selfComments: item.selfComments || "",
            managerComments: item.managerComments || "", strengths: item.strengths || "",
            areasOfImprovement: item.areasOfImprovement || "", status: item.status || "draft",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const endpoint = activeView === "goals" ? API_ENDPOINTS.GOALS : API_ENDPOINTS.APPRAISALS;
            if (isEditing) {
                await axiosInstance.put(`${endpoint}/${editId}`, formData);
                showToast("Updated!");
            } else {
                await axiosInstance.post(endpoint, formData);
                showToast("Created!");
            }
            setShowModal(false); fetchData();
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const handleDelete = async (id: string, type: "goals" | "appraisals") => {
        if (!confirm("Are you sure?")) return;
        const endpoint = type === "goals" ? API_ENDPOINTS.GOALS : API_ENDPOINTS.APPRAISALS;
        try { await axiosInstance.delete(`${endpoint}/${id}`); showToast("Deleted!"); fetchData(); }
        catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const stats = [
        { label: "Total Goals", value: goals.length, icon: FiTarget, color: "blue" },
        { label: "In Progress", value: goals.filter(g => g.status === "in-progress").length, icon: FiTrendingUp, color: "orange" },
        { label: "Completed", value: goals.filter(g => g.status === "completed").length, icon: FiCheckCircle, color: "green" },
        { label: "Appraisals", value: appraisals.length, icon: FiAward, color: "purple" },
    ];

    const renderStars = (rating: number) => {
        return [...Array(5)].map((_, i) => (
            <FiStar key={i} style={{ color: i < rating ? "#FBBC04" : "var(--text-muted)", fill: i < rating ? "#FBBC04" : "none", width: "16px" }} />
        ));
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Performance</h1>
                    <p className="page-subtitle">Track goals, KPIs and appraisal cycles</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary" onClick={openAddAppraisal}><FiAward /> New Appraisal</button>
                    <button className="btn btn-primary" onClick={openAddGoal}><FiPlus /> Add Goal</button>
                </div>
            </div>

            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div key={i} className={`stat-card ${s.color}`}>
                        <div className="stat-card-header"><div className={`stat-card-icon ${s.color}`}><s.icon /></div></div>
                        <div className="stat-card-value">{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <button className={`btn ${activeView === "goals" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveView("goals")}><FiTarget /> Goals ({goals.length})</button>
                <button className={`btn ${activeView === "appraisals" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveView("appraisals")}><FiAward /> Appraisals ({appraisals.length})</button>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{activeView === "goals" ? "Goals & KPIs" : "Appraisal Cycles"}</h3>
                </div>
                <div className="table-wrapper">
                    {loading ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", flexDirection: "column", gap: "16px" }}><div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} /><div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Loading...</div><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div> :
                        activeView === "goals" ? (
                            <table>
                                <thead><tr><th>Employee</th><th>Goal</th><th>Priority</th><th>Progress</th><th>Status</th><th>Target Date</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {goals.map(g => (
                                        <tr key={g._id}>
                                            <td style={{ fontWeight: 600 }}>{g.employeeName || "-"}</td>
                                            <td>{g.title}</td>
                                            <td><span className={`badge ${PRIORITY_COLORS[g.priority]}`}>{g.priority}</span></td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <div style={{ width: "80px", height: "6px", borderRadius: "3px", background: "var(--bg-card)", overflow: "hidden" }}>
                                                        <div style={{ width: `${g.progress}%`, height: "100%", borderRadius: "3px", background: g.progress >= 100 ? "var(--secondary)" : "var(--primary)", transition: "width 0.3s" }} />
                                                    </div>
                                                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{g.progress}%</span>
                                                </div>
                                            </td>
                                            <td><span className={`badge ${STATUS_COLORS[g.status]}`}>{g.status.replace("-", " ")}</span></td>
                                            <td>{g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "-"}</td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => openEditGoal(g)}><FiEdit2 /></button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(g._id, "goals")} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {goals.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No goals set yet.</td></tr>}
                                </tbody>
                            </table>
                        ) : (
                            <table>
                                <thead><tr><th>Employee</th><th>Cycle</th><th>Reviewer</th><th>Self Rating</th><th>Manager Rating</th><th>Final</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {appraisals.map(a => (
                                        <tr key={a._id}>
                                            <td style={{ fontWeight: 600 }}>{a.employeeName || "-"}</td>
                                            <td>{a.cycle}</td>
                                            <td>{a.reviewer || "-"}</td>
                                            <td><div style={{ display: "flex" }}>{renderStars(a.selfRating || 0)}</div></td>
                                            <td><div style={{ display: "flex" }}>{renderStars(a.managerRating || 0)}</div></td>
                                            <td><div style={{ display: "flex" }}>{renderStars(a.finalRating || 0)}</div></td>
                                            <td><span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status.replace("-", " ")}</span></td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => openEditAppraisal(a)}><FiEdit2 /></button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(a._id, "appraisals")} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {appraisals.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No appraisals yet.</td></tr>}
                                </tbody>
                            </table>
                        )
                    }
                </div>
            </div>

            {showModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "560px", maxHeight: "85vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit" : "Create"} {activeView === "goals" ? "Goal" : "Appraisal"}</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {activeView === "goals" ? (
                                <>
                                    <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Employee Name</label>
                                        <input type="text" className="form-input" value={formData.employeeName || ""} onChange={e => setFormData({ ...formData, employeeName: e.target.value })} placeholder="Employee name" /></div>
                                    <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Goal Title *</label>
                                        <input required type="text" className="form-input" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Complete Q1 deliverables" /></div>
                                    <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Description</label>
                                        <textarea className="form-input" value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ resize: "none" }} /></div>
                                    <div className="grid-2">
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Priority</label>
                                            <select className="form-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                                            </select></div>
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Status</label>
                                            <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                                <option value="not-started">Not Started</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="deferred">Deferred</option>
                                            </select></div>
                                    </div>
                                    <div className="grid-2">
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Progress (%)</label>
                                            <input type="number" className="form-input" value={formData.progress} onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })} min={0} max={100} /></div>
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Target Date</label>
                                            <input type="date" className="form-input" value={formData.targetDate || ""} onChange={e => setFormData({ ...formData, targetDate: e.target.value })} /></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid-2">
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Employee Name *</label>
                                            <input required type="text" className="form-input" value={formData.employeeName || ""} onChange={e => setFormData({ ...formData, employeeName: e.target.value })} /></div>
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Reviewer</label>
                                            <input type="text" className="form-input" value={formData.reviewer || ""} onChange={e => setFormData({ ...formData, reviewer: e.target.value })} /></div>
                                    </div>
                                    <div className="grid-2">
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Cycle</label>
                                            <input type="text" className="form-input" value={formData.cycle || ""} onChange={e => setFormData({ ...formData, cycle: e.target.value })} placeholder="2025-2026" /></div>
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Status</label>
                                            <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                                <option value="draft">Draft</option><option value="self-review">Self Review</option><option value="manager-review">Manager Review</option><option value="completed">Completed</option>
                                            </select></div>
                                    </div>
                                    <div className="grid-2">
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Self Rating (1-5)</label>
                                            <input type="number" className="form-input" value={formData.selfRating || ""} onChange={e => setFormData({ ...formData, selfRating: parseInt(e.target.value) })} min={1} max={5} /></div>
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Manager Rating (1-5)</label>
                                            <input type="number" className="form-input" value={formData.managerRating || ""} onChange={e => setFormData({ ...formData, managerRating: parseInt(e.target.value) })} min={1} max={5} /></div>
                                    </div>
                                    <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Strengths</label>
                                        <textarea className="form-input" value={formData.strengths || ""} onChange={e => setFormData({ ...formData, strengths: e.target.value })} rows={2} style={{ resize: "none" }} /></div>
                                    <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Areas of Improvement</label>
                                        <textarea className="form-input" value={formData.areasOfImprovement || ""} onChange={e => setFormData({ ...formData, areasOfImprovement: e.target.value })} rows={2} style={{ resize: "none" }} /></div>
                                </>
                            )}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? "Save" : "Create"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "rgba(34, 197, 94, 0.9)", color: "white", padding: "12px 20px", borderRadius: "8px", zIndex: 3000, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, animation: "fadeInUp 0.3s ease-out" }}>
                    <FiCheckCircle size={20} /> {toast}
                </div>
            )}
        </>
    );
}
