"use client";

import { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiPlus, FiTrash2, FiX, FiChevronDown, FiInfo } from "react-icons/fi";

const TABS = [
    { id: "earning", label: "Earnings" },
    { id: "deduction", label: "Deductions" },
    { id: "benefit", label: "Benefits" },
    { id: "reimbursement", label: "Reimbursements" },
];

const TABLE_COLUMNS: any = {
    earning: [
        { key: "name", label: "NAME", width: "18%" },
        { key: "componentType", label: "EARNING TYPE", width: "18%" },
        { key: "calculationDescription", label: "CALCULATION TYPE", width: "22%" },
        { key: "considerForEPF", label: "CONSIDER FOR EPF", type: "epf", width: "16%" },
        { key: "considerForESI", label: "CONSIDER FOR ESI", type: "bool", width: "14%" },
        { key: "isActive", label: "STATUS", type: "status", width: "8%" },
    ],
    deduction: [
        { key: "name", label: "NAME", width: "30%" },
        { key: "componentType", label: "DEDUCTION TYPE", width: "30%" },
        { key: "frequency", label: "DEDUCTION FREQUENCY", type: "freq", width: "25%" },
        { key: "isActive", label: "STATUS", type: "status", width: "10%" },
    ],
    benefit: [
        { key: "name", label: "NAME", width: "30%" },
        { key: "componentType", label: "BENEFIT TYPE", width: "30%" },
        { key: "frequency", label: "BENEFIT FREQUENCY", type: "freq", width: "25%" },
        { key: "isActive", label: "STATUS", type: "status", width: "10%" },
    ],
    reimbursement: [
        { key: "name", label: "NAME", width: "25%" },
        { key: "componentType", label: "REIMBURSEMENT TYPE", width: "30%" },
        { key: "maxReimbursableAmount", label: "MAXIMUM REIMBURSABLE AMOUNT", type: "amount", width: "25%" },
        { key: "isActive", label: "STATUS", type: "status", width: "10%" },
    ],
};

const FORM_FIELDS: any = {
    earning: [
        { name: "name", label: "Component Name", type: "text", required: true, placeholder: "e.g., Special Allowance" },
        { name: "componentType", label: "Earning Type", type: "select", required: true, options: ["Basic", "House Rent Allowance", "Dearness Allowance", "Conveyance Allowance", "Transport Allowance", "Travelling Allowance", "Children Education Allowance", "Overtime Allowance", "Fixed Allowance", "Custom Allowance", "Custom Allowance (Non Taxable)"] },
        { name: "calculationType", label: "Calculation Type", type: "select", options: ["fixed_percentage", "fixed_flat", "variable_flat", "variable_percentage"] },
        { name: "calculationBase", label: "Calculation Base", type: "select", options: ["", "CTC", "Basic"] },
        { name: "calculationValue", label: "Calculation Value", type: "number", placeholder: "e.g., 40 for 40% or flat ₹ amount" },
        { name: "considerForEPF", label: "Consider for EPF", type: "checkbox" },
        { name: "considerForESI", label: "Consider for ESI", type: "checkbox" },
        { name: "isTaxable", label: "Taxable", type: "checkbox" },
    ],
    deduction: [
        { name: "name", label: "Component Name", type: "text", required: true, placeholder: "e.g., Notice Pay Deduction" },
        { name: "componentType", label: "Deduction Type", type: "text", required: true, placeholder: "e.g., Notice Pay Deduction" },
        { name: "frequency", label: "Frequency", type: "select", options: ["monthly", "one_time", "recurring", "yearly"] },
    ],
    benefit: [
        { name: "name", label: "Component Name", type: "text", required: true, placeholder: "e.g., Voluntary Provident Fund" },
        { name: "componentType", label: "Benefit Type", type: "text", required: true, placeholder: "e.g., Voluntary Provident Fund" },
        { name: "frequency", label: "Frequency", type: "select", options: ["monthly", "one_time", "recurring", "yearly"] },
    ],
    reimbursement: [
        { name: "name", label: "Component Name", type: "text", required: true, placeholder: "e.g., Fuel Reimbursement" },
        { name: "componentType", label: "Reimbursement Type", type: "text", required: true, placeholder: "e.g., Fuel Reimbursement" },
        { name: "maxReimbursableAmount", label: "Max Reimbursable Amount (₹)", type: "number", placeholder: "e.g., 5000" },
    ],
};

const FREQ_LABELS: any = { monthly: "Monthly", one_time: "One Time", recurring: "Recurring", yearly: "Yearly", half_yearly: "Half Yearly", quarterly: "Quarterly" };
const CALC_LABELS: any = { fixed_percentage: "Fixed; Percentage", fixed_flat: "Fixed; Flat Amount", variable_flat: "Variable; Flat Amount", variable_percentage: "Variable; Percentage" };

