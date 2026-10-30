"use client";

import { useEffect } from "react";

/**
 * Replaces an old URL with its new one, keeping the query string and hash.
 * Rendered by the pre-built pages under src/app/(legacy).
 */
export default function LegacyRedirect({ to }: { to: string }) {
    useEffect(() => {
        const { search, hash } = window.location;
        window.location.replace(`${to}${search}${hash}`);
    }, [to]);
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontFamily: "'Inter', sans-serif" }}>
            <p>This page has moved. Redirecting to <a href={to}>{to}</a>…</p>
        </div>
    );
}
