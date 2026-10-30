"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiTarget, FiTrendingUp, FiAward, FiStar,
    FiPlus, FiEdit2, FiTrash2, FiCheckCircle
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useConfirm, useToast } from "@/components/common/DialogProvider";
import { useAuth } from "@/lib/auth";

const PRIORITY_COLORS: any = { low: "active", medium: "pending", high: "leave", critical: "inactive" };
const STATUS_COLORS: any = {
    "not-started": "pending", "in-progress": "processing", completed: "active", deferred: "inactive",
    draft: "pending", "self-review": "processing", "manager-review": "leave", "hr-review": "leave",
    active: "active", closed: "inactive",
};
const LABEL_STYLE: any = { display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" };
const errMsg = (err: any) => err?.response?.data?.message || err?.message || "Something went wrong";
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "-");
const toInputDate = (d?: string) => (d ? new Date(d).toISOString().split("T")[0] : "");

interface PerformancePageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function PerformancePage({ showNotify }: PerformancePageProps) {
    const confirmDialog = useConfirm();
    const dialogToast = useToast();
    const { user } = useAuth();
    const role = String(user?.role || "").toLowerCase();
    const isHR = ["owner", "admin", "hr"].includes(role);
    const [activeView, setActiveView] = useState<"goals" | "appraisals" | "reviews" | "cycles">("goals");
    const [cycles, setCycles] = useState<any[]>([]);
    const [cycleModal, setCycleModal] = useState<any>(null); // form data, with _id when editing
    const [review, setReview] = useState<any>(null);         // single appraisal with goals
    const [reviewForm, setReviewForm] = useState<any>({});
    const [goals, setGoals] = useState<any[]>([]);
    const [appraisals, setAppraisals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<any>({});
    const [toast, setToast] = useState("");
    const [employees, setEmployees] = useState<any[]>([]);

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
        try {
            const cRes = await axiosInstance.get(API_ENDPOINTS.APPRAISAL_CYCLES);
            setCycles(cRes.data.data || []);
        } catch { setCycles([]); }
    };

    // ========== CYCLES ==========
    const openNewCycle = () => setCycleModal({ name: "", period: "" });
    const openEditCycle = (c: any) => setCycleModal({
        _id: c._id, name: c.name, period: c.period || "",
        startDate: toInputDate(c.startDate), endDate: toInputDate(c.endDate),
        selfReviewDue: toInputDate(c.selfReviewDue), managerReviewDue: toInputDate(c.managerReviewDue),
    });
    const saveCycle = async (e: any) => {
        e.preventDefault();
        const { _id, ...body } = cycleModal;
        try {
            if (_id) await axiosInstance.put(`${API_ENDPOINTS.APPRAISAL_CYCLES}/${_id}`, body);
            else await axiosInstance.post(API_ENDPOINTS.APPRAISAL_CYCLES, body);
            setCycleModal(null); showToast("Cycle saved"); fetchData();
        } catch (err) { dialogToast.error(errMsg(err)); }
    };
    const cycleAction = async (c: any, action: "activate" | "close") => {
        const ok = await confirmDialog({
            title: action === "activate" ? `Activate ${c.name}?` : `Close ${c.name}?`,
            description: action === "activate"
                ? "An appraisal is created for every active employee in your scope, starting at self-review."
                : "No further reviews can be started in a closed cycle.",
            confirmLabel: action === "activate" ? "Activate" : "Close",
        });
        if (!ok) return;
        try {
            const res = await axiosInstance.patch(`${API_ENDPOINTS.APPRAISAL_CYCLES}/${c._id}/${action}`);
            showToast(action === "activate" ? `Activated — ${res.data.created ?? 0} appraisal(s) created` : "Cycle closed");
            fetchData();
        } catch (err) { dialogToast.error(errMsg(err)); }
    };

