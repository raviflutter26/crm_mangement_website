"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiFileText, FiPlus, FiSearch } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";

export default function compliancelogsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.COMPLIANCE);
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

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Compliance & Logs</h1>
                    <p className="page-subtitle">Audit compliance records, system logs, and regulatory documentation. — {data.length} records found.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary"><FiPlus /> Add New</button>
                </div>
            </div>

            {data.length === 0 ? (
                <EmptyState
                    title="No Records Found"
                    description="Get started by adding your first record to this module."
                    icon={FiFileText}
                    actionLabel="Add New"
                />
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Compliance & Logs</h3>
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
                                    <th>Name / Title</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: any, i: number) => (
                                    <tr key={item._id || i}>
                                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{item.name || item.title || item.type || item.item || '-'}</td>
                                        <td><span className={`badge ${(item.status || 'active').toLowerCase()}`}>{item.status || 'Active'}</span></td>
                                        <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
