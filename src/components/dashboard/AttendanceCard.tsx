"use client";

import React, { Fragment } from "react";
import { FiClock, FiCheckCircle, FiLogIn, FiLogOut, FiSun, FiSunrise, FiMoon } from "react-icons/fi";

interface AttendanceCardProps {
    isWorking: boolean;
    sessions: any[];
    liveHours: number;
    currentTime: Date;
    handleCheckIn: () => void;
    handleCheckOut: () => void;
    actionLoading: boolean;
    setShowPermissionModal: (show: boolean) => void;
}

export default function AttendanceCard({
    isWorking,
    sessions,
    liveHours,
    currentTime,
    handleCheckIn,
    handleCheckOut,
    actionLoading,
    setShowPermissionModal
}: AttendanceCardProps) {
    const REQUIRED_HOURS = 9;
    const progressPercent = Math.min((liveHours / REQUIRED_HOURS) * 100, 100);

    // SVG ring sizes
    const size = 220;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    const hr = currentTime.getHours();
    const greeting = hr < 12 ? "Good Morning" : hr < 17 ? "Good Afternoon" : "Good Evening";
    const GreetIcon = hr < 12 ? FiSunrise : hr < 17 ? FiSun : FiMoon;
    const greetColor = hr < 12 ? "#f59e0b" : hr < 17 ? "#FF7A00" : "#7C3AED";

    const liveTimeH = currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    const liveTimeSec = currentTime.getSeconds().toString().padStart(2, "0");
    const liveDateStr = currentTime.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const formatDuration = (h: number) => {
        const totalSeconds = Math.floor(h * 3600);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const reachedMaxSessions = sessions.length >= 5;
    const statusLabel = isWorking ? "Working" : sessions.length > 0 ? "Completed" : "Not Started";
    const statusColor = isWorking ? "#10b981" : sessions.length > 0 ? "#6366f1" : "#f59e0b";
    const ringColor = progressPercent >= 100 ? "#10b981" : isWorking ? "var(--primary)" : "#94a3b8";

    const firstCheckIn = sessions.length > 0 ? sessions[0].checkIn : null;
    const lastCheckOut = sessions.length > 0 && !isWorking ? sessions[sessions.length - 1].checkOut : null;

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
                        <GreetIcon color={greetColor} size={16} />
                        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>{greeting}</span>
                    </div>
                    <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Attendance</h3>
                </div>
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                    background: `${statusColor}18`, color: statusColor,
                    border: `1px solid ${statusColor}30`
                }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, display: "inline-block", animation: isWorking ? "pulse 2s infinite" : "none" }} />
                    {statusLabel}
                </span>
            </div>

            {/* Clock Ring */}
            <div style={{ padding: "28px 20px 20px", textAlign: "center", position: "relative" }}>
                <div style={{ position: "relative", display: "inline-block", width: size, height: size }}>
                    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                        {/* Track */}
                        <circle stroke="var(--border)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
                        {/* Progress */}
                        <circle
                            stroke={ringColor}
                            fill="transparent"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                            r={radius}
                            cx={size / 2}
                            cy={size / 2}
                            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.3s ease", filter: isWorking ? `drop-shadow(0 0 6px ${ringColor}80)` : "none" }}
                        />
                    </svg>

                    {/* Center Content */}
                    <div style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", width: "75%"
                    }}>
                        <div style={{ fontSize: "38px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-2px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                            {liveTimeH.split(" ")[0]}
                            <span style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-muted)", marginLeft: "2px" }}>:{liveTimeSec}</span>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>
                            {liveTimeH.split(" ")[1]}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", textAlign: "center", lineHeight: 1.4 }}>
                            {liveDateStr}
                        </div>
                        {liveHours > 0 && (
                            <div style={{ marginTop: "6px", fontSize: "12px", fontWeight: 700, color: ringColor, background: `${ringColor}15`, padding: "3px 10px", borderRadius: "20px" }}>
                                {formatDuration(liveHours)} worked
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress label */}
                <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <div style={{ height: "4px", flex: 1, maxWidth: "80px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${progressPercent}%`, background: ringColor, borderRadius: "2px", transition: "width 0.6s ease" }} />
                    </div>
                    <span>{Math.round(progressPercent)}% of {REQUIRED_HOURS}h goal</span>
                    <div style={{ height: "4px", flex: 1, maxWidth: "80px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${progressPercent}%`, background: ringColor, borderRadius: "2px", transition: "width 0.6s ease" }} />
                    </div>
                </div>
            </div>

            {/* Check In/Out Button */}
            <div style={{ padding: "4px 24px 20px", display: "flex", gap: "12px", justifyContent: "center" }}>
                {!isWorking ? (
                    !reachedMaxSessions ? (
                        <button
                            id="attendance-checkin-btn"
                            onClick={handleCheckIn}
                            disabled={actionLoading}
                            style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                padding: "13px 40px", borderRadius: "50px",
                                background: "linear-gradient(135deg, #10b981, #059669)",
                                color: "white", border: "none", cursor: actionLoading ? "wait" : "pointer",
                                fontSize: "15px", fontWeight: 800,
                                boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                                transition: "all 0.25s ease", opacity: actionLoading ? 0.7 : 1,
                                letterSpacing: "0.3px"
                            }}
                            onMouseEnter={e => !actionLoading && ((e.target as HTMLElement).style.transform = "translateY(-2px)")}
                            onMouseLeave={e => ((e.target as HTMLElement).style.transform = "translateY(0)")}
                        >
                            <FiLogIn size={18} /> {actionLoading ? "Processing..." : sessions.length > 0 ? "Resume Shift" : "Check In"}
                        </button>
                    ) : (
                        <button disabled style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "13px 40px", borderRadius: "50px",
                            background: "rgba(99,102,241,0.12)", color: "#6366f1",
                            border: "1.5px solid rgba(99,102,241,0.3)", cursor: "default",
                            fontSize: "15px", fontWeight: 700
                        }}>
                            <FiCheckCircle size={18} /> Day Complete
                        </button>
                    )
                ) : (
                    <button
                        id="attendance-checkout-btn"
                        onClick={handleCheckOut}
                        disabled={actionLoading}
                        style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "13px 40px", borderRadius: "50px",
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            color: "white", border: "none", cursor: actionLoading ? "wait" : "pointer",
                            fontSize: "15px", fontWeight: 800,
                            boxShadow: "0 6px 20px rgba(239, 68, 68, 0.4)",
                            transition: "all 0.25s ease", opacity: actionLoading ? 0.7 : 1,
                            letterSpacing: "0.3px"
                        }}
                        onMouseEnter={e => !actionLoading && ((e.target as HTMLElement).style.transform = "translateY(-2px)")}
                        onMouseLeave={e => ((e.target as HTMLElement).style.transform = "translateY(0)")}
                    >
                        <FiLogOut size={18} /> {actionLoading ? "Processing..." : "Check Out"}
                    </button>
                )}
            </div>

            {/* Stats Strip */}
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
                borderTop: "1px solid var(--border)",
                background: "var(--bg-card)"
            }}>
                {[
                    { label: "Worked", value: formatDuration(liveHours), color: isWorking ? "var(--primary)" : "var(--text-primary)" },
                    { label: "Remaining", value: liveHours >= REQUIRED_HOURS ? "✓ Done" : formatDuration(REQUIRED_HOURS - liveHours), color: liveHours >= REQUIRED_HOURS ? "#10b981" : "#f59e0b" },
                    { label: "Sessions", value: `${sessions.length}/5`, color: "var(--text-primary)" },
                ].map((item, i) => (
                    <Fragment key={item.label}>
                        {i > 0 && <div style={{ background: "var(--border)" }} />}
                        <div style={{ textAlign: "center", padding: "14px 8px" }}>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.6px", marginBottom: "5px" }}>{item.label}</div>
                            <div style={{ fontSize: "16px", fontWeight: 800, color: item.color, fontFamily: "monospace" }}>{item.value}</div>
                        </div>
                    </Fragment>
                ))}
            </div>

            {/* Time info row */}
            {(firstCheckIn || lastCheckOut) && (
                <div style={{
                    display: "flex", justifyContent: "space-around",
                    padding: "10px 20px", borderTop: "1px solid var(--border)",
                    background: "var(--bg-secondary)"
                }}>
                    {firstCheckIn && (
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>First In</div>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#10b981" }}>
                                {new Date(firstCheckIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </div>
                        </div>
                    )}
                    {lastCheckOut && (
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Out</div>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444" }}>
                                {new Date(lastCheckOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Permission Button */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
                <button
                    id="attendance-permission-btn"
                    onClick={() => setShowPermissionModal(true)}
                    style={{
                        width: "100%", padding: "10px", borderRadius: "10px",
                        background: "transparent", border: "1.5px dashed var(--border)",
                        color: "var(--text-secondary)", cursor: "pointer",
                        fontSize: "13px", fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                        transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLElement).style.color = "var(--primary)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                >
                    <FiClock size={14} /> Request Late / Early Permission
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.3); }
                }
            `}</style>
        </div>
    );
}
