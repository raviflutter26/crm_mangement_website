"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { FiLoader } from "react-icons/fi";

/**
 * Landing page for SSO. The API's /api/auth/sso/callback redirects here with
 * the session token in the URL fragment (#token=...), which never reaches a
 * server log or a Referer header. The fragment is wiped from the address bar
 * before anything else happens.
 */
export default function SsoCompletePage() {
    const { completeSsoLogin } = useAuth();
    const [error, setError] = useState("");
    const started = useRef(false);

    useEffect(() => {
        if (started.current || typeof window === "undefined") return;
        started.current = true;

        const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
        window.history.replaceState(null, "", window.location.pathname);

        if (!token) {
            setError("Sign-in did not return a session. Please try again.");
            return;
        }
        completeSsoLogin(token).catch((err: any) => {
            setError(err?.response?.data?.message || "Could not complete sign-in. Please try again.");
        });
    }, [completeSsoLogin]);

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            <div style={{ textAlign: "center", maxWidth: "420px", padding: "24px" }}>
                {error ? (
                    <>
                        <p style={{ color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>{error}</p>
                        <a href="/login" style={{ color: "#f97316", fontWeight: 600, fontSize: "14px" }}>Back to login</a>
                    </>
                ) : (
                    <p style={{ color: "#6b7280", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                        <FiLoader className="animate-spin" /> Signing you in…
                    </p>
                )}
            </div>
            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
