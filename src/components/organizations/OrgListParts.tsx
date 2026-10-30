"use client";

/**
 * Leaf components of the console's organization list (OrganizationListPage).
 * They use only Tailwind classes and inline styles, never the page's scoped
 * <style jsx> classes, so they render the same outside it. The menu's
 * `orgFadeScaleIn` animation is defined by that page.
 */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiEdit2, FiTrash2, FiEye, FiKey, FiCheckCircle, FiXCircle, FiMoreVertical } from "react-icons/fi";

export const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; dot: string; cls: string }> = {
        active: {
            label: "Active",
            dot: "bg-emerald-400",
            cls: "bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-[0_1px_3px_rgba(16,185,129,0.1)]"
        },
        suspended: {
            label: "Suspended",
            dot: "bg-red-400",
            cls: "bg-red-50 text-red-600 border-red-200/60 shadow-[0_1px_3px_rgba(239,68,68,0.1)]"
        },
        read_only: {
            label: "Read-only",
            dot: "bg-orange-400",
            cls: "bg-orange-50 text-orange-700 border-orange-200/60 shadow-[0_1px_3px_rgba(249,115,22,0.1)]"
        },
        pending: {
            label: "Pending",
            dot: "bg-amber-400",
            cls: "bg-amber-50 text-amber-700 border-amber-200/60 shadow-[0_1px_3px_rgba(245,158,11,0.1)]"
        },
        inactive: {
            label: "Inactive",
            dot: "bg-slate-400",
            cls: "bg-slate-50 text-slate-600 border-slate-200/60 shadow-[0_1px_3px_rgba(71,85,105,0.1)]"
        },
    };
    const s = map[status] ?? map["pending"];
    return (
        <span className={`inline-flex items-center gap-2 px-2 py-2 rounded-full text-[10px] font-semibold border tracking-wider uppercase ${s.cls}`}>
            <span className={`w-2 h-2 rounded-full ${s.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
            {s.label}
        </span>
    );
};

export const PlanBadge = ({ plan }: { plan: string }) => {
    const map: Record<string, string> = {
        Starter: "bg-slate-50 text-slate-600 border-slate-200/80",
        Professional: "bg-blue-50 text-blue-600 border-blue-200/60",
        Enterprise: "bg-violet-50 text-violet-600 border-violet-200/60",
    };
    return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-semibold border uppercase tracking-wider ${map[plan] ?? map["Starter"]}`}>
            {plan}
        </span>
    );
};

export const SkeletonRow = () => (
    <tr className="animate-pulse">
        {[...Array(6)].map((_, i) => (
            <td key={i} className="px-6 py-5">
                <div className="h-4 bg-slate-100 rounded-md" style={{ width: `${[60, 40, 50, 30, 40, 20][i]}%` }} />
            </td>
        ))}
    </tr>
);

const ACTION_MENU_WIDTH = 224; // w-56
const ACTION_MENU_HEIGHT = 340; // approx rendered height of the 5 menu items + divider + padding

interface ActionMenuProps {
    org: { status: string };
    onView: () => void;
    onEdit: () => void;
    onImpersonate: () => void;
    onToggle: () => void;
    onDelete: () => void;
}

/** The row's "⋮" menu, portalled to <body> so the table's overflow does not clip it. */
export const ActionMenu = ({ org, onView, onEdit, onImpersonate, onToggle, onDelete }: ActionMenuProps) => {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const computeCoords = () => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        const openUpward = window.innerHeight - rect.bottom < ACTION_MENU_HEIGHT && rect.top > ACTION_MENU_HEIGHT;
        setCoords({
            left: Math.max(8, rect.right - ACTION_MENU_WIDTH),
            top: openUpward ? rect.top - ACTION_MENU_HEIGHT - 8 : rect.bottom + 8,
        });
    };

    const handleToggle = () => {
        if (!open) computeCoords();
        setOpen(v => !v);
    };

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);
        return () => {
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, [open]);

    return (
        <div className="relative" tabIndex={0} onBlur={() => setTimeout(() => setOpen(false), 150)}>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-90"
            >
                <FiMoreVertical size={16} />
            </button>
            {open && coords && typeof document !== "undefined" && createPortal(
                <div
                    className="fixed z-50 bg-white border border-slate-200/80 rounded-2xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.12),0_4px_8px_-2px_rgba(0,0,0,0.06)] overflow-hidden p-2"
                    style={{ width: ACTION_MENU_WIDTH, top: coords.top, left: coords.left, animation: 'orgFadeScaleIn 0.15s ease-out' }}
                >
                    {[
                        { label: "View Details", icon: FiEye, onClick: onView, cls: "text-slate-600 hover:bg-slate-50 hover:text-slate-900" },
                        { label: "Edit Details", icon: FiEdit2, onClick: onEdit, cls: "text-blue-600 hover:bg-blue-50 hover:text-blue-700" },
                        { label: "Login as Admin", icon: FiKey, onClick: onImpersonate, cls: "text-[#FF7A00] hover:bg-orange-50" },
                        {
                            label: org.status === "active" ? "Suspend" : "Activate",
                            icon: org.status === "active" ? FiXCircle : FiCheckCircle,
                            onClick: onToggle,
                            cls: org.status === "active" ? "text-red-500 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                        },
                        { label: "Delete", icon: FiTrash2, onClick: onDelete, cls: "text-slate-400 hover:bg-red-50 hover:text-red-600" },
                    ].map(({ label, icon: Icon, onClick, cls }, idx) => (
                        <div key={label}>
                            {idx === 3 && <div className="h-px bg-slate-100 mx-2 my-1.5" />}
                            <button
                                onClick={() => { onClick(); setOpen(false); }}
                                className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-[15px] font-black transition-all duration-200 ${cls}`}
                            >
                                <Icon size={20} /> {label}
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};
