"use client";

import { FiClock, FiCheckCircle, FiLogIn, FiLogOut } from "react-icons/fi";

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
    const progressPercent = Math.min((liveHours / 9) * 100, 100);
    const radius = 100;
    const stroke = 8;
    const normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
    
    const liveTime = currentTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const liveDateStr = currentTime.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
    
    const formatDuration = (h: number) => {
        const totalSeconds = Math.floor(h * 3600);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const reachedMaxSessions = sessions.length >= 5;
    const reachedDailyLimit = !isWorking && reachedMaxSessions;

    return (
        <div className="card" style={{ overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Attendance</h3>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 400 }}>({sessions.length}/5 Sessions)</span>
                </div>
                <span className={`badge ${isWorking ? 'active' : (reachedDailyLimit || (sessions.length > 0 && !isWorking) ? 'success' : 'warning')}`} style={{ fontSize: "11px" }}>
                    {isWorking ? '● Working' : (sessions.length > 0 ? '✓ Completed' : '○ Not Started')}
                </span>
            </div>

            {/* Circular Clock */}
            <div style={{ padding: "36px 20px 28px", textAlign: "center", background: "var(--bg-card)" }}>
                <div style={{ position: "relative", display: "inline-block", width: `${radius * 2}px`, height: `${radius * 2}px` }}>
                    <svg width={radius * 2} height={radius * 2} style={{ transform: "rotate(-90deg)" }}>
                        <circle
                            stroke="var(--border)"
                            fill="transparent"
                            strokeWidth={stroke}
                            r={normalizedRadius}
                            cx={radius}
                            cy={radius}
                        />
                        <circle
                            stroke={progressPercent >= 100 ? "#10b981" : "var(--primary)"}
                            fill="transparent"
                            strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={circumference + ' ' + circumference}
                            strokeDashoffset={strokeDashoffset}
                            r={normalizedRadius}
                            cx={radius}
                            cy={radius}
                            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
                        />
                    </svg>
                    <div style={{
                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "4px"
                    }}>
                        <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-1px", lineHeight: 1, display: "flex", alignItems: "baseline" }}>
                            {liveTime.split(' ')[0].split(':').slice(0, 2).join(':')}
                            <span style={{ fontSize: "18px", marginLeft: "2px", opacity: 0.7, fontWeight: 600 }}>:{liveTime.split(' ')[0].split(':')[2]}</span>
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                            {liveTime.split(' ')[1]}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                            {liveDateStr}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: "0 24px 24px", display: "flex", gap: "12px", justifyContent: "center" }}>
                {!isWorking ? (
                    !reachedMaxSessions ? (
                        <button
                            onClick={handleCheckIn}
                            disabled={actionLoading}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "12px 32px", borderRadius: "50px",
                                background: "linear-gradient(135deg, #10b981, #059669)",
                                color: "white", border: "none", cursor: actionLoading ? "wait" : "pointer",
                                fontSize: "15px", fontWeight: 700,
                                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                                transition: "all 0.2s ease", opacity: actionLoading ? 0.7 : 1
                            }}
                        >
                            <FiLogIn size={18} /> {actionLoading ? 'Processing...' : (sessions.length > 0 ? 'Resume Shift' : 'Check In')}
                        </button>
                    ) : (
                        <button
                            disabled
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "12px 32px", borderRadius: "50px",
                                background: "var(--bg-secondary)", color: "var(--text-muted)",
                                border: "1px solid var(--border)", cursor: "default",
                                fontSize: "15px", fontWeight: 600
                            }}
                        >
                            <FiCheckCircle size={18} /> Shift Completed
                        </button>
                    )
                ) : (
                    <button
                        onClick={handleCheckOut}
                        disabled={actionLoading}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "12px 32px", borderRadius: "50px",
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            color: "white", border: "none", cursor: actionLoading ? "wait" : "pointer",
                            fontSize: "15px", fontWeight: 700,
                            boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                            transition: "all 0.2s ease", opacity: actionLoading ? 0.7 : 1
                        }}
                    >
                        <FiLogOut size={18} /> {actionLoading ? 'Processing...' : 'Check Out'}
                    </button>
                )}
            </div>

            <div style={{
                display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
                padding: "16px 0", borderTop: "1px solid var(--border)",
                background: "var(--bg-secondary)"
            }}>
                <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", marginBottom: "4px" }}>Total Hours</div>
                    <div style={{ 
                        fontSize: "18px", 
                        fontWeight: 800, 
                        color: isWorking ? "var(--secondary)" : "var(--text-primary)", 
                        fontFamily: "monospace"
                    }}>
                        {formatDuration(liveHours)}
                    </div>
                </div>
                <div style={{ background: "var(--border)" }} />
                <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", marginBottom: "4px" }}>Pending</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: liveHours >= 9 ? "#10b981" : "var(--primary)", fontFamily: "monospace" }}>
                        {liveHours >= 9 ? "Done ✓" : formatDuration(9 - liveHours)}
                    </div>
                </div>
                <div style={{ background: "var(--border)" }} />
                <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", marginBottom: "4px" }}>Sessions</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "monospace" }}>
                        {sessions.length}/5
                    </div>
                </div>
            </div>

            <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)" }}>
                <button 
                    onClick={() => setShowPermissionModal(true)} 
                    style={{
                        width: "100%", padding: "10px", borderRadius: "10px",
                        background: "transparent", border: "1.5px dashed var(--border)",
                        color: "var(--text-secondary)", cursor: "pointer",
                        fontSize: "13px", fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                        transition: "all 0.2s ease"
                    }}
                >
                    <FiClock size={14} /> Request Late / Early Permission
                </button>
            </div>
        </div>
    );
}
