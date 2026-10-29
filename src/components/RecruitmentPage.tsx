"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiBriefcase, FiUsers, FiPlus, FiEdit2, FiTrash2,
    FiSearch, FiFilter, FiCalendar, FiCheckCircle, FiXCircle, FiUserPlus
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useConfirm, useToast } from "@/components/common/DialogProvider";

/** Candidate pipeline, mirrored from the backend's canMove (recruitmentController). */
const STAGES = ["applied", "screening", "interview", "offered", "hired"];
const nextStages = (from: string): string[] => {
    if (from === "hired") return [];
    if (from === "rejected") return ["applied", "screening"];
    const i = STAGES.indexOf(from);
    const forward = STAGES.filter((s, j) => j > i && (s !== "hired" || from === "offered"));
    return [...forward, "rejected"];
};
const errMsg = (err: any) => err?.response?.data?.message || err?.message || "Something went wrong";
const LABEL_STYLE: any = { display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" };
const MODAL_BG: any = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "var(--overlay-bg)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center"
};

const STATUS_COLORS: any = {
    draft: "pending", open: "active", "on-hold": "leave", closed: "inactive",
    applied: "pending", screening: "processing", interview: "leave",
    offered: "active", hired: "active", rejected: "inactive",
};

interface RecruitmentPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function RecruitmentPage({ showNotify }: RecruitmentPageProps) {
    const confirmDialog = useConfirm();
    const toast = useToast();
    const [activeView, setActiveView] = useState<"postings" | "candidates">("postings");
    const [postings, setPostings] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<any>({});
    const [successToast, setSuccessToast] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Interviews (per candidate)
    const [interviewCandidate, setInterviewCandidate] = useState<any>(null);
    const [interviews, setInterviews] = useState<any[]>([]);
    const [interviewForm, setInterviewForm] = useState<any>({});
    const [feedbackFor, setFeedbackFor] = useState<string>("");
    const [feedbackForm, setFeedbackForm] = useState<any>({});
    const [people, setPeople] = useState<any[]>([]);

