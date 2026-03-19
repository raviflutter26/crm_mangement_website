"use client";

import { useState, useEffect, use } from "react";
import axiosInstance from "@/lib/axios";
import { FiShield, FiSave, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";

export default function EmployeeStatutoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [statutory, setStatutory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employee, setEmployee] = useState<any>(null);

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

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosInstance.put(`/api/statutory/employee/${id}`, statutory);
            alert("Statutory details updated successfully");
        } catch (err) {
            alert("Failed to update statutory details");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: "40px" }}>Loading employee statutory details...</div>;
    if (!statutory) return <div style={{ padding: "40px" }}>No statutory data found for this employee.</div>;

    const pf = statutory.pf || {};
    const esi = statutory.esi || {};
    const pt = statutory.pt || {};
    const lwf = statutory.lwf || {};
    const bonus = statutory.statutoryBonus || {};

    return (
        <div style={{ padding: "0 40px 40px", height: "100%", overflowY: "auto" }}>
            <div style={{ padding: "30px 0", borderBottom: "1px solid var(--border)", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1E293B" }}>Statutory & Compliance Details</h1>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Employee: <span style={{ fontWeight: 600, color: "var(--primary)" }}>{employee?.firstName} {employee?.lastName}</span> ({employee?.employeeId})
                    </p>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    <FiSave /> {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px" }}>
                
                {/* Provident Fund (PF) */}
                <div className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Provident Fund (PF)</h3>
                        <input type="checkbox" checked={pf.enabled} onChange={e => setStatutory({...statutory, pf: {...pf, enabled: e.target.checked}})} style={{ width: "20px", height: "20px" }} />
                    </div>
                    
                    {pf.enabled && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <label className="form-label">UAN Number</label>
                                <input type="text" value={pf.uanNumber || ""} onChange={e => setStatutory({...statutory, pf: {...pf, uanNumber: e.target.value}})} className="form-input" placeholder="12-digit UAN" />
                            </div>
                            <div>
                                <label className="form-label">PF Number</label>
                                <input type="text" value={pf.pfNumber || ""} onChange={e => setStatutory({...statutory, pf: {...pf, pfNumber: e.target.value}})} className="form-input" />
                            </div>
                            <div style={{ gridColumn: "span 2" }}>
                                <p style={{ fontWeight: 600, fontSize: "13px", marginBottom: "12px", marginTop: "10px" }}>Contribution Preferences (Included in CTC)</p>
                                <div style={{ display: "flex", gap: "30px" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                                        <input type="checkbox" checked={pf.contributionPreferences?.includeEmployerPF} onChange={e => setStatutory({...statutory, pf: {...pf, contributionPreferences: {...pf.contributionPreferences, includeEmployerPF: e.target.checked}}})} /> Employer PF
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                                        <input type="checkbox" checked={pf.contributionPreferences?.includeEDLI} onChange={e => setStatutory({...statutory, pf: {...pf, contributionPreferences: {...pf.contributionPreferences, includeEDLI: e.target.checked}}})} /> EDLI
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                                        <input type="checkbox" checked={pf.contributionPreferences?.includeAdminCharges} onChange={e => setStatutory({...statutory, pf: {...pf, contributionPreferences: {...pf.contributionPreferences, includeAdminCharges: e.target.checked}}})} /> Admin Charges
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ESI */}
                <div className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700 }}>ESI</h3>
                        <input type="checkbox" checked={esi.enabled} onChange={e => setStatutory({...statutory, esi: {...esi, enabled: e.target.checked}})} style={{ width: "20px", height: "20px" }} />
                    </div>
                    {esi.enabled && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <label className="form-label">ESI Number</label>
                                <input type="text" value={esi.esiNumber || ""} onChange={e => setStatutory({...statutory, esi: {...esi, esiNumber: e.target.value}})} className="form-input" />
                            </div>
                            <div>
                                <label className="form-label">Deduction Cycle</label>
                                <select value={esi.deductionCycle} onChange={e => setStatutory({...statutory, esi: {...esi, deductionCycle: e.target.value}})} className="form-input">
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Professional Tax */}
                <div className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Professional Tax</h3>
                        <input type="checkbox" checked={pt.enabled} onChange={e => setStatutory({...statutory, pt: {...pt, enabled: e.target.checked}})} style={{ width: "20px", height: "20px" }} />
                    </div>
                    {pt.enabled && (
                        <div>
                            <label className="form-label">PT Registration Number</label>
                            <input type="text" value={pt.ptRegistrationNumber || ""} onChange={e => setStatutory({...statutory, pt: {...pt, ptRegistrationNumber: e.target.value}})} className="form-input" />
                        </div>
                    )}
                </div>

                {/* Labour Welfare Fund */}
                <div className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Labour Welfare Fund</h3>
                        <input type="checkbox" checked={lwf.enabled} onChange={e => setStatutory({...statutory, lwf: {...lwf, enabled: e.target.checked}})} style={{ width: "20px", height: "20px" }} />
                    </div>
                    {lwf.enabled && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <label className="form-label">LWF Account No.</label>
                                <input type="text" value={lwf.lwfAccountNumber || ""} onChange={e => setStatutory({...statutory, lwf: {...lwf, lwfAccountNumber: e.target.value}})} className="form-input" />
                            </div>
                            <div>
                                <label className="form-label">Deduction Cycle</label>
                                <select value={lwf.deductionCycle} onChange={e => setStatutory({...statutory, lwf: {...lwf, deductionCycle: e.target.value}})} className="form-input">
                                    <option value="Yearly">Yearly</option>
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Statutory Bonus */}
                <div className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Statutory Bonus</h3>
                        <input type="checkbox" checked={bonus.enabled} onChange={e => setStatutory({...statutory, statutoryBonus: {...bonus, enabled: e.target.checked}})} style={{ width: "20px", height: "20px" }} />
                    </div>
                    {bonus.enabled && (
                        <div>
                            <label className="form-label">Bonus Amount (₹)</label>
                            <input type="number" value={bonus.bonusAmount || 0} onChange={e => setStatutory({...statutory, statutoryBonus: {...bonus, bonusAmount: Number(e.target.value)}})} className="form-input" />
                        </div>
                    )}
                </div>
            </div>
            
            <div style={{ marginTop: "30px", padding: "20px", background: "#fef2f2", borderRadius: "12px", border: "1px solid #fee2e2", display: "flex", gap: "10px", alignItems: "flex-start", maxWidth: "900px" }}>
                <FiAlertCircle color="#ef4444" size={20} />
                <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#991b1b" }}>Note on Overrides</p>
                    <p style={{ fontSize: "12px", color: "#b91c1c", marginTop: "4px" }}>
                        Employee-level statutory settings take precedence over global company settings. 
                        Ensure all numbers (UAN, PF, ESI) are accurate before saving.
                    </p>
                </div>
            </div>
        </div>
    );
}
