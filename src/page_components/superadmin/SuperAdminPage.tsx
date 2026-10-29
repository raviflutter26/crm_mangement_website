"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { FiAlertCircle, FiDownload, FiSearch, FiClock, FiRefreshCw, FiCheck } from "react-icons/fi";
import EmptyState from "@/components/common/EmptyState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

interface SuperAdminPageProps {
    slug: string;
    title: string;
    subtitle: string;
    icon?: any;
    /** Kept for existing callers; module pages no longer render an action that does nothing. */
    primaryActionLabel?: string;
}

/**
 * Shell for the superadmin module pages. It shows what /api/superadmin/modules/:slug
 * really returns — stats, and a table when there are rows — and says plainly when a
 * module has no backend yet ({ available: false }) instead of showing invented
 * figures or an "Operational" badge.
 */
const COLUMN_LABELS: Record<string, string> = {
    name: "Name", email: "Email", plan: "Plan", status: "Status",
    updatedAt: "Updated", mfa: "MFA", lastLogin: "Last login",
};

const formatCell = (key: string, value: any) => {
    if (value == null || value === "") return "—";
    if ((key === "updatedAt" || key === "lastLogin") && !Number.isNaN(Date.parse(value))) {
        return new Date(value).toLocaleString();
    }
    return String(value);
};

export default function SuperAdminPage({ slug, title, subtitle, icon: Icon }: SuperAdminPageProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actingId, setActingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/api/superadmin/modules/${slug}`);
            setData(res.data.data);
            setError(null);
        } catch (err: any) {
            console.error(`Failed to load ${slug}`, err);
            setData(null);
            setError(err.response?.data?.message || `We could not load ${title.toLowerCase()}. Please retry in a moment.`);
        } finally {
            setLoading(false);
        }
    }, [slug, title]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const activateOrg = async (id: string) => {
        setActingId(id);
        try {
            await axiosInstance.patch(`/api/organizations/${id}/status`, { status: "active" });
            await fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || "Could not activate the organization.");
        } finally {
            setActingId(null);
        }
    };

    if (loading && !data) return (
        <div style={{ padding: "40px" }}>
            <LoadingSkeleton />
        </div>
    );

    const header = (actions?: React.ReactNode) => (
        <div className="page-header" style={{ marginBottom: '32px' }}>
            <div>
                <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h1>
                <p className="page-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{subtitle}</p>
            </div>
            {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
        </div>
    );

    if (error && !data) return (
        <div className="page-content" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
            {header(<button className="btn btn-secondary" onClick={fetchData}><FiRefreshCw /> Retry</button>)}
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--error)', padding: '24px' }}>
                <FiAlertCircle size={20} /> {error}
            </div>
        </div>
    );

    if (data?.available === false) return (
        <div className="page-content" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
            {header()}
            <div className="card" style={{ padding: '24px', display: 'flex', gap: '14px', alignItems: 'flex-start', borderLeft: '3px solid var(--text-muted)' }}>
                <FiClock size={20} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Not available yet</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.6 }}>
                        This area has no data source behind it yet, so there is nothing real to show or manage here.
                        Nothing on this page reflects the live platform.
                    </div>
                </div>
            </div>
        </div>
    );

    const stats = data?.stats || [];
    const rows: any[] = data?.rows || [];
    const columns: string[] = data?.columns || [];
    const rowAction: string | undefined = data?.rowAction;

    const exportCsv = () => {
        const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const csv = [columns.map(c => esc(COLUMN_LABELS[c] || c)).join(","), ...rows.map(r => columns.map(c => esc(formatCell(c, r[c]))).join(","))].join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${slug}-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '40px' }}>
            {header(rows.length > 0 && columns.length > 0
                ? <button className="btn btn-secondary" onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><FiDownload /> Export</button>
                : undefined)}

            {error && (
                <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--error)', marginBottom: '16px', fontSize: '13px' }}>
                    <FiAlertCircle /> {error}
                </div>
            )}

            {stats.length > 0 && (
                <div className="grid-3" style={{ marginBottom: '32px', gap: '20px' }}>
                    {stats.map((s: any, i: number) => (
                        <div key={i} className="card" style={{
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            borderLeft: `3px solid var(--${s.cls || 'primary'})`,
                            background: 'var(--bg-card)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label.toUpperCase()}</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{s.val}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.sub}</div>
                        </div>
                    ))}
                </div>
            )}

            {columns.length > 0 && rows.length > 0 ? (
                <div className="card">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    {columns.map(c => <th key={c}>{COLUMN_LABELS[c] || c}</th>)}
                                    {rowAction && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r: any) => (
                                    <tr key={r.id}>
                                        {columns.map(c => <td key={c} style={{ fontSize: '13px' }}>{formatCell(c, r[c])}</td>)}
                                        {rowAction === 'activate-org' && (
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-primary btn-sm" disabled={actingId === r.id} onClick={() => activateOrg(r.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <FiCheck /> {actingId === r.id ? 'Activating...' : 'Activate'}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div style={{ padding: "80px 40px" }}>
                    <EmptyState
                        title={`No ${title.toLowerCase()}`}
                        description="Nothing to show right now."
                        icon={Icon || FiSearch}
                    />
                </div>
            )}
        </div>
    );
}
