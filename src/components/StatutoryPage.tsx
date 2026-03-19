"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { 
    FiShield, FiInfo, FiEdit2, FiTrash2, FiPlus, FiCheckCircle, FiXCircle, FiTrendingUp
} from "react-icons/fi";
import EPFCalculatorPanel from "./statutory/EPFCalculatorPanel";
import PTSlabsModal from "./statutory/PTSlabsModal";

const TAB_LIST = [
    { id: "epf", label: "EPF" },
    { id: "esi", label: "ESI" },
    { id: "pt", label: "Professional Tax" },
    { id: "lwf", label: "Labour Welfare Fund" },
    { id: "bonus", label: "Statutory Bonus" }
];

interface StatutoryConfig {
    epf: {
        epfEnabled: boolean;
        epfNumber: string;
        deductionCycle: string;
        employeeContributionRate: number;
        employerContributionMode: string;
        employerPFWageLimit: number;
        epfContributionPreference: string;
        includedInCTC: {
            employerPFContribution: boolean;
            edliContribution: boolean;
            adminCharges: boolean;
        };
        allowEmployeeLevelOverride: boolean;
        proRateRestrictedPFWage: boolean;
        considerLOP: boolean;
        abryEligible: boolean;
    };
    esi: {
        esiEnabled: boolean;
        esiNumber: string;
        esiDeductionCycle: string;
        esiSalaryLimit: number;
        employeeContribution: number;
        employerContribution: number;
        includeInCTC: boolean;
    };
    professionalTax: {
        enabled: boolean;
        ptRegistrationNumber: string;
        ptState: string;
        ptDeductionCycle: string;
        ptSlabs: any[];
    };
    labourWelfareFund: {
        enabled: boolean;
        lwfAccountNumber: string;
        lwfState: string;
        employeeContribution: number;
        employerContribution: number;
        lwfDeductionCycle: string;
    };
    statutoryBonus: {
        enabled: boolean;
        bonusPercentage: number;
        eligibilityLimit: number;
        paymentFrequency: string;
    };
}