    // ========== REVIEWS ==========
    const openReview = async (a: any) => {
        try {
            const res = await axiosInstance.get(`${API_ENDPOINTS.APPRAISALS}/${a._id}`);
            const data = res.data.data;
            setReview(data);
            setReviewForm(data.status === "hr-review"
                ? { finalRating: data.managerRating || "", hrComments: "" }
                : { managerRating: data.managerRating || "", managerComments: data.managerComments || "", strengths: data.strengths || "", areasOfImprovement: data.areasOfImprovement || "" });
        } catch (err) { dialogToast.error(errMsg(err)); }
    };
    const submitReview = async (e: any) => {
        e.preventDefault();
        try {
            if (review.status === "hr-review") {
                await axiosInstance.patch(API_ENDPOINTS.APPRAISAL_FINALIZE(review._id), { ...reviewForm, finalRating: Number(reviewForm.finalRating) });
                showToast("Appraisal finalised");
            } else {
                await axiosInstance.patch(API_ENDPOINTS.APPRAISAL_MANAGER_REVIEW(review._id), { ...reviewForm, managerRating: Number(reviewForm.managerRating) });
                showToast("Review submitted to HR");
            }
            setReview(null); fetchData();
        } catch (err) { dialogToast.error(errMsg(err)); }
    };
    const myId = (user as any)?._id || (user as any)?.id;
    const ownerId = (a: any) => String(a.employee?._id || a.employee || "");
    const reviewQueue = appraisals.filter(a =>
        ownerId(a) !== String(myId) &&
        (a.status === "manager-review" || (a.status === "hr-review" && isHR)));

