"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { 
    FiShield, FiInfo, FiEdit2, FiTrash2, FiPlus, FiCheckCircle, FiXCircle, FiTrendingUp, FiAlertTriangle
} from "react-icons/fi";
import EPFCalculatorPanel from "./statutory/EPFCalculatorPanel";
import PTSlabsModal from "./statutory/PTSlabsModal";
import EmptyState from "@/components/common/EmptyState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

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
        includedInCTC: {
            employerPFContribution: boolean;
            edliContribution: boolean;
            adminCharges: boolean;
        };
        allowEmployeeLevelOverride: boolean;
        proRateRestrictedPFWage: boolean;
        considerSalaryComponentsOnLOP: boolean;
        eligibleForABRYScheme: boolean;
    };
    esi: {
        esiEnabled: boolean;
        esiNumber: string;
        esiJoiningDate: string;
        esiDeductionCycle: string;
        esiSalaryLimit: number;
        employeeContribution: number;
        employerContribution: number;
    };
    professionalTax: {
        ptEnabled: boolean;
        ptRegistrationNumber: string;
        ptState: string;
        ptDeductionCycle: string;
        ptSlabs: any[];
    };
    labourWelfareFund: {
        lwfEnabled: boolean;
        lwfAccountNumber: string;
        lwfState: string;
        employeeContribution: number;
        employerContribution: number;
        lwfDeductionCycle: string;
        lwfStatus: string;
    };
    statutoryBonus: {
        statutoryBonusEnabled: boolean;
        bonusPercentage: number;
        eligibilityLimit: number;
        paymentFrequency: string;
        minimumWage?: number;
    };
}

