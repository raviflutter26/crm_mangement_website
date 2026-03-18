"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiAward, FiMapPin, FiMap, FiClock, FiCalendar,
    FiPlus, FiEdit2, FiTrash2, FiCheckCircle
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

const TABS = [
    { id: "designations", label: "Designations", icon: FiAward },
    { id: "branches", label: "Branches", icon: FiMapPin },
    { id: "locations", label: "Locations", icon: FiMap },
    { id: "shifts", label: "Shifts", icon: FiClock },
    { id: "holidays", label: "Holidays", icon: FiCalendar },
];

const ENDPOINTS: any = {
    designations: API_ENDPOINTS.DESIGNATIONS,
    branches: API_ENDPOINTS.BRANCHES,
    locations: API_ENDPOINTS.LOCATIONS,
    shifts: API_ENDPOINTS.SHIFTS,
    holidays: API_ENDPOINTS.HOLIDAYS,
};

const FORM_FIELDS: any = {
    designations: [
        { name: "name", label: "Designation Name", type: "text", required: true, placeholder: "e.g., Senior Engineer" },
        { name: "level", label: "Level", type: "number", placeholder: "1" },
        { name: "department", label: "Department", type: "text", placeholder: "e.g., Engineering" },
        { name: "description", label: "Description", type: "textarea", placeholder: "Role description" },
    ],
    branches: [
        { name: "name", label: "Branch Name", type: "text", required: true, placeholder: "e.g., Mumbai HQ" },
        { name: "code", label: "Branch Code", type: "text", placeholder: "MUM-HQ" },
        { name: "address", label: "Address", type: "textarea", placeholder: "Full address" },
        { name: "city", label: "City", type: "text", placeholder: "Mumbai" },
        { name: "state", label: "State", type: "text", placeholder: "Maharashtra" },
        { name: "country", label: "Country", type: "text", placeholder: "India" },
        { name: "pincode", label: "Pincode", type: "text", placeholder: "400001" },
        { name: "phone", label: "Phone", type: "text", placeholder: "+91-22-12345678" },
        { name: "email", label: "Email", type: "email", placeholder: "branch@company.com" },
        { name: "headOfBranch", label: "Head of Branch", type: "text", placeholder: "Manager name" },
    ],
    locations: [
        { name: "name", label: "Location Name", type: "text", required: true, placeholder: "e.g., Floor 3, Block A" },
        { name: "branch", label: "Branch", type: "text", placeholder: "Branch name" },
        { name: "floor", label: "Floor", type: "text", placeholder: "3rd Floor" },
        { name: "building", label: "Building", type: "text", placeholder: "Block A" },
        { name: "capacity", label: "Capacity", type: "number", placeholder: "50" },
    ],
    shifts: [
        { name: "name", label: "Shift Name", type: "text", required: true, placeholder: "e.g., Morning Shift" },
        { name: "startTime", label: "Start Time", type: "time", required: true },
        { name: "endTime", label: "End Time", type: "time", required: true },
        { name: "breakMinutes", label: "Break (minutes)", type: "number", placeholder: "60" },
        { name: "graceMinutes", label: "Grace Period (minutes)", type: "number", placeholder: "15" },
    ],
    holidays: [
        { name: "name", label: "Holiday Name", type: "text", required: true, placeholder: "e.g., Republic Day" },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "type", label: "Type", type: "select", options: ["national", "regional", "company", "restricted"] },
        { name: "year", label: "Year", type: "number", required: true, placeholder: "2026" },
        { name: "description", label: "Description", type: "textarea", placeholder: "Holiday details" },
    ],
};

const TABLE_COLS: any = {
    designations: ["name", "level", "department", "isActive"],
    branches: ["name", "code", "city", "state", "isActive"],
    locations: ["name", "branch", "floor", "capacity", "isActive"],
    shifts: ["name", "startTime", "endTime", "breakMinutes", "graceMinutes"],
    holidays: ["name", "date", "type", "year", "isOptional"],
};

