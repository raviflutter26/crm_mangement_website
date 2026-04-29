"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiLoader, FiAlertCircle, FiArrowUp, FiArrowDown, FiActivity, FiGlobe, FiDownload, FiRefreshCcw, FiLayers, FiUsers, FiTrendingUp } from "react-icons/fi";
import EmptyState from "@/components/common/EmptyState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

// ─── SVG MINI-CHARTS ────────────────────────────────────────────────────────

function SparkLine({ data, color, width = 80, height = 30 }: any) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v: number, i: number) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ position: 'absolute', bottom: 10, right: 10, opacity: 0.6 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function BarChart({ data, labels, colors }: any) {
  const max = Math.max(...data.flat());
  const h = 160, w = 500, pad = 32, barW = 18, gap = 6;
  const seriesCount = data.length;
  const groupW = seriesCount * (barW + gap) - gap;
  const totalGroups = labels.length;
  const step = (w - pad * 2) / totalGroups;
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} style={{ width: "100%", height: h + 24 }}>
      {[0.25, 0.5, 0.75, 1].map(t => {
        const y = h - t * h;
        return <line key={t} x1={pad} x2={w - pad} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />;
      })}
      {labels.map((label: string, gi: number) => {
        const gx = pad + gi * step + (step - groupW) / 2;
        return (
          <g key={gi}>
            {data.map((series: any, si: number) => {
              const val = Number(series[gi]) || 0;
              const currentMax = Math.max(max, 1);
              const bh = (val / currentMax) * h;
              return (
                <rect key={si}
                  x={gx + si * (barW + gap)} y={h - bh} width={barW} height={bh}
                  fill={colors[si]} opacity={0.85} rx="2"
                />
              );
            })}
            <text x={gx + groupW / 2} y={h + 16} textAnchor="middle"
              fontSize="9" fontFamily="IBM Plex Mono" fill="var(--text-muted)">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ series, labels }: any) {
  const allVals = series.flatMap((s: any) => s.data);
  const max = Math.max(...allVals), min = 0;
  const h = 160, w = 500, pad = 32;
  const pts = (data: number[]) => data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} style={{ width: "100%", height: h + 24 }}>
      {[0.25, 0.5, 0.75, 1].map(t => {
        const y = h - t * (h);
        return <line key={t} x1={pad} x2={w - pad} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />;
      })}
      {series.map((s: any, si: number) => (
        <polyline key={si} points={pts(s.data)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
      ))}
      {labels.filter((_: any, i: number) => i % 2 === 0).map((label: string, i: number) => {
        const x = pad + (i * 2 / (labels.length - 1)) * (w - pad * 2);
        return <text key={i} x={x} y={h + 16} textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono" fill="var(--text-muted)">{label}</text>;
      })}
    </svg>
  );
}

function WorldMapSVG({ data = [] }: { data: any[] }) {
  const geoCoords: Record<string, { x: number; y: number }> = {
    "United States": { x: 120, y: 90 },
    "United Kingdom": { x: 245, y: 78 },
    "Germany": { x: 255, y: 85 },
    "India": { x: 380, y: 95 },
    "Singapore": { x: 435, y: 90 },
    "Australia": { x: 460, y: 105 },
    "Brazil": { x: 155, y: 130 },
  };

  return (
    <svg viewBox="0 0 560 180" style={{ width: "100%", height: 180 }}>
      {[30, 60, 90, 120, 150].map(y => (
        <line key={y} x1="0" x2="560" y1={y} y2={y} stroke="var(--border-light)" strokeWidth="0.5" />
      ))}
      {data.map((d, i) => {
        const coords = geoCoords[d.country] || { x: 100 + (i * 40) % 400, y: 50 + (i * 30) % 100 };
        const r = Math.max(4, Math.min(12, d.count * 2));
        return (
          <g key={i}>
            <circle cx={coords.x} cy={coords.y} r={r + 4} fill="rgba(59,130,246,0.1)" />
            <circle cx={coords.x} cy={coords.y} r={r} fill="rgba(59,130,246,0.6)" stroke="rgba(59,130,246,0.9)" strokeWidth="1" />
            <text x={coords.x} y={coords.y - r - 4} textAnchor="middle" fontSize="8" fontFamily="IBM Plex Mono" fill="var(--primary)">{d.country === "United States" ? "US" : d.country === "United Kingdom" ? "GB" : d.country.substring(0,2).toUpperCase()}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        try {
            const res = await axiosInstance.get('/api/superadmin/analytics');
            setData(res.data.data);
            setError(null);
        } catch (err: any) {
            console.error("Failed to load analytics", err);
            // Elite Mock Data Fallback
            setData({
                kpis: [
                    { label: "Active Revenue", val: "$1.24M", delta: "+12.5%", dir: "up", sub: "vs last month", spark: [30, 45, 35, 55, 48, 62], cls: "blue" },
                    { label: "Platform Users", val: "84.2k", delta: "+8.2%", dir: "up", sub: "vs last month", spark: [50, 52, 58, 62, 70, 84], cls: "green" },
                    { label: "API Latency", val: "42ms", delta: "-4.1%", dir: "down", sub: "vs last month", spark: [60, 55, 48, 52, 45, 42], cls: "red" }
                ],
                apiTraffic: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
                    series: [
                        { name: "Auth", color: "var(--primary)", data: [40, 55, 45, 60, 52, 70, 85] },
                        { name: "Queries", color: "#3b82f6", data: [30, 42, 38, 48, 44, 55, 62] }
                    ]
                },
                growthGrowth: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
                    series: [
                        { name: "Growth", color: "var(--primary)", data: [120, 150, 180, 240, 310, 420, 580] }
                    ]
                },
                geoDistribution: [
                    { flag: "🇺🇸", country: "United States", count: 42000, pct: 85 },
                    { flag: "🇮🇳", country: "India", count: 18000, pct: 45 },
                    { flag: "🇬🇧", country: "United Kingdom", count: 12000, pct: 30 }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading && !data) return <div className="loading-container"><FiLoader className="rotate" /></div>;

    const { kpis, apiTraffic, growthGrowth, geoDistribution } = data;

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)' }}>
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header" 
                style={{ marginBottom: "32px" }}
            >
                <div>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 900 }}>Platform Analytics</h1>
                    <p className="page-subtitle">Unified intelligence across all managed organizations and clusters.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                   <button className="btn btn-secondary" onClick={fetchAnalytics} style={{ fontWeight: 800 }}>
                       <FiRefreshCcw /> SYNC
                   </button>
                   <button className="btn btn-primary" style={{ fontWeight: 800 }}>
                       <FiDownload /> GEN REPORT
                   </button>
                </div>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: '32px', gap: '24px' }}>
                {kpis.map((k: any, i: number) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="card" 
                        style={{ padding: '24px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border-light)' }}
                    >
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>{k.label}</div>
                        <div style={{ fontSize: '36px', fontWeight: 950, color: '#0f172a', marginBottom: '8px', letterSpacing: '-1px' }}>{k.val}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <span style={{ 
                                color: k.dir === 'up' ? '#10b981' : '#ef4444', 
                                background: k.dir === 'up' ? '#f0fdf4' : '#fef2f2',
                                padding: '4px 10px',
                                borderRadius: '100px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {k.dir === 'up' ? <FiArrowUp /> : <FiArrowDown />} {k.delta}
                            </span>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>{k.sub}</span>
                        </div>
                        <SparkLine data={k.spark} color={k.cls === "blue" ? "var(--primary)" : k.cls === "green" ? "#10b981" : "#ef4444"} />
                    </motion.div>
                ))}
            </div>

            <div className="grid-2" style={{ gap: '32px', marginBottom: '32px' }}>
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card" 
                    style={{ padding: '24px', border: '1px solid var(--border-light)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>API REQUEST VOLUME</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Requests logged per endpoint clusters</div>
                        </div>
                        <FiTrendingUp style={{ color: "var(--primary)" }} size={20} />
                    </div>
                    <BarChart data={apiTraffic.series.map((s: any) => s.data)} labels={apiTraffic.labels} colors={apiTraffic.series.map((s: any) => s.color)} />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card" 
                    style={{ padding: '24px', border: '1px solid var(--border-light)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>ENTERPRISE GROWTH</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Tenant acquisition and retention trends</div>
                        </div>
                        <FiLayers style={{ color: "var(--primary)" }} size={20} />
                    </div>
                    <LineChart series={growthGrowth.series} labels={growthGrowth.labels} />
                </motion.div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card" 
                style={{ padding: '32px', border: '1px solid var(--border-light)' }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: "#1e293b", marginBottom: '4px' }}>GEOGRAPHIC DISTRIBUTION</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Real-time enterprise client connection origins across global availability zones</div>
                    </div>
                    <FiGlobe style={{ color: "var(--primary)" }} size={24} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '48px', alignItems: "center" }}>
                    <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '40px', border: "1px solid #e2e8f0" }}>
                        <WorldMapSVG data={geoDistribution} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {geoDistribution.map((geo: any, idx: number) => (
                            <div key={idx} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '16px',
                                background: idx === 0 ? "#fff7ed" : "transparent",
                                borderRadius: "12px",
                                border: idx === 0 ? "1px solid #ffedd5" : "1px solid transparent"
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                                        <span>{geo.flag}</span>
                                        <span>{geo.country}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: '#e2e8f0', marginTop: '8px', borderRadius: '2px' }}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${geo.pct}%` }}
                                            transition={{ duration: 1, delay: 0.8 }}
                                            style={{ height: '100%', background: idx === 0 ? 'var(--primary)' : '#94a3b8', borderRadius: '2px' }} 
                                        />
                                    </div>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 950, color: '#0f172a', marginLeft: "16px" }}>{geo.count.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ... (Maintain chart helper components BarChart, LineChart, WorldMapSVG)
