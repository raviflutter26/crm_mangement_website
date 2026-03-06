"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiUsers, FiUserCheck, FiCalendar, FiTrendingUp, FiArrowUp, FiArrowDown, FiClock, FiActivity, FiChevronRight, FiCheckCircle, FiLogIn, FiLogOut } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dialogState, setDialogState] = useState({ show: false, message: "" });
    const [actionLoading, setActionLoading] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionForm, setPermissionForm] = useState({ date: new Date().toISOString().split('T')[0], hoursRequest: 1, reason: "" });
    const [liveHours, setLiveHours] = useState<number>(0);

    const fetchDashboard = async () => {
        try {
            let token = localStorage.getItem('ravi_zoho_token');
            if (!token) { window.location.reload(); return; }

            const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD);
            setData(res.data.data);
        } catch (err) {
            console.error("Failed to fetch dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPermission = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.PERMISSIONS_REQUEST, permissionForm);
            setDialogState({ show: true, message: res.data.message || "Permission requested successfully!" });
            setShowPermissionModal(false);
            setPermissionForm({ date: new Date().toISOString().split('T')[0], hoursRequest: 1, reason: "" });
            fetchDashboard();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to request permission");
        } finally {
            setActionLoading(false);
            setTimeout(() => setDialogState({ show: false, message: "" }), 3000);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    useEffect(() => {
        if (data?.isEmployee && data.attendanceToday) {
            const sessions = data.attendanceToday.sessions || [];
            const totalHoursLogged = data.attendanceToday.totalHours || 0;
            
            // Check if there is an active session
            const activeSession = sessions.length > 0 && !sessions[sessions.length - 1].checkOut 
                ? sessions[sessions.length - 1] 
                : null;

            if (!activeSession) {
                // Not currently working, just show logged hours
                setLiveHours(totalHoursLogged);
            } else {
                // Currently working, calculate logged + live
                const calcLive = () => {
                    const diffMs = new Date().getTime() - new Date(activeSession.checkIn).getTime();
                    const currentSessionLiveHours = Math.max(0, diffMs / (1000 * 60 * 60));
                    
                    // Add previously checked-out session hours
                    let priorHours = 0;
                    sessions.forEach((s: any) => {
                        if (s.checkOut) priorHours += (s.hours || 0);
                    });

                    setLiveHours(priorHours + currentSessionLiveHours);
                };
                calcLive();
                const interval = setInterval(calcLive, 60000); // update every minute
                return () => clearInterval(interval);
            }
        }
    }, [data]);

    const formatHours = (h: number) => {
        const hrs = Math.floor(h);
        const mins = Math.round((h - hrs) * 60);
        return `${hrs}h ${mins}m`;
    };

    const handleCheckIn = async () => {
        if (!data?.employeeId) return;
        setActionLoading(true);
        try {
            // Get location if possible, otherwise send null
            let lat = null, lng = null;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch (e) {
                    console.log("Location access denied or failed.");
                }
            }

            const res = await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_IN, {
                employeeId: data.employeeId,
                latitude: lat,
                longitude: lng,
            });
            setDialogState({ show: true, message: res.data.message || "Checked in successfully!" });
            fetchDashboard(); // Refresh data
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to check in");
        } finally {
            setActionLoading(false);
            setTimeout(() => setDialogState({ show: false, message: "" }), 3000);
        }
    };

    const handleCheckOut = async () => {
        if (!data?.employeeId) return;
        setActionLoading(true);
        try {
            // Get location if possible, otherwise send null
            let lat = null, lng = null;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch (e) {
                    console.log("Location access denied or failed.");
                }
            }

            const res = await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_OUT, {
                employeeId: data.employeeId,
                latitude: lat,
                longitude: lng,
            });
            setDialogState({ show: true, message: "Checked out successfully!" });
            fetchDashboard(); // Refresh data
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to check out");
        } finally {
            setActionLoading(false);
            setTimeout(() => setDialogState({ show: false, message: "" }), 3000);
        }
    };

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center" }}>Loading Dashboard...</div>;
    }

    if (!data) {
        return <div style={{ padding: "40px", textAlign: "center", color: "red" }}>Failed to load dashboard data.</div>;
    }

    if (data.isEmployee) {
        const sessions = data.attendanceToday?.sessions || [];
        const checkedInTotal = data.attendanceToday?.checkIn; // overall presence
        const isWorking = sessions.length > 0 && !sessions[sessions.length - 1].checkOut;
        const reachedMaxSessions = sessions.length >= 5;
        const reachedDailyLimit = !isWorking && reachedMaxSessions;

        return (
            <>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Dashboard</h1>
                        <p className="page-subtitle">Welcome back, {data.employeeDetails?.firstName}! Here&apos;s your daily overview.</p>
                    </div>
                </div>

                <div className="grid-2" style={{ marginBottom: "24px" }}>
                    {/* Attendance Card */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Today&apos;s Attendance <span style={{ fontSize: "12px", marginLeft: "10px", color: "var(--text-secondary)", fontWeight: "normal" }}>({sessions.length}/5 Sessions)</span></h3>
                            <span className={`badge ${isWorking ? 'active' : (reachedDailyLimit || (sessions.length > 0 && !isWorking) ? 'success' : 'warning')}`}>
                                {isWorking ? 'Working' : (sessions.length > 0 ? 'Checked Out' : 'Not Started')}
                            </span>
                        </div>
                        <div className="card-body" style={{ textAlign: "center", padding: "30px 20px" }}>
                            <div style={{ marginBottom: "30px" }}>
                                <div style={{ fontSize: "32px", fontWeight: "700", color: "var(--text-primary)" }}>
                                    {isWorking ? new Date(sessions[sessions.length - 1].checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                                </div>
                                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px" }}>
                                    {isWorking ? 'Current Session Start' : (sessions.length > 0 ? `Last session ended at ${new Date(sessions[sessions.length - 1].checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'You haven\'t checked in yet today')}
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                                {!isWorking ? (
                                    !reachedMaxSessions ? (
                                        <button 
                                            className="btn btn-primary" 
                                            style={{ width: "160px", justifyContent: "center", padding: "12px" }}
                                            onClick={handleCheckIn}
                                            disabled={actionLoading}
                                        >
                                            <FiLogIn size={18} /> {actionLoading ? 'Processing...' : (sessions.length > 0 ? 'Resume Shift' : 'Check In')}
                                        </button>
                                    ) : (
                                        <button 
                                            className="btn btn-secondary" 
                                            style={{ width: "160px", justifyContent: "center", padding: "12px" }}
                                            disabled
                                        >
                                            <FiCheckCircle size={18} /> Shift Completed
                                        </button>
                                    )
                                ) : (
                                    <button 
                                        className="btn btn-warning" 
                                        style={{ width: "160px", justifyContent: "center", padding: "12px", background: "#f59e0b", color: "white", border: "none" }}
                                        onClick={handleCheckOut}
                                        disabled={actionLoading}
                                    >
                                        <FiLogOut size={18} /> {actionLoading ? 'Processing...' : 'Check Out'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {checkedInTotal && (
                            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", borderTop: "1px solid var(--border-color)", background: "rgba(0, 0, 0, 0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}><FiClock /> Logged Hours</span>
                                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatHours(liveHours)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-color)", paddingTop: "12px" }}>
                                    <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}><FiActivity /> Pending (out of 9h)</span>
                                    <span style={{ fontWeight: 600, color: liveHours >= 9 ? '#10b981' : 'var(--text-primary)' }}>
                                        {liveHours >= 9 ? "Completed" : formatHours(9 - liveHours)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
                            <button className="btn btn-secondary" onClick={() => setShowPermissionModal(true)} style={{ width: "100%", justifyContent: "center" }}>
                                Request Late/Early Permission
                            </button>
                        </div>
                    </div>

                    {/* Leave Summary */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Leave Details</h3>
                            <button className="btn btn-secondary btn-sm">Apply Leave <FiChevronRight size={14} /></button>
                        </div>
                        <div className="card-body">
                            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                                <div style={{ flex: 1, padding: "15px", background: "var(--bg-card)", borderRadius: "10px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                                    <div style={{ fontSize: "20px", fontWeight: "600", color: "#3b82f6" }}>{data.leaveBalance?.casual || 0}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Casual</div>
                                </div>
                                <div style={{ flex: 1, padding: "15px", background: "var(--bg-card)", borderRadius: "10px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                                    <div style={{ fontSize: "20px", fontWeight: "600", color: "#10b981" }}>{data.leaveBalance?.sick || 0}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Sick</div>
                                </div>
                                <div style={{ flex: 1, padding: "15px", background: "var(--bg-card)", borderRadius: "10px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                                    <div style={{ fontSize: "20px", fontWeight: "600", color: "#8b5cf6" }}>{data.leaveBalance?.earned || 0}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Earned</div>
                                </div>
                            </div>
                            
                            <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>Recent Requests</h4>
                            {data.recentLeaves && data.recentLeaves.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {data.recentLeaves.slice(0, 3).map((leave: any, i: number) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-card)", borderRadius: "8px" }}>
                                            <div>
                                                <div style={{ fontSize: "14px", fontWeight: 500 }}>{leave.leaveType}</div>
                                                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                                                    {new Date(leave.startDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <span className={`badge ${leave.status.toLowerCase()}`}>{leave.status}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "14px" }}>
                                    No recent leave requests
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Success Toast */}
                {dialogState.show && (
                    <div style={{
                        position: "fixed", bottom: "20px", right: "20px",
                        background: "rgba(34, 197, 94, 0.9)", color: "white",
                        padding: "12px 20px", borderRadius: "8px", zIndex: 3000,
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px",
                        fontWeight: 600, animation: "fadeIn 0.3s ease-out"
                    }}>
                        <FiCheckCircle size={20} /> {dialogState.message}
                    </div>
                )}

                {/* Permission Modal */}
                {showPermissionModal && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
                    }}>
                        <div className="card" style={{ width: "400px", padding: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                <h3 className="card-title" style={{ margin: 0 }}>Request Permission</h3>
                                <button onClick={() => setShowPermissionModal(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-secondary)" }}>&times;</button>
                            </div>
                            <form onSubmit={handleRequestPermission}>
                                <div className="form-group" style={{ marginBottom: "16px" }}>
                                    <label className="form-label" style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Date</label>
                                    <input type="date" required className="form-control" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                                        value={permissionForm.date} onChange={e => setPermissionForm({...permissionForm, date: e.target.value})} />
                                </div>
                                <div className="form-group" style={{ marginBottom: "16px" }}>
                                    <label className="form-label" style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Hours Needed (Max 2)</label>
                                    <select className="form-control" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                                        value={permissionForm.hoursRequest} onChange={e => setPermissionForm({...permissionForm, hoursRequest: Number(e.target.value)})}>
                                        <option value={1}>1 Hour</option>
                                        <option value={2}>2 Hours</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: "20px" }}>
                                    <label className="form-label" style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Reason</label>
                                    <textarea required rows={3} className="form-control" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                                        value={permissionForm.reason} onChange={e => setPermissionForm({...permissionForm, reason: e.target.value})} placeholder="Why do you need permission?"></textarea>
                                </div>
                                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowPermissionModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                        {actionLoading ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        );
    }

    const stats = [
        { label: "Total Employees", value: data.employees.total, icon: FiUsers, color: "blue", change: "Overall", up: true },
        { label: "Present Today", value: data.attendance.presentToday, icon: FiUserCheck, color: "green", change: `${data.attendance.attendanceRate}% Rate`, up: true },
        { label: "Pending Leaves", value: data.leaves.pending, icon: FiCalendar, color: "orange", change: "To Review", up: false },
        { label: "Attendance Rate", value: `${data.attendance.attendanceRate}%`, icon: FiTrendingUp, color: "purple", change: "Daily", up: true },
    ];

    const handleGenerateReport = () => {
        if (!data) return;

        const reportContent = `Ravi Zoho System Report
Date: ${new Date().toLocaleDateString()}

Total Employees: ${data.employees.total}
Present Today: ${data.attendance.presentToday}
Attendance Rate: ${data.attendance.attendanceRate}%
Pending Leaves: ${data.leaves.pending}

Department Breakdown:
${data.departmentDistribution.map((d: any) => `${d._id || 'Unassigned'}: ${d.count}`).join('\n')}
`;

        const encodedUri = encodeURI(`data:text/plain;charset=utf-8,${reportContent}`);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `HR_Report_${new Date().toISOString().split('T')[0]}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDialogState({ show: true, message: "Report generated successfully!" });
        setTimeout(() => setDialogState({ show: false, message: "" }), 3000);
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Welcome back, Ravi! Here&apos;s your HR overview.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary">
                        <FiClock /> Last 30 Days
                    </button>
                    <button className="btn btn-primary" onClick={handleGenerateReport}>
                        <FiActivity /> Generate Report
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className={`stat-card ${stat.color}`}>
                        <div className="stat-card-header">
                            <div className={`stat-card-icon ${stat.color}`}>
                                <stat.icon />
                            </div>
                            <span className={`stat-card-change ${stat.up ? "up" : "down"}`}>
                                {stat.up ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />} {stat.change}
                            </span>
                        </div>
                        <div className="stat-card-value">{stat.value}</div>
                        <div className="stat-card-label">{stat.label}</div>
                    </div>
                ))}
                </div>

            {/* Quick Success Toast */}
            {dialogState.show && (
                <div style={{
                    position: "fixed", bottom: "20px", right: "20px",
                    background: "rgba(34, 197, 94, 0.9)", color: "white",
                    padding: "12px 20px", borderRadius: "8px", zIndex: 3000,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px",
                    fontWeight: 600, animation: "fadeIn 0.3s ease-out"
                }}>
                    <FiCheckCircle size={20} /> {dialogState.message}
                </div>
            )}
        </>
    );
}
