"use client";

import React, { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { motion } from "framer-motion";
import {
    FiArrowUp, FiArrowDown, FiGlobe, FiDownload, FiRefreshCcw,
    FiLayers, FiTrendingUp, FiClock, FiBarChart2,
} from "react-icons/fi";
import {
    ResponsiveContainer, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import EmptyState from "@/components/common/EmptyState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const CHART_TOOLTIP_STYLE = {
    borderRadius: "12px",
    border: "1px solid var(--border, #e2e8f0)",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
    fontWeight: 600,
    fontSize: "12px",
};

type Kpi = {
    label: string;
    val: string;
    delta: string;
    dir: "up" | "down";
    sub: string;
    spark: number[];
    cls: "blue" | "green" | "red";
};

type Series = { name: string; color: string; data: number[] };
type ChartBlock = { labels: string[]; series: Series[] };
type GeoRow = { flag?: string; country: string; count: number; pct: number };

type AnalyticsData = {
    kpis: Kpi[];
    apiTraffic: ChartBlock;
    growthGrowth: ChartBlock;
    geoDistribution: GeoRow[];
};

function toChartRows(block?: ChartBlock) {
    if (!block) return [];
    return block.labels.map((label, i) => {
        const row: Record<string, string | number> = { label };
        block.series.forEach((s) => { row[s.name] = s.data[i] ?? 0; });
        return row;
    });
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
    const rows = data.map((v, i) => ({ i, v }));
    return (
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 100, height: 40, opacity: 0.5 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await axiosInstance.get("/api/superadmin/analytics");
            setData(res.data.data);
            setError(null);
            setLastSynced(new Date());
        } catch (err) {
            console.error("Failed to load analytics", err);
            setError("Couldn't reach the analytics service. Check the backend connection and try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleSync = async () => {
        setRefreshing(true);
        await fetchAnalytics();
        setRefreshing(false);
    };

    if (loading) return <LoadingSkeleton />;

    if (error || !data) {
        return (
            <div className="page-content" style={{ background: "var(--bg-primary)" }}>
                <div className="page-header" style={{ marginBottom: "32px" }}>
                    <div>
                        <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 900 }}>Platform Analytics</h1>
                        <p className="page-subtitle">Unified intelligence across all managed organizations and clusters.</p>
                    </div>
                </div>
                <EmptyState
                    title="Analytics unavailable"
                    description={error ?? "No analytics data was returned by the server."}
                    icon={FiBarChart2}
                    actionLabel="Try Again"
                    onAction={() => { setLoading(true); fetchAnalytics(); }}
                    className="py-24"
                />
            </div>
        );
    }

    const { kpis, apiTraffic, growthGrowth, geoDistribution } = data;
    const apiTrafficRows = toChartRows(apiTraffic);
    const growthRows = toChartRows(growthGrowth);
    const maxGeoCount = Math.max(1, ...geoDistribution.map((g) => g.count));

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)" }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header"
                style={{ marginBottom: "32px" }}
            >
                <div>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 900 }}>Platform Analytics</h1>
                    <p className="page-subtitle">Unified intelligence across all managed organizations and clusters.</p>
                    {lastSynced && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold mt-2">
                            <FiClock size={12} /> Synced {dayjs(lastSynced).fromNow()}
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button className="btn btn-secondary" onClick={handleSync} disabled={refreshing} style={{ fontWeight: 800 }}>
                        <FiRefreshCcw className={refreshing ? "rotate" : ""} /> {refreshing ? "SYNCING…" : "SYNC"}
                    </button>
                    <button className="btn btn-primary" style={{ fontWeight: 800 }}>
                        <FiDownload /> GEN REPORT
                    </button>
                </div>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                {kpis.map((k, i) => (
                    <motion.div
                        key={k.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="card"
                        style={{ padding: "24px", overflow: "hidden", position: "relative", border: "1px solid var(--border-light)" }}
                    >
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 800, letterSpacing: "1px", marginBottom: "16px", textTransform: "uppercase" }}>{k.label}</div>
                        <div style={{ fontSize: "36px", fontWeight: 950, color: "#0f172a", marginBottom: "8px", letterSpacing: "-1px" }}>{k.val}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                            <span style={{
                                color: k.dir === "up" ? "#10b981" : "#ef4444",
                                background: k.dir === "up" ? "#f0fdf4" : "#fef2f2",
                                padding: "4px 10px", borderRadius: "100px", fontWeight: 800,
                                display: "flex", alignItems: "center", gap: "4px",
                            }}>
                                {k.dir === "up" ? <FiArrowUp /> : <FiArrowDown />} {k.delta}
                            </span>
                            <span style={{ color: "#94a3b8", fontWeight: 600 }}>{k.sub}</span>
                        </div>
                        {k.spark?.length > 1 && (
                            <Sparkline data={k.spark} color={k.cls === "blue" ? "var(--primary)" : k.cls === "green" ? "#10b981" : "#ef4444"} />
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="grid-2" style={{ gap: "32px", marginBottom: "32px" }}>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card"
                    style={{ padding: "24px", border: "1px solid var(--border-light)" }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>API REQUEST VOLUME</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Requests logged per endpoint cluster</div>
                        </div>
                        <FiTrendingUp style={{ color: "var(--primary)" }} size={20} />
                    </div>
                    {apiTrafficRows.length === 0 ? (
                        <EmptyState title="No traffic data" description="No API request data has been recorded yet." icon={FiTrendingUp} className="py-10" />
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={apiTrafficRows} barGap={4} margin={{ left: -20, bottom: 0, top: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={CHART_TOOLTIP_STYLE} />
                                {apiTraffic.series.map((s) => (
                                    <Bar key={s.name} dataKey={s.name} fill={s.color} radius={[4, 4, 0, 0]} opacity={0.9} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card"
                    style={{ padding: "24px", border: "1px solid var(--border-light)" }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>ENTERPRISE GROWTH</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Tenant acquisition and retention trends</div>
                        </div>
                        <FiLayers style={{ color: "var(--primary)" }} size={20} />
                    </div>
                    {growthRows.length === 0 ? (
                        <EmptyState title="No growth data" description="No tenant growth history has been recorded yet." icon={FiLayers} className="py-10" />
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={growthRows} margin={{ left: -20, bottom: 0, top: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                {growthGrowth.series.map((s) => (
                                    <Area key={s.name} type="monotone" dataKey={s.name} stroke={s.color} fill={s.color} fillOpacity={0.12} strokeWidth={2} dot={{ r: 3 }} />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card"
                style={{ padding: "32px", border: "1px solid var(--border-light)" }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                    <div>
                        <div style={{ fontSize: "16px", fontWeight: 900, color: "#1e293b", marginBottom: "4px" }}>GEOGRAPHIC DISTRIBUTION</div>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Ranked by enterprise client connection origin</div>
                    </div>
                    <FiGlobe style={{ color: "var(--primary)" }} size={24} />
                </div>

                {geoDistribution.length === 0 ? (
                    <EmptyState title="No geographic data" description="No client location data has been recorded yet." icon={FiGlobe} className="py-10" />
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {geoDistribution.map((geo, idx) => (
                            <div key={geo.country} style={{
                                display: "flex", alignItems: "center", gap: "16px",
                                padding: "14px 16px",
                                background: idx === 0 ? "#fff7ed" : "#f8fafc",
                                borderRadius: "14px",
                                border: idx === 0 ? "1px solid #ffedd5" : "1px solid #f1f5f9",
                            }}>
                                <div style={{ fontSize: "13px", fontWeight: 800, color: "#94a3b8", width: "20px" }}>#{idx + 1}</div>
                                <div style={{ fontSize: "18px", width: "24px" }}>{geo.flag}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "6px" }}>{geo.country}</div>
                                    <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(4, (geo.count / maxGeoCount) * 100)}%` }}
                                            transition={{ duration: 0.8, delay: 0.1 * idx }}
                                            style={{ height: "100%", background: idx === 0 ? "var(--primary)" : "#94a3b8", borderRadius: "3px" }}
                                        />
                                    </div>
                                </div>
                                <div style={{ fontSize: "16px", fontWeight: 950, color: "#0f172a", whiteSpace: "nowrap" }}>{geo.count.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
