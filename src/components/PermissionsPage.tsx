"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiClock, FiCheckCircle, FiXCircle, FiFilter, FiAlertCircle, FiShield } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState("employee");
    const [activeTab, setActiveTab] = useState<"my_requests" | "team_requests">("my_requests");
    const [filterStatus, setFilterStatus] = useState("");

    const [dialogState, setDialogState] = useState<{ show: boolean, type: "success" | "error" | "", title: string, message: string }>({ show: false, type: "", title: "", message: "" });

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

            // Decide which endpoint based on role and tab
            let endpoint = API_ENDPOINTS.PERMISSIONS_MINE;
            if (role !== "employee" && activeTab === "team_requests") {
                endpoint = API_ENDPOINTS.PERMISSIONS_TEAM;
            }

            const res = await axiosInstance.get(endpoint).catch(() => ({ data: { data: [] } }));
            setPermissions(res.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch permissions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleAction = async (id: string, action: "Approved" | "Rejected" | "Cancel") => {
        try {
            if (action === "Cancel") {
                await axiosInstance.patch(API_ENDPOINTS.PERMISSIONS_CANCEL(id));
                setDialogState({ show: true, type: "success", title: "Cancelled", message: "Permission request has been cancelled." });
            } else {
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
        { label: "Pending", value: permissions.filter(p => p.status === "Pending").length, icon: FiClock, color: "orange" },
        { label: "Approved", value: permissions.filter(p => p.status === "Approved").length, icon: FiCheckCircle, color: "green" },
        { label: "Rejected/Cancelled", value: permissions.filter(p => ["Rejected", "Cancelled"].includes(p.status)).length, icon: FiXCircle, color: "red" },
    ];

    if (loading && permissions.length === 0) {
        return <div style={{ padding: "40px", textAlign: "center" }}>Loading Permissions...</div>;
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Permissions Management</h1>
                    <p className="page-subtitle">Track and manage short-leave permissions</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "200px" }}>
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Role-Based Tabs */}
            {userRole !== "employee" && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <button 
                        className={`btn ${activeTab === "my_requests" ? "btn-primary" : "btn-secondary"}`} 
                        onClick={() => setActiveTab("my_requests")}
                    >
                        My Requests
                    </button>
                    <button 
                        className={`btn ${activeTab === "team_requests" ? "btn-primary" : "btn-secondary"}`} 
                        onClick={() => setActiveTab("team_requests")}
                    >
                        {userRole === "manager" ? "Team Requests" : "Company Requests"}
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
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
                    <h3 className="card-title">
                        {activeTab === "my_requests" ? "My Permissions" : "Team Permissions"}
                    </h3>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                {activeTab === "team_requests" && <th>Employee</th>}
                                <th>Date</th>
                                <th>Requested Hours</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPermissions.length > 0 ? filteredPermissions.map((perm, i) => (
                                <tr key={i}>
                                    {activeTab === "team_requests" && (
                                        <td style={{ fontWeight: 600 }}>
                                            {perm.employee?.firstName} {perm.employee?.lastName}
                                        </td>
                                    )}
                                    <td>{new Date(perm.date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>{perm.hoursRequest} Hours</td>
                                    <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={perm.reason}>
                                        {perm.reason}
                                    </td>
                                    <td>
                                        <span className={`badge ${perm.status.toLowerCase()}`}>
                                            {perm.status}
                                        </span>
                                    </td>
                                    <td>
                                        {perm.status === "Pending" ? (
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                {activeTab === "team_requests" ? (
                                                    <>
                                                        <button className="btn btn-success btn-sm" onClick={() => handleAction(perm._id, "Approved")}>Approve</button>
                                                        <button className="btn btn-secondary btn-sm" style={{ borderColor: "var(--error)", color: "var(--error)" }} onClick={() => handleAction(perm._id, "Rejected")}>Reject</button>
                                                    </>
                                                ) : (
                                                    <button className="btn btn-secondary btn-sm" style={{ borderColor: "var(--orange)", color: "var(--orange)" }} onClick={() => handleAction(perm._id, "Cancel")}>Cancel Request</button>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Processed</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={activeTab === "team_requests" ? 6 : 5} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                                        No permission records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Success/Error Dialog */}
            {dialogState.show && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2000,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div className="card animate-in" style={{ width: "400px", padding: "25px", textAlign: "center" }}>
                        <div style={{
                            width: "60px", height: "60px", borderRadius: "30px",
                            background: dialogState.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: dialogState.type === "success" ? "var(--success)" : "var(--error)",
                            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
                        }}>
                            {dialogState.type === "success" ? <FiCheckCircle size={30} /> : <FiAlertCircle size={30} />}
                        </div>
                        <h2 style={{ marginBottom: "10px", fontSize: "18px" }}>{dialogState.title}</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "25px", lineHeight: "1.5" }}>
                            {dialogState.message}
                        </p>
                        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setDialogState({ ...dialogState, show: false })}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
