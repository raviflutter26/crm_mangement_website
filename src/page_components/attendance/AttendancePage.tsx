"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { FiClock, FiCalendar, FiDownload, FiActivity, FiEdit3 } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import AttendanceTable from "@/components/attendance/AttendanceTable";

interface AttendancePageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function AttendancePage({ showNotify }: AttendancePageProps) {
    const [summary, setSummary] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [checkedIn, setCheckedIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [activeView, setActiveView] = useState<"today" | "records" | "report" | "regularizations">("today");
    const [filterDate, setFilterDate] = useState("");
    const [monthlyReport, setMonthlyReport] = useState<any[]>([]);
    const [dateRecords, setDateRecords] = useState<any[]>([]);
    const [pendingRegs, setPendingRegs] = useState<any[]>([]);
    const [userRole, setUserRole] = useState("employee");
    const [userId, setUserId] = useState("");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("ravi_zoho_user") || "{}");
        setUserRole(String(user.role || "employee").toLowerCase());
        setUserId(user._id || user.id || "");
    }, []);
    const canApprove = ["owner", "admin", "hr", "manager"].includes(userRole);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const [summaryRes, recordsRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.ATTENDANCE_TODAY_SUMMARY),
                axiosInstance.get(`${API_ENDPOINTS.ATTENDANCE}?date=${todayStr}`),
            ]);
            setSummary(summaryRes.data.data);
            const recs = recordsRes.data.data || [];
            setRecords(recs);

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
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCheckIn = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("ravi_zoho_user") || "{}");
            await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_IN, {
                employeeId: user._id || user.id,
                source: "web"
            });
            setCheckedIn(true);
            setCheckInTime(new Date());
            if (showNotify) showNotify('success', "Checked in successfully!");
            fetchData();
        } catch (err: any) {
            if (showNotify) showNotify('failure', "Check-in failed");
        }
    };

    const handleCheckOut = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("ravi_zoho_user") || "{}");
            await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_OUT, {
                employeeId: user._id || user.id
            });
            if (showNotify) showNotify('success', "Checked out successfully!");
            fetchData();
            setCheckedIn(false);
        } catch (err: any) {
            if (showNotify) showNotify('failure', "Check-out failed");
        }
    };

    const fetchMonthlyReport = async () => {
        try {
            const now = new Date();
            const res = await axiosInstance.get(`${API_ENDPOINTS.ATTENDANCE_MONTHLY_REPORT}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
            setMonthlyReport(res.data.data || []);
        } catch (err) { }
    };

    useEffect(() => { if (activeView === "report") fetchMonthlyReport(); }, [activeView]);

    // The Records tab asks the server for the chosen day; it used to filter
    // today's rows client-side, so any other date showed nothing.
    useEffect(() => {
        if (activeView !== "records" || !filterDate) return;
        axiosInstance.get(API_ENDPOINTS.ATTENDANCE, { params: { date: filterDate } })
            .then(res => setDateRecords(res.data.data || []))
            .catch(() => setDateRecords([]));
    }, [activeView, filterDate]);

    const fetchPendingRegs = useCallback(async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.ATTENDANCE, { params: { regularizationStatus: "pending" } });
            setPendingRegs(res.data.data || []);
        } catch { setPendingRegs([]); }
    }, []);

    useEffect(() => { if (canApprove) fetchPendingRegs(); }, [canApprove, fetchPendingRegs]);

    const decideRegularization = async (id: string, status: "approved" | "rejected") => {
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.ATTENDANCE}/${id}/regularize`, { status });
            if (showNotify) showNotify('success', `Regularization ${status}.`);
            fetchPendingRegs();
            fetchData();
        } catch (err: any) {
            if (showNotify) showNotify('failure', err.response?.data?.message || "Could not update the request");
        }
    };

    const sourceRecords = activeView === "records" && filterDate ? dateRecords : records;
    const displayedRecords = [...sourceRecords].sort((a: any, b: any) => {
        // Sort by check-in time descending (most recent first)
        if (!a.checkIn) return 1;
        if (!b.checkIn) return -1;
        return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
    });

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Attendance...</div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">{currentTime.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <button className="btn btn-secondary"><FiDownload /> Export</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" }}>
                <div className="card" style={{ padding: "20px", borderLeft: "4px solid #ef4444" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: 600 }}>LATE COUNT (MONTH)</div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#ef4444" }}>
                        {records.filter(r => r.isLate && new Date(r.date).getMonth() === new Date().getMonth()).length}
                    </div>
                </div>
                <div className="card" style={{ padding: "20px", borderLeft: "4px solid var(--primary)" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: 600 }}>PERMISSION USED</div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--primary)" }}>0 hrs</div>
                </div>
                <div className="card" style={{ padding: "20px", borderLeft: "4px solid #10b981" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: 600 }}>TOTAL WORKING HRS</div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#10b981" }}>
                        {records.filter(r => new Date(r.date).getMonth() === new Date().getMonth())
                                .reduce((acc, curr) => acc + (curr.totalHours || 0), 0).toFixed(1)}h
                    </div>
                </div>
                <div className="card" style={{ padding: "20px", borderLeft: "4px solid #f59e0b" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: 600 }}>ATTENDANCE SUMMARY</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {records.filter(r => r.status === 'Present').length} P / {records.filter(r => r.status === 'Half Day').length} HD
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <button className={`btn ${activeView === "today" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveView("today")}><FiClock /> Today</button>
                <button className={`btn ${activeView === "records" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveView("records")}><FiCalendar /> Records</button>
                <button className={`btn ${activeView === "report" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveView("report")}><FiActivity /> Report</button>
                {canApprove && (
                    <button className={`btn ${activeView === "regularizations" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveView("regularizations")}>
                        <FiEdit3 /> Regularizations{pendingRegs.length ? ` (${pendingRegs.length})` : ""}
                    </button>
                )}
            </div>

            <div className="card">
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h3 className="card-title">{activeView.toUpperCase()}</h3>
                        {activeView === "today" && (
                            <span className="badge active" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "2px 8px" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white", animation: "pulse 1.5s infinite" }}></span>
                                LIVE
                            </span>
                        )}
                    </div>
                    {activeView === "records" && <input type="date" className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: "auto" }} />}
                </div>
                {activeView === "regularizations" ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Employee</th><th>Date</th><th>Requested</th><th>Reason</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {pendingRegs.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No pending regularization requests.</td></tr>
                                ) : pendingRegs.map((r: any) => {
                                    const own = String(r.employee?._id || r.employee) === String(userId);
                                    const t = (d?: string) => (d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-");
                                    return (
                                        <tr key={r._id}>
                                            <td style={{ fontWeight: 600 }}>{r.employee?.firstName} {r.employee?.lastName}</td>
                                            <td>{new Date(r.date).toLocaleDateString()}</td>
                                            <td style={{ fontSize: "12px" }}>{t(r.requestedCheckIn)} – {t(r.requestedCheckOut)}</td>
                                            <td style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.regularizedReason}>{r.regularizedReason}</td>
                                            <td>
                                                {own ? <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Your request</span> : (
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button className="btn btn-success btn-sm" onClick={() => decideRegularization(r._id, "approved")}>Approve</button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => decideRegularization(r._id, "rejected")}>Reject</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <AttendanceTable records={displayedRecords} activeView={activeView} />
                )}
            </div>
        </>
    );
}
