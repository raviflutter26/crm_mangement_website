"use client";

import { FiSun, FiMoon, FiClock, FiUser } from "react-icons/fi";

interface AttendanceRecord {
    employeeId: string;
    employeeName: string;
    department?: string;
    workingDays: number;
    presentDays: number;
    paidLeaves: number;
    unpaidLeaves: number;
    overtime: number; // hours
    lop: number; // Loss of Pay days
    proRataPct: number;
    payableDays: number;
}

interface AttendanceSummaryTableProps {
    records: AttendanceRecord[];
    month: number;
    year: number;
    loading?: boolean;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getStatus(pct: number): { label: string; color: string; bg: string } {
    if (pct >= 95) return { label: "Full Pay", color: "#10B981", bg: "#D1FAE5" };
    if (pct >= 75) return { label: "Partial", color: "#F59E0B", bg: "#FEF3C7" };
    if (pct >= 50) return { label: "Half Pay", color: "#EF4444", bg: "#FEE2E2" };
    return { label: "LOP", color: "#6B7280", bg: "#F3F4F6" };
}

export default function AttendanceSummaryTable({ records, month, year, loading }: AttendanceSummaryTableProps) {
    if (loading) {
        return (
            <div className="payroll-table-card">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton-row" style={{ height: 52, marginBottom: 4 }} />
                ))}
            </div>
        );
    }

    return (
        <div className="payroll-table-card">
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th style={{ textAlign: "center" }}>
                                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                    <FiSun size={13} /> Working Days
                                </span>
                            </th>
                            <th style={{ textAlign: "center" }}>Present</th>
                            <th style={{ textAlign: "center" }}>Paid Leave</th>
                            <th style={{ textAlign: "center" }}>LOP</th>
                            <th style={{ textAlign: "center" }}>
                                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                    <FiClock size={13} /> Overtime (hrs)
                                </span>
                            </th>
                            <th style={{ textAlign: "center" }}>Payable Days</th>
                            <th style={{ textAlign: "center" }}>Pro-Rata %</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((r, i) => {
                            const status = getStatus(r.proRataPct);
                            return (
                                <tr key={i}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: "50%",
                                                background: "#EDE9FE", color: "#7C3AED",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 14, fontWeight: 700, flexShrink: 0
                                            }}>
                                                {r.employeeName?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.employeeName}</div>
                                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.department || r.employeeId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "center", fontWeight: 600 }}>{r.workingDays}</td>
                                    <td style={{ textAlign: "center", fontWeight: 600, color: "#10B981" }}>{r.presentDays}</td>
                                    <td style={{ textAlign: "center", color: "#3B82F6" }}>{r.paidLeaves}</td>
                                    <td style={{ textAlign: "center", color: "#EF4444" }}>{r.lop}</td>
                                    <td style={{ textAlign: "center", color: "#F59E0B", fontWeight: 600 }}>
                                        {r.overtime > 0 ? `+${r.overtime}h` : "—"}
                                    </td>
                                    <td style={{ textAlign: "center", fontWeight: 700 }}>{r.payableDays}</td>
                                    <td style={{ textAlign: "center" }}>
                                        <span style={{
                                            padding: "3px 10px", borderRadius: 20,
                                            background: "#EDE9FE", color: "#7C3AED",
                                            fontSize: 12, fontWeight: 700
                                        }}>
                                            {r.proRataPct.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: "4px 10px", borderRadius: 20,
                                            background: status.bg, color: status.color,
                                            fontSize: 12, fontWeight: 700
                                        }}>
                                            {status.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {records.length === 0 && (
                            <tr>
                                <td colSpan={9} style={{ textAlign: "center", padding: "60px 20px" }}>
                                    <FiUser size={36} style={{ color: "var(--text-muted)", marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
                                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>No attendance data for {MONTHS[month - 1]} {year}</div>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                                        Attendance records sync automatically from the Attendance module
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
