import FieldError from "./FieldError";
import { BUILT_IN_TEMPLATES, type SalaryTemplate, type SectionProps } from "./form";

interface SalarySectionProps extends SectionProps {
    selectedTemplate: SalaryTemplate | null;
    allTemplates: SalaryTemplate[];
    onTemplateChange: (template: SalaryTemplate) => void;
    onAutoCalculate: (ctc: number, templateOverride?: SalaryTemplate) => void;
}

/** Step "Payroll": annual CTC, salary template and the monthly breakdown. */
export default function SalarySection({ formData, errors, onChange, selectedTemplate, allTemplates, onTemplateChange, onAutoCalculate }: SalarySectionProps) {
    const t = selectedTemplate || BUILT_IN_TEMPLATES[0];
    const monthlyCTC = Math.round(Number(formData.ctc) / 12);
    const currentSum = Number(formData.salary.basic) + Number(formData.salary.hra) + Number(formData.salary.da) + Number(formData.salary.specialAllowance);
    const isMismatch = formData.ctc > 0 && currentSum !== monthlyCTC;

    return (
        <div className="card animate-in" style={{ padding: "30px" }}>
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h3 style={{ color: "var(--primary)", marginBottom: "5px" }}>Payroll Details</h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        Set Annual CTC. Use &quot;Auto Calculate&quot; for percentage-based breakdown.
                    </p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <label className="form-label" style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>Salary Template</label>
                    <select
                        className="form-input"
                        style={{ width: "220px", padding: "6px 10px", height: "34px", fontSize: "13px", borderColor: "var(--primary)", borderWidth: "1.5px" }}
                        value={selectedTemplate?._id || "standard"}
                        onChange={(e) => {
                            const found = allTemplates.find(temp => temp._id === e.target.value);
                            onTemplateChange(found || BUILT_IN_TEMPLATES[0]);
                            if (formData.ctc) onAutoCalculate(formData.ctc, found || BUILT_IN_TEMPLATES[0]);
                        }}
                    >
                        {allTemplates.map(temp => <option key={temp._id} value={temp._id}>{temp.name}</option>)}
                    </select>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                    <label className="form-label">Annual CTC (INR) *</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <input
                            type="number"
                            name="ctc"
                            value={formData.ctc}
                            onChange={onChange}
                            onBlur={() => onAutoCalculate(formData.ctc)}
                            className="form-input"
                            placeholder="e.g. 600000"
                        />
                        <button onClick={() => onAutoCalculate(formData.ctc)} className="btn btn-primary btn-sm" style={{ whiteSpace: "nowrap", background: "var(--primary)", color: "white" }}>Auto Calculate</button>
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "6px", color: "var(--text-muted)" }}>Monthly CTC: <strong>₹{monthlyCTC.toLocaleString()}</strong></div>
                    <FieldError message={errors.ctc} />
                </div>

                <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: isMismatch ? "2px solid #EF5350" : "1px solid var(--border)" }}>
                    <div><label className="form-label">Basic ({t.basicPercent}%)</label><input type="number" name="salary.basic" value={formData.salary.basic} onChange={onChange} className="form-input" /></div>
                    <div><label className="form-label">HRA ({t.hraPercent}%)</label><input type="number" name="salary.hra" value={formData.salary.hra} onChange={onChange} className="form-input" /></div>
                    <div><label className="form-label">DA ({t.daPercent}%)</label><input type="number" name="salary.da" value={formData.salary.da} onChange={onChange} className="form-input" /></div>
                    <div><label className="form-label">Special Allowance ({t.specialAllowancePercent}%)</label><input type="number" name="salary.specialAllowance" value={formData.salary.specialAllowance} onChange={onChange} className="form-input" /></div>

                    <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>Components Total</span>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: isMismatch ? "#EF5350" : "var(--secondary)", fontFamily: "monospace" }}>₹{currentSum.toLocaleString()}</span>
                    </div>

                    {isMismatch && (
                        <div style={{ gridColumn: "1/-1", color: "#D32F2F", fontSize: "12px", padding: "10px 14px", background: "#FFEBEE", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                            ⚠️ Components total (₹{currentSum.toLocaleString()}) does not match Monthly CTC (₹{monthlyCTC.toLocaleString()}). Click <strong style={{ cursor: "pointer", textDecoration: "underline", marginLeft: "4px" }} onClick={() => onAutoCalculate(formData.ctc)}>Auto Calculate</strong> to fix.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
