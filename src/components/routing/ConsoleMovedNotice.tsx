"use client";

import { CONSOLE_URL } from "@/lib/surface";

/**
 * Shown at the old in-app console addresses: the RIVO platform console is now
 * a separate site (NEXT_PUBLIC_CONSOLE_URL).
 */
export default function ConsoleMovedNotice({ consolePath }: { consolePath: string }) {
    const href = `${CONSOLE_URL}${consolePath}`;
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "24px 16px", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 10px 30px rgba(15,23,42,0.08)", padding: "36px 32px", maxWidth: 460, width: "100%", textAlign: "center" }}>
                <img src="/rivo-icon.png" alt="RIVO" style={{ width: 44, height: 44, objectFit: "contain", marginBottom: 16 }} />
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>The RIVO console has moved</h1>
                <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 24px" }}>
                    Platform administration is no longer part of the company app. The RIVO team now signs in to the console at its own address.
                </p>
                <a href={href} className="btn btn-primary" style={{ display: "inline-flex", justifyContent: "center", width: "100%", marginBottom: 12 }}>Open the RIVO console</a>
                <div style={{ fontSize: 13, color: "#64748b", wordBreak: "break-all" }}>{CONSOLE_URL}</div>
                <a href="/login" style={{ display: "inline-block", marginTop: 16, fontSize: 14, color: "#64748b" }}>Company users: sign in here</a>
            </div>
        </div>
    );
}
