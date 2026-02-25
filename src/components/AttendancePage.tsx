"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiUserCheck, FiUserX, FiClock, FiCalendar, FiDownload, FiFilter } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

export default function AttendancePage() {
    const [summary, setSummary] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                let token = localStorage.getItem('ravi_zoho_token');
                if (!token) { window.location.reload(); return; }

                const [summaryRes, recordsRes] = await Promise.all([
                    axiosInstance.get(API_ENDPOINTS.ATTENDANCE_TODAY_SUMMARY),
                    axiosInstance.get(API_ENDPOINTS.ATTENDANCE)
                ]);

                setSummary(summaryRes.data.data);
                setRecords(recordsRes.data.data || []);
            } catch (err) {
                console.error("Failed to fetch attendance data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, []);

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center" }}>Loading Attendance...</div>;
    }

    const todayStats = [
        { label: "Present", value: summary?.present || "0", icon: FiUserCheck, color: "green" },
        { label: "Absent", value: summary?.absent || "0", icon: FiUserX, color: "orange" },
        { label: "On Leave", value: summary?.onLeave || "0", icon: FiCalendar, color: "purple" },
        { label: "Total", value: summary?.totalEmployees || "0", icon: FiClock, color: "blue" },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Track daily attendance and work hours</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary"><FiFilter /> Filter</button>
                    <button className="btn btn-secondary"><FiDownload /> Export</button>
                </div>
            </div>

            {/* Today Stats */}
            <div className="stats-grid">
                {todayStats.map((stat, i) => (
                    <div key={i} className={`stat-card ${stat.color}`}>
                        <div className="stat-card-header">
                            <div className={`stat-card-icon ${stat.color}`}><stat.icon /></div>
                        </div>
                        <div className="stat-card-value">{stat.value}</div>
                        <div className="stat-card-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Attendance Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Today&apos;s Attendance — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h3>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Emp ID</th>
                                <th>Department</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Current Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length > 0 ? records.map((rec: any, i: number) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{rec.employee?.firstName} {rec.employee?.lastName}</td>
                                    <td style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{rec.employee?.employeeId}</td>
                                    <td>{rec.employee?.department || "-"}</td>
                                    <td style={{ color: !rec.checkIn ? "var(--text-muted)" : "var(--text-primary)" }}>
                                        {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : "--:--"}
                                    </td>
                                    <td style={{ color: !rec.checkOut ? "var(--text-muted)" : "var(--text-primary)" }}>
                                        {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : "--:--"}
                                    </td>
                                    <td>
                                        <span className={`badge ${rec.status.toLowerCase().replace(" ", "")}`}>
                                            {rec.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                                        No attendance records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
