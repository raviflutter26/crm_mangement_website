"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_BASE_URL } from "@/config/api";
import { FiSave, FiPlus, FiTrash2, FiPercent, FiInfo, FiEdit2, FiTrendingUp } from "react-icons/fi";

export default function SalarySettingsPage({ showNotify }: { showNotify: (type: any, msg: string) => void }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewCTC, setPreviewCTC] = useState(50000);
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

    const renderBreakdownItem = (label: string, percent: number) => {
        const amount = Math.round(previewCTC * (percent / 100));
        return (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "13px" }}>
                <span style={{ color: "var(--text-secondary)" }}>{label} ({percent}%)</span>
                <span style={{ fontWeight: 600 }}>₹{amount.toLocaleString()}</span>
            </div>
        );
    };

    return (
        <div style={{ padding: "0 40px 40px", height: "100%", overflowY: "auto" }}>
            <div style={{ padding: "30px 0", borderBottom: "1px solid var(--border)", marginBottom: "30px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1E293B" }}>Salary Templates</h1>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>Design percentage-based salary structures for different roles.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px", alignItems: "flex-start" }}>
                {/* Configuration Panel */}
                <div style={{ position: "sticky", top: 0 }}>
                    <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                            {editingTemplate._id ? <FiEdit2 /> : <FiPlus />} {editingTemplate._id ? "Edit Template" : "Create New Template"}
                        </h3>
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label className="form-label">Template Name</label>
                                <input value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="form-input" placeholder="e.g., Engineering Standard" required />
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div><label className="form-label" style={{ fontSize: "12px" }}>Basic (%)</label><input type="number" value={editingTemplate.basicPercent} onChange={e => setEditingTemplate({...editingTemplate, basicPercent: parseInt(e.target.value) || 0})} className="form-input" /></div>
                                <div><label className="form-label" style={{ fontSize: "12px" }}>HRA (%)</label><input type="number" value={editingTemplate.hraPercent} onChange={e => setEditingTemplate({...editingTemplate, hraPercent: parseInt(e.target.value) || 0})} className="form-input" /></div>
                                <div><label className="form-label" style={{ fontSize: "12px" }}>DA (%)</label><input type="number" value={editingTemplate.daPercent} onChange={e => setEditingTemplate({...editingTemplate, daPercent: parseInt(e.target.value) || 0})} className="form-input" /></div>
                                <div><label className="form-label" style={{ fontSize: "12px" }}>Special Allowance (%)</label><input type="number" value={editingTemplate.specialAllowancePercent} onChange={e => setEditingTemplate({...editingTemplate, specialAllowancePercent: parseInt(e.target.value) || 0})} className="form-input" /></div>
                            </div>

                            <div style={{ padding: "12px", background: editingTemplate.basicPercent + editingTemplate.hraPercent + editingTemplate.daPercent + editingTemplate.specialAllowancePercent === 100 ? "#f0fdf4" : "#fef2f2", borderRadius: "8px", fontSize: "13px", border: "1px solid", borderColor: editingTemplate.basicPercent + editingTemplate.hraPercent + editingTemplate.daPercent + editingTemplate.specialAllowancePercent === 100 ? "#bbfcce" : "#fecaca" }}>
                                <strong>Total Allocation:</strong> {editingTemplate.basicPercent + editingTemplate.hraPercent + editingTemplate.daPercent + editingTemplate.specialAllowancePercent}%
                                {editingTemplate.basicPercent + editingTemplate.hraPercent + editingTemplate.daPercent + editingTemplate.specialAllowancePercent !== 100 && 
                                    <p style={{ color: "#dc2626", fontSize: "11px", marginTop: "4px" }}><FiInfo size={12} /> Total must equal 100%</p>}
                            </div>

                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                                <input type="checkbox" checked={editingTemplate.isDefault} onChange={e => setEditingTemplate({...editingTemplate, isDefault: e.target.checked})} />
                                Set as Default Template
                            </label>

                            <button type="submit" className="btn btn-primary" disabled={loading || (editingTemplate.basicPercent + editingTemplate.hraPercent + editingTemplate.daPercent + editingTemplate.specialAllowancePercent !== 100)}>
                                <FiSave /> {loading ? "Saving..." : editingTemplate._id ? "Update Template" : "Save Template"}
                            </button>
                            {editingTemplate._id && (
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingTemplate({ name: "", basicPercent: 40, hraPercent: 20, daPercent: 10, specialAllowancePercent: 30, isDefault: false })}>Cancel Edit</button>
                            )}
                        </form>
                    </div>

                    {/* Live Preview Card */}
                    <div className="card" style={{ padding: "20px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}><FiTrendingUp /> Breakdown Preview</h4>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Monthly Sample</div>
                        </div>
                        <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                            <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Sample Monthly CTC (₹)</label>
                            <input type="number" value={previewCTC} onChange={e => setPreviewCTC(Number(e.target.value))} style={{ border: "none", width: "100%", fontSize: "18px", fontWeight: 700, outline: "none" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {renderBreakdownItem("Basic", editingTemplate.basicPercent)}
                            {renderBreakdownItem("HRA", editingTemplate.hraPercent)}
                            {renderBreakdownItem("DA", editingTemplate.daPercent)}
                            {renderBreakdownItem("Special", editingTemplate.specialAllowancePercent)}
                            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", marginTop: "4px", fontSize: "14px", fontWeight: 700, color: "var(--primary)" }}>
                                <span>Total Monthly</span>
                                <span>₹{previewCTC.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Templates List */}
                <div className="card">
                    <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ fontWeight: 700 }}>Existing Salary Templates</h4>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{templates.length} Active Templates</span>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead style={{ background: "#f8fafc" }}>
                                <tr>
                                    <th>Template Name</th>
                                    <th>Basic / HRA / DA / Special</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map(temp => (
                                    <tr key={temp._id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{temp.name}</div>
                                            {temp.isDefault && <span style={{ fontSize: "10px", padding: "2px 8px", background: "#ecfdf5", color: "#059669", borderRadius: "12px", fontWeight: 700, border: "1px solid #d1fae5" }}>SYSTEM DEFAULT</span>}
                                        </td>
                                        <td style={{ fontSize: "13px" }}>
                                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>{temp.basicPercent}%</span> / {temp.hraPercent}% / {temp.daPercent}% / <span style={{ fontWeight: 600 }}>{temp.specialAllowancePercent}%</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${temp.isActive ? "badge-success" : "badge-secondary"}`} style={{ fontSize: "11px" }}>
                                                {temp.isActive ? "Active" : "Archived"}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => { setEditingTemplate(temp); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><FiEdit2 size={12} /> Edit</button>
                                                <button className="btn btn-secondary btn-sm" style={{ color: "#ef4444" }} onClick={() => handleDelete(temp._id)}><FiTrash2 size={12} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {templates.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                                            <div style={{ fontSize: "40px", marginBottom: "10px", opacity: 0.3 }}>📁</div>
                                            <p>No customized templates found.</p>
                                            <p style={{ fontSize: "12px" }}>System fallback (40/20/10/30) is currently in use.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ padding: "16px", background: "#fffbeb", borderTop: "1px solid #fef3c7", borderRadius: "0 0 12px 12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <FiInfo color="#d97706" style={{ marginTop: "2px" }} />
                        <div style={{ fontSize: "12px", color: "#92400e" }}>
                            <strong>Tip:</strong> Templates created here will automatically appear in the <strong>Add Employee</strong> wizard's Payroll step for easy salary breakdown calculation.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

