import type { CSSProperties, ReactNode } from "react";
import { FiUser, FiBriefcase, FiMapPin, FiDollarSign, FiPercent, FiCreditCard, FiFileText } from "react-icons/fi";
import type { EmployeeForm } from "./form";

const headingStyle: CSSProperties = { fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" };
const listStyle: CSSProperties = { fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" };

function Group({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
    return (
        <div>
            <div style={headingStyle}>
                {icon} {title}
            </div>
            <div style={listStyle}>
                {children}
            </div>
        </div>
    );
}

/** Step "Review": a read-only summary before submit. */
export default function ReviewSection({ formData }: { formData: EmployeeForm }) {
    return (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card" style={{ padding: "30px" }}>
                <h3 style={{ color: "var(--primary)", marginBottom: "20px" }}>Summary Review</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                    <Group icon={<FiUser size={16} />} title="Personal & Role">
                        <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                        <div><strong>Email:</strong> {formData.email}</div>
                        <div><strong>Phone:</strong> {formData.phone}</div>
                        <div><strong>Role:</strong> {formData.role}</div>
                        <div><strong>Employee ID:</strong> {formData.employeeId}</div>
                    </Group>

                    <Group icon={<FiBriefcase size={16} />} title="Work Context">
                        <div><strong>Department:</strong> {formData.department}</div>
                        <div><strong>Designation:</strong> {formData.designation}</div>
                        <div><strong>Joining Date:</strong> {formData.dateOfJoining}</div>
                        <div><strong>Manager:</strong> {formData.reportingManager || "Not Assigned"}</div>
                    </Group>

                    <Group icon={<FiDollarSign size={16} />} title="Payroll & Salary">
                        <div><strong>Annual CTC:</strong> ₹{formData.ctc.toLocaleString()}</div>
                        <div style={{ padding: "8px", background: "var(--bg-secondary)", borderRadius: "8px", marginTop: "4px" }}>
                            <div><strong>Basic:</strong> ₹{formData.salary.basic.toLocaleString()}</div>
                            <div><strong>HRA:</strong> ₹{formData.salary.hra.toLocaleString()}</div>
                            <div><strong>DA:</strong> ₹{formData.salary.da.toLocaleString()}</div>
                            <div><strong>Special:</strong> ₹{formData.salary.specialAllowance.toLocaleString()}</div>
                        </div>
                    </Group>

                    <Group icon={<FiCreditCard size={16} />} title="Bank Information">
                        <div><strong>Account Holder:</strong> {formData.bankDetails.accountHolderName}</div>
                        <div><strong>Bank:</strong> {formData.bankDetails.bankName}</div>
                        <div><strong>Account No:</strong> ****{formData.bankDetails.accountNumber.slice(-4)}</div>
                        <div><strong>IFSC:</strong> {formData.bankDetails.ifscCode}</div>
                    </Group>

                    <Group icon={<FiPercent size={16} />} title="Statutory Details">
                        <div><strong>PF:</strong> {formData.pfEnabled ? `Enabled (${formData.uan})` : "Disabled"}</div>
                        {formData.pfEnabled && (
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "10px" }}>
                                • LOP Based: {formData.pfLOPBased ? "Yes" : "No"} | ABRY: {formData.pfABRYEligible ? "Yes" : "No"}
                            </div>
                        )}
                        <div><strong>ESI:</strong> {formData.esiEnabled ? `Enabled (${formData.esiNumber})` : "Disabled"}</div>
                        <div><strong>PT:</strong> {formData.ptEnabled ? `Enabled (${formData.ptNumber}) - ${formData.ptDeductionCycle}` : "Disabled"}</div>
                        <div><strong>LWF:</strong> {formData.lwfEnabled ? `Enabled (${formData.lwfNumber}) - ${formData.lwfDeductionCycle}` : "Disabled"}</div>
                        <div><strong>Bonus:</strong> {formData.statutoryBonusEnabled ? `₹${formData.statutoryBonusAmount}` : "Disabled"}</div>
                    </Group>

                    <Group icon={<FiFileText size={16} />} title="Documents">
                        <div><strong>PAN:</strong> {formData.panNumber || "Not Provided"}</div>
                        <div><strong>Aadhaar:</strong> {formData.aadhaar || "Not Provided"}</div>
                        <div><strong>Cheque Copy:</strong> {formData.bankDetails.cancelledCheque || "Not Uploaded"}</div>
                    </Group>

                    {/* Address */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <div style={headingStyle}>
                            <FiMapPin size={16} /> Address Details
                        </div>
                        <div style={{ fontSize: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "2px" }}>Current Address</div>
                                <div>{formData.address.currentAddress}, {formData.address.city}, {formData.address.state} - {formData.address.pincode}</div>
                            </div>
                            <div>
                                <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "2px" }}>Permanent Address</div>
                                <div>{formData.address.permanentAddress || "Same as current"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ textAlign: "center", padding: "10px", color: "var(--text-secondary)", fontSize: "14px" }}>
                Please verify all details above before clicking Submit.
            </div>
        </div>
    );
}
