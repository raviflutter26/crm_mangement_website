"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiMail, FiPhoneCall, FiCheck, FiClock, FiLoader, FiAlertCircle,
    FiUsers, FiTarget, FiCheckCircle
} from "react-icons/fi";
import { motion } from "framer-motion";

interface DemoRequest {
    _id: string;
    name: string;
    /** Optional: the marketing lead form no longer asks for it. */
    company?: string;
    email: string;
    phone?: string;
    teamSize?: string;
    message?: string;
    status: "new" | "contacted" | "closed";
    createdAt: string;
}

export default function DemoRequestsPage() {
    const [requests, setRequests] = useState<DemoRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            setLoadError(null);
            const res = await axiosInstance.get("/api/demo-requests");
            setRequests(res.data?.data || []);
        } catch (err: any) {
            console.error("Failed to load demo requests", err);
            setRequests([]);
            setLoadError("We could not load demo requests. Please retry in a moment.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const markContacted = async (id: string) => {
        setUpdatingId(id);
        try {
            const res = await axiosInstance.patch(`/api/demo-requests/${id}/status`, { status: "contacted" });
            setRequests(prev => prev.map(r => (r._id === id ? res.data.data : r)));
        } catch (err) {
            console.error("Failed to update demo request", err);
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading && requests.length === 0) return <div className="loading-container"><FiLoader className="rotate" /></div>;

    const newRequests = requests.filter(r => r.status === "new");
    const contacted = requests.filter(r => r.status === "contacted");
    const closed = requests.filter(r => r.status === "closed");

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)" }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header"
                style={{ marginBottom: "32px" }}
            >
                <div>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 900 }}>Demo Requests</h1>
                    <p className="page-subtitle">Leads submitted through the "Request a demo" form on the marketing site.</p>
                </div>
            </motion.div>

            {loadError && (
                <div
                    role="alert"
                    style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "14px 16px", marginBottom: "24px",
                        borderRadius: "10px",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        background: "rgba(239, 68, 68, 0.08)",
                        color: "#ef4444", fontWeight: 600, fontSize: "13px",
                    }}
                >
                    <FiAlertCircle size={16} /> {loadError}
                </div>
            )}

            <div style={{ display: "flex", gap: "20px", marginBottom: "32px", flexWrap: "wrap" }}>
                <MetricCard label="NEW" val={newRequests.length} color="var(--primary)" icon={FiTarget} />
                <MetricCard label="CONTACTED" val={contacted.length} color="#3b82f6" icon={FiCheckCircle} />
                <MetricCard label="TOTAL" val={requests.length} color="#10b981" icon={FiUsers} />
            </div>

            {requests.length === 0 && !loadError ? (
                <div style={{ padding: "80px 40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No demo requests yet. Submissions from the marketing site's contact form will show up here.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                    {newRequests.length > 0 && (
                        <RequestSection title="New" items={newRequests} onMarkContacted={markContacted} updatingId={updatingId} />
                    )}
                    {contacted.length > 0 && (
                        <RequestSection title="Contacted" items={contacted} onMarkContacted={markContacted} updatingId={updatingId} />
                    )}
                    {closed.length > 0 && (
                        <RequestSection title="Closed" items={closed} onMarkContacted={markContacted} updatingId={updatingId} />
                    )}
                </div>
            )}
        </div>
    );
}

function RequestSection({ title, items, onMarkContacted, updatingId }: {
    title: string;
    items: DemoRequest[];
    onMarkContacted: (id: string) => void;
    updatingId: string | null;
}) {
    return (
        <section>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "2px", marginBottom: "16px", textTransform: "uppercase" }}>
                {title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {items.map((req, idx) => (
                    <RequestCard key={req._id} req={req} idx={idx} onMarkContacted={onMarkContacted} updating={updatingId === req._id} />
                ))}
            </div>
        </section>
    );
}

function RequestCard({ req, idx, onMarkContacted, updating }: {
    req: DemoRequest;
    idx: number;
    onMarkContacted: (id: string) => void;
    updating: boolean;
}) {
    const initials = req.name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?";
    const submittedAt = new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const mailtoHref = `mailto:${req.email}?subject=${encodeURIComponent("RIVO — following up on your demo request")}`;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card"
            style={{
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: "24px",
                border: "1px solid var(--border-light)",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
            }}
        >
            <div style={{
                width: "48px", height: "48px", borderRadius: "16px",
                background: "linear-gradient(135deg, var(--primary) 0%, #FF8C00 100%)",
                color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "16px", boxShadow: "0 10px 15px -3px rgba(255, 122, 0, 0.2)",
                flexShrink: 0,
            }}>
                {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                    {req.name}
                    {req.company && <span style={{ color: "#94a3b8", fontWeight: 600 }}> · {req.company}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                        <FiMail size={12} /> {req.email}
                    </span>
                    {req.phone && (
                        <a
                            href={`tel:${req.phone.replace(/[^+\d]/g, "")}`}
                            style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, textDecoration: "none" }}
                        >
                            <FiPhoneCall size={12} /> {req.phone}
                        </a>
                    )}
                    {req.teamSize && (
                        <span style={{
                            fontSize: "10px", fontWeight: 800, padding: "3px 10px", borderRadius: "100px",
                            background: "#f1f5f9", color: "#64748b", textTransform: "uppercase",
                        }}>
                            {req.teamSize} employees
                        </span>
                    )}
                    <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                        <FiClock size={12} /> {submittedAt}
                    </span>
                </div>
                {req.message && (
                    <div style={{ fontSize: "13px", color: "#475569", marginTop: "8px", maxWidth: "560px" }}>
                        "{req.message}"
                    </div>
                )}
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <a
                    href={mailtoHref}
                    className="btn btn-secondary"
                    style={{ padding: "10px 18px", fontWeight: 800, fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    <FiPhoneCall size={14} /> CONTACT
                </a>
                {req.status !== "contacted" && req.status !== "closed" && (
                    <button
                        className="btn btn-primary"
                        style={{ padding: "10px 18px", fontWeight: 800, fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}
                        onClick={() => onMarkContacted(req._id)}
                        disabled={updating}
                    >
                        {updating ? <FiLoader className="rotate" size={14} /> : <FiCheck size={14} />} MARK CONTACTED
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function MetricCard({ label, val, color, icon: Icon }: any) {
    return (
        <div className="card" style={{ padding: "16px 24px", flex: 1, minWidth: "180px", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "24px", fontWeight: 950, color }}>{val}</div>
            </div>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
                <Icon size={20} />
            </div>
        </div>
    );
}
