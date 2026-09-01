"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiFileText, FiSearch, FiCheck, FiX } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/components/common/DialogProvider";

export default function timesheetsPage() {
    const toast = useToast();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.TIMESHEETS);
            setData(res.data.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDecision = async (id: string, status: 'Approved' | 'Rejected') => {
        setActingId(id);
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.TIMESHEETS}/${id}/approve`, { status });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update timesheet");
        } finally {
            setActingId(null);
        }
    };

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
                    <h1 className="page-title">Timesheets</h1>
                    <p className="page-subtitle">Review and approve employee weekly timesheet submissions. — {data.length} records found.</p>
                </div>
            </div>

            {data.length === 0 ? (
                <EmptyState
                    title="No Timesheets Submitted"
                    description="Employee timesheet submissions will appear here for review."
                    icon={FiFileText}
                />
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Timesheets</h3>
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
                                    <th>Employee</th>
                                    <th>Week</th>
                                    <th>Hours</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: any, i: number) => (
                                    <tr key={item._id || i}>
                                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{item.employee ? `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.trim() : '-'}</td>
                                        <td style={{ fontSize: "13px" }}>{item.weekStart ? new Date(item.weekStart).toLocaleDateString() : '-'} — {item.weekEnd ? new Date(item.weekEnd).toLocaleDateString() : '-'}</td>
                                        <td style={{ fontSize: "13px", fontWeight: 700 }}>{item.totalHours}h</td>
                                        <td><span className={`badge ${item.status === 'Approved' ? 'active' : item.status === 'Rejected' ? 'inactive' : 'pending'}`}>{item.status}</span></td>
                                        <td>
                                            {item.status === 'Submitted' ? (
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button className="btn btn-secondary btn-sm" style={{ padding: "6px 10px", color: "#10b981" }} disabled={actingId === item._id} onClick={() => handleDecision(item._id, 'Approved')}><FiCheck /></button>
                                                    <button className="btn btn-secondary btn-sm" style={{ padding: "6px 10px", color: "#ef4444" }} disabled={actingId === item._id} onClick={() => handleDecision(item._id, 'Rejected')}><FiX /></button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>—</span>
                                            )}
                                        </td>
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
