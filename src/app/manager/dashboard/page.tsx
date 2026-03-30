"use client";

import { useAuth } from "@/lib/auth";
import { FiUsers, FiClock, FiCheckSquare } from "react-icons/fi";

export default function ManagerDashboardPage() {
    const { user } = useAuth();
    
    return (
        <div>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B" }}>Manager Dashboard</h1>
                <p style={{ color: "#64748B" }}>Oversee your team performance and approvals.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "32px" }}>
                <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ padding: "10px", background: "#F5F3FF", color: "#8B5CF6", borderRadius: "10px" }}><FiUsers /></div>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#64748B" }}>Team Size</div>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B", margin: "4px 0" }}>12</div>
                    <div style={{ fontSize: "12px", color: "#94A3B8" }}>Across 2 projects</div>
                </div>
                <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ padding: "10px", background: "#F0FDF4", color: "#10B981", borderRadius: "10px" }}><FiClock /></div>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#64748B" }}>Attendance</div>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B", margin: "4px 0" }}>92%</div>
                    <div style={{ fontSize: "12px", color: "#94A3B8" }}>Average this week</div>
                </div>
                <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ padding: "10px", background: "#FEF2F2", color: "#EF4444", borderRadius: "10px" }}><FiCheckSquare /></div>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#64748B" }}>Approvals</div>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B", margin: "4px 0" }}>4</div>
                    <div style={{ fontSize: "12px", color: "#94A3B8" }}>Pending your review</div>
                </div>
            </div>
        </div>
    );
}
