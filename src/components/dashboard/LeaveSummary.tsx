"use client";

import { FiCalendar, FiChevronRight, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";
import { useRouter } from "next/navigation";

interface LeaveSummaryProps {
    data: any;
}

export default function LeaveSummary({ data }: LeaveSummaryProps) {
    const router = useRouter();

    const leaveTypes = [
        { key: "casual", label: "Casual", color: "#FF7A00", bg: "rgba(255,122,0,0.1)" },
        { key: "sick", label: "Sick", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
        { key: "earned", label: "Earned", color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
    ];

    const getStatusStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case "approved": return { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: <FiCheckCircle size={12} /> };
            case "rejected": return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: <FiXCircle size={12} /> };
            default: return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <FiClock size={12} /> };
        }
    };

    return (
        <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
        }}>
            {/* Header */}
            <div style={{
                padding: "18px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
                background: "linear-gradient(135deg, rgba(255,122,0,0.04), rgba(124,58,237,0.04))"
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <FiCalendar color="var(--primary)" size={14} />
                        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Leave Balance</span>
                    </div>
                    <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}>Leave Details</h3>
                </div>
                <button
                    id="apply-leave-btn"
                    onClick={() => router.push("/leaves")}
                    style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 16px", borderRadius: "20px",
                        background: "var(--gradient-primary)", color: "white",
                        border: "none", cursor: "pointer",
                        fontSize: "13px", fontWeight: 700,
                        boxShadow: "0 4px 12px rgba(255,122,0,0.3)",
                        transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                >
                    Apply Leave <FiChevronRight size={14} />
                </button>
            </div>

            {/* Leave Balance Cards */}
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                {leaveTypes.map(lt => (
                    <div key={lt.key} style={{
                        padding: "16px 12px",
                        background: lt.bg,
                        borderRadius: "14px",
                        textAlign: "center",
                        border: `1px solid ${lt.color}20`,
                        transition: "transform 0.2s ease"
                    }}
                        onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                        <div style={{ fontSize: "28px", fontWeight: 900, color: lt.color, lineHeight: 1 }}>
                            {data.leaveBalance?.[lt.key] ?? 0}
                        </div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: lt.color, marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            {lt.label}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>days left</div>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "var(--border)", margin: "0 24px" }} />

            {/* Recent Requests */}
            <div style={{ flex: 1, padding: "16px 24px 20px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Recent Requests</h4>
                    <button
                        onClick={() => router.push("/leaves")}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--primary)", fontWeight: 600, padding: 0 }}
                    >
                        View all →
                    </button>
                </div>

                {data.recentLeaves && data.recentLeaves.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {data.recentLeaves.slice(0, 4).map((leave: any, i: number) => {
                            const s = getStatusStyle(leave.status);
                            return (
                                <div key={i} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "12px 14px",
                                    background: "var(--bg-card)",
                                    borderRadius: "12px",
                                    border: "1px solid var(--border)",
                                    transition: "all 0.2s ease"
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateX(2px)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateX(0)"; }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, fontSize: "16px" }}>
                                            <FiCalendar />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{leave.leaveType}</div>
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                {new Date(leave.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                {leave.totalDays > 1 && ` – ${new Date(leave.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                                                {" "}· {leave.totalDays} day{leave.totalDays > 1 ? "s" : ""}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: "4px",
                                        padding: "4px 10px", borderRadius: "20px",
                                        fontSize: "11px", fontWeight: 700,
                                        background: s.bg, color: s.color
                                    }}>
                                        {s.icon} {leave.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        padding: "30px", color: "var(--text-muted)", gap: "10px"
                    }}>
                        <FiCalendar size={32} style={{ opacity: 0.3 }} />
                        <div style={{ fontSize: "14px", fontWeight: 500 }}>No recent leave requests</div>
                        <div style={{ fontSize: "12px" }}>Apply for a leave to get started</div>
                    </div>
                )}
            </div>
        </div>
    );
}
