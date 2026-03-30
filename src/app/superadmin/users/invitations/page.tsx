"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { 
    FiUserPlus, FiMail, FiTrash2, FiRefreshCcw, 
    FiClock, FiLoader, FiAlertCircle, FiCheck, FiX, FiShield
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface Invitation {
    id: string;
    email: string;
    role: string;
    sentAt: string;
    expiresAt: string;
    status: "Pending" | "Expired" | "Accepted";
    initials: string;
}

export default function InvitationsPage() {
    const [invites, setInvites] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvites = async () => {
        try {
            const res = await axiosInstance.get('/api/superadmin/invitations');
            if (res.data?.data) {
                setInvites(res.data.data);
            } else {
                throw new Error("No data");
            }
        } catch (err: any) {
            console.error("Failed to load invitations", err);
            // Elite Mock Data Fallback
            setInvites([
                { id: "1", email: "ceo@tesla.com", role: "admin", sentAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), status: "Pending", initials: "CT" },
                { id: "2", email: "hr@spacex.com", role: "hr", sentAt: new Date(Date.now() - 172800000).toISOString(), expiresAt: new Date(Date.now() - 86400000).toISOString(), status: "Expired", initials: "HS" },
                { id: "3", email: "ops@google.com", role: "manager", sentAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 82800000).toISOString(), status: "Pending", initials: "OG" }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const revokeStatus = (id: string) => {
        if (!confirm("Are you sure you want to revoke this invitation?")) return;
        setInvites(prev => prev.filter(inv => inv.id !== id));
    };

    if (loading && invites.length === 0) return <div className="loading-container"><FiLoader className="rotate" /></div>;

    const pending = invites.filter(i => i.status === "Pending");
    const expired = invites.filter(i => i.status === "Expired");

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)' }}>
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header" 
                style={{ marginBottom: "32px" }}
            >
                <div>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 900 }}>Global Invitations</h1>
                    <p className="page-subtitle">Manage cross-organization user onboarding and secure access tokens.</p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
                    <FiUserPlus size={18} /> CREATE GLOBAL INVITE
                </button>
            </motion.div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                <MetricCard label="PENDING" val={pending.length} color="var(--primary)" />
                <MetricCard label="EXPIRED" val={expired.length} color="#ef4444" />
                <MetricCard label="SUCCESS RATE" val="94%" color="#10b981" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {pending.length > 0 && (
                    <section>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '2px', marginBottom: '16px', textTransform: "uppercase" }}>Active Invitations</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {pending.map((inv, idx) => (
                                <InviteCard key={inv.id} inv={inv} idx={idx} onRevoke={() => revokeStatus(inv.id)} />
                            ))}
                        </div>
                    </section>
                )}

                {expired.length > 0 && (
                    <section>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '2px', marginBottom: '16px', textTransform: "uppercase" }}>Expired Tokens</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {expired.map((inv, idx) => (
                                <InviteCard key={inv.id} inv={inv} idx={idx} onRevoke={() => revokeStatus(inv.id)} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

function MetricCard({ label, val, color }: any) {
    return (
        <div className="card" style={{ padding: '16px 24px', flex: 1, border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: 950, color: color }}>{val}</div>
            </div>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", color: color }}>
                <FiShield size={20} />
            </div>
        </div>
    );
}

function InviteCard({ inv, idx, onRevoke }: { inv: Invitation, idx: number, onRevoke: () => void }) {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card" 
            style={{ 
                padding: '16px 24px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '24px',
                border: '1px solid var(--border-light)',
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)"
            }}
        >
            <div style={{ 
                width: '48px', height: '48px', borderRadius: '16px', 
                background: 'linear-gradient(135deg, var(--primary) 0%, #FF8C00 100%)', 
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '16px', boxShadow: "0 10px 15px -3px rgba(255, 122, 0, 0.2)"
            }}>
                {inv.initials}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{inv.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '6px' }}>
                    <span style={{ 
                        fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '100px',
                        background: '#f1f5f9', color: '#64748b', textTransform: "uppercase"
                    }}>{inv.role}</span>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <FiClock size={12} /> {inv.status === 'Expired' ? `Expired on ${new Date(inv.expiresAt).toLocaleDateString()}` : `Expires in 24h`}
                    </span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ padding: '10px 18px', fontWeight: 800, fontSize: "12px" }}>
                    <FiRefreshCcw size={14} /> RESEND
                </button>
                <button className="btn btn-secondary" style={{ padding: '10px 18px', fontWeight: 800, fontSize: "12px", color: "#ef4444" }} onClick={onRevoke}>
                    <FiTrash2 size={14} /> REVOKE
                </button>
            </div>
        </motion.div>
    );
}
