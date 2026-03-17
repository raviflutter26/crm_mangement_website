"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiMail, FiLock, FiUser, FiArrowRight, FiShield, FiEye, FiEyeOff } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

interface LoginPageProps {
    onLogin: (token: string, user: any) => void;
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function LoginPage({ onLogin, showNotify }: LoginPageProps) {
    const [isRegister, setIsRegister] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isForgotPassword) {
                await axiosInstance.post(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, { email: formData.email });
                if (showNotify) showNotify('success', 'Reset link sent to your email.');
                setIsForgotPassword(false);
            } else if (isRegister) {
                const res = await axiosInstance.post(API_ENDPOINTS.AUTH_REGISTER, formData);
                onLogin(res.data.data.token, res.data.data.user);
            } else {
                const res = await axiosInstance.post(API_ENDPOINTS.AUTH_LOGIN, {
                    email: formData.email,
                    password: formData.password
                });

                if (showNotify) showNotify("success", res.data.message || "Login successful!");
                onLogin(res.data.data.token, res.data.data.user);
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            const errorMessage = err.response?.data?.message || err.message || "Network error. Please check your connection.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            minHeight: "100vh", backgroundColor: "var(--bg-secondary)",
            padding: "20px"
        }}>
            <div className="card animate-in" style={{ width: "100%", maxWidth: "450px", padding: "40px 30px" }}>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <div style={{ width: "60px", height: "60px", backgroundColor: "rgba(255, 122, 0, 0.1)", color: "var(--primary)", borderRadius: "15px", display: "flex", alignItems: "center", justifyItems: "center", margin: "0 auto 15px", justifyContent: "center" }}>
                        <FiShield size={30} />
                    </div>
                    <h1 style={{ fontSize: "24px", color: "var(--text-primary)", marginBottom: "5px" }}>
                        {isForgotPassword ? "Forgot Password" : (isRegister ? "Set Account Password" : "Welcome Back")}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
                        {isForgotPassword ? "Enter your email to receive a reset link" : (isRegister ? "If you're a new employee, enter your email and choose a new password." : "Sign in to access your HRMS portal")}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: "12px 15px", backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "var(--error)", borderRadius: "8px", marginBottom: "20px", fontSize: "14px",
                        textAlign: "center"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {isRegister && (
                        <div style={{ position: "relative" }}>
                            <FiUser style={{ position: "absolute", left: "15px", top: "14px", color: "var(--text-muted)" }} />
                            <input
                                type="text"
                                placeholder="Display Name (Optional)"
                                className="form-input"
                                style={{ paddingLeft: "45px", height: "45px" }}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    )}
                    <div style={{ position: "relative" }}>
                        <FiMail style={{ position: "absolute", left: "15px", top: "14px", color: "var(--text-muted)" }} />
                        <input
                            type="email"
                            required
                            placeholder="Employee Email"
                            className="form-input"
                            style={{ paddingLeft: "45px", height: "45px" }}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    {!isForgotPassword && (
                        <div style={{ position: "relative" }}>
                            <FiLock style={{ position: "absolute", left: "15px", top: "14px", color: "var(--text-muted)" }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder={isRegister ? "Choose a Password" : "Password"}
                                className="form-input"
                                style={{ paddingLeft: "45px", paddingRight: "45px", height: "45px" }}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: "absolute", right: "15px", top: "14px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    )}
                    {/* {!isForgotPassword && !isRegister && (
                        <div style={{ textAlign: "right", marginTop: "-10px" }}>
                            <span
                                onClick={() => setIsForgotPassword(true)}
                                style={{ fontSize: "13px", color: "var(--primary)", cursor: "pointer", fontWeight: 500 }}
                            >
                                Forgot Password?
                            </span>
                        </div>
                    )} */}
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: "45px", justifyContent: "center", marginTop: "10px", fontWeight: 600 }}>
                        {loading ? "Processing..." : (isForgotPassword ? "Send Reset Link" : (isRegister ? "Activate Account" : "Sign In"))}
                        {!loading && <FiArrowRight />}
                    </button>

                    {isForgotPassword && (
                        <button
                            type="button"
                            className="btn"
                            onClick={() => setIsForgotPassword(false)}
                            style={{ justifyContent: "center", border: "1px solid #ddd" }}
                        >
                            Back to Login
                        </button>
                    )}
                </form>

                {/* <div style={{ textAlign: "center", marginTop: "25px", fontSize: "14px", color: "var(--text-secondary)" }}>
                    {isRegister ? "Ready to login?" : "New employee?"}{" "}
                    <span
                        onClick={() => { setIsRegister(!isRegister); setError(""); }}
                        style={{ color: "var(--primary)", cursor: "pointer", fontWeight: "600" }}
                    >
                        {isRegister ? "Sign In" : "Set Password"}
                    </span>
                </div> */}
            </div>
        </div>
    );
}

