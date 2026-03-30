"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/lib/auth";
import EmptyState from "@/components/common/EmptyState";
import {
    FiPlus, FiEdit2, FiTrash2, FiEye, FiKey,
    FiSearch, FiChevronLeft, FiChevronRight, FiCheckCircle,
    FiXCircle, FiDatabase, FiActivity, FiShield, FiGlobe,
    FiMoreVertical, FiDownload, FiRefreshCw, FiFilter,
    FiTrendingUp, FiAlertTriangle, FiLayers, FiSliders,
    FiExternalLink, FiPieChart, FiSettings, FiBriefcase, FiTarget
} from "react-icons/fi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// ─── Types ────────────────────────────────────────────────────────────────────

type Organization = {
    _id: string;
    name: string;
    slug: string;
    industry?: string;
    planType?: string;
    maxEmployees?: number;
    status: "active" | "suspended" | "pending";
    createdAt: string;
    employeeCount?: number;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; dot: string; cls: string }> = {
        active: {
            label: "Active",
            dot: "bg-emerald-400",
            cls: "bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-[0_1px_3px_rgba(16,185,129,0.1)]"
        },
        suspended: {
            label: "Suspended",
            dot: "bg-red-400",
            cls: "bg-red-50 text-red-600 border-red-200/60 shadow-[0_1px_3px_rgba(239,68,68,0.1)]"
        },
        pending: {
            label: "Pending",
            dot: "bg-amber-400",
            cls: "bg-amber-50 text-amber-700 border-amber-200/60 shadow-[0_1px_3px_rgba(245,158,11,0.1)]"
        },
    };
    const s = map[status] ?? map["pending"];
    return (
        <span className={`inline-flex items-center gap-2 px-2 py-2 rounded-full text-[10px] font-semibold border tracking-wider uppercase ${s.cls}`}>
            <span className={`w-2 h-2 rounded-full ${s.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
            {s.label}
        </span>
    );
};

const PlanBadge = ({ plan }: { plan: string }) => {
    const map: Record<string, string> = {
        Starter: "bg-slate-50 text-slate-600 border-slate-200/80",
        Professional: "bg-blue-50 text-blue-600 border-blue-200/60",
        Enterprise: "bg-violet-50 text-violet-600 border-violet-200/60",
    };
    return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-semibold border uppercase tracking-wider ${map[plan] ?? map["Starter"]}`}>
            {plan}
        </span>
    );
};

const SkeletonRow = () => (
    <tr className="animate-pulse">
        {[...Array(6)].map((_, i) => (
            <td key={i} className="px-6 py-5">
                <div className="h-4 bg-slate-100 rounded-md" style={{ width: `${[60, 40, 50, 30, 40, 20][i]}%` }} />
            </td>
        ))}
    </tr>
);

