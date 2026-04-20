"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { FiMail, FiLock, FiUser, FiArrowRight, FiEye, FiEyeOff, FiLoader } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

export default function LoginPage() {
    const { login } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "", name: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            if (isForgotPassword) {
                await axiosInstance.post(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, { email: formData.email });
                setMessage("Reset link sent to your email.");
                setIsForgotPassword(false);
            } else if (isRegister) {
                // For register, we might need a separate API or use the existing one
                // The old component used API_ENDPOINTS.AUTH_REGISTER
                const res = await axiosInstance.post(API_ENDPOINTS.AUTH_REGISTER, formData);
                // On success, we could auto-login or redirect
                setError("Account created. Please sign in.");
                setIsRegister(false);
            } else {
                await login({ email: formData.email, password: formData.password });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: "flex", minHeight: "100vh", background: "#f8fafc",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>
            {/* Left panel — Branding */}
            <div style={{
                flex: "0 0 45%", background: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)",
                display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px",
                position: "relative", overflow: "hidden"
            }}>
                {/* Decorative circles */}
                <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                <div style={{ position: "absolute", bottom: "-120px", left: "-60px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                <div style={{ position: "absolute", top: "50%", right: "20%", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 800, color: "#fff", backdropFilter: "blur(8px)" }}>
                            R
                        </div>
                        <span style={{ fontSize: "22px", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>Ravi Zoho</span>
                    </div>

                    <h1 style={{ fontSize: "42px", fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: "20px", letterSpacing: "-1px" }}>
                        Enterprise HRMS<br />Payroll Platform
                    </h1>
                    <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, maxWidth: "400px", marginBottom: "40px" }}>
                        Manage employees, payroll, attendance, leaves, and compliance — all in one unified platform built for Indian enterprises.
                    </p>

                    {/* Feature pills */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {["Multi-Org", "Shift Management", "EPF/ESI", "Payroll Reports", "Attendance"].map(f => (
                            <span key={f} style={{
                                padding: "8px 16px", borderRadius: "20px",
                                background: "rgba(255,255,255,0.15)", color: "#fff",
                                fontSize: "12px", fontWeight: 600, backdropFilter: "blur(4px)",
                                border: "1px solid rgba(255,255,255,0.1)"
                            }}>
                                {f}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — Login Form */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
                <div style={{ width: "100%", maxWidth: "420px" }}>
                    <div style={{ marginBottom: "36px" }}>
                        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#1f2937", marginBottom: "8px", letterSpacing: "-0.5px" }}>
                            {isForgotPassword ? "Forgot Password" : isRegister ? "Set Account Password" : "Welcome Back"}
                        </h2>
                        <p style={{ fontSize: "15px", color: "#6b7280", lineHeight: 1.5 }}>
                            {isForgotPassword ? "Enter your email to receive a reset link" : isRegister ? "New employee? Set your account password" : "Sign in to access your HRMS dashboard"}
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            padding: "14px 18px", background: "#fef2f2", border: "1px solid #fecaca",
                            borderRadius: "10px", marginBottom: "20px", fontSize: "13px", color: "#dc2626",
                            display: "flex", alignItems: "center", gap: "8px"
                        }}>
                            <span style={{ fontSize: "16px" }}>⚠</span> {error}
                        </div>
                    )}

                    {message && (
                        <div style={{
                            padding: "14px 18px", background: "#f0fdf4", border: "1px solid #bbf7d0",
                            borderRadius: "10px", marginBottom: "20px", fontSize: "13px", color: "#16a34a",
                            display: "flex", alignItems: "center", gap: "8px"
                        }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {isRegister && (
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Display Name</label>
                                <div style={{ position: "relative" }}>
                                    <FiUser style={{ position: "absolute", left: "16px", top: "14px", color: "#9ca3af" }} />
                                    <input type="text" placeholder="Your name" value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: "100%", padding: "12px 16px 12px 46px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", color: "#1f2937", outline: "none", transition: "border 0.2s" }}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email address</label>
                            <div style={{ position: "relative" }}>
                                <FiMail style={{ position: "absolute", left: "16px", top: "14px", color: "#9ca3af" }} />
                                <input type="email" required placeholder="you@company.com" value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: "100%", padding: "12px 16px 12px 46px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", color: "#1f2937", outline: "none", transition: "border 0.2s" }}
                                />
                            </div>
                        </div>

                        {!isForgotPassword && (
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
                                <div style={{ position: "relative" }}>
                                    <FiLock style={{ position: "absolute", left: "16px", top: "14px", color: "#9ca3af" }} />
                                    <input type={showPassword ? "text" : "password"} required
                                        placeholder={isRegister ? "Choose a strong password" : "Enter your password"}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        style={{ width: "100%", padding: "12px 46px 12px 46px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", color: "#1f2937", outline: "none", transition: "border 0.2s" }}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: "absolute", right: "16px", top: "14px", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex" }}>
                                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            style={{
                                width: "100%", padding: "14px", borderRadius: "10px", border: "none",
                                background: loading ? "#d1d5db" : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                color: "#fff", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                marginTop: "8px", boxShadow: loading ? "none" : "0 4px 14px rgba(249,115,22,0.35)",
                                transition: "0.2s"
                            }}>
                            {loading ? (
                                <FiLoader className="animate-spin" />
                            ) : (
                                <>{isForgotPassword ? "Send Reset Link" : isRegister ? "Activate Account" : "Sign In"} <FiArrowRight size={16} /></>
                            )}
                        </button>

                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                            {!isForgotPassword && !isRegister && (
                                <>
                                    <button type="button" onClick={() => setIsForgotPassword(true)} style={{ background: "none", border: "none", color: "#f97316", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Forgot Password?</button>
                                </>
                            )}
                            {(isForgotPassword || isRegister) && (
                                <button type="button" onClick={() => { setIsForgotPassword(false); setIsRegister(false); }} style={{ background: "none", border: "none", color: "#f97316", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Back to Login</button>
                            )}
                        </div>
                    </form>

                    {/* Footer */}
                    <p style={{ textAlign: "center", marginTop: "32px", fontSize: "12px", color: "#9ca3af" }}>
                        © 2026 Ravi Zoho HRMS. Enterprise Edition.
                    </p>
                </div>
            </div>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
