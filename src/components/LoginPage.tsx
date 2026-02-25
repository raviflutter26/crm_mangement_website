"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiMail, FiLock, FiUser, FiArrowRight, FiShield } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

interface LoginPageProps {
    onLogin: (token: string, user: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "admin" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isRegister) {
                const res = await axiosInstance.post(API_ENDPOINTS.AUTH_REGISTER, formData);
                onLogin(res.data.data.token, res.data.data.user);
            } else {
                const res = await axiosInstance.post(API_ENDPOINTS.AUTH_LOGIN, {
                    email: formData.email,
                    password: formData.password
                });
                onLogin(res.data.data.token, res.data.data.user);
            }
        } catch (err: any) {
            console.error("Login error:", err);
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
                    <div style={{
                        width: "60px", height: "60px", borderRadius: "15px",
                        background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                        display: "flex", justifyContent: "center", alignItems: "center",
                        margin: "0 auto 15px", color: "white", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)"
                    }}>
                        <FiShield size={30} />
                    </div>
                    <h1 style={{ fontSize: "24px", color: "var(--text-primary)", marginBottom: "5px" }}>
                        {isRegister ? "Create Account" : "Welcome Back"}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        {isRegister ? "Sign up to configure your Zoho HR instance" : "Sign in to access the Administration Panel"}
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
                                required
                                placeholder="Full Name (e.g., Ravi Admin)"
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
                            placeholder="Email Address (e.g., ravikumar@gmail.com)"
                            className="form-input"
                            style={{ paddingLeft: "45px", height: "45px" }}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div style={{ position: "relative" }}>
                        <FiLock style={{ position: "absolute", left: "15px", top: "14px", color: "var(--text-muted)" }} />
                        <input
                            type="password"
                            required
                            placeholder="Password (e.g., 123456)"
                            className="form-input"
                            style={{ paddingLeft: "45px", height: "45px" }}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: "45px", justifyContent: "center", marginTop: "10px", fontWeight: 600 }}>
                        {loading ? "Processing..." : (isRegister ? "Create Admin User" : "Sign In to Admin Panel")}
                        {!loading && <FiArrowRight />}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "25px", fontSize: "14px", color: "var(--text-secondary)" }}>
                    {isRegister ? "Already have an account?" : "No account yet?"}{" "}
                    <span
                        onClick={() => { setIsRegister(!isRegister); setError(""); }}
                        style={{ color: "var(--primary)", cursor: "pointer", fontWeight: "600" }}
                    >
                        {isRegister ? "Sign In" : "Register Super Admin"}
                    </span>
                </div>
            </div>
        </div>
    );
}

