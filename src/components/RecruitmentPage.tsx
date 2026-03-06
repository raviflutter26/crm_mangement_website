"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiBriefcase, FiUsers, FiPlus, FiEdit2, FiTrash2,
    FiSearch, FiFilter, FiCalendar, FiCheckCircle, FiXCircle, FiUserPlus
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

const STATUS_COLORS: any = {
    draft: "pending", open: "active", "on-hold": "leave", closed: "inactive",
    applied: "pending", screening: "processing", interview: "leave",
    offered: "active", hired: "active", rejected: "inactive",
};

export default function RecruitmentPage() {
    const [activeView, setActiveView] = useState<"postings" | "candidates">("postings");
    const [postings, setPostings] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<any>({});
    const [toast, setToast] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

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

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
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
        setFormData({ status: "applied", source: "portal" });
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
            noticePeriod: item.noticePeriod || 0, status: item.status || "applied",
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
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id: string, type: "postings" | "candidates") => {
        if (!confirm("Are you sure?")) return;
        const endpoint = type === "postings" ? API_ENDPOINTS.JOB_POSTINGS : API_ENDPOINTS.CANDIDATES;
        try {
            await axiosInstance.delete(`${endpoint}/${id}`);
            showToast("Deleted!");
            fetchData();
        } catch (err: any) {
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    };

    const stats = [
        { label: "Open Positions", value: postings.filter(p => p.status === "open").length, icon: FiBriefcase, color: "blue" },
        { label: "Total Candidates", value: candidates.length, icon: FiUsers, color: "green" },
        { label: "Interviews Scheduled", value: candidates.filter(c => c.status === "interview").length, icon: FiCalendar, color: "orange" },
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
                        <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
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
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No job postings yet.</td></tr>
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
                                        <td><span className={`badge ${STATUS_COLORS[c.status] || "pending"}`}>{c.status}</span></td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEditCandidate(c)}><FiEdit2 /></button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(c._id, "candidates")} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {candidates.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No candidates yet.</td></tr>
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
                    backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000,
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
                                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Status</label>
                                            <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                                <option value="applied">Applied</option>
                                                <option value="screening">Screening</option>
                                                <option value="interview">Interview</option>
                                                <option value="offered">Offered</option>
                                                <option value="hired">Hired</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </div>
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

            {toast && (
                <div style={{
                    position: "fixed", bottom: "20px", right: "20px",
                    background: "rgba(34, 197, 94, 0.9)", color: "white",
                    padding: "12px 20px", borderRadius: "8px", zIndex: 3000,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px",
                    fontWeight: 600, animation: "fadeInUp 0.3s ease-out"
                }}>
                    <FiCheckCircle size={20} /> {toast}
                </div>
            )}
        </>
    );
}
