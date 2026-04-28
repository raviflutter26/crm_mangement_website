"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, BarChart, Bar,
} from "recharts";

interface TrendData {
    month: string;
    netPay: number;
    grossPay: number;
    deductions: number;
}

interface PayrollTrendChartProps {
    data: TrendData[];
    type?: "area" | "bar";
    height?: number;
}

const fmt = (v: number) => `₹${(v / 100000).toFixed(1)}L`;

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="payroll-chart-tooltip">
                <div className="payroll-chart-tooltip-title">{label}</div>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="payroll-chart-tooltip-row">
                        <span style={{ color: p.color }}>●</span>
                        <span>{p.name}:</span>
                        <strong>₹{(p.value || 0).toLocaleString("en-IN")}</strong>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function PayrollTrendChart({
    data,
    type = "area",
    height = 280,
}: PayrollTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="payroll-chart-empty" style={{ height }}>
                <div>No trend data available yet</div>
                <div className="payroll-chart-empty-sub">Run payroll to see trends</div>
            </div>
        );
    }

    const commonProps = {
        data,
        margin: { top: 10, right: 20, left: 10, bottom: 0 },
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            {type === "bar" ? (
                <BarChart {...commonProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                    <Bar dataKey="grossPay" name="Gross Pay" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deductions" name="Deductions" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netPay" name="Net Pay" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
            ) : (
                <AreaChart {...commonProps}>
                    <defs>
                        <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradGross" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                    <Area type="monotone" dataKey="grossPay" name="Gross Pay" stroke="#10B981" strokeWidth={2} fill="url(#gradGross)" dot={false} />
                    <Area type="monotone" dataKey="netPay" name="Net Pay" stroke="#6366F1" strokeWidth={2.5} fill="url(#gradNet)" dot={{ fill: "#6366F1", r: 4 }} activeDot={{ r: 6 }} />
                </AreaChart>
            )}
        </ResponsiveContainer>
    );
}
