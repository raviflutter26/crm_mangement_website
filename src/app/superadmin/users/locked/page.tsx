"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiLoader, FiAlertCircle, FiLock, FiUnlock, FiRefreshCw, FiExternalLink, FiMapPin, FiCalendar, FiShield } from "react-icons/fi";

interface LockedAccount {
    id: number;
    name: string;
    email: string;
    initials: string;
    reason: string;
    reasonType: "security" | "billing" | "manual";
    lockedAt: string;
    failedAttempts: number | null;
    ip: string;
    location: string;
    plan: string;
}

export default function LockedAccountsPage() {
    const [accounts, setAccounts] = useState<LockedAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLocked = async () => {
            try {
                const res = await axiosInstance.get('/api/superadmin/locked-accounts');
                setAccounts(res.data.data);
                setError(null);
            } catch (err: any) {
                console.error("Failed to load locked accounts", err);
                setError("Locked accounts service unavailable.");
            } finally {
                setLoading(false);
            }
        };
        fetchLocked();
    }, []);

    const unlockStatus = async (id: number) => {
        if (!confirm("Are you sure you want to unlock this account?")) return;
        try {
            setAccounts(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error("Failed to unlock", err);
        }
    };

    if (loading) return <div className="loading-container"><FiLoader className="rotate" /></div>;
    if (error) return <div className="error-container"><FiAlertCircle /> {error}</div>;

    const stats = [
        { label: "LOCKED ACCOUNTS", val: accounts.length.toString(), color: "var(--error)" },
        { label: "SECURITY LOCKOUTS", val: accounts.filter(a => a.reasonType === 'security').length.toString() },
        { label: "BILLING FAILURES", val: accounts.filter(a => a.reasonType === 'billing').length.toString() },
        { label: "MANUAL SUSPENSIONS", val: accounts.filter(a => a.reasonType === 'manual').length.toString() }
    ];

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Locked & Suspended Accounts</h1>
                    <p className="page-subtitle">Administrative control over restricted user access.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {stats.map(s => (
                    <div key={s.label} className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{s.label}</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: s.color || 'var(--text-primary)' }}>{s.val}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {accounts.map(acc => (
                    <div key={acc.id} className="card" style={{ 
                        padding: '24px', 
                        borderLeft: '4px solid var(--error)',
                        background: 'var(--bg-card)',
                        borderTop: '1px solid var(--border-light)',
                        borderBottom: '1px solid var(--border-light)',
                        borderRight: '1px solid var(--border-light)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                            <div style={{ 
                                width: '48px', 
                                height: '48px', 
                                borderRadius: '50%', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                color: 'var(--error)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '18px'
                            }}>
                                {acc.initials}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{acc.name}</h3>
                                    <span style={{ 
                                        fontSize: '10px', 
                                        fontWeight: 700, 
                                        padding: '2px 8px', 
                                        borderRadius: '4px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--text-muted)'
                                    }}>{acc.plan.toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>{acc.email}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => unlockStatus(acc.id)}>
                                    <FiUnlock /> Unlock Account
                                </button>
                                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
                                    <FiRefreshCw /> Reset & Unlock
                                </button>
                            </div>
                        </div>

                        <div className="grid-4" style={{ gap: '12px', marginBottom: '20px' }}>
                            <DetailTile label="LOCKED SINCE" value={acc.lockedAt} icon={FiCalendar} />
                            <DetailTile label="IP ADDRESS" value={acc.ip} />
                            <DetailTile label="GEO LOCATION" value={acc.location} icon={FiMapPin} />
                            <DetailTile label="FAILED ATTEMPTS" value={acc.failedAttempts ? `${acc.failedAttempts} attempts` : '—'} color={acc.failedAttempts ? 'var(--error)' : 'var(--text-muted)'} />
                        </div>

                        <div style={{ 
                            background: 'rgba(239, 68, 68, 0.05)', 
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                             <FiShield style={{ color: 'var(--error)' }} />
                             <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}><strong>Reason:</strong> {acc.reason}</span>
                        </div>
                    </div>
                ))}

                {accounts.length === 0 && (
                    <div style={{ 
                        padding: '60px', 
                        textAlign: 'center', 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px dashed var(--border-light)',
                        borderRadius: '12px'
                    }}>
                        <FiUnlock size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>No locked accounts — all clear.</h3>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailTile({ label, value, icon: Icon, color }: any) {
    return (
        <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid var(--border-light)', 
            padding: '12px 16px', 
            borderRadius: '8px' 
        }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: color || 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {Icon && <Icon size={12} style={{ color: 'var(--text-muted)' }} />}
                {value}
            </div>
        </div>
    );
}
