"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { 
    FiShield, FiSave, FiRefreshCw, FiClock, 
    FiCalendar, FiHash, FiUsers, FiToggleRight 
} from "react-icons/fi";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

interface PermissionConfigPageProps {
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

const SectionHeader = ({ icon: Icon, title, subtitle, color }: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
            <Icon size={20} />
        </div>
        <div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>{title}</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, marginTop: "2px" }}>{subtitle}</p>
        </div>
    </div>
);

const FieldRow = ({ label, hint, children }: any) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
        <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
            {hint && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{hint}</div>}
        </div>
        {children}
    </div>
);

export default function PermissionConfigPage({ showNotify }: PermissionConfigPageProps) {
    const [config, setConfig] = useState<any>({
        monthlyPermissionHours: 3,
        monthlyPermissionMaxTimes: 3,
        minPermissionDurationMins: 30,
        maxPermissionDurationMins: 120,
        permissionTypes: ['early_leave', 'late_arrival', 'mid_day'],
        requiresManagerApproval: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/admin/config/permission');
            if (res.data.data && res.data.data._id) {
                setConfig(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load permission config", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosInstance.post('/api/admin/config/permission', config);
            showNotify('success', "Permission configuration updated and versioned.");
            setHasChanges(false);
        } catch (err: any) {
            showNotify('failure', err.response?.data?.message || "Failed to save config.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => { fetchConfig(); }, []);

    const inputStyle = {
        background: "var(--bg-secondary)",
        border: "1.5px solid var(--border)",
        borderRadius: "10px",
        padding: "8px 14px",
        color: "var(--text-primary)",
        fontSize: "14px",
        fontWeight: 600,
        outline: "none",
        width: "120px",
        textAlign: "center" as const
    };

    if (loading) return <LoadingSkeleton />;

    return (
        <div style={{ paddingBottom: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "26px", fontWeight: 900, margin: 0 }}>Permission Settings</h1>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "5px 0 0" }}>Manage short-leave quotas and business rules</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 22px", borderRadius: "12px",
                        background: hasChanges ? "var(--gradient-primary)" : "var(--bg-card)",
                        color: hasChanges ? "white" : "var(--text-muted)",
                        border: "none", cursor: hasChanges ? "pointer" : "default",
                        fontSize: "14px", fontWeight: 700,
                        boxShadow: hasChanges ? "0 4px 14px rgba(255,122,0,0.35)" : "none",
                    }}
                >
                    {saving ? <FiRefreshCw style={{ animation: "spin 1s linear infinite" }} /> : <FiSave />}
                    {saving ? "Saving..." : "Save Config"}
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Quotas */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
                    <SectionHeader icon={FiHash} title="Monthly Quotas" subtitle="Set limits for employee requests" color="#3b82f6" />
                    
                    <FieldRow label="Max Permission Hours" hint="Total hours allowed per month">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input type="number" value={config.monthlyPermissionHours} onChange={e => { setConfig({...config, monthlyPermissionHours: Number(e.target.value)}); setHasChanges(true); }} style={inputStyle} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>hrs</span>
                        </div>
                    </FieldRow>

                    <FieldRow label="Max Request Count" hint="Total number of permissions per month">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input type="number" value={config.monthlyPermissionMaxTimes} onChange={e => { setConfig({...config, monthlyPermissionMaxTimes: Number(e.target.value)}); setHasChanges(true); }} style={inputStyle} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>times</span>
                        </div>
                    </FieldRow>
                </div>

                {/* Durations */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
                    <SectionHeader icon={FiClock} title="Duration Rules" subtitle="Min and max limits for a single request" color="#7c3aed" />

                    <FieldRow label="Minimum Duration" hint="Shortest permission allowed">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input type="number" value={config.minPermissionDurationMins} onChange={e => { setConfig({...config, minPermissionDurationMins: Number(e.target.value)}); setHasChanges(true); }} style={inputStyle} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>mins</span>
                        </div>
                    </FieldRow>

                    <FieldRow label="Maximum Duration" hint="Longest permission allowed">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input type="number" value={config.maxPermissionDurationMins} onChange={e => { setConfig({...config, maxPermissionDurationMins: Number(e.target.value)}); setHasChanges(true); }} style={inputStyle} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>mins</span>
                        </div>
                    </FieldRow>
                </div>

                {/* Policies */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
                    <SectionHeader icon={FiToggleRight} title="Approval & Types" subtitle="Manage workflow and categories" color="#10b981" />

                    <FieldRow label="Requires Manager Approval" hint="Skip approval workflow if disabled">
                        <input type="checkbox" checked={config.requiresManagerApproval} onChange={e => { setConfig({...config, requiresManagerApproval: e.target.checked}); setHasChanges(true); }} style={{ width: "20px", height: "20px", accentColor: "var(--primary)" }} />
                    </FieldRow>

                    <FieldRow label="Allowed Types" hint="Which types are available to employees">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end", maxWidth: "250px" }}>
                            {['late_arrival', 'early_leave', 'mid_day'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        const newTypes = config.permissionTypes.includes(t) 
                                            ? config.permissionTypes.filter((x: string) => x !== t)
                                            : [...config.permissionTypes, t];
                                        setConfig({...config, permissionTypes: newTypes});
                                        setHasChanges(true);
                                    }}
                                    style={{
                                        padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                                        background: config.permissionTypes.includes(t) ? "var(--primary)" : "var(--bg-card)",
                                        color: config.permissionTypes.includes(t) ? "white" : "var(--text-muted)",
                                        border: "1px solid var(--border)", cursor: "pointer"
                                    }}
                                >
                                    {t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </button>
                            ))}
                        </div>
                    </FieldRow>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