    // Conversion of a hired candidate into an employee
    const [convertCandidate, setConvertCandidate] = useState<any>(null);
    const [convertForm, setConvertForm] = useState<any>({});
    const [convertMissing, setConvertMissing] = useState<string[]>([]);
    const [convertResult, setConvertResult] = useState<any>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.JOB_POSTINGS),
                axiosInstance.get(API_ENDPOINTS.CANDIDATES),
            ]);
            setPostings(pRes.data.data || []);
            setCandidates(cRes.data.data || []);
        } catch (err) {
            console.error("Fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Pickers for interviewer / department / branch, loaded on first use.
    const loadPickers = async () => {
        if (people.length && departments.length) return;
        const [e, d, b] = await Promise.allSettled([
            axiosInstance.get(`${API_ENDPOINTS.EMPLOYEES}?limit=500&status=Active`),
            axiosInstance.get(API_ENDPOINTS.DEPARTMENTS),
            axiosInstance.get(API_ENDPOINTS.BRANCHES),
        ]);
        if (e.status === "fulfilled") setPeople(e.value.data.data || []);
        if (d.status === "fulfilled") setDepartments(d.value.data.data || []);
        if (b.status === "fulfilled") setBranches(b.value.data.data || []);
    };

    // ========== PIPELINE ==========
    const moveCandidate = async (c: any, status: string) => {
        if (!status) return;
        if (status === "rejected") {
            const ok = await confirmDialog({ title: `Reject ${c.firstName}?`, confirmLabel: "Reject", danger: true });
            if (!ok) return;
        }
        try {
            await axiosInstance.patch(API_ENDPOINTS.CANDIDATE_STATUS(c._id), { status });
            showToast(`Moved to ${status}`);
            fetchData();
        } catch (err: any) {
            toast.error(errMsg(err));
            fetchData();
        }
    };

    // ========== INTERVIEWS ==========
    const loadInterviews = async (candidateId: string) => {
        try {
            const res = await axiosInstance.get(`${API_ENDPOINTS.INTERVIEWS}?candidate=${candidateId}`);
            setInterviews(res.data.data || []);
        } catch (err) { toast.error(errMsg(err)); }
    };

    const openInterviews = async (c: any) => {
        setInterviewCandidate(c);
        setInterviews([]);
        setFeedbackFor("");
        setInterviewForm({ round: "Round 1", mode: "video", durationMinutes: 60 });
        loadPickers();
        loadInterviews(c._id);
    };

    const scheduleInterview = async (e: any) => {
        e.preventDefault();
        try {
            await axiosInstance.post(API_ENDPOINTS.INTERVIEWS, {
                ...interviewForm,
                candidate: interviewCandidate._id,
                scheduledAt: interviewForm.scheduledAt ? new Date(interviewForm.scheduledAt).toISOString() : undefined,
            });
            showToast("Interview scheduled");
            setInterviewForm({ round: `Round ${interviews.length + 2}`, mode: "video", durationMinutes: 60 });
            loadInterviews(interviewCandidate._id);
            fetchData();
        } catch (err: any) { toast.error(errMsg(err)); }
    };

    const openFeedback = (iv: any) => {
        setFeedbackFor(iv._id);
        setFeedbackForm({ feedback: iv.feedback || "", rating: iv.rating || "", result: iv.result || "pending" });
    };

    const submitFeedback = async (e: any) => {
        e.preventDefault();
        try {
            await axiosInstance.patch(API_ENDPOINTS.INTERVIEW_FEEDBACK(feedbackFor), {
                ...feedbackForm,
                rating: feedbackForm.rating ? Number(feedbackForm.rating) : undefined,
            });
            showToast("Feedback saved");
            setFeedbackFor("");
            loadInterviews(interviewCandidate._id);
        } catch (err: any) { toast.error(errMsg(err)); }
    };

    const cancelInterview = async (iv: any) => {
        const ok = await confirmDialog({ title: "Delete this interview?", confirmLabel: "Delete", danger: true });
        if (!ok) return;
        try {
            await axiosInstance.delete(`${API_ENDPOINTS.INTERVIEWS}/${iv._id}`);
            loadInterviews(interviewCandidate._id);
        } catch (err: any) { toast.error(errMsg(err)); }
    };

    // ========== CONVERSION ==========
    const openConvert = (c: any) => {
        setConvertCandidate(c);
        setConvertMissing([]);
        setConvertResult(null);
        setConvertForm({
            lastName: c.lastName || "",
            phone: (c.phone || "").replace(/\D/g, "").slice(-10),
            designation: c.jobPosting?.designation || "",
            ctc: c.expectedCTC || "",
            dateOfJoining: new Date().toISOString().split("T")[0],
            panNumber: "",
        });
        loadPickers();
    };

    const submitConvert = async (e: any) => {
        e.preventDefault();
        const missing = ["panNumber", "lastName"].filter(f => !String(convertForm[f] || "").trim());
        if (missing.length) { setConvertMissing(missing); return; }
        try {
            const payload: any = {};
            for (const [k, v] of Object.entries(convertForm)) if (v !== "" && v != null) payload[k] = v;
            if (payload.panNumber) payload.panNumber = String(payload.panNumber).toUpperCase();
            if (payload.ctc) payload.ctc = Number(payload.ctc);
            const res = await axiosInstance.post(API_ENDPOINTS.CANDIDATE_CONVERT(convertCandidate._id), payload);
            setConvertResult(res.data.data);
            fetchData();
        } catch (err: any) {
            const missingFields = err?.response?.data?.missing;
            if (Array.isArray(missingFields)) setConvertMissing(missingFields);
            toast.error(errMsg(err));
        }
    };

    const missingStyle = (field: string) => convertMissing.includes(field) ? { borderColor: "var(--error)", boxShadow: "0 0 0 1px var(--error)" } : {};

    const showToast = (msg: string) => {
        setSuccessToast(msg);
        setTimeout(() => setSuccessToast(""), 3000);
    };

    // ========== JOB POSTINGS ==========
    const openAddPosting = () => {
        setActiveView("postings");
        setIsEditing(false);
        setFormData({ status: "draft", employmentType: "full-time", openings: 1 });
        setShowModal(true);
    };

    const openEditPosting = (item: any) => {
        setIsEditing(true);
        setEditId(item._id);
        setFormData({
            title: item.title || "", department: item.department || "",
            designation: item.designation || "", description: item.description || "",
            requirements: item.requirements || "", location: item.location || "",
            employmentType: item.employmentType || "full-time",
            experienceMin: item.experienceMin || 0, experienceMax: item.experienceMax || 0,
            salaryMin: item.salaryMin || 0, salaryMax: item.salaryMax || 0,
            openings: item.openings || 1, status: item.status || "draft",
        });
        setShowModal(true);
    };

    // ========== CANDIDATES ==========
    const openAddCandidate = () => {
        setActiveView("candidates");
        setIsEditing(false);
        setFormData({ source: "portal" });
        setShowModal(true);
    };

    const openEditCandidate = (item: any) => {
        setActiveView("candidates");
        setIsEditing(true);
        setEditId(item._id);
        setFormData({
            firstName: item.firstName || "", lastName: item.lastName || "",
            email: item.email || "", phone: item.phone || "",
            jobPosting: item.jobPosting?._id || item.jobPosting || "",
            experience: item.experience || 0, currentCompany: item.currentCompany || "",
            currentCTC: item.currentCTC || 0, expectedCTC: item.expectedCTC || 0,
            noticePeriod: item.noticePeriod || 0,
            source: item.source || "portal", notes: item.notes || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const endpoint = activeView === "postings" ? API_ENDPOINTS.JOB_POSTINGS : API_ENDPOINTS.CANDIDATES;
            if (isEditing) {
                await axiosInstance.put(`${endpoint}/${editId}`, formData);
                showToast("Updated successfully!");
            } else {
                await axiosInstance.post(endpoint, formData);
                showToast("Created successfully!");
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message);
        }
    };

    const handleDelete = async (id: string, type: "postings" | "candidates") => {
        const ok = await confirmDialog({
            title: "Are you sure?",
            confirmLabel: "Delete",
            danger: true,
        });
        if (!ok) return;
        const endpoint = type === "postings" ? API_ENDPOINTS.JOB_POSTINGS : API_ENDPOINTS.CANDIDATES;
        try {
            await axiosInstance.delete(`${endpoint}/${id}`);
            showToast("Deleted!");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message);
        }
    };

    const stats = [
        { label: "Open Positions", value: postings.filter(p => p.status === "open").length, icon: FiBriefcase, color: "blue" },
        { label: "Total Candidates", value: candidates.length, icon: FiUsers, color: "green" },
        { label: "In Interview Stage", value: candidates.filter(c => c.status === "interview").length, icon: FiCalendar, color: "orange" },
        { label: "Hired", value: candidates.filter(c => c.status === "hired").length, icon: FiUserPlus, color: "purple" },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Recruitment</h1>
                    <p className="page-subtitle">Manage job postings and candidate pipeline</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary" onClick={openAddCandidate}><FiUserPlus /> Add Candidate</button>
                    <button className="btn btn-primary" onClick={openAddPosting}><FiPlus /> Post Job</button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className={`stat-card ${stat.color}`}>
                        <div className="stat-card-header">
                            <div className={`stat-card-icon ${stat.color}`}><stat.icon /></div>
                        </div>
                        <div className="stat-card-value">{stat.value}</div>
                        <div className="stat-card-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <button className={`btn ${activeView === "postings" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveView("postings")}><FiBriefcase /> Job Postings ({postings.length})</button>
                <button className={`btn ${activeView === "candidates" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveView("candidates")}><FiUsers /> Candidates ({candidates.length})</button>
            </div>

            {/* Content */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{activeView === "postings" ? "Job Postings" : "Candidates"}</h3>
                    <div className="topbar-search" style={{ width: "auto" }}>
                        <FiSearch className="topbar-search-icon" />
                        <input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: "200px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "8px 16px 8px 40px", color: "var(--text-primary)", fontSize: "14px", outline: "none" }} />
                    </div>
                </div>
                <div className="table-wrapper">
                    {loading ? (
                        <TableSkeleton rows={6} />
                    ) : activeView === "postings" ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th><th>Department</th><th>Location</th><th>Type</th><th>Openings</th><th>Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {postings.filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => (
                                    <tr key={p._id}>
                                        <td style={{ fontWeight: 600 }}>{p.title}</td>
                                        <td>{p.department || "-"}</td>
                                        <td>{p.location || "-"}</td>
                                        <td>{p.employmentType}</td>
                                        <td>{p.openings}</td>
                                        <td><span className={`badge ${STATUS_COLORS[p.status] || "pending"}`}>{p.status}</span></td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEditPosting(p)}><FiEdit2 /></button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(p._id, "postings")} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {postings.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "80px 40px" }}>
                                            <EmptyState 
                                                title="No Job Postings"
                                                description="Your careers page is currently empty. Post your first job opening to start attracting talent."
                                                icon={FiBriefcase}
                                                actionLabel="Post Job"
                                                onAction={openAddPosting}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th><th>Email</th><th>Position</th><th>Experience</th><th>Source</th><th>Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())).map((c) => (
                                    <tr key={c._id}>
                                        <td style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</td>
                                        <td>{c.email}</td>
                                        <td>{c.jobPosting?.title || "-"}</td>
                                        <td>{c.experience} yrs</td>
                                        <td>{c.source}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span className={`badge ${STATUS_COLORS[c.status] || "pending"}`}>{c.status}</span>
                                                {nextStages(c.status).length > 0 && (
                                                    <select className="form-input" style={{ width: "auto", padding: "4px 8px", fontSize: "12px" }}
                                                        value="" onChange={e => moveCandidate(c, e.target.value)} aria-label="Move candidate to stage">
                                                        <option value="">Move to…</option>
                                                        {nextStages(c.status).map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                )}
                                                {c.employeeId && <span className="badge active" title="Converted to employee">employee</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button className="btn btn-secondary btn-sm" title="Interviews" onClick={() => openInterviews(c)}><FiCalendar /></button>
                                                {c.status === "hired" && !c.employeeId && (
                                                    <button className="btn btn-primary btn-sm" title="Convert to employee" onClick={() => openConvert(c)}><FiUserPlus /> Convert</button>
                                                )}
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEditCandidate(c)}><FiEdit2 /></button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(c._id, "candidates")} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {candidates.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "80px 40px" }}>
                                            <EmptyState 
                                                title="No Candidates Found"
                                                description="No one has applied to your open positions yet. Add candidates manually to start the pipeline."
                                                icon={FiUsers}
                                                actionLabel="Add Candidate"
                                                onAction={openAddCandidate}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "var(--overlay-bg)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div className="card animate-in" style={{ width: "560px", maxHeight: "85vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>
                            {isEditing ? "Edit" : "Create"} {activeView === "postings" ? "Job Posting" : "Candidate"}
                        </h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {activeView === "postings" ? (
                                <>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Job Title *</label>
                                        <input required type="text" className="form-input" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Senior Software Engineer" />
                                    </div>
                                    <div className="grid-2">
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Department</label>
                                            <input type="text" className="form-input" value={formData.department || ""} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="Engineering" />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Location</label>
                                            <input type="text" className="form-input" value={formData.location || ""} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Mumbai" />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Description</label>
                                        <textarea className="form-input" value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ resize: "none" }} placeholder="Job description..." />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Requirements</label>
                                        <textarea className="form-input" value={formData.requirements || ""} onChange={e => setFormData({ ...formData, requirements: e.target.value })} rows={3} style={{ resize: "none" }} placeholder="Required skills and qualifications..." />
                                    </div>
                                    <div className="grid-2">
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Type</label>
                                            <select className="form-input" value={formData.employmentType} onChange={e => setFormData({ ...formData, employmentType: e.target.value })}>
                                                <option value="full-time">Full-Time</option>
                                                <option value="part-time">Part-Time</option>
                                                <option value="contract">Contract</option>
                                                <option value="internship">Internship</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Status</label>
                                            <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                                <option value="draft">Draft</option>
                                                <option value="open">Open</option>
                                                <option value="on-hold">On Hold</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Openings</label>
                                        <input type="number" className="form-input" value={formData.openings || 1} onChange={e => setFormData({ ...formData, openings: parseInt(e.target.value) })} min={1} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid-2">
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>First Name *</label>
                                            <input required type="text" className="form-input" value={formData.firstName || ""} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Last Name</label>
                                            <input type="text" className="form-input" value={formData.lastName || ""} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid-2">
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Email *</label>
                                            <input required type="email" className="form-input" value={formData.email || ""} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Phone</label>
                                            <input type="text" className="form-input" value={formData.phone || ""} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Applying For</label>
                                        <select className="form-input" value={formData.jobPosting || ""} onChange={e => setFormData({ ...formData, jobPosting: e.target.value || undefined })}>
                                            <option value="">— No specific position —</option>
                                            {postings.map((p: any) => (
                                                <option key={p._id} value={p._id}>{p.title}{p.department ? ` (${p.department})` : ""}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid-2">
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Experience (yrs)</label>
                                            <input type="number" className="form-input" value={formData.experience || 0} onChange={e => setFormData({ ...formData, experience: parseInt(e.target.value) })} min={0} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Current Company</label>
                                            <input type="text" className="form-input" value={formData.currentCompany || ""} onChange={e => setFormData({ ...formData, currentCompany: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid-2">
                                        <div>
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Source</label>
                                            <select className="form-input" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}>
                                                <option value="portal">Portal</option>
                                                <option value="referral">Referral</option>
                                                <option value="linkedin">LinkedIn</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Notes</label>
                                        <textarea className="form-input" value={formData.notes || ""} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} style={{ resize: "none" }} />
                                    </div>
                                </>
                            )}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? "Save Changes" : "Create"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Interviews */}
            {interviewCandidate && (
                <div style={MODAL_BG}>
                    <div className="card animate-in" style={{ width: "720px", maxHeight: "88vh", overflow: "auto", padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h2 style={{ margin: 0 }}>Interviews — {interviewCandidate.firstName} {interviewCandidate.lastName}</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setInterviewCandidate(null)}><FiXCircle /> Close</button>
                        </div>
                        {interviews.length === 0 ? (
                            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No interviews scheduled yet.</p>
                        ) : (
                            <div className="table-wrapper" style={{ marginBottom: "16px" }}>
                                <table>
                                    <thead><tr><th>Round</th><th>When</th><th>Interviewer</th><th>Mode</th><th>Rating</th><th>Result</th><th></th></tr></thead>
                                    <tbody>
                                        {interviews.map(iv => (
                                            <tr key={iv._id}>
                                                <td style={{ fontWeight: 600 }}>{iv.round}</td>
                                                <td>{new Date(iv.scheduledAt).toLocaleString()}</td>
                                                <td>{iv.interviewer ? `${iv.interviewer.firstName} ${iv.interviewer.lastName}` : "-"}</td>
                                                <td>{iv.mode}{iv.location ? ` · ${iv.location}` : ""}</td>
                                                <td>{iv.rating ? `${iv.rating}/5` : "-"}</td>
                                                <td><span className={`badge ${iv.result === "passed" ? "active" : iv.result === "failed" || iv.result === "no-show" ? "inactive" : "pending"}`}>{iv.result}</span></td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "6px" }}>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => openFeedback(iv)}><FiEdit2 /> Feedback</button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => cancelInterview(iv)} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {feedbackFor && (
                            <form onSubmit={submitFeedback} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", border: "1px solid var(--border)", borderRadius: "10px", marginBottom: "16px" }}>
                                <h3 style={{ margin: 0, fontSize: "15px" }}>Record feedback</h3>
                                <div className="grid-2">
                                    <div>
                                        <label style={LABEL_STYLE}>Rating (1–5)</label>
                                        <select className="form-input" value={feedbackForm.rating} onChange={e => setFeedbackForm({ ...feedbackForm, rating: e.target.value })}>
                                            <option value="">—</option>
                                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>Result</label>
                                        <select className="form-input" value={feedbackForm.result} onChange={e => setFeedbackForm({ ...feedbackForm, result: e.target.value })}>
                                            {["pending", "passed", "failed", "on-hold", "no-show"].map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={LABEL_STYLE}>Feedback</label>
                                    <textarea className="form-input" rows={3} style={{ resize: "none" }} value={feedbackForm.feedback} onChange={e => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setFeedbackFor("")}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Feedback</button>
                                </div>
                            </form>
                        )}

                        {!["hired", "rejected"].includes(interviewCandidate.status) && (
                            <form onSubmit={scheduleInterview} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <h3 style={{ margin: 0, fontSize: "15px" }}>Schedule an interview</h3>
                                <div className="grid-2">
                                    <div>
                                        <label style={LABEL_STYLE}>Round</label>
                                        <input className="form-input" value={interviewForm.round || ""} onChange={e => setInterviewForm({ ...interviewForm, round: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>Interviewer *</label>
                                        <select required className="form-input" value={interviewForm.interviewer || ""} onChange={e => setInterviewForm({ ...interviewForm, interviewer: e.target.value })}>
                                            <option value="">Select interviewer…</option>
                                            {people.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}{p.designation ? ` — ${p.designation}` : ""}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div>
                                        <label style={LABEL_STYLE}>Date &amp; time *</label>
                                        <input required type="datetime-local" className="form-input" value={interviewForm.scheduledAt || ""} onChange={e => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>Duration (minutes)</label>
                                        <input type="number" min={5} className="form-input" value={interviewForm.durationMinutes || 60} onChange={e => setInterviewForm({ ...interviewForm, durationMinutes: parseInt(e.target.value) || 60 })} />
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div>
                                        <label style={LABEL_STYLE}>Mode</label>
                                        <select className="form-input" value={interviewForm.mode} onChange={e => setInterviewForm({ ...interviewForm, mode: e.target.value })}>
                                            <option value="video">Video</option>
                                            <option value="phone">Phone</option>
                                            <option value="in-person">In person</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>{interviewForm.mode === "in-person" ? "Location" : "Meeting link / number"}</label>
                                        <input className="form-input" value={interviewForm.location || ""} onChange={e => setInterviewForm({ ...interviewForm, location: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button type="submit" className="btn btn-primary"><FiCalendar /> Schedule</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Convert to employee */}
            {convertCandidate && (
                <div style={MODAL_BG}>
                    <div className="card animate-in" style={{ width: "600px", maxHeight: "88vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "6px" }}>Convert to employee</h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "18px" }}>
                            {convertCandidate.firstName} {convertCandidate.lastName} · {convertCandidate.email}. The employee gets a welcome email and a link to set their password.
                        </p>
                        {convertResult ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
                                    <FiCheckCircle color="var(--secondary)" size={20} />
                                    Employee created{convertResult.employee?.employeeId ? ` (${convertResult.employee.employeeId})` : ""}.
                                </div>
                                <div style={{ fontSize: "14px", color: convertResult.setupLinkSent ? "var(--text-secondary)" : "var(--warning, #b45309)" }}>
                                    {convertResult.setupLinkSent
                                        ? "The password set-up link was emailed."
                                        : "The password set-up link could not be emailed. Ask them to use “Forgot password” on the login page, or resend it later."}
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button className="btn btn-primary" onClick={() => setConvertCandidate(null)}>Done</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={submitConvert} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div className="grid-2">
                                    <div>
                                        <label style={LABEL_STYLE}>PAN *</label>
                                        <input className="form-input" style={missingStyle("panNumber")} placeholder="ABCDE1234F" maxLength={10}
                                            value={convertForm.panNumber || ""} onChange={e => setConvertForm({ ...convertForm, panNumber: e.target.value.toUpperCase() })} />
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>Last name *</label>
                                        <input className="form-input" style={missingStyle("lastName")} value={convertForm.lastName || ""} onChange={e => setConvertForm({ ...convertForm, lastName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div>
                                        <label style={LABEL_STYLE}>Phone</label>
                                        <input className="form-input" style={missingStyle("phone")} value={convertForm.phone || ""} onChange={e => setConvertForm({ ...convertForm, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>Designation</label>
                                        <input className="form-input" value={convertForm.designation || ""} onChange={e => setConvertForm({ ...convertForm, designation: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div>
                                        <label style={LABEL_STYLE}>Branch</label>
                                        <select className="form-input" style={missingStyle("branchId")} value={convertForm.branchId || ""} onChange={e => setConvertForm({ ...convertForm, branchId: e.target.value, departmentId: "" })}>
                                            <option value="">Select branch…</option>
                                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>Department</label>
                                        <select className="form-input" style={missingStyle("departmentId")} value={convertForm.departmentId || ""} onChange={e => {
                                            const d = departments.find(x => x._id === e.target.value);
                                            setConvertForm({ ...convertForm, departmentId: e.target.value, department: d?.name || "" });
                                        }}>
                                            <option value="">Select department…</option>
                                            {departments
                                                .filter(d => !convertForm.branchId || !d.branchId || String(d.branchId?._id || d.branchId) === convertForm.branchId)
                                                .map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div>
                                        <label style={LABEL_STYLE}>Date of joining</label>
                                        <input type="date" className="form-input" value={convertForm.dateOfJoining || ""} onChange={e => setConvertForm({ ...convertForm, dateOfJoining: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>Annual CTC (₹)</label>
                                        <input type="number" min={0} className="form-input" value={convertForm.ctc || ""} onChange={e => setConvertForm({ ...convertForm, ctc: e.target.value })} />
                                    </div>
                                </div>
                                {convertMissing.length > 0 && (
                                    <div style={{ color: "var(--error)", fontSize: "13px" }}>Please fill in the highlighted fields.</div>
                                )}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setConvertCandidate(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary"><FiUserPlus /> Create Employee</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {successToast && (
                <div style={{
                    position: "fixed", bottom: "20px", right: "20px",
                    background: "var(--success-bg)", color: "white",
                    padding: "12px 20px", borderRadius: "8px", zIndex: 3000,
                    boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: "10px",
                    fontWeight: 600, animation: "fadeInUp 0.3s ease-out"
                }}>
                    <FiCheckCircle size={20} /> {successToast}
                </div>
            )}
        </>
    );
}
