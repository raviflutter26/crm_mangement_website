"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiMoon, FiSun, FiUsers, FiX, FiCheck } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ShiftManagementPage() {
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [assignFeedback, setAssignFeedback] = useState<string>("");
    const [formData, setFormData] = useState<any>({
        name: "", startTime: "09:00", endTime: "18:00", workingHours: 8,
        graceMinutes: 15, maxLatePerMonth: 3, isNightShift: false,
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    });
    const [orgEmployees, setOrgEmployees] = useState<any[]>([]);
    const [assigningLoading, setAssigningLoading] = useState(false);

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const res = await axiosInstance.get('/api/organization');
                setOrganizations(res.data.data || []);
                if (res.data.data?.length > 0) setSelectedOrgId(res.data.data[0]._id);
            } catch (err) { console.error("Fetch orgs error", err); }
        };
        fetchOrgs();
    }, []);

    const fetchShifts = async () => {
        if (!selectedOrgId) return;
        setLoading(true);
        try {
            const [shiftRes, empRes] = await Promise.all([
                axiosInstance.get(`/api/shifts?organizationId=${selectedOrgId}`),
                axiosInstance.get(`${API_ENDPOINTS.EMPLOYEES}?organizationId=${selectedOrgId}`)
            ]);
            setShifts(shiftRes.data.data || []);
            setOrgEmployees(empRes.data.data || []);
        } catch (err) { console.error("Fetch shifts error", err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchShifts(); }, [selectedOrgId]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const data = { ...formData, organizationId: selectedOrgId };
            if (isEditing) await axiosInstance.put(`/api/shifts/${editId}`, data);
            else await axiosInstance.post('/api/shifts', data);
            setShowModal(false);
            fetchShifts();
        } catch (err: any) { alert("Error saving shift: " + (err.response?.data?.message || err.message)); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this shift?")) return;
        try { await axiosInstance.delete(`/api/shifts/${id}`); fetchShifts(); } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const handleAssignShift = async (empId: string, shiftId: string) => {
        setAssigningLoading(true);
        try {
            await axiosInstance.put(`${API_ENDPOINTS.EMPLOYEES}/${empId}`, { shift: shiftId || null });
            setAssignFeedback(empId);
            setTimeout(() => setAssignFeedback(""), 2000);
            fetchShifts();
        } catch (err: any) { alert("Error assigning shift: " + (err.response?.data?.message || err.message)); } finally { setAssigningLoading(false); }
    };

    const toggleDay = (day: string) => {
        const wd = formData.workingDays || [];
        setFormData({ ...formData, workingDays: wd.includes(day) ? wd.filter((d: string) => d !== day) : [...wd, day] });
    };

    const openCreate = () => {
        setIsEditing(false); setEditId("");
        setFormData({ name: "", startTime: "09:00", endTime: "18:00", workingHours: 8, graceMinutes: 15, maxLatePerMonth: 3, isNightShift: false, workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] });
        setShowModal(true);
    };

    return (
        <div style={{ padding: "0" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1f2937", margin: 0 }}>Shift Management</h1>
                    <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>Configure working hours and late policies per organization</p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <select value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)}
                        style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", background: "#fff", outline: "none", minWidth: "180px" }}>
                        {organizations.map(org => <option key={org._id} value={org._id}>{org.name}</option>)}
                    </select>
                    <button onClick={openCreate} style={{
                        padding: "10px 22px", borderRadius: "8px", border: "none",
                        background: "#f97316", color: "#fff", fontSize: "13px", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                        boxShadow: "0 2px 8px rgba(249,115,22,0.3)"
                    }}>
                        <FiPlus size={16} /> Create Shift
                    </button>
                </div>
            </div>

            {/* Shifts table */}
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: "32px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            {["SHIFT NAME", "TIMINGS", "MIN HOURS", "GRACE", "MAX LATE/MO", "TYPE", "ACTIONS"].map(h => (
                                <th key={h} style={{
                                    padding: "14px 20px", textAlign: h === "ACTIONS" ? "right" : "left",
                                    fontSize: "11px", fontWeight: 600, color: "#6b7280",
                                    textTransform: "uppercase", letterSpacing: "0.8px", background: "#fafbfc"
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: "center", padding: "50px" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#f97316", animation: "spin 0.8s linear infinite" }} />
                                    <span style={{ color: "#9ca3af", fontSize: "13px" }}>Loading shifts...</span>
                                </div>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </td></tr>
                        ) : shifts.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: "center", padding: "60px 20px" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                    <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <FiClock size={28} color="#f97316" />
                                    </div>
                                    <span style={{ fontSize: "15px", fontWeight: 600, color: "#374151" }}>No shifts defined</span>
                                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>Create your first shift for this organization to manage working hours</span>
                                    <button onClick={openCreate} style={{
                                        marginTop: "8px", padding: "8px 18px", borderRadius: "8px", border: "none",
                                        background: "#f97316", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer"
                                    }}>
                                        <FiPlus size={14} style={{ marginRight: "6px", verticalAlign: "-2px" }} />Create Shift
                                    </button>
                                </div>
                            </td></tr>
                        ) : shifts.map((shift, i) => (
                            <tr key={shift._id} style={{ borderBottom: i < shifts.length - 1 ? "1px solid #f3f4f6" : "none", transition: "background 0.15s" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                                <td style={{ padding: "16px 20px" }}>
                                    <div style={{ fontWeight: 600, color: "#1f2937", fontSize: "13px" }}>{shift.name}</div>
                                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                                        {(shift.workingDays || []).map((d: string) => d.slice(0, 3)).join(', ')}
                                    </div>
                                </td>
                                <td style={{ padding: "16px 20px" }}>
                                    <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                                        {shift.startTime} — {shift.endTime}
                                    </span>
                                </td>
                                <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#374151" }}>{shift.workingHours}h</td>
                                <td style={{ padding: "16px 20px", fontSize: "13px", color: "#6b7280" }}>{shift.graceMinutes} min</td>
                                <td style={{ padding: "16px 20px" }}>
                                    <span style={{ background: "#fff7ed", color: "#ea580c", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                                        {shift.maxLatePerMonth}/month
                                    </span>
                                </td>
                                <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                    {shift.isNightShift ? (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#eef2ff", color: "#6366f1", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
                                            <FiMoon size={12} /> Night
                                        </span>
                                    ) : (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fef9c3", color: "#ca8a04", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
                                            <FiSun size={12} /> Day
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
                                        <button onClick={() => { setIsEditing(true); setEditId(shift._id); setFormData(shift); setShowModal(true); }}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: "6px", borderRadius: "6px", transition: "0.2s" }}
                                            onMouseEnter={e => { e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = "#d1d5db"; e.currentTarget.style.background = "none"; }}>
                                            <FiEdit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(shift._id)}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: "6px", borderRadius: "6px", transition: "0.2s" }}
                                            onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = "#d1d5db"; e.currentTarget.style.background = "none"; }}>
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Employee Shift Assignment */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FiUsers size={18} color="#2563eb" />
                </div>
                <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: 0 }}>Assign Shifts to Employees</h2>
                    <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>Select a shift for each employee in this organization</p>
                </div>
            </div>
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            {["EMPLOYEE", "ID", "DEPARTMENT", "CURRENT SHIFT", "ASSIGN NEW SHIFT"].map(h => (
                                <th key={h} style={{
                                    padding: "14px 20px", textAlign: h === "ASSIGN NEW SHIFT" ? "right" : "left",
                                    fontSize: "11px", fontWeight: 600, color: "#6b7280",
                                    textTransform: "uppercase", letterSpacing: "0.8px", background: "#fafbfc"
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orgEmployees.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: "center", padding: "50px", color: "#9ca3af" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "36px" }}>👥</span>
                                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280" }}>No employees found for this organization</span>
                                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>Add employees and assign them to this organization first</span>
                                </div>
                            </td></tr>
                        ) : orgEmployees.map((emp, i) => (
                            <tr key={emp._id} style={{ borderBottom: i < orgEmployees.length - 1 ? "1px solid #f3f4f6" : "none", transition: "background 0.15s" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                                <td style={{ padding: "14px 20px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{
                                            width: "34px", height: "34px", borderRadius: "50%",
                                            background: `hsl(${(emp.firstName?.charCodeAt(0) || 0) * 20}, 60%, 92%)`,
                                            color: `hsl(${(emp.firstName?.charCodeAt(0) || 0) * 20}, 60%, 35%)`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "13px", fontWeight: 700
                                        }}>
                                            {(emp.firstName?.[0] || "?")}{(emp.lastName?.[0] || "")}
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: "13px", color: "#1f2937" }}>{emp.firstName} {emp.lastName}</span>
                                    </div>
                                </td>
                                <td style={{ padding: "14px 20px", fontSize: "12px", color: "#9ca3af", fontFamily: "monospace" }}>{emp.employeeId}</td>
                                <td style={{ padding: "14px 20px", fontSize: "13px", color: "#6b7280" }}>{emp.department}</td>
                                <td style={{ padding: "14px 20px" }}>
                                    {emp.shift ? (
                                        <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                                            {emp.shift.name || "Assigned"}
                                        </span>
                                    ) : (
                                        <span style={{ background: "#f3f4f6", color: "#9ca3af", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500 }}>
                                            No Shift
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                                        <select value={emp.shift?._id || emp.shift || ""} disabled={assigningLoading}
                                            onChange={e => handleAssignShift(emp._id, e.target.value)}
                                            style={{ padding: "7px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", color: "#1f2937", background: "#fff", outline: "none" }}>
                                            <option value="">No Shift</option>
                                            {shifts.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                        {assignFeedback === emp._id && (
                                            <span style={{ color: "#16a34a", display: "flex", alignItems: "center", animation: "fadeIn 0.3s" }}>
                                                <FiCheck size={16} />
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
                    onClick={() => setShowModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "560px",
                        boxShadow: "0 25px 50px rgba(0,0,0,0.15)", overflow: "hidden",
                        animation: "modalIn 0.2s ease-out", maxHeight: "90vh", overflowY: "auto"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
                            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1f2937" }}>{isEditing ? 'Edit Shift' : 'Create New Shift'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Shift Name *</label>
                                <input type="text" value={formData.name} required placeholder="e.g. General Shift"
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Start Time</label>
                                    <input type="time" value={formData.startTime} required
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>End Time</label>
                                    <input type="time" value={formData.endTime} required
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Work Hours</label>
                                    <input type="number" value={formData.workingHours} required
                                        onChange={e => setFormData({ ...formData, workingHours: parseInt(e.target.value) })}
                                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Grace (Min)</label>
                                    <input type="number" value={formData.graceMinutes} required
                                        onChange={e => setFormData({ ...formData, graceMinutes: parseInt(e.target.value) })}
                                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Max Late/Mo</label>
                                    <input type="number" value={formData.maxLatePerMonth} required
                                        onChange={e => setFormData({ ...formData, maxLatePerMonth: parseInt(e.target.value) })}
                                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                </div>
                            </div>
                            {/* Working Days */}
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Working Days</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    {DAYS_FULL.map((day, i) => {
                                        const sel = (formData.workingDays || []).includes(day);
                                        return (
                                            <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                                                width: "44px", height: "36px", borderRadius: "8px",
                                                border: sel ? "none" : "1px solid #e5e7eb",
                                                background: sel ? "#f97316" : "#fff", color: sel ? "#fff" : "#6b7280",
                                                fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "0.2s"
                                            }}>
                                                {DAYS_SHORT[i]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Night shift toggle */}
                            <div style={{ background: "#f9fafb", padding: "14px 18px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Night Shift (Cross-day)</span>
                                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0" }}>Enable if shift crosses midnight</p>
                                </div>
                                <div onClick={() => setFormData({ ...formData, isNightShift: !formData.isNightShift })}
                                    style={{ width: "44px", height: "24px", borderRadius: "12px", background: formData.isNightShift ? "#f97316" : "#d1d5db", cursor: "pointer", position: "relative", transition: "0.3s" }}>
                                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: formData.isNightShift ? "22px" : "2px", transition: "0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: "1px solid #f3f4f6" }}>
                                <button type="button" onClick={() => setShowModal(false)}
                                    style={{ padding: "10px 24px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                                    Cancel
                                </button>
                                <button type="submit" style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#f97316", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 6px rgba(249,115,22,0.3)" }}>
                                    {isEditing ? 'Save Changes' : 'Create Shift'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } } @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
                </div>
            )}
        </div>
    );
}
