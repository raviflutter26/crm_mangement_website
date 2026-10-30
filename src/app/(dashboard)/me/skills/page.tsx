"use client";

import React, { useState, useEffect } from "react";
import { FiZap, FiTarget, FiArrowLeft, FiPlus, FiCheckCircle, FiActivity, FiTrendingUp, FiPieChart, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

const CATEGORY_ICON: Record<string, any> = {
    Technical: FiZap,
    Safety: FiActivity,
    Management: FiTarget,
    "Soft Skills": FiPieChart,
    Other: FiActivity,
};
const CATEGORY_COLOR: Record<string, string> = {
    Technical: "var(--primary)",
    Safety: "#ef4444",
    Management: "#10b981",
    "Soft Skills": "#8b5cf6",
    Other: "#3b82f6",
};
const PROFICIENCY_PCT: Record<string, number> = { Beginner: 25, Intermediate: 50, Advanced: 75, Expert: 100 };
const PROFICIENCY_RANK = ["Beginner", "Intermediate", "Advanced", "Expert"];

const EMPTY_FORM = { name: "", category: "Technical", proficiency: "Beginner", notes: "" };

export default function SkillsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(EMPTY_FORM);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.SKILLS_MY);
            setSkills(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Skill name is required");
            return;
        }
        setSubmitting(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.SKILLS, { ...formData, employee: user?._id });
            toast.success("Skill added");
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add skill");
        } finally {
            setSubmitting(false);
        }
    };

    const highestProficiency = skills.reduce((best: string | null, s) => {
        if (!best) return s.proficiency;
        return PROFICIENCY_RANK.indexOf(s.proficiency) > PROFICIENCY_RANK.indexOf(best) ? s.proficiency : best;
    }, null as string | null);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentCount = skills.filter(s => s.createdAt && new Date(s.createdAt).getTime() > thirtyDaysAgo).length;

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)' }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header"
                style={{ marginBottom: "32px" }}
            >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <Link href="/dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Solar & Technical Skills</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Inventory of your field skills and professional competencies.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px" }}
                    onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
                >
                    <FiPlus size={18} /> ADD SKILL / COMPETENCY
                </button>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <SkillStat label="TOTAL SKILLS" val={String(skills.length)} color="var(--primary)" icon={FiZap} />
                <SkillStat label="TOP PROFICIENCY" val={highestProficiency || "—"} color="#10b981" icon={FiTrendingUp} />
                <SkillStat label="ADDED (30 DAYS)" val={String(recentCount)} color="#3b82f6" icon={FiActivity} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "0", background: "white" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Skill Matrix & Proficiency</div>
                </div>
                <div style={{ padding: "24px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                    ) : skills.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                            <FiZap size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ fontWeight: 600 }}>No skills recorded yet.</p>
                        </div>
                    ) : (
                    <div className="grid-2" style={{ gap: "24px" }}>
                        {skills.map((skill) => {
                            const Icon = CATEGORY_ICON[skill.category] || FiZap;
                            const color = CATEGORY_COLOR[skill.category] || "var(--primary)";
                            const progress = PROFICIENCY_PCT[skill.proficiency] || 25;
                            return (
                            <motion.div
                                key={skill._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9",
                                    background: "#f8fafc", display: "flex", flexDirection: "column", gap: "20px"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                        <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "white", color, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: "16px", fontWeight: 900, color: "#1e293b" }}>{skill.name}</h4>
                                            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", fontWeight: 700 }}>Proficiency: {skill.proficiency}</p>
                                        </div>
                                    </div>
                                    {skill.assessedBy && <span title="Assessed"><FiCheckCircle style={{ color: "#10b981" }} size={20} /></span>}
                                </div>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 800, marginBottom: "8px" }}>
                                        <span>PROFICIENCY</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div style={{ height: "8px", background: "white", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${progress}%`, background: color }} />
                                    </div>
                                </div>
                            </motion.div>
                            );
                        })}
                    </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "32px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Add Skill / Competency</h2>
                            <button className="btn btn-secondary" style={{ padding: "8px" }} onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Skill Name *</label>
                                <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Solar Inverter Maintenance" />
                            </div>
                            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Category</label>
                                    <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option>Technical</option>
                                        <option>Safety</option>
                                        <option>Management</option>
                                        <option>Soft Skills</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Proficiency</label>
                                    <select className="form-input" value={formData.proficiency} onChange={e => setFormData({ ...formData, proficiency: e.target.value })}>
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                        <option>Expert</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 700 }}>Notes</label>
                                <textarea className="form-input" rows={3} style={{ resize: "none" }} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>{submitting ? "Saving..." : "Add Skill"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function SkillStat({ label, val, color, icon: Icon }: any) {
    return (
        <div style={{
            background: "white", padding: "24px", borderRadius: "20px",
            border: "1px solid var(--border-light)", display: "flex",
            justifyContent: "space-between", alignItems: "center"
        }}>
            <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "28px", fontWeight: 950, color: "#0f172a" }}>{val}</div>
            </div>
            <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={26} />
            </div>
        </div>
    );
}
