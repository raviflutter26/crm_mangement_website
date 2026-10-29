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

/**
 * Values are null when the server has nothing to compute them from (no
 * sessions recorded, no organizations at the start of the period); those
 * render as a dash rather than a number.
 */
type Kpi = {
    label: string;
    val: string | null;
    delta: string | null;
    dir: "up" | "down" | "flat" | null;
    /** Whether the change is good news; churn going up is "bad" though its arrow points up. */
    tone?: "good" | "bad" | null;
    sub: string;
    spark: (number | null)[];
    cls: "blue" | "green" | "red";
};

const DASH = "—";

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

/** Quote a CSV cell when it contains a comma, quote or newline. */
const csvCell = (v: unknown) => {
    const t = v == null ? "" : String(v);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** The figures on screen as one CSV: KPIs, then each chart's rows, then the geography table. */
function analyticsCsv(data: AnalyticsData) {
    const lines: string[] = [];
    const row = (...cells: unknown[]) => lines.push(cells.map(csvCell).join(","));
    row("Platform analytics", dayjs().format("YYYY-MM-DD HH:mm"));
    row();
    row("Metric", "Value", "Change", "Note");
    data.kpis.forEach((k) => row(k.label, k.val ?? DASH, k.delta ?? DASH, k.sub));
    const block = (title: string, b?: ChartBlock) => {
        if (!b || !b.labels.length) return;
        row();
        row(title);
        row("Period", ...b.series.map((s) => s.name));
        b.labels.forEach((label, i) => row(label, ...b.series.map((s) => s.data[i] ?? 0)));
    };
    block("API traffic", data.apiTraffic);
    block("Growth", data.growthGrowth);
    if (data.geoDistribution?.length) {
        row();
        row("Country", "Organizations", "Share %");
        data.geoDistribution.forEach((g) => row(g.country, g.count, g.pct));
    }
    return lines.join("\n");
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
                    <button className="btn btn-primary" style={{ fontWeight: 800 }} disabled={!data}
                        onClick={() => {
                            if (!data) return;
                            const url = URL.createObjectURL(new Blob([analyticsCsv(data)], { type: "text/csv;charset=utf-8" }));
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `rivo-platform-analytics-${dayjs().format("YYYY-MM-DD")}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}>
                        <FiDownload /> DOWNLOAD CSV
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
                        <div style={{ fontSize: "36px", fontWeight: 950, color: "#0f172a", marginBottom: "8px", letterSpacing: "-1px" }}>{k.val ?? DASH}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", flexWrap: "wrap" }}>
                            {(() => {
                                const tone = k.tone ?? (k.dir === "up" ? "good" : k.dir === "down" ? "bad" : null);
                                return (
                                    <span
                                        title={k.delta ? "Change vs the previous 30 days" : "No previous period to compare with"}
                                        style={{
                                            color: tone === "good" ? "#10b981" : tone === "bad" ? "#ef4444" : "#64748b",
                                            background: tone === "good" ? "#f0fdf4" : tone === "bad" ? "#fef2f2" : "#f1f5f9",
                                            padding: "4px 10px", borderRadius: "100px", fontWeight: 800,
                                            display: "flex", alignItems: "center", gap: "4px",
                                        }}
                                    >
                                        {k.delta && k.dir === "up" && <FiArrowUp aria-hidden="true" />}
                                        {k.delta && k.dir === "down" && <FiArrowDown aria-hidden="true" />}
                                        {k.delta ?? DASH}
                                    </span>
                                );
                            })()}
                            <span style={{ color: "#94a3b8", fontWeight: 600 }}>{k.sub}</span>
                        </div>
                        {(() => {
                            const spark = (k.spark || []).filter((v): v is number => typeof v === "number");
                            return spark.length > 1 ? (
                                <Sparkline data={spark} color={k.cls === "blue" ? "var(--primary)" : k.cls === "green" ? "#10b981" : "#ef4444"} />
                            ) : null;
                        })()}
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
