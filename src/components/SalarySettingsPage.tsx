"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiSave, FiPlus, FiTrash2, FiPercent, FiInfo } from "react-icons/fi";

export default function SalarySettingsPage({ showNotify }: { showNotify: (type: any, msg: string) => void }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>({
        name: "",
        basicPercent: 40,
        hraPercent: 20,
        daPercent: 10,
        specialAllowancePercent: 30,
        isDefault: false
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await axiosInstance.get(`${API_BASE_URL}/api/salary-templates`);
            setTemplates(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const total = editingTemplate.basicPercent + editingTemplate.hraPercent + editingTemplate.daPercent + editingTemplate.specialAllowancePercent;
        if (total !== 100) {
            return showNotify('failure', `Total percentage must be 100%. Current total: ${total}%`);
        }

        setLoading(true);
        try {
            await axiosInstance.post(`${API_BASE_URL}/api/salary-templates`, editingTemplate);
            showNotify('success', "Template saved successfully!");
            setEditingTemplate({ name: "", basicPercent: 40, hraPercent: 20, daPercent: 10, specialAllowancePercent: 30, isDefault: false });
            fetchTemplates();
        } catch (err) {
            showNotify('failure', "Failed to save template");
        } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            await axiosInstance.delete(`${API_BASE_URL}/api/salary-templates/${id}`);
            showNotify('success', "Template deleted");
            fetchTemplates();
        } catch (err) { showNotify('failure', "Failed to delete"); }
    };

    return (
        <div style={{ padding: "0 40px 40px", height: "100%", overflowY: "auto" }}>
            <div style={{ padding: "20px 0", borderBottom: "1px solid var(--border)", marginBottom: "30px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Salary Settings</h1>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Configure dynamic salary components and percentage splits.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
                {/* Configuration Panel */}
                <div className="card" style={{ padding: "25px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <FiPlus /> {editingTemplate._id ? "Edit Template" : "Add New Template"}
                    </h3>
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div><label className="form-label">Template Name</label><input value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="form-input" placeholder="e.g., Engineering Standard" required /></div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                            <div><label className="form-label">Basic (%)</label><input type="number" value={editingTemplate.basicPercent} onChange={e => setEditingTemplate({...editingTemplate, basicPercent: parseInt(e.target.value) || 0})} className="form-input" /></div>
                            <div><label className="form-label">HRA (%)</label><input type="number" value={editingTemplate.hraPercent} onChange={e => setEditingTemplate({...editingTemplate, hraPercent: parseInt(e.target.value) || 0})} className="form-input" /></div>
                            <div><label className="form-label">DA (%)</label><input type="number" value={editingTemplate.daPercent} onChange={e => setEditingTemplate({...editingTemplate, daPercent: parseInt(e.target.value) || 0})} className="form-input" /></div>
                            <div><label className="form-label">Special (%)</label><input type="number" value={editingTemplate.specialAllowancePercent} onChange={e => setEditingTemplate({...editingTemplate, specialAllowancePercent: parseInt(e.target.value) || 0})} className="form-input" /></div>
                        </div>

                        <div style={{ padding: "12px", background: "var(--bg-secondary)", borderRadius: "8px", fontSize: "13px" }}>
                            <strong>Total:</strong> {editingTemplate.basicPercent + editingTemplate.hraPercent + editingTemplate.daPercent + editingTemplate.specialAllowancePercent}%
                            {editingTemplate.basicPercent + editingTemplate.hraPercent + editingTemplate.daPercent + editingTemplate.specialAllowancePercent !== 100 && 
                                <span style={{ color: "red", marginLeft: "10px" }}> (Must be 100%)</span>}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input type="checkbox" checked={editingTemplate.isDefault} onChange={e => setEditingTemplate({...editingTemplate, isDefault: e.target.checked})} />
                            <label className="form-label" style={{ marginBottom: 0 }}>Set as Default Template</label>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "10px" }}>
                            <FiSave /> {loading ? "Saving..." : "Save Template"}
                        </button>
                    </form>
                </div>

                {/* Templates List */}
                <div className="card">
                    <div style={{ padding: "20px", borderBottom: "1px solid var(--border)" }}>
                        <h4 style={{ fontWeight: 700 }}>Existing Templates</h4>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Basic/HRA/DA/Spl</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map(temp => (
                                    <tr key={temp._id}>
                                        <td style={{ fontWeight: 600 }}>{temp.name} {temp.isDefault && <span style={{ fontSize: "10px", padding: "2px 6px", background: "#E3F2FD", color: "#1976D2", borderRadius: "10px", marginLeft: "5px" }}>Default</span>}</td>
                                        <td>{temp.basicPercent}% / {temp.hraPercent}% / {temp.daPercent}% / {temp.specialAllowancePercent}%</td>
                                        <td>{temp.isActive ? "Active" : "Inactive"}</td>
                                        <td style={{ display: "flex", gap: "10px" }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingTemplate(temp)}>Edit</button>
                                            <button className="btn btn-secondary btn-sm" style={{ color: "red" }} onClick={() => handleDelete(temp._id)}><FiTrash2 /></button>
                                        </td>
                                    </tr>
                                ))}
                                {templates.length === 0 && (
                                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No templates defined. Using system default (40/20/10/30).</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5001";