const ActionMenu = ({ org, onView, onImpersonate, onToggle, onDelete }: any) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative" onBlur={() => setTimeout(() => setOpen(false), 150)}>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-90"
            >
                <FiMoreVertical size={16} />
            </button>
            {open && (
                <div className="absolute right-0 top-11 z-30 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.12),0_4px_8px_-2px_rgba(0,0,0,0.06)] overflow-hidden p-2"
                    style={{ animation: 'orgFadeScaleIn 0.15s ease-out' }}>
                    {[
                        { label: "View Details", icon: FiEye, onClick: onView, cls: "text-slate-600 hover:bg-slate-50 hover:text-slate-900" },
                        { label: "Login as Admin", icon: FiKey, onClick: onImpersonate, cls: "text-[#FF7A00] hover:bg-orange-50" },
                        {
                            label: org.status === "active" ? "Suspend" : "Activate",
                            icon: org.status === "active" ? FiXCircle : FiCheckCircle,
                            onClick: onToggle,
                            cls: org.status === "active" ? "text-red-500 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                        },
                        { label: "Delete", icon: FiTrash2, onClick: onDelete, cls: "text-slate-400 hover:bg-red-50 hover:text-red-600" },
                    ].map(({ label, icon: Icon, onClick, cls }, idx) => (
                        <div key={label}>
                            {idx === 3 && <div className="h-px bg-slate-100 mx-2 my-1.5" />}
                            <button
                                onClick={() => { onClick(); setOpen(false); }}
                                className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-[15px] font-black transition-all duration-200 ${cls}`}
                            >
                                <Icon size={20} /> {label}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrganizationListPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [globalTotal, setGlobalTotal] = useState(0);
    const [globalActive, setGlobalActive] = useState(0);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [planFilter, setPlanFilter] = useState("All");

    const fetchOrganizations = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const role = user?.role?.toLowerCase();
            const orgId = user?.organizationId;

            let res;
            if (role === 'admin' && orgId) {
                // For admin, we could fetch specifically theirs
                res = await axiosInstance.get(`/api/organizations/${orgId}`);
                const orgData = res.data.data;
                setOrganizations(orgData ? [orgData] : []);
                setTotal(orgData ? 1 : 0);
            } else {
                res = await axiosInstance.get("/api/organizations", {
                    params: { page, limit, search, status: statusFilter, planType: planFilter },
                });
                const fetchedData = res.data.data?.data || res.data.data || [];
                const pagination = res.data.data?.pagination || {};

                setOrganizations(fetchedData);
                setTotal(pagination.total ?? fetchedData.length);
                setActiveCount(pagination.active ?? fetchedData.filter((o: any) => o.status === 'active').length);
                setGlobalTotal(pagination.globalTotal ?? total);
                setGlobalActive(pagination.globalActive ?? activeCount);
            }
        } catch (err) {
            console.error("Fetch error", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, limit, search, statusFilter, planFilter]);

    useEffect(() => { fetchOrganizations(); }, [fetchOrganizations]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Permanently delete "${name}"? This action cannot be undone.`)) return;
        try {
            await axiosInstance.delete(`/api/organizations/${id}`);
            fetchOrganizations(true);
        } catch (err: any) {
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "suspended" : "active";
        try {
            await axiosInstance.patch(`/api/organizations/${id}/status`, { status: newStatus });
            fetchOrganizations(true);
        } catch (err: any) {
            alert("Status Sync Error: " + (err.response?.data?.message || err.message));
        }
    };

    const handleImpersonate = async (id: string) => {
        try {
            const res = await axiosInstance.post(`/api/organizations/${id}/impersonate`);
            localStorage.setItem("token", res.data.data.token);
            window.location.href = "/dashboard";
        } catch (err: any) {
            alert("Root handshake failed: " + (err.response?.data?.message || err.message));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        setSelectedIds(prev =>
            prev.size === organizations.length ? new Set() : new Set(organizations.map(o => o._id))
        );
    };

    const activeOrgs = organizations.filter(o => o.status === "active").length;
    const totalPages = Math.ceil(total / limit);
    const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
    const endRecord = Math.min(page * limit, total);

    const STATS = [
        { label: "Total Organizations", value: globalTotal || organizations.length, icon: FiLayers, color: "text-blue-500", bg: "bg-blue-500/10", trend: "Global", trendColor: "text-slate-400" },
        { label: "Active Units", value: globalActive || activeCount, icon: FiActivity, color: "text-[#FF7A00]", bg: "bg-orange-500/10", trend: "Online", trendColor: "text-emerald-400" },
        { label: "Cluster Capacity", value: `${Math.round(((globalActive || activeCount) / 500) * 100)}%`, icon: FiShield, color: "text-violet-400", bg: "bg-violet-500/10", trend: "Shard A1", trendColor: "text-violet-400" },
        { label: "Data Integrity", value: "Verified", icon: FiGlobe, color: "text-emerald-400", bg: "bg-emerald-500/10", trend: "Sync OK", trendColor: "text-emerald-400" },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] relative selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden pb-24">

            {/* ── Animations ── */}
            <style jsx>{`
                @keyframes orgFadeScaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-4px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes orgSlideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes orgGlow {
                    0%, 100% { opacity: 0.08; }
                    50% { opacity: 0.15; }
                }
                .hero-mesh {
                    background-image:
                        radial-gradient(circle at 20% 50%, rgba(255,122,0,0.07) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(99,102,241,0.05) 0%, transparent 50%),
                        radial-gradient(circle at 60% 80%, rgba(16,185,129,0.03) 0%, transparent 40%);
                }
                .stat-card-hover:hover {
                    background: rgba(30,41,59,0.45);
                    border-color: rgba(148,163,184,0.2);
                    transform: translateY(-2px);
                }
                .table-row-hover:hover {
                    background: linear-gradient(90deg, rgba(255,122,0,0.03) 0%, rgba(248,250,252,0.8) 15%, #FAFBFC 100%);
                }
                .table-row-hover:hover td:first-child {
                    box-shadow: inset 3px 0 0 0 #FF7A00;
                }
                .btn-provision {
                    background: linear-gradient(135deg, #FF7A00 0%, #F97316 50%, #EA580C 100%);
                    box-shadow: 0 4px 16px -2px rgba(255,122,0,0.35), 0 0 0 1px rgba(255,122,0,0.1);
                }
                .btn-provision:hover {
                    box-shadow: 0 8px 24px -4px rgba(255,122,0,0.45), 0 0 0 1px rgba(255,122,0,0.2);
                    transform: translateY(-1px);
                }
                .btn-provision:active {
                    transform: translateY(0) scale(0.97);
                    box-shadow: 0 2px 8px -2px rgba(255,122,0,0.4);
                }
                .filter-active {
                    background: white;
                    color: #0F172A;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,122,0,0.06);
                }
                .pagination-btn {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .pagination-btn:hover:not(:disabled) {
                    background: #F1F5F9;
                    color: #0F172A;
                }
                .pagination-btn:active:not(:disabled) {
                    transform: scale(0.92);
                }
                .pagination-active {
                    background: linear-gradient(135deg, #FF7A00, #F97316) !important;
                    color: white !important;
                    box-shadow: 0 2px 8px -1px rgba(255,122,0,0.4);
                    transform: scale(1.05);
                }
            `}</style>

            {/* ══════════════════════════════════════════════════════════════════
                HERO BANNER — Compact Enterprise Style: pt-24px pb-80px
               ══════════════════════════════════════════════════════════════════ */}
            <div className="relative bg-[#0F172A] overflow-hidden"
                style={{ padding: '24px 32px 80px 32px' }}>
                <div className="absolute inset-0 hero-mesh" />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />

                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10"
                        style={{ animation: 'orgSlideUp 0.5s ease-out' }}>
                        <div className="flex-1">
                            {/* Breadcrumb — reduced mb-6 to mb-3 */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center justify-center rounded-xl shadow-[0_4px_12px_rgba(255,122,0,0.3)]"
                                    style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #FF7A00, #EA580C)' }}>
                                    <FiLayers className="text-white" size={18} />
                                </div>
                                <div className="h-px w-8 bg-slate-700/40" />
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em]">Business Directory</span>
                            </div>

                            {/* Title — reduced size to 32px */}
                            <h1 style={{ fontSize: 32, lineHeight: 1.2, marginBottom: 8 }}
                                className="font-extrabold text-white tracking-tight">
                                Registered{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] via-orange-400 to-amber-400">
                                    Organizations
                                </span>
                            </h1>

                            <p style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 480 }}
                                className="text-slate-400 font-normal">
                                Manage and monitor your business units, service plans, and operational status from a single dashboard.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 lg:mb-1">
                            <button
                                onClick={() => fetchOrganizations(true)}
                                style={{ width: 44, height: 44 }}
                                className={`flex items-center justify-center border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm rounded-xl text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-700/40 transition-all duration-200 active:scale-90 ${refreshing ? "animate-spin" : ""}`}
                                title="Sync Registry"
                            >
                                <FiRefreshCw size={16} />
                            </button>
                            <button
                                onClick={() => router.push("/superadmin/organizations/add")}
                                style={{ height: 44, padding: '0 24px' }}
                                className="btn-provision text-white rounded-xl font-semibold text-[12px] uppercase tracking-wider flex items-center gap-2.5 transition-all duration-250 group"
                            >
                                <FiPlus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                                Add Organization
                            </button>
                        </div>
                    </div>

                    {/* ── Stats Cards — 16px internal padding, 12px gap, reduced mt-8 ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 mt-8" style={{ gap: 12 }}>
                        {STATS.map((stat, i) => (
                            <div key={i}
                                className="stat-card-hover bg-slate-800/25 backdrop-blur-md border border-slate-700/30 rounded-xl transition-all duration-300 cursor-default"
                                style={{ padding: 16, animation: `orgSlideUp 0.4s ease-out ${i * 0.08}s both` }}>
                                <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                                    <div className={`flex items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}
                                        style={{ width: 32, height: 32 }}>
                                        <stat.icon size={14} />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div style={{ fontSize: 22, lineHeight: 1 }} className="font-bold text-white tracking-tight">{stat.value}</div>
                                    <span className={`text-[8px] font-semibold ${stat.trendColor} uppercase tracking-wide opacity-70`}>{stat.trend}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                CONTENT PANEL — -80px overlap, 32px outer padding
               ══════════════════════════════════════════════════════════════════ */}
            <div className="max-w-[1400px] mx-auto relative z-20"
                style={{ marginTop: -40, padding: '0 24px 24px 24px' }}>

                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_8px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">

                    {/* ── Search & Filter Bar — Reduced to 16px padding ── */}
                    <div style={{ padding: 16 }}
                        className="border-b border-slate-100 flex flex-col xl:flex-row justify-between gap-4">
                        <div className="flex flex-col md:flex-row flex-1 items-stretch md:items-center" style={{ gap: 12 }}>
                            {/* Search Input — 44px height */}
                            <div className="relative flex-1 group">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF7A00] transition-colors duration-200" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by organization name or slug..."
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    style={{ height: 40, paddingLeft: 40, paddingRight: 12, fontSize: 13 }}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#FF7A00]/30 focus:ring-4 focus:ring-orange-500/5 transition-all duration-200"
                                />
                            </div>

                            {/* Status Filters — 8px padding, 8px gap */}
                            <div className="flex items-center bg-slate-100/80 rounded-xl shrink-0" style={{ padding: 4, gap: 4 }}>
                                {["All", "Active", "Suspended"].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { setStatusFilter(s); setPage(1); }}
                                        style={{ padding: '8px 16px' }}
                                        className={`rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all duration-200 ${statusFilter === s ? "filter-active" : "text-slate-500 hover:text-slate-700 hover:bg-white/40"}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            {/* Plan Selector — 44px height */}
                            <div className="relative shrink-0">
                                <FiSliders size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select
                                    value={planFilter}
                                    onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
                                    style={{ height: 40, paddingLeft: 36, paddingRight: 32, fontSize: 11 }}
                                    className="w-full md:w-[160px] bg-slate-50 border border-slate-200/80 rounded-xl font-semibold uppercase tracking-wider text-slate-600 outline-none cursor-pointer hover:border-slate-300 focus:border-[#FF7A00]/30 focus:ring-4 focus:ring-orange-500/5 transition-all duration-200 appearance-none"
                                >
                                    {["All Plans", "Starter", "Professional", "Enterprise"].map(p => (
                                        <option key={p} value={p === "All Plans" ? "All" : p}>{p}</option>
                                    ))}
                                </select>
                                <FiChevronRight size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
                            </div>
                        </div>

                        {/* Right status indicators */}
                        <div className="flex items-center gap-4 self-end xl:self-center">
                            {selectedIds.size > 0 && (
                                <div className="flex items-center gap-3 bg-[#FF7A00] text-white rounded-xl shadow-lg shadow-orange-200/50"
                                    style={{ paddingLeft: 12, paddingRight: 6, paddingTop: 6, paddingBottom: 6, animation: 'orgFadeScaleIn 0.3s ease-out' }}>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider">{selectedIds.size} Selected</span>
                                    <div className="w-px h-5 bg-white/20" />
                                    <button style={{ padding: '6px 12px' }}
                                        className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-[10px] font-semibold rounded-lg uppercase tracking-wider transition-all duration-200 active:scale-95">
                                        Actions <FiSliders size={12} />
                                    </button>
                                </div>
                            )}
                            <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl"
                                style={{ padding: '8px 16px' }}>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Total: {globalTotal || total} Units
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Data Table ─────────────────────────────────────── */}
                    <div className="overflow-x-auto px-4">
                        <table className="w-full border-separate" style={{ borderSpacing: '0 8px' }}>
                            <thead>
                                <tr className="text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">
                                    <th style={{ padding: '16px 20px' }} className="w-10">
                                        <input
                                            type="checkbox"
                                            className="accent-[#FF7A00] cursor-pointer rounded border-2 border-slate-300"
                                            style={{ width: 16, height: 16 }}
                                            checked={selectedIds.size === organizations.length && organizations.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th style={{ padding: '16px 20px' }}>Organization Name</th>
                                    <th style={{ padding: '16px 20px' }}>Business Type</th>
                                    <th style={{ padding: '16px 20px' }}>Service Plan</th>
                                    <th style={{ padding: '16px 20px' }}>Status</th>
                                    <th style={{ padding: '16px 20px' }}>Joined On</th>
                                    <th style={{ padding: '16px 20px' }} className="w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                                ) : organizations.length === 0 ? (
                                <td colSpan={7} style={{ padding: '80px 24px' }} className="text-center">
                                            <EmptyState
                                                title="No Organizations Found"
                                                description="Your business directory is currently empty. Start by registering the first tenant on the platform."
                                                icon={FiLayers}
                                                actionLabel="Register Organization"
                                                onAction={() => router.push("/superadmin/organizations/add")}
                                            />
                                        </td>
                                ) : (
                                    organizations.map(org => (
                                        <tr
                                            key={org._id}
                                            className={`group transition-all duration-300 relative ${selectedIds.has(org._id) ? "translate-x-1" : ""}`}
                                        >
                                            <td style={{ padding: '12px 20px' }} className="bg-white first:rounded-l-xl last:rounded-r-xl border-y border-l border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                                                <input
                                                    type="checkbox"
                                                    className="accent-[#FF7A00] cursor-pointer rounded border-slate-200"
                                                    style={{ width: 16, height: 16 }}
                                                    checked={selectedIds.has(org._id)}
                                                    onChange={() => toggleSelect(org._id)}
                                                />
                                            </td>

                                            {/* Organization — 12px padding */}
                                            <td style={{ padding: '12px 20px' }} className="bg-white border-y border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-[#FF7A00] flex items-center justify-center font-bold shadow-sm shrink-0 group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-slate-700/20"
                                                        style={{ width: 32, height: 32, fontSize: 13 }}>
                                                        {org.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div style={{ fontSize: 14 }} className="font-semibold text-slate-800 tracking-tight truncate group-hover:text-[#FF7A00] transition-colors duration-200">{org.name}</div>
                                                        <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                                                            <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase bg-slate-100/60 rounded" style={{ padding: '1px 6px' }}>{org.slug}</span>
                                                            <button onClick={() => window.open(`https://${org.slug}.hrms.cloud`, '_blank')}
                                                                className="flex items-center justify-center bg-white border border-slate-100 rounded-md text-slate-300 hover:text-[#FF7A00] hover:border-orange-200 transition-all duration-200 shadow-sm"
                                                                style={{ width: 20, height: 20 }}>
                                                                <FiExternalLink size={10} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Industry */}
                                            <td style={{ padding: '12px 20px' }} className="bg-white border-y border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                                                <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] font-medium text-slate-600 tracking-wide transition-all duration-200 hover:bg-white hover:shadow-md hover:shadow-slate-100/80"
                                                    style={{ padding: '6px 12px' }}>
                                                    <FiTarget size={12} className="text-[#FF7A00]" />
                                                    {org.industry || "General"}
                                                </div>
                                            </td>

                                            {/* Plan & Capacity */}
                                            <td style={{ padding: '12px 20px' }} className="bg-white border-y border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                                                <div className="flex flex-col" style={{ gap: 10 }}>
                                                    <PlanBadge plan={org.planType || "Starter"} />
                                                    <div className="flex items-center" style={{ gap: 8 }}>
                                                        <div className="rounded-full bg-slate-100 flex-1 overflow-hidden" style={{ height: 6, maxWidth: 100 }}>
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-[#FF7A00] to-orange-500 transition-all duration-1000 ease-out"
                                                                style={{ width: `${Math.min(100, ((org.employeeCount || 0) / (org.maxEmployees || 50)) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] text-slate-500 font-medium tabular-nums">
                                                            {org.employeeCount ?? 0}<span className="text-slate-300 mx-0.5">/</span>{org.maxEmployees ?? 50}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: '12px 20px' }} className="bg-white border-y border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                                                <StatusBadge status={org.status} />
                                            </td>

                                            {/* Created On */}
                                            <td style={{ padding: '12px 20px' }} className="bg-white first:rounded-l-xl last:rounded-r-xl border-y border-r border-slate-100/60 shadow-sm group-hover:shadow-md transition-all">
                                                <div style={{ fontSize: 13 }} className="font-bold text-slate-700 tracking-tight">{dayjs(org.createdAt).format("MMM DD, YYYY")}</div>
                                                <div style={{ fontSize: 10, marginTop: 4 }} className="text-slate-400 font-medium">{dayjs(org.createdAt).fromNow()}</div>
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: '12px 20px' }} className="bg-white first:rounded-l-xl last:rounded-r-xl border-y border-r border-slate-100/60 shadow-sm group-hover:shadow-md transition-all">
                                                <div className="flex justify-end">
                                                    <ActionMenu
                                                        org={org}
                                                        onView={() => router.push(`/superadmin/organizations/${org._id}`)}
                                                        onImpersonate={() => handleImpersonate(org._id)}
                                                        onToggle={() => handleToggleStatus(org._id, org.status)}
                                                        onDelete={() => handleDelete(org._id, org.name)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination — 24px padding ── */}
                    <div className="border-t border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50/30"
                        style={{ padding: '20px 24px', gap: 16 }}>
                        <div className="flex items-center" style={{ gap: 16 }}>
                            <div className="flex items-center" style={{ gap: 8 }}>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rows per page:</span>
                                <div className="relative">
                                    <select
                                        value={limit}
                                        onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                                        style={{ height: 36, padding: '0 32px 0 12px', fontSize: 11 }}
                                        className="border border-slate-200 rounded-lg font-semibold text-slate-600 bg-white outline-none cursor-pointer hover:border-slate-300 focus:border-[#FF7A00]/40 focus:ring-2 focus:ring-orange-500/5 transition-all duration-200 appearance-none shadow-sm"
                                    >
                                        {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                    <FiChevronRight size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
                                </div>
                            </div>
                            <div className="h-5 w-px bg-slate-200 hidden md:block" />
                            <span style={{ fontSize: 11 }} className="font-medium text-slate-500 hidden sm:block">
                                {startRecord}–{endRecord} <span className="text-slate-300">of</span>{" "}
                                <span className="font-semibold text-slate-700">{total}</span>
                            </span>
                        </div>

                        <div className="flex items-center bg-white border border-slate-200/80 rounded-xl shadow-sm"
                            style={{ padding: 4, gap: 2 }}>
                            <button onClick={() => setPage(1)} disabled={page === 1}
                                style={{ width: 32, height: 32 }}
                                className="pagination-btn flex items-center justify-center rounded-lg text-slate-300 disabled:opacity-25">
                                <FiChevronLeft size={13} className="-mr-1" /><FiChevronLeft size={13} />
                            </button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                style={{ width: 32, height: 32 }}
                                className="pagination-btn flex items-center justify-center rounded-lg text-slate-400 disabled:opacity-25">
                                <FiChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        style={{ width: 32, height: 32, fontSize: 11 }}
                                        className={`pagination-btn rounded-lg font-semibold ${page === p ? "pagination-active" : "text-slate-400"}`}>
                                        {p < 10 ? `0${p}` : p}
                                    </button>
                                );
                            })}
                            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                                style={{ width: 32, height: 32 }}
                                className="pagination-btn flex items-center justify-center rounded-lg text-slate-400 disabled:opacity-25">
                                <FiChevronRight size={16} />
                            </button>
                            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}
                                style={{ width: 32, height: 32 }}
                                className="pagination-btn flex items-center justify-center rounded-lg text-slate-300 disabled:opacity-25">
                                <FiChevronRight size={13} className="-ml-1" /><FiChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Footer Status ── */}
                <div className="flex flex-col sm:flex-row justify-between items-center opacity-0 hover:opacity-100 transition-opacity duration-500"
                    style={{ padding: '16px 4px', gap: 16 }}>
                    <div className="flex items-center" style={{ gap: 12 }}>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Cluster OK</span>
                        </div>
                        <span className="text-slate-200">·</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Geo-Sync: HRMS-GLOBAL-01</span>
                    </div>
                    <div className="flex items-center" style={{ gap: 16 }}>
                        <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                            <FiSettings size={12} />
                            <span className="text-[10px] font-medium uppercase tracking-widest">Console</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                            <FiPieChart size={12} />
                            <span className="text-[10px] font-medium uppercase tracking-widest">Analytics</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}