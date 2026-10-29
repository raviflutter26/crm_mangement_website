"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiShield, FiPlus, FiX } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/components/common/DialogProvider";
import { useAuth } from "@/lib/auth";

/** Training.type values (backend src/models/Training.js). Safety inductions are the 'Safety' ones. */
const TRAINING_TYPES = ["Safety", "Technical", "Compliance", "Soft Skills", "Other"] as const;
const SAFETY = "Safety";
/** Roles the API lets create trainings (authorize('admin', 'hr'); owner implies admin). */
const CAN_CREATE = ["owner", "admin", "hr"];

type Training = {
    _id: string;
    title: string;
    description?: string;
    duration?: string;
    status: string;
    type: string;
    assignedTo?: string[];
    completedBy?: { employee: string; completedDate?: string; score?: number }[];
    dueDate?: string | null;
    createdAt?: string;
};

const EMPTY_FORM = { title: "", description: "", duration: "", type: SAFETY as string, dueDate: "" };

export default function SafetyInductionsPage() {
    const toast = useToast();
    const { user } = useAuth();
    const canCreate = CAN_CREATE.includes(String(user?.role || "").toLowerCase());

    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const load = useCallback(async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.TRAININGS);
            setTrainings(res.data.data || []);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Couldn't load trainings.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!showModal) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowModal(false); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [showModal]);

    const safety = useMemo(() => trainings.filter(t => t.type === SAFETY), [trainings]);
    const totals = useMemo(() => {
        const enrolled = safety.reduce((n, t) => n + (t.assignedTo?.length || 0), 0);
        const completed = safety.reduce((n, t) => n + (t.completedBy?.length || 0), 0);
        return { enrolled, completed, rate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : null };
    }, [safety]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) { toast.error("Title is required"); return; }
        setSubmitting(true);
        try {
            const payload: Record<string, unknown> = { ...form, title: form.title.trim() };
            if (!form.dueDate) delete payload.dueDate;
            await axiosInstance.post(API_ENDPOINTS.TRAININGS, payload);
            toast.success(form.type === SAFETY ? "Safety induction created" : `Created as a ${form.type} training — it is listed under Training, not here.`);
            setShowModal(false);
            setForm(EMPTY_FORM);
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to create training");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="card" style={{ padding: 24, color: "var(--text-muted)" }}>Loading…</div>;
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Safety Inductions</h1>
                    <p className="page-subtitle">Safety trainings, who is enrolled and who has completed them.</p>
                </div>
                {canCreate && (
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}><FiPlus /> New Induction</button>
                    </div>
                )}
            </div>

            <div className="grid-3" style={{ marginBottom: 24, gap: 16 }}>
                <Stat label="Safety trainings" value={String(safety.length)} />
                <Stat label="Enrolments" value={String(totals.enrolled)} />
                <Stat label="Completion" value={totals.rate === null ? "—" : `${totals.rate}%`} sub={`${totals.completed} completed`} />
            </div>

            {error ? (
                <EmptyState title="Trainings unavailable" description={error} icon={FiShield} actionLabel="Try again" onAction={load} />
            ) : safety.length === 0 ? (
                <EmptyState
                    title="No safety inductions yet"
                    description="Trainings with the Safety category appear here with their enrolment and completion."
                    icon={FiShield}
                    actionLabel={canCreate ? "New Induction" : undefined}
                    onAction={canCreate ? () => { setForm(EMPTY_FORM); setShowModal(true); } : undefined}
                />
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Safety trainings</h3>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{safety.length} total</span>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Training</th>
                                    <th>Enrolled</th>
                                    <th>Completed</th>
                                    <th>Completion</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safety.map(t => {
                                    const enrolled = t.assignedTo?.length || 0;
                                    const completed = t.completedBy?.length || 0;
                                    const pct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : null;
                                    return (
                                        <tr key={t._id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{t.title}</div>
                                                {(t.description || t.duration) && (
                                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{[t.duration, t.description].filter(Boolean).join(" · ")}</div>
                                                )}
                                            </td>
                                            <td>{enrolled}</td>
                                            <td>{completed}</td>
                                            <td>
                                                {pct === null ? "—" : (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${t.title} completion`}
                                                            style={{ width: 80, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                                                            <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)" }} />
                                                        </div>
                                                        <span style={{ fontSize: 12 }}>{pct}%</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ fontSize: 13 }}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}</td>
                                            <td><span className={`badge ${(t.status || "new").toLowerCase()}`}>{t.status}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
                    <div className="card" role="dialog" aria-modal="true" aria-labelledby="new-induction-title" style={{ width: "100%", maxWidth: 520, padding: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <h2 id="new-induction-title" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>New Safety Induction</h2>
                            <button type="button" className="btn btn-secondary" aria-label="Close" style={{ padding: 8 }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <Field label="Title *" id="ind-title">
                                <input id="ind-title" required className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
                            </Field>
                            <Field label="Category" id="ind-type">
                                <select id="ind-type" className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                {form.type !== SAFETY && (
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Only Safety trainings are listed on this page.</div>
                                )}
                            </Field>
                            <Field label="Duration" id="ind-duration">
                                <input id="ind-duration" className="form-input" placeholder="e.g. 2 hours" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
                            </Field>
                            <Field label="Due date" id="ind-due">
                                <input id="ind-due" type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                            </Field>
                            <Field label="Description" id="ind-desc">
                                <textarea id="ind-desc" className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </Field>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving…" : "Create"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
    return (
        <div>
            <label htmlFor={id} style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700 }}>{label}</label>
            {children}
        </div>
    );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
            {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
        </div>
    );
}
