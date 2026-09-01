"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiArrowLeft } from "react-icons/fi";

interface AddProjectPageProps {
    onBack: () => void;
    onSuccess: () => void;
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
    editProject?: any;
}

export default function AddProjectPage({ onBack, onSuccess, showNotify, editProject }: AddProjectPageProps) {
    const isEdit = !!editProject;
    const [loading, setLoading] = useState(false);
    const [managers, setManagers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: editProject?.name || "",
        client: editProject?.client || "",
        site: editProject?.site || "",
        status: editProject?.status || "Planning",
        progress: editProject?.progress ?? 0,
        startDate: (editProject?.startDate || "").split('T')[0],
        endDate: (editProject?.endDate || "").split('T')[0],
        budget: editProject?.budget ?? "",
        manager: editProject?.manager?._id || editProject?.manager || "",
        description: editProject?.description || "",
    });

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const res = await axiosInstance.get(`${API_ENDPOINTS.EMPLOYEES}/managers`);
                setManagers(res.data.data || []);
            } catch (err) {
                console.error("Failed to load managers", err);
            }
        };
        fetchManagers();
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData, manager: formData.manager || null };
            if (isEdit) {
                await axiosInstance.put(`${API_ENDPOINTS.PROJECTS}/${editProject._id}`, payload);
                showNotify('success', 'Project updated successfully');
            } else {
                await axiosInstance.post(API_ENDPOINTS.PROJECTS, payload);
                showNotify('success', 'Project created successfully');
            }
            onSuccess();
        } catch (err: any) {
            showNotify('failure', err.response?.data?.message || err.message || 'Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "60px" }}>
            <div className="page-header" style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button className="btn btn-secondary" onClick={onBack}><FiArrowLeft /> Back</button>
                    <div>
                        <h1 className="page-title">{isEdit ? "Edit Project" : "New Project"}</h1>
                        <p className="page-subtitle">{isEdit ? "Update project details" : "Set up a new project to start tracking progress"}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--primary)", marginBottom: "16px" }}>Project Details</h3>

                    <div style={{ marginBottom: "16px" }}>
                        <label className="form-label">Project Name *</label>
                        <input required type="text" className="form-input" value={formData.name} onChange={e => handleChange("name", e.target.value)} />
                    </div>

                    <div className="grid-2" style={{ marginBottom: "16px" }}>
                        <div>
                            <label className="form-label">Client</label>
                            <input type="text" className="form-input" value={formData.client} onChange={e => handleChange("client", e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">Site</label>
                            <input type="text" className="form-input" value={formData.site} onChange={e => handleChange("site", e.target.value)} />
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: "16px" }}>
                        <div>
                            <label className="form-label">Status</label>
                            <select className="form-input" value={formData.status} onChange={e => handleChange("status", e.target.value)}>
                                <option value="Planning">Planning</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Progress (%)</label>
                            <input type="number" className="form-input" min={0} max={100} value={formData.progress} onChange={e => handleChange("progress", parseInt(e.target.value) || 0)} />
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: "16px" }}>
                        <div>
                            <label className="form-label">Start Date</label>
                            <input type="date" className="form-input" value={formData.startDate} onChange={e => handleChange("startDate", e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">End Date</label>
                            <input type="date" className="form-input" value={formData.endDate} onChange={e => handleChange("endDate", e.target.value)} />
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: "16px" }}>
                        <div>
                            <label className="form-label">Budget (₹)</label>
                            <input type="number" className="form-input" value={formData.budget} onChange={e => handleChange("budget", e.target.value === "" ? "" : parseFloat(e.target.value))} />
                        </div>
                        <div>
                            <label className="form-label">Project Manager</label>
                            <select className="form-input" value={formData.manager} onChange={e => handleChange("manager", e.target.value)}>
                                <option value="">Unassigned</option>
                                {managers.map((m: any) => (
                                    <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.role})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Description</label>
                        <textarea className="form-input" rows={4} style={{ resize: "vertical" }} value={formData.description} onChange={e => handleChange("description", e.target.value)} />
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button type="button" className="btn btn-secondary" onClick={onBack}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : isEdit ? "Save Changes" : "Create Project"}</button>
                </div>
            </form>
        </div>
    );
}
