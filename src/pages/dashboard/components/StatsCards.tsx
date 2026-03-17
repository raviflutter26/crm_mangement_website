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

export default function StatsCards({ stats, onCardClick }: StatsCardsProps) {
    return (
        <div className="stats-grid">
            {stats.map((stat, i) => (
                <div 
                    key={i} 
                    className={`stat-card ${stat.color} ${onCardClick ? 'clickable' : ''}`}
                    onClick={() => onCardClick && onCardClick(stat.id)}
                    style={{ cursor: onCardClick ? 'pointer' : 'default' }}
                >
                    <div className="stat-card-header">
                        <div className={`stat-card-icon ${stat.color}`}>
                            <stat.icon />
                        </div>
                        <span className={`stat-card-change ${stat.up ? "up" : "down"}`}>
                            {stat.up ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />} {stat.change}
                        </span>
                    </div>
                    <div className="stat-card-value">{stat.value}</div>
                    <div className="stat-card-label">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}
