"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiShield, FiSmartphone, FiMonitor, FiCheckCircle, FiX, FiKey, FiGlobe, FiAlertTriangle, FiCopy } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import { useToast, useConfirm } from "@/components/common/DialogProvider";

const SSO_PROVIDERS: { value: string; label: string }[] = [
    { value: "none", label: "None" },
    { value: "google", label: "Google Workspace" },
    { value: "microsoft", label: "Microsoft Entra ID" },
];

export default function AuthenticationPage() {
    const toast = useToast();
    const confirmDialog = useConfirm();

    const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [ssoConfig, setSsoConfig] = useState<any>({ provider: "none", enabled: false, enforce: false, clientId: "", clientSecret: "", tenant: "", domain: "", notes: "" });
    // The SSO card is for admins; the API refuses everyone else.
    const [ssoAllowed, setSsoAllowed] = useState(false);
    const [loading, setLoading] = useState(true);

    // MFA setup wizard state
    const [setupStep, setSetupStep] = useState<"idle" | "scan" | "backup">("idle");
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [code, setCode] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [disablePassword, setDisablePassword] = useState("");
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [busy, setBusy] = useState(false);
    const [ssoSaving, setSsoSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const meRes = await axiosInstance.get("/api/auth/me");
            setMfaEnabled(!!meRes.data.data?.mfaEnabled);
        } catch (err) { console.error(err); }
        try {
            const sessionsRes = await axiosInstance.get(API_ENDPOINTS.SESSIONS);
            setSessions(sessionsRes.data.data || []);
        } catch (err) { console.error(err); }
        try {
            const ssoRes = await axiosInstance.get(API_ENDPOINTS.SSO_CONFIG);
            setSsoConfig({ ...ssoConfig, ...ssoRes.data.data, clientSecret: "" });
            setSsoAllowed(true);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const startMfaSetup = async () => {
        setBusy(true);
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.MFA_SETUP);
            setQrCode(res.data.data.qrCode);
            setSecret(res.data.data.secret);
            setSetupStep("scan");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to start MFA setup");
        } finally {
            setBusy(false);
        }
    };

    const verifyMfaCode = async () => {
        if (!code.trim()) {
            toast.error("Enter the 6-digit code from your authenticator app");
            return;
        }
        setBusy(true);
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.MFA_VERIFY, { code });
            setBackupCodes(res.data.data.backupCodes || []);
            setSetupStep("backup");
            setMfaEnabled(true);
            setCode("");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Invalid code");
        } finally {
            setBusy(false);
        }
    };

    const finishSetup = () => {
        setSetupStep("idle");
        setQrCode("");
        setSecret("");
        setBackupCodes([]);
    };

    const disableMfa = async () => {
        if (!disablePassword) {
            toast.error("Enter your password to confirm");
            return;
        }
        setBusy(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.MFA_DISABLE, { password: disablePassword });
            setMfaEnabled(false);
            setShowDisableModal(false);
            setDisablePassword("");
            toast.success("MFA disabled");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to disable MFA");
        } finally {
            setBusy(false);
        }
    };

    const revokeSession = async (id: string) => {
        const confirmed = await confirmDialog({ title: "Sign out this session?", description: "That device will need to log in again.", confirmLabel: "Sign out", danger: true });
        if (!confirmed) return;
        try {
            await axiosInstance.delete(`${API_ENDPOINTS.SESSIONS}/${id}`);
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to revoke session");
        }
    };

    const revokeAllOther = async () => {
        const confirmed = await confirmDialog({ title: "Sign out all other sessions?", description: "Every other device will need to log in again. This session stays active.", confirmLabel: "Sign out all", danger: true });
        if (!confirmed) return;
        try {
            await axiosInstance.post(API_ENDPOINTS.SESSIONS_REVOKE_ALL);
            toast.success("All other sessions signed out");
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to revoke sessions");
        }
    };

    const saveSsoConfig = async () => {
        setSsoSaving(true);
        try {
            // clientSecret is write-only: an empty field keeps the stored secret.
            const { clientSecret, ...rest } = ssoConfig;
            const res = await axiosInstance.put(API_ENDPOINTS.SSO_CONFIG, clientSecret ? { ...rest, clientSecret } : rest);
            setSsoConfig({ ...ssoConfig, ...res.data.data, clientSecret: "" });
            toast.success("SSO configuration saved");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save SSO configuration");
        } finally {
            setSsoSaving(false);
        }
    };

    const copyBackupCodes = () => {
        navigator.clipboard?.writeText(backupCodes.join("\n"));
        toast.success("Backup codes copied");
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>Loading...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Authentication</h1>
                    <p className="page-subtitle">Manage your account's multi-factor authentication, active sessions, and your organization's SSO configuration.</p>
                </div>
            </div>

            {/* MFA */}
            <div className="card" style={{ marginBottom: "24px" }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}><FiShield /> Two-Factor Authentication</h3>
                </div>
                <div className="card-body" style={{ padding: "24px" }}>
                    {setupStep === "idle" && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                                    {mfaEnabled ? <><FiCheckCircle style={{ color: "#10b981" }} /> Enabled</> : "Not enabled"}
                                </div>
                                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                                    {mfaEnabled ? "Your account requires a code from your authenticator app to sign in." : "Add an authenticator app code as a second step when signing in."}
                                </p>
                            </div>
                            {mfaEnabled ? (
                                <button className="btn btn-secondary" style={{ color: "#ef4444" }} onClick={() => setShowDisableModal(true)}>Disable</button>
                            ) : (
                                <button className="btn btn-primary" onClick={startMfaSetup} disabled={busy}><FiSmartphone /> Set Up</button>
                            )}
                        </div>
                    )}

                    {setupStep === "scan" && (
                        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                            <div style={{ textAlign: "center" }}>
                                {qrCode && <img src={qrCode} alt="MFA QR code" style={{ width: "180px", height: "180px", borderRadius: "12px", border: "1px solid var(--border)" }} />}
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", fontFamily: "monospace" }}>{secret}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: "240px" }}>
                                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                                    Scan this QR code with an authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code it shows.
                                </p>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        className="form-input"
                                        placeholder="123456"
                                        value={code}
                                        onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                                        style={{ letterSpacing: "4px", fontWeight: 700, width: "140px" }}
                                    />
                                    <button className="btn btn-primary" onClick={verifyMfaCode} disabled={busy}>Verify</button>
                                    <button className="btn btn-secondary" onClick={() => setSetupStep("idle")} disabled={busy}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {setupStep === "backup" && (
                        <div>
                            <div style={{ display: "flex", gap: "10px", padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", marginBottom: "16px" }}>
                                <FiAlertTriangle style={{ color: "#d97706", flexShrink: 0 }} />
                                <div style={{ fontSize: "13px", color: "#92400e", fontWeight: 600 }}>Save these backup codes now — each can be used once if you lose access to your authenticator app. They won't be shown again.</div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "16px" }}>
                                {backupCodes.map(c => (
                                    <div key={c} style={{ fontFamily: "monospace", fontSize: "13px", padding: "8px", background: "var(--bg-secondary)", borderRadius: "6px", textAlign: "center" }}>{c}</div>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button className="btn btn-secondary" onClick={copyBackupCodes}><FiCopy /> Copy</button>
                                <button className="btn btn-primary" onClick={finishSetup}>Done</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sessions */}
            <div className="card" style={{ marginBottom: "24px" }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}><FiMonitor /> Active Sessions</h3>
                    {sessions.length > 1 && <button className="btn btn-secondary btn-sm" onClick={revokeAllOther}>Sign out all other sessions</button>}
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Device / Browser</th>
                                <th>IP Address</th>
                                <th>Last Active</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((s) => (
                                <tr key={s._id}>
                                    <td style={{ fontSize: "13px" }}>
                                        {s.userAgent ? s.userAgent.slice(0, 60) : 'Unknown device'}
                                        {s.current && <span style={{ marginLeft: "8px", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "10px", background: "#ecfdf5", color: "#10b981" }}>THIS DEVICE</span>}
                                    </td>
                                    <td style={{ fontSize: "13px", fontFamily: "monospace" }}>{s.ipAddress || '-'}</td>
                                    <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString() : '-'}</td>
                                    <td>
                                        {!s.current && (
                                            <button className="btn btn-secondary btn-sm" style={{ color: "#ef4444" }} onClick={() => revokeSession(s._id)}><FiX /> Sign out</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No active sessions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SSO Config */}
            {ssoAllowed && <div className="card">
                <div className="card-header">
                    <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}><FiGlobe /> Single Sign-On (SSO)</h3>
                </div>
                <div className="card-body" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", gap: "10px", padding: "12px 16px", background: ssoConfig.connected ? "#f0fdf4" : "#fffbeb", border: `1px solid ${ssoConfig.connected ? "#bbf7d0" : "#fde68a"}`, borderRadius: "10px", marginBottom: "20px" }}>
                        {ssoConfig.connected ? <FiCheckCircle style={{ color: "#16a34a", flexShrink: 0 }} /> : <FiAlertTriangle style={{ color: "#d97706", flexShrink: 0 }} />}
                        <div style={{ fontSize: "13px", color: ssoConfig.connected ? "#166534" : "#92400e", fontWeight: 600, lineHeight: 1.6 }}>
                            {ssoConfig.connected
                                ? "SSO is active. Users sign in with \"Sign in with SSO\" on the login page using their work email."
                                : "Register an OpenID Connect app with your identity provider, then enter its client ID and secret here."}
                            {ssoConfig.redirectUri && <> Redirect URI to register: <code style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{ssoConfig.redirectUri}</code></>}
                        </div>
                    </div>
                    <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Provider</label>
                            <select className="form-input" value={ssoConfig.provider} onChange={e => setSsoConfig({ ...ssoConfig, provider: e.target.value })}>
                                {SSO_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Email domain</label>
                            <input type="text" className="form-input" value={ssoConfig.domain || ""} onChange={e => setSsoConfig({ ...ssoConfig, domain: e.target.value })} placeholder="yourcompany.com" />
                        </div>
                    </div>
                    <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Client ID</label>
                            <input type="text" className="form-input" value={ssoConfig.clientId || ""} onChange={e => setSsoConfig({ ...ssoConfig, clientId: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Client secret</label>
                            <input type="password" autoComplete="new-password" className="form-input" value={ssoConfig.clientSecret || ""} onChange={e => setSsoConfig({ ...ssoConfig, clientSecret: e.target.value })} placeholder={ssoConfig.hasClientSecret ? "Stored — leave blank to keep" : "Paste the client secret"} />
                        </div>
                    </div>
                    {ssoConfig.provider === "microsoft" && (
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Directory (tenant) ID</label>
                            <input type="text" className="form-input" value={ssoConfig.tenant || ""} onChange={e => setSsoConfig({ ...ssoConfig, tenant: e.target.value })} placeholder="00000000-0000-0000-0000-000000000000" />
                        </div>
                    )}
                    <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                            <input type="checkbox" checked={!!ssoConfig.enabled} onChange={e => setSsoConfig({ ...ssoConfig, enabled: e.target.checked, enforce: e.target.checked ? ssoConfig.enforce : false })} />
                            Enable SSO sign-in
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, cursor: ssoConfig.enabled ? "pointer" : "not-allowed", opacity: ssoConfig.enabled ? 1 : 0.5 }}>
                            <input type="checkbox" disabled={!ssoConfig.enabled} checked={!!ssoConfig.enforce} onChange={e => setSsoConfig({ ...ssoConfig, enforce: e.target.checked })} />
                            Require SSO — disable password sign-in for everyone except the owner
                        </label>
                    </div>
                    <button className="btn btn-primary" onClick={saveSsoConfig} disabled={ssoSaving}><FiKey /> {ssoSaving ? "Saving..." : "Save Configuration"}</button>
                </div>
            </div>}

            {showDisableModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "32px" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px" }}>Disable Two-Factor Authentication</h2>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>Enter your password to confirm.</p>
                        <input type="password" className="form-input" value={disablePassword} onChange={e => setDisablePassword(e.target.value)} placeholder="Password" style={{ marginBottom: "20px" }} />
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowDisableModal(false); setDisablePassword(""); }} disabled={busy}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1, background: "#ef4444" }} onClick={disableMfa} disabled={busy}>Disable</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
