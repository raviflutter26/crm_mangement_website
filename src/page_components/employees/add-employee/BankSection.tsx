import type { Dispatch, SetStateAction } from "react";
import { FiCheckCircle } from "react-icons/fi";
import type { EmployeeForm, SectionProps } from "./form";

interface BankSectionProps extends SectionProps {
    setFormData: Dispatch<SetStateAction<EmployeeForm>>;
    isFetchingIFSC: boolean;
    ifscVerified: boolean;
    onIfscBlur: (ifsc: string) => void;
}

/** Step "Bank Details": account, IFSC lookup and cancelled cheque. */
export default function BankSection({ formData, errors, onChange, setFormData, isFetchingIFSC, ifscVerified, onIfscBlur }: BankSectionProps) {
    return (
        <div className="card animate-in" style={{ padding: "30px" }}>
            <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Bank Account Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Account Holder Name *</label>
                    <input name="bankDetails.accountHolderName" value={formData.bankDetails.accountHolderName} onChange={onChange} className="form-input" placeholder="Name as per bank records" />
                    {errors["bankDetails.accountHolderName"] && <div className="error-text">{errors["bankDetails.accountHolderName"]}</div>}
                </div>

                <div>
                    <label className="form-label">IFSC Code *</label>
                    <div style={{ position: "relative" }}>
                        <input
                            name="bankDetails.ifscCode"
                            value={formData.bankDetails.ifscCode}
                            onChange={onChange}
                            onBlur={(e) => onIfscBlur(e.target.value)}
                            className="form-input"
                            placeholder="e.g., HDFC0001234"
                        />
                        <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
                            {isFetchingIFSC ? (
                                <div className="spinner-small" style={{ width: "16px", height: "16px", border: "2px solid #ccc", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                            ) : ifscVerified ? (
                                <FiCheckCircle color="#4CAF50" size={18} />
                            ) : null}
                        </div>
                    </div>
                    {errors["bankDetails.ifscCode"] && <div className="error-text">{errors["bankDetails.ifscCode"]}</div>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", gridColumn: "1 / -1" }}>
                    <div>
                        <label className="form-label">Bank Name</label>
                        <input name="bankDetails.bankName" value={formData.bankDetails.bankName} className="form-input read-only" readOnly style={{ background: "var(--bg-secondary)" }} placeholder="Auto-filled from IFSC" />
                    </div>
                    <div>
                        <label className="form-label">Branch Name</label>
                        <input name="bankDetails.branchName" value={formData.bankDetails.branchName} className="form-input read-only" readOnly style={{ background: "var(--bg-secondary)" }} placeholder="Auto-filled from IFSC" />
                    </div>
                </div>

                <div>
                    <label className="form-label">Account Number *</label>
                    <input name="bankDetails.accountNumber" value={formData.bankDetails.accountNumber} onChange={onChange} className="form-input" placeholder="9-18 digits" />
                    {errors["bankDetails.accountNumber"] && <div className="error-text">{errors["bankDetails.accountNumber"]}</div>}
                </div>

                <div>
                    <label className="form-label">Confirm Account Number *</label>
                    <input name="bankDetails.confirmAccountNumber" value={formData.bankDetails.confirmAccountNumber} onChange={onChange} className="form-input" placeholder="Repeat account number" />
                    {errors["bankDetails.confirmAccountNumber"] && <div className="error-text">{errors["bankDetails.confirmAccountNumber"]}</div>}
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">UPI ID (Optional)</label>
                    <input name="bankDetails.upiId" value={formData.bankDetails.upiId} onChange={onChange} className="form-input" placeholder="e.g., user@okhdfc" />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Cancelled Cheque / Passbook Copy</label>
                    <input
                        type="file"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                // Real implementation would upload to S3/Cloudinary
                                // For now, we'll store a mock path or base64 if small
                                setFormData(prev => ({
                                    ...prev,
                                    bankDetails: { ...prev.bankDetails, cancelledCheque: file.name }
                                }));
                            }
                        }}
                        className="form-input"
                        accept="image/*,.pdf"
                    />
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>Upload a clear photo or PDF for verification.</div>
                </div>
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .error-text { color: red; fontSize: 11px; margin-top: 4px; }
            `}</style>
        </div>
    );
}
