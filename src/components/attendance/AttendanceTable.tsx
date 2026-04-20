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
                        <th>Employee</th><th>Date</th>
                        <th>Shift</th>
                        <th>1st In</th><th>Last Out</th><th>Net Hrs</th>
                        <th>Deviation</th><th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {records.length > 0 ? records.map((rec: any, i: number) => {
                        return (
                            <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{rec.employee?.firstName} {rec.employee?.lastName}</td>
                                <td>{new Date(rec.date).toLocaleDateString("en-IN")}</td>
                                <td><span style={{ fontSize: "12px", background: "var(--bg-card)", padding: "4px 8px", borderRadius: "10px" }}>{rec.shiftName || "Standard"}</span></td>
                                <td style={{ fontFamily: "monospace" }}>{rec.firstIn || "--:--"}</td>
                                <td style={{ fontFamily: "monospace" }}>{rec.lastOut || "--:--"}</td>
                                <td style={{ fontWeight: 700 }}>{rec.netWorkingHours ? `${rec.netWorkingHours}h` : "-"}</td>
                                <td>
                                    {rec.deviationTime > 0 ? (
                                        <span style={{ color: "var(--error)", fontSize: "12px", fontWeight: 600 }}>-{rec.deviationTime}m</span>
                                    ) : rec.deviationTime < 0 ? (
                                        <span style={{ color: "var(--success)", fontSize: "12px", fontWeight: 600 }}>+{Math.abs(rec.deviationTime)}m</span>
                                    ) : <span style={{ color: "var(--text-muted)" }}>-</span>}
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
