"use client";

import { FiArrowUp, FiArrowDown } from "react-icons/fi";

interface Stat {
    id: string;
    label: string;
    value: string | number;
    icon: any;
    color: string;
    change: string;
    up: boolean;
}

interface StatsCardsProps {
    stats: Stat[];
    onCardClick?: (id: string) => void;
}

const colorMap: Record<string, { primary: string; gradient: string; glow: string; bg: string }> = {
    blue:   { primary: "var(--primary)",  gradient: "linear-gradient(135deg,#FF7A00,#FF9D45)", glow: "rgba(255,122,0,0.25)", bg: "rgba(255,122,0,0.08)" },
    green:  { primary: "#10b981",         gradient: "linear-gradient(135deg,#10b981,#34d399)", glow: "rgba(16,185,129,0.25)", bg: "rgba(16,185,129,0.08)" },
    orange: { primary: "#f59e0b",         gradient: "linear-gradient(135deg,#f59e0b,#fbbf24)", glow: "rgba(245,158,11,0.25)", bg: "rgba(245,158,11,0.08)" },
    purple: { primary: "#7C3AED",         gradient: "linear-gradient(135deg,#7C3AED,#a855f7)", glow: "rgba(124,58,237,0.25)", bg: "rgba(124,58,237,0.08)" },
    red:    { primary: "#ef4444",         gradient: "linear-gradient(135deg,#ef4444,#f87171)", glow: "rgba(239,68,68,0.25)",  bg: "rgba(239,68,68,0.08)"  },
};

export default function StatsCards({ stats, onCardClick }: StatsCardsProps) {
    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "14px",
            marginBottom: "24px",
        }}>
            {stats.map((stat, i) => {
                const c = colorMap[stat.color] || colorMap.blue;
                return (
                    <div
                        key={i}
                        id={`stat-card-${stat.id}`}
                        onClick={() => onCardClick && onCardClick(stat.id)}
                        style={{
                            position: "relative",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: "18px",
                            padding: "20px",
                            cursor: onCardClick ? "pointer" : "default",
                            overflow: "hidden",
                            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                        }}
                        onMouseEnter={e => {
                            const el = e.currentTarget;
                            el.style.transform = "translateY(-4px)";
                            el.style.boxShadow = `0 12px 30px ${c.glow}`;
                            el.style.borderColor = c.primary;
                        }}
                        onMouseLeave={e => {
                            const el = e.currentTarget;
                            el.style.transform = "translateY(0)";
                            el.style.boxShadow = "none";
                            el.style.borderColor = "var(--border)";
                        }}
                    >
                        {/* Top accent bar */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: c.gradient, borderRadius: "18px 18px 0 0" }} />

                        {/* Icon + Change Badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                            <div style={{
                                width: "44px", height: "44px", borderRadius: "12px",
                                background: c.bg,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: c.primary, fontSize: "20px"
                            }}>
                                <stat.icon />
                            </div>
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: "3px",
                                fontSize: "11px", fontWeight: 700, padding: "3px 8px",
                                borderRadius: "20px",
                                background: stat.up ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                                color: stat.up ? "#10b981" : "#ef4444"
                            }}>
                                {stat.up ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />}
                                {stat.change}
                            </span>
                        </div>

                        {/* Value */}
                        <div style={{
                            fontSize: "32px", fontWeight: 900, lineHeight: 1,
                            color: "var(--text-primary)", marginBottom: "6px",
                            fontVariantNumeric: "tabular-nums"
                        }}>
                            {stat.value}
                        </div>

                        {/* Label */}
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
                            {stat.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
