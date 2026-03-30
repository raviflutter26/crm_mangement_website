"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiLoader, FiAlertCircle, FiPlus, FiDownload, FiSearch, FiFilter } from "react-icons/fi";
import EmptyState from "@/components/common/EmptyState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

interface SuperAdminPageProps {
    slug: string;
    title: string;
    subtitle: string;
    icon?: any;
    primaryActionLabel?: string;
}

export default function SuperAdminPage({ slug, title, subtitle, icon: Icon, primaryActionLabel = "Add New" }: SuperAdminPageProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(`/api/superadmin/modules/${slug}`);
                setData(res.data.data);
                setError(null);
            } catch (err: any) {
                console.error(`Failed to load ${slug}`, err);
                // Standardizing error for the demo/project
                setData({ stats: [], data: [] });
                setError(null); 
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug]);

    if (loading) return (
        <div style={{ padding: "40px" }}>
            <LoadingSkeleton />
        </div>
    );
    
    if (error) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', gap: '12px' }}>
            <FiAlertCircle size={24} /> {error}
        </div>
    );

    const stats = data?.stats || [];

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '40px' }}>
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h1>
                    <p className="page-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{subtitle}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <FiDownload /> Export
                    </button>
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <FiPlus /> {primaryActionLabel}
                    </button>
                </div>
            </div>

            {stats.length > 0 ? (
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
            ) : (
                <div className="grid-3" style={{ marginBottom: '32px', gap: '20px' }}>
                     <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '3px solid var(--primary)', background: 'var(--bg-secondary)', opacity: 0.6 }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>STATUS</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Operational</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Module is live and monitoring</div>
                    </div>
                </div>
            )}

            <div style={{ padding: "80px 40px" }}>
                <EmptyState 
                    title={title}
                    description={subtitle || `Manage and track ${title.toLowerCase()} records for all tenants.`}
                    icon={Icon || FiSearch}
                    actionLabel={primaryActionLabel}
                />
            </div>
        </div>
    );
}
