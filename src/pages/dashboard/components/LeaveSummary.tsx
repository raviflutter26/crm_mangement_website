"use client";

import { FiChevronRight } from "react-icons/fi";

interface LeaveSummaryProps {
    data: any;
}

export default function LeaveSummary({ data }: LeaveSummaryProps) {
    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Leave Details</h3>
                <button className="btn btn-secondary btn-sm">Apply Leave <FiChevronRight size={14} /></button>
            </div>
            <div className="card-body">
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <div style={{ flex: 1, padding: "15px", background: "var(--bg-card)", borderRadius: "10px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                        <div style={{ fontSize: "20px", fontWeight: "600", color: "var(--primary)" }}>{data.leaveBalance?.casual || 0}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Casual</div>
                    </div>
                    <div style={{ flex: 1, padding: "15px", background: "var(--bg-card)", borderRadius: "10px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                        <div style={{ fontSize: "20px", fontWeight: "600", color: "var(--secondary)" }}>{data.leaveBalance?.sick || 0}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Sick</div>
                    </div>
                    <div style={{ flex: 1, padding: "15px", background: "var(--bg-card)", borderRadius: "10px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                        <div style={{ fontSize: "20px", fontWeight: "600", color: "var(--purple)" }}>{data.leaveBalance?.earned || 0}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Earned</div>
                    </div>
                </div>
                
                <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>Recent Requests</h4>
                {data.recentLeaves && data.recentLeaves.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {data.recentLeaves.slice(0, 3).map((leave: any, i: number) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-card)", borderRadius: "8px" }}>
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{leave.leaveType}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                                        {new Date(leave.startDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <span className={`badge ${leave.status.toLowerCase()}`}>{leave.status}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "14px" }}>
                        No recent leave requests
                    </div>
                )}
            </div>
        </div>
    );
}
