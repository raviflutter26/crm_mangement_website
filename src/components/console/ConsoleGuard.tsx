"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { roleAllowedOnSurface } from "@/lib/surface";
import { isConsoleRoute } from "@/config/consoleRoutes";

/** mfaEnabled comes from /api/auth/me; the login response does not carry it. */
export const mfaStateOf = (user: unknown): boolean | undefined =>
    (user as { mfaEnabled?: boolean } | null)?.mfaEnabled;

/**
 * Wait until the signed-in user's MFA state is known. The login response does
 * not include mfaEnabled, so when it is missing the profile is reloaded once
 * from /api/auth/me.
 */
export function useMfaState(): { mfa: boolean | undefined; checking: boolean } {
    const { user, checkAuth } = useAuth();
    const asked = useRef(false);
    const [checking, setChecking] = useState(false);
    const mfa = mfaStateOf(user);

    useEffect(() => {
        if (!user || mfa !== undefined || asked.current) return;
        asked.current = true;
        setChecking(true);
        checkAuth().finally(() => setChecking(false));
    }, [user, mfa, checkAuth]);

    return { mfa, checking: !!user && mfa === undefined && (checking || !asked.current) };
}

const Notice = ({ children }: { children: ReactNode }) => (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ textAlign: "center", maxWidth: 440, color: "#64748B" }}>{children}</div>
    </div>
);

/**
 * Guard for every console page: signed in, the RIVO platform role, MFA set up
 * (otherwise straight to /mfa-setup, nothing else is reachable), and a path
 * registered in src/config/consoleRoutes.ts. The API enforces the same MFA
 * rule (403 MFA_SETUP_REQUIRED).
 */
export default function ConsoleGuard({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname() || "/";
    const { mfa, checking } = useMfaState();

    const wrongSurface = !!user && !roleAllowedOnSurface(user.role);
    const needsMfa = !!user && !wrongSurface && !checking && mfa !== true;

    useEffect(() => {
        if (loading) return;
        if (!user) router.replace("/login");
        else if (wrongSurface) router.replace("/wrong-app");
        else if (needsMfa) router.replace("/mfa-setup");
    }, [loading, user, wrongSurface, needsMfa, router]);

    if (loading || !user || wrongSurface || checking || needsMfa) {
        return <Notice><p style={{ fontStyle: "italic" }}>Verifying access...</p></Notice>;
    }
    if (!isConsoleRoute(pathname)) {
        return (
            <Notice>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>Page not found</h1>
                <p style={{ margin: "8px 0 20px" }}>This address is not part of the RIVO console.</p>
                <Link href="/dashboard" className="btn btn-primary">Go to dashboard</Link>
            </Notice>
        );
    }
    return <>{children}</>;
}
