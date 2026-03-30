"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/lib/auth";
import { FiLock, FiCheckCircle, FiLoader, FiShield } from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";

export default function SetupPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { login } = useAuth(); // We'll manually login after setup
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [inviteData, setInviteData] = useState<any>(null);

    useEffect(() => {
        if (!token) {
            router.push('/login');
        } else {
            // Verify token on mount (optional but recommended)
            // axiosInstance.get(`/api/auth/verify-invite?token=${token}`)...
        }
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError("Passwords do not match");
        if (password.length < 8) return setError("Password must be at least 8 characters");

        setLoading(true);
        setError("");
        try {
            await axiosInstance.post('/api/auth/setup-password', { token, password });
            router.push('/login'); // Or auto-login
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to setup password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", padding: "20px" }}>
            <div style={{ width: "100%", maxWidth: "450px", background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ display: "inline-flex", padding: "12px", background: "#F0F9FF", color: "#0084FF", borderRadius: "14px", marginBottom: "16px" }}>
                        <FiShield size={32} />
                    </div>
                    <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1E293B" }}>Setup Your Workspace</h2>
                    <p style={{ fontSize: "14px", color: "#64748B", marginTop: "8px" }}>Create a secure password for your account.</p>
                </div>

                {error && (
                    <div style={{ background: "#FEF2F2", color: "#EF4444", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px", border: "1px solid #FEE2E2" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>New Password</label>
                        <div style={{ position: "relative" }}>
                            <FiLock style={{ position: "absolute", top: "14px", left: "14px", color: "#94A3B8" }} />
                            <input 
                                type="password" 
                                required 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ width: "100%", padding: "12px 12px 12px 42px", border: "1px solid #E2E8F0", borderRadius: "8px", outline: "none" }} 
                                placeholder="Choose a strong password" 
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>Confirm Password</label>
                        <div style={{ position: "relative" }}>
                            <FiCheckCircle style={{ position: "absolute", top: "14px", left: "14px", color: "#94A3B8" }} />
                            <input 
                                type="password" 
                                required 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                style={{ width: "100%", padding: "12px 12px 12px 42px", border: "1px solid #E2E8F0", borderRadius: "8px", outline: "none" }} 
                                placeholder="Repeat your password" 
                            />
                        </div>
                    </div>

                    <p style={{ fontSize: "12px", color: "#64748B" }}>
                        * Password must be at least 8 characters and include a mixture of letters, numbers, and symbols.
                    </p>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ background: "#0084FF", color: "#fff", border: "none", padding: "14px", borderRadius: "8px", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "10px" }}
                    >
                        {loading ? <FiLoader className="animate-spin" /> : "Complete Account Setup"}
                    </button>
                </form>
            </div>
        </div>
    );
}
