"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
    FiUsers, FiBox, FiActivity, FiServer, FiRefreshCw,
    FiArrowRight, FiCheckCircle, FiAlertTriangle, FiShieldOff,
} from "react-icons/fi";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type OrgLite = {
    _id: string;
    name: string;
    planType?: string;
    status: "active" | "suspended" | "pending" | "inactive";
    createdAt: string;
};

type AuditLogLite = {
    id: string;
    ts: string;
    actor: string;
    action: string;
    target: string;
    ip: string;
    severity: string;
};

type HealthLite = {
    status?: string;
    uptime?: string;
    activeIncidents?: number;
};

const PLAN_BADGE: Record<string, string> = {
    Starter: "bg-slate-50 text-slate-600 border-slate-200/80",
    Professional: "bg-blue-50 text-blue-600 border-blue-200/60",
    Enterprise: "bg-violet-50 text-violet-600 border-violet-200/60",
};

const STATUS_BADGE: Record<string, { label: string; dot: string; cls: string }> = {
    active: { label: "Active", dot: "bg-emerald-400", cls: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
    suspended: { label: "Suspended", dot: "bg-red-400", cls: "bg-red-50 text-red-600 border-red-200/60" },
    pending: { label: "Pending", dot: "bg-amber-400", cls: "bg-amber-50 text-amber-700 border-amber-200/60" },
    inactive: { label: "Inactive", dot: "bg-slate-400", cls: "bg-slate-50 text-slate-600 border-slate-200/60" },
};

const AUDIT_BADGE: Record<string, string> = {
    info: "bg-blue-50 text-blue-700 border-blue-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    critical: "bg-red-50 text-red-600 border-red-200/60",
};

function extractList<T>(payload: { data?: { data?: T[] } | T[] }): T[] {
    const body = payload?.data;
    if (Array.isArray(body)) return body;
    return (body as { data?: T[] })?.data ?? [];
}

export default function SuperAdminDashboard() {
    const router = useRouter();

    const [recentOrgs, setRecentOrgs] = useState<OrgLite[]>([]);
    const [totalOrgs, setTotalOrgs] = useState<number | null>(null);
    const [pendingOrgs, setPendingOrgs] = useState<number | null>(null);
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLogLite[] | null>(null);
    const [health, setHealth] = useState<HealthLite | null>(null);
    const [healthError, setHealthError] = useState(false);
    const [auditError, setAuditError] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAll = useCallback(async () => {
        const [orgsRes, pendingRes, usersRes, auditRes, healthRes] = await Promise.allSettled([
            // Backend defaults to 10 results per page; pagination.globalTotal carries the true org count.
            axiosInstance.get("/api/organizations", { params: { limit: 5, sort: "newest" } }),
            axiosInstance.get("/api/organizations", { params: { status: "Pending", limit: 1 } }),
            axiosInstance.get("/api/auth/users"),
            axiosInstance.get("/api/superadmin/audit-log"),
            axiosInstance.get("/api/system/health"),
        ]);

        if (orgsRes.status === "fulfilled") {
            const body = orgsRes.value.data ?? {};
            setRecentOrgs(Array.isArray(body.data) ? body.data : []);
            setTotalOrgs(body.pagination?.globalTotal ?? body.pagination?.total ?? (Array.isArray(body.data) ? body.data.length : 0));
        } else {
            setRecentOrgs([]);
            setTotalOrgs(null);
        }

        if (pendingRes.status === "fulfilled") {
            setPendingOrgs(pendingRes.value.data?.pagination?.total ?? 0);
        } else {
            setPendingOrgs(null);
        }

        if (usersRes.status === "fulfilled") {
            setTotalUsers(extractList<{ _id: string }>(usersRes.value).length);
        } else {
            setTotalUsers(null);
        }

        if (auditRes.status === "fulfilled" && auditRes.value.data?.data) {
            setAuditLogs(auditRes.value.data.data);
            setAuditError(false);
        } else {
            setAuditLogs([]);
            setAuditError(true);
        }

        if (healthRes.status === "fulfilled" && healthRes.value.data?.data) {
            setHealth(healthRes.value.data.data);
            setHealthError(false);
        } else {
            setHealth(null);
            setHealthError(true);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    };

    if (loading) return <LoadingSkeleton />;

    const recentAudit = (auditLogs ?? []).slice(0, 6);

    const healthLabel = health?.status ?? "Unknown";
    const healthLower = healthLabel.toLowerCase();
    const isHealthy = healthLower.includes("operational") && !healthLower.includes("outage") && !healthLower.includes("degraded");

    const cards = [
        { name: "Total Organizations", value: totalOrgs ?? "—", icon: FiBox, color: "blue" },
        { name: "Total Platform Users", value: totalUsers ?? "—", icon: FiUsers, color: "green" },
        { name: "Pending Approvals", value: pendingOrgs ?? "—", icon: FiAlertTriangle, color: "orange", href: "/organizations/pending" },
        { name: "Platform Status", value: healthError ? "—" : healthLabel, icon: isHealthy ? FiCheckCircle : FiShieldOff, color: healthError ? "slate" : isHealthy ? "green" : "red", href: "/infra" },
    ];

    return (
        <div className="animate-in">
            {/* Hero */}
            <div
                className="rounded-3xl p-10 mb-8 text-white relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}
            >
                <div className="relative z-10 flex items-start justify-between gap-6 flex-wrap">
                    <div>
                        <h1 className="text-[32px] font-extrabold mb-2 tracking-tight">Platform Control Center</h1>
                        <p className="text-white/70 max-w-xl text-[15px]">
                            Monitor global system performance, manage multi-tenant organizations, and analyze platform-wide user activity.
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
                <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(0, 132, 255, 0.12)" }} />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-[15px] font-bold text-slate-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Add Organization", icon: FiBox, path: "/organizations/add", color: "#FF7A00" },
                        { label: "Invite Global User", icon: FiUsers, path: "/users", color: "#3b82f6" },
                        { label: "System Config", icon: FiServer, path: "/settings", color: "#10b981" },
                        { label: "Audit Logs", icon: FiActivity, path: "/audit-log", color: "#8b5cf6" },
                    ].map((action) => (
                        <div
                            key={action.label}
                            onClick={() => router.push(action.path)}
                            className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] shrink-0"
                                style={{ background: `${action.color}15`, color: action.color }}
                            >
                                <action.icon />
                            </div>
                            <div>
                                <div className="font-bold text-[14px] text-slate-800">{action.label}</div>
                                <div className="text-[12px] text-slate-400">Management Task</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {cards.map((card) => (
                    <div
                        key={card.name}
                        onClick={card.href ? () => router.push(card.href!) : undefined}
                        className={`bg-white border border-slate-200/80 rounded-2xl p-6 ${card.href ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""} transition-all duration-200`}
                    >
                        <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-[20px] mb-4 ${
                                card.color === "blue" ? "bg-blue-50 text-blue-600" :
                                card.color === "green" ? "bg-emerald-50 text-emerald-600" :
                                card.color === "orange" ? "bg-orange-50 text-orange-500" :
                                card.color === "red" ? "bg-red-50 text-red-500" :
                                "bg-slate-100 text-slate-500"
                            }`}
                        >
                            <card.icon />
                        </div>
                        <div className="text-[28px] font-extrabold text-slate-900 leading-tight">{card.value}</div>
                        <div className="text-[13px] text-slate-500 font-medium mt-1">{card.name}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent System Audit */}
                <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800 text-[15px]">Real-time System Audit</h3>
                            <p className="text-[12px] text-slate-400 mt-0.5">Latest administrative and security events</p>
                        </div>
                        <button
                            onClick={() => router.push("/audit-log")}
                            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-600 hover:text-[#FF7A00] transition-colors"
                        >
                            View All <FiArrowRight size={12} />
                        </button>
                    </div>

                    {recentAudit.length === 0 ? (
                        <div className="px-6 py-4">
                            <EmptyState
                                title={auditError ? "Audit log unavailable" : "No recent activity"}
                                description={auditError ? "Couldn't reach the audit service. Try refreshing in a moment." : "System events will appear here as they happen."}
                                icon={FiActivity}
                                className="py-12"
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {["Event", "Actor", "Severity", "Time"].map((h) => (
                                            <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAudit.map((log, i) => (
                                        <tr key={log.id ?? i} className="border-b border-slate-50 last:border-0">
                                            <td className="px-6 py-4 text-[13px] font-semibold text-slate-800">{log.action}</td>
                                            <td className="px-6 py-4 text-[13px] text-slate-500">{log.actor ?? "System"}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${AUDIT_BADGE[(log.severity ?? "info").toLowerCase()] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>
                                                    {log.severity ?? "Info"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[12px] text-slate-400 whitespace-nowrap">{dayjs(log.ts).fromNow()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Recent Organizations */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 text-[15px]">Recent Organizations</h3>
                            <button
                                onClick={() => router.push("/organizations")}
                                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-600 hover:text-[#FF7A00] transition-colors"
                            >
                                View All <FiArrowRight size={12} />
                            </button>
                        </div>
                        {recentOrgs.length === 0 ? (
                            <div className="px-6 py-4">
                                <EmptyState
                                    title="No organizations yet"
                                    description="Add your first tenant organization to get started."
                                    icon={FiBox}
                                    actionLabel="Add Organization"
                                    onAction={() => router.push("/organizations/add")}
                                    className="py-10"
                                />
                            </div>
                        ) : (
                            <div className="px-2 py-2">
                                {recentOrgs.map((org) => {
                                    const status = STATUS_BADGE[org.status] ?? STATUS_BADGE.pending;
                                    return (
                                        <div key={org._id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold text-[13px] flex items-center justify-center shrink-0">
                                                    {org.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[13px] font-semibold text-slate-800 truncate">{org.name}</div>
                                                    <div className="text-[11px] text-slate-400">{dayjs(org.createdAt).fromNow()}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {org.planType && (
                                                    <span className={`hidden sm:inline-flex px-2 py-1 rounded-md text-[9px] font-bold border uppercase tracking-wide ${PLAN_BADGE[org.planType] ?? PLAN_BADGE.Starter}`}>
                                                        {org.planType}
                                                    </span>
                                                )}
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold border uppercase ${status.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Platform Health snapshot */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex-1">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-slate-800 text-[15px]">Platform Health</h3>
                            <FiServer className="text-slate-300" />
                        </div>

                        {healthError ? (
                            <EmptyState
                                title="Health data unavailable"
                                description="Couldn't reach the system health service."
                                icon={FiShieldOff}
                                className="py-8"
                            />
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isHealthy ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                                        {isHealthy ? <FiCheckCircle size={20} /> : <FiAlertTriangle size={20} />}
                                    </div>
                                    <div>
                                        <div className="text-[15px] font-extrabold text-slate-900">{healthLabel}</div>
                                        <div className="text-[11px] text-slate-400">Overall system status</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Uptime</div>
                                        <div className="text-[18px] font-extrabold text-slate-800">{health?.uptime ?? "—"}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Active Alerts</div>
                                        <div className="text-[18px] font-extrabold text-slate-800">{health?.activeIncidents ?? "—"}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push("/infra")}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    View Full Diagnostics <FiArrowRight size={12} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
