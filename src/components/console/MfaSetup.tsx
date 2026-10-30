"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiShield, FiCopy, FiLogOut } from "react-icons/fi";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useAuth } from "@/lib/auth";
import { roleAllowedOnSurface } from "@/lib/surface";
import { useMfaState } from "./ConsoleGuard";

/**
 * Mandatory MFA enrolment for the RIVO platform team. A console account
 * without MFA is sent here by ConsoleGuard and cannot reach any other console
 * page (the API refuses it too, with 403 MFA_SETUP_REQUIRED) until a code from
 * the authenticator app has been verified.
 */
export default function MfaSetup() {
    const { user, loading, logout, checkAuth } = useAuth();
    const router = useRouter();
    const { mfa, checking } = useMfaState();
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [code, setCode] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // Wrong place: signed out, not a console account, or already enrolled.
    useEffect(() => {
        if (loading || checking) return;
        if (!user) router.replace("/login");
        else if (!roleAllowedOnSurface(user.role)) router.replace("/wrong-app");
        else if (mfa === true && backupCodes.length === 0) router.replace("/dashboard");
    }, [loading, checking, user, mfa, backupCodes.length, router]);

    const start = async () => {
        setBusy(true); setError("");
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.MFA_SETUP);
            setQrCode(res.data.data.qrCode);
            setSecret(res.data.data.secret);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Could not start MFA setup.");
        } finally { setBusy(false); }
    };

    const verify = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true); setError("");
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.MFA_VERIFY, { code: code.trim() });
            setBackupCodes(res.data.data?.backupCodes || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "That code was not accepted.");
        } finally { setBusy(false); }
    };

    const finish = async () => {
        await checkAuth();          // reload the profile so mfaEnabled is now true
        router.replace("/dashboard");
    };

    if (loading || checking || !user) {
        return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontStyle: "italic" }}>Verifying access...</div>;
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "24px 16px", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 10px 30px rgba(15,23,42,0.08)", padding: "32px", maxWidth: 480, width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFF7ED", color: "#EA580C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}><FiShield /></div>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Set up two-step sign-in</h1>
                </div>
                <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 20px" }}>
                    The RIVO console requires multi-factor authentication. Until it is set up, no other console page is available.
                </p>

                {error && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: "10px 12px", borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{error}</div>}

                {backupCodes.length > 0 ? (
                    <div>
                        <p style={{ fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>MFA is on. Save these backup codes somewhere safe:</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontFamily: "monospace", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                            {backupCodes.map(c => <span key={c}>{c}</span>)}
                        </div>
                        <button type="button" className="btn btn-secondary" style={{ marginBottom: 16 }} onClick={() => navigator.clipboard?.writeText(backupCodes.join("\n"))}><FiCopy /> Copy codes</button>
                        <button type="button" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={finish}>Continue to the console</button>
                    </div>
                ) : !qrCode ? (
                    <button type="button" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy} onClick={start}>
                        {busy ? "Starting..." : "Start setup"}
                    </button>
                ) : (
                    <form onSubmit={verify}>
                        <p style={{ color: "#475569", fontSize: 14, margin: "0 0 12px" }}>Scan this code with an authenticator app, then enter the 6-digit code it shows.</p>
                        <div style={{ textAlign: "center", marginBottom: 12 }}>
                            <img src={qrCode} alt="MFA QR code" style={{ width: 180, height: 180, borderRadius: 12, border: "1px solid #E2E8F0" }} />
                            <div style={{ fontSize: 11, color: "#64748B", marginTop: 8, fontFamily: "monospace", wordBreak: "break-all" }}>{secret}</div>
                        </div>
                        <input className="form-input" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code} onChange={e => setCode(e.target.value)} style={{ width: "100%", marginBottom: 12 }} required />
                        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy || !code.trim()}>
                            {busy ? "Verifying..." : "Verify and turn on MFA"}
                        </button>
                    </form>
                )}

                <button type="button" onClick={() => logout()} style={{ marginTop: 20, background: "none", border: "none", color: "#64748B", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                    <FiLogOut /> Sign out
                </button>
            </div>
        </div>
    );
}