export default function StatutoryPage({ showNotify }: { showNotify: (type: 'success' | 'failure' | 'warning', msg: string) => void }) {
    const [activeTab, setActiveTab] = useState("epf");
    const [config, setConfig] = useState<StatutoryConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Preview states
    const [pfWagePreview, setPfWagePreview] = useState(20000);
    const [isPTModalOpen, setIsPTModalOpen] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axiosInstance.get('/api/statutory/config');
            setConfig(res.data.data);
        } catch (err) {
            showNotify('failure', "Failed to load statutory configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (type: string, data: any) => {
        setSaving(true);
        try {
            await axiosInstance.put(`/api/statutory/config/${type}`, data);
            showNotify('success', `${type.toUpperCase()} settings updated successfully`);
            fetchConfig();
        } catch (err) {
            showNotify('failure', `Failed to update ${type} settings`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: "40px" }}>Loading configuration...</div>;
    if (!config) return <div style={{ padding: "40px" }}>No configuration found.</div>;

    return (
        <div style={{ padding: "0 40px 40px", height: "100%", overflowY: "auto" }}>
            <div style={{ padding: "30px 0", borderBottom: "1px solid var(--border)", marginBottom: "30px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1E293B" }}>Statutory Components</h1>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>Manage company-level statutory and compliance settings</p>
            </div>

            <div style={{ display: "flex", gap: "30px", marginBottom: "40px", borderBottom: "1px solid var(--border)" }}>
                {TAB_LIST.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ 
                            padding: "12px 0", 
                            border: "none", 
                            background: "none", 
                            cursor: "pointer", 
                            fontWeight: 600, 
                            fontSize: "15px",
                            color: activeTab === tab.id ? "var(--primary)" : "#64748B", 
                            borderBottom: activeTab === tab.id ? "3px solid var(--primary)" : "3px solid transparent",
                            transition: "all 0.2s"
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                    {activeTab === "epf" && <EPFSettings epf={config.epf} onUpdate={(data) => handleUpdate('epf', data)} saving={saving} />}
                    {activeTab === "esi" && <ESISettings esi={config.esi} onUpdate={(data) => handleUpdate('esi', data)} saving={saving} />}
                    {activeTab === "pt" && <PTSettings pt={config.professionalTax} onUpdate={(data) => handleUpdate('pt', data)} onViewSlabs={() => setIsPTModalOpen(true)} saving={saving} />}
                    {activeTab === "lwf" && <LWFSettings lwf={config.labourWelfareFund} onUpdate={(data) => handleUpdate('lwf', data)} saving={saving} />}
                    {activeTab === "bonus" && <BonusSettings bonus={config.statutoryBonus} onUpdate={(data) => handleUpdate('bonus', data)} saving={saving} />}
                </div>

                {activeTab === "epf" && (
                    <EPFCalculatorPanel pfWage={pfWagePreview} onWageChange={setPfWagePreview} />
                )}
            </div>

            <PTSlabsModal 
                isOpen={isPTModalOpen} 
                onClose={() => setIsPTModalOpen(false)} 
                state={config.professionalTax.ptState} 
                slabs={config.professionalTax.ptSlabs || []} 
            />
        </div>
    );
}

const EPFSettings = ({ epf, onUpdate, saving }: { epf: StatutoryConfig['epf'], onUpdate: (data: any) => void, saving: boolean }) => {
    const [data, setData] = useState(epf);
    
    return (
        <div className="card" style={{ padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
                    Employees' Provident Fund <FiEdit2 size={16} color="#64748B" />
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="badge badge-success" style={{ padding: "4px 12px", background: "#f0fdf4", color: "#16a34a", borderRadius: "20px", fontSize: "12px", border: "1px solid #bbfcce" }}>
                        Enabled
                    </span>
                    <button style={{ background: "none", border: "none", color: "#EF4444", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <FiTrash2 size={14} /> (Disable)
                    </button>
                </div>
            </div>

            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <div>
                    <label className="form-label">EPF Number</label>
                    <input type="text" value={data.epfNumber} onChange={e => setData({...data, epfNumber: e.target.value})} className="form-input" />
                </div>
                <div>
                    <label className="form-label">Deduction Cycle</label>
                    <select value={data.deductionCycle} onChange={e => setData({...data, deductionCycle: e.target.value})} className="form-input">
                        <option value="Monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
                <label className="form-label">Employee's Contribution Rate</label>
                <div style={{ fontSize: "14px", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    12% of Actual PF Wage
                </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
                <label className="form-label">Employer's Contribution Rate</label>
                <select 
                    value={data.employerContributionMode} 
                    onChange={e => setData({...data, employerContributionMode: e.target.value})} 
                    className="form-input"
                >
                    <option value="Restrict to ₹15,000 of PF Wage">Restrict contribution to ₹15,000 of PF Wage</option>
                    <option value="Actual PF Wage">Actual PF Wage</option>
                </select>
            </div>

            <div style={{ marginBottom: "32px" }}>
                <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "16px" }}>Contribution Preferences (Included in CTC)</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer" }}>
                        <input type="checkbox" checked={data.includedInCTC.employerPFContribution} onChange={e => setData({...data, includedInCTC: {...data.includedInCTC, employerPFContribution: e.target.checked}})} style={{ width: "18px", height: "18px" }} />
                        Employer's PF contribution
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer" }}>
                        <input type="checkbox" checked={data.includedInCTC.edliContribution} onChange={e => setData({...data, includedInCTC: {...data.includedInCTC, edliContribution: e.target.checked}})} style={{ width: "18px", height: "18px" }} />
                        EDLI contribution
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer" }}>
                        <input type="checkbox" checked={data.includedInCTC.adminCharges} onChange={e => setData({...data, includedInCTC: {...data.includedInCTC, adminCharges: e.target.checked}})} style={{ width: "18px", height: "18px" }} />
                        Admin charges
                    </label>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "32px" }}>
                <div>
                    <label className="form-label">Allow Employee Level Override</label>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input type="radio" checked={data.allowEmployeeLevelOverride} onChange={() => setData({...data, allowEmployeeLevelOverride: true})} /> Yes
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input type="radio" checked={!data.allowEmployeeLevelOverride} onChange={() => setData({...data, allowEmployeeLevelOverride: false})} /> No
                        </label>
                    </div>
                </div>
                <div>
                    <label className="form-label">Pro-rate Restricted PF Wage</label>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input type="radio" checked={data.proRateRestrictedPFWage} onChange={() => setData({...data, proRateRestrictedPFWage: true})} /> Yes
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input type="radio" checked={!data.proRateRestrictedPFWage} onChange={() => setData({...data, proRateRestrictedPFWage: false})} /> No
                        </label>
                    </div>
                </div>
            </div>

            <button className="btn btn-primary" onClick={() => onUpdate(data)} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
    );
};

const ESISettings = ({ esi, onUpdate, saving }: { esi: StatutoryConfig['esi'], onUpdate: (data: any) => void, saving: boolean }) => {
    const [data, setData] = useState(esi);
    return (
        <div className="card" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "32px", display: "flex", alignItems: "center", gap: "10px" }}>
                Employees' State Insurance <FiEdit2 size={16} color="#64748B" />
            </h3>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <div>
                    <label className="form-label">ESI Number</label>
                    <input type="text" value={data.esiNumber} onChange={e => setData({...data, esiNumber: e.target.value})} className="form-input" />
                </div>
                <div>
                    <label className="form-label">Deduction Cycle</label>
                    <select value={data.esiDeductionCycle} onChange={e => setData({...data, esiDeductionCycle: e.target.value})} className="form-input">
                        <option value="Monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
                <label className="form-label">ESI Salary Limit (INR)</label>
                <input type="number" value={data.esiSalaryLimit} onChange={e => setData({...data, esiSalaryLimit: Number(e.target.value)})} className="form-input" />
                <p style={{ fontSize: "12px", color: "#64748B", marginTop: "8px" }}>ESI only applies if employee gross pay &le; ₹{data.esiSalaryLimit}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <div>
                    <label className="form-label">Employee's Contribution</label>
                    <div style={{ fontSize: "14px", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>{data.employeeContribution}% of Gross Pay</div>
                </div>
                <div>
                    <label className="form-label">Employer's Contribution</label>
                    <div style={{ fontSize: "14px", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>{data.employerContribution}% of Gross Pay</div>
                </div>
            </div>

            <button className="btn btn-primary" onClick={() => onUpdate(data)} disabled={saving}>Save Changes</button>
        </div>
    );
};

const PTSettings = ({ pt, onUpdate, onViewSlabs, saving }: { pt: StatutoryConfig['professionalTax'], onUpdate: (data: any) => void, onViewSlabs: () => void, saving: boolean }) => {
    const [data, setData] = useState(pt);
    return (
        <div className="card" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Professional Tax</h3>
            <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "32px" }}>This tax is levied on an employee's income by the State Government. Tax slabs differ in each state.</p>
            
            <div style={{ padding: "24px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>PT Number:</span>
                        <input type="text" value={data.ptRegistrationNumber} onChange={e => setData({...data, ptRegistrationNumber: e.target.value})} className="form-input" style={{ width: "200px" }} />
                    </div>
                </div>
                <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div>
                        <label className="form-label">State</label>
                        <select value={data.ptState} onChange={e => setData({...data, ptState: e.target.value})} className="form-input">
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Maharashtra">Maharashtra</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Deduction Cycle</label>
                        <select value={data.ptDeductionCycle} onChange={e => setData({...data, ptDeductionCycle: e.target.value})} className="form-input">
                            <option value="Monthly">Monthly</option>
                            <option value="Half Yearly">Half Yearly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>
                </div>
                <div style={{ marginTop: "20px", display: "flex", gap: "20px" }}>
                    <button onClick={onViewSlabs} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>View Tax Slabs</button>
                    <button style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>(Revise)</button>
                </div>
            </div>

            <button className="btn btn-primary" onClick={() => onUpdate(data)} disabled={saving}>Save Changes</button>
        </div>
    );
};

const LWFSettings = ({ lwf, onUpdate, saving }: { lwf: StatutoryConfig['labourWelfareFund'], onUpdate: (data: any) => void, saving: boolean }) => {
    const [data, setData] = useState(lwf);
    return (
        <div className="card" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Labour Welfare Fund</h3>
            <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "32px" }}>Act ensures social security and improves working conditions for employees.</p>

            <div style={{ padding: "24px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "32px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
                    <div>
                        <label className="form-label">LWF Account No.</label>
                        <input type="text" value={data.lwfAccountNumber} onChange={e => setData({...data, lwfAccountNumber: e.target.value})} className="form-input" />
                    </div>
                    <div>
                        <label className="form-label">State</label>
                        <div style={{ fontSize: "14px", padding: "12px 16px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>{data.lwfState}</div>
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
                    <div>
                        <label className="form-label">Employee's Contribution</label>
                        <input type="number" value={data.employeeContribution} onChange={e => setData({...data, employeeContribution: Number(e.target.value)})} className="form-input" />
                    </div>
                    <div>
                        <label className="form-label">Employer's Contribution</label>
                        <input type="number" value={data.employerContribution} onChange={e => setData({...data, employerContribution: Number(e.target.value)})} className="form-input" />
                    </div>
                </div>
                <div>
                    <label className="form-label">Deduction Cycle</label>
                    <select value={data.lwfDeductionCycle} onChange={e => setData({...data, lwfDeductionCycle: e.target.value})} className="form-input">
                        <option value="Yearly">Yearly</option>
                        <option value="Half Yearly">Half Yearly</option>
                        <option value="Monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <button className="btn btn-primary" onClick={() => onUpdate(data)} disabled={saving}>Save Changes</button>
        </div>
    );
};

const BonusSettings = ({ bonus, onUpdate, saving }: { bonus: StatutoryConfig['statutoryBonus'], onUpdate: (data: any) => void, saving: boolean }) => {
    const [data, setData] = useState(bonus);
    return (
        <div className="card" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "32px" }}>Statutory Bonus</h3>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <div>
                    <label className="form-label">Bonus Percentage (%)</label>
                    <input type="number" value={data.bonusPercentage} onChange={e => setData({...data, bonusPercentage: Number(e.target.value)})} className="form-input" />
                </div>
                <div>
                    <label className="form-label">Eligibility Limit (Monthly Basic)</label>
                    <input type="number" value={data.eligibilityLimit} onChange={e => setData({...data, eligibilityLimit: Number(e.target.value)})} className="form-input" />
                </div>
            </div>
            <div style={{ marginBottom: "32px" }}>
                <label className="form-label">Payment Frequency</label>
                <select value={data.paymentFrequency} onChange={e => setData({...data, paymentFrequency: e.target.value})} className="form-input">
                    <option value="Yearly">Yearly</option>
                </select>
            </div>

            <button className="btn btn-primary" onClick={() => onUpdate(data)} disabled={saving}>Save Changes</button>
        </div>
    );
};

