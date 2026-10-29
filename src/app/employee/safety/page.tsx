"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiShield, FiAlertOctagon, FiCheckCircle, FiClock, FiArrowLeft, FiAlertTriangle, FiTool } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useAuth } from "@/lib/auth";

type Training = {
    _id: string;
    title: string;
    type: string;
    dueDate?: string | null;
    assignedTo?: string[];
    completedBy?: { employee: string; completedDate?: string; score?: number }[];
};
type PPE = { _id: string; item: string; issueDate?: string; condition: string; status: string; nextInspection?: string | null; serialNumber?: string };
type Incident = { _id: string; type: string; site: string; severity: string; status: string; date?: string; createdAt?: string };

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—");
const idOf = (v: unknown) => (v && typeof v === "object" && "_id" in (v as any) ? String((v as any)._id) : String(v));
const OPEN_INCIDENT = ["Reported", "In-Progress"];
const PPE_ATTENTION = ["Wear Detected", "Damaged"];

/**
 * The employee's own safety picture: their safety trainings, the PPE issued to
 * them and the incidents they reported. Everything comes from the existing
 * self-scoped endpoints; nothing on this page is made up.
 */
export default function SafetyPage() {
    const { user } = useAuth();
    const me = user?._id ? String(user._id) : "";

    const [trainings, setTrainings] = useState<Training[]>([]);
    const [ppe, setPpe] = useState<PPE[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState<string[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        const [t, p, i] = await Promise.allSettled([
            axiosInstance.get(API_ENDPOINTS.TRAININGS),
            axiosInstance.get(API_ENDPOINTS.PPE_RECORDS_MY),
            axiosInstance.get(API_ENDPOINTS.INCIDENTS_MY),
        ]);
        const errs: string[] = [];
        if (t.status === "fulfilled") setTrainings(t.value.data.data || []); else errs.push("trainings");
        if (p.status === "fulfilled") setPpe(p.value.data.data || []); else errs.push("PPE records");
        if (i.status === "fulfilled") setIncidents(i.value.data.data || []); else errs.push("incidents");
        setFailed(errs);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    // Safety trainings this employee is enrolled in, with their own completion.
    const mySafety = useMemo(() => trainings
        .filter(t => t.type === "Safety" && (t.assignedTo || []).some(a => idOf(a) === me))
        .map(t => {
            const done = (t.completedBy || []).find(c => idOf(c.employee) === me);
            const overdue = !done && t.dueDate ? new Date(t.dueDate) < new Date() : false;
            return { ...t, completedDate: done?.completedDate || null, score: done?.score, overdue };
        }), [trainings, me]);
    const availableSafety = trainings.filter(t => t.type === "Safety").length - mySafety.length;

    const completed = mySafety.filter(t => t.completedDate);
    const lastInduction = completed.map(t => t.completedDate as string).sort().at(-1) || null;
    const compliance = mySafety.length > 0 ? Math.round((completed.length / mySafety.length) * 100) : null;
    const issuedPpe = ppe.filter(p => p.status === "Issued");
    const ppeAttention = issuedPpe.filter(p => PPE_ATTENTION.includes(p.condition));
    const openIncidents = incidents.filter(i => OPEN_INCIDENT.includes(i.status));
    const overdue = mySafety.filter(t => t.overdue);
    const siteReady = mySafety.length > 0 && completed.length === mySafety.length && ppeAttention.length === 0;

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)" }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header" style={{ marginBottom: "32px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <Link href="/employee/dashboard" aria-label="Back to dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                        <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Safety & Compliance</h1>
                    </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Your safety training, the PPE issued to you, and incidents you have reported.</p>
                </div>
                {!loading && (
                    <div style={{
                        background: siteReady ? "#f0fdf4" : "#fffbeb", padding: "8px 20px", borderRadius: "12px",
                        border: `1px solid ${siteReady ? "#dcfce7" : "#fde68a"}`, display: "flex",
                        alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 800, color: siteReady ? "#10b981" : "#b45309",
                    }}>
                        {siteReady ? <FiCheckCircle /> : <FiAlertTriangle />}
                        {siteReady ? "Site-ready" : mySafety.length === 0 ? "No safety training assigned" : "Action needed"}
                    </div>
                )}
            </motion.div>

            {failed.length > 0 && (
                <div role="alert" className="card" style={{ padding: 14, marginBottom: 20, border: "1px solid #fee2e2", background: "#fef2f2", color: "#991b1b", fontSize: 13 }}>
                    Couldn&apos;t load your {failed.join(", ")}.{" "}
                    <button type="button" className="btn btn-sm" onClick={load} style={{ marginLeft: 8 }}>Retry</button>
                </div>
            )}

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <SafetyStat label="LAST INDUCTION" val={loading ? "…" : fmtDate(lastInduction)} color="#10b981" icon={FiClock} />
                <SafetyStat label="PPE ISSUED" val={loading ? "…" : String(issuedPpe.length)} color="var(--primary)" icon={FiShield} />
                <SafetyStat label="TRAINING COMPLIANCE" val={loading ? "…" : compliance === null ? "—" : `${compliance}%`} color="#3b82f6" icon={FiCheckCircle} />
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 400px)", gap: "32px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div className="card" style={{ border: "1px solid var(--border-light)", padding: "24px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "20px" }}>Safety Training</h3>
                        {loading ? <Muted>Loading…</Muted> : mySafety.length === 0 ? (
                            <Muted>
                                You are not enrolled in any safety training.
                                {availableSafety > 0 && <> <Link href="/employee/training" style={{ color: "var(--primary)" }}>{availableSafety} available to enrol</Link>.</>}
                            </Muted>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {mySafety.map(t => (
                                    <Row
                                        key={t._id}
                                        icon={FiShield}
                                        title={t.title}
                                        sub={t.completedDate ? `Completed ${fmtDate(t.completedDate)}${t.score !== undefined && t.score !== null ? ` · score ${t.score}` : ""}` : t.dueDate ? `Due ${fmtDate(t.dueDate)}` : "No due date"}
                                        tag={t.completedDate ? "COMPLETED" : t.overdue ? "OVERDUE" : "PENDING"}
                                        tone={t.completedDate ? "good" : t.overdue ? "bad" : "warn"}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ border: "1px solid var(--border-light)", padding: "24px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "20px" }}>My PPE</h3>
                        {loading ? <Muted>Loading…</Muted> : ppe.length === 0 ? <Muted>No PPE has been issued to you.</Muted> : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {ppe.map(p => (
                                    <Row
                                        key={p._id}
                                        icon={FiTool}
                                        title={p.item}
                                        sub={[`Issued ${fmtDate(p.issueDate)}`, p.nextInspection ? `inspection ${fmtDate(p.nextInspection)}` : null, p.serialNumber ? `S/N ${p.serialNumber}` : null].filter(Boolean).join(" · ")}
                                        tag={`${p.status.toUpperCase()} · ${p.condition.toUpperCase()}`}
                                        tone={p.status !== "Issued" ? "neutral" : PPE_ATTENTION.includes(p.condition) ? "bad" : "good"}
                                    />
                                ))}
                            </div>
                        )}
                        <Link href="/employee/ppe" className="btn btn-secondary" style={{ width: "100%", marginTop: "20px", fontWeight: 800, justifyContent: "center" }}>Manage PPE</Link>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {!loading && (overdue.length > 0 || ppeAttention.length > 0) && (
                        <div className="card" style={{ padding: "24px", border: "1px solid #fee2e2", background: "#fef2f2" }}>
                            <div style={{ display: "flex", gap: "16px" }}>
                                <FiAlertOctagon size={24} style={{ color: "#ef4444", flexShrink: 0 }} aria-hidden="true" />
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#991b1b" }}>Needs your attention</div>
                                    <ul style={{ fontSize: "12px", color: "#b91c1c", marginTop: "6px", lineHeight: 1.6, paddingLeft: 16 }}>
                                        {overdue.map(t => <li key={t._id}>{t.title} was due {fmtDate(t.dueDate)}</li>)}
                                        {ppeAttention.map(p => <li key={p._id}>{p.item}: {p.condition.toLowerCase()}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: 800, margin: 0 }}>Incidents I Reported</h4>
                            {!loading && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{openIncidents.length} open</span>}
                        </div>
                        {loading ? <Muted>Loading…</Muted> : incidents.length === 0 ? <Muted>You haven&apos;t reported any incidents.</Muted> : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {incidents.slice(0, 8).map(i => (
                                    <div key={i._id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: "13px", fontWeight: 800 }}>{i.type} · {i.site}</div>
                                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{fmtDate(i.date || i.createdAt)} · {i.severity}</div>
                                        </div>
                                        <span style={{ fontSize: "10px", fontWeight: 800, alignSelf: "center", whiteSpace: "nowrap", color: OPEN_INCIDENT.includes(i.status) ? "#b45309" : "#10b981" }}>
                                            {i.status.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link href="/employee/incident" className="btn btn-primary btn-sm" style={{ width: "100%", marginTop: "20px", justifyContent: "center" }}>Report an incident</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Muted({ children }: { children: React.ReactNode }) {
    return <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{children}</div>;
}

function SafetyStat({ label, val, color, icon: Icon }: { label: string; val: string; color: string; icon: React.ComponentType<{ size?: number }> }) {
    return (
        <div style={{
            background: "var(--bg-card, white)", padding: "24px", borderRadius: "20px",
            border: "1px solid var(--border-light)", display: "flex",
            justifyContent: "space-between", alignItems: "center",
        }}>
            <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "22px", fontWeight: 950, color: "var(--text-primary, #0f172a)" }}>{val}</div>
            </div>
            <div aria-hidden="true" style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${color}15`, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={24} />
            </div>
        </div>
    );
}

const TONES = {
    good: { color: "#10b981", bg: "#f0fdf4" },
    warn: { color: "#b45309", bg: "#fffbeb" },
    bad: { color: "#ef4444", bg: "#fef2f2" },
    neutral: { color: "#64748b", bg: "#f1f5f9" },
};

function Row({ icon: Icon, title, sub, tag, tone }: { icon: React.ComponentType<{ size?: number }>; title: string; sub: string; tag: string; tone: keyof typeof TONES }) {
    const t = TONES[tone];
    return (
        <div style={{ padding: "14px", borderRadius: "16px", border: "1px solid var(--border-light, #f1f5f9)", display: "flex", alignItems: "center", gap: "16px" }}>
            <div aria-hidden="true" style={{ width: "40px", height: "40px", borderRadius: "12px", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border, #e2e8f0)", flexShrink: 0 }}>
                <Icon size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 800 }}>{title}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{sub}</div>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: t.color, background: t.bg, padding: "4px 8px", borderRadius: "4px", whiteSpace: "nowrap" }}>{tag}</span>
        </div>
    );
}
