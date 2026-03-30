"use client";

import { FiX, FiInfo } from "react-icons/fi";

interface PTSlabsModalProps {
    isOpen: boolean;
    onClose: () => void;
    state: string;
    slabs: any[];
}

export default function PTSlabsModal({ isOpen, onClose, state, slabs }: PTSlabsModalProps) {
    if (!isOpen) return null;

    // Default Tamil Nadu slabs if none provided from DB
    const displaySlabs = slabs.length > 0 ? slabs : [
        { minSalary: 0, maxSalary: 21000, taxAmount: 0 },
        { minSalary: 21001, maxSalary: null, taxAmount: 208.33 }
    ];

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div style={{ background: "#fff", width: "500px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>Professional Tax Slabs - {state}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}><FiX size={20} /></button>
                </div>

                <div style={{ padding: "24px" }}>
                    <div style={{ background: "#F0F9FF", padding: "12px 16px", borderRadius: "8px", border: "1px solid #BAE6FD", display: "flex", gap: "12px", marginBottom: "24px" }}>
                        <FiInfo color="#0284C7" size={20} style={{ marginTop: "2px" }} />
                        <p style={{ fontSize: "13px", color: "#0369A1", lineHeight: "1.5" }}>
                            These rates are configured based on the latest {state} government notifications. Professional Tax is deducted {state === 'Tamil Nadu' ? 'Half Yearly (June & Dec)' : 'Monthly'}.
                        </p>
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                        <thead>
                            <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                                <th style={{ textAlign: "left", padding: "12px", color: "#64748B", fontWeight: 600 }}>Salary Range (Monthly)</th>
                                <th style={{ textAlign: "right", padding: "12px", color: "#64748B", fontWeight: 600 }}>Tax Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displaySlabs.map((slab, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                    <td style={{ padding: "12px", color: "#334155" }}>
                                        {slab.maxSalary ? `₹${slab.minSalary.toLocaleString()} - ₹${slab.maxSalary.toLocaleString()}` : `Above ₹${slab.minSalary.toLocaleString()}`}
                                    </td>
                                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#1E293B" }}>
                                        ₹{slab.taxAmount.toFixed(2)} / month
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ marginTop: "24px", padding: "16px", border: "1px dashed #CBD5E1", borderRadius: "8px", textAlign: "center" }}>
                        <p style={{ fontSize: "13px", color: "#64748B" }}>
                            Yearly Professional Tax Liability: <span style={{ fontWeight: 700, color: "#1E293B" }}>₹2,500.00</span>
                        </p>
                    </div>
                </div>

                <div style={{ padding: "16px 24px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", textAlign: "right" }}>
                    <button onClick={onClose} style={{ padding: "10px 24px", background: "#0084FF", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>Close</button>
                </div>
            </div>
        </div>
    );
}
