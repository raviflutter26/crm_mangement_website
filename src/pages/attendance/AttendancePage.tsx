"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { FiClock, FiCalendar, FiDownload, FiActivity } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import AttendanceTable from "./components/AttendanceTable";

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
    const [activeView, setActiveView] = useState<"today" | "records" | "report">("today");
    const [filterDate, setFilterDate] = useState("");
    const [monthlyReport, setMonthlyReport] = useState<any[]>([]);

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

    const displayedRecords = records.filter((rec: any) => {
        if (activeView === "today") return true; // Already filtered by backend
        if (activeView === "records" && filterDate) return new Date(rec.date).toISOString().split('T')[0] === filterDate;
        return true;
    }).sort((a: any, b: any) => {
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

            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <button className={`btn ${activeView === "today" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveView("today")}><FiClock /> Today</button>
                <button className={`btn ${activeView === "records" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveView("records")}><FiCalendar /> Records</button>
                <button className={`btn ${activeView === "report" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveView("report")}><FiActivity /> Report</button>
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
                <AttendanceTable records={displayedRecords} activeView={activeView} />
            </div>
        </>
    );
}
