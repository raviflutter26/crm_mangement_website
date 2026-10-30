"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import MyDashboard from "@/components/dashboard/MyDashboard";
import OperationsDashboard from "@/components/dashboard/OperationsDashboard";
import OwnerOverview from "@/components/dashboard/OwnerOverview";

/**
 * /dashboard — one URL for every company role, role-aware:
 *   owner (and admins with isGroupWide)  company-wide overview across branches,
 *                                        with the operations view one tab away
 *   admin / hr                           organisation overview
 *   manager                              team overview (scoped by the API)
 *   employee                             my dashboard (check-in, leave, timeline)
 */
export default function Dashboard() {
    const { user, checkAuth } = useAuth();
    const role = String(user?.role || "").toLowerCase();
    const groupWide = (user as { isGroupWide?: boolean } | null)?.isGroupWide;
    const [tab, setTab] = useState<"company" | "operations">("company");

    // The login response does not carry isGroupWide; reload the profile once for admins.
    const asked = useRef(false);
    useEffect(() => {
        if (role === "admin" && groupWide === undefined && !asked.current) {
            asked.current = true;
            checkAuth();
        }
    }, [role, groupWide, checkAuth]);

    if (role === "employee") return <MyDashboard />;

    const seesCompany = role === "owner" || (role === "admin" && groupWide === true);
    if (!seesCompany) return <OperationsDashboard />;

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: "8px 16px", borderRadius: 999, border: "1px solid var(--border, #E2E8F0)", cursor: "pointer", fontWeight: 700, fontSize: 13,
        background: active ? "var(--primary)" : "var(--bg-secondary, #fff)", color: active ? "#fff" : "var(--text-primary)",
    });
    return (
        <div>
            <div role="tablist" style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                <button type="button" role="tab" aria-selected={tab === "company"} style={tabStyle(tab === "company")} onClick={() => setTab("company")}>Company overview</button>
                <button type="button" role="tab" aria-selected={tab === "operations"} style={tabStyle(tab === "operations")} onClick={() => setTab("operations")}>Operations</button>
            </div>
            {tab === "company" ? <OwnerOverview /> : <OperationsDashboard />}
        </div>
    );
}
