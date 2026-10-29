"use client";

import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiStar, FiFileText, FiEdit3, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/components/common/DialogProvider";

const STAGE_LABEL: Record<string, string> = {
    draft: "Draft",
    "self-review": "Your self-review",
    "manager-review": "With your manager",
    "hr-review": "With HR",
    completed: "Completed",
};

const Stars = ({ value, onPick }: { value: number; onPick?: (n: number) => void }) => (
    <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map(n => (
            <FiStar
                key={n}
                onClick={onPick ? () => onPick(n) : undefined}
                aria-label={onPick ? `Rate ${n}` : undefined}
                style={{
                    cursor: onPick ? "pointer" : "default",
                    width: onPick ? 26 : 16, height: onPick ? 26 : 16,
                    color: n <= value ? "#FBBC04" : "#cbd5e1", fill: n <= value ? "#FBBC04" : "none",
                }}
            />
        ))}
    </div>
);

export default function AppraisalsPage() {
    const toast = useToast();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState<any>(null); // single appraisal with goals
    const [form, setForm] = useState<{ selfRating: number; selfComments: string }>({ selfRating: 0, selfComments: "" });
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.APPRAISALS);
            setReviews(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openAppraisal = async (id: string) => {
        try {
            const res = await axiosInstance.get(`${API_ENDPOINTS.APPRAISALS}/${id}`);
            const data = res.data.data;
            setOpen(data);
            setForm({ selfRating: data.selfRating || 0, selfComments: data.selfComments || "" });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Could not open the appraisal.");
        }
    };

    const submitSelfReview = async (e: any) => {
        e.preventDefault();
        if (!form.selfRating) { toast.error("Pick a rating from 1 to 5."); return; }
        setSaving(true);
        try {
            await axiosInstance.patch(API_ENDPOINTS.APPRAISAL_SELF_REVIEW(open._id), form);
            toast.success("Self-review submitted to your manager.");
            setOpen(null);
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Could not submit the self-review.");
        } finally { setSaving(false); }
    };

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)' }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header" style={{ marginBottom: "32px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <Link href="/employee/dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                        <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Performance Appraisals</h1>
                    </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Your review cycles: write your self-review, then follow it through manager and HR review.</p>
                </div>
            </motion.div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: 0, background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Appraisal History & Records</div>
                </div>
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {loading ? (
                        <div style={{ color: "#64748b", fontSize: "14px" }}>Loading…</div>
                    ) : reviews.length === 0 ? (
                        <EmptyState icon={FiStar} title={"No appraisals yet"} description={"Your performance reviews will appear here once a review cycle is started for you."} />
                    ) : reviews.map((rev, idx) => (
                        <motion.div key={rev._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                            style={{ padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "24px", background: "#f8fafc", flexWrap: "wrap" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: "white", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                                <FiFileText size={28} />
                            </div>
                            <div style={{ flex: 1, minWidth: "220px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#1e293b" }}>{rev.cycle || "Appraisal"}</div>
                                    <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "6px", background: rev.status === "completed" ? "#f0fdf4" : "#eff6ff", color: rev.status === "completed" ? "#10b981" : "#2563eb", border: "1px solid #e2e8f0" }}>
                                        {(STAGE_LABEL[rev.status] || rev.status || "").toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>
                                    {rev.period ? `${rev.period} • ` : ""}{rev.reviewerId ? `Reviewer: ${rev.reviewerId.firstName} ${rev.reviewerId.lastName}` : rev.reviewer ? `Reviewer: ${rev.reviewer}` : "Reviewer not assigned"}
                                </div>
                                {rev.status === "completed" && rev.managerComments && (
                                    <p style={{ fontSize: "13px", color: "#1e293b", marginTop: "12px", fontWeight: 600, borderLeft: "3px solid var(--primary)", paddingLeft: "12px", whiteSpace: "pre-wrap" }}>
                                        {rev.managerComments}
                                    </p>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", marginBottom: "4px" }}>SELF</div>
                                    <Stars value={rev.selfRating || 0} />
                                </div>
                                {rev.status === "completed" && (
                                    <>
                                        <div>
                                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", marginBottom: "4px" }}>MANAGER</div>
                                            <Stars value={rev.managerRating || 0} />
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", marginBottom: "4px" }}>FINAL</div>
                                            <div style={{ fontSize: "28px", fontWeight: 950, color: "var(--primary)" }}>{rev.finalRating ?? "-"}<span style={{ fontSize: "12px", color: "#94a3b8" }}> / 5</span></div>
                                        </div>
                                    </>
                                )}
                                <button className={`btn ${rev.status === "self-review" ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => openAppraisal(rev._id)}>
                                    {rev.status === "self-review" ? <><FiEdit3 /> Write self-review</> : "View"}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {open && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div className="card" style={{ width: "640px", maxWidth: "100%", maxHeight: "88vh", overflow: "auto", padding: "24px", background: "white" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <h2 style={{ margin: 0, fontSize: "20px" }}>{open.cycleId?.name || open.cycle || "Appraisal"}</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setOpen(null)} aria-label="Close"><FiX /></button>
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                            {STAGE_LABEL[open.status] || open.status}
                            {open.cycleId?.selfReviewDue ? ` • Self-review due ${new Date(open.cycleId.selfReviewDue).toLocaleDateString()}` : ""}
                        </div>

                        <div style={{ padding: "14px", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "16px" }}>
                            <div style={{ fontWeight: 800, marginBottom: "8px", fontSize: "14px" }}>Your goals in this cycle</div>
                            {(open.goals || []).length === 0 ? (
                                <div style={{ fontSize: "13px", color: "#64748b" }}>No goals are linked to this cycle. <Link href="/employee/targets">Manage your targets</Link></div>
                            ) : (open.goals || []).map((g: any) => (
                                <div key={g._id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600 }}>
                                        <span>{g.title}</span><span style={{ color: "#64748b" }}>{g.progress || 0}%</span>
                                    </div>
                                    <div style={{ height: "6px", borderRadius: "3px", background: "#f1f5f9", marginTop: "6px", overflow: "hidden" }}>
                                        <div style={{ width: `${Math.min(100, g.progress || 0)}%`, height: "100%", background: "var(--primary)" }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {open.status === "self-review" ? (
                            <form onSubmit={submitSelfReview} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>Your rating</label>
                                    <Stars value={form.selfRating} onPick={(n) => setForm({ ...form, selfRating: n })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>What went well, and what you would do differently</label>
                                    <textarea className="form-input" rows={5} style={{ resize: "vertical" }} value={form.selfComments} onChange={e => setForm({ ...form, selfComments: e.target.value })} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setOpen(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Submitting…" : "Submit to manager"}</button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                                <div><b>Your rating</b><Stars value={open.selfRating || 0} /></div>
                                {open.selfComments && <div style={{ whiteSpace: "pre-wrap" }}>{open.selfComments}</div>}
                                {open.status === "completed" && (
                                    <>
                                        <div><b>Manager rating</b><Stars value={open.managerRating || 0} /></div>
                                        {open.managerComments && <div style={{ whiteSpace: "pre-wrap" }}>{open.managerComments}</div>}
                                        {open.strengths && <div><b>Strengths:</b> {open.strengths}</div>}
                                        {open.areasOfImprovement && <div><b>Areas to improve:</b> {open.areasOfImprovement}</div>}
                                        <div><b>Final rating:</b> {open.finalRating ?? "-"} / 5</div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
