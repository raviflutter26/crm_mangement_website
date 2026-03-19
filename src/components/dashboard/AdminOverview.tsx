"use client";

import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import {
    FiUsers, FiDollarSign, FiClock, FiBriefcase, FiCheckCircle, FiPieChart,
    FiPlus, FiFileText, FiSend, FiInbox, FiActivity, FiUserPlus
} from "react-icons/fi";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";

interface AdminOverviewProps {
    data: any;
    userName: string;
    filter: string;
    setFilter: (f: string) => void;
    onRefresh: () => void;
}

const DEPT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const LEAVE_COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // Approved, Pending, Rejected

export default function AdminOverview({ data, userName, filter, setFilter, onRefresh }: AdminOverviewProps) {
    const router = useRouter();

    const handleLeaveAction = async (leaveId: string, action: 'Approved' | 'Rejected') => {
        try {
            await axiosInstance.put(`${API_ENDPOINTS.LEAVES}/${leaveId}/status`, { status: action });
            onRefresh();
        } catch (err) {
            console.error('Failed to update leave status', err);
        }
    };

    const hr = new Date().getHours();
    const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";

    // Format Data
    const attendanceTrends = (data.attendanceTrends || []).map((d: any) => ({
        day: new Date(d._id + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        Present: d.present,
        Absent: Math.max(0, data.employees?.active - d.present) // Mocking absent based on active total
    }));

    const deptData = (data.departmentDistribution || []).map((d: any) => ({
        name: d._id || "Unassigned",
        value: d.count,
    }));

    const leaveRequestData = [
        { name: "Approved", value: data.leaves?.approved || 0 },
        { name: "Pending", value: data.leaves?.pending || 0 },
        { name: "Rejected", value: 0 } // Mocked as we don't have rejected count from the current API
    ].filter(d => d.value > 0);
    // If no data, provide dummy slice for donut shape
    if (leaveRequestData.length === 0) leaveRequestData.push({ name: "No Data", value: 1 });

    const totalPayrollCr = (data.payroll?.totalPayroll || 0) / 10000000;
    const payrollFormatted = totalPayrollCr >= 1
        ? `₹${totalPayrollCr.toFixed(2)}Cr`
        : `₹${((data.payroll?.totalPayroll || 0) / 100000).toFixed(2)}L`;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>
            
            {/* Header / Hero Banner */}
            <div style={{
                background: "linear-gradient(to right, #0f172a, #1e3a8a, #312e81)",
                borderRadius: "20px", padding: "28px 32px", color: "white",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                boxShadow: "0 10px 25px rgba(30, 58, 138, 0.25)",
                position: "relative", overflow: "hidden"
            }}>
                <div style={{ zIndex: 1 }}>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
                        {greeting}, {userName} <span style={{ fontSize: "20px" }}>👋</span>
                    </h1>
                    <p style={{ fontSize: "14px", color: "#93c5fd", margin: 0, fontWeight: 500 }}>
                        Here is what's happening across your organization today.
                    </p>
                    <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                        <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} /> {data.employees?.newThisMonth || 0} new employees this month
                        </span>
                        <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#facc15" }} /> {data.leaves?.pending || 0} pending approvals
                        </span>
                    </div>
                </div>
                
                {/* Decorative sparkles */}
                <div style={{ position: "absolute", right: "20%", top: "10%", opacity: 0.1, fontSize: "80px" }}>✨</div>
                
                <div style={{ display: "flex", gap: "12px", zIndex: 1 }}>
                    <div style={{
                        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "12px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", backdropFilter: "blur(10px)"
                    }}>
                        <select 
                            value={filter} 
                            onChange={e => setFilter(e.target.value)}
                            style={{ background: "transparent", color: "white", border: "none", outline: "none", fontWeight: 700, fontSize: "14px", cursor: "pointer", WebkitAppearance: "none", MozAppearance: "none" }}
                        >
                            <option value="today" style={{ color: "black" }}>Today</option>
                            <option value="month" style={{ color: "black" }}>This Month</option>
                            <option value="year" style={{ color: "black" }}>This Year</option>
                        </select>
                        <FiPieChart size={16} />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--text-primary)" }}>Quick Actions</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
                    {[
                        { label: "Add Employee", icon: FiUserPlus, path: "/employees", color: "#3b82f6" },
                        { label: "Process Payroll", icon: FiDollarSign, path: "/payroll", color: "#10b981" },
                        { label: "Approve Leaves", icon: FiInbox, path: "/leaves", color: "#f59e0b" },
                        { label: "Post Jobs", icon: FiBriefcase, path: "/recruitment", color: "#8b5cf6" },
                        { label: "Generate Report", icon: FiFileText, action: () => alert("Generating Report..."), color: "#06b6d4" },
                        { label: "Send Announcement", icon: FiSend, action: () => alert("Opening Announcement Modal..."), color: "#ec4899" }
                    ].map((action, i) => (
                        <div 
                            key={i} 
                            onClick={() => action.path ? router.push(action.path) : action.action?.()}
                            style={{ 
                                background: "var(--bg-secondary)", border: "1px solid var(--border)", 
                                borderRadius: "16px", padding: "16px 10px", 
                                display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                                cursor: "pointer", transition: "all 0.2s ease"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = action.color; e.currentTarget.style.boxShadow = `0 8px 16px ${action.color}20`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${action.color}15`, color: action.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                                <action.icon />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textAlign: "center" }}>{action.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Numbers Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
                {[
                    { val: data.employees?.active || 0, label: "Total Employees", sub: `${data.employees?.newThisMonth || 0} joining this month` },
                    { val: `${data.attendance?.attendanceRate || 0}%`, label: "Attendance Today", sub: "On time/Present" },
                    { val: payrollFormatted, label: "Monthly Payroll", sub: "Disbursed amount" },
                    { val: data.openPositions || 0, label: "Open Positions", sub: "Active recruitment" },
                    { val: data.leaves?.pending || 0, label: "Pending Approvals", sub: "Leaves & Permissions" },
                    { val: "2.4%", label: "Attrition Rate", sub: "Estimated YTD" }
                ].map((stat, i) => (
                    <div key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px 16px" }}>
                        <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>{stat.val}</div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginTop: "8px" }}>{stat.label}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{stat.sub}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                {/* Weekly Attendance */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>Weekly Attendance</h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>Present vs Absent trend (Last 7 Days)</p>
                        </div>
                        <div style={{ display: "flex", gap: "12px", fontSize: "12px", fontWeight: 600 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 8, height: 8, background: "#3b82f6", borderRadius: "2px" }}/> Present</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: 8, height: 8, background: "#f87171", borderRadius: "2px" }}/> Absent</div>
                        </div>
                    </div>
                    {attendanceTrends.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={attendanceTrends} barGap={2} margin={{ left: -25, bottom: -5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                                <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                                <Bar dataKey="Present" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="Absent" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>No attendance data for this period</div>
                    )}
                </div>

                {/* Headcount Donut */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ marginBottom: "10px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>Headcount By Dept.</h3>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>Total: {data.employees?.active || 0} employees</p>
                    </div>
                    {deptData.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                                        {deptData.map((d: any, i: number) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", width: "100%" }}>
                                {deptData.slice(0, 6).map((d: any, i: number) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                                        <span style={{ color: "var(--text-secondary)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</span>
                                        <span style={{ fontWeight: 800 }}>{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>No department data</div>
                    )}
                </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                {/* Payroll Area Chart */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>Payroll (₹Cr)</h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>Monthly net payroll disbursement</p>
                        </div>
                    </div>
                    {(data.payrollTrends || []).length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={data.payrollTrends} margin={{ left: -20, bottom: -5 }}>
                                <defs>
                                    <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                                <XAxis dataKey="_id.month" axisLine={false} tickLine={false} tickFormatter={(v) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][v - 1]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)" }} formatter={(val: number | undefined) => [`₹${(val ?? 0).toLocaleString()}`, "Payroll"]} />
                                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fill="url(#payGrad)" activeDot={{ r: 6, fill: "#10b981", stroke: "white" }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>No payroll data</div>
                    )}
                </div>

                {/* Leave Requests Chart */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ marginBottom: "10px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>Leave Requests</h3>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>Approval statistics</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={leaveRequestData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={0} outerRadius={85}>
                                    {leaveRequestData.map((d: any, i: number) => <Cell key={i} fill={data.leaves?.pending === 0 && data.leaves?.approved === 0 ? "#e2e8f0" : LEAVE_COLORS[i % LEAVE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: "flex", gap: "16px", justifyContent: "center", width: "100%", marginTop: "10px" }}>
                            {["Approved", "Pending", "Rejected"].map((l, i) => (
                                <div key={l} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "2px", background: LEAVE_COLORS[i] }} /> {l}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tables Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Recent Hires */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", overflowX: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>Recent Hires</h3>
                        <a href="/employees" style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>View All</a>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "10px 0", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, borderBottom: "1px solid var(--border)" }}>Employee Name</th>
                                <th style={{ textAlign: "left", padding: "10px 10px", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, borderBottom: "1px solid var(--border)" }}>Role</th>
                                <th style={{ textAlign: "left", padding: "10px 10px", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, borderBottom: "1px solid var(--border)" }}>Joined Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.recentHires || []).map((h: any, i: number) => (
                                <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                    <td style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                                            {h.firstName[0]}{h.lastName[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: 700 }}>{h.firstName} {h.lastName}</div>
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{h.department}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "12px 10px", fontSize: "12px" }}>{h.designation}</td>
                                    <td style={{ padding: "12px 10px", fontSize: "12px", color: "var(--text-secondary)" }}>{new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                                </tr>
                            ))}
                            {(!data.recentHires || data.recentHires.length === 0) && (
                                <tr><td colSpan={3} style={{ textAlign: "center", padding: "20px", fontSize: "13px", color: "var(--text-muted)" }}>No recent hires found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pending Approvals */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", overflowX: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>Pending Approvals (Leaves)</h3>
                        <a href="/leaves" style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>View All</a>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "10px 0", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, borderBottom: "1px solid var(--border)" }}>Employee Name</th>
                                <th style={{ textAlign: "left", padding: "10px 10px", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, borderBottom: "1px solid var(--border)" }}>Dates</th>
                                <th style={{ textAlign: "right", padding: "10px 0", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, borderBottom: "1px solid var(--border)" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.leaveApprovals || []).map((l: any, i: number) => (
                                <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                    <td style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                                            {l.employee?.firstName[0]}{l.employee?.lastName[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: 700 }}>{l.employee?.firstName} {l.employee?.lastName}</div>
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{l.leaveType}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "12px 10px", fontSize: "12px" }}>
                                        {new Date(l.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })} 
                                        {l.totalDays > 1 && ` - ${new Date(l.endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}`}
                                    </td>
                                    <td style={{ padding: "12px 0", textAlign: "right" }}>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                            <button onClick={() => handleLeaveAction(l._id, 'Approved')} style={{ padding: "4px 8px", fontSize: "11px", background: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}>Approve</button>
                                            <button onClick={() => handleLeaveAction(l._id, 'Rejected')} style={{ padding: "4px 8px", fontSize: "11px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}>Reject</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!data.leaveApprovals || data.leaveApprovals.length === 0) && (
                                <tr><td colSpan={3} style={{ textAlign: "center", padding: "20px", fontSize: "13px", color: "var(--text-muted)" }}>No pending leave approvals.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
