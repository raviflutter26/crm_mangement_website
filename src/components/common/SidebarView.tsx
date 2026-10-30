"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronDown, FiMoreVertical } from "react-icons/fi";
import { useAuth } from "@/lib/auth";
import { normalizePath } from "@/config/routes";

/** One menu entry, already filtered for the signed-in user. */
export interface MenuNode {
    id: string;
    label: string;
    /** A component (react-icons) or an already-rendered element. */
    icon?: React.ComponentType | React.ReactElement;
    href?: string;
    badge?: string;
    badgeColor?: "green" | "red" | "orange" | "gray";
    children?: MenuNode[];
}

export interface MenuSection { title: string; items: MenuNode[] }

/** Is `href` the current page or an ancestor of it? */
function isActiveHref(pathname: string, href?: string, exact = false) {
    if (!href) return false;
    const p = normalizePath(pathname);
    const h = normalizePath(href);
    return p === h || (!exact && h !== "/" && p.startsWith(h + "/"));
}

/**
 * The sidebar's look (unchanged from the original Sidebar) for a given list of
 * sections. The tenant Sidebar and the console sidebar each build their own
 * sections from their route registry and render through this.
 */
export default function SidebarView({ sections, subtitle, roleLabel }: { sections: MenuSection[]; subtitle: string; roleLabel: string }) {
    const pathname = usePathname() || "/";
    const { user, loading, logout } = useAuth();
    const [expanded, setExpanded] = useState<string[]>([]);

    // Open the parent of the current page so it is visible after navigation.
    // Adjusted while rendering when the page or menu changes (React's
    // "storing information from previous renders" pattern) rather than in an
    // effect. Both callers memoise `sections`, so this runs once per change.
    const [openedFor, setOpenedFor] = useState<{ pathname: string; sections: MenuSection[] } | null>(null);
    if (openedFor?.pathname !== pathname || openedFor?.sections !== sections) {
        setOpenedFor({ pathname, sections });
        const open = sections.flatMap(s => s.items)
            .filter(i => i.children?.some(c => isActiveHref(pathname, c.href)))
            .map(i => i.id);
        if (open.length) setExpanded(prev => Array.from(new Set([...prev, ...open])));
    }

    const toggle = (id: string) => setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    // The most specific matching href wins, so /payroll/runs does not also light up /payroll.
    const allHrefs = sections.flatMap(s => s.items.flatMap(i => [i.href, ...(i.children || []).map(c => c.href)])).filter(Boolean) as string[];
    const bestMatch = allHrefs.filter(h => isActiveHref(pathname, h)).sort((a, b) => b.length - a.length)[0];

    const renderBadge = (item: MenuNode) => item.badge ? (
        <span className={`sidebar-badge ${item.badgeColor || ""}`}
            style={{
                background: item.badgeColor === "orange" ? "var(--primary)" :
                    item.badgeColor === "gray" ? "var(--bg-hover)" :
                        item.badgeColor === "green" ? "var(--secondary)" :
                            item.badgeColor === "red" ? "rgba(139, 0, 0, 0.8)" : "var(--bg-hover)",
                color: "white",
            }}>
            {item.badge}
        </span>
    ) : null;

    const renderItem = (item: MenuNode, isSubItem = false): React.ReactNode => {
        const hasChildren = !!item.children?.length;
        const isExpanded = expanded.includes(item.id);
        const isActive = hasChildren
            ? item.children!.some(c => c.href === bestMatch)
            : item.href === bestMatch;
        const content = (
            <>
                {item.icon && <span className="sidebar-item-icon">{typeof item.icon === "function" ? <item.icon /> : item.icon}</span>}
                <span style={{ flex: 1 }}>{item.label}</span>
                {renderBadge(item)}
                {hasChildren && <FiChevronDown className={`sidebar-item-chevron ${isExpanded ? "expanded" : ""}`} />}
            </>
        );

        if (hasChildren) {
            return (
                <div key={item.id}>
                    <div className={`sidebar-item ${isActive ? "active" : ""}`} onClick={() => toggle(item.id)}>
                        {content}
                    </div>
                    {isExpanded && (
                        <div className="sidebar-sub-menu">
                            {item.children!.map(child => renderItem(child, true))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                key={item.id}
                href={item.href || "#"}
                className={isSubItem ? `sidebar-sub-item ${isActive ? "active" : ""}` : `sidebar-item ${isActive ? "active" : ""}`}
            >
                {content}
            </Link>
        );
    };

    if (loading || !user) {
        return (
            <aside className="sidebar loading" style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-light)" }}>
                <div className="sidebar-header">
                    <div style={{ height: "40px", width: "120px", background: "var(--bg-hover)", borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
                </div>
                <div className="sidebar-nav" style={{ padding: "20px" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} style={{ height: "35px", background: "var(--bg-hover)", borderRadius: "8px", marginBottom: "12px", animation: "pulse 1.5s infinite" }} />
                    ))}
                </div>
                <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
            </aside>
        );
    }

    return (
        <aside className="sidebar" style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-light)" }}>
            <div className="sidebar-header" style={{ borderBottom: "none", paddingBottom: "10px" }}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon" style={{ background: "transparent" }}>
                        <img src="/rivo-icon.png" alt="RIVO" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: "18px", color: "var(--text-primary)", background: "none", WebkitTextFillColor: "initial", fontWeight: 800 }}>RIVO</h2>
                        <p style={{ fontSize: "10px" }}>{subtitle}</p>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {sections.filter(s => s.items.length > 0).map(s => (
                    <div key={s.title} style={{ marginBottom: "24px" }}>
                        <div className="sidebar-section-title">{s.title}</div>
                        {s.items.map(item => renderItem(item))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer-profile">
                <div className="sidebar-profile-avatar">{user?.firstName?.charAt(0) || "R"}</div>
                <div className="sidebar-profile-info">
                    <div className="sidebar-profile-name">{user ? `${user.firstName} ${user.lastName}` : "RIVO"}</div>
                    <div className="sidebar-profile-role">{roleLabel}</div>
                </div>
                <div className="sidebar-profile-action" onClick={() => logout()} title="Sign out">
                    <FiMoreVertical />
                </div>
            </div>
        </aside>
    );
}
