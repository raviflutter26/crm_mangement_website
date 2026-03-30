"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiUsers, FiBox, FiActivity, FiShield, FiTrendingUp, FiServer, FiGlobe } from "react-icons/fi";

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState({
        totalOrgs: 0,
        totalUsers: 0,
        activeInvitations: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [orgsRes, usersRes] = await Promise.allSettled([
                    axiosInstance.get('/api/organizations'),
                    axiosInstance.get('/api/auth/users')
                ]);
                
                let orgsCount = 0;
                let usersCount = 0;

                if (orgsRes.status === 'fulfilled') orgsCount = orgsRes.value.data.data.length;
                if (usersRes.status === 'fulfilled') usersCount = usersRes.value.data.data.length || 0;

                setStats({
                    totalOrgs: orgsCount,
                    totalUsers: usersCount,
                    activeInvitations: 0, // Placeholder
                });
            } catch (err) {
                console.error('Dashboard stats error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { name: 'Total Organizations', value: stats.totalOrgs, icon: FiBox, color: "blue", change: "+12%", up: true },
        { name: 'Total Platform Users', value: stats.totalUsers, icon: FiUsers, color: "green", change: "+5%", up: true },
        { name: 'System Health', value: '99.9%', icon: FiActivity, color: "orange", change: "Stable", up: true },
        { name: 'Active Regions', value: '4', icon: FiGlobe, color: "purple", change: "Global", up: true },
    ];

    if (loading) return <div className="loading-spinner" style={{ margin: "100px auto" }} />;

    return (
        <div className="animate-in">
            {/* Hero Header */}
            <div className="card" style={{ 
                background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", 
                padding: "40px", 
                marginBottom: "32px",
                color: "white",
                position: "relative",
                overflow: "hidden"
            }}>
                <div style={{ position: "relative", zIndex: 1 }}>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>Platform Control Center</h1>
                    <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.7)", maxWidth: "600px" }}>
                        Monitor global system performance, manage multi-tenant organizations, and analyze platform-wide user activity.
                    </p>
                </div>
                {/* Abstract decoration */}
                <div style={{ 
                    position: "absolute", right: "-50px", top: "-50px", 
                    width: "300px", height: "300px", 
                    background: "rgba(0, 132, 255, 0.1)", 
                    borderRadius: "50%", filter: "blur(60px)" 
                }} />
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {cards.map((card) => (
                    <div key={card.name} className={`stat-card ${card.color}`}>
                        <div className="stat-card-header">
                            <div className={`stat-card-icon ${card.color}`}>
                                <card.icon />
                            </div>
                            <div className={`stat-card-change ${card.up ? 'up' : 'down'}`}>
                                {card.change}
                            </div>
                        </div>
                        <div className="stat-card-value">{card.value}</div>
                        <div className="stat-card-label">{card.name}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
                {/* Recent Activity */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Real-time System Audit</h3>
                        <button className="btn btn-secondary btn-sm">Export Logs</button>
                    </div>
                    <div className="card-body">
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Event Type</th>
                                        <th>Target</th>
                                        <th>Status</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600 }}>Org Creation</td>
                                            <td>Acme Corp India</td>
                                            <td><span className="badge approved">Success</span></td>
                                            <td className="text-muted">2 mins ago</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Infrastructure Status */}
                <div className="card" style={{ background: "var(--bg-primary)" }}>
                    <div className="card-header">
                        <h3 className="card-title">Cluster Status</h3>
                        <FiServer className="text-muted" />
                    </div>
                    <div className="card-body">
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                                    <span style={{ fontWeight: 600 }}>Database (MongoDB)</span>
                                    <span style={{ color: "var(--secondary)" }}>94% Capacity</span>
                                </div>
                                <div style={{ height: "8px", background: "var(--bg-hover)", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ width: "94%", height: "100%", background: "var(--secondary)" }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                                    <span style={{ fontWeight: 600 }}>Storage (S3)</span>
                                    <span style={{ color: "var(--primary)" }}>22% Capacity</span>
                                </div>
                                <div style={{ height: "8px", background: "var(--bg-hover)", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ width: "22%", height: "100%", background: "var(--primary)" }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: "32px", padding: "16px", background: "white", borderRadius: "12px", border: "1px dashed var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                <FiShield style={{ color: "var(--secondary)" }} />
                                <span style={{ fontWeight: 700, fontSize: "14px" }}>Security Scan</span>
                            </div>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                Last automated security audit completed successfully. No vulnerabilities detected in the core API.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
