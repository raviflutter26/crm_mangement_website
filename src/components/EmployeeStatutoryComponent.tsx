"use client";

import { useState, useEffect, use } from "react";
import axiosInstance from "@/lib/axios";
import { FiShield, FiSave, FiAlertCircle, FiArrowLeft, FiCheckCircle, FiInfo } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function EmployeeStatutoryComponent({ id }: { id: string }) {
    const router = useRouter();
    const [statutory, setStatutory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employee, setEmployee] = useState<any>(null);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [empRes, statRes] = await Promise.all([
                axiosInstance.get(`/api/employees/${id}`),
                axiosInstance.get(`/api/statutory/employee/${id}`)
            ]);
            setEmployee(empRes.data.data);
            setStatutory(statRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const newErrors: any = {};
        if (statutory.pf?.enabled) {
            if (!statutory.pf.uanNumber) newErrors.uan = "UAN is required when PF is enabled";
            else if (!/^\d{12}$/.test(statutory.pf.uanNumber)) newErrors.uan = "UAN must be exactly 12 digits";
            if (!statutory.pf.pfNumber) newErrors.pfNo = "PF Number is required";
        }
        if (statutory.esi?.enabled && !statutory.esi.esiNumber) {
            newErrors.esiNo = "ESI Number is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            showNotify('failure', "Please correct the errors before saving");
            return;
        }

        setSaving(true);
        try {
            await axiosInstance.put(`/api/statutory/employee/${id}`, statutory);
            alert("Statutory details for " + employee.firstName + " updated successfully!");
        } catch (err) {
            alert("Failed to update statutory details");
        } finally {
            setSaving(false);
        }
    };

    const showNotify = (type: string, msg: string) => {
        alert(msg);
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Loading employee statutory details...</div>;
    if (!statutory) return <div style={{ padding: "40px", textAlign: "center", color: "#EF4444" }}>No statutory data found for this employee.</div>;

    const pf = statutory.pf || {};
    const esi = statutory.esi || {};
    const pt = statutory.pt || {};
    const lwf = statutory.lwf || {};
    const bonus = statutory.statutoryBonus || {};

    return (
        <div style={{ padding: "0 40px 40px", height: "100%", overflowY: "auto", background: "#f8fafc" }}>
            <div style={{ padding: "30px 0", borderBottom: "1px solid #e2e8f0", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B", background: "none", border: "none", cursor: "pointer", fontSize: "14px", marginBottom: "12px", fontWeight: 600 }}>
                        <FiArrowLeft /> Back to Employee Profile
                    </button>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1E293B" }}>Statutory & Compliance Details</h1>
                    <p style={{ fontSize: "14px", color: "#64748B", marginTop: "4px" }}>
                        Enrollment for <span style={{ fontWeight: 600, color: "#0084FF" }}>{employee?.firstName} {employee?.lastName}</span> ({employee?.employeeId})
                    </p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    style={{ background: "#0084FF", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 6px -1px rgba(0, 132, 255, 0.2)" }}
                >
                    <FiSave /> {saving ? "Saving..." : "Save Details"}
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px" }}>
                
                {/* Section 1 — Provident Fund (PF) */}
                <div style={{ background: "#fff", border: errors.uan || errors.pfNo ? "1px solid #EF4444" : "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Provident Fund (PF)</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: pf.enabled ? "#16a34a" : "#94a3b8" }}>{pf.enabled ? "ENABLED" : "DISABLED"}</span>
                            <div 
                                onClick={() => setStatutory({...statutory, pf: {...pf, enabled: !pf.enabled}})}
                                style={{ width: "44px", height: "24px", background: pf.enabled ? "#0084FF" : "#cbd5e1", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "all 0.2s" }}
                            >
                                <div style={{ width: "18px", height: "18px", background: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: pf.enabled ? "23px" : "3px", transition: "all 0.2s" }} />
                            </div>
                        </div>
                    </div>
                    
                    {pf.enabled && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>UAN Number (12 digits)</label>
                                <input 
                                    type="text" 
                                    maxLength={12}
                                    value={pf.uanNumber || ""} 
                                    onChange={e => setStatutory({...statutory, pf: {...pf, uanNumber: e.target.value.replace(/\D/g, '')}})} 
                                    style={{ width: "100%", padding: "10px 14px", border: errors.uan ? "1px solid #EF4444" : "1px solid #D1D5DB", borderRadius: "8px" }} 
                                    placeholder="e.g. 100912345678" 
                                />
                                {errors.uan && <p style={{ fontSize: "11px", color: "#EF4444", marginTop: "4px" }}>{errors.uan}</p>}
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>PF Number</label>
                                <input 
                                    type="text" 
                                    value={pf.pfNumber || ""} 
                                    onChange={e => setStatutory({...statutory, pf: {...pf, pfNumber: e.target.value}})} 
                                    style={{ width: "100%", padding: "10px 14px", border: errors.pfNo ? "1px solid #EF4444" : "1px solid #D1D5DB", borderRadius: "8px" }} 
                                    placeholder="e.g. MH/BAN/12345/123" 
                                />
                                {errors.pfNo && <p style={{ fontSize: "11px", color: "#EF4444", marginTop: "4px" }}>{errors.pfNo}</p>}
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>PF Joining Date</label>
                                <input type="date" value={pf.pfJoiningDate?.split('T')[0] || ""} onChange={e => setStatutory({...statutory, pf: {...pf, pfJoiningDate: e.target.value}})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                            </div>
                            <div style={{ gridColumn: "span 2" }}>
                                <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "16px", color: "#1E293B" }}>Contribution Preferences (Included in CTC)</p>
                                <div style={{ display: "flex", gap: "24px" }}>
                                    {[
                                        { key: 'includeEmployerPF', label: 'Employer PF' },
                                        { key: 'includeEDLI', label: 'EDLI' },
                                        { key: 'includeAdminCharges', label: 'Admin Charges' }
                                    ].map(item => (
                                        <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer", color: "#475569" }}>
                                            <input type="checkbox" checked={pf.contributionPreferences?.[item.key]} onChange={e => setStatutory({...statutory, pf: {...pf, contributionPreferences: {...pf.contributionPreferences, [item.key]: e.target.checked}}})} />
                                            {item.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 2 — ESI */}
                <div style={{ background: "#fff", border: errors.esiNo ? "1px solid #EF4444" : "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>ESI Enrollment</h3>
                        <div 
                            onClick={() => setStatutory({...statutory, esi: {...esi, enabled: !esi.enabled}})}
                            style={{ width: "44px", height: "24px", background: esi.enabled ? "#0084FF" : "#cbd5e1", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "all 0.2s" }}
                        >
                            <div style={{ width: "18px", height: "18px", background: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: esi.enabled ? "23px" : "3px", transition: "all 0.2s" }} />
                        </div>
                    </div>
                    {esi.enabled && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>ESI Number</label>
                                <input 
                                    type="text" 
                                    value={esi.esiNumber || ""} 
                                    onChange={e => setStatutory({...statutory, esi: {...esi, esiNumber: e.target.value}})} 
                                    style={{ width: "100%", padding: "10px 14px", border: errors.esiNo ? "1px solid #EF4444" : "1px solid #D1D5DB", borderRadius: "8px" }} 
                                />
                                {errors.esiNo && <p style={{ fontSize: "11px", color: "#EF4444", marginTop: "4px" }}>{errors.esiNo}</p>}
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>ESI Joining Date</label>
                                <input type="date" value={esi.esiJoiningDate?.split('T')[0] || ""} onChange={e => setStatutory({...statutory, esi: {...esi, esiJoiningDate: e.target.value}})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 3 — Professional Tax */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Professional Tax (PT)</h3>
                        <div 
                            onClick={() => setStatutory({...statutory, pt: {...pt, enabled: !pt.enabled}})}
                            style={{ width: "44px", height: "24px", background: pt.enabled ? "#0084FF" : "#cbd5e1", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "all 0.2s" }}
                        >
                            <div style={{ width: "18px", height: "18px", background: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: pt.enabled ? "23px" : "3px", transition: "all 0.2s" }} />
                        </div>
                    </div>
                    {pt.enabled && (
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>PT Registration Number</label>
                            <input type="text" value={pt.ptRegistrationNumber || ""} onChange={e => setStatutory({...statutory, pt: {...pt, ptRegistrationNumber: e.target.value}})} style={{ width: "100%", maxWidth: "400px", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                        </div>
                    )}
                </div>

                {/* Section 4 — LWF */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Labour Welfare Fund (LWF)</h3>
                        <div 
                            onClick={() => setStatutory({...statutory, lwf: {...lwf, enabled: !lwf.enabled}})}
                            style={{ width: "44px", height: "24px", background: lwf.enabled ? "#0084FF" : "#cbd5e1", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "all 0.2s" }}
                        >
                            <div style={{ width: "18px", height: "18px", background: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: lwf.enabled ? "23px" : "3px", transition: "all 0.2s" }} />
                        </div>
                    </div>
                    {lwf.enabled && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>LWF Account Number</label>
                                <input type="text" value={lwf.lwfAccountNumber || ""} onChange={e => setStatutory({...statutory, lwf: {...lwf, lwfAccountNumber: e.target.value}})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 5 — Statutory Bonus */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Statutory Bonus</h3>
                        <div 
                            onClick={() => setStatutory({...statutory, statutoryBonus: {...bonus, enabled: !bonus.enabled}})}
                            style={{ width: "44px", height: "24px", background: bonus.enabled ? "#0084FF" : "#cbd5e1", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "all 0.2s" }}
                        >
                            <div style={{ width: "18px", height: "18px", background: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: bonus.enabled ? "23px" : "3px", transition: "all 0.2s" }} />
                        </div>
                    </div>
                    {bonus.enabled && (
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Bonus Amount (Accrued Monthly)</label>
                            <input type="number" value={bonus.bonusAmount || 0} onChange={e => setStatutory({...statutory, statutoryBonus: {...bonus, bonusAmount: Number(e.target.value)}})} style={{ width: "100%", maxWidth: "400px", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                        </div>
                    )}
                </div>
            </div>
            
            <div style={{ marginTop: "30px", padding: "24px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", gap: "16px", alignItems: "flex-start", maxWidth: "900px" }}>
                <FiInfo color="#0084FF" size={24} style={{ marginTop: "2px" }} />
                <div>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>Compliance Enrollment Tip</h4>
                    <p style={{ fontSize: "13px", color: "#64748B", lineHeight: "1.5" }}>
                        Changes made here will be effective from the next payroll cycle. 
                        UAN and ESI numbers are mandatory for accurate statutory filing and direct credits to employee accounts.
                    </p>
                </div>
            </div>
        </div>
    );
}
