"use client";

import { useEffect, useState } from "react";
import { FiSave, FiUser, FiShield, FiDollarSign, FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/lib/auth";

interface SettingsPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

/** Roles allowed to switch automatic payroll on or off (enforced by the API too). */
const AUTO_PAYROLL_ROLES = ["owner", "admin", "superadmin"];

const labelStyle = { display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" } as const;

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
    return (
        <label style={{ position: "relative", display: "inline-block", width: "50px", height: "24px", opacity: disabled ? 0.5 : 1, flexShrink: 0 }}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: "absolute", cursor: disabled ? "not-allowed" : "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: checked ? "var(--primary)" : "var(--bg-secondary)", borderRadius: "34px", transition: ".4s" }}></span>
            <span style={{ position: "absolute", height: "16px", width: "16px", left: "4px", bottom: "4px", backgroundColor: "white", borderRadius: "50%", transition: ".4s", transform: checked ? "translateX(26px)" : "translateX(0)" }}></span>
        </label>
    );
}

export default function SettingsPage({ showNotify }: SettingsPageProps) {
    const { user } = useAuth();
    const orgId = user?.organizationId || null;
    const role = String(user?.role || "").toLowerCase();
    const canToggleAutoPayroll = AUTO_PAYROLL_ROLES.includes(role);

    const [activeTab, setActiveTab] = useState("general");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Loaded from the organization record; nothing here is a placeholder.
    const [formData, setFormData] = useState({
        companyName: "",
        email: "",
        phone: "",
        timezone: "Asia/Kolkata",
        payDay: 1,
        autoPayrollEnabled: false,
        noticePeriodDays: 30,
    });
    const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

    const flash = (type: "success" | "error", message: string) => {
        setBanner({ type, message });
        showNotify?.(type === "success" ? "success" : "failure", message);
        setTimeout(() => setBanner(null), 4000);
    };

    useEffect(() => {
        if (!orgId) { setLoading(false); return; }
        (async () => {
            try {
                const res = await axiosInstance.get(`/api/organizations/${orgId}`);
                const org = res.data.data || {};
                setFormData({
                    companyName: org.name || "",
                    email: org.email || "",
                    phone: org.phone || "",
                    timezone: org.settings?.attendance?.timezone || "Asia/Kolkata",
                    payDay: org.settings?.payroll?.payDay ?? 1,
                    autoPayrollEnabled: !!org.settings?.payroll?.autoPayrollEnabled,
                    noticePeriodDays: org.settings?.exit?.noticePeriodDays ?? 30,
                });
                setLoadError(null);
            } catch (err: any) {
                setLoadError(err.response?.data?.message || "Could not load your organization's settings.");
            } finally {
                setLoading(false);
            }
        })();
    }, [orgId]);

    const handleSave = async (e: any) => {
        e.preventDefault();
        if (!orgId) return;
        setSaving(true);
        try {
            // The API writes settings by dotted path, so sending one section leaves the others intact.
            const payroll: Record<string, any> = { payDay: Number(formData.payDay) || 1 };
            if (canToggleAutoPayroll) payroll.autoPayrollEnabled = formData.autoPayrollEnabled;
            await axiosInstance.put(`/api/organizations/${orgId}`, {
                name: formData.companyName,
                email: formData.email,
                phone: formData.phone,
                settings: {
                    attendance: { timezone: formData.timezone },
                    payroll,
                    exit: { noticePeriodDays: Math.max(0, Number(formData.noticePeriodDays) || 0) },
                },
            });
            flash("success", "Settings saved.");
        } catch (err: any) {
            flash("error", err.response?.data?.message || "Settings could not be saved.");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwords.current || !passwords.next) return flash("error", "Enter your current and new password.");
        if (passwords.next !== passwords.confirm) return flash("error", "The new passwords do not match.");
        setSaving(true);
        try {
            const res = await axiosInstance.put('/api/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.next });
            const token = res.data?.data?.token;
            if (token && typeof window !== "undefined") localStorage.setItem("ravi_zoho_token", token);
            setPasswords({ current: "", next: "", confirm: "" });
            flash("success", "Password changed.");
        } catch (err: any) {
            flash("error", err.response?.data?.message || "Password could not be changed.");
        } finally {
            setSaving(false);
        }
    };

    const tabButton = (id: string, label: string, Icon: any) => (
        <button
            className={`btn ${activeTab === id ? "btn-secondary" : ""}`}
            style={{ justifyContent: "flex-start", background: activeTab === id ? "var(--bg-secondary)" : "transparent", border: "none" }}
            onClick={() => setActiveTab(id)}
        >
            <Icon /> {label}
        </button>
    );

    if (loading) {
        return <div style={{ padding: "40px", display: "flex", gap: "10px", alignItems: "center", color: "var(--text-muted)" }}><FiLoader /> Loading settings...</div>;
    }

    const orgEditable = !!orgId && !loadError;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Configure your HR & Payroll preferences</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {activeTab !== "security" && (
                        <button className="btn btn-primary" onClick={handleSave} disabled={!orgEditable || saving}>
                            <FiSave /> {saving ? "Saving..." : "Save Changes"}
                        </button>
                    )}
                </div>
            </div>

            {!orgId && (
                <div className="card" style={{ padding: "16px", marginBottom: "16px", color: "var(--text-secondary)" }}>
                    Organization settings belong to a tenant. Your account is not part of an organization, so only your password can be changed here.
                </div>
            )}
            {loadError && (
                <div role="alert" style={{ padding: "12px 16px", marginBottom: "16px", borderRadius: "8px", color: "#ef4444", background: "rgba(239,68,68,0.08)", display: "flex", gap: "8px", alignItems: "center" }}>
                    <FiAlertCircle /> {loadError}
                </div>
            )}

            <div style={{ display: "flex", gap: "20px" }}>
                <div className="card" style={{ width: "250px", flexShrink: 0, padding: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        {tabButton("general", "Organization Profile", FiUser)}
                        {tabButton("payroll", "Payroll", FiDollarSign)}
                        {tabButton("security", "Password", FiShield)}
                    </div>
                </div>

                <div className="card" style={{ flex: 1, minHeight: "60vh" }}>
                    <div className="card-header">
                        <h3 className="card-title">
                            {activeTab === "general" && "Organization Profile"}
                            {activeTab === "payroll" && "Payroll"}
                            {activeTab === "security" && "Change Password"}
                        </h3>
                    </div>

                    <form onSubmit={handleSave} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                        {activeTab === "general" && (
                            <>
                                <div>
                                    <label style={labelStyle}>Company Name</label>
                                    <input type="text" className="form-input" disabled={!orgEditable} value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Company Email</label>
                                    <input type="email" className="form-input" disabled={!orgEditable} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone</label>
                                    <input type="text" className="form-input" disabled={!orgEditable} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label style={labelStyle}>System Timezone</label>
                                    <select className="form-input" disabled={!orgEditable} value={formData.timezone} onChange={e => setFormData({ ...formData, timezone: e.target.value })}>
                                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                        <option value="America/New_York">America/New_York (EST)</option>
                                        <option value="UTC">UTC</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {activeTab === "payroll" && (
                            <>
                                <div>
                                    <label style={labelStyle}>Pay Day (day of month)</label>
                                    <input type="number" min={1} max={31} className="form-input" disabled={!orgEditable} value={formData.payDay} onChange={e => setFormData({ ...formData, payDay: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label style={labelStyle} htmlFor="noticePeriodDays">Notice period (days)</label>
                                    <input id="noticePeriodDays" type="number" min={0} max={365} className="form-input" disabled={!orgEditable} value={formData.noticePeriodDays} onChange={e => setFormData({ ...formData, noticePeriodDays: Number(e.target.value) })} />
                                    <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>Used for resignations. Days not served are recovered in the full and final settlement.</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "15px", background: "var(--bg-primary)", borderRadius: "8px" }}>
                                    <div>
                                        <h4 style={{ margin: "0 0 5px 0", fontSize: "15px" }}>Automatic Payroll</h4>
                                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                                            Let the scheduler run this organization&apos;s monthly payroll without someone starting it.
                                            {!canToggleAutoPayroll && " Only an owner or admin can change this."}
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={formData.autoPayrollEnabled}
                                        disabled={!orgEditable || !canToggleAutoPayroll}
                                        onChange={v => setFormData({ ...formData, autoPayrollEnabled: v })}
                                    />
                                </div>
                            </>
                        )}

                        {activeTab === "security" && (
                            <>
                                <div>
                                    <label style={labelStyle}>Current Password</label>
                                    <input type="password" className="form-input" placeholder="Enter current password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
                                </div>
                                <div>
                                    <label style={labelStyle}>New Password</label>
                                    <input type="password" className="form-input" placeholder="Enter new password" value={passwords.next} onChange={e => setPasswords({ ...passwords, next: e.target.value })} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Confirm New Password</label>
                                    <input type="password" className="form-input" placeholder="Confirm new password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
                                </div>
                                <div style={{ marginTop: "10px" }}>
                                    <button type="button" className="btn btn-secondary" disabled={saving} onClick={handleChangePassword}>Update Password</button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>

            {banner && (
                <div style={{
                    position: "fixed", bottom: "20px", right: "20px",
                    background: banner.type === "success" ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)", color: "white",
                    padding: "12px 20px", borderRadius: "8px", zIndex: 3000,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px",
                    fontWeight: 600, animation: "fadeIn 0.3s ease-out"
                }}>
                    {banner.type === "success" ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />} {banner.message}
                </div>
            )}
        </>
    );
}
