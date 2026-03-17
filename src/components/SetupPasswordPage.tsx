"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiLock, FiCheckCircle, FiArrowRight, FiShield, FiEye, FiEyeOff, FiMail } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

interface SetupPasswordPageProps {
    token: string;
    onSuccess: (token: string, user: any) => void;
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function SetupPasswordPage({ token, onSuccess, showNotify }: SetupPasswordPageProps) {
    const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const res = await axiosInstance.get(`${API_ENDPOINTS.AUTH_RESET_PASSWORD}/${token}`);
                setEmail(res.data.data.email);
            } catch (err: any) {
                console.error("Token verification error:", err);
                setError(err.response?.data?.message || "Invalid or expired setup link.");
            } finally {
                setVerifying(false);
            }
        };
        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            // Using the reset password endpoint as it handles token verification and password update
            const res = await axiosInstance.put(`${API_ENDPOINTS.AUTH_RESET_PASSWORD}/${token}`, {
                password: formData.password
            });

            setSuccess(true);
            if (showNotify) showNotify('success', 'Password set successfully! Logging you in...');
            
            // Wait 2 seconds then login
            setTimeout(() => {
                const { token: authToken, user } = res.data.data;
                onSuccess(authToken, user);
            }, 2000);

        } catch (err: any) {
            console.error("Setup password error:", err);
            const errorMessage = err.response?.data?.message || "Invalid or expired setup link. Please contact HR.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                minHeight: "100vh", backgroundColor: "var(--bg-secondary)",
                padding: "20px"
            }}>
                <div className="card animate-in" style={{ width: "100%", maxWidth: "450px", padding: "40px 30px", textAlign: "center" }}>
                    <div style={{
                        width: "60px", height: "60px", borderRadius: "50%",
                        backgroundColor: "rgba(52, 168, 83, 0.1)", color: "#34A853",
                        display: "flex", justifyContent: "center", alignItems: "center",
                        margin: "0 auto 20px"
                    }}>
                        <FiCheckCircle size={35} />
                    </div>
                    <h2 style={{ color: "var(--text-primary)", marginBottom: "10px" }}>Password Set!</h2>
                    <p style={{ color: "var(--text-secondary)" }}>Your account is now ready. Redirecting you to the portal...</p>
                </div>
            </div>
        );
    }

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
                        Set Up Your Account
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        Create a password to access your HRMS portal
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

                {verifying ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                        Verifying link...
                    </div>
                ) : !error && (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div style={{ position: "relative" }}>
                            <FiMail style={{ position: "absolute", left: "15px", top: "14px", color: "var(--text-muted)" }} />
                            <input
                                type="email"
                                readOnly
                                value={email}
                                className="form-input"
                                style={{ paddingLeft: "45px", height: "45px", backgroundColor: "#f9fafb", cursor: "not-allowed" }}
                            />
                        </div>
                    <div style={{ position: "relative" }}>
                        <FiLock style={{ position: "absolute", left: "15px", top: "14px", color: "var(--text-muted)" }} />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="New Password"
                            className="form-input"
                            style={{ paddingLeft: "45px", paddingRight: "45px", height: "45px" }}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: "absolute",
                                right: "15px",
                                top: "14px",
                                background: "none",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>
                    <div style={{ position: "relative" }}>
                        <FiLock style={{ position: "absolute", left: "15px", top: "14px", color: "var(--text-muted)" }} />
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            placeholder="Confirm Password"
                            className="form-input"
                            style={{ paddingLeft: "45px", paddingRight: "45px", height: "45px" }}
                            value={formData.confirmPassword}
                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                position: "absolute",
                                right: "15px",
                                top: "14px",
                                background: "none",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: "45px", justifyContent: "center", marginTop: "10px", fontWeight: 600 }}>
                            {loading ? "Processing..." : "Set Password"}
                            {!loading && <FiArrowRight />}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
