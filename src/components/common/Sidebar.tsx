"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import {
    TENANT_ROUTES, MENU_PARENTS, STAFF_GROUPS, SELF_GROUPS, roleMayUse,
    type TenantRoute, type BadgeKey,
} from "@/config/routes";
import { useModuleGrants } from "@/components/guards/ModuleGrants";
import SidebarView, { type MenuNode, type MenuSection } from "./SidebarView";

/**
 * The company app's sidebar, generated from the route registry
 * (src/config/routes.ts) and filtered by role plus the company's stored module
 * grants — the same check the RouteGuard applies, so a menu entry is shown
 * exactly when its page can be opened.
 */
export default function Sidebar() {
    const { user } = useAuth();
    const { grants } = useModuleGrants();
    const role = String(user?.role || "").toLowerCase().trim();
    const isEmployee = role === "employee";
    const [counts, setCounts] = useState<Record<BadgeKey, string>>({ employees: "", pendingLeaves: "" });

    useEffect(() => {
        if (!user?._id || isEmployee) return;
        const load = async () => {
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.DASHBOARD);
                const d = res.data?.data;
                if (d) setCounts({ employees: d.employees?.total?.toString() || "", pendingLeaves: d.leaves?.pending?.toString() || "" });
            } catch { /* badges are optional */ }
        };
        load();
        const timer = setInterval(load, 60000);
        return () => clearInterval(timer);
    }, [user?._id, isEmployee]);

    const sections = useMemo<MenuSection[]>(() => {
        const visible = TENANT_ROUTES.filter(r => r.menu !== false && roleMayUse(r, role, grants));
        const node = (r: TenantRoute): MenuNode => ({
            id: r.path,
            label: isEmployee && r.path === "/dashboard" ? "My Dashboard" : r.label,
            icon: r.icon,
            href: r.path,
            badge: r.badge ? counts[r.badge] || undefined : r.badgeText,
            badgeColor: r.badgeColor,
        });

        if (isEmployee) {
            return SELF_GROUPS.map(title => ({
                title,
                items: visible.filter(r => r.selfGroup === title).map(node),
            }));
        }

        return STAFF_GROUPS.map(title => {
            const items: MenuNode[] = [];
            const seenParents = new Set<string>();
            for (const r of visible) {
                const parentId = r.parent;
                const parent = parentId ? MENU_PARENTS[parentId] : undefined;
                if (parent) {
                    if (parent.group !== title || seenParents.has(parentId!)) continue;
                    if (!roleMayUse(parent, role, grants)) continue;
                    seenParents.add(parentId!);
                    const children = visible.filter(c => c.parent === parentId).map(node);
                    if (children.length) items.push({ id: `parent:${parentId}`, label: parent.label, icon: parent.icon, children });
                } else if (r.group === title) {
                    items.push(node(r));
                }
            }
            return { title, items };
        });
    }, [role, grants, counts, isEmployee]);

    const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) + (isEmployee ? "" : " Administrator") : "";
    return <SidebarView sections={sections} subtitle={isEmployee ? "Employee Self Service" : "Business Management"} roleLabel={roleLabel} />;
}
