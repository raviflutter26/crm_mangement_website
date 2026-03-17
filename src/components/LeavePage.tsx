"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiPlus, FiFilter, FiAlertCircle } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

export default function LeavePage() {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");
    const [userRole, setUserRole] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        employee: "",
        leaveType: "Casual Leave",
        startDate: "",
        endDate: "",
        reason: ""
    });
    const [dialogState, setDialogState] = useState<{ show: boolean, type: "success" | "error" | "", title: string, message: string }>({ show: false, type: "", title: "", message: "" });

    const getToken = async () => {
        let token = localStorage.getItem('ravi_zoho_token');
        if (!token) { window.location.reload(); throw new Error("No token"); }
        return token;
    };

    const fetchData = async () => {
        try {
            const token = await getToken();

            const [leavesRes, empRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.LEAVES).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.EMPLOYEES).catch(() => ({ data: { data: [] } }))
            ]);
            setLeaves(leavesRes.data?.data || []);
            setEmployees(empRes.data?.data || []);
            
            const user = JSON.parse(localStorage.getItem("ravi_zoho_user") || "{}");
            setUserRole(user.role || "employee");
            setCurrentUserId(user._id || user.id || "");
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleApplyLeaveSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const token = await getToken();
            const s = new Date(formData.startDate);
            const eDate = new Date(formData.endDate);
            const diffTime = Math.abs(eDate.getTime() - s.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const payload = {
                ...formData,
                totalDays: diffDays > 0 ? diffDays : 1
            };

            await axiosInstance.post(API_ENDPOINTS.LEAVES, payload);

            setShowModal(false);
            setFormData({ employee: "", leaveType: "Casual Leave", startDate: "", endDate: "", reason: "" });
            setDialogState({ show: true, type: "success", title: "Leave Applied", message: "Leave request submitted successfully." });
            fetchData();
        } catch (err: any) {
            console.error("Leave Apply Error", err);
            setDialogState({ show: true, type: "error", title: "Action Failed", message: err.response?.data?.message || err.message });
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const token = await getToken();
            await axiosInstance.put(`${API_ENDPOINTS.LEAVES}/${id}/status`, { status: newStatus });
            setDialogState({ show: true, type: "success", title: "Status Updated", message: `Leave has been ${newStatus.toLowerCase()} successfully.` });
            fetchData();
        } catch (err: any) {
            console.error("Update Status Error", err);
            setDialogState({ show: true, type: "error", title: "Update Failed", message: err.response?.data?.message || err.message });
        }
    };

    const isEmployeeRole = userRole.toLowerCase() === 'employee';

    const filteredLeaves = leaves.filter(l => {
        const empId = l.employee?._id || l.employee;
        const matchesUser = isEmployeeRole ? empId === currentUserId : true;
        const matchesStatus = filterStatus ? l.status === filterStatus : true;
        return matchesUser && matchesStatus;
    });

    const statsLeaves = leaves.filter(l => {
        const empId = l.employee?._id || l.employee;
        return isEmployeeRole ? empId === currentUserId : true;
    });

    const leaveStats = [
        { label: "Pending Requests", value: statsLeaves.filter(l => l.status === "Pending").length, icon: FiClock, color: "orange" },
        { label: "Approved Leaves", value: statsLeaves.filter(l => l.status === "Approved").length, icon: FiCheckCircle, color: "green" },
        { label: "Rejected Leaves", value: statsLeaves.filter(l => l.status === "Rejected").length, icon: FiXCircle, color: "red" },
        { label: "Total Leaves", value: statsLeaves.length, icon: FiCalendar, color: "blue" },
    ];

    if (loading || !userRole) {
        return <div style={{ padding: "40px", textAlign: "center" }}>Loading Leaves...</div>;
    }

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

            {/* Filter Section */}
            {showFilters && (
                <div className="card" style={{ padding: "15px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                        <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="">All Statuses</option>
                            <option value="Approved">Approved</option>
                            <option value="Pending">Pending</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setFilterStatus("")}>Clear Filter</button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
                {leaveStats.map((stat, i) => (
                    <div key={i} className={`stat-card ${stat.color}`}>
                        <div className="stat-card-header">
                            <div className={`stat-card-icon ${stat.color}`}><stat.icon /></div>
                        </div>
                        <div className="stat-card-value">{stat.value}</div>
                        <div className="stat-card-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Leave Requests Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Leave Requests</h3>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Leave Type</th>
                                <th>From Date</th>
                                <th>To Date</th>
                                <th>Days</th>
                                <th>Status</th>
                                {!isEmployeeRole && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaves.length > 0 ?
                                filteredLeaves.map((leave, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>
                                            {leave.employee?.firstName} {leave.employee?.lastName}
                                        </td>
                                        <td>{leave.leaveType}</td>
                                        <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                                        <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 600 }}>{leave.totalDays} Days</td>
                                        <td>
                                            <span className={`badge ${leave.status.toLowerCase()}`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        {!isEmployeeRole && (
                                            <td>
                                                {leave.status === "Pending" ? (
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(leave._id, "Approved")}>Approve</button>
                                                        <button className="btn btn-secondary btn-sm" style={{ borderColor: "var(--error)", color: "var(--error)" }} onClick={() => handleStatusUpdate(leave._id, "Rejected")}>Reject</button>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Processed</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                                            No leave records found.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Apply Leave Modal */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div className="card animate-in" style={{ width: "500px", padding: "25px" }}>
                        <h2 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ padding: "8px", background: "var(--primary)", color: "white", borderRadius: "8px", display: "flex" }}><FiPlus /></div>
                            Apply for Leave
                        </h2>

                        <form onSubmit={handleApplyLeaveSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {!isEmployeeRole ? (
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Employee</label>
                                    <select required name="employee" value={formData.employee} onChange={handleInputChange} className="form-input">
                                        <option value="">-- Choose Employee --</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <input type="hidden" name="employee" value={currentUserId} />
                            )}
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Leave Type</label>
                                <select required name="leaveType" value={formData.leaveType} onChange={handleInputChange} className="form-input">
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Earned Leave">Earned Leave</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", gap: "15px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Start Date</label>
                                    <input type="date" required name="startDate" value={formData.startDate} onChange={handleInputChange} className="form-input" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>End Date</label>
                                    <input type="date" required name="endDate" value={formData.endDate} onChange={handleInputChange} className="form-input" />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Reason</label>
                                <textarea required name="reason" value={formData.reason} onChange={handleInputChange} className="form-input" rows={3} placeholder="Briefly describe why you are requesting leave"></textarea>
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>Submit Application</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
