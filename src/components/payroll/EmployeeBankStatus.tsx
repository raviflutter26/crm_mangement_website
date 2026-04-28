"use client";

import { FiLock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

interface EmployeeBankStatusProps {
    employee: {
        _id: string;
        firstName: string;
        lastName: string;
        employeeId: string;
        bankAccount?: {
            maskedAccount?: string;
            bankName?: string;
            ifsc?: string;
            verified?: boolean;
            razorpayContactId?: string;
            razorpayFundAccountId?: string;
        };
        uan?: string;
    };
    onSetupBank?: (empId: string) => void;
}

export default function EmployeeBankStatus({ employee, onSetupBank }: EmployeeBankStatusProps) {
    const bank = employee.bankAccount;
    const hasBank = !!bank?.maskedAccount;
    const isVerified = bank?.verified;
    const razorpayReady = !!(bank?.razorpayContactId && bank?.razorpayFundAccountId);

    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px", background: hasBank ? "#F8FAFC" : "#FEF2F2",
            borderRadius: 12, border: `1px solid ${hasBank ? "#E2E8F0" : "#FEE2E2"}`, marginBottom: 8
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: "50%", background: "#EDE9FE", color: "#7C3AED",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0
                }}>
                    {employee.firstName?.charAt(0) || "?"}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {employee.firstName} {employee.lastName}
                        <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{employee.employeeId}</span>
                    </div>
                    {hasBank ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                                <FiLock size={11} style={{ color: "#7C3AED" }} />{bank?.maskedAccount || "••••••••••••"}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{bank?.bankName || "Bank"}</span>
                            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#94A3B8" }}>{bank?.ifsc}</span>
                        </div>
                    ) : (
                        <div style={{ fontSize: 12, color: "#EF4444", fontWeight: 600, marginTop: 2 }}>⚠️ Bank account not configured</div>
                    )}
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                {hasBank && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: isVerified ? "#D1FAE5" : "#FEF3C7", color: isVerified ? "#059669" : "#D97706" }}>
                        {isVerified ? <FiCheckCircle size={11} /> : <FiAlertCircle size={11} />}
                        {isVerified ? "Verified" : "Unverified"}
                    </span>
                )}
                {hasBank && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: razorpayReady ? "#EDE9FE" : "#F3F4F6", color: razorpayReady ? "#7C3AED" : "#6B7280" }}>
                        {razorpayReady ? "⚡ RazorpayX Ready" : "⏳ Not Linked"}
                    </span>
                )}
                {employee.uan && (
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#DBEAFE", color: "#2563EB" }}>
                        UAN: {employee.uan}
                    </span>
                )}
                {!hasBank && onSetupBank && (
                    <button className="btn btn-primary btn-sm" onClick={() => onSetupBank(employee._id)}>Setup Bank</button>
                )}
            </div>
        </div>
    );
}
