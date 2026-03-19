"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiPlus, FiEdit2, FiTrash2, FiGlobe, FiClock, FiCalendar, FiX, FiUsers, FiMapPin } from "react-icons/fi";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function OrganizationListPage() {
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<any>({
        name: "", organizationId: "", timezone: "Asia/Kolkata",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        attendanceSettings: { defaultStartTime: "09:00", defaultEndTime: "18:00", graceMinutes: 15, workingHours: 8 }
    });

    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/organization');
            setOrganizations(res.data.data || []);
        } catch (err) { console.error("Fetch error", err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchOrganizations(); }, []);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axiosInstance.put(`/api/organization/${editId}`, formData);
            } else {
                await axiosInstance.post('/api/organization', formData);
            }
            setShowModal(false);
            fetchOrganizations();
        } catch (err: any) { alert("Error saving organization: " + (err.response?.data?.message || err.message)); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this organization? This action cannot be undone.")) return;
        try {
            await axiosInstance.delete(`/api/organization/${id}`);
            fetchOrganizations();
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const toggleDay = (day: string) => {
        const wd = formData.workingDays || [];
        setFormData({ ...formData, workingDays: wd.includes(day) ? wd.filter((d: string) => d !== day) : [...wd, day] });
    };

    const openCreate = () => {
        setIsEditing(false); setEditId("");
        setFormData({ name: "", organizationId: "", timezone: "Asia/Kolkata", workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], attendanceSettings: { defaultStartTime: "09:00", defaultEndTime: "18:00", graceMinutes: 15, workingHours: 8 } });
        setShowModal(true);
    };

    const openEdit = (org: any) => {
        setIsEditing(true); setEditId(org._id); setFormData({ ...org }); setShowModal(true);
    };

    return (
        <div style={{ padding: "0" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1f2937", margin: 0 }}>Organizations</h1>
                    <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>Manage multiple companies and their global settings</p>
                </div>
                <button onClick={openCreate} style={{
                    padding: "10px 22px", borderRadius: "8px", border: "none",
                    background: "#f97316", color: "#fff", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                    boxShadow: "0 2px 8px rgba(249,115,22,0.3)"
                }}>
                    <FiPlus size={16} /> Add Organization
                </button>
            </div>

            {/* Cards grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
                    <div style={{ width: "40px", height: "40px", margin: "0 auto 12px", borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#f97316", animation: "spin 0.8s linear infinite" }} />
                    Loading organizations...
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : organizations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px", color: "#6b7280" }}>
                    <span style={{ fontSize: "48px" }}>🏢</span>
                    <p style={{ fontSize: "16px", fontWeight: 500, marginTop: "12px" }}>No organizations yet</p>
                    <p style={{ fontSize: "13px", color: "#9ca3af" }}>Click &quot;Add Organization&quot; to get started</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
                    {organizations.map((org) => (
                        <div key={org._id} style={{
                            background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb",
                            padding: "0", overflow: "hidden", transition: "box-shadow 0.2s, transform 0.2s",
                            cursor: "default"
                        }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                            {/* Card header with accent strip */}
                            <div style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                                        <FiMapPin size={20} color="#fff" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", margin: 0 }}>{org.name}</h3>
                                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", fontFamily: "monospace", letterSpacing: "0.5px", margin: "2px 0 0" }}>{org.organizationId}</p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "4px" }}>
                                    <button onClick={() => openEdit(org)} style={{
                                        background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px",
                                        padding: "8px", cursor: "pointer", color: "#fff", transition: "0.2s", backdropFilter: "blur(4px)"
                                    }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.35)")}
                                       onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}>
                                        <FiEdit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(org._id)} style={{
                                        background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px",
                                        padding: "8px", cursor: "pointer", color: "#fff", transition: "0.2s", backdropFilter: "blur(4px)"
                                    }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.6)")}
                                       onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}>
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Card body */}
                            <div style={{ padding: "20px" }}>
                                {/* Info grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <FiGlobe size={14} color="#2563eb" />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Timezone</span>
                                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151", margin: "2px 0 0" }}>{org.timezone || "Asia/Kolkata"}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <FiClock size={14} color="#f59e0b" />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Work Hours</span>
                                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151", margin: "2px 0 0" }}>{org.attendanceSettings?.defaultStartTime || "09:00"} - {org.attendanceSettings?.defaultEndTime || "18:00"}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <FiCalendar size={14} color="#16a34a" />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Grace Period</span>
                                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151", margin: "2px 0 0" }}>{org.attendanceSettings?.graceMinutes || 15} mins</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fdf2f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <FiUsers size={14} color="#ec4899" />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Min Hours</span>
                                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151", margin: "2px 0 0" }}>{org.attendanceSettings?.workingHours || 8} hrs/day</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Working days */}
                                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "14px" }}>
                                    <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Working Days</span>
                                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                                        {DAYS_SHORT.map((d, i) => {
                                            const isWorking = (org.workingDays || DAYS_FULL.slice(0, 5)).includes(DAYS_FULL[i]);
                                            return (
                                                <div key={d} style={{
                                                    width: "38px", height: "28px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    background: isWorking ? "#f97316" : "#f3f4f6",
                                                    color: isWorking ? "#fff" : "#9ca3af"
                                                }}>
                                                    {d}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "560px",
                        boxShadow: "0 25px 50px rgba(0,0,0,0.15)", overflow: "hidden",
                        animation: "modalIn 0.2s ease-out", maxHeight: "90vh", overflowY: "auto"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
                            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1f2937" }}>{isEditing ? 'Edit' : 'Add'} Organization</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Company Name */}
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Company Name *</label>
                                <input type="text" value={formData.name} required placeholder="e.g. Acme Corp"
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                            </div>
                            {/* Org ID */}
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Organization ID *</label>
                                <input type="text" value={formData.organizationId} required placeholder="e.g. acme_corp" disabled={isEditing}
                                    onChange={e => setFormData({ ...formData, organizationId: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none", background: isEditing ? "#f9fafb" : "#fff" }} />
                            </div>
                            {/* Timezone */}
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Timezone</label>
                                <select value={formData.timezone} onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }}>
                                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                    <option value="America/New_York">America/New_York (EST)</option>
                                    <option value="Europe/London">Europe/London (GMT)</option>
                                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                                </select>
                            </div>
                            {/* Timings row */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Start Time</label>
                                    <input type="time" value={formData.attendanceSettings?.defaultStartTime || "09:00"}
                                        onChange={e => setFormData({ ...formData, attendanceSettings: { ...formData.attendanceSettings, defaultStartTime: e.target.value } })}
                                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>End Time</label>
                                    <input type="time" value={formData.attendanceSettings?.defaultEndTime || "18:00"}
                                        onChange={e => setFormData({ ...formData, attendanceSettings: { ...formData.attendanceSettings, defaultEndTime: e.target.value } })}
                                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                </div>
                            </div>
                            {/* Grace & Hours */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Grace (Mins)</label>
                                    <input type="number" value={formData.attendanceSettings?.graceMinutes ?? 15}
                                        onChange={e => setFormData({ ...formData, attendanceSettings: { ...formData.attendanceSettings, graceMinutes: parseInt(e.target.value) } })}
                                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Working Hours</label>
                                    <input type="number" value={formData.attendanceSettings?.workingHours ?? 8}
                                        onChange={e => setFormData({ ...formData, attendanceSettings: { ...formData.attendanceSettings, workingHours: parseInt(e.target.value) } })}
                                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                </div>
                            </div>
                            {/* Working Days selector */}
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Working Days</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    {DAYS_FULL.map((day, i) => {
                                        const selected = (formData.workingDays || []).includes(day);
                                        return (
                                            <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                                                width: "44px", height: "36px", borderRadius: "8px", border: selected ? "none" : "1px solid #e5e7eb",
                                                background: selected ? "#f97316" : "#fff", color: selected ? "#fff" : "#6b7280",
                                                fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "0.2s"
                                            }}>
                                                {DAYS_SHORT[i]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Buttons */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: "1px solid #f3f4f6" }}>
                                <button type="button" onClick={() => setShowModal(false)}
                                    style={{ padding: "10px 24px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                                    Cancel
                                </button>
                                <button type="submit"
                                    style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#f97316", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 6px rgba(249,115,22,0.3)" }}>
                                    {isEditing ? 'Save Changes' : 'Create Organization'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
                </div>
            )}
        </div>
    );
}
