"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import {
    FiClock, FiSettings, FiAlertTriangle, FiSave, FiRefreshCw,
    FiCheckCircle, FiShield, FiSliders, FiAlertCircle
} from "react-icons/fi";
import EmptyState from "@/components/common/EmptyState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

interface AttendanceSettingsPageProps {
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

const DEFAULT_SETTINGS = {
    startTime: "09:00",
    endTime: "18:00",
    workingHours: 9,
    graceMinutes: 30,
    minHoursForPresent: 9.5,
    halfDayHours: 4.75,
    absentThreshold: 120,
    lateAfterGraceAction: "Late",
    timezone: "Asia/Kolkata",
    latePolicyEnabled: true,
    maxLateDaysPerMonth: 3,
    lateMarkType: "half_day",
};

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

const Toggle = ({ id, checked, onChange }: any) => (
    <div 
        id={id}
        onClick={() => onChange(!checked)} 
        style={{ 
            width: "44px", height: "24px", borderRadius: "12px", 
            background: checked ? "var(--primary)" : "var(--border)", 
            cursor: "pointer", position: "relative", transition: "0.3s" 
        }}
    >
        <div style={{ 
            width: "18px", height: "18px", borderRadius: "50%", background: "white", 
            position: "absolute", top: "3px", left: checked ? "23px" : "3px", 
            transition: "0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" 
        }} />
    </div>
);

export default function AttendanceSettingsPage({ showNotify }: AttendanceSettingsPageProps) {
    const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [original, setOriginal] = useState<any>(DEFAULT_SETTINGS);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.ATTENDANCE_SETTINGS);
            if (res.data.data) {
                setSettings(res.data.data);
                setOriginal(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load settings, using defaults", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Backend will handle versioning by creating a new document with effectiveFrom: now
            await axiosInstance.put(API_ENDPOINTS.ATTENDANCE_SETTINGS, settings);
            showNotify('success', "Attendance settings saved and versioned successfully!");
            setOriginal(settings);
            setHasChanges(false);
        } catch (err: any) {
            showNotify('failure', err.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setSettings(original);
        setHasChanges(false);
    };

    const update = (key: string, value: any) => {
        setSettings((s: any) => ({ ...s, [key]: value }));
        setHasChanges(true);
    };

    useEffect(() => { fetchSettings(); }, []);

    const inputStyle = {
        background: "var(--bg-secondary)",
        border: "1.5px solid var(--border)",
        borderRadius: "10px",
        padding: "8px 14px",
        color: "var(--text-primary)",
        fontSize: "14px",
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        outline: "none",
        transition: "border-color 0.2s ease",
        width: "140px",
    };

    const numInputStyle = { ...inputStyle, width: "90px", textAlign: "center" as const };

    if (loading) return <LoadingSkeleton />;
    if (!settings && !loading) return (
        <div style={{ padding: "80px 40px" }}>
            <EmptyState 
                title="Settings Unavailable"
                description="Failed to load attendance configurations. This might be due to a server connection issue."
                icon={FiSettings}
                actionLabel="Retry Loading"
                onAction={fetchSettings}
            />
        </div>
    );

    return (
        <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 style={{ fontSize: "26px", fontWeight: 900, margin: 0 }}>Attendance Settings</h1>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "5px 0 0" }}>Configure global attendance rules. Changes are versioned for audit trail.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {hasChanges && (
                        <button
                            id="attendance-settings-reset-btn"
                            onClick={handleReset}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "10px 18px", borderRadius: "12px",
                                background: "var(--bg-card)", color: "var(--text-secondary)",
                                border: "1.5px solid var(--border)", cursor: "pointer",
                                fontSize: "14px", fontWeight: 600
                            }}
                        >
                            <FiRefreshCw size={15} /> Reset
                        </button>
                    )}
                    <button
                        id="attendance-settings-save-btn"
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
                            transition: "all 0.2s ease", opacity: saving ? 0.7 : 1
                        }}
                    >
                        {saving ? <FiRefreshCw size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <FiSave size={15} />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                {/* Office Timings */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
                    <SectionHeader icon={FiClock} title="Office Timings" subtitle="Set working hours for the organization" color="var(--primary)" />

                    <FieldRow label="Office Start Time" hint="When employees should arrive">
                        <input id="settings-start-time" type="time" value={settings.startTime} onChange={e => update("startTime", e.target.value)} style={inputStyle} />
                    </FieldRow>
                    <FieldRow label="Office End Time" hint="Official end of working day">
                        <input id="settings-end-time" type="time" value={settings.endTime} onChange={e => update("endTime", e.target.value)} style={inputStyle} />
                    </FieldRow>
                    <FieldRow label="Minimum Hours for Present" hint="Hours needed to be marked Present">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input id="settings-min-present" type="number" step={0.1} min={0} value={settings.minHoursForPresent} onChange={e => update("minHoursForPresent", Number(e.target.value))} style={numInputStyle} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>hrs</span>
                        </div>
                    </FieldRow>
                    <FieldRow label="Half Day Threshold" hint="Minimum hours to avoid Absent mark">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input id="settings-half-day" type="number" step={0.1} min={0} value={settings.halfDayHours} onChange={e => update("halfDayHours", Number(e.target.value))} style={numInputStyle} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>hrs</span>
                        </div>
                    </FieldRow>
                    <FieldRow label="Grace Period" hint="Extra minutes before marking Late">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input id="settings-grace-minutes" type="number" min={0} max={60} value={settings.graceMinutes} onChange={e => update("graceMinutes", Number(e.target.value))} style={numInputStyle} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>mins</span>
                        </div>
                    </FieldRow>
                    <FieldRow label="Timezone" hint="Organization local timezone">
                        <select
                            id="settings-timezone"
                            value={settings.timezone}
                            onChange={e => update("timezone", e.target.value)}
                            style={{ ...inputStyle, width: "180px" }}
                        >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">New York (EST)</option>
                            <option value="Europe/London">London (GMT)</option>
                        </select>
                    </FieldRow>
                </div>

                {/* Late & Absent Policy */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
                    <SectionHeader icon={FiAlertTriangle} title="Late & Absent Rules" subtitle="Rules for late arrivals and penalties" color="#f59e0b" />

                    <FieldRow label="Absent Cutoff" hint="Minutes after start+grace to mark Absent">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input id="settings-absent-threshold" type="number" min={0} value={settings.absentThreshold} onChange={e => update("absentThreshold", Number(e.target.value))} style={numInputStyle} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>mins</span>
                        </div>
                    </FieldRow>

                    <FieldRow label="Action After Grace" hint="Status if check-in after grace period">
                        <select
                            id="settings-late-action"
                            value={settings.lateAfterGraceAction}
                            onChange={e => update("lateAfterGraceAction", e.target.value)}
                            style={{ ...inputStyle, width: "150px" }}
                        >
                            <option value="Late">Mark as Late</option>
                            <option value="HalfDay">Mark as Half Day</option>
                            <option value="Absent">Mark as Absent</option>
                        </select>
                    </FieldRow>

                    <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
                        <FieldRow label="Enable Late Penalty" hint="Deduct salary or mark half day after X lates">
                            <Toggle id="toggle-late-policy" checked={settings.latePolicyEnabled} onChange={(v: boolean) => update("latePolicyEnabled", v)} />
                        </FieldRow>

                        <div style={{ opacity: settings.latePolicyEnabled ? 1 : 0.4, transition: "opacity 0.3s", pointerEvents: settings.latePolicyEnabled ? "auto" : "none" }}>
                            <FieldRow label="Max Late Days / Month" hint="Allowed late arrivals per month">
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <input id="settings-max-late-days" type="number" min={1} max={30} value={settings.maxLateDaysPerMonth} onChange={e => update("maxLateDaysPerMonth", Number(e.target.value))} style={numInputStyle} />
                                    <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>days</span>
                                </div>
                            </FieldRow>
                            <FieldRow label="Late Penalty Type" hint="Action after exceeding limits">
                                <select
                                    id="settings-late-mark-type"
                                    value={settings.lateMarkType}
                                    onChange={e => update("lateMarkType", e.target.value)}
                                    style={{ ...inputStyle, width: "150px" }}
                                >
                                    <option value="half_day">Convert to Half Day</option>
                                    <option value="warning">System Warning</option>
                                </select>
                            </FieldRow>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rules Summary */}
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px", marginTop: "16px" }}>
                <SectionHeader icon={FiSliders} title="Rules Summary" subtitle="Calculated thresholds based on your settings" color="#10b981" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                    {[
                        { label: "Check-in Window", value: `${settings.startTime} + ${settings.graceMinutes}m`, color: "#FF7A00" },
                        { label: "Absent Threshold", value: `${settings.absentThreshold}m after grace`, color: "#ef4444" },
                        { label: "Daily Goal", value: `${settings.minHoursForPresent} hours`, color: "#10b981" },
                        { label: "Half Day Cutoff", value: `${settings.halfDayHours} hours`, color: "#3b82f6" },
                    ].map((item) => (
                        <div key={item.label} style={{
                            padding: "16px", borderRadius: "14px",
                            background: `${item.color}0f`,
                            border: `1px solid ${item.color}20`,
                            textAlign: "center"
                        }}>
                            <div style={{ fontSize: "18px", fontWeight: 900, color: item.color, marginBottom: "6px" }}>{item.value}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { opacity: 1; }
                input[type="time"]:focus, input[type="number"]:focus, select:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(255,122,0,0.15); }
            `}</style>
        </>
    );
}
