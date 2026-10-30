"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiBriefcase, FiUsers, FiPlus, FiEdit2, FiTrash2,
    FiSearch, FiCalendar, FiCheckCircle, FiUserPlus
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useConfirm, useToast } from "@/components/common/DialogProvider";
import { errorMessage } from "@/lib/fetchError";
import { populated, refId, type Branch, type Department } from "@/types/api";
import InterviewsModal from "@/components/recruitment/InterviewsModal";
import ConvertModal from "@/components/recruitment/ConvertModal";
import {
    type Candidate, type ConvertForm, type JobPosting, type RecruitmentForm, type ConvertResult, type FeedbackForm, type Interview, type InterviewForm, type Person,
} from "@/components/recruitment/types";

/** Candidate pipeline, mirrored from the backend's canMove (recruitmentController). */
const STAGES = ["applied", "screening", "interview", "offered", "hired"];
const nextStages = (from: string): string[] => {
    if (from === "hired") return [];
    if (from === "rejected") return ["applied", "screening"];
    const i = STAGES.indexOf(from);
    const forward = STAGES.filter((s, j) => j > i && (s !== "hired" || from === "offered"));
    return [...forward, "rejected"];
};
const errMsg = (err: unknown) => errorMessage(err, "Something went wrong", true);

const STATUS_COLORS: Record<string, string> = {
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
    const [postings, setPostings] = useState<JobPosting[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<RecruitmentForm>({});
    const [successToast, setSuccessToast] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Interviews (per candidate)
    const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [interviewForm, setInterviewForm] = useState<InterviewForm>({});
    const [feedbackFor, setFeedbackFor] = useState<string>("");
    const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({});
    const [people, setPeople] = useState<Person[]>([]);

    // Conversion of a hired candidate into an employee
    const [convertCandidate, setConvertCandidate] = useState<Candidate | null>(null);
    const [convertForm, setConvertForm] = useState<ConvertForm>({});
    const [convertMissing, setConvertMissing] = useState<string[]>([]);
    const [convertResult, setConvertResult] = useState<ConvertResult | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

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
    const moveCandidate = async (c: Candidate, status: string) => {
        if (!status) return;
        if (status === "rejected") {
            const ok = await confirmDialog({ title: `Reject ${c.firstName}?`, confirmLabel: "Reject", danger: true });
            if (!ok) return;
        }
        try {
            await axiosInstance.patch(API_ENDPOINTS.CANDIDATE_STATUS(c._id), { status });
            showToast(`Moved to ${status}`);
            fetchData();
        } catch (err) {
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

    const openInterviews = async (c: Candidate) => {
        setInterviewCandidate(c);
        setInterviews([]);
        setFeedbackFor("");
        setInterviewForm({ round: "Round 1", mode: "video", durationMinutes: 60 });
        loadPickers();
        loadInterviews(c._id);
    };

    const scheduleInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!interviewCandidate) return;
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
        } catch (err) { toast.error(errMsg(err)); }
    };

    const openFeedback = (iv: Interview) => {
        setFeedbackFor(iv._id);
        setFeedbackForm({ feedback: iv.feedback || "", rating: iv.rating || "", result: iv.result || "pending" });
    };

    const submitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!interviewCandidate) return;
        try {
            await axiosInstance.patch(API_ENDPOINTS.INTERVIEW_FEEDBACK(feedbackFor), {
                ...feedbackForm,
                rating: feedbackForm.rating ? Number(feedbackForm.rating) : undefined,
            });
            showToast("Feedback saved");
            setFeedbackFor("");
            loadInterviews(interviewCandidate._id);
        } catch (err) { toast.error(errMsg(err)); }
    };

    const cancelInterview = async (iv: Interview) => {
        if (!interviewCandidate) return;
        const ok = await confirmDialog({ title: "Delete this interview?", confirmLabel: "Delete", danger: true });
        if (!ok) return;
        try {
            await axiosInstance.delete(`${API_ENDPOINTS.INTERVIEWS}/${iv._id}`);
            loadInterviews(interviewCandidate._id);
        } catch (err) { toast.error(errMsg(err)); }
    };

    // ========== CONVERSION ==========
    const openConvert = (c: Candidate) => {
        setConvertCandidate(c);
        setConvertMissing([]);
        setConvertResult(null);
        setConvertForm({
            lastName: c.lastName || "",
            phone: (c.phone || "").replace(/\D/g, "").slice(-10),
            designation: populated(c.jobPosting)?.designation || "",
            ctc: c.expectedCTC || "",
            dateOfJoining: new Date().toISOString().split("T")[0],
            panNumber: "",
        });
        loadPickers();
    };

    const submitConvert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!convertCandidate) return;
        const missing = ["panNumber", "lastName"].filter(f => !String(convertForm[f] || "").trim());
        if (missing.length) { setConvertMissing(missing); return; }
        try {
            const payload: ConvertForm = {};
            for (const [k, v] of Object.entries(convertForm)) if (v !== "" && v != null) payload[k] = v;
            if (payload.panNumber) payload.panNumber = String(payload.panNumber).toUpperCase();
            if (payload.ctc) payload.ctc = Number(payload.ctc);
            const res = await axiosInstance.post(API_ENDPOINTS.CANDIDATE_CONVERT(convertCandidate._id), payload);
            setConvertResult(res.data.data);
            fetchData();
        } catch (err) {
            const missingFields = (err as { response?: { data?: { missing?: unknown } } })?.response?.data?.missing;
            if (Array.isArray(missingFields)) setConvertMissing(missingFields);
            toast.error(errMsg(err));
        }
    };

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

    const openEditPosting = (item: JobPosting) => {
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

    const openEditCandidate = (item: Candidate) => {
        setActiveView("candidates");
        setIsEditing(true);
        setEditId(item._id);
        setFormData({
            firstName: item.firstName || "", lastName: item.lastName || "",
            email: item.email || "", phone: item.phone || "",
            jobPosting: refId(item.jobPosting),
            experience: item.experience || 0, currentCompany: item.currentCompany || "",
            currentCTC: item.currentCTC || 0, expectedCTC: item.expectedCTC || 0,
            noticePeriod: item.noticePeriod || 0,
            source: item.source || "portal", notes: item.notes || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
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
        } catch (err) {
            toast.error(errMsg(err));
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
        } catch (err) {
            toast.error(errMsg(err));
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
                                        <td>{populated(c.jobPosting)?.title || "-"}</td>
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
                                            {postings.map((p) => (
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
                <InterviewsModal
                    candidate={interviewCandidate}
                    interviews={interviews}
                    people={people}
                    interviewForm={interviewForm}
                    setInterviewForm={setInterviewForm}
                    feedbackFor={feedbackFor}
                    setFeedbackFor={setFeedbackFor}
                    feedbackForm={feedbackForm}
                    setFeedbackForm={setFeedbackForm}
                    onOpenFeedback={openFeedback}
                    onCancelInterview={cancelInterview}
                    onSubmitFeedback={submitFeedback}
                    onSchedule={scheduleInterview}
                    onClose={() => setInterviewCandidate(null)}
                />
            )}

            {/* Convert to employee */}
            {convertCandidate && (
                <ConvertModal
                    candidate={convertCandidate}
                    convertForm={convertForm}
                    setConvertForm={setConvertForm}
                    convertMissing={convertMissing}
                    convertResult={convertResult}
                    branches={branches}
                    departments={departments}
                    onSubmit={submitConvert}
                    onClose={() => setConvertCandidate(null)}
                />
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
