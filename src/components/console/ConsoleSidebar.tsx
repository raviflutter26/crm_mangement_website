"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { CONSOLE_GROUPS, CONSOLE_PARENTS, CONSOLE_ROUTES, type ConsoleCountKey, type ConsoleRoute } from "@/config/consoleRoutes";
import SidebarView, { type MenuNode, type MenuSection } from "@/components/common/SidebarView";

/** The platform console's sidebar, generated from src/config/consoleRoutes.ts. */
export default function ConsoleSidebar() {
    const { user } = useAuth();
    const [counts, setCounts] = useState<Partial<Record<ConsoleCountKey, number>>>({});

    useEffect(() => {
        if (!user?._id) return;
        const load = async () => {
            try {
                const res = await axiosInstance.get("/api/superadmin/sidebar-counts");
                if (res.data?.data) setCounts(res.data.data);
            } catch { /* badges are optional */ }
        };
        load();
        const timer = setInterval(load, 60000);
        return () => clearInterval(timer);
    }, [user?._id]);

    const sections = useMemo<MenuSection[]>(() => {
        const badge = (key?: ConsoleCountKey) => (key && counts[key] ? String(counts[key]) : undefined);
        const node = (r: ConsoleRoute): MenuNode => ({ id: r.path, label: r.label, icon: r.icon, href: r.path, badge: badge(r.count), badgeColor: r.countColor });
        const menu = CONSOLE_ROUTES.filter(r => r.menu !== false);
        return CONSOLE_GROUPS.map(title => {
            const items: MenuNode[] = [];
            const seen = new Set<string>();
            for (const r of menu) {
                if (r.group !== title) continue;
                if (r.parent) {
                    if (seen.has(r.parent)) continue;
                    seen.add(r.parent);
                    const p = CONSOLE_PARENTS[r.parent];
                    items.push({
                        id: `parent:${r.parent}`, label: p.label, icon: p.icon,
                        badge: badge(p.count), badgeColor: p.countColor,
                        children: menu.filter(c => c.parent === r.parent).map(node),
                    });
                } else {
                    items.push(node(r));
                }
            }
            return { title, items };
        });
    }, [counts]);

    return <SidebarView sections={sections} subtitle="Platform Console" roleLabel="RIVO Platform Team" />;
}
