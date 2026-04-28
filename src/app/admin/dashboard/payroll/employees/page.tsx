"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import EmployeeBankStatus from "@/components/payroll/EmployeeBankStatus";
import { FiSearch, FiUsers, FiLock, FiPlus, FiX, FiSave } from "react-icons/fi";

const fmt = (n: any) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function PayrollEmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedEmp, setSelectedEmp] = useState<any>(null);
    const [showStructureModal, setShowStructureModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [bankForm, setBankForm] = useState({ accountNumber: "", ifsc: "", bankName: "", accountType: "savings", uan: "", pan: "" });
    const [structureForm, setStructureForm] = useState({ basic: "", hra: "", da: "", ta: "", specialAllowance: "", medicalAllowance: "", bonus: "" });

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.EMPLOYEES);
            setEmployees(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    const filtered = employees.filter(e =>
        `${e.firstName} ${e.lastName} ${e.employeeId}`.toLowerCase().includes(search.toLowerCase())
    );

    const bankReady = employees.filter(e => e.bankAccount?.maskedAccount).length;
    const razorpayReady = employees.filter(e => e.bankAccount?.razorpayFundAccountId).length;
    const unverified = employees.filter(e => e.bankAccount?.maskedAccount && !e.bankAccount?.verified).length;

    const openBankModal = (emp: any) => { setSelectedEmp(emp); setBankForm({ accountNumber: "", ifsc: "", bankName: "", accountType: "savings", uan: emp.uan || "", pan: emp.pan || "" }); setShowBankModal(true); };
    const openStructureModal = (emp: any) => {
        setSelectedEmp(emp);
        const s = emp.salaryStructure || {};
        setStructureForm({ basic: s.basic || "", hra: s.hra || "", da: s.da || "", ta: s.ta || "", specialAllowance: s.specialAllowance || "", medicalAllowance: s.medicalAllowance || "", bonus: s.bonus || "" });
        setShowStructureModal(true);
    };

    const saveBankDetails = async () => {
        if (!selectedEmp) return;
        setSaving(true);
        try {
            await axiosInstance.put(API_ENDPOINTS.BANK_EMPLOYEE(selectedEmp._id), bankForm);
            setShowBankModal(false);
            fetchEmployees();
        } catch (e: any) { alert(e.response?.data?.message || "Failed to save bank details"); }
        finally { setSaving(false); }
    };

    const saveSalaryStructure = async () => {
        if (!selectedEmp) return;
        setSaving(true);
        try {
            await axiosInstance.put(API_ENDPOINTS.EMPLOYEE_SALARY_STRUCTURE(selectedEmp._id), structureForm);
            setShowStructureModal(false);
            fetchEmployees();
        } catch (e: any) { alert(e.response?.data?.message || "Failed to save salary structure"); }
        finally { setSaving(false); }
    };

    return (
        <>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E1B4B", margin: 0 }}>Employees & Bank Setup</h1>
                <p style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>Manage salary structures and RazorpayX bank configurations</p>
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                {[
                    { label: "Total Employees", value: employees.length, color: "#6366F1", bg: "#EEF2FF" },
                    { label: "Bank Configured", value: bankReady, color: "#10B981", bg: "#D1FAE5" },
                    { label: "RazorpayX Ready", value: razorpayReady, color: "#7C3AED", bg: "#EDE9FE" },
                    { label: "Unverified", value: unverified, color: "#F59E0B", bg: "#FEF3C7" },
                ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: `1px solid ${s.bg}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 20, maxWidth: 360 }}>
                <FiSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                <input className="form-input" style={{ paddingLeft: 42 }} placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Employee List */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", border: "1px solid #E8EAFF", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1E1B4B", display: "flex", alignItems: "center", gap: 8 }}>
                        <FiUsers size={16} style={{ color: "#6366F1" }} /> Employee Bank & Salary Status
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B" }}>
                        <FiLock size={12} style={{ color: "#7C3AED" }} /> Bank details are AES-256 encrypted at rest
                    </div>
                </div>

                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton-pulse" style={{ height: 68, borderRadius: 12, marginBottom: 8 }} />
                    ))
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>No employees found</div>
                ) : (
                    filtered.map((emp) => (
                        <div key={emp._id}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <EmployeeBankStatus employee={emp} onSetupBank={() => openBankModal(emp)} />
                                </div>
                                <div style={{ display: "flex", gap: 6, flexShrink: 0, marginBottom: 8 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openBankModal(emp)} title="Configure Bank">
                                        {emp.bankAccount?.maskedAccount ? "Edit Bank" : "Add Bank"}
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openStructureModal(emp)} title="Salary Structure">
                                        Salary Structure
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bank Modal */}
            {showBankModal && selectedEmp && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: 480 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h3>Bank Account — {selectedEmp.firstName} {selectedEmp.lastName}</h3>
                            <button onClick={() => setShowBankModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><FiX size={20} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[
                                { label: "Account Number", key: "accountNumber", type: "text", placeholder: "Enter account number" },
                                { label: "IFSC Code", key: "ifsc", type: "text", placeholder: "e.g. HDFC0001234" },
                                { label: "Bank Name", key: "bankName", type: "text", placeholder: "e.g. HDFC Bank" },
                                { label: "UAN (PF)", key: "uan", type: "text", placeholder: "Universal Account Number" },
                                { label: "PAN", key: "pan", type: "text", placeholder: "Employee PAN number" },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600 }}>{f.label}</label>
                                    <input className="form-input" type={f.type} placeholder={f.placeholder}
                                        value={(bankForm as any)[f.key]} onChange={e => setBankForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                                </div>
                            ))}
                            <div>
                                <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Account Type</label>
                                <select className="form-input" value={bankForm.accountType} onChange={e => setBankForm(prev => ({ ...prev, accountType: e.target.value }))}>
                                    <option value="savings">Savings</option>
                                    <option value="current">Current</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowBankModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveBankDetails} disabled={saving}>
                                <FiSave size={14} /> {saving ? "Saving…" : "Save Bank Details"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Salary Structure Modal */}
            {showStructureModal && selectedEmp && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: 520 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h3>Salary Structure — {selectedEmp.firstName} {selectedEmp.lastName}</h3>
                            <button onClick={() => setShowStructureModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><FiX size={20} /></button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {[
                                { label: "Basic Salary (₹)", key: "basic" },
                                { label: "HRA (₹)", key: "hra" },
                                { label: "Dearness Allowance (₹)", key: "da" },
                                { label: "Transport Allowance (₹)", key: "ta" },
                                { label: "Special Allowance (₹)", key: "specialAllowance" },
                                { label: "Medical Allowance (₹)", key: "medicalAllowance" },
                                { label: "Bonus (₹)", key: "bonus" },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600 }}>{f.label}</label>
                                    <input className="form-input" type="number" placeholder="0"
                                        value={(structureForm as any)[f.key]} onChange={e => setStructureForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                        {(structureForm.basic) && (
                            <div style={{ marginTop: 16, padding: "14px 18px", background: "#EEF2FF", borderRadius: 12, fontSize: 13 }}>
                                <div style={{ fontWeight: 700, color: "#4F46E5", marginBottom: 6 }}>Calculated CTC Preview</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, color: "#475569" }}>
                                    <div>Gross: {fmt(Object.values(structureForm).reduce((s: any, v: any) => s + (parseFloat(v) || 0), 0))}</div>
                                    <div>PF: {fmt((parseFloat(structureForm.basic) || 0) * 0.12)}</div>
                                </div>
                            </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowStructureModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveSalaryStructure} disabled={saving}>
                                <FiSave size={14} /> {saving ? "Saving…" : "Save Structure"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