export default function StatutoryPage({ showNotify }: { showNotify: (type: 'success' | 'failure' | 'warning', msg: string) => void }) {
    const [activeTab, setActiveTab] = useState("epf");
    const [config, setConfig] = useState<StatutoryConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Preview & Modal states
    const [pfWagePreview, setPfWagePreview] = useState(20000);
    const [isPTModalOpen, setIsPTModalOpen] = useState(false);
    const [confirmDisable, setConfirmDisable] = useState<{ type: string; label: string } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axiosInstance.get('/api/compliance');
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
            // Send the specific nested object update to the root partial PUT
            await axiosInstance.put(`/api/compliance`, { [type]: data });
            showNotify('success', `${TAB_LIST.find(t=>t.id===type)?.label || type.toUpperCase()} settings updated successfully`);
            fetchConfig();
        } catch (err) {
            showNotify('failure', `Failed to update ${type} settings`);
        } finally {
            setSaving(false);
        }
    };

    const handleDisable = async () => {
        if (!confirmDisable) return;
        setSaving(true);
        try {
            // In a real app, this might be a specific endpoint /disable
            const type = confirmDisable.type;
            const updatedData = { ... (config as any)[type === 'pt' ? 'professionalTax' : type === 'bonus' ? 'statutoryBonus' : type === 'lwf' ? 'labourWelfareFund' : type] };
            
            const fieldMap: any = {
                epf: 'epfEnabled',
                esi: 'esiEnabled',
                pt: 'ptEnabled',
                lwf: 'lwfEnabled',
                bonus: 'statutoryBonusEnabled'
            };
            
            updatedData[fieldMap[type]] = false;
            await axiosInstance.put(`/api/compliance`, { [type]: updatedData });
            
            showNotify('warning', `${confirmDisable.label} has been disabled`);
            setConfirmDisable(null);
            fetchConfig();
        } catch (err) {
            showNotify('failure', `Failed to disable component`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSkeleton />;
    if (!config) return (
        <div style={{ padding: "80px 40px" }}>
            <EmptyState 
                title="Configuration Missing"
                description="We couldn't retrieve the statutory configuration for your organization. Please ensure your tenant setup is complete."
                icon={FiShield}
                actionLabel="Retry Connection"
                onAction={fetchConfig}
            />
        </div>
    );

    return (
        <div style={{ padding: "0 40px 40px", height: "100%", overflowY: "auto", background: "#fff" }}>
            <div style={{ padding: "30px 0", borderBottom: "1px solid #ECEFF1", marginBottom: "30px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1E293B" }}>Statutory Components</h1>
                <p style={{ fontSize: "14px", color: "#64748B", marginTop: "4px" }}>Manage company-level statutory and compliance settings</p>
            </div>

            <div style={{ display: "flex", gap: "30px", marginBottom: "40px", borderBottom: "1px solid #ECEFF1" }}>
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
                            color: activeTab === tab.id ? "#0084FF" : "#64748B", 
                            borderBottom: activeTab === tab.id ? "3px solid #0084FF" : "3px solid transparent",
                            transition: "all 0.2s"
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                    {activeTab === "epf" && (
                        <EPFSettings 
                            epf={config.epf} 
                            onUpdate={(data) => handleUpdate('epf', data)} 
                            onDisable={() => setConfirmDisable({ type: 'epf', label: 'EPF' })}
                            saving={saving} 
                        />
                    )}
                    {activeTab === "esi" && (
                        <ESISettings 
                            esi={config.esi} 
                            onUpdate={(data) => handleUpdate('esi', data)} 
                            onDisable={() => setConfirmDisable({ type: 'esi', label: 'ESI' })}
                            saving={saving} 
                        />
                    )}
                    {activeTab === "pt" && (
                        <PTSettings 
                            pt={config.professionalTax} 
                            onUpdate={(data) => handleUpdate('pt', data)} 
                            onViewSlabs={() => setIsPTModalOpen(true)} 
                            onDisable={() => setConfirmDisable({ type: 'pt', label: 'Professional Tax' })}
                            saving={saving} 
                        />
                    )}
                    {activeTab === "lwf" && (
                        <LWFSettings 
                            lwf={config.labourWelfareFund} 
                            onUpdate={(data) => handleUpdate('lwf', data)} 
                            onDisable={() => setConfirmDisable({ type: 'lwf', label: 'Labour Welfare Fund' })}
                            saving={saving} 
                        />
                    )}
                    {activeTab === "bonus" && (
                        <BonusSettings 
                            bonus={config.statutoryBonus} 
                            onUpdate={(data) => handleUpdate('bonus', data)} 
                            onDisable={() => setConfirmDisable({ type: 'bonus', label: 'Statutory Bonus' })}
                            saving={saving} 
                        />
                    )}
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

            {/* Confirmation Modal */}
            {confirmDisable && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                    <div style={{ background: "#fff", padding: "32px", borderRadius: "16px", maxWidth: "450px", width: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                            <div style={{ padding: "12px", background: "#FEF2F2", borderRadius: "50%" }}>
                                <FiAlertTriangle size={24} color="#EF4444" />
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>Disable {confirmDisable.label}?</h3>
                        </div>
                        <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "32px", lineHeight: "1.5" }}>
                            Are you sure you want to disable {confirmDisable.label}? This will stop all related deductions and contributions for all employees in future payroll runs.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button onClick={() => setConfirmDisable(null)} style={{ padding: "10px 20px", border: "1px solid #E2E8F0", borderRadius: "8px", background: "#fff", fontWeight: 600, cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button onClick={handleDisable} style={{ padding: "10px 20px", border: "none", borderRadius: "8px", background: "#EF4444", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                                Yes, Disable
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const EPFSettings = ({ epf, onUpdate, onDisable, saving }: { epf: StatutoryConfig['epf'], onUpdate: (data: any) => void, onDisable: () => void, saving: boolean }) => {
    const [data, setData] = useState(epf);
    useEffect(() => { if (epf) setData(epf); }, [epf]);

    if (!data) return null;

    return (
        <div style={{ padding: "32px", border: "1px solid #ECEFF1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", color: "#1E293B" }}>
                    Employees' Provident Fund <FiEdit2 size={16} color="#64748B" />
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ 
                        padding: "4px 12px", 
                        background: data.epfEnabled ? "#f0fdf4" : "#F1F5F9", 
                        color: data.epfEnabled ? "#16a34a" : "#64748B", 
                        borderRadius: "20px", 
                        fontSize: "12px", 
                        border: data.epfEnabled ? "1px solid #bbfcce" : "1px solid #E2E8F0", 
                        fontWeight: 600 
                    }}>
                        {data.epfEnabled ? "Enabled" : "Disabled"}
                    </span>
                    {data.epfEnabled && (
                        <button onClick={onDisable} style={{ background: "none", border: "none", color: "#EF4444", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                            <FiTrash2 size={14} /> (Disable)
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>EPF Number</label>
                    <input type="text" value={data.epfNumber} onChange={e => setData({...data, epfNumber: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Deduction Cycle</label>
                    <select value={data.deductionCycle} onChange={e => setData({...data, deductionCycle: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }}>
                        <option value="Monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Employee's Contribution Rate</label>
                <div style={{ fontSize: "14px", padding: "12px 16px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", color: "#1E293B" }}>
                    {data.employeeContributionRate}% of Actual PF Wage
                </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Employer's Contribution Rate</label>
                <select 
                    value={data.employerContributionMode} 
                    onChange={e => setData({...data, employerContributionMode: e.target.value})} 
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }}
                >
                    <option value="Restrict to ₹15,000 of PF Wage">Restrict contribution to ₹15,000 of PF Wage</option>
                    <option value="Actual PF Wage">Actual PF Wage</option>
                </select>
            </div>

            <div style={{ marginBottom: "32px" }}>
                <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "16px", color: "#1E293B" }}>Contribution Preferences (Included in CTC)</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer", color: "#334155" }}>
                        <input type="checkbox" checked={data.includedInCTC.employerPFContribution} onChange={e => setData({...data, includedInCTC: {...data.includedInCTC, employerPFContribution: e.target.checked}})} />
                        Employer's PF contribution
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer", color: "#334155" }}>
                        <input type="checkbox" checked={data.includedInCTC.edliContribution} onChange={e => setData({...data, includedInCTC: {...data.includedInCTC, edliContribution: e.target.checked}})} />
                        EDLI contribution
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer", color: "#334155" }}>
                        <input type="checkbox" checked={data.includedInCTC.adminCharges} onChange={e => setData({...data, includedInCTC: {...data.includedInCTC, adminCharges: e.target.checked}})} />
                        Admin charges
                    </label>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "32px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "12px" }}>Allow Employee Level Override</label>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                            <input type="radio" checked={data.allowEmployeeLevelOverride} onChange={() => setData({...data, allowEmployeeLevelOverride: true})} /> Yes
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                            <input type="radio" checked={!data.allowEmployeeLevelOverride} onChange={() => setData({...data, allowEmployeeLevelOverride: false})} /> No
                        </label>
                    </div>
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "12px" }}>Pro-rate Restricted PF Wage</label>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                            <input type="radio" checked={data.proRateRestrictedPFWage} onChange={() => setData({...data, proRateRestrictedPFWage: true})} /> Yes
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                            <input type="radio" checked={!data.proRateRestrictedPFWage} onChange={() => setData({...data, proRateRestrictedPFWage: false})} /> No
                        </label>
                    </div>
                </div>
            </div>

            <button onClick={() => onUpdate(data)} disabled={saving} style={{ background: "#0084FF", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
    );
};

const ESISettings = ({ esi, onUpdate, onDisable, saving }: { esi: StatutoryConfig['esi'], onUpdate: (data: any) => void, onDisable: () => void, saving: boolean }) => {
    const [data, setData] = useState(esi);
    useEffect(() => { if (esi) setData(esi); }, [esi]);
    
    if (!data) return null;
    
    return (
        <div style={{ padding: "32px", border: "1px solid #ECEFF1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", color: "#1E293B" }}>
                    Employees' State Insurance <FiEdit2 size={16} color="#64748B" />
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ padding: "4px 12px", background: data.esiEnabled ? "#f0fdf4" : "#F1F5F9", color: data.esiEnabled ? "#16a34a" : "#64748B", borderRadius: "20px", fontSize: "12px", border: data.esiEnabled ? "1px solid #bbfcce" : "1px solid #E2E8F0", fontWeight: 600 }}>
                        {data.esiEnabled ? "Enabled" : "Disabled"}
                    </span>
                    {data.esiEnabled && (
                        <button onClick={onDisable} style={{ background: "none", border: "none", color: "#EF4444", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                            <FiTrash2 size={14} /> (Disable)
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>ESI Number</label>
                    <input type="text" value={data.esiNumber} onChange={e => setData({...data, esiNumber: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Deduction Cycle</label>
                    <select value={data.esiDeductionCycle} onChange={e => setData({...data, esiDeductionCycle: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }}>
                        <option value="Monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>ESI Salary Limit (INR)</label>
                <input type="number" value={data.esiSalaryLimit} onChange={e => setData({...data, esiSalaryLimit: Number(e.target.value)})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                <p style={{ fontSize: "12px", color: "#64748B", marginTop: "8px" }}>ESI only applies if employee gross pay &le; ₹{data.esiSalaryLimit}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Employee's Contribution</label>
                    <div style={{ fontSize: "14px", padding: "12px 16px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>{data.employeeContribution}% of Gross Pay</div>
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Employer's Contribution</label>
                    <div style={{ fontSize: "14px", padding: "12px 16px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>{data.employerContribution}% of Gross Pay</div>
                </div>
            </div>

            <button onClick={() => onUpdate(data)} disabled={saving} style={{ background: "#0084FF", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
    );
};

const PTSettings = ({ pt, onUpdate, onViewSlabs, onDisable, saving }: { pt: StatutoryConfig['professionalTax'], onUpdate: (data: any) => void, onViewSlabs: () => void, onDisable: () => void, saving: boolean }) => {
    const [data, setData] = useState(pt);
    useEffect(() => { if (pt) setData(pt); }, [pt]);

    if (!data) return null;

    return (
        <div style={{ padding: "32px", border: "1px solid #ECEFF1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>Professional Tax</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ padding: "4px 12px", background: data.ptEnabled ? "#f0fdf4" : "#F1F5F9", color: data.ptEnabled ? "#16a34a" : "#64748B", borderRadius: "20px", fontSize: "12px", border: data.ptEnabled ? "1px solid #bbfcce" : "1px solid #E2E8F0", fontWeight: 600 }}>
                        {data.ptEnabled ? "Enabled" : "Disabled"}
                    </span>
                    {data.ptEnabled && (
                        <button onClick={onDisable} style={{ background: "none", border: "none", color: "#EF4444", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                            <FiTrash2 size={14} /> (Disable)
                        </button>
                    )}
                </div>
            </div>
            <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "32px" }}>This tax is levied on an employee's income by the State Government. Tax slabs differ in each state.</p>
            
            <div style={{ padding: "24px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", marginBottom: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>PT Number:</span>
                        <input type="text" value={data.ptRegistrationNumber} onChange={e => setData({...data, ptRegistrationNumber: e.target.value})} style={{ width: "200px", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px" }} />
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>State</label>
                        <select value={data.ptState} onChange={e => setData({...data, ptState: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }}>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Maharashtra">Maharashtra</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Deduction Cycle</label>
                        <select value={data.ptDeductionCycle} onChange={e => setData({...data, ptDeductionCycle: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }}>
                            <option value="Monthly">Monthly</option>
                            <option value="Half Yearly">Half Yearly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>
                </div>
                <div style={{ marginTop: "20px", display: "flex", gap: "20px" }}>
                    <button onClick={onViewSlabs} style={{ background: "none", border: "none", color: "#0084FF", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>View Tax Slabs</button>
                    <button style={{ background: "none", border: "none", color: "#0084FF", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>(Revise)</button>
                </div>
            </div>

            <button onClick={() => onUpdate(data)} disabled={saving} style={{ background: "#0084FF", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
    );
};

const LWFSettings = ({ lwf, onUpdate, onDisable, saving }: { lwf: StatutoryConfig['labourWelfareFund'], onUpdate: (data: any) => void, onDisable: () => void, saving: boolean }) => {
    const [data, setData] = useState(lwf);
    useEffect(() => { if (lwf) setData(lwf); }, [lwf]);

    if (!data) return null;

    return (
        <div style={{ padding: "32px", border: "1px solid #ECEFF1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>Labour Welfare Fund</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ padding: "4px 12px", background: data.lwfEnabled ? "#f0fdf4" : "#F1F5F9", color: data.lwfEnabled ? "#16a34a" : "#64748B", borderRadius: "20px", fontSize: "12px", border: data.lwfEnabled ? "1px solid #bbfcce" : "1px solid #E2E8F0", fontWeight: 600 }}>
                        {data.lwfEnabled ? "Enabled" : "Disabled"}
                    </span>
                    {data.lwfEnabled && (
                        <button onClick={onDisable} style={{ background: "none", border: "none", color: "#EF4444", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                            <FiTrash2 size={14} /> (Disable)
                        </button>
                    )}
                </div>
            </div>
            <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "32px" }}>Act ensures social security and improves working conditions for employees.</p>

            <div style={{ padding: "24px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", marginBottom: "32px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>LWF Account No.</label>
                        <input type="text" value={data.lwfAccountNumber} onChange={e => setData({...data, lwfAccountNumber: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>State</label>
                        <div style={{ fontSize: "14px", padding: "12px 16px", background: "white", borderRadius: "8px", border: "1px solid #E2E8F0" }}>{data.lwfState}</div>
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Employee's Contribution</label>
                        <input type="number" value={data.employeeContribution} onChange={e => setData({...data, employeeContribution: Number(e.target.value)})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Employer's Contribution</label>
                        <input type="number" value={data.employerContribution} onChange={e => setData({...data, employerContribution: Number(e.target.value)})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                    </div>
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Deduction Cycle</label>
                    <select value={data.lwfDeductionCycle} onChange={e => setData({...data, lwfDeductionCycle: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }}>
                        <option value="Yearly">Yearly</option>
                        <option value="Half Yearly">Half Yearly</option>
                        <option value="Monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <button onClick={() => onUpdate(data)} disabled={saving} style={{ background: "#0084FF", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
    );
};

const BonusSettings = ({ bonus, onUpdate, onDisable, saving }: { bonus: StatutoryConfig['statutoryBonus'], onUpdate: (data: any) => void, onDisable: () => void, saving: boolean }) => {
    const [data, setData] = useState(bonus);
    useEffect(() => { if (bonus) setData(bonus); }, [bonus]);

    if (!data) return null;

    return (
        <div style={{ padding: "32px", border: "1px solid #ECEFF1", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>Statutory Bonus</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ padding: "4px 12px", background: data.statutoryBonusEnabled ? "#f0fdf4" : "#F1F5F9", color: data.statutoryBonusEnabled ? "#16a34a" : "#64748B", borderRadius: "20px", fontSize: "12px", border: data.statutoryBonusEnabled ? "1px solid #bbfcce" : "1px solid #E2E8F0", fontWeight: 600 }}>
                        {data.statutoryBonusEnabled ? "Enabled" : "Disabled"}
                    </span>
                    {data.statutoryBonusEnabled && (
                        <button onClick={onDisable} style={{ background: "none", border: "none", color: "#EF4444", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                            <FiTrash2 size={14} /> (Disable)
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Bonus Percentage (%)</label>
                    <input type="number" value={data.bonusPercentage} onChange={e => setData({...data, bonusPercentage: Number(e.target.value)})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Eligibility Limit (Monthly Basic)</label>
                    <input type="number" value={data.eligibilityLimit} onChange={e => setData({...data, eligibilityLimit: Number(e.target.value)})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }} />
                </div>
            </div>
            <div style={{ marginBottom: "32px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>Payment Frequency</label>
                <select value={data.paymentFrequency} onChange={e => setData({...data, paymentFrequency: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: "8px" }}>
                    <option value="Yearly">Yearly</option>
                </select>
            </div>

            <button onClick={() => onUpdate(data)} disabled={saving} style={{ background: "#0084FF", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
    );
};