export default function SalaryComponentsPage() {
    const [activeTab, setActiveTab] = useState("earning");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<any>({});
    const [showDropdown, setShowDropdown] = useState(false);
    const seededRef = useRef(false);

    const fetchData = async (autoSeed = false) => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`${API_ENDPOINTS.SALARY_COMPONENTS}?category=${activeTab}`);
            const items = res.data.data || [];
            // Auto-seed on first load if empty
            if (items.length === 0 && autoSeed && !seededRef.current) {
                seededRef.current = true;
                await axiosInstance.post(`${API_ENDPOINTS.SALARY_COMPONENTS}/seed`);
                const res2 = await axiosInstance.get(`${API_ENDPOINTS.SALARY_COMPONENTS}?category=${activeTab}`);
                setData(res2.data.data || []);
            } else {
                setData(items);
            }
        } catch (err) {
            console.error("Fetch error", err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(activeTab === "earning"); }, [activeTab]);

    const handleToggleStatus = async (id: string) => {
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.SALARY_COMPONENTS}/${id}/toggle`);
            fetchData();
        } catch (err) { console.error("Toggle error", err); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this component?")) return;
        try {
            await axiosInstance.delete(`${API_ENDPOINTS.SALARY_COMPONENTS}/${id}`);
            fetchData();
        } catch (err: any) { alert(err.response?.data?.message || "Error deleting"); }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const payload = { ...formData, category: activeTab };
            if (activeTab === "earning") {
                const ct = payload.calculationType || "fixed_flat";
                const cl = CALC_LABELS[ct] || "Fixed; Flat Amount";
                if (ct.includes("percentage") && payload.calculationBase) {
                    payload.calculationDescription = `${cl.split(';')[0]}; ${payload.calculationValue}% of ${payload.calculationBase}`;
                } else if (ct.includes("flat") && payload.calculationValue) {
                    payload.calculationDescription = `${cl.split(';')[0]}; Flat amount of ${payload.calculationValue}`;
                } else { payload.calculationDescription = cl; }
            }
            if (isEditing) {
                await axiosInstance.put(`${API_ENDPOINTS.SALARY_COMPONENTS}/${editId}`, payload);
            } else {
                await axiosInstance.post(API_ENDPOINTS.SALARY_COMPONENTS, payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) { alert(err.response?.data?.message || "Error saving"); }
    };

    const openCreate = (cat?: string) => {
        if (cat) setActiveTab(cat);
        setIsEditing(false); setEditId("");
        setFormData({ isTaxable: true, calculationType: "fixed_flat", frequency: "monthly" });
        setShowModal(true); setShowDropdown(false);
    };

    const openEdit = (item: any) => {
        setIsEditing(true); setEditId(item._id); setFormData({ ...item }); setShowModal(true);
    };

    const renderCell = (col: any, item: any) => {
        const v = item[col.key];
        if (col.type === "status") {
            const isActive = v === true;
            return (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: isActive ? "var(--secondary)" : "var(--text-muted)", fontSize: "13px", fontWeight: 600 }}>
                        {isActive ? "Active" : "Inactive"}
                    </span>
                    <div onClick={() => handleToggleStatus(item._id)} style={{
                        width: "36px", height: "18px", borderRadius: "10px", cursor: "pointer",
                        background: isActive ? "var(--secondary)" : "var(--border)",
                        position: "relative", transition: "0.3s"
                    }}>
                        <div style={{ 
                            width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
                            position: "absolute", top: "2px", left: isActive ? "20px" : "2px",
                            transition: "0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                        }} />
                    </div>
                </div>
            );
        }
        if (col.type === "bool") return <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{v ? "Yes" : "No"}</span>;
        if (col.type === "epf") {
            if (!v) return <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No</span>;
            return (
                <span style={{ fontSize: "13px", color: "var(--secondary)", fontWeight: 600 }}>
                    Yes{item.epfCondition ? <span style={{ fontSize: "11px", color: "var(--accent)" }}> ({item.epfCondition})</span> : ""}
                </span>
            );
        }
        if (col.type === "freq") return <span style={{ fontSize: "13px" }}>{FREQ_LABELS[v] || v || "—"}</span>;
        if (col.type === "amount") return <span style={{ fontSize: "13px" }}>{v != null ? v.toLocaleString() : "0"}</span>;
        return <span style={{ fontSize: "13px", color: "#374151" }}>{v || "—"}</span>;
    };

    const columns = TABLE_COLUMNS[activeTab] || [];
    const fields = FORM_FIELDS[activeTab] || [];

    return (
        <div style={{ padding: "0" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", padding: "0 0 20px 0", borderBottom: "1px solid var(--border-light)" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Salary Components</h1>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>Configure Earnings, Deductions, Benefits and Reimbursements</p>
                </div>
                <div style={{ position: "relative" }}>
                    <button onClick={() => setShowDropdown(!showDropdown)} className="btn btn-primary">
                        <FiPlus size={16} /> Add Component <FiChevronDown size={14} />
                    </button>
                    {showDropdown && (
                        <div style={{
                            position: "absolute", top: "100%", right: 0, marginTop: "8px",
                            background: "var(--bg-secondary)", borderRadius: "12px", boxShadow: "var(--shadow-lg)",
                            border: "1px solid var(--border-light)", minWidth: "220px", zIndex: 50, overflow: "hidden"
                        }}>
                            {TABS.map(t => (
                                <button key={t.id} onClick={() => openCreate(t.id)}
                                    style={{
                                        display: "block", width: "100%", padding: "14px 20px", textAlign: "left",
                                        border: "none", background: "transparent", cursor: "pointer",
                                        fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)"
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-primary)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    {t.label.slice(0, -1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: "1px solid var(--border)", display: "flex", gap: "32px", marginBottom: "24px" }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "12px 0", fontSize: "15px", fontWeight: activeTab === tab.id ? 700 : 500,
                            background: "transparent", border: "none", cursor: "pointer",
                            color: activeTab === tab.id ? "var(--primary)" : "var(--text-muted)",
                            borderBottom: activeTab === tab.id ? "3px solid var(--primary)" : "3px solid transparent",
                            transition: "all 0.2s"
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Info banner for reimbursements */}
            {activeTab === "reimbursement" && (
                <div style={{
                    background: "var(--purple-bg-light)", border: "1px solid #d8b4fe",
                    padding: "16px 24px", fontSize: "13px", color: "var(--purple)",
                    display: "flex", alignItems: "center", gap: "10px", borderRadius: "12px", marginBottom: "24px"
                }}>
                    <FiInfo size={18} />
                    <p style={{ margin: 0 }}>With these reimbursement components, employees can claim reimbursements for the components which are part of the payroll and not for other expenses reimbursements.</p>
                </div>
            )}

            {/* Table */}
            <div className="card animate-in" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            {columns.map((col: any) => (
                                <th key={col.key} style={{
                                    padding: "16px 24px", textAlign: "left", fontSize: "11px",
                                    fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
                                    letterSpacing: "1px", background: "var(--bg-primary)", width: col.width
                                }}>
                                    {col.label}
                                </th>
                            ))}
                            <th style={{ width: "60px", background: "var(--bg-primary)" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + 1} style={{ textAlign: "center", padding: "80px 24px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                                        <div className="loading-spinner" />
                                        <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Analyzing components...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-muted)" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                                        <FiInfo size={40} style={{ opacity: 0.2 }} />
                                        <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-secondary)" }}>No {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} configured yet</span>
                                        <span style={{ fontSize: "13px" }}>Set up your salary components to start managing payroll.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.map((item: any, i: number) => (
                            <tr key={item._id} style={{
                                borderBottom: "1px solid var(--border-light)",
                                transition: "background 0.2s"
                            }}>
                                {columns.map((col: any) => (
                                    <td key={col.key} style={{ padding: "18px 24px" }}>
                                        {col.key === "name" ? (
                                            <span onClick={() => openEdit(item)}
                                                style={{ color: "var(--primary)", cursor: "pointer", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}
                                                onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                                                onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                                            >
                                                {item.name}
                                            </span>
                                        ) : renderCell(col, item)}
                                    </td>
                                ))}
                                <td style={{ padding: "16px 12px", textAlign: "center" }}>
                                    {!item.isSystem && (
                                        <button onClick={() => handleDelete(item._id)}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: "4px", transition: "color 0.2s" }}
                                            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                                            onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal overlay */}
            {showModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "560px",
                        boxShadow: "0 25px 50px rgba(0,0,0,0.15)", overflow: "hidden",
                        animation: "modalIn 0.2s ease-out"
                    }}>
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "20px 24px", borderBottom: "1px solid #f3f4f6"
                        }}>
                            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1f2937" }}>
                                {isEditing ? "Edit" : "Add"} {TABS.find(t => t.id === activeTab)?.label.slice(0, -1) || "Component"}
                            </h2>
                            <button onClick={() => setShowModal(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            {fields.map((f: any) => (
                                <div key={f.name}>
                                    {f.type === "checkbox" ? (
                                        <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--text-secondary)", cursor: "pointer" }}>
                                            <input type="checkbox" checked={formData[f.name] || false}
                                                onChange={e => setFormData({ ...formData, [f.name]: e.target.checked })} />
                                            {f.label}
                                        </label>
                                    ) : (
                                        <>
                                            <label className="form-label">{f.label} {f.required && "*"}</label>
                                            {f.type === "select" ? (
                                                <select value={formData[f.name] || ""} required={f.required}
                                                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                                                    className="form-input">
                                                    <option value="">Select...</option>
                                                    {f.options?.map((o: string) => <option key={o} value={o}>{o === "" ? "None" : (CALC_LABELS[o] || FREQ_LABELS[o] || o)}</option>)}
                                                </select>
                                            ) : (
                                                <input type={f.type || "text"} value={formData[f.name] || ""} required={f.required} placeholder={f.placeholder}
                                                    onChange={e => setFormData({ ...formData, [f.name]: f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
                                                    className="form-input" />
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "20px", borderTop: "1px solid var(--border-light)" }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ minWidth: "140px" }}>
                                    {isEditing ? "Save Changes" : "Add Component"}
                                </button>
                            </div>
                        </form>
                    </div>
                    <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
                </div>
            )}

            {/* Close dropdown on outside click */}
            {showDropdown && <div onClick={() => setShowDropdown(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />}
        </div>
    );
}
