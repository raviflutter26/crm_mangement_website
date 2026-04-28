"use client";

import { FiDollarSign, FiUsers, FiClock, FiXCircle, FiTrendingUp, FiShield } from "react-icons/fi";

interface KPI {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    trend?: string;
    trendUp?: boolean;
}

interface PayrollKPICardsProps {
    summary: {
        totalNetPay?: number;
        totalEarnings?: number;
        totalDeductions?: number;
        employeeCount?: number;
        pendingPayouts?: number;
        failedPayouts?: number;
        totalDisbursed?: number;
    };
    loading?: boolean;
}

const fmt = (n: number | undefined) =>
    `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function PayrollKPICards({ summary, loading }: PayrollKPICardsProps) {
    const kpis: KPI[] = [
        {
            label: "Net Payroll",
            value: fmt(summary?.totalNetPay),
            sub: "This month",
            icon: FiDollarSign,
            color: "var(--primary)",
            bg: "var(--primary-bg-light)",
            trend: "+2.4%",
            trendUp: true,
        },
        {
            label: "Gross Earnings",
            value: fmt(summary?.totalEarnings),
            sub: "Before deductions",
            icon: FiTrendingUp,
            color: "var(--secondary)",
            bg: "var(--secondary-bg-light)",
            trend: "+1.8%",
            trendUp: true,
        },
        {
            label: "Total Deductions",
            value: fmt(summary?.totalDeductions),
            sub: "PF + ESI + PT + TDS",
            icon: FiShield,
            color: "var(--warning)",
            bg: "var(--warning-bg-light)",
        },
        {
            label: "Employees",
            value: String(summary?.employeeCount || 0),
            sub: "Processed this cycle",
            icon: FiUsers,
            color: "var(--primary)",
            bg: "var(--primary-bg-light)",
        },
        {
            label: "Pending Payouts",
            value: String(summary?.pendingPayouts || 0),
            sub: "Awaiting RazorpayX",
            icon: FiClock,
            color: "var(--purple)",
            bg: "var(--purple-bg-light)",
        },
        {
            label: "Failed Payouts",
            value: String(summary?.failedPayouts || 0),
            sub: "Requires retry",
            icon: FiXCircle,
            color: "var(--error)",
            bg: "var(--error-bg-light)",
        },
    ];

    if (loading) {
        return (
            <div className="payroll-kpi-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="payroll-kpi-card skeleton-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="payroll-kpi-grid">
            {kpis.map((kpi, i) => (
                <div key={i} className="payroll-kpi-card">
                    <div className="payroll-kpi-top">
                        <div
                            className="payroll-kpi-icon"
                            style={{ background: kpi.bg, color: kpi.color }}
                        >
                            <kpi.icon size={20} />
                        </div>
                        {kpi.trend && (
                            <span
                                className="payroll-kpi-trend"
                                style={{ color: kpi.trendUp ? "var(--secondary)" : "var(--error)" }}
                            >
                                {kpi.trend}
                            </span>
                        )}
                    </div>
                    <div className="payroll-kpi-value" style={{ color: kpi.color }}>
                        {kpi.value}
                    </div>
                    <div className="payroll-kpi-label">{kpi.label}</div>
                    {kpi.sub && <div className="payroll-kpi-sub">{kpi.sub}</div>}
                </div>
            ))}
        </div>
    );
}
