"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { 
    FiPlus, FiEdit2, FiTrash2, FiSave, FiX, 
    FiCalendar, FiAlertCircle, FiSettings, FiCheck, FiInfo 
} from "react-icons/fi";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

interface LeavePolicyPageProps {
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function LeavePolicyPage({ showNotify }: LeavePolicyPageProps) {
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [formData, setFormData] = useState<any>({
        leaveType: 'Casual Leave',
        leaveTypeLabel: '',
        daysPerYear: 12,
        accrualType: 'upfront',
        accrualAmount: 1,
        carryForwardDays: 0,
        encashable: false,
        requiresDocument: false,
        minDaysNotice: 1,
        maxConsecutiveDays: 5,
        applicableAfterDays: 30,
        genderSpecific: null,
    });

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/admin/config/leave-policy');
            setPolicies(res.data.data);
        } catch (err) {
            console.error("Failed to fetch policies", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPolicies(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/api/admin/config/leave-policy', formData);
            showNotify('success', `Leave policy for ${formData.leaveTypeLabel} saved successfully.`);
            setShowModal(false);
            fetchPolicies();
        } catch (err: any) {
            showNotify('failure', err.response?.data?.message || "Failed to save policy.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this leave type?")) return;
        try {
            await axiosInstance.delete(`/api/admin/config/leave-policy/${id}`);
            showNotify('success', "Leave policy deleted.");
            fetchPolicies();
        } catch (err: any) {
            showNotify('failure', "Failed to delete policy.");
        }
    };

    const openModal = (policy: any = null) => {
        if (policy) {
            setFormData(policy);
            setEditing(policy._id);
        } else {
            setFormData({
                leaveType: 'Casual Leave',
                leaveTypeLabel: '',
                daysPerYear: 12,
                accrualType: 'upfront',
                accrualAmount: 1,
                carryForwardDays: 0,
                encashable: false,
                requiresDocument: false,
                minDaysNotice: 1,
                maxConsecutiveDays: 5,
                applicableAfterDays: 30,
                genderSpecific: null,
            });
            setEditing(null);
        }
        setShowModal(true);
    };

    if (loading) return <LoadingSkeleton />;

    return (
        <div style={{ paddingBottom: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "26px", fontWeight: 900, margin: 0 }}>Leave Policies</h1>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "5px 0 0" }}>Manage different types of leaves and their accrual rules</p>
                </div>
                <button
                    onClick={() => openModal()}
                    style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 22px", borderRadius: "12px",
                        background: "var(--gradient-primary)", color: "white",
                        border: "none", cursor: "pointer",
                        fontSize: "14px", fontWeight: 700,
                        boxShadow: "0 4px 14px rgba(255,122,0,0.35)",
                    }}
                >
                    <FiPlus /> Add Leave Type
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
                {policies.length > 0 ? policies.map((policy) => (
                    <div key={policy._id} style={{ 
                        background: "var(--bg-secondary)", 
                        border: "1px solid var(--border)", 
                        borderRadius: "20px", 
                        padding: "24px",
                        position: "relative"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                            <div style={{ 
                                padding: "6px 12px", borderRadius: "10px", 
                                background: "rgba(255,122,0,0.1)", color: "var(--primary)",
                                fontSize: "12px", fontWeight: 800, textTransform: "uppercase"
                            }}>
                                {policy.leaveType}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={() => openModal(policy)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><FiEdit2 size={16} /></button>
                                <button onClick={() => handleDelete(policy._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><FiTrash2 size={16} /></button>
                            </div>
                        </div>
                        
                        <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px" }}>{policy.leaveTypeLabel}</h3>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div style={{ padding: "12px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Annual Limit</div>
                                <div style={{ fontSize: "16px", fontWeight: 800 }}>{policy.daysPerYear} Days</div>
                            </div>
                            <div style={{ padding: "12px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Accrual</div>
                                <div style={{ fontSize: "16px", fontWeight: 800, textTransform: "capitalize" }}>{policy.accrualType}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                                <FiCalendar size={14} color="var(--primary)" /> <span>Notice period: <strong>{policy.minDaysNotice} days</strong></span>
                            </div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <FiInfo size={14} color="var(--primary)" /> <span>Max consecutive: <strong>{policy.maxConsecutiveDays} days</strong></span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px" }}>
                        <FiSettings size={60} color="var(--border)" style={{ marginBottom: "20px" }} />
                        <h3>No leave policies defined</h3>
                        <p style={{ color: "var(--text-muted)" }}>Get started by adding your first leave type like "Casual Leave" or "Sick Leave"</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div style={{ 
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
                    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 
                }}>
                    <div className="card animate-in" style={{ width: "600px", padding: "30px", maxHeight: "90vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 900 }}>{editing ? 'Edit Leave Type' : 'New Leave Type'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><FiX size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div style={{ gridColumn: "1 / span 2" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Internal Type</label>
                                <select 
                                    value={formData.leaveType} 
                                    onChange={e => setFormData({...formData, leaveType: e.target.value})}
                                    style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-secondary)", fontWeight: 600 }}
                                >
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Earned Leave">Earned Leave</option>
                                    <option value="Maternity Leave">Maternity Leave</option>
                                    <option value="Compensatory Off">Compensatory Off</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: "1 / span 2" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Display Label</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. Annual Vacation"
                                    value={formData.leaveTypeLabel} 
                                    onChange={e => setFormData({...formData, leaveTypeLabel: e.target.value})}
                                    style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-secondary)", fontWeight: 600 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Total Days / Year</label>
                                <input 
                                    type="number" 
                                    value={formData.daysPerYear} 
                                    onChange={e => setFormData({...formData, daysPerYear: Number(e.target.value)})}
                                    style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-secondary)", fontWeight: 600 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Accrual Cycle</label>
                                <select 
                                    value={formData.accrualType} 
                                    onChange={e => setFormData({...formData, accrualType: e.target.value})}
                                    style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-secondary)", fontWeight: 600 }}
                                >
                                    <option value="upfront">Upfront (Year Start)</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Min Notice (Days)</label>
                                <input 
                                    type="number" 
                                    value={formData.minDaysNotice} 
                                    onChange={e => setFormData({...formData, minDaysNotice: Number(e.target.value)})}
                                    style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-secondary)", fontWeight: 600 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Max Consecutive</label>
                                <input 
                                    type="number" 
                                    value={formData.maxConsecutiveDays} 
                                    onChange={e => setFormData({...formData, maxConsecutiveDays: Number(e.target.value)})}
                                    style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-secondary)", fontWeight: 600 }}
                                />
                            </div>

                            <div style={{ gridColumn: "1 / span 2", display: "flex", gap: "20px", marginTop: "10px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                    <input type="checkbox" checked={formData.encashable} onChange={e => setFormData({...formData, encashable: e.target.checked})} />
                                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Encashable</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                    <input type="checkbox" checked={formData.requiresDocument} onChange={e => setFormData({...formData, requiresDocument: e.target.checked})} />
                                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Requires Document</span>
                                </label>
                            </div>

                            <div style={{ gridColumn: "1 / span 2", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: "12px 30px" }}><FiSave /> Save Policy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
