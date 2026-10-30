"use client";

import React, { useState, useEffect } from "react";
import { FiBookOpen, FiPlayCircle, FiCheckCircle, FiClock, FiStar, FiArrowLeft, FiFileText } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";

const TYPE_ART: Record<string, string> = {
    Safety: "linear-gradient(135deg,#fee2e2,#fecaca)",
    Technical: "linear-gradient(135deg,#dbeafe,#bfdbfe)",
    Compliance: "linear-gradient(135deg,#fef3c7,#fde68a)",
    "Soft Skills": "linear-gradient(135deg,#ede9fe,#ddd6fe)",
    Other: "linear-gradient(135deg,#e2e8f0,#cbd5e1)",
};

export default function TrainingPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.TRAININGS);
            setCourses(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const myCompletion = (course: any) => course.completedBy?.find((c: any) => c.employee === user?._id || c.employee?._id === user?._id);
    const isEnrolled = (course: any) => course.assignedTo?.some((a: any) => a === user?._id || a?._id === user?._id);

    const handleEnroll = async (id: string) => {
        setActingId(id);
        try {
            await axiosInstance.post(`${API_ENDPOINTS.TRAININGS}/${id}/enroll`);
            await fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to enroll");
        } finally {
            setActingId(null);
        }
    };

    const handleComplete = async (id: string) => {
        setActingId(id);
        try {
            await axiosInstance.post(`${API_ENDPOINTS.TRAININGS}/${id}/complete`, {});
            await fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to mark complete");
        } finally {
            setActingId(null);
        }
    };

    const completedCount = courses.filter(c => myCompletion(c)).length;
    const inProgressCount = courses.filter(c => isEnrolled(c) && !myCompletion(c)).length;
    const scores = courses.map(c => myCompletion(c)?.score).filter((s: any) => typeof s === 'number');
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

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
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950, margin: 0 }}>Training & Courses</h1>
                  </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Advance your career with role-specific training modules and certifications.</p>
                </div>
            </motion.div>

            <div className="grid-3" style={{ marginBottom: "32px", gap: "24px" }}>
                <TrainingStat label="COMPLETED" val={String(completedCount)} color="#10b981" icon={FiCheckCircle} />
                <TrainingStat label="IN PROGRESS" val={String(inProgressCount)} color="var(--primary)" icon={FiPlayCircle} />
                <TrainingStat label="AVG SCORE" val={scores.length ? String(avgScore) : "—"} color="#3b82f6" icon={FiStar} />
            </div>

            <div className="card" style={{ border: "1px solid var(--border-light)", padding: "24px", background: "white" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "24px" }}>Assigned Training Programs</h3>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>
                ) : courses.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        <FiBookOpen size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                        <p style={{ fontWeight: 600 }}>No training programs available yet.</p>
                    </div>
                ) : (
                <div className="grid-3" style={{ gap: "24px" }}>
                    {courses.map((course, idx) => {
                        const completion = myCompletion(course);
                        const enrolled = isEnrolled(course);
                        const busy = actingId === course._id;
                        return (
                        <motion.div
                            key={course._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            style={{
                                padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9",
                                background: "#f8fafc", position: "relative", overflow: "hidden",
                                display: "flex", flexDirection: "column", gap: "16px"
                            }}
                        >
                            <div style={{ width: "100%", height: "120px", background: TYPE_ART[course.type] || TYPE_ART.Other, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FiPlayCircle size={48} style={{ color: "rgba(0,0,0,0.15)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", marginBottom: "4px" }}>{course.type}</div>
                                <h4 style={{ fontSize: "16px", fontWeight: 850, lineHeight: "1.4", color: "#1e293b", minHeight: "44px" }}>{course.title}</h4>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FiClock /> {course.duration || "Self-paced"}</div>
                                {completion && typeof completion.score === 'number' && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><FiFileText /> Score: {completion.score}</div>
                                )}
                            </div>
                            {completion ? (
                                <button className="btn btn-secondary" style={{ width: "100%", marginTop: "8px", fontWeight: 800 }} disabled>
                                    COMPLETED {completion.completedDate ? `· ${new Date(completion.completedDate).toLocaleDateString()}` : ""}
                                </button>
                            ) : enrolled ? (
                                <button className="btn btn-primary" style={{ width: "100%", marginTop: "8px", fontWeight: 800 }} onClick={() => handleComplete(course._id)} disabled={busy}>
                                    {busy ? "..." : "MARK COMPLETE"}
                                </button>
                            ) : (
                                <button className="btn btn-secondary" style={{ width: "100%", marginTop: "8px", fontWeight: 800 }} onClick={() => handleEnroll(course._id)} disabled={busy}>
                                    {busy ? "..." : "ENROLL"}
                                </button>
                            )}
                        </motion.div>
                        );
                    })}
                </div>
                )}
            </div>
        </div>
    );
}

function TrainingStat({ label, val, color, icon: Icon }: any) {
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
