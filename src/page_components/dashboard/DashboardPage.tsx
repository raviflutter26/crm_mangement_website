"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { FiUsers, FiUserCheck, FiCalendar, FiActivity, FiCheckCircle, FiDollarSign } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

// Components
import AttendanceCard from "@/components/dashboard/AttendanceCard";
import StatsCards from "@/components/dashboard/StatsCards";
import Charts from "@/components/dashboard/Charts";
import LeaveSummary from "@/components/dashboard/LeaveSummary";
import PermissionModal from "@/components/dashboard/PermissionModal";

interface DashboardPageProps {
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function DashboardPage({ showNotify }: DashboardPageProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dialogState, setDialogState] = useState({ show: false, message: "" });
    const [actionLoading, setActionLoading] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionForm, setPermissionForm] = useState({ date: new Date().toISOString().split('T')[0], hoursRequest: 1, reason: "" });
    const [liveHours, setLiveHours] = useState<number>(0);
    const [userName, setUserName] = useState("Admin");
    const [userRole, setUserRole] = useState("");
    const [filter, setFilter] = useState("today");
    const [currentTime, setCurrentTime] = useState(new Date());
    const router = useRouter();

    const fetchDashboard = async () => {
        try {
            let token = localStorage.getItem('ravi_zoho_token');
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
            alert(err.response?.data?.message || "Failed to request permission");
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem('ravi_zoho_user');
            if (raw) {
                const pb = JSON.parse(raw);
                if (pb.name) setUserName(pb.name);
                if (pb.role) setUserRole(pb.role);
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchDashboard();
    }, [filter]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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
                } catch (e) {}
            }
            const res = await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_IN, {
                employeeId: data.employeeId, latitude: lat, longitude: lng,
            });
            showNotify('success', res.data.message || "Checked in successfully!");
            fetchDashboard();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to check in");
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
                } catch (e) {}
            }
            const res = await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_OUT, {
                employeeId: data.employeeId, latitude: lat, longitude: lng,
            });
            showNotify('success', "Checked out successfully!");
            fetchDashboard();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to check out");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Dashboard...</div>;
    if (!data) return <div style={{ padding: "40px", textAlign: "center", color: "red" }}>Failed to load dashboard data.</div>;

    const stats = [
        { id: 'total', label: "Total Employees", value: data?.employees?.total || 0, icon: FiUsers, color: "blue", change: "Overall", up: true },
        { id: 'checkin', label: "Checkin today", value: data?.attendance?.checkedInToday || 0, icon: FiActivity, color: "orange", change: "Swiped", up: true },
        { id: 'active', label: "Present Today", value: data?.attendance?.presentToday || 0, icon: FiUserCheck, color: "green", change: "On-time", up: true },
        { id: 'leave', label: "On Leave Today", value: data?.attendance?.onLeaveToday || 0, icon: FiCalendar, color: "blue", change: "Tracked", up: false },
        { id: 'absent', label: "Absent Today", value: data?.attendance?.absentToday || 0, icon: FiActivity, color: "purple", change: "Missing", up: false },
    ];

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

    const handleStatClick = (id: string) => {
        if (id === 'active' || id === 'leave' || id === 'checkin') {
            router.push('/attendance');
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {userName.split(' ')[0]}! Here&apos;s your {data?.managerDept ? `${data.managerDept} ` : 'HR '}overview.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <select 
                        className="btn btn-secondary" 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                    <button className="btn btn-primary" onClick={handleGenerateReport}>
                        <FiActivity /> Generate Report
                    </button>
                </div>
            </div>

            {data.isEmployee ? (
                <div className="grid-2" style={{ marginBottom: "24px" }}>
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
            ) : (
                <StatsCards stats={stats} onCardClick={handleStatClick} />
            )}

            <Charts data={data} userRole={userRole} />

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
