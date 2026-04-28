"use client";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import EmployeeBankStatus from "@/components/payroll/EmployeeBankStatus";
import { FiSearch, FiUsers, FiLock, FiSave, FiX } from "react-icons/fi";

const fmt = (n: any) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedEmp, setSelectedEmp] = useState<any>(null);
    const [showBankModal, setShowBankModal] = useState(false);
    const [showStructureModal, setShowStructureModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [bankForm, setBankForm] = useState({ accountNumber: "", ifsc: "", bankName: "", accountType: "savings", uan: "", pan: "" });
    const [structureForm, setStructureForm] = useState({ basic: "", hra: "", da: "", ta: "", specialAllowance: "", medicalAllowance: "", bonus: "" });

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try { const res = await axiosInstance.get(API_ENDPOINTS.EMPLOYEES); setEmployees(res.data.data || []); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    const filtered = employees.filter(e => `${e.firstName} ${e.lastName} ${e.employeeId}`.toLowerCase().includes(search.toLowerCase()));
    const bankReady = employees.filter(e => e.bankAccount?.maskedAccount).length;
    const razorpayReady = employees.filter(e => e.bankAccount?.razorpayFundAccountId).length;
    const unverified = employees.filter(e => e.bankAccount?.maskedAccount && !e.bankAccount?.verified).length;

    const openBankModal = (emp: any) => { setSelectedEmp(emp); setBankForm({ accountNumber: "", ifsc: "", bankName: "", accountType: "savings", uan: emp.uan || "", pan: emp.pan || "" }); setShowBankModal(true); };
    const openStructureModal = (emp: any) => { setSelectedEmp(emp); const s = emp.salaryStructure || {}; setStructureForm({ basic: s.basic || "", hra: s.hra || "", da: s.da || "", ta: s.ta || "", specialAllowance: s.specialAllowance || "", medicalAllowance: s.medicalAllowance || "", bonus: s.bonus || "" }); setShowStructureModal(true); };

    const saveBankDetails = async () => {
        if (!selectedEmp) return; setSaving(true);
        try { await axiosInstance.put(API_ENDPOINTS.BANK_EMPLOYEE(selectedEmp._id), bankForm); setShowBankModal(false); fetchEmployees(); }
        catch (e: any) { alert(e.response?.data?.message || "Failed to save"); } finally { setSaving(false); }
    };
    const saveSalaryStructure = async () => {
        if (!selectedEmp) return; setSaving(true);
        try { await axiosInstance.put(API_ENDPOINTS.EMPLOYEE_SALARY_STRUCTURE(selectedEmp._id), structureForm); setShowStructureModal(false); fetchEmployees(); }
        catch (e: any) { alert(e.response?.data?.message || "Failed to save"); } finally { setSaving(false); }
    };

    return (
        <>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Employees & Bank Setup</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Manage salary structures and RazorpayX bank configurations</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                {[{ label: "Total Employees", value: employees.length, color: "var(--primary)", bg: "var(--primary-bg-light)" }, { label: "Bank Configured", value: bankReady, color: "var(--secondary)", bg: "var(--secondary-bg-light)" }, { label: "RazorpayX Ready", value: razorpayReady, color: "var(--purple)", bg: "var(--purple-bg-light)" }, { label: "Unverified", value: unverified, color: "var(--warning)", bg: "var(--warning-bg-light)" }].map((s, i) => (
                    <div key={i} style={{ background: "var(--bg-secondary)", borderRadius: 16, padding: "18px 20px", border: `1px solid ${s.bg}` }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>
            <div style={{ position: "relative", marginBottom: 20, maxWidth: 360 }}>
                <FiSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: 42 }} placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ background: "var(--bg-secondary)", borderRadius: 20, padding: "20px 24px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}><FiUsers size={16} style={{ color: "var(--primary)" }} /> Employee Bank & Salary Status</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}><FiLock size={12} style={{ color: "var(--purple)" }} /> Bank details are AES-256 encrypted at rest</div>
                </div>
                {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-pulse" style={{ height: 68, borderRadius: 12, marginBottom: 8 }} />) :
                    filtered.length === 0 ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>No employees found</div> :
                    filtered.map((emp) => (
                        <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1 }}><EmployeeBankStatus employee={emp} onSetupBank={() => openBankModal(emp)} /></div>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0, marginBottom: 8 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openBankModal(emp)}>{emp.bankAccount?.maskedAccount ? "Edit Bank" : "Add Bank"}</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => openStructureModal(emp)}>Salary Structure</button>
                            </div>
                        </div>
                    ))
                }
            </div>

            {showBankModal && selectedEmp && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: 480 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h3>Bank Account — {selectedEmp.firstName} {selectedEmp.lastName}</h3>
                            <button onClick={() => setShowBankModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><FiX size={20} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[{ label: "Account Number", key: "accountNumber", placeholder: "Enter account number" }, { label: "IFSC Code", key: "ifsc", placeholder: "e.g. HDFC0001234" }, { label: "Bank Name", key: "bankName", placeholder: "e.g. HDFC Bank" }, { label: "UAN (PF)", key: "uan", placeholder: "Universal Account Number" }, { label: "PAN", key: "pan", placeholder: "Employee PAN" }].map(f => (
                                <div key={f.key}>
                                    <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600 }}>{f.label}</label>
                                    <input className="form-input" placeholder={f.placeholder} value={(bankForm as any)[f.key]} onChange={e => setBankForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowBankModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveBankDetails} disabled={saving}><FiSave size={14} /> {saving ? "Saving…" : "Save Bank Details"}</button>
                        </div>
                    </div>
                </div>
            )}

            {showStructureModal && selectedEmp && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: 520 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h3>Salary Structure — {selectedEmp.firstName} {selectedEmp.lastName}</h3>
                            <button onClick={() => setShowStructureModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><FiX size={20} /></button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {[{ label: "Basic Salary (₹)", key: "basic" }, { label: "HRA (₹)", key: "hra" }, { label: "DA (₹)", key: "da" }, { label: "TA (₹)", key: "ta" }, { label: "Special Allowance (₹)", key: "specialAllowance" }, { label: "Medical Allowance (₹)", key: "medicalAllowance" }, { label: "Bonus (₹)", key: "bonus" }].map(f => (
                                <div key={f.key}>
                                    <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600 }}>{f.label}</label>
                                    <input className="form-input" type="number" placeholder="0" value={(structureForm as any)[f.key]} onChange={e => setStructureForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                        {structureForm.basic && (
                            <div style={{ marginTop: 16, padding: "14px 18px", background: "var(--primary-bg-light)", borderRadius: 12, fontSize: 13 }}>
                                <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: 6 }}>Calculated CTC Preview</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, color: "var(--text-secondary)" }}>
                                    <div>Gross: {fmt(Object.values(structureForm).reduce((s: any, v: any) => s + (parseFloat(v) || 0), 0))}</div>
                                    <div>PF: {fmt((parseFloat(structureForm.basic) || 0) * 0.12)}</div>
                                </div>
                            </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowStructureModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveSalaryStructure} disabled={saving}><FiSave size={14} /> {saving ? "Saving…" : "Save Structure"}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
