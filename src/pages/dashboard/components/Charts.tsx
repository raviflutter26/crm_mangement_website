"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

interface ChartsProps {
    data: any;
    userRole: string;
}

export default function Charts({ data, userRole }: ChartsProps) {
    const chartColors = ["var(--primary)", "var(--secondary)", "var(--accent)", "var(--purple)", "var(--error)", "var(--warning)"];

    return (
        <>
            <div className="grid-2" style={{ marginTop: "24px" }}>
                {/* Attendance Trends */}
                <div className="card" style={{ padding: "24px" }}>
                    <div className="card-header" style={{ marginBottom: "24px" }}>
                        <h3 className="card-title">Attendance Trends (Last 7 Days)</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.attendanceTrends || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                            <XAxis dataKey="_id" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} />
                            <YAxis stroke="var(--text-secondary)" fontSize={11} />
                            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "var(--shadow-lg)" }} />
                            <Bar dataKey="present" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Department Distribution */}
                <div className="card" style={{ padding: "24px" }}>
                    <div className="card-header" style={{ marginBottom: "24px" }}>
                        <h3 className="card-title">Department Headcount</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={data.departmentDistribution?.map((d: any) => ({ name: d._id || 'Support', value: d.count })) || []} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" cy="50%" 
                                innerRadius={60}
                                outerRadius={100} 
                                paddingAngle={5}
                                label={({name, value}) => `${name}: ${value}`}
                            >
                                {(data.departmentDistribution || []).map((_: any, i: number) => (
                                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {userRole !== "Manager" && (
                <div className="card" style={{ marginTop: "24px", padding: "24px" }}>
                    <div className="card-header" style={{ marginBottom: "24px" }}>
                        <h3 className="card-title">Monthly Payroll Analysis</h3>
                    </div>
                    <div className="card-body" style={{ height: "350px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.payrollTrends || []}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                <XAxis dataKey="_id.month" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(val) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][val-1]} />
                                <YAxis stroke="var(--text-secondary)" fontSize={11} tickFormatter={(val) => `₹${val/1000}k`} />
                                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" }} formatter={(val: any) => [`₹${val.toLocaleString()}`, 'Net Payroll']} />
                                <Area type="monotone" dataKey="total" stroke="var(--purple)" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={4} dot={{ r: 4, fill: "var(--purple)" }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </>
    );
}
