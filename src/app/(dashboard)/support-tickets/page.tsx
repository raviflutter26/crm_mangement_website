"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiTag, FiSearch, FiMessageSquare } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/components/common/DialogProvider";

const STATUS_COLORS: Record<string, string> = { open: "pending", "in-progress": "processing", resolved: "active", closed: "inactive" };
const PRIORITY_COLORS: Record<string, string> = { low: "active", medium: "pending", high: "leave", urgent: "inactive" };
const STATUSES = ["open", "in-progress", "resolved", "closed"];

export default function supportticketsPage() {
    const toast = useToast();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // The ticket being responded to, and the reply being written for it.
    const [active, setActive] = useState<any>(null);
    const [reply, setReply] = useState({ status: "in-progress", resolution: "", assignedTo: "" });
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.SUPPORT_TICKETS);
            setData(res.data.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openRespond = (ticket: any) => {
        setActive(ticket);
        setReply({
            status: ticket.status === "open" ? "in-progress" : ticket.status,
            resolution: ticket.resolution || "",
            assignedTo: ticket.assignedTo || "",
        });
    };

    // Status, assignee and the reply all go through PATCH /:id/status — the only
    // route that may move a ticket, and only for support staff.
    const handleRespond = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!active) return;
        setSaving(true);
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.SUPPORT_TICKETS}/${active._id}/status`, reply);
            toast.success("Ticket updated");
            setActive(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update ticket");
        } finally {
            setSaving(false);
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
                    <h1 className="page-title">Support Tickets</h1>
                    <p className="page-subtitle">View, assign, and resolve internal support requests and issues. — {data.length} records found.</p>
                </div>
            </div>

            {data.length === 0 ? (
                <EmptyState
                    title="No Records Found"
                    description="Tickets raised by employees from Self Service will appear here."
                    icon={FiTag}
                />
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Support Tickets</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FiSearch style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{data.length} total</span>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ticket</th>
                                    <th>Subject</th>
                                    <th>Raised By</th>
                                    <th>Category</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item: any, i: number) => (
                                    <tr key={item._id || i}>
                                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{item.ticketId || i + 1}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{item.subject || '-'}</div>
                                            {item.resolution && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Reply: {item.resolution}</div>}
                                        </td>
                                        <td>{item.employeeName || '-'}</td>
                                        <td style={{ textTransform: "capitalize" }}>{(item.category || 'general').replace("-", " ")}</td>
                                        <td><span className={`badge ${PRIORITY_COLORS[item.priority] || 'pending'}`}>{item.priority || 'medium'}</span></td>
                                        <td><span className={`badge ${STATUS_COLORS[item.status] || 'pending'}`}>{(item.status || 'open').replace("-", " ")}</span></td>
                                        <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openRespond(item)}><FiMessageSquare /> Respond</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {active && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "520px", maxHeight: "85vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "6px" }}>{active.ticketId ? `${active.ticketId} · ` : ""}{active.subject}</h2>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>{active.description || "No description provided."}</p>
                        <form onSubmit={handleRespond} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Status</label>
                                    <select className="form-input" value={reply.status} onChange={e => setReply({ ...reply, status: e.target.value })}>
                                        {STATUSES.map(s => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Assigned To</label>
                                    <input type="text" className="form-input" value={reply.assignedTo} onChange={e => setReply({ ...reply, assignedTo: e.target.value })} placeholder="Team or person" /></div>
                            </div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Reply / Resolution</label>
                                <textarea className="form-input" value={reply.resolution} onChange={e => setReply({ ...reply, resolution: e.target.value })} rows={4} style={{ resize: "none" }} placeholder="What was done, or what the employee should do next" /></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setActive(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
