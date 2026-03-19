"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";

interface ChartsProps {
    data: any;
    userRole: string;
}

const DEPT_COLORS = ["#FF7A00", "#10b981", "#7C3AED", "#f59e0b", "#3b82f6", "#ef4444", "#06b6d4", "#84cc16"];

const CustomTooltipStyle = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    padding: "10px 16px",
    fontSize: "13px",
    fontFamily: "Inter, sans-serif",
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={CustomTooltipStyle}>
                <div style={{ fontWeight: 700, marginBottom: "4px", color: "var(--text-muted)", fontSize: "11px" }}>{label}</div>
                <div style={{ color: "var(--primary)", fontWeight: 800, fontSize: "18px" }}>{payload[0].value}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>employees present</div>
            </div>
        );
    }
    return null;
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={CustomTooltipStyle}>
                <div style={{ fontWeight: 700, marginBottom: "4px", color: "var(--text-muted)", fontSize: "11px" }}>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][label - 1] || label}
                </div>
                <div style={{ color: "#7C3AED", fontWeight: 800, fontSize: "18px" }}>₹{Number(payload[0].value).toLocaleString()}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Net Payroll</div>
            </div>
        );
    }
    return null;
};

export default function Charts({ data, userRole }: ChartsProps) {
    const attendanceTrends = (data.attendanceTrends || []).map((d: any) => ({
        ...d,
        day: new Date(d._id + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    }));

    const deptData = (data.departmentDistribution || []).map((d: any) => ({
        name: d._id || "Unassigned",
        value: d.count,
    }));

    return (
        <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "24px" }}>
                {/* Attendance Trends Bar Chart */}
                <div style={{
                    background: "var(--bg-secondary)", border: "1px solid var(--border)",
                    borderRadius: "20px", padding: "24px", overflow: "hidden"
                }}>
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Attendance Trends</h3>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>Last 7 days attendance overview</p>
                    </div>
                    {attendanceTrends.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={attendanceTrends} barSize={28}>
                                <defs>
                                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FF7A00" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#FF9D45" stopOpacity={0.7} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <XAxis dataKey="day" stroke="transparent" tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }} />
                                <YAxis allowDecimals={false} stroke="transparent" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,122,0,0.06)", radius: 8 }} />
                                <Bar dataKey="present" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "40px", opacity: 0.2 }}>📊</div>
                            <div style={{ fontSize: "14px", fontWeight: 500 }}>No attendance data yet</div>
                        </div>
                    )}
                </div>

                {/* Department Distribution Donut */}
                <div style={{
                    background: "var(--bg-secondary)", border: "1px solid var(--border)",
                    borderRadius: "20px", padding: "24px", overflow: "hidden"
                }}>
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Department Headcount</h3>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>Active employee distribution</p>
                    </div>
                    {deptData.length > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <ResponsiveContainer width="55%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={deptData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={98}
                                        paddingAngle={3}
                                    >
                                        {deptData.map((_: any, i: number) => (
                                            <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={CustomTooltipStyle} formatter={(val: any, name: any) => [val, name]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden" }}>
                                {deptData.map((d: any, i: number) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                                        <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: DEPT_COLORS[i % DEPT_COLORS.length], flexShrink: 0 }} />
                                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{d.name}</span>
                                        <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)", flexShrink: 0 }}>{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "40px", opacity: 0.2 }}>🏢</div>
                            <div style={{ fontSize: "14px", fontWeight: 500 }}>No department data yet</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payroll Area Chart */}
            {userRole !== "Manager" && (
                <div style={{
                    background: "var(--bg-secondary)", border: "1px solid var(--border)",
                    borderRadius: "20px", padding: "24px", marginTop: "16px", overflow: "hidden"
                }}>
                    <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Monthly Payroll Analysis</h3>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>Net payroll disbursement trend</p>
                        </div>
                        <div style={{
                            padding: "6px 14px", borderRadius: "20px",
                            background: "rgba(124,58,237,0.1)", color: "#7C3AED",
                            fontSize: "12px", fontWeight: 700
                        }}>
                            {new Date().getFullYear()}
                        </div>
                    </div>
                    {(data.payrollTrends || []).length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={data.payrollTrends || []}>
                                <defs>
                                    <linearGradient id="payrollGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <XAxis
                                    dataKey="_id.month"
                                    stroke="transparent"
                                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                                    tickFormatter={(v) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][v - 1]}
                                />
                                <YAxis stroke="transparent" tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip content={<CustomAreaTooltip />} />
                                <Area
                                    type="monotone" dataKey="total"
                                    stroke="#7C3AED" strokeWidth={3}
                                    fill="url(#payrollGrad)"
                                    dot={{ r: 5, fill: "#7C3AED", strokeWidth: 2, stroke: "var(--bg-secondary)" }}
                                    activeDot={{ r: 7, fill: "#7C3AED" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "40px", opacity: 0.2 }}>💰</div>
                            <div style={{ fontSize: "14px", fontWeight: 500 }}>No payroll data yet</div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
