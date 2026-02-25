"use client";

import { useState } from "react";
import { FiSave, FiUser, FiBell, FiShield, FiDatabase, FiCheckCircle } from "react-icons/fi";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [dialogState, setDialogState] = useState({ show: false, message: "" });

    // Sample Form State
    const [formData, setFormData] = useState({
        companyName: "Ravi Zoho Solutions",
        email: "admin@ravizoho.com",
        timezone: "Asia/Kolkata",
        pushNotifications: true,
        emailNotifications: true,
        autoSync: true,
    });

    const handleSave = (e: any) => {
        e.preventDefault();
        setDialogState({ show: true, message: "Settings saved successfully!" });
        setTimeout(() => setDialogState({ show: false, message: "" }), 3000);
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Configure your HR & Payroll preferences</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <FiSave /> Save Changes
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "20px" }}>
                {/* Sidebar Navigation for Settings */}
                <div className="card" style={{ width: "250px", flexShrink: 0, padding: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <button
                            className={`btn ${activeTab === "general" ? "btn-secondary" : ""}`}
                            style={{ justifyContent: "flex-start", background: activeTab === "general" ? "var(--bg-secondary)" : "transparent", border: "none" }}
                            onClick={() => setActiveTab("general")}
                        >
                            <FiUser /> General Profile
                        </button>
                        <button
                            className={`btn ${activeTab === "notifications" ? "btn-secondary" : ""}`}
                            style={{ justifyContent: "flex-start", background: activeTab === "notifications" ? "var(--bg-secondary)" : "transparent", border: "none" }}
                            onClick={() => setActiveTab("notifications")}
                        >
                            <FiBell /> Notifications
                        </button>
                        <button
                            className={`btn ${activeTab === "security" ? "btn-secondary" : ""}`}
                            style={{ justifyContent: "flex-start", background: activeTab === "security" ? "var(--bg-secondary)" : "transparent", border: "none" }}
                            onClick={() => setActiveTab("security")}
                        >
                            <FiShield /> Security Config
                        </button>
                        <button
                            className={`btn ${activeTab === "integrations" ? "btn-secondary" : ""}`}
                            style={{ justifyContent: "flex-start", background: activeTab === "integrations" ? "var(--bg-secondary)" : "transparent", border: "none" }}
                            onClick={() => setActiveTab("integrations")}
                        >
                            <FiDatabase /> Integrations
                        </button>
                    </div>
                </div>

                {/* Settings Content Area */}
                <div className="card" style={{ flex: 1, minHeight: "60vh" }}>
                    <div className="card-header">
                        <h3 className="card-title">
                            {activeTab === "general" && "General Profile"}
                            {activeTab === "notifications" && "Notification Preferences"}
                            {activeTab === "security" && "Security Configuration"}
                            {activeTab === "integrations" && "Zoho Integrations"}
                        </h3>
                    </div>

                    <form onSubmit={handleSave} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                        {activeTab === "general" && (
                            <>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Company Name</label>
                                    <input type="text" className="form-input" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Admin Email</label>
                                    <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>System Timezone</label>
                                    <select className="form-input" value={formData.timezone} onChange={e => setFormData({ ...formData, timezone: e.target.value })}>
                                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                        <option value="America/New_York">America/New_York (EST)</option>
                                        <option value="UTC">UTC</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {activeTab === "notifications" && (
                            <>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px", background: "var(--bg-primary)", borderRadius: "8px" }}>
                                    <div>
                                        <h4 style={{ margin: "0 0 5px 0", fontSize: "15px" }}>Email Notifications</h4>
                                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Receive daily summary and alerts via Email.</p>
                                    </div>
                                    <label style={{ position: "relative", display: "inline-block", width: "50px", height: "24px" }}>
                                        <input type="checkbox" checked={formData.emailNotifications} onChange={e => setFormData({ ...formData, emailNotifications: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: formData.emailNotifications ? "var(--primary)" : "var(--bg-secondary)", borderRadius: "34px", transition: ".4s" }}></span>
                                        <span style={{ position: "absolute", content: '""', height: "16px", width: "16px", left: "4px", bottom: "4px", backgroundColor: "white", borderRadius: "50%", transition: ".4s", transform: formData.emailNotifications ? "translateX(26px)" : "translateX(0)" }}></span>
                                    </label>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px", background: "var(--bg-primary)", borderRadius: "8px" }}>
                                    <div>
                                        <h4 style={{ margin: "0 0 5px 0", fontSize: "15px" }}>Push Notifications</h4>
                                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Receive real-time notifications in your browser.</p>
                                    </div>
                                    <label style={{ position: "relative", display: "inline-block", width: "50px", height: "24px" }}>
                                        <input type="checkbox" checked={formData.pushNotifications} onChange={e => setFormData({ ...formData, pushNotifications: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: formData.pushNotifications ? "var(--primary)" : "var(--bg-secondary)", borderRadius: "34px", transition: ".4s" }}></span>
                                        <span style={{ position: "absolute", content: '""', height: "16px", width: "16px", left: "4px", bottom: "4px", backgroundColor: "white", borderRadius: "50%", transition: ".4s", transform: formData.pushNotifications ? "translateX(26px)" : "translateX(0)" }}></span>
                                    </label>
                                </div>
                            </>
                        )}

                        {activeTab === "security" && (
                            <>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Current Password</label>
                                    <input type="password" className="form-input" placeholder="Enter current password" />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>New Password</label>
                                    <input type="password" className="form-input" placeholder="Enter new password" />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Confirm New Password</label>
                                    <input type="password" className="form-input" placeholder="Confirm new password" />
                                </div>
                                <div style={{ marginTop: "10px" }}>
                                    <button type="button" className="btn btn-secondary">Update Password</button>
                                </div>
                            </>
                        )}

                        {activeTab === "integrations" && (
                            <>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px", background: "var(--bg-primary)", borderRadius: "8px", borderLeft: "4px solid #FBBC04" }}>
                                    <div>
                                        <h4 style={{ margin: "0 0 5px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                            Zoho API Configuration <span className="badge success">Connected</span>
                                        </h4>
                                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Your system holds a valid handshake with Zoho services.</p>
                                    </div>
                                    <button type="button" className="btn btn-secondary" style={{ color: "var(--error)", borderColor: "var(--error)" }}>Disconnect</button>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px", background: "var(--bg-primary)", borderRadius: "8px" }}>
                                    <div>
                                        <h4 style={{ margin: "0 0 5px 0", fontSize: "15px" }}>Auto-Sync Intervals</h4>
                                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Automatically sync Leave and Payroll data every 2 hours.</p>
                                    </div>
                                    <label style={{ position: "relative", display: "inline-block", width: "50px", height: "24px" }}>
                                        <input type="checkbox" checked={formData.autoSync} onChange={e => setFormData({ ...formData, autoSync: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: formData.autoSync ? "var(--primary)" : "var(--bg-secondary)", borderRadius: "34px", transition: ".4s" }}></span>
                                        <span style={{ position: "absolute", content: '""', height: "16px", width: "16px", left: "4px", bottom: "4px", backgroundColor: "white", borderRadius: "50%", transition: ".4s", transform: formData.autoSync ? "translateX(26px)" : "translateX(0)" }}></span>
                                    </label>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>

            {/* Quick Success Toast */}
            {dialogState.show && (
                <div style={{
                    position: "fixed", bottom: "20px", right: "20px",
                    background: "rgba(34, 197, 94, 0.9)", color: "white",
                    padding: "12px 20px", borderRadius: "8px", zIndex: 3000,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px",
                    fontWeight: 600, animation: "fadeIn 0.3s ease-out"
                }}>
                    <FiCheckCircle size={20} /> {dialogState.message}
                </div>
            )}
        </>
    );
}
