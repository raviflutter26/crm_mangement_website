"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiUserCheck, FiUserX, FiClock, FiCalendar, FiDownload, FiFilter,
    FiMapPin, FiActivity, FiAlertTriangle, FiCheckCircle, FiMonitor,
    FiSmartphone, FiWifi, FiCoffee, FiHome
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

const STATUS_COLORS: any = {
    Present: "active", Absent: "inactive", "Half Day": "pending",
    "On Leave": "leave", Holiday: "processing", Weekend: "processing", WFH: "active",
};

const SOURCE_ICONS: any = {
    biometric: FiActivity, manual: FiUserCheck, gps: FiMapPin,
    web: FiMonitor, mobile: FiSmartphone, system: FiWifi,
};

export default function AttendancePage() {
    const [summary, setSummary] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [checkedIn, setCheckedIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [toast, setToast] = useState("");
    const [activeView, setActiveView] = useState<"today" | "records" | "report">("today");
    const [filterDate, setFilterDate] = useState("");
    const [monthlyReport, setMonthlyReport] = useState<any[]>([]);
    const [showRegularizeModal, setShowRegularizeModal] = useState(false);
    const [regularizeData, setRegularizeData] = useState<any>({});

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [summaryRes, recordsRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.ATTENDANCE_TODAY_SUMMARY),
                axiosInstance.get(API_ENDPOINTS.ATTENDANCE),
            ]);
            setSummary(summaryRes.data.data);
            const recs = recordsRes.data.data || [];
            setRecords(recs);

            // Check if current user already checked in
            const user = JSON.parse(localStorage.getItem("ravi_zoho_user") || "{}");
            const todayRec = recs.find((r: any) => {
                const d = new Date(r.date);
                const today = new Date();
                return d.toDateString() === today.toDateString() &&
                    (r.employee?.email === user.email || r.employee?._id === user._id);
            });
            if (todayRec?.checkIn) {
                setCheckedIn(true);
                setCheckInTime(new Date(todayRec.checkIn));
            }
        } catch (err) {
            console.error("Failed to fetch attendance data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const handleCheckIn = async () => {
        try {
            let lat = null, lng = null;
            // Try to get GPS
            if (navigator.geolocation) {
                try {
                    const pos: any = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch (e) { /* GPS not available */ }
            }

            const user = JSON.parse(localStorage.getItem("ravi_zoho_user") || "{}");
            await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_IN, {
                employeeId: user._id || user.id,
                source: "web",
                latitude: lat,
                longitude: lng,
            });
            setCheckedIn(true);
            setCheckInTime(new Date());
            showToast("Checked in successfully! ✅");
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Check-in failed");
        }
    };

    const handleCheckOut = async () => {
        try {
            let lat = null, lng = null;
            if (navigator.geolocation) {
                try {
                    const pos: any = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch (e) { /* GPS not available */ }
            }

            const user = JSON.parse(localStorage.getItem("ravi_zoho_user") || "{}");
            await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_OUT, {
                employeeId: user._id || user.id,
                latitude: lat,
                longitude: lng,
            });
            showToast("Checked out successfully! 👋");
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Check-out failed");
        }
    };

    const fetchMonthlyReport = async () => {
        try {
            const now = new Date();
            const res = await axiosInstance.get(`${API_ENDPOINTS.ATTENDANCE_MONTHLY_REPORT}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
            setMonthlyReport(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { if (activeView === "report") fetchMonthlyReport(); }, [activeView]);

    const handleRegularize = async (e: any) => {
        e.preventDefault();
        try {
            await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_REGULARIZE, regularizeData);
            showToast("Regularization request submitted!");
            setShowRegularizeModal(false);
            fetchData();
        } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
    };

    const formatTime = (date: Date) => date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    const formatDate = (date: Date) => date.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const elapsed = checkInTime ? Math.floor((currentTime.getTime() - checkInTime.getTime()) / 1000) : 0;
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    let userRole = "employee";
    try {
        const user = JSON.parse(localStorage.getItem("ravi_zoho_user") || "{}");
        userRole = user.role || "employee";
    } catch(e) {}

    const todayStats = [
        { label: "Present", value: summary?.present || 0, icon: FiUserCheck, color: "green" },
        { label: "Absent", value: summary?.absent || 0, icon: FiUserX, color: "orange" },
        { label: "On Leave", value: summary?.onLeave || 0, icon: FiCalendar, color: "purple" },
        { label: "WFH", value: summary?.wfh || 0, icon: FiHome, color: "blue" },
        { label: "Late", value: summary?.late || 0, icon: FiAlertTriangle, color: "orange" },
        { label: "Attendance %", value: `${summary?.attendancePercentage || 0}%`, icon: FiActivity, color: "green" },
    ];

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Attendance...</div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">{formatDate(currentTime)}</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary"><FiDownload /> Export</button>
                </div>
            </div>

            {/* Live Clock + Check-in Card */}
            <div className="card" style={{ marginBottom: "20px", overflow: "hidden" }}>
                <div style={{ padding: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, rgba(26,115,232,0.08), rgba(124,58,237,0.08))" }}>
                    <div>
                        <div style={{ fontSize: "48px", fontWeight: 800, fontFamily: "monospace", color: "var(--primary)", letterSpacing: "2px" }}>
                            {formatTime(currentTime)}
                        </div>
                        <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                            {formatDate(currentTime)}
                        </div>
                        {checkedIn && (
                            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34A853", animation: "pulse 2s infinite" }} />
                                <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                                    Working since {checkInTime?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                                </span>
                                <span style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--primary)" }}>
                                    {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                                </span>
                            </div>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        {!checkedIn ? (
                            <button className="btn btn-primary" onClick={handleCheckIn}
                                style={{ padding: "16px 32px", fontSize: "16px", fontWeight: 700, borderRadius: "16px" }}>
                                <FiUserCheck size={20} /> Clock In
                            </button>
                        ) : (
                            <button className="btn btn-secondary" onClick={handleCheckOut}
                                style={{ padding: "16px 32px", fontSize: "16px", fontWeight: 700, borderRadius: "16px", color: "var(--error)" }}>
                                <FiUserX size={20} /> Clock Out
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats (Hidden for employees) */}
            {userRole !== "employee" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "20px" }}>
                    {todayStats.map((stat, i) => (
                        <div key={i} className={`stat-card ${stat.color}`}>
                            <div className="stat-card-header"><div className={`stat-card-icon ${stat.color}`}><stat.icon /></div></div>
                            <div className="stat-card-value">{stat.value}</div>
                            <div className="stat-card-label">{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* View Tabs */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <button className={`btn ${activeView === "today" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveView("today")}>
                    <FiClock /> Today&apos;s Attendance
                </button>
                <button className={`btn ${activeView === "records" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveView("records")}>
                    <FiCalendar /> All Records
                </button>
                <button className={`btn ${activeView === "report" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveView("report")}>
                    <FiActivity /> Monthly Report
                </button>
            </div>

            {/* Attendance Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        {activeView === "today" ? "Today's Attendance" : activeView === "records" ? "Attendance Records" : "Monthly Report"}
                    </h3>
                    {activeView === "records" && (
                        <input type="date" className="form-input" style={{ width: "auto" }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                    )}
                </div>
                <div className="table-wrapper">
                    {activeView === "report" ? (
                        <table>
                            <thead><tr><th>Employee</th><th>ID</th><th>Present</th><th>Absent</th><th>Half Day</th><th>WFH</th><th>Late</th><th>Total Hours</th><th>OT</th></tr></thead>
                            <tbody>
                                {monthlyReport.map((r: any, i: number) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{r._id?.firstName} {r._id?.lastName}</td>
                                        <td style={{ fontFamily: "monospace" }}>{r._id?.employeeId}</td>
                                        <td style={{ color: "var(--secondary)", fontWeight: 700 }}>{r.totalPresent}</td>
                                        <td style={{ color: "var(--error)" }}>{r.totalAbsent}</td>
                                        <td>{r.totalHalfDay}</td>
                                        <td>{r.totalWFH}</td>
                                        <td style={{ color: r.totalLate > 3 ? "var(--error)" : "var(--text-secondary)" }}>{r.totalLate}</td>
                                        <td style={{ fontFamily: "monospace" }}>{r.totalHours?.toFixed(1)}h</td>
                                        <td style={{ fontFamily: "monospace", color: "var(--accent)" }}>{r.totalOvertime?.toFixed(1)}h</td>
                                    </tr>
                                ))}
                                {monthlyReport.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No data for this month.</td></tr>}
                            </tbody>
                        </table>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th><th>ID</th><th>Department</th>
                                    <th>Check In</th><th>Check Out</th><th>Hours</th>
                                    <th>Source</th><th>Late</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length > 0 ? records.map((rec: any, i: number) => {
                                    const SourceIcon = SOURCE_ICONS[rec.source] || FiMonitor;
                                    return (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600 }}>{rec.employee?.firstName} {rec.employee?.lastName}</td>
                                            <td style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{rec.employee?.employeeId}</td>
                                            <td>{rec.employee?.department || "-"}</td>
                                            <td style={{ color: !rec.checkIn ? "var(--text-muted)" : "var(--text-primary)", fontFamily: "monospace" }}>
                                                {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--:--"}
                                            </td>
                                            <td style={{ color: !rec.checkOut ? "var(--text-muted)" : "var(--text-primary)", fontFamily: "monospace" }}>
                                                {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--:--"}
                                            </td>
                                            <td style={{ fontFamily: "monospace" }}>{rec.totalHours ? `${rec.totalHours.toFixed(1)}h` : "-"}</td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                                                    <SourceIcon size={14} /> {rec.source || "web"}
                                                </div>
                                            </td>
                                            <td>
                                                {rec.isLate ? (
                                                    <span style={{ color: "var(--error)", fontWeight: 600, fontSize: "12px" }}>
                                                        <FiAlertTriangle size={12} /> {rec.lateBy}m
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "var(--secondary)", fontSize: "12px" }}><FiCheckCircle size={12} /> On time</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${STATUS_COLORS[rec.status] || "pending"}`}>
                                                    {rec.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={9} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No attendance records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Regularization Modal */}
            {showRegularizeModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "480px", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>Request Regularization</h2>
                        <form onSubmit={handleRegularize} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Attendance ID</label>
                                <input type="text" className="form-input" value={regularizeData.attendanceId || ""} onChange={e => setRegularizeData({ ...regularizeData, attendanceId: e.target.value })} placeholder="Enter attendance record ID" required />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Reason</label>
                                <textarea className="form-input" value={regularizeData.reason || ""} onChange={e => setRegularizeData({ ...regularizeData, reason: e.target.value })} rows={3} style={{ resize: "none" }} required placeholder="Why do you need regularization?" />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRegularizeModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "rgba(34, 197, 94, 0.9)", color: "white", padding: "12px 20px", borderRadius: "8px", zIndex: 3000, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, animation: "fadeInUp 0.3s ease-out" }}>
                    <FiCheckCircle size={20} /> {toast}
                </div>
            )}
        </>
    );
}
