"use client";

import { ReactNode } from "react";
import { FiX } from "react-icons/fi";

/** Small shared pieces for the superadmin billing / infra pages and the tenant billing page. */

export const inr = (n: number | null | undefined) =>
    n == null ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : "—");
export const fmtDateTime = (v?: string | null) => (v ? new Date(v).toLocaleString() : "—");

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
    return (
        <div className="page-header" style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
            <div>
                <h1 className="page-title" style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>{title}</h1>
                {subtitle && <p className="page-subtitle" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{subtitle}</p>}
            </div>
            {actions && <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{actions}</div>}
        </div>
    );
}

export function Stat({ label, value, sub, tone = "primary" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string }) {
    return (
        <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px", borderLeft: `3px solid var(--${tone})` }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
            {sub != null && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{sub}</div>}
        </div>
    );
}

export function StatGrid({ children }: { children: ReactNode }) {
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>{children}</div>;
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
    return (
        <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
            <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "520px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>{title}</h2>
                    <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close"><FiX /></button>
                </div>
                {children}
                {footer && <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>{footer}</div>}
            </div>
        </div>
    );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
    return (
        <div className="form-group" style={{ marginBottom: "12px" }}>
            <label className="form-label">{label}</label>
            {children}
            {hint && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{hint}</div>}
        </div>
    );
}

const STATUS_TONES: Record<string, { bg: string; fg: string }> = {
    active: { bg: "#D1FAE5", fg: "#047857" },
    paid: { bg: "#D1FAE5", fg: "#047857" },
    success: { bg: "#D1FAE5", fg: "#047857" },
    trial: { bg: "#EEF2FF", fg: "#4338CA" },
    issued: { bg: "#EEF2FF", fg: "#4338CA" },
    running: { bg: "#EEF2FF", fg: "#4338CA" },
    past_due: { bg: "#FEE2E2", fg: "#B91C1C" },
    failed: { bg: "#FEE2E2", fg: "#B91C1C" },
    partial: { bg: "#FEF3C7", fg: "#B45309" },
    cancelled: { bg: "#F1F5F9", fg: "#64748B" },
    void: { bg: "#F1F5F9", fg: "#64748B" },
    draft: { bg: "#F1F5F9", fg: "#64748B" },
};

export function StatusPill({ status }: { status?: string | null }) {
    const s = String(status || "—");
    const tone = STATUS_TONES[s] || { bg: "#F1F5F9", fg: "#334155" };
    return (
        <span style={{ background: tone.bg, color: tone.fg, padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
            {s.replace("_", " ")}
        </span>
    );
}
