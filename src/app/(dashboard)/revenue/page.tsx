"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { FiDollarSign, FiSearch, FiTrendingUp, FiBriefcase } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";

export default function revenuePage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.PROJECTS);
                setData(res.data.data || []);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>Loading...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const totalBudget = data.reduce((s, p) => s + (p.budget || 0), 0);
    const activeCount = data.filter(p => p.status === 'In Progress' || p.status === 'Planning').length;
    const completedCount = data.filter(p => p.status === 'Completed').length;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Project Financials</h1>
                    <p className="page-subtitle">Budget and delivery status across all projects, sourced directly from Projects. — {data.length} projects found.</p>
                </div>
                <Link href="/projects" className="btn btn-secondary">
                    <FiBriefcase /> Manage Projects
                </Link>
            </div>

            {data.length === 0 ? (
                <EmptyState
                    title="No Projects Found"
                    description="Project financials will appear here once projects are created. Use Manage Projects to add one."
                    icon={FiDollarSign}
                />
            ) : (
                <>
                    <div className="grid-3" style={{ marginBottom: "24px", gap: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
                        <StatCard label="Total Budget" val={`₹${totalBudget.toLocaleString()}`} icon={FiDollarSign} color="var(--primary)" />
                        <StatCard label="Active Projects" val={String(activeCount)} icon={FiTrendingUp} color="#3b82f6" />
                        <StatCard label="Completed Projects" val={String(completedCount)} icon={FiBriefcase} color="#10b981" />
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Project Financials</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <FiSearch style={{ color: "var(--text-muted)" }} />
                                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{data.length} total</span>
                            </div>
                        </div>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Project</th>
                                        <th>Client</th>
                                        <th>Budget</th>
                                        <th>Progress</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item: any, i: number) => (
                                        <tr key={item._id || i}>
                                            <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{item.name || '-'}</td>
                                            <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.client || '-'}</td>
                                            <td style={{ fontSize: "13px", fontWeight: 700 }}>₹{(item.budget || 0).toLocaleString()}</td>
                                            <td style={{ fontSize: "13px" }}>{item.progress || 0}%</td>
                                            <td><span className={`badge ${(item.status || 'Planning').toLowerCase().replace(/\s+/g, '-')}`}>{item.status || 'Planning'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

function StatCard({ label, val, icon: Icon, color }: any) {
    return (
        <div className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                <div style={{ fontSize: "24px", fontWeight: 900, marginTop: "4px" }}>{val}</div>
            </div>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}15`, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} />
            </div>
        </div>
    );
}
