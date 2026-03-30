"use client";

import React from "react";
import { FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiCoffee } from "react-icons/fi";

interface AttendanceRecord {
    date: string;
    status: "Present" | "Absent" | "On Leave" | "Holiday" | "Half Day" | "WFH";
    firstIn: string | null;
    lastOut: string | null;
    totalHours: number;
    breakTime: number; // in minutes
    overtime: number; // in hours
}

interface EmployeeAttendanceTableProps {
    records: AttendanceRecord[];
    loading?: boolean;
}

export default function EmployeeAttendanceTable({ records, loading }: EmployeeAttendanceTableProps) {
    const getStatusStyles = (status: string) => {
        switch (status) {
            case "Present": return { bg: "#ecfdf5", color: "#10b981", icon: <FiCheckCircle /> };
            case "Absent": return { bg: "#fef2f2", color: "#ef4444", icon: <FiXCircle /> };
            case "On Leave": return { bg: "#eff6ff", color: "#3b82f6", icon: <FiClock /> };
            case "Holiday": return { bg: "#fdf2f7", color: "#ec4899", icon: <FiAlertCircle /> };
            case "Half Day": return { bg: "#fffbeb", color: "#f59e0b", icon: <FiAlertCircle /> };
            case "WFH": return { bg: "#f5f3ff", color: "#8b5cf6", icon: <FiCheckCircle /> };
            default: return { bg: "#f1f5f9", color: "#64748b", icon: <FiCheckCircle /> };
        }
    };

    const formatTime = (time: string | null) => {
        if (!time) return "--:--";
        return new Date(time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const formatDuration = (hours: number) => {
        if (!hours) return "0h 0m";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="table-wrapper" style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Date</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>First In</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Last Out</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Total Hours</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Break</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Overtime</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading records...</td></tr>
                    ) : records.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No attendance records found for this period.</td></tr>
                    ) : records.map((rec, i) => {
                        const styles = getStatusStyles(rec.status);
                        const isWeekend = new Date(rec.date).getDay() === 0 || new Date(rec.date).getDay() === 6;

                        return (
                            <tr key={i} style={{ borderBottom: "1px solid var(--border-light)", background: isWeekend ? "var(--bg-secondary-opacity)" : "transparent" }}>
                                <td style={{ padding: "14px 16px" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                                        {new Date(rec.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                        {new Date(rec.date).toLocaleDateString("en-IN", { weekday: "long" })}
                                    </div>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: "6px",
                                        padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                                        background: styles.bg, color: styles.color
                                    }}>
                                        {styles.icon} {rec.status}
                                    </span>
                                </td>
                                <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 500, fontFamily: "monospace" }}>
                                    {formatTime(rec.firstIn)}
                                </td>
                                <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 500, fontFamily: "monospace" }}>
                                    {formatTime(rec.lastOut)}
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: rec.totalHours >= 8 ? "#10b981" : "var(--text-primary)" }}>
                                        {formatDuration(rec.totalHours)}
                                    </div>
                                    <div style={{ height: "4px", width: "100%", maxWidth: "60px", background: "#e2e8f0", borderRadius: "2px", marginTop: "4px", overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${Math.min((rec.totalHours / 9) * 100, 100)}%`, background: rec.totalHours >= 8 ? "#10b981" : "#f59e0b" }} />
                                    </div>
                                </td>
                                <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <FiCoffee size={12} /> {rec.breakTime}m
                                    </div>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                    {rec.overtime > 0 ? (
                                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#3b82f6" }}>
                                            +{formatDuration(rec.overtime)}
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>-</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
