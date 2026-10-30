"use client";

import { useState, useEffect, Suspense } from "react";
import { FiLock, FiCheckCircle, FiLoader, FiShield } from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { errorMessage } from "@/lib/fetchError";
import { APP_URL, CONSOLE_URL, PASSWORD_SET_NOTICE, isConsoleSurface, roleAllowedOnSurface } from "@/lib/surface";
import type { ApiResponse, User } from "@/types/api";

/** What PUT /api/auth/reset-password/:token returns in `data`. */
type ResetResult = { user?: User; mfaRequired?: boolean; ssoRequired?: boolean };

/**
 * Sets a password from an emailed link (?token=…): an invitation or a reset.
 *
 * The API always links to the company app (`${WEBSITE_URL}/setup-password`),
 * the console has the same page at its own /setup-password. If the account
 * belongs to the other surface — a RIVO team member (superadmin) following
 * an invitation into the company app — the session the PUT just opened here
 * is closed and they are sent to the other surface's sign-in page with a
 * message, instead of landing on the "use the console" screen.
 */
function SetupPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }
        // Check the link up front so an expired one is reported before typing a password.
        let cancelled = false;
        axiosInstance.get<ApiResponse<{ email?: string }>>(`${API_ENDPOINTS.AUTH_RESET_PASSWORD}/${token}`)
            .then((res) => { if (!cancelled) setEmail(res.data?.data?.email || ""); })
            .catch((err) => { if (!cancelled) setError(errorMessage(err, "This link is invalid or has expired.")); });
        return () => { cancelled = true; };
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError("Passwords do not match");
        if (password.length < 8) return setError("Password must be at least 8 characters");

        setLoading(true);
        setError("");
        try {
            const res = await axiosInstance.put<ApiResponse<ResetResult>>(`${API_ENDPOINTS.AUTH_RESET_PASSWORD}/${token}`, { password });
            const role = res.data?.data?.user?.role;
            if (role && !roleAllowedOnSurface(role)) {
                // Wrong surface: close the session opened here and send them to theirs.
                await axiosInstance.post('/api/auth/logout').catch(() => undefined);
                const target = isConsoleSurface ? APP_URL : CONSOLE_URL;
                window.location.href = `${target}/login/?notice=${PASSWORD_SET_NOTICE}`;
                return;
            }
            router.push(`/login?notice=${PASSWORD_SET_NOTICE}`);
        } catch (err) {
            setError(errorMessage(err, "Failed to setup password"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", padding: "20px" }}>
            <div style={{ width: "100%", maxWidth: "450px", background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ display: "inline-flex", padding: "12px", background: "#F0F9FF", color: "#0084FF", borderRadius: "14px", marginBottom: "16px" }}>
                        <FiShield size={32} />
                    </div>
                    <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1E293B" }}>{isConsoleSurface ? "Set Your RIVO Console Password" : "Setup Your Workspace"}</h2>
                    <p style={{ fontSize: "14px", color: "#64748B", marginTop: "8px" }}>
                        Create a secure password for your account{email ? <> (<strong>{email}</strong>)</> : null}.
                    </p>
                </div>

                {error && (
                    <div style={{ background: "#FEF2F2", color: "#EF4444", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px", border: "1px solid #FEE2E2" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>New Password</label>
                        <div style={{ position: "relative" }}>
                            <FiLock style={{ position: "absolute", top: "14px", left: "14px", color: "#94A3B8" }} />
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ width: "100%", padding: "12px 12px 12px 42px", border: "1px solid #E2E8F0", borderRadius: "8px", outline: "none" }}
                                placeholder="Choose a strong password"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>Confirm Password</label>
                        <div style={{ position: "relative" }}>
                            <FiCheckCircle style={{ position: "absolute", top: "14px", left: "14px", color: "#94A3B8" }} />
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                style={{ width: "100%", padding: "12px 12px 12px 42px", border: "1px solid #E2E8F0", borderRadius: "8px", outline: "none" }}
                                placeholder="Repeat your password"
                            />
                        </div>
                    </div>

                    <p style={{ fontSize: "12px", color: "#64748B" }}>
                        * Password must be at least 8 characters and include a mixture of letters, numbers, and symbols.
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ background: "#0084FF", color: "#fff", border: "none", padding: "14px", borderRadius: "8px", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "10px" }}
                    >
                        {loading ? <FiLoader className="animate-spin" /> : "Complete Account Setup"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function SetupPassword() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
                <FiLoader className="animate-spin" size={32} color="#0084FF" />
            </div>
        }>
            <SetupPasswordForm />
        </Suspense>
    );
}
