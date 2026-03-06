"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { FiShield, FiSave, FiCheckCircle, FiAlertTriangle, FiPercent, FiDollarSign } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

export default function CompliancePage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");
    const [activeSection, setActiveSection] = useState("pf");

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const fetchSettings = useCallback(async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.COMPLIANCE);
            setSettings(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosInstance.put(API_ENDPOINTS.COMPLIANCE, settings);
            showToast("Compliance settings saved! ✅");
        } catch (err: any) { alert(err.response?.data?.message || "Save failed"); }
        finally { setSaving(false); }
    };

    const updateNested = (path: string, value: any) => {
        const newSettings = { ...settings };
        const keys = path.split(".");
        let obj: any = newSettings;
        for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
        obj[keys[keys.length - 1]] = value;
        setSettings(newSettings);
    };

    const sections = [
        { id: "pf", label: "Provident Fund (PF)", icon: FiShield, color: "#1A73E8" },
        { id: "esi", label: "ESI", icon: FiPercent, color: "#34A853" },
        { id: "pt", label: "Professional Tax", icon: FiDollarSign, color: "#FF6D00" },
        { id: "tds", label: "TDS / Income Tax", icon: FiAlertTriangle, color: "#7C3AED" },
        { id: "company", label: "Company Info", icon: FiShield, color: "#EA4335" },
    ];

    if (loading || !settings) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Compliance Settings...</div>;

    const renderField = (label: string, path: string, type: string = "number", unit: string = "") => (
        <div key={path}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "var(--text-secondary)" }}>{label} {unit && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>({unit})</span>}</label>
            <input type={type} className="form-input" value={path.split(".").reduce((o: any, k) => o?.[k], settings) ?? ""} onChange={e => updateNested(path, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)} />
        </div>
    );

    const renderToggle = (label: string, path: string) => {
        const val = path.split(".").reduce((o: any, k) => o?.[k], settings);
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontWeight: 600 }}>{label}</span>
                <div onClick={() => updateNested(path, !val)} style={{ width: "44px", height: "24px", borderRadius: "12px", background: val ? "#34A853" : "var(--border)", cursor: "pointer", position: "relative", transition: "0.3s" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "10px", background: "white", position: "absolute", top: "2px", left: val ? "22px" : "2px", transition: "0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings & Compliance</h1>
                    <p className="page-subtitle">Configure PF, ESI, Professional Tax, and TDS rules for payroll processing</p>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <><FiCheckCircle /> Saving...</> : <><FiSave /> Save Settings</>}
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px" }}>
                {/* Sidebar */}
                <div className="card" style={{ padding: "12px" }}>
                    {sections.map(s => (
                        <div key={s.id} className={`sidebar-item ${activeSection === s.id ? "active" : ""}`}
                            onClick={() => setActiveSection(s.id)} style={{ cursor: "pointer" }}>
                            <s.icon style={{ color: s.color }} /> {s.label}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="card" style={{ padding: "24px" }}>
                    {activeSection === "pf" && (
                        <>
                            <h3 style={{ marginBottom: "16px", fontWeight: 700 }}>🛡️ Provident Fund (PF) Settings</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
                                As per EPF Act 1952. Basic PF wage ceiling: ₹15,000/month. Both employee & employer contribute 12%.
                            </p>
                            {renderToggle("PF Enabled", "pf.enabled")}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                                {renderField("Employee Contribution", "pf.employeeContribution", "number", "%")}
                                {renderField("Employer Contribution", "pf.employerContribution", "number", "%")}
                                {renderField("Wage Ceiling", "pf.wageLimit", "number", "₹/month")}
                                {renderField("Admin Charges", "pf.adminCharges", "number", "%")}
                                {renderField("EDLI Charges", "pf.edliCharges", "number", "%")}
                            </div>
                        </>
                    )}

                    {activeSection === "esi" && (
                        <>
                            <h3 style={{ marginBottom: "16px", fontWeight: 700 }}>🏥 ESI Settings</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
                                ESI applies to employees with gross salary ≤ ₹21,000/month. Employee: 0.75%, Employer: 3.25%.
                            </p>
                            {renderToggle("ESI Enabled", "esi.enabled")}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                                {renderField("Employee Contribution", "esi.employeeContribution", "number", "%")}
                                {renderField("Employer Contribution", "esi.employerContribution", "number", "%")}
                                {renderField("Wage Ceiling", "esi.wageLimit", "number", "₹/month")}
                            </div>
                        </>
                    )}

                    {activeSection === "pt" && (
                        <>
                            <h3 style={{ marginBottom: "16px", fontWeight: 700 }}>💼 Professional Tax Settings</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
                                Professional Tax is levied by state governments. Rates vary by state. Max ₹2,500/year.
                            </p>
                            {renderToggle("PT Enabled", "professionalTax.enabled")}
                            {renderField("State", "professionalTax.state", "text")}
                            <h4 style={{ marginTop: "16px", marginBottom: "10px", fontSize: "14px" }}>PT Slabs</h4>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Min Salary (₹)</th><th>Max Salary (₹)</th><th>Tax Amount (₹/month)</th></tr></thead>
                                    <tbody>
                                        {(settings.professionalTax?.slabs || []).map((slab: any, i: number) => (
                                            <tr key={i}>
                                                <td><input type="number" className="form-input" value={slab.minSalary} onChange={e => { const s = [...settings.professionalTax.slabs]; s[i].minSalary = parseFloat(e.target.value) || 0; updateNested("professionalTax.slabs", s); }} /></td>
                                                <td><input type="number" className="form-input" value={slab.maxSalary} onChange={e => { const s = [...settings.professionalTax.slabs]; s[i].maxSalary = parseFloat(e.target.value) || 0; updateNested("professionalTax.slabs", s); }} /></td>
                                                <td><input type="number" className="form-input" value={slab.taxAmount} onChange={e => { const s = [...settings.professionalTax.slabs]; s[i].taxAmount = parseFloat(e.target.value) || 0; updateNested("professionalTax.slabs", s); }} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeSection === "tds" && (
                        <>
                            <h3 style={{ marginBottom: "16px", fontWeight: 700 }}>📊 TDS / Income Tax Settings</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
                                TDS deducted monthly based on estimated annual taxable income under New/Old regime.
                            </p>
                            {renderToggle("TDS Enabled", "tds.enabled")}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "var(--text-secondary)" }}>Default Regime</label>
                                    <select className="form-input" value={settings.tds?.regime || "new"} onChange={e => updateNested("tds.regime", e.target.value)}>
                                        <option value="new">New Regime (FY 2025-26)</option>
                                        <option value="old">Old Regime</option>
                                    </select>
                                </div>
                                {renderField("Cess Rate", "tds.cessRate", "number", "%")}
                            </div>
                            <h4 style={{ marginTop: "20px", marginBottom: "10px", fontSize: "14px" }}>New Regime Slabs</h4>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Min Income (₹)</th><th>Max Income (₹)</th><th>Rate (%)</th></tr></thead>
                                    <tbody>
                                        {(settings.tds?.newRegimeSlabs || []).map((slab: any, i: number) => (
                                            <tr key={i}>
                                                <td style={{ fontFamily: "monospace" }}>₹{slab.minIncome?.toLocaleString()}</td>
                                                <td style={{ fontFamily: "monospace" }}>₹{slab.maxIncome?.toLocaleString()}</td>
                                                <td style={{ fontWeight: 700 }}>{slab.rate}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeSection === "company" && (
                        <>
                            <h3 style={{ marginBottom: "16px", fontWeight: 700 }}>🏢 Company Registration Details</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {renderField("Company Name", "companyName", "text")}
                                {renderField("Financial Year", "financialYear", "text")}
                                {renderField("PF Registration No.", "pfRegistrationNumber", "text")}
                                {renderField("ESI Registration No.", "esiRegistrationNumber", "text")}
                                {renderField("TAN Number", "tanNumber", "text")}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {toast && (
                <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "rgba(34, 197, 94, 0.9)", color: "white", padding: "12px 20px", borderRadius: "8px", zIndex: 3000, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
                    <FiCheckCircle size={20} /> {toast}
                </div>
            )}
        </>
    );
}
