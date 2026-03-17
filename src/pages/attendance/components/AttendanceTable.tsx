"use client";

import { FiActivity, FiUserCheck, FiMapPin, FiMonitor, FiSmartphone, FiWifi, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

const STATUS_COLORS: any = {
    Present: "active", Absent: "inactive", "Half Day": "pending",
    "On Leave": "leave", Holiday: "processing", Weekend: "processing", WFH: "active",
};

const SOURCE_ICONS: any = {
    biometric: FiActivity, manual: FiUserCheck, gps: FiMapPin,
    web: FiMonitor, mobile: FiSmartphone, system: FiWifi,
};

interface AttendanceTableProps {
    records: any[];
    activeView: "today" | "records" | "report";
}

export default function AttendanceTable({ records, activeView }: AttendanceTableProps) {
    return (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Employee</th><th>ID</th>
                        {activeView === "records" && <th>Date</th>}
                        <th>Department</th>
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
                                {activeView === "records" && (
                                    <td style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                                        {new Date(rec.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                )}
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
                                    ) : rec.status === "Absent" ? (
                                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>-</span>
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
                        <tr><td colSpan={activeView === "records" ? 10 : 9} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No attendance records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
