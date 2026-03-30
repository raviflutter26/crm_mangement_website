"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiSearch, FiFilter, FiMoreVertical, FiUser, FiShield, FiMail, FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function GlobalUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchUsers = async () => {
        try {
            const res = await axiosInstance.get(`/api/auth/users?limit=50&search=${search}`);
            setUsers(res.data.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, [search]);

    return (
        <div>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.5px" }}>Global Users</h1>
                <p style={{ color: "#64748B", marginTop: "4px" }}>Administration of all users across all tenants.</p>
            </div>

            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <FiSearch style={{ position: "absolute", top: "14px", left: "14px", color: "#94A3B8" }} />
                    <input 
                        type="text" 
                        placeholder="Search by name, email, or organization..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: "100%", padding: "12px 12px 12px 42px", border: "1px solid #E2E8F0", borderRadius: "12px", outline: "none", fontSize: "14px" }}
                    />
                </div>
                <button style={{ padding: "12px 20px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                    <FiFilter /> Filters
                </button>
            </div>

            {loading ? (
                <div style={{ padding: "100px", textAlign: "center", color: "#94A3B8" }}>Loading user database...</div>
            ) : (
                <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>User</th>
                                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Role</th>
                                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Organization</th>
                                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Status</th>
                                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Joined</th>
                                <th style={{ padding: "16px 24px" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id} style={{ borderBottom: "1px solid #F1F5F9", transition: "all 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = "#FFFAF5"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ padding: "16px 24px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF7A00", fontWeight: 700 }}>
                                                {user.firstName[0]}{user.lastName[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>{user.firstName} {user.lastName}</div>
                                                <div style={{ fontSize: "12px", color: "#64748B" }}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px 24px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#475569" }}>
                                            <FiShield size={14} style={{ color: user.role === 'superadmin' ? '#FF7A00' : '#94A3B8' }} />
                                            {user.role}
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px 24px", fontSize: "13px", color: "#1E293B", fontWeight: 500 }}>
                                        {user.organizationId?.name || "N/A (Platform)"}
                                    </td>
                                    <td style={{ padding: "16px 24px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: user.employment?.status === 'active' ? '#10B981' : '#F87171', fontWeight: 600 }}>
                                            {user.employment?.status === 'active' ? <FiCheckCircle /> : <FiXCircle />}
                                            {user.employment?.status || 'Active'}
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px 24px", fontSize: "13px", color: "#64748B" }}>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                                            <FiMoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
