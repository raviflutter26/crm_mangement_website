"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiSearch, FiBell, FiMoon, FiSun, FiChevronDown, FiLogOut, FiCheck } from "react-icons/fi";

dayjs.extend(relativeTime);

type AppNotification = {
    _id: string;
    title: string;
    message: string;
    type?: string;
    isRead: boolean;
    link?: string | null;
    createdAt: string;
};

const POLL_MS = 60_000;
const LIST_SIZE = 10;

/** Only in-app paths are followed; the API never stores anything else, but don't trust it blindly. */
const isInternalLink = (link?: string | null): link is string =>
    typeof link === "string" && link.startsWith("/") && !link.startsWith("//");

/**
 * Bell with unread count and the latest notifications.
 *
 * Polls every minute and whenever the window regains focus, but only while
 * someone is signed in: logging out clears the interval and the listeners, so
 * a signed-out tab never hits the API (a 401 would bounce it to /login).
 */
function NotificationBell({ active }: { active: boolean }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<AppNotification[]>([]);
    const [unread, setUnread] = useState(0);
    const [loadError, setLoadError] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS, { params: { limit: LIST_SIZE } });
            setItems(res.data?.data || []);
            setUnread(res.data?.unreadCount || 0);
            setLoadError(false);
        } catch {
            setLoadError(true);
        }
    }, []);

    useEffect(() => {
        if (!active) {
            setItems([]);
            setUnread(0);
            setOpen(false);
            return;
        }
        load();
        const timer = window.setInterval(load, POLL_MS);
        const onFocus = () => load();
        const onVisible = () => { if (document.visibilityState === "visible") load(); };
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [active, load]);

    // Escape closes and hands focus back to the bell; a click outside closes.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };
        const onClick = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClick);
        };
    }, [open]);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next) load();
    };

    const openItem = async (n: AppNotification) => {
        if (!n.isRead) {
            setItems(prev => prev.map(i => (i._id === n._id ? { ...i, isRead: true } : i)));
            setUnread(u => Math.max(0, u - 1));
            try {
                await axiosInstance.patch(API_ENDPOINTS.NOTIFICATIONS_READ(n._id));
            } catch {
                load();
            }
        }
        if (isInternalLink(n.link)) {
            setOpen(false);
            router.push(n.link);
        }
    };

    const markAll = async () => {
        setItems(prev => prev.map(i => ({ ...i, isRead: true })));
        setUnread(0);
        try {
            await axiosInstance.patch(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
        } catch {
            load();
        }
    };

    if (!active) return null;

    const badge = unread > 99 ? "99+" : String(unread);
    const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

    return (
        <div style={{ position: "relative" }}>
            <button
                ref={buttonRef}
                type="button"
                className="topbar-btn"
                onClick={toggle}
                aria-label={label}
                aria-haspopup="true"
                aria-expanded={open}
                aria-controls="topbar-notifications"
                title="Notifications"
            >
                <FiBell aria-hidden="true" />
                {unread > 0 && (
                    <span className="topbar-badge" aria-hidden="true" style={unread > 9 ? { width: "auto", minWidth: 18, padding: "0 4px", borderRadius: 9 } : undefined}>
                        {badge}
                    </span>
                )}
            </button>

            {open && (
                <div
                    id="topbar-notifications"
                    ref={panelRef}
                    role="region"
                    aria-label="Notifications"
                    className="card animate-in"
                    style={{
                        position: "absolute", top: "110%", right: 0, width: 360, maxWidth: "calc(100vw - 32px)",
                        padding: 0, zIndex: 1000, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.35)", overflow: "hidden",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Notifications</div>
                        <button
                            type="button"
                            onClick={markAll}
                            disabled={unread === 0}
                            className="btn"
                            style={{ background: "transparent", border: "none", padding: "4px 6px", fontSize: 12, color: unread === 0 ? "var(--text-muted)" : "var(--primary)", cursor: unread === 0 ? "default" : "pointer" }}
                        >
                            <FiCheck aria-hidden="true" style={{ marginRight: 4 }} /> Mark all read
                        </button>
                    </div>

                    {loadError && items.length === 0 ? (
                        <div style={{ padding: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                            Couldn&apos;t load notifications.
                        </div>
                    ) : items.length === 0 ? (
                        <div style={{ padding: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                            You&apos;re all caught up.
                        </div>
                    ) : (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 420, overflowY: "auto" }}>
                            {items.map(n => (
                                <li key={n._id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <button
                                        type="button"
                                        onClick={() => openItem(n)}
                                        style={{
                                            display: "flex", gap: 10, width: "100%", textAlign: "left", padding: "10px 14px",
                                            background: n.isRead ? "transparent" : "var(--bg-hover)", border: "none", cursor: "pointer",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        <span
                                            aria-hidden="true"
                                            style={{ flex: "0 0 8px", height: 8, marginTop: 6, borderRadius: "50%", background: n.isRead ? "transparent" : "var(--primary)" }}
                                        />
                                        <span style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{ display: "block", fontWeight: n.isRead ? 500 : 700, fontSize: 13 }}>
                                                {n.title}
                                                {!n.isRead && <span className="sr-only"> (unread)</span>}
                                            </span>
                                            <span style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                                {n.message}
                                            </span>
                                            <time dateTime={n.createdAt} title={dayjs(n.createdAt).format("DD MMM YYYY, HH:mm")} style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                                                {dayjs(n.createdAt).fromNow()}
                                            </time>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Topbar() {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('ravi_zoho_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            setIsDark(true);
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            setIsDark(false);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('ravi_zoho_theme', newTheme);
        setIsDark(!isDark);
    };

    const userName = user ? `${user.firstName} ${user.lastName}`.trim() : "User";
    const userRole = user?.role || "Guest";

    const handleLogout = () => {
        logout();
    };

    // Read-only companies: known from /auth/me on load, or from the first refused change.
    const [readOnlyUntil, setReadOnlyUntil] = useState<string | null>(user?.readOnlyUntil ?? null);
    useEffect(() => { setReadOnlyUntil(user?.readOnlyUntil ?? null); }, [user?.readOnlyUntil]);
    useEffect(() => {
        const onReadOnly = (e: Event) => setReadOnlyUntil(String((e as CustomEvent).detail || new Date().toISOString()));
        window.addEventListener('rivo:read-only', onReadOnly);
        return () => window.removeEventListener('rivo:read-only', onReadOnly);
    }, []);

    return (
        <>
        {readOnlyUntil && (
            <div role="status" style={{ background: "#fef3c7", color: "#78350f", padding: "10px 16px", fontSize: "14px", fontWeight: 600, borderBottom: "1px solid #fcd34d" }}>
                Your company&apos;s subscription has ended. You can view and download data until{" "}
                {new Date(readOnlyUntil).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                , but nothing can be changed. {user?.role === "owner" ? "Contact RIVO to renew." : "Ask your company owner to renew."}
            </div>
        )}
        <header className="topbar">
            <div className="topbar-left">
                <div className="topbar-search">
                    <FiSearch className="topbar-search-icon" />
                    <input type="text" placeholder="Search employees, payroll, leaves..." />
                </div>
            </div>

            <div className="topbar-right">
                <button className="topbar-btn" onClick={toggleTheme} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                    {isDark ? <FiSun /> : <FiMoon />}
                </button>
                <NotificationBell active={Boolean(user)} />
                <div style={{ position: "relative" }}>
                    <div
                        className="topbar-user"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                    >
                        <div className="topbar-avatar">{userName.substring(0, 2).toUpperCase()}</div>
                        <div className="topbar-user-info">
                            <div className="topbar-user-name">{userName}</div>
                            <div className="topbar-user-role">{userRole}</div>
                        </div>
                        <FiChevronDown style={{ color: "var(--text-muted)", fontSize: "14px", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: ".3s" }} />
                    </div>

                    {dropdownOpen && (
                        <div className="card animate-in" style={{
                            position: "absolute", top: "110%", right: "0",
                            width: "180px", padding: "10px", zIndex: 1000,
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
                        }}>
                            <button
                                onClick={handleLogout}
                                className="btn"
                                style={{
                                    width: "100%", justifyContent: "flex-start",
                                    background: "transparent", color: "var(--error)", border: "none"
                                }}
                            >
                                <FiLogOut style={{ marginRight: "10px" }} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
        </>
    );
}
