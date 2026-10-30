import type { CSSProperties, ReactNode } from "react";
import type { InputChangeHandler, SectionProps } from "./form";

const ACCENT = "#f97316";

const labelStyle: CSSProperties = { display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle: CSSProperties = { width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" };
const selectStyle: CSSProperties = { ...inputStyle, background: "#fff" };
const smallLabelStyle: CSSProperties = { display: "block", fontSize: "11px", fontWeight: 500, color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" };
const smallInputStyle: CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", color: "#1f2937", outline: "none" };
const smallSelectStyle: CSSProperties = { ...smallInputStyle, background: "#fff" };
const hiddenCheckbox: CSSProperties = { position: "absolute", opacity: 0, width: 0, height: 0 };
const switchLabel: CSSProperties = { position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" };
const cardStyle = (enabled: boolean, accent: string): CSSProperties => ({
    background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb",
    borderLeft: enabled ? `4px solid ${accent}` : "4px solid #d1d5db",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.3s ease"
});

interface CardProps {
    title: string;
    name: string;
    enabled: boolean;
    onChange: InputChangeHandler;
    children: ReactNode;
}

/** PF / ESI: a full-width card with an on/off switch and status badge. */
function MajorCard({ title, name, enabled, onChange, children }: CardProps) {
    return (
        <div style={cardStyle(enabled, ACCENT)}>
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "18px 24px", borderBottom: enabled ? "1px solid #f3f4f6" : "none"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>{title}</h4>
                    {enabled ? (
                        <span style={{ fontSize: "11px", background: "#dcfce7", color: "#16a34a", padding: "2px 10px", borderRadius: "12px", fontWeight: 500 }}>Enabled</span>
                    ) : (
                        <span style={{ fontSize: "11px", background: "#f3f4f6", color: "#9ca3af", padding: "2px 10px", borderRadius: "12px", fontWeight: 500 }}>Disabled</span>
                    )}
                </div>
                <label style={switchLabel}>
                    <input type="checkbox" name={name} checked={enabled} onChange={onChange}
                        style={hiddenCheckbox} />
                    <div style={{
                        width: "44px", height: "24px", borderRadius: "12px",
                        background: enabled ? ACCENT : "#d1d5db", transition: "0.3s",
                        position: "relative"
                    }}>
                        <div style={{
                            width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
                            position: "absolute", top: "3px", left: enabled ? "23px" : "3px",
                            transition: "0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                        }} />
                    </div>
                </label>
            </div>
            {enabled && children}
        </div>
    );
}

/** PT / LWF / Bonus: a compact card with a smaller switch. */
function MinorCard({ title, name, enabled, onChange, children, accent }: CardProps & { accent: string }) {
    return (
        <div style={cardStyle(enabled, accent)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: enabled ? "1px solid #f3f4f6" : "none" }}>
                <h5 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>{title}</h5>
                <label style={switchLabel}>
                    <input type="checkbox" name={name} checked={enabled} onChange={onChange}
                        style={hiddenCheckbox} />
                    <div style={{
                        width: "36px", height: "20px", borderRadius: "10px",
                        background: enabled ? accent : "#d1d5db", transition: "0.3s", position: "relative"
                    }}>
                        <div style={{
                            width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
                            position: "absolute", top: "3px", left: enabled ? "19px" : "3px",
                            transition: "0.3s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                        }} />
                    </div>
                </label>
            </div>
            {enabled && children}
        </div>
    );
}

function CycleSelect({ name, value, onChange }: { name: string; value: string; onChange: InputChangeHandler }) {
    return (
        <select name={name} value={value} onChange={onChange} style={smallSelectStyle}>
            <option value="Monthly">Monthly</option>
            <option value="Half Yearly">Half Yearly</option>
            <option value="Yearly">Yearly</option>
        </select>
    );
}

interface StatutorySectionProps extends SectionProps {
    /** Organization compliance settings (GET /api/compliance); only the ESI rates are read. */
    complianceSettings: { esi?: { employeeContribution?: number; employerContribution?: number } } | null;
}

/** Step "Statutory & Compliance": PF, ESI, PT, LWF and statutory bonus. */
export default function StatutorySection({ formData, errors, onChange, complianceSettings }: StatutorySectionProps) {
    const fieldError = (message?: string) => message && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{message}</div>;

    return (
        <div className="animate-in" style={{ padding: "0" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 600, color: "#333", marginBottom: "8px" }}>Statutory & Compliance Details</h3>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "28px" }}>Configure statutory deductions and compliance settings for this employee.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* ─── Provident Fund (PF) ─── */}
                <MajorCard title="Provident Fund (PF)" name="pfEnabled" enabled={formData.pfEnabled} onChange={onChange}>
                    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>UAN Number (12 digits) *</label>
                                <input placeholder="123456789012" name="uan" value={formData.uan} onChange={onChange} maxLength={12}
                                    style={{ ...inputStyle, transition: "border 0.2s" }} />
                                {fieldError(errors.uan)}
                            </div>
                            <div>
                                <label style={labelStyle}>PF Number *</label>
                                <input placeholder="MH/BAN/12345/123" name="pfNumber" value={formData.pfNumber} onChange={onChange}
                                    style={inputStyle} />
                                {fieldError(errors.pfNumber)}
                            </div>
                            <div>
                                <label style={labelStyle}>PF Joining Date</label>
                                <input type="date" name="pfJoiningDate" value={formData.pfJoiningDate} onChange={onChange}
                                    style={inputStyle} />
                            </div>
                        </div>

                        {/* Contribution Preferences */}
                        <div style={{ background: "#fefce8", border: "1px solid #fef08a", padding: "16px 20px", borderRadius: "8px" }}>
                            <h5 style={{ fontSize: "13px", fontWeight: 600, color: "#854d0e", marginBottom: "14px", margin: "0 0 14px 0" }}>Contribution Preferences</h5>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                {[
                                    { name: "pfContributionPreferences.employerPF", label: "Employer's PF contribution in CTC", checked: formData.pfContributionPreferences.employerPF },
                                    { name: "pfContributionPreferences.edli", label: "EDLI contribution in CTC", checked: formData.pfContributionPreferences.edli },
                                    { name: "pfContributionPreferences.adminCharges", label: "Admin charges in CTC", checked: formData.pfContributionPreferences.adminCharges },
                                ].map((pref) => (
                                    <label key={pref.name} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#78350f", cursor: "pointer", lineHeight: "1.4" }}>
                                        <input type="checkbox" name={pref.name} checked={pref.checked} onChange={onChange} style={{ marginTop: "2px", accentColor: ACCENT }} />
                                        {pref.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Bottom toggles */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#f9fafb", padding: "14px 18px", borderRadius: "8px" }}>
                            {[
                                { name: "pfOverrideEnabled", label: "Allow Employee level Override", checked: formData.pfOverrideEnabled },
                                { name: "pfProRateRestrictedWage", label: "Pro-rate Restricted PF Wage", checked: formData.pfProRateRestrictedWage },
                                { name: "pfLOPBased", label: "Consider salary components on LOP", checked: formData.pfLOPBased },
                                { name: "pfABRYEligible", label: "Eligible for ABRY Scheme", checked: formData.pfABRYEligible },
                            ].map((opt) => (
                                <label key={opt.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#374151", cursor: "pointer" }}>
                                    <input type="checkbox" name={opt.name} checked={opt.checked} onChange={onChange} style={{ accentColor: ACCENT }} />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </MajorCard>

                {/* ─── Employees' State Insurance (ESI) ─── */}
                <MajorCard title="Employees' State Insurance (ESI)" name="esiEnabled" enabled={formData.esiEnabled} onChange={onChange}>
                    <div style={{ padding: "20px 24px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>ESI Number *</label>
                                <input placeholder="56-00-140218-000-0607" name="esiNumber" value={formData.esiNumber} onChange={onChange}
                                    style={inputStyle} />
                                {fieldError(errors.esiNumber)}
                            </div>
                            <div>
                                <label style={labelStyle}>ESI Joining Date</label>
                                <input type="date" name="esiJoiningDate" value={formData.esiJoiningDate} onChange={onChange}
                                    style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Deduction Cycle</label>
                                <select name="esiDeductionCycle" value={formData.esiDeductionCycle} onChange={onChange}
                                    style={selectStyle}>
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>ESI Salary Limit (₹)</label>
                                <input type="number" name="esiSalaryLimit" value={formData.esiSalaryLimit} onChange={onChange} placeholder="21000"
                                    style={inputStyle} />
                            </div>
                        </div>
                        <div style={{ marginTop: "14px", display: "flex", gap: "24px", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 18px", borderRadius: "8px", fontSize: "13px", color: "#1e40af" }}>
                            <span>Employee Contribution: <strong>{complianceSettings?.esi?.employeeContribution || 0.75}%</strong> of Gross Pay</span>
                            <span>Employer Contribution: <strong>{complianceSettings?.esi?.employerContribution || 3.25}%</strong> of Gross Pay</span>
                        </div>
                    </div>
                </MajorCard>

                {/* ─── PT, LWF, Bonus — 3 compact cards ─── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

                    {/* Professional Tax */}
                    <MinorCard title="Professional Tax" name="ptEnabled" enabled={formData.ptEnabled} onChange={onChange} accent="#8b5cf6">
                        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div>
                                <label style={smallLabelStyle}>PT Registration No.</label>
                                <input placeholder="PT Registration No." name="ptNumber" value={formData.ptNumber} onChange={onChange}
                                    style={smallInputStyle} />
                            </div>
                            <div>
                                <label style={smallLabelStyle}>Deduction Cycle</label>
                                <CycleSelect name="ptDeductionCycle" value={formData.ptDeductionCycle} onChange={onChange} />
                            </div>
                        </div>
                    </MinorCard>

                    {/* Labour Welfare Fund */}
                    <MinorCard title="Labour Welfare Fund" name="lwfEnabled" enabled={formData.lwfEnabled} onChange={onChange} accent="#0ea5e9">
                        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div>
                                <label style={smallLabelStyle}>LWF Account No.</label>
                                <input placeholder="LWF Account No." name="lwfNumber" value={formData.lwfNumber} onChange={onChange}
                                    style={smallInputStyle} />
                            </div>
                            <div>
                                <label style={smallLabelStyle}>Deduction Cycle</label>
                                <CycleSelect name="lwfDeductionCycle" value={formData.lwfDeductionCycle} onChange={onChange} />
                            </div>
                        </div>
                    </MinorCard>

                    {/* Statutory Bonus */}
                    <MinorCard title="Statutory Bonus" name="statutoryBonusEnabled" enabled={formData.statutoryBonusEnabled} onChange={onChange} accent="#10b981">
                        <div style={{ padding: "14px 16px" }}>
                            <label style={smallLabelStyle}>Bonus Amount</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "16px", fontWeight: 600, color: "#374151" }}>₹</span>
                                <input type="number" name="statutoryBonusAmount" value={formData.statutoryBonusAmount} onChange={onChange} placeholder="8,333"
                                    style={smallInputStyle} />
                            </div>
                        </div>
                    </MinorCard>
                </div>
            </div>
        </div>
    );
}

