"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiPlus, FiFilter, FiAlertCircle } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

interface LeavePageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function LeavePage({ showNotify }: LeavePageProps) {
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [userRole, setUserRole] = useState("employee");
    const [currentUserId, setCurrentUserId] = useState("");
    
    // UI Local State
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");
    const [showModal, setShowModal] = useState(false);
    
    const [formData, setFormData] = useState({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: ""
    });

    const [dialogState, setDialogState] = useState({
        show: false,
        type: "success",
        title: "",
        message: ""
    });

    const [balances, setBalances] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ pending: 0, approved: 0 });

    const fetchData = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem("ravi_zoho_user") || "{}");
            const role = user.role || "employee";
            setUserRole(role);
            setCurrentUserId(user._id || user.id || "");

            // Parallel fetches
            const [leavesRes, empRes, balanceRes, policyRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.LEAVES),
                role !== 'employee' ? axiosInstance.get(API_ENDPOINTS.EMPLOYEES) : Promise.resolve({ data: { data: [] } }),
                axiosInstance.get('/api/leaves/balances'),
                axiosInstance.get('/api/admin/config/leave-policy')
            ]);

            setLeaves(leavesRes.data?.data || []);
            setEmployees(empRes.data?.data || []);
            setBalances(balanceRes.data?.data || []);
            setPolicies(policyRes.data?.data || []);
            
            setStats({
                pending: leavesRes.data?.data.filter((l: any) => l.status === 'Pending').length,
                approved: leavesRes.data?.data.filter((l: any) => l.status === 'Approved').length,
            });
        } catch (err) {
            console.error("Failed to fetch leave data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApplyLeaveSubmit = async (e: any) => {
        e.preventDefault();
        try {
            await axiosInstance.post(API_ENDPOINTS.LEAVES, formData);
            setShowModal(false);
            setDialogState({ show: true, type: "success", title: "Leave Applied", message: "Leave request submitted successfully." });
            fetchData();
        } catch (err: any) {
            setDialogState({ show: true, type: "error", title: "Action Failed", message: err.response?.data?.message || err.message });
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await axiosInstance.put(`${API_ENDPOINTS.LEAVES}/${id}/status`, { status: newStatus });
            setDialogState({ show: true, type: "success", title: "Status Updated", message: `Leave has been ${newStatus.toLowerCase()} successfully.` });
            fetchData();
        } catch (err: any) {
            setDialogState({ show: true, type: "error", title: "Update Failed", message: err.response?.data?.message || err.message });
        }
    };

    const isEmployeeRole = userRole.toLowerCase() === 'employee';

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Leave Management</h1>
                    <p className="page-subtitle">Track and manage employee time off</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}><FiFilter /> Filter</button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> Apply Leave</button>
                </div>
            </div>

            {/* Balances Section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                {balances.length > 0 ? balances.map((b, i) => (
                    <div key={i} style={{ 
                        background: "var(--bg-secondary)", border: "1.5px solid var(--border)", 
                        borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px",
                        position: "relative", overflow: "hidden"
                    }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--primary)", letterSpacing: "1px" }}>{b.leaveType}</div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
                            <div style={{ fontSize: "32px", fontWeight: 900 }}>{b.available}</div>
                            <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>Available / {b.total}</div>
                        </div>
                        <div style={{ height: "6px", background: "var(--bg-card)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ 
                                width: `${(b.available / b.total) * 100}%`, height: "100%", 
                                background: "var(--gradient-primary)", transition: "width 0.5s ease" 
                            }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
                            <span>Used: <strong>{b.used}</strong></span>
                            <span>Pending: <strong>{b.pending}</strong></span>
                        </div>
                    </div>
                )) : (
                    <div style={{ gridColumn: "1/-1", padding: "20px", borderRadius: "12px", background: "var(--bg-secondary)", textAlign: "center", color: "var(--text-muted)" }}>
                        Loading leave balances...
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header"><h3 className="card-title">Leave History & Requests</h3></div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Type</th>
                                <th>Duration</th>
                                <th>Days</th>
                                <th>Reason</th>
                                <th>Status</th>
                                {!isEmployeeRole && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.length > 0 ? (
                                leaves.filter(l => filterStatus ? l.status === filterStatus : true).map((leave, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{leave.employee?.firstName} {leave.employee?.lastName}</td>
                                        <td><span style={{ fontWeight: 600 }}>{leave.leaveType}</span></td>
                                        <td>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 700 }}>{leave.totalDays} Days</td>
                                        <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={leave.reason}>{leave.reason}</td>
                                        <td><span className={`badge ${leave.status.toLowerCase()}`}>{leave.status}</span></td>
                                        {!isEmployeeRole && (
                                            <td>
                                                {leave.status === "Pending" ? (
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(leave._id, "Approved")}>Approve</button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(leave._id, "Rejected")}>Reject</button>
                                                    </div>
                                                ) : <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Processed</span>}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={10} style={{ textAlign: "center", padding: "80px" }}><EmptyState title="No History" description="Leave records will appear here." icon={FiCalendar} /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Apply Modal */}
            {showModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "550px", padding: "30px" }}>
                        <h2 style={{ marginBottom: "24px" }}>Apply for Leave</h2>
                        <form onSubmit={handleApplyLeaveSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                                <div style={{ gridColumn: "1/-1" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Leave Category</label>
                                    <select required value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})} className="form-input" style={{ width: "100%" }}>
                                        {policies.map(p => (
                                            <option key={p._id} value={p.leaveType}>{p.leaveTypeLabel} ({p.leaveType})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Start Date</label>
                                    <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="form-input" style={{ width: "100%" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>End Date</label>
                                    <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="form-input" style={{ width: "100%" }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Reason for Leave</label>
                                <textarea required rows={3} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="form-input" style={{ width: "100%", resize: "none" }} />
                            </div>
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: "12px 30px" }}>Submit Application</button>
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
