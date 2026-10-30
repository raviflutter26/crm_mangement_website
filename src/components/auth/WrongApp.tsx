"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { APP_URL, CONSOLE_URL, isConsoleSurface, roleAllowedOnSurface } from "@/lib/surface";

/**
 * Shown when someone signs in on the wrong surface: a company user on the RIVO
 * console, or a RIVO team member on the company app. Points to the right
 * address and offers to sign out here.
 */
export default function WrongApp() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    // Nothing to explain if signed out, or if this surface is in fact theirs.
    useEffect(() => {
        if (loading) return;
        if (!user) router.replace("/login");
        else if (roleAllowedOnSurface(user.role)) router.replace("/dashboard");
    }, [loading, user, router]);

    const target = isConsoleSurface ? APP_URL : CONSOLE_URL;
    const title = isConsoleSurface ? "This is the RIVO platform console" : "This is the RIVO company app";
    const body = isConsoleSurface
        ? "The console is only for the RIVO platform team. Your account belongs to a company, so please sign in to the RIVO company app instead."
        : "Your account belongs to the RIVO platform team, which uses the separate RIVO console. Please sign in there instead.";

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "24px 16px", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 10px 30px rgba(15,23,42,0.08)", padding: "36px 32px", maxWidth: 460, width: "100%", textAlign: "center" }}>
                <img src="/rivo-icon.png" alt="RIVO" style={{ width: 44, height: 44, objectFit: "contain", marginBottom: 16 }} />
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>{title}</h1>
                <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 24px" }}>{body}</p>
                <a href={`${target}/login/`} className="btn btn-primary" style={{ display: "inline-flex", justifyContent: "center", width: "100%", marginBottom: 12 }}>
                    Go to {isConsoleSurface ? "the company app" : "the RIVO console"}
                </a>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16, wordBreak: "break-all" }}>{target}</div>
                {user && (
                    <button type="button" onClick={() => logout()} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                        Sign out here
                    </button>
                )}
            </div>
        </div>
    );
}
