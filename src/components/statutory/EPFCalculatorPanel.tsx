"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";

interface EPFCalculatorPanelProps {
    pfWage: number;
    onWageChange: (wage: number) => void;
}

export default function EPFCalculatorPanel({ pfWage, onWageChange }: EPFCalculatorPanelProps) {
    const [calculation, setCalculation] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCalculation();
        }, 500);
        return () => clearTimeout(timer);
    }, [pfWage]);

    const fetchCalculation = async () => {
        if (pfWage <= 0) {
            setCalculation(null);
            return;
        }
        setLoading(true);
        try {
            const res = await axiosInstance.post('/api/statutory/epf/calculate', { pfWage });
            setCalculation(res.data.data);
        } catch (err) {
            console.error("Calculation error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            background: "#F8FAFC", 
            border: "1px solid #E2E8F0", 
            borderRadius: "12px", 
            padding: "24px", 
            position: "sticky", 
            top: "20px",
            width: "350px"
        }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Sample EPF Calculation</h4>
            <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
                Let's assume the PF wage is ₹{pfWage?.toLocaleString()}. The breakup of contribution will be:
            </p>

            <div style={{ marginBottom: "20px" }}>
                <label className="form-label">PF Wage (INR)</label>
                <input 
                    type="number" 
                    value={pfWage} 
                    onChange={(e) => onWageChange(Number(e.target.value))} 
                    className="form-input"
                    style={{ background: "white" }}
                />
            </div>

            {loading ? (
                <div style={{ fontSize: "13px", color: "var(--primary)" }}>Calculating...</div>
            ) : calculation ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <h5 style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Employee's Contribution</h5>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                            <span>EPF (12% of {pfWage})</span>
                            <span>₹{calculation.employeeContribution.epf.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style={{ borderTop: "1px dashed #CBD5E1", paddingTop: "16px" }}>
                        <h5 style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Employer's Contribution</h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>EPS (8.33% of 15000 Max)</span>
                                <span>₹{calculation.employerContribution.eps.toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>EPF (12% of 15000 - EPS)</span>
                                <span>₹{calculation.employerContribution.epf.toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>EDLI (0.5%)</span>
                                <span>₹{calculation.employerContribution.edli.toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Admin (0.5%)</span>
                                <span>₹{calculation.employerContribution.adminCharges.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "12px", marginTop: "4px", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "14px" }}>
                        <span>Total Monthly Contribution</span>
                        <span>₹{calculation.total.toLocaleString()}</span>
                    </div>
                </div>
            ) : null}

            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #E2E8F0" }}>
                <a href="#" style={{ color: "var(--primary)", fontSize: "13px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>👁️</span> Preview EPF Calculation
                </a>
            </div>
        </div>
    );
}
