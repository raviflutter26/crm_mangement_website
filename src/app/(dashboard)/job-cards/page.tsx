"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiBriefcase, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/common/DialogProvider";

const EMPTY_FORM = { employee: "", site: "", task: "", description: "" };
const STATUSES = ["Ongoing", "Completed", "Paused", "Cancelled"];

export default function jobcardsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [data, setData] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [jcRes, empRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.JOB_CARDS),
                axiosInstance.get(API_ENDPOINTS.EMPLOYEES),
            ]);
            setData(jcRes.data.data || []);
            setEmployees(empRes.data.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employee || !formData.site.trim() || !formData.task.trim()) {
            toast.error("Employee, site and task are required");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.JOB_CARDS, {
                ...formData,
                status: "Ongoing",
                startTime: new Date().toISOString(),
            });
            toast.success("Job card created");
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create job card");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (job: any, status: string) => {
        setUpdatingId(job._id);
        try {
            const payload: any = { status };
            if (status === 'Completed' && !job.endTime) {
                const endTime = new Date();
                const startTime = job.startTime ? new Date(job.startTime) : endTime;
                payload.endTime = endTime.toISOString();
                payload.totalMinutes = Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
            }
            await axiosInstance.put(`${API_ENDPOINTS.JOB_CARDS}/${job._id}`, payload);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update status");
        } finally {
            setUpdatingId(null);
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
                    <h1 className="page-title">Job Cards & Work Logs</h1>
                    <p className="page-subtitle">Track and manage field work entries, task assignments, and time logs. — {data.length} records found.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={() => { setFormData({ ...EMPTY_FORM, employee: user?._id || "" }); setShowModal(true); }}><FiPlus /> Add New</button>
                </div>
            </div>

            {data.length === 0 ? (
                <EmptyState
                    title="No Records Found"
                    description="Get started by adding your first record to this module."
                    icon={FiBriefcase}
                    actionLabel="Add New"
                    onAction={() => { setFormData({ ...EMPTY_FORM, employee: user?._id || "" }); setShowModal(true); }}
                />
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Job Cards & Work Logs</h3>
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
                                    <th>Site</th>
                                    <th>Task</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: any, i: number) => (
                                    <tr key={item._id || i}>
                                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{item.employee ? `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.trim() : '-'}</td>
                                        <td style={{ fontSize: "13px" }}>{item.site}</td>
                                        <td style={{ fontSize: "13px" }}>{item.task}</td>
                                        <td style={{ fontSize: "13px" }}>{item.totalMinutes ? `${(item.totalMinutes / 60).toFixed(1)}h` : '-'}</td>
                                        <td>
                                            <select
                                                className="form-input"
                                                style={{ padding: "4px 8px", fontSize: "12px", fontWeight: 700 }}
                                                value={item.status}
                                                disabled={updatingId === item._id}
                                                onChange={e => handleStatusChange(item, e.target.value)}
                                            >
                                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "32px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>New Job Card</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Employee *</label>
                                <select required className="form-input" value={formData.employee} onChange={e => setFormData({ ...formData, employee: e.target.value })}>
                                    <option value="">Select employee...</option>
                                    {employees.map((emp: any) => (
                                        <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Site *</label>
                                <input required type="text" className="form-input" value={formData.site} onChange={e => setFormData({ ...formData, site: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Task *</label>
                                <input required type="text" className="form-input" value={formData.task} onChange={e => setFormData({ ...formData, task: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Description</label>
                                <textarea className="form-input" rows={3} style={{ resize: "none" }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Creating..." : "Create Job Card"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
