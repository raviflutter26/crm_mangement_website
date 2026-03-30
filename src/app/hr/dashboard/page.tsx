"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { FiUsers, FiClock, FiCalendar, FiArrowRight } from "react-icons/fi";

export default function HRDashboardPage() {
    const { user } = useAuth();
    
    const cards = [
        { name: "Total Employees", value: "142", icon: <FiUsers />, color: "#3B82F6", sub: "Org-wide" },
        { name: "Attendance Today", value: "94%", icon: <FiClock />, color: "#10B981", sub: "128 present" },
        { name: "Pending Leaves", value: "12", icon: <FiCalendar />, color: "#F59E0B", sub: "Action required" },
    ];

    return (
        <div>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B" }}>HR Dashboard</h1>
                <p style={{ color: "#64748B" }}>Manage employee lifecycle and compliance.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "32px" }}>
                {cards.map((card) => (
                    <div key={card.name} style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                            <div style={{ padding: "10px", background: `${card.color}15`, color: card.color, borderRadius: "10px" }}>{card.icon}</div>
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#64748B" }}>{card.name}</div>
                        <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B", margin: "4px 0" }}>{card.value}</div>
                        <div style={{ fontSize: "12px", color: "#94A3B8" }}>{card.sub}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B", marginBottom: "20px" }}>Upcoming Joiners</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "12px", background: "#F8FAFC" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#E2E8F0" }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "14px", fontWeight: 700 }}>Employee Name</div>
                                    <div style={{ fontSize: "12px", color: "#64748B" }}>Joins in 4 days</div>
                                </div>
                                <FiArrowRight style={{ color: "#94A3B8" }} />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B", marginBottom: "20px" }}>Leave Approvals</h3>
                    <p style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>No pending approvals for your department.</p>
                </div>
            </div>
        </div>
    );
}
