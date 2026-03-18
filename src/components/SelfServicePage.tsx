"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiUser, FiCalendar, FiClock, FiFileText, FiDollarSign,
    FiMessageSquare, FiPlus, FiCheckCircle, FiAlertCircle, FiChevronRight
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

const PRIORITY_COLORS: any = { low: "active", medium: "pending", high: "leave", urgent: "inactive" };
const STATUS_COLORS: any = { open: "pending", "in-progress": "processing", resolved: "active", closed: "inactive" };

interface SelfServicePageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function SelfServicePage({ showNotify }: SelfServicePageProps) {
    const [user, setUser] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketForm, setTicketForm] = useState<any>({ category: "general", priority: "medium" });
    const [toast, setToast] = useState("");

    useEffect(() => {
        try {
            const userData = localStorage.getItem("ravi_zoho_user");
            if (userData) setUser(JSON.parse(userData));
        } catch (e) { }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tRes, lRes, aRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.SUPPORT_TICKETS).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.LEAVES).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.ATTENDANCE).catch(() => ({ data: { data: [] } })),
            ]);
            setTickets(tRes.data.data || []);
            setLeaves(lRes.data.data || []);
            setAttendance(aRes.data.data || []);
        } catch (err) { console.error("Fetch error", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const handleSubmitTicket = async (e: any) => {
        e.preventDefault();
        try {
            await axiosInstance.post(API_ENDPOINTS.SUPPORT_TICKETS, {
                ...ticketForm,
                employeeName: user?.name || user?.email || "Employee",
            });
            showToast("Ticket submitted!");
            setShowTicketModal(false);
            setTicketForm({ category: "general", priority: "medium" });
            fetchData();
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const quickActions = [
        { label: "Apply Leave", icon: FiCalendar, color: "#1A73E8", desc: "Request time off" },
        { label: "View Attendance", icon: FiClock, color: "#34A853", desc: "Check your attendance" },
        { label: "Download Payslip", icon: FiFileText, color: "#7C3AED", desc: "Get latest payslip" },
        { label: "Submit Expense", icon: FiDollarSign, color: "#FF6D00", desc: "Claim expenses" },
        { label: "Raise Ticket", icon: FiMessageSquare, color: "#EA4335", desc: "Get support" },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Self Service</h1>
                    <p className="page-subtitle">Welcome back, {user?.name || "Employee"} — manage your profile and requests</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="card" style={{ marginBottom: "20px" }}>
                <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{
                        width: "72px", height: "72px", borderRadius: "16px",
                        background: "var(--gradient-primary)", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "28px", fontWeight: 800, color: "white"
                    }}>
                        {(user?.name || "E").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 700 }}>{user?.name || "Employee"}</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{user?.email || ""}</p>
                        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                            <span className="badge active">{user?.role || "Employee"}</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "16px", textAlign: "center" }}>
                        <div style={{ padding: "12px 20px", background: "var(--bg-primary)", borderRadius: "12px" }}>
                            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)" }}>{leaves.length}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Leaves</div>
                        </div>
                        <div style={{ padding: "12px 20px", background: "var(--bg-primary)", borderRadius: "12px" }}>
                            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--secondary)" }}>{attendance.length}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Present Days</div>
                        </div>
                        <div style={{ padding: "12px 20px", background: "var(--bg-primary)", borderRadius: "12px" }}>
                            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)" }}>{tickets.filter(t => t.status === "open").length}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Open Tickets</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
                {quickActions.map((action, i) => (
                    <div key={i} className="card" style={{
                        padding: "20px", cursor: "pointer", textAlign: "center",
                        transition: "all 0.2s", position: "relative", overflow: "hidden"
                    }}
                        onClick={() => {
                            if (action.label === "Raise Ticket") setShowTicketModal(true);
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-lg)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                    >
                        <div style={{
                            width: "48px", height: "48px", borderRadius: "12px",
                            background: `${action.color}20`, display: "flex", alignItems: "center",
                            justifyContent: "center", margin: "0 auto 12px", color: action.color, fontSize: "22px"
                        }}>
                            <action.icon />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>{action.label}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{action.desc}</div>
                    </div>
                ))}
            </div>

            {/* Support Tickets */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">My Support Tickets</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowTicketModal(true)}><FiPlus /> New Ticket</button>
                </div>
                <div className="table-wrapper">
                    {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : (
                        <table>
                            <thead><tr><th>Ticket ID</th><th>Subject</th><th>Category</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t._id}>
                                        <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{t.ticketId}</td>
                                        <td>{t.subject}</td>
                                        <td>{t.category}</td>
                                        <td><span className={`badge ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span></td>
                                        <td><span className={`badge ${STATUS_COLORS[t.status]}`}>{t.status.replace("-", " ")}</span></td>
                                        <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {tickets.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No tickets raised yet.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Ticket Modal */}
            {showTicketModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "520px", maxHeight: "80vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>Raise Support Ticket</h2>
                        <form onSubmit={handleSubmitTicket} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Subject *</label>
                                <input required type="text" className="form-input" value={ticketForm.subject || ""} onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })} placeholder="Brief description of your issue" /></div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Category</label>
                                    <select className="form-input" value={ticketForm.category} onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}>
                                        <option value="it-support">IT Support</option><option value="hr-query">HR Query</option>
                                        <option value="payroll">Payroll</option><option value="facilities">Facilities</option>
                                        <option value="leave">Leave</option><option value="general">General</option><option value="other">Other</option>
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Priority</label>
                                    <select className="form-input" value={ticketForm.priority} onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}>
                                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                                    </select></div>
                            </div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Description</label>
                                <textarea className="form-input" value={ticketForm.description || ""} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} rows={4} style={{ resize: "none" }} placeholder="Provide details about your request..." /></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTicketModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "rgba(34, 197, 94, 0.9)", color: "white", padding: "12px 20px", borderRadius: "8px", zIndex: 3000, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, animation: "fadeInUp 0.3s ease-out" }}>
                    <FiCheckCircle size={20} /> {toast}
                </div>
            )}
        </>
    );
}
