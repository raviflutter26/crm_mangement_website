"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiPlus, FiEdit2, FiTrash2, FiBriefcase, FiUsers } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Employee count mapped by department name
    const [employeeCounts, setEmployeeCounts] = useState<any>({});

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        isActive: true
    });

    const getToken = async () => {
        let token = localStorage.getItem('ravi_zoho_token');
        if (!token) { window.location.reload(); throw new Error("No token"); }
        return token;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const [deptRes, empRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.DEPARTMENTS),
                axiosInstance.get(API_ENDPOINTS.EMPLOYEES)
            ]);

            setDepartments(deptRes.data.data);

            // Calculate headcount
            const counts: any = {};
            empRes.data.data.forEach((emp: any) => {
                const dName = emp.department;
                if (dName) {
                    counts[dName] = (counts[dName] || 0) + 1;
                }
            });
            setEmployeeCounts(counts);

        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('ravi_zoho_token');
            }
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e: any) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({ name: "", description: "", isActive: true });
        setShowModal(true);
    };

    const openEditModal = (dept: any) => {
        setIsEditing(true);
        setEditId(dept._id);
        setFormData({
            name: dept.name || "",
            description: dept.description || "",
            isActive: dept.isActive !== false
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const token = await getToken();
            if (isEditing) {
                await axiosInstance.put(`${API_ENDPOINTS.DEPARTMENTS}/${editId}`, formData);
            } else {
                await axiosInstance.post(API_ENDPOINTS.DEPARTMENTS, formData);
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('ravi_zoho_token');
                alert("Session expired. Please try again.");
            } else {
                console.error("Failed to save department", err);
                alert("Error saving department: " + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            const token = await getToken();
            await axiosInstance.delete(`${API_ENDPOINTS.DEPARTMENTS}/${id}`);
            fetchData();
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('ravi_zoho_token');
                alert("Session expired. Please try again.");
            } else {
                console.error("Failed to delete", err);
                alert("Error deleting department.");
            }
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Departments</h1>
                    <p className="page-subtitle">Organize your company structure — {departments.length} departments built</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={openAddModal}><FiPlus /> Add Department</button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: "40px", textAlign: "center" }}>Loading Departments...</div>
            ) : (
                <div className="grid-3">
                    {departments.map((dept) => (
                        <div key={dept._id} className="card animate-in" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px", position: "relative" }}>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px" }}>
                                        <FiBriefcase />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "16px", fontWeight: "700" }}>{dept.name}</h3>
                                        <span className={`badge ${dept.isActive ? "active" : "inactive"}`} style={{ marginTop: "4px" }}>
                                            {dept.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5", flex: 1 }}>
                                {dept.description || "No description provided for this department."}
                            </p>

                            <div style={{ padding: "12px", background: "var(--bg-primary)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "13px", fontWeight: "600" }}>
                                    <FiUsers /> Headcount
                                </div>
                                <div style={{ fontSize: "16px", fontWeight: "800" }}>
                                    {employeeCounts[dept.name] || 0}
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                                <button onClick={() => openEditModal(dept)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                                    <FiEdit2 /> Edit
                                </button>
                                <button onClick={() => handleDelete(dept._id, dept.name)} className="btn btn-secondary btn-sm" style={{ padding: "8px", color: "var(--error)" }}>
                                    <FiTrash2 />
                                </button>
                            </div>

                        </div>
                    ))}
                    {departments.length === 0 && (
                        <div style={{ gridColumn: "1 / -1" }} className="empty-state">
                            <FiBriefcase className="empty-state-icon" style={{ opacity: 0.5 }} />
                            <h3>No Departments Found</h3>
                            <p>Get started by building your organizational structure.</p>
                            <button className="btn btn-primary" onClick={openAddModal}>Add First Department</button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal for Add / Edit */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div className="card animate-in" style={{ width: "450px", padding: "20px" }}>
                        <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit Department" : "Add Department"}</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Department Name</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange}
                                    className="form-input" placeholder="e.g., Engineering" />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange}
                                    className="form-input" placeholder="What does this department do?" rows={3} style={{ resize: "none" }} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
                                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} id="isActiveCheck" style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }} />
                                <label htmlFor="isActiveCheck" style={{ fontSize: "14px", cursor: "pointer" }}>Active Department</label>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? "Save Changes" : "Create Department"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
