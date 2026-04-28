"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import AttendanceSummaryTable from "@/components/payroll/AttendanceSummaryTable";
import { FiRefreshCw, FiCalendar, FiInfo } from "react-icons/fi";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function buildAttendanceRecords(employees: any[], attendance: any[]) {
    return employees.map(emp => {
        const att = attendance.find(a => a.employeeId === emp._id || a.employee === emp._id);
        const workingDays = att?.workingDays || 26;
        const presentDays = att?.presentDays || 0;
        const paidLeaves = att?.paidLeaves || 0;
        const lop = att?.lop || Math.max(0, workingDays - presentDays - paidLeaves);
        const overtime = att?.overtime || 0;
        const payableDays = presentDays + paidLeaves;
        const proRataPct = workingDays > 0 ? Math.min(100, (payableDays / workingDays) * 100) : 0;
        return {
            employeeId: emp.employeeId || emp._id,
            employeeName: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
            department: emp.department,
            workingDays, presentDays, paidLeaves, unpaidLeaves: att?.unpaidLeaves || 0,
            overtime, lop, proRataPct, payableDays,
        };
    });
}

export default function AttendancePage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const [empRes, attRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.EMPLOYEES).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(`${API_ENDPOINTS.PAYROLL_ATTENDANCE_SUMMARY}?month=${month}&year=${year}`).catch(() => ({ data: { data: [] } })),
            ]);
            setEmployees(empRes.data.data || []);
            setAttendance(attRes.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [month, year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const records = buildAttendanceRecords(employees, attendance);
    const avgPct = records.length > 0 ? records.reduce((s, r) => s + r.proRataPct, 0) / records.length : 0;
    const fullPay = records.filter(r => r.proRataPct >= 95).length;
    const partial = records.filter(r => r.proRataPct < 95 && r.proRataPct >= 50).length;
    const lopCount = records.filter(r => r.lop > 0).length;

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E1B4B", margin: 0 }}>Attendance Integration</h1>
                    <p style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>
                        Attendance-based salary calculation for payroll processing
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <select className="form-input" style={{ width: 140 }} value={month} onChange={e => setMonth(+e.target.value)}>
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select className="form-input" style={{ width: 100 }} value={year} onChange={e => setYear(+e.target.value)}>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button className="btn btn-secondary" onClick={() => fetchData(true)} disabled={refreshing}>
                        <FiRefreshCw size={14} className={refreshing ? "spin" : ""} /> {refreshing ? "Syncing…" : "Sync"}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                    { label: "Avg Attendance", value: `${avgPct.toFixed(1)}%`, color: "#6366F1", bg: "#EEF2FF" },
                    { label: "Full Pay", value: fullPay, color: "#10B981", bg: "#D1FAE5" },
                    { label: "Partial Pay", value: partial, color: "#F59E0B", bg: "#FEF3C7" },
                    { label: "Employees with LOP", value: lopCount, color: "#EF4444", bg: "#FEE2E2" },
                ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: `1px solid ${s.bg}` }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Info Banner */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "#EEF2FF", borderRadius: 12, marginBottom: 20, border: "1px solid #C7D2FE" }}>
                <FiInfo size={16} style={{ color: "#6366F1", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#4338CA" }}>
                    <strong>Pro-Rata Salary</strong> = (Payable Days / Working Days) × Gross Salary. LOP days reduce the payable days.
                    Overtime pay is added to the base calculation.
                </span>
            </div>

            {/* Attendance Table */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", border: "1px solid #E8EAFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1E1B4B", display: "flex", alignItems: "center", gap: 8 }}>
                        <FiCalendar size={15} style={{ color: "#6366F1" }} />
                        {MONTHS[month - 1]} {year} — Attendance Summary
                    </div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>{records.length} employees</div>
                </div>
                <AttendanceSummaryTable records={records} month={month} year={year} loading={loading} />
            </div>
        </>
    );
}
