"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useAuth } from "@/lib/auth";
import type { ModuleGrant } from "@/config/routes";

/**
 * The company's stored module grants (backend ModulePermission rows), loaded
 * once per session for the roles they apply to (admin, HR — as the Sidebar has
 * always done) and shared by the Sidebar and the RouteGuard so the menu and
 * the guard always agree.
 */
interface ModuleGrantsState { grants: ModuleGrant[]; ready: boolean }

const ModuleGrantsContext = createContext<ModuleGrantsState>({ grants: [], ready: true });

const ROLES_WITH_GRANTS = ["admin", "hr"];

export function ModuleGrantsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const role = String(user?.role || "").toLowerCase().trim();
    const wantsGrants = ROLES_WITH_GRANTS.includes(role);
    const [state, setState] = useState<ModuleGrantsState>({ grants: [], ready: !wantsGrants });

    useEffect(() => {
        if (!user?._id || !wantsGrants) { setState({ grants: [], ready: true }); return; }
        let cancelled = false;
        setState(s => ({ ...s, ready: false }));
        axiosInstance.get(API_ENDPOINTS.ROLE_PERMISSIONS)
            .then(res => { if (!cancelled) setState({ grants: Array.isArray(res.data?.data) ? res.data.data : [], ready: true }); })
            // Without grants the static registry roles apply, as before.
            .catch(() => { if (!cancelled) setState({ grants: [], ready: true }); });
        return () => { cancelled = true; };
    }, [user?._id, wantsGrants]);

    return <ModuleGrantsContext.Provider value={state}>{children}</ModuleGrantsContext.Provider>;
}

export const useModuleGrants = () => useContext(ModuleGrantsContext);
