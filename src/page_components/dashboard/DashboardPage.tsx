"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { FiDownload } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

// Components
import AttendanceCard from "@/components/dashboard/AttendanceCard";
import LeaveSummary from "@/components/dashboard/LeaveSummary";
import PermissionModal from "@/components/dashboard/PermissionModal";
import AdminOverview from "@/components/dashboard/AdminOverview";

interface DashboardPageProps {
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function DashboardPage({ showNotify }: DashboardPageProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionForm, setPermissionForm] = useState({ date: new Date().toISOString().split('T')[0], hoursRequest: 1, reason: "" });
    const [liveHours, setLiveHours] = useState<number>(0);
    const [userName, setUserName] = useState("there");
    const [filter, setFilter] = useState("today");
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchDashboard = async () => {
        try {
            const token = localStorage.getItem('ravi_zoho_token');
            if (!token) { window.location.reload(); return; }
            const res = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD}?filter=${filter}`);
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
            showNotify('success', res.data.message || "Permission requested successfully!");
            setShowPermissionModal(false);
            setPermissionForm({ date: new Date().toISOString().split('T')[0], hoursRequest: 1, reason: "" });
            fetchDashboard();
        } catch (err: any) {
            showNotify('failure', err.response?.data?.message || "Failed to request permission");
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem('ravi_zoho_user');
            if (raw) {
                const pb = JSON.parse(raw);
                if (pb.name) setUserName(pb.name.split(' ')[0]);
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchDashboard();
    }, [filter]);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Live working hours counter
    useEffect(() => {
        if (data?.isEmployee && data.attendanceToday) {
            const sessions = data.attendanceToday.sessions || [];
            const activeSession = sessions.length > 0 && !sessions[sessions.length - 1].checkOut
                ? sessions[sessions.length - 1]
                : null;

            if (!activeSession) {
                setLiveHours(data.attendanceToday.totalHours || 0);
            } else {
                const calcLive = () => {
                    const diffMs = new Date().getTime() - new Date(activeSession.checkIn).getTime();
                    const currentSessionLiveHours = Math.max(0, diffMs / (1000 * 60 * 60));
                    let priorHours = 0;
                    sessions.forEach((s: any) => { if (s.checkOut) priorHours += (s.hours || 0); });
                    setLiveHours(priorHours + currentSessionLiveHours);
                };
                calcLive();
                const interval = setInterval(calcLive, 1000);
                return () => clearInterval(interval);
            }
        }
    }, [data]);

    const handleCheckIn = async () => {
        if (!data?.employeeId) return;
        setActionLoading(true);
        try {
            let lat = null, lng = null;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = pos.coords.latitude; lng = pos.coords.longitude;
                } catch (e) { }
            }
            const res = await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_IN, {
                employeeId: data.employeeId, latitude: lat, longitude: lng,
            });
            showNotify('success', res.data.message || "Checked in successfully!");
            fetchDashboard();
        } catch (err: any) {
            showNotify('failure', err.response?.data?.message || "Failed to check in");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!data?.employeeId) return;
        setActionLoading(true);
        try {
            let lat = null, lng = null;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = pos.coords.latitude; lng = pos.coords.longitude;
                } catch (e) { }
            }
            const res = await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_OUT, {
                employeeId: data.employeeId, latitude: lat, longitude: lng,
            });
            showNotify('success', res.data.message || "Checked out successfully!");
            fetchDashboard();
        } catch (err: any) {
            showNotify('failure', err.response?.data?.message || "Failed to check out");
        } finally {
            setActionLoading(false);
        }
    };

    const handleGenerateReport = () => {
        const reportContent = `Ravi Zoho System Report\nDate: ${new Date().toLocaleDateString()}\nTotal Employees: ${data?.employees?.total || 0}\nPresent Today: ${data?.attendance?.presentToday || 0}\nAttendance Rate: ${data?.attendance?.attendanceRate || 0}%\nPending Leaves: ${data?.leaves?.pending || 0}\n\nDepartment Breakdown:\n${(data?.departmentDistribution || []).map((d: any) => `${d._id || 'Unassigned'}: ${d.count}`).join('\n')}`;
        const encodedUri = encodeURI(`data:text/plain;charset=utf-8,${reportContent}`);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `HR_Report_${new Date().toISOString().split('T')[0]}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotify('success', "Report generated successfully!");
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>Loading dashboard...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!data) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "40px" }}>⚠️</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Failed to load dashboard</div>
            <button className="btn btn-primary" onClick={fetchDashboard}>Retry</button>
        </div>
    );

    const hr = new Date().getHours();
    const greeting = hr < 12 ? "Good Morning" : hr < 17 ? "Good Afternoon" : "Good Evening";
    const greetEmoji = hr < 12 ? "☀️" : hr < 17 ? "🌤️" : "🌙";

    return (
        <>
            {/* Employee view: Attendance + Leave Summary */}
            {data.isEmployee ? (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "22px" }}>{greetEmoji}</span>
                                <h1 style={{ fontSize: "26px", fontWeight: 900, margin: 0, color: "var(--text-primary)" }}>
                                    {greeting}, {userName}!
                                </h1>
                            </div>
                            <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                                {data?.managerDept ? `${data.managerDept} Department` : "HR"} Overview · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                            </p>
                        </div>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                        <AttendanceCard
                            isWorking={data.attendanceToday?.sessions?.length > 0 && !data.attendanceToday?.sessions[data.attendanceToday.sessions.length - 1].checkOut}
                            sessions={data.attendanceToday?.sessions || []}
                            liveHours={liveHours}
                            currentTime={currentTime}
                            handleCheckIn={handleCheckIn}
                            handleCheckOut={handleCheckOut}
                            actionLoading={actionLoading}
                            setShowPermissionModal={setShowPermissionModal}
                        />
                        <LeaveSummary data={data} />
                    </div>
                </>
            ) : (
                <AdminOverview 
                    data={data}
                    userName={userName}
                    filter={filter}
                    setFilter={setFilter}
                    onRefresh={fetchDashboard}
                />
            )}

            {/* Permission Modal */}
            <PermissionModal
                show={showPermissionModal}
                onClose={() => setShowPermissionModal(false)}
                onSubmit={handleRequestPermission}
                permissionForm={permissionForm}
                setPermissionForm={setPermissionForm}
                actionLoading={actionLoading}
            />
        </>
    );
}
