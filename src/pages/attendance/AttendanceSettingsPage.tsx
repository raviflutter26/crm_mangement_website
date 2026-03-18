"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiClock, FiAlertCircle, FiShield, FiSave, FiInfo } from "react-icons/fi";

export default function AttendanceSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [policy, setPolicy] = useState({
        startTime: "09:00",
        endTime: "18:00",
        workingHours: 9,
        graceMinutes: 30,
        latePolicyEnabled: true,
        maxLateDaysPerMonth: 3,
        lateMarkType: "half_day",
        permissionEnabled: true,
        maxPermissionCount: 4,
        maxPermissionHours: 4
    });
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        fetchPolicy();
    }, []);

    const fetchPolicy = async () => {
        try {
            const res = await axiosInstance.get("/api/settings/attendance");
            if (res.data.success) {
                setPolicy(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            const res = await axiosInstance.post("/api/settings/attendance", policy);
            if (res.data.success) {
                setMessage({ type: "success", text: "Master configuration updated successfully!" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Failed to update configuration." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading policy...</div>;

    return (
        <div className="animate-in" style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
            <div className="page-header" style={{ marginBottom: "30px" }}>
                <h1 className="page-title">Attendance Policy Engine</h1>
                <p className="page-subtitle">Configure enterprise-level attendance rules and automated status logic.</p>
            </div>

            {message.text && (
                <div style={{
                    padding: "15px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    background: message.type === "success" ? "#ecfdf5" : "#fef2f2",
                    color: message.type === "success" ? "#059669" : "#dc2626",
                    border: `1px solid ${message.type === "success" ? "#10b981" : "#f87171"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                }}>
                    {message.type === "success" ? <FiShield /> : <FiAlertCircle />}
                    {message.text}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                {/* Office Timings */}
                <div className="card" style={{ padding: "25px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "var(--primary)" }}>
                        <FiClock size={20} />
                        <h3 style={{ margin: 0 }}>Office Timings</h3>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div className="form-group">
                            <label>Office Start Time</label>
                            <input 
                                type="time" 
                                className="form-control" 
                                value={policy.startTime}
                                onChange={(e) => setPolicy({...policy, startTime: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Office End Time</label>
                            <input 
                                type="time" 
                                className="form-control" 
                                value={policy.endTime}
                                onChange={(e) => setPolicy({...policy, endTime: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Total Required Working Hours</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                value={policy.workingHours}
                                onChange={(e) => setPolicy({...policy, workingHours: parseFloat(e.target.value)})}
                            />
                            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "5px" }}>
                                Minimum hours required for "Present" status.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Late Policy */}
                <div className="card" style={{ padding: "25px", opacity: policy.latePolicyEnabled ? 1 : 0.7 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)" }}>
                            <FiAlertCircle size={20} />
                            <h3 style={{ margin: 0 }}>Late Check-in Policy</h3>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={policy.latePolicyEnabled}
                                onChange={(e) => setPolicy({...policy, latePolicyEnabled: e.target.checked})}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px", pointerEvents: policy.latePolicyEnabled ? "auto" : "none" }}>
                        <div className="form-group">
                            <label>Grace Time (Minutes)</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                value={policy.graceMinutes}
                                onChange={(e) => setPolicy({...policy, graceMinutes: parseInt(e.target.value)})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Allowed Late Days / Month</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                value={policy.maxLateDaysPerMonth}
                                onChange={(e) => setPolicy({...policy, maxLateDaysPerMonth: parseInt(e.target.value)})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Penalty Action if Exceeded</label>
                            <select 
                                className="form-control"
                                value={policy.lateMarkType}
                                onChange={(e) => setPolicy({...policy, lateMarkType: e.target.value})}
                            >
                                <option value="half_day">Convert to Half Day</option>
                                <option value="warning">Warning Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Permission Policy */}
                <div className="card" style={{ padding: "25px", opacity: policy.permissionEnabled ? 1 : 0.7 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)" }}>
                            <FiInfo size={20} />
                            <h3 style={{ margin: 0 }}>Permission Policy</h3>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={policy.permissionEnabled}
                                onChange={(e) => setPolicy({...policy, permissionEnabled: e.target.checked})}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px", pointerEvents: policy.permissionEnabled ? "auto" : "none" }}>
                        <div className="form-group">
                            <label>Max Permissions / Month</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                value={policy.maxPermissionCount}
                                onChange={(e) => setPolicy({...policy, maxPermissionCount: parseInt(e.target.value)})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Max Permission Hours / Month</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                value={policy.maxPermissionHours}
                                onChange={(e) => setPolicy({...policy, maxPermissionHours: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>

                {/* Summary / Logic Preview */}
                <div className="card" style={{ padding: "25px", background: "var(--primary-bg-light)", border: "1px dashed var(--primary)" }}>
                    <h3 style={{ marginBottom: "15px" }}>Policy Logic Summary</h3>
                    <ul style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-primary)" }}>
                        {policy.latePolicyEnabled ? (
                            <>
                                <li>Employees checking in after <strong>{policy.startTime.split(':').map((v,i)=> i===1? (parseInt(v)+policy.graceMinutes).toString().padStart(2,'0') : v).join(':')}</strong> will be marked as <strong>Late</strong>.</li>
                                <li>After <strong>{policy.maxLateDaysPerMonth}</strong> late days, further late check-ins result in <strong>{policy.lateMarkType.replace('_', ' ')}</strong>.</li>
                            </>
                        ) : (
                            <li>Late check-in policy is currently <strong>Disabled</strong>.</li>
                        )}
                        <li>Minimum <strong>{policy.workingHours} hours</strong> are required for a "Present" status.</li>
                        {policy.permissionEnabled ? (
                            <li>Permissions deduct from the required working hours for that day.</li>
                        ) : (
                            <li>Permission requests are currently <strong>Disabled</strong>.</li>
                        )}
                    </ul>
                </div>
            </div>

            <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end" }}>
                <button 
                    className="btn btn-primary" 
                    onClick={handleSave} 
                    disabled={saving}
                    style={{ padding: "12px 30px", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    <FiSave /> {saving ? "Saving..." : "Save Policy Configuration"}
                </button>
            </div>
        </div>
    );
}
