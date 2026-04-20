"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiClock, FiCheckCircle, FiXCircle, FiFilter, FiAlertCircle, FiShield } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

interface PermissionsPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function PermissionsPage({ showNotify }: PermissionsPageProps) {
    const [quota, setQuota] = useState<any>({ remainingHours: 0, totalHours: 0, remainingTimes: 0, totalTimes: 0 });
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        fromTime: "10:00",
        toTime: "12:00",
        permissionType: "late_arrival",
        reason: ""
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem("ravi_zoho_user");
            let role = "employee";
            if (userStr) {
                const user = JSON.parse(userStr);
                role = user.role || "employee";
                setUserRole(role);
            }

            // Fetch Permissions
            let endpoint = API_ENDPOINTS.PERMISSIONS_MINE;
            if (role !== "employee" && activeTab === "team_requests") {
                endpoint = API_ENDPOINTS.PERMISSIONS_TEAM;
            }
            const res = await axiosInstance.get(endpoint);
            setPermissions(res.data?.data || []);

            // Fetch Quota
            if (activeTab === "my_requests") {
                const quotaRes = await axiosInstance.get(API_ENDPOINTS.PERMISSIONS_QUOTA);
                setQuota(quotaRes.data?.data || quota);
            }
        } catch (err) {
            console.error("Failed to fetch permissions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [activeTab]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.PERMISSIONS_REQUEST, formData);
            setDialogState({ show: true, type: "success", title: "Success", message: "Permission request submitted successfully." });
            setShowApplyModal(false);
            fetchData();
        } catch (err: any) {
            setDialogState({ show: true, type: "error", title: "Request Failed", message: err.response?.data?.message || "Something went wrong" });
        } finally {
            setFormLoading(false);
        }
    };

    const handleAction = async (id: string, action: "Approved" | "Rejected" | "Cancel") => {
        try {
            if (action === "Cancel") {
                await axiosInstance.patch(API_ENDPOINTS.PERMISSIONS_CANCEL(id));
                setDialogState({ show: true, type: "success", title: "Cancelled", message: "Permission request has been cancelled." });
            } else {
                // If the backend has a general patch endpoint or specific roles
                await axiosInstance.patch(API_ENDPOINTS.PERMISSIONS_APPROVE(id), { status: action });
                setDialogState({ show: true, type: "success", title: "Status Updated", message: `Permission has been ${action.toLowerCase()} successfully.` });
            }
            fetchData();
        } catch (err: any) {
            console.error(`${action} Error`, err);
            setDialogState({ show: true, type: "error", title: "Action Failed", message: err.response?.data?.message || err.message });
        }
    };

    const filteredPermissions = permissions.filter(p => filterStatus ? p.status === filterStatus : true);

    const stats = [
        { label: "Hrs Remaining", value: `${quota.remainingHours || 0} / ${quota.totalHours || 0}`, icon: FiClock, color: "green" },
        { label: "Times Remaining", value: `${quota.remainingTimes || 0} / ${quota.totalTimes || 0}`, icon: FiShield, color: "orange" },
        { label: "Pending", value: permissions.filter(p => p.status === "Pending").length, icon: FiAlertCircle, color: "blue" },
    ];

    if (loading && permissions.length === 0) return <div style={{ padding: "20px" }}><TableSkeleton rows={8} /></div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Permissions Management</h1>
                    <p className="page-subtitle">Track and manage short-leave permissions</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "180px", background: "var(--bg-secondary)" }}>
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
                        Apply Permission
                    </button>
                </div>
            </div>

            {/* Role-Based Tabs */}
            {userRole !== "employee" && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <button className={`btn ${activeTab === "my_requests" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("my_requests")}>My Requests</button>
                    <button className={`btn ${activeTab === "team_requests" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("team_requests")}>{userRole === "manager" ? "Team Requests" : "Company Requests"}</button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "30px" }}>
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

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{activeTab === "my_requests" ? "My Permissions" : "Team Permissions"}</h3>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                {activeTab === "team_requests" && <th>Employee</th>}
                                <th>Date & Type</th>
                                <th>Time Window</th>
                                <th>Duration</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPermissions.length > 0 ? (
                                filteredPermissions.map((perm, i) => (
                                    <tr key={i}>
                                        {activeTab === "team_requests" && (
                                            <td style={{ fontWeight: 600 }}>{perm.employee?.firstName} {perm.employee?.lastName}</td>
                                        )}
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{new Date(perm.date).toLocaleDateString()}</div>
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>{perm.permissionType?.replace('_', ' ')}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{perm.fromTime} – {perm.toTime}</div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{(perm.durationMinutes / 60).toFixed(1)} hrs</td>
                                        <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={perm.reason}>{perm.reason}</td>
                                        <td><span className={`badge ${perm.status.toLowerCase()}`}>{perm.status}</span></td>
                                        <td>
                                            {perm.status === "Pending" ? (
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    {activeTab === "team_requests" ? (
                                                        <>
                                                            <button className="btn btn-success btn-sm" onClick={() => handleAction(perm._id, "Approved")}>Approve</button>
                                                            <button className="btn btn-secondary btn-sm" style={{ borderColor: "var(--error)", color: "var(--error)" }} onClick={() => handleAction(perm._id, "Rejected")}>Reject</button>
                                                        </>
                                                    ) : (
                                                        <button className="btn btn-secondary btn-sm" style={{ borderColor: "var(--orange)", color: "var(--orange)" }} onClick={() => handleAction(perm._id, "Cancel")}>Cancel</button>
                                                    )}
                                                </div>
                                            ) : <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Processed</span>}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: "center", padding: "80px 40px" }}>
                                        <EmptyState title="No Records" description="No permission requests found for the selected criteria." icon={FiShield} />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "500px", padding: "30px" }}>
                        <h2 style={{ marginBottom: "20px" }}>Request Permission</h2>
                        <form onSubmit={handleApply}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "5px" }}>Date</label>
                                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="form-input" style={{ width: "100%" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "5px" }}>Type</label>
                                    <select value={formData.permissionType} onChange={e => setFormData({...formData, permissionType: e.target.value})} className="form-input" style={{ width: "100%" }}>
                                        <option value="late_arrival">Late Arrival</option>
                                        <option value="early_leave">Early Leave</option>
                                        <option value="mid_day">Mid-Day Break</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "5px" }}>From Time</label>
                                    <input type="time" required value={formData.fromTime} onChange={e => setFormData({...formData, fromTime: e.target.value})} className="form-input" style={{ width: "100%" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "5px" }}>To Time</label>
                                    <input type="time" required value={formData.toTime} onChange={e => setFormData({...formData, toTime: e.target.value})} className="form-input" style={{ width: "100%" }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "5px" }}>Reason</label>
                                <textarea required rows={3} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="form-input" style={{ width: "100%", resize: "none" }} placeholder="Briefly explain your request..." />
                            </div>
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? "Submitting..." : "Submit Request"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dialog */}
            {dialogState.show && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "400px", padding: "25px", textAlign: "center" }}>
                        <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: dialogState.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: dialogState.type === "success" ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px" }}>
                            {dialogState.type === "success" ? <FiCheckCircle size={30} /> : <FiAlertCircle size={30} />}
                        </div>
                        <h3 style={{ marginBottom: "10px" }}>{dialogState.title}</h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>{dialogState.message}</p>
                        <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setDialogState({...dialogState, show: false})}>OK</button>
                    </div>
                </div>
            )}
        </>
    );
}