    // Goals and appraisals are linked to an employee by id — that is what the
    // employee's own "My Targets" / "My Appraisals" pages read back.
    const fetchEmployees = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.EMPLOYEES);
            setEmployees(res.data.data || []);
        } catch (err) { console.error("Employee list error", err); }
    };

    useEffect(() => { fetchData(); fetchEmployees(); }, []);

    const employeeLabel = (emp: any) => `${emp.firstName || ""} ${emp.lastName || ""}`.trim();

    const selectEmployee = (id: string) => {
        const emp = employees.find(e => e._id === id);
        setFormData({ ...formData, employee: id, employeeName: emp ? employeeLabel(emp) : "" });
    };

    const employeeSelect = (required: boolean) => (
        <select required={required} className="form-input" value={formData.employee || ""} onChange={e => selectEmployee(e.target.value)} disabled={isEditing}>
            <option value="">Select employee...</option>
            {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{employeeLabel(emp)}{emp.employeeId ? ` (${emp.employeeId})` : ""}</option>
            ))}
        </select>
    );

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const openAddGoal = () => {
        setActiveView("goals"); setIsEditing(false);
        setFormData({ status: "not-started", priority: "medium", progress: 0, category: "individual" });
        setShowModal(true);
    };

    const openEditGoal = (item: any) => {
        setIsEditing(true); setEditId(item._id);
        setFormData({
            employee: item.employee?._id || item.employee || "",
            employeeName: item.employeeName || "", title: item.title || "",
            description: item.description || "", category: item.category || "individual",
            targetDate: item.targetDate ? new Date(item.targetDate).toISOString().split("T")[0] : "",
            status: item.status || "not-started", progress: item.progress || 0,
            priority: item.priority || "medium", weightage: item.weightage || 0,
            cycleId: item.cycleId?._id || item.cycleId || "",
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
            employee: item.employee?._id || item.employee || "",
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
        } catch (err: any) { dialogToast.error(err.response?.data?.message || err.message); }
    };

    const handleDelete = async (id: string, type: "goals" | "appraisals") => {
        const ok = await confirmDialog({
            title: "Are you sure?",
            description: "This action cannot be undone.",
            confirmLabel: "Delete",
            danger: true,
        });
        if (!ok) return;
        const endpoint = type === "goals" ? API_ENDPOINTS.GOALS : API_ENDPOINTS.APPRAISALS;
        try { await axiosInstance.delete(`${endpoint}/${id}`); showToast("Deleted!"); fetchData(); }
        catch (err: any) { dialogToast.error(err.response?.data?.message || err.message); }
    };

    const stats = [
        { label: "Total Goals", value: goals.length, icon: FiTarget, color: "blue" },
        { label: "In Progress", value: goals.filter(g => g.status === "in-progress").length, icon: FiTrendingUp, color: "orange" },
        { label: "Completed", value: goals.filter(g => g.status === "completed").length, icon: FiCheckCircle, color: "green" },
        { label: "Reviews Awaiting You", value: reviewQueue.length, icon: FiAward, color: "purple" },
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
                <button className={`btn ${activeView === "reviews" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveView("reviews")}><FiStar /> Review Queue ({reviewQueue.length})</button>
                {isHR && (
                    <button className={`btn ${activeView === "cycles" ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setActiveView("cycles")}><FiTrendingUp /> Cycles ({cycles.length})</button>
                )}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{{ goals: "Goals & KPIs", appraisals: "Appraisals", reviews: "Reviews awaiting you", cycles: "Appraisal Cycles" }[activeView]}</h3>
                    {activeView === "cycles" && isHR && <button className="btn btn-primary btn-sm" onClick={openNewCycle}><FiPlus /> New Cycle</button>}
                </div>
                <div className="table-wrapper">
                    {loading ? <TableSkeleton rows={5} /> :
                        activeView === "cycles" ? (
                            <table>
                                <thead><tr><th>Name</th><th>Period</th><th>Dates</th><th>Self review due</th><th>Manager review due</th><th>Appraisals</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {cycles.map(c => (
                                        <tr key={c._id}>
                                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                                            <td>{c.period || "-"}</td>
                                            <td>{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</td>
                                            <td>{fmtDate(c.selfReviewDue)}</td>
                                            <td>{fmtDate(c.managerReviewDue)}</td>
                                            <td>{c.appraisalCount || 0}</td>
                                            <td><span className={`badge ${STATUS_COLORS[c.status]}`}>{c.status}</span></td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    {c.status === "draft" && <button className="btn btn-secondary btn-sm" onClick={() => openEditCycle(c)}><FiEdit2 /></button>}
                                                    {c.status !== "closed" && <button className="btn btn-primary btn-sm" onClick={() => cycleAction(c, "activate")}>{c.status === "active" ? "Add new joiners" : "Activate"}</button>}
                                                    {c.status === "active" && <button className="btn btn-secondary btn-sm" onClick={() => cycleAction(c, "close")}>Close</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {cycles.length === 0 && (
                                        <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px 40px" }}>
                                            <EmptyState title="No appraisal cycles" description="Create a cycle, then activate it to start self-reviews for everyone in scope." icon={FiAward} actionLabel="New Cycle" onAction={openNewCycle} />
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        ) : activeView === "reviews" ? (
                            <table>
                                <thead><tr><th>Employee</th><th>Cycle</th><th>Self rating</th><th>Manager rating</th><th>Stage</th><th></th></tr></thead>
                                <tbody>
                                    {reviewQueue.map(a => (
                                        <tr key={a._id}>
                                            <td style={{ fontWeight: 600 }}>{a.employeeName || `${a.employee?.firstName || ""} ${a.employee?.lastName || ""}`}</td>
                                            <td>{a.cycle || "-"}</td>
                                            <td><div style={{ display: "flex" }}>{renderStars(a.selfRating || 0)}</div></td>
                                            <td><div style={{ display: "flex" }}>{renderStars(a.managerRating || 0)}</div></td>
                                            <td><span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status.replace("-", " ")}</span></td>
                                            <td><button className="btn btn-primary btn-sm" onClick={() => openReview(a)}>{a.status === "hr-review" ? "Finalise" : "Review"}</button></td>
                                        </tr>
                                    ))}
                                    {reviewQueue.length === 0 && (
                                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "60px 40px" }}>
                                            <EmptyState title="Nothing to review" description="Appraisals appear here once employees submit their self-review." icon={FiStar} />
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        ) : activeView === "goals" ? (
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
                                    {goals.length === 0 && (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: "center", padding: "80px 40px" }}>
                                                <EmptyState 
                                                    title="No Goals Found"
                                                    description="Performance monitoring is inactive. Set the first goal for your team to start tracking progress."
                                                    icon={FiTarget}
                                                    actionLabel="Add Goal"
                                                    onAction={openAddGoal}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table>
                                <thead><tr><th>Employee</th><th>Cycle</th><th>Reviewer</th><th>Self Rating</th><th>Manager Rating</th><th>Final</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {appraisals.map(a => (
                                        <tr key={a._id}>
                                            <td style={{ fontWeight: 600 }}>{a.employeeName || (a.employee?.firstName ? `${a.employee.firstName} ${a.employee.lastName || ""}` : "-")}</td>
                                            <td>{a.cycle}</td>
                                            <td>{a.reviewer || "-"}</td>
                                            <td><div style={{ display: "flex" }}>{renderStars(a.selfRating || 0)}</div></td>
                                            <td><div style={{ display: "flex" }}>{renderStars(a.managerRating || 0)}</div></td>
                                            <td><div style={{ display: "flex" }}>{renderStars(a.finalRating || 0)}</div></td>
                                            <td><span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status.replace("-", " ")}</span></td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    {(a.status === "manager-review" || (a.status === "hr-review" && isHR)) && ownerId(a) !== String(myId) && (
                                                        <button className="btn btn-primary btn-sm" onClick={() => openReview(a)}>{a.status === "hr-review" ? "Finalise" : "Review"}</button>
                                                    )}
                                                    <button className="btn btn-secondary btn-sm" onClick={() => openEditAppraisal(a)}><FiEdit2 /></button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(a._id, "appraisals")} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {appraisals.length === 0 && (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: "center", padding: "80px 40px" }}>
                                                <EmptyState 
                                                    title="No Appraisals Found"
                                                    description="The current review cycle has no data. Launch your first appraisal to evaluate team performance."
                                                    icon={FiAward}
                                                    actionLabel="New Appraisal"
                                                    onAction={openAddAppraisal}
                                                />
                                            </td>
                                        </tr>
                                    )}
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
                                    <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Employee</label>
                                        {employeeSelect(false)}</div>
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
                                    <div><label htmlFor="goalCycle" style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Appraisal Cycle</label>
                                        <select id="goalCycle" className="form-input" value={formData.cycleId || ""} onChange={e => setFormData({ ...formData, cycleId: e.target.value })}>
                                            <option value="">Not part of a cycle</option>
                                            {cycles.filter(c => c.status !== "closed" || c._id === formData.cycleId).map(c => (
                                                <option key={c._id} value={c._id}>{c.name}{c.status === "closed" ? " (closed)" : ""}</option>
                                            ))}
                                        </select>
                                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>Goals in a cycle are shown during that cycle&apos;s reviews.</p></div>
                                </>
                            ) : (
                                <>
                                    <div className="grid-2">
                                        <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Employee *</label>
                                            {employeeSelect(true)}</div>
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

            {cycleModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "560px", maxHeight: "85vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>{cycleModal._id ? "Edit" : "New"} Appraisal Cycle</h2>
                        <form onSubmit={saveCycle} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div className="grid-2">
                                <div><label style={LABEL_STYLE}>Name *</label>
                                    <input required className="form-input" value={cycleModal.name} onChange={e => setCycleModal({ ...cycleModal, name: e.target.value })} placeholder="FY 2026-27 H1" /></div>
                                <div><label style={LABEL_STYLE}>Period</label>
                                    <input className="form-input" value={cycleModal.period} onChange={e => setCycleModal({ ...cycleModal, period: e.target.value })} placeholder="Apr–Sep 2026" /></div>
                            </div>
                            <div className="grid-2">
                                <div><label style={LABEL_STYLE}>Start date</label>
                                    <input type="date" className="form-input" value={cycleModal.startDate || ""} onChange={e => setCycleModal({ ...cycleModal, startDate: e.target.value })} /></div>
                                <div><label style={LABEL_STYLE}>End date</label>
                                    <input type="date" className="form-input" value={cycleModal.endDate || ""} onChange={e => setCycleModal({ ...cycleModal, endDate: e.target.value })} /></div>
                            </div>
                            <div className="grid-2">
                                <div><label style={LABEL_STYLE}>Self-review due</label>
                                    <input type="date" className="form-input" value={cycleModal.selfReviewDue || ""} onChange={e => setCycleModal({ ...cycleModal, selfReviewDue: e.target.value })} /></div>
                                <div><label style={LABEL_STYLE}>Manager review due</label>
                                    <input type="date" className="form-input" value={cycleModal.managerReviewDue || ""} onChange={e => setCycleModal({ ...cycleModal, managerReviewDue: e.target.value })} /></div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setCycleModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {review && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "680px", maxHeight: "88vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "4px" }}>{review.status === "hr-review" ? "Finalise appraisal" : "Manager review"}</h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>
                            {review.employee?.firstName} {review.employee?.lastName}{review.employee?.designation ? ` · ${review.employee.designation}` : ""} · {review.cycleId?.name || review.cycle}
                        </p>

                        <div style={{ padding: "14px", border: "1px solid var(--border)", borderRadius: "10px", marginBottom: "14px" }}>
                            <div style={{ fontWeight: 700, marginBottom: "6px" }}>Self-review</div>
                            <div style={{ display: "flex", marginBottom: "6px" }}>{renderStars(review.selfRating || 0)}</div>
                            <div style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{review.selfComments || <span style={{ color: "var(--text-muted)" }}>No comments.</span>}</div>
                        </div>

                        <div style={{ padding: "14px", border: "1px solid var(--border)", borderRadius: "10px", marginBottom: "14px" }}>
                            <div style={{ fontWeight: 700, marginBottom: "8px" }}>Goals in this cycle</div>
                            {(review.goals || []).length === 0 ? <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>No goals are linked to this cycle.</div> :
                                (review.goals || []).map((g: any) => (
                                    <div key={g._id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                                        <span>{g.title}{g.weightage ? ` (${g.weightage}%)` : ""}</span>
                                        <span style={{ color: "var(--text-muted)" }}>{g.progress || 0}% · {String(g.status || "").replace("-", " ")}</span>
                                    </div>
                                ))}
                        </div>

                        {review.status === "hr-review" && (
                            <div style={{ padding: "14px", border: "1px solid var(--border)", borderRadius: "10px", marginBottom: "14px" }}>
                                <div style={{ fontWeight: 700, marginBottom: "6px" }}>Manager review{review.reviewer ? ` — ${review.reviewer}` : ""}</div>
                                <div style={{ display: "flex", marginBottom: "6px" }}>{renderStars(review.managerRating || 0)}</div>
                                <div style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{review.managerComments}</div>
                                {review.strengths && <div style={{ fontSize: "13px", marginTop: "6px" }}><b>Strengths:</b> {review.strengths}</div>}
                                {review.areasOfImprovement && <div style={{ fontSize: "13px", marginTop: "4px" }}><b>To improve:</b> {review.areasOfImprovement}</div>}
                            </div>
                        )}

                        <form onSubmit={submitReview} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {review.status === "hr-review" ? (
                                <>
                                    <div><label style={LABEL_STYLE}>Final rating (1–5) *</label>
                                        <select required className="form-input" value={reviewForm.finalRating} onChange={e => setReviewForm({ ...reviewForm, finalRating: e.target.value })}>
                                            <option value="">—</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select></div>
                                    <div><label style={LABEL_STYLE}>HR comments</label>
                                        <textarea className="form-input" rows={3} style={{ resize: "none" }} value={reviewForm.hrComments} onChange={e => setReviewForm({ ...reviewForm, hrComments: e.target.value })} /></div>
                                </>
                            ) : (
                                <>
                                    <div><label style={LABEL_STYLE}>Manager rating (1–5) *</label>
                                        <select required className="form-input" value={reviewForm.managerRating} onChange={e => setReviewForm({ ...reviewForm, managerRating: e.target.value })}>
                                            <option value="">—</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select></div>
                                    <div><label style={LABEL_STYLE}>Comments</label>
                                        <textarea className="form-input" rows={3} style={{ resize: "none" }} value={reviewForm.managerComments} onChange={e => setReviewForm({ ...reviewForm, managerComments: e.target.value })} /></div>
                                    <div className="grid-2">
                                        <div><label style={LABEL_STYLE}>Strengths</label>
                                            <textarea className="form-input" rows={2} style={{ resize: "none" }} value={reviewForm.strengths} onChange={e => setReviewForm({ ...reviewForm, strengths: e.target.value })} /></div>
                                        <div><label style={LABEL_STYLE}>Areas of improvement</label>
                                            <textarea className="form-input" rows={2} style={{ resize: "none" }} value={reviewForm.areasOfImprovement} onChange={e => setReviewForm({ ...reviewForm, areasOfImprovement: e.target.value })} /></div>
                                    </div>
                                </>
                            )}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setReview(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{review.status === "hr-review" ? "Finalise" : "Submit to HR"}</button>
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