interface OrganizationPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function OrganizationPage({ showNotify }: OrganizationPageProps) {
    const [activeTab, setActiveTab] = useState("designations");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<any>({});
    const [toast, setToast] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(ENDPOINTS[activeTab]);
            setData(res.data.data || []);
        } catch (err) {
            console.error("Fetch error", err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({});
        setShowModal(true);
    };

    const openEditModal = (item: any) => {
        setIsEditing(true);
        setEditId(item._id);
        const fd: any = {};
        FORM_FIELDS[activeTab].forEach((f: any) => {
            if (f.type === "date" && item[f.name]) {
                fd[f.name] = new Date(item[f.name]).toISOString().split("T")[0];
            } else {
                fd[f.name] = item[f.name] ?? "";
            }
        });
        setFormData(fd);
        setShowModal(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axiosInstance.put(`${ENDPOINTS[activeTab]}/${editId}`, formData);
                showToast("Updated successfully!");
            } else {
                await axiosInstance.post(ENDPOINTS[activeTab], formData);
                showToast("Created successfully!");
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this?")) return;
        try {
            await axiosInstance.delete(`${ENDPOINTS[activeTab]}/${id}`);
            showToast("Deleted successfully!");
            fetchData();
        } catch (err: any) {
            alert("Error deleting: " + (err.response?.data?.message || err.message));
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    const formatCellValue = (key: string, value: any) => {
        if (key === "date" && value) return new Date(value).toLocaleDateString();
        if (key === "isActive") return value !== false ? "Active" : "Inactive";
        if (key === "isOptional") return value ? "Yes" : "No";
        return value ?? "-";
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Organization</h1>
                    <p className="page-subtitle">Manage your company structure, shifts, and holidays</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <FiPlus /> Add {activeTab.slice(0, -1)}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        className={`btn ${activeTab === tab.id ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ fontSize: "13px" }}
                    >
                        <tab.icon /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{TABS.find(t => t.id === activeTab)?.label} — {data.length} records</h3>
                </div>
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
                    ) : data.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                            No records found. Click &quot;Add&quot; to create one.
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    {TABLE_COLS[activeTab].map((col: string) => (
                                        <th key={col}>{col.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase())}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: any) => (
                                    <tr key={item._id}>
                                        {TABLE_COLS[activeTab].map((col: string) => (
                                            <td key={col}>
                                                {col === "isActive" ? (
                                                    <span className={`badge ${item[col] !== false ? "active" : "inactive"}`}>
                                                        {item[col] !== false ? "Active" : "Inactive"}
                                                    </span>
                                                ) : (
                                                    formatCellValue(col, item[col])
                                                )}
                                            </td>
                                        ))}
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(item)}>
                                                    <FiEdit2 />
                                                </button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(item._id)} style={{ color: "var(--error)" }}>
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
                    <div className="card animate-in" style={{ width: "520px", maxHeight: "80vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit" : "Add"} {activeTab.slice(0, -1)}</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {FORM_FIELDS[activeTab].map((field: any) => (
                                <div key={field.name}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>
                                        {field.label} {field.required && <span style={{ color: "var(--error)" }}>*</span>}
                                    </label>
                                    {field.type === "textarea" ? (
                                        <textarea
                                            name={field.name}
                                            value={formData[field.name] || ""}
                                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                            className="form-input"
                                            placeholder={field.placeholder}
                                            rows={3}
                                            style={{ resize: "none" }}
                                        />
                                    ) : field.type === "select" ? (
                                        <select
                                            name={field.name}
                                            value={formData[field.name] || field.options[0]}
                                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                            className="form-input"
                                        >
                                            {field.options.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            value={formData[field.name] || ""}
                                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                            className="form-input"
                                            placeholder={field.placeholder}
                                            required={field.required}
                                        />
                                    )}
                                </div>
                            ))}
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
                    background: "var(--success-bg)", color: "white",
                    padding: "12px 20px", borderRadius: "8px", zIndex: 3000,
                    boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: "10px",
                    fontWeight: 600, animation: "fadeInUp 0.3s ease-out"
                }}>
                    <FiCheckCircle size={20} /> {toast}
                </div>
            )}
        </>
    );
}
