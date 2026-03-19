"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import {
    FiClock, FiSettings, FiAlertTriangle, FiSave, FiRefreshCw,
    FiCheckCircle, FiShield, FiSliders
} from "react-icons/fi";

interface AttendanceSettingsPageProps {
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

const DEFAULT_SETTINGS = {
    startTime: "09:00",
    endTime: "18:00",
    workingHours: 9,
    graceMinutes: 30,
    latePolicyEnabled: true,
    maxLateDaysPerMonth: 3,
    lateMarkType: "half_day",
    permissionEnabled: true,
    maxPermissionCount: 4,
    maxPermissionHours: 4,
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

const Toggle = ({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) => (
    <button
        id={id}
        onClick={() => onChange(!checked)}
        style={{
            width: "48px", height: "26px", borderRadius: "13px",
            background: checked ? "var(--primary)" : "var(--bg-hover)",
            border: "none", cursor: "pointer",
            position: "relative", transition: "background 0.3s ease",
            flexShrink: 0,
            boxShadow: checked ? "0 0 0 3px rgba(255,122,0,0.2)" : "none"
        }}
        aria-checked={checked}
        role="switch"
    >
        <div style={{
            position: "absolute", top: "3px",
            left: checked ? "25px" : "3px",
            width: "20px", height: "20px", borderRadius: "50%",
            background: "white",
            transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)"
        }} />
    </button>
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
            setSettings(res.data.data);
            setOriginal(res.data.data);
        } catch (err) {
            console.error("Failed to load settings, using defaults", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosInstance.put(API_ENDPOINTS.ATTENDANCE_SETTINGS, settings);
            showNotify('success', "Attendance settings saved successfully!");
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

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Loading settings...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 style={{ fontSize: "26px", fontWeight: 900, margin: 0 }}>Attendance Settings</h1>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "5px 0 0" }}>Configure global attendance rules that apply to all employees</p>
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

            {hasChanges && (
                <div style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px",
                    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: "12px", marginBottom: "20px", color: "#f59e0b", fontSize: "13px", fontWeight: 600
                }}>
                    <FiAlertTriangle size={16} />
                    You have unsaved changes. Click "Save Changes" to apply them globally.
                </div>
            )}

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
                    <FieldRow label="Required Working Hours" hint="Hours per day to be considered present">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input id="settings-working-hours" type="number" min={1} max={12} value={settings.workingHours} onChange={e => update("workingHours", Number(e.target.value))} style={numInputStyle} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>hrs</span>
                        </div>
                    </FieldRow>
                    <FieldRow label="Grace Period" hint="Extra minutes before marking Late">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input id="settings-grace-minutes" type="number" min={0} max={60} value={settings.graceMinutes} onChange={e => update("graceMinutes", Number(e.target.value))} style={numInputStyle} />
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>mins</span>
                        </div>
                    </FieldRow>

                    {/* Preview */}
                    <div style={{ marginTop: "20px", padding: "14px 16px", background: "rgba(255,122,0,0.07)", borderRadius: "12px", border: "1px solid rgba(255,122,0,0.15)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>📋 Current Policy Preview</div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                            • Office: <strong>{settings.startTime}</strong> – <strong>{settings.endTime}</strong><br />
                            • On time if check-in by: <strong>{(() => { const [h, m] = settings.startTime.split(':').map(Number); const total = h * 60 + m + settings.graceMinutes; return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`; })()}</strong><br />
                            • Must work: <strong>{settings.workingHours} hours</strong> for full day
                        </div>
                    </div>
                </div>

                {/* Late Policy */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
                    <SectionHeader icon={FiAlertTriangle} title="Late Policy" subtitle="Rules for late arrivals and penalties" color="#f59e0b" />

                    <FieldRow label="Enable Late Policy" hint="Apply late tracking rules">
                        <Toggle id="toggle-late-policy" checked={settings.latePolicyEnabled} onChange={(v) => update("latePolicyEnabled", v)} />
                    </FieldRow>

                    <div style={{ opacity: settings.latePolicyEnabled ? 1 : 0.4, transition: "opacity 0.3s", pointerEvents: settings.latePolicyEnabled ? "auto" : "none" }}>
                        <FieldRow label="Late Days Before Penalty" hint="Max late arrivals per month before action">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input id="settings-max-late-days" type="number" min={1} max={30} value={settings.maxLateDaysPerMonth} onChange={e => update("maxLateDaysPerMonth", Number(e.target.value))} style={numInputStyle} />
                                <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>days</span>
                            </div>
                        </FieldRow>
                        <FieldRow label="Penalty Action" hint="What happens when late limit is exceeded">
                            <select
                                id="settings-late-mark-type"
                                value={settings.lateMarkType}
                                onChange={e => update("lateMarkType", e.target.value)}
                                style={{ ...inputStyle, width: "150px" }}
                            >
                                <option value="half_day">Mark Half Day</option>
                                <option value="warning">Issue Warning</option>
                            </select>
                        </FieldRow>
                    </div>

                    <div style={{ marginTop: "20px", padding: "14px 16px", background: "rgba(245,158,11,0.07)", borderRadius: "12px", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>⚠️ Late Rule Summary</div>
                        {settings.latePolicyEnabled ? (
                            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                                • After <strong>{settings.maxLateDaysPerMonth} late days</strong>/month<br />
                                • Action: <strong>{settings.lateMarkType === "half_day" ? "Mark as Half Day" : "Issue Warning"}</strong>
                            </div>
                        ) : (
                            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Late policy is currently disabled.</div>
                        )}
                    </div>

                    {/* Permission Policy */}
                    <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
                        <SectionHeader icon={FiShield} title="Permission Rules" subtitle="Limits on employee permission requests" color="#7C3AED" />
                        <FieldRow label="Enable Permissions" hint="Allow employees to request permissions">
                            <Toggle id="toggle-permission-policy" checked={settings.permissionEnabled} onChange={(v) => update("permissionEnabled", v)} />
                        </FieldRow>
                        <div style={{ opacity: settings.permissionEnabled ? 1 : 0.4, transition: "opacity 0.3s", pointerEvents: settings.permissionEnabled ? "auto" : "none" }}>
                            <FieldRow label="Max Permissions / Month" hint="Maximum number of permission requests">
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <input id="settings-max-permission-count" type="number" min={1} max={20} value={settings.maxPermissionCount} onChange={e => update("maxPermissionCount", Number(e.target.value))} style={numInputStyle} />
                                    <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>times</span>
                                </div>
                            </FieldRow>
                            <FieldRow label="Max Permission Hours / Month" hint="Maximum total hours for permissions">
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <input id="settings-max-permission-hours" type="number" min={1} max={40} value={settings.maxPermissionHours} onChange={e => update("maxPermissionHours", Number(e.target.value))} style={numInputStyle} />
                                    <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>hrs</span>
                                </div>
                            </FieldRow>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Reference */}
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px", marginTop: "16px" }}>
                <SectionHeader icon={FiSliders} title="Rules Summary" subtitle="How these settings apply across the system" color="#10b981" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                    {[
                        { label: "Check-in Window", value: `${settings.startTime} + ${settings.graceMinutes}m`, color: "#FF7A00" },
                        { label: "Daily Goal", value: `${settings.workingHours} hours`, color: "#10b981" },
                        { label: "Late Limit", value: `${settings.maxLateDaysPerMonth} days/month`, color: "#f59e0b" },
                        { label: "Permission Limit", value: `${settings.maxPermissionCount}x / ${settings.maxPermissionHours}h`, color: "#7C3AED" },
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
