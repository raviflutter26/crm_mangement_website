import FieldError from "./FieldError";
import type { SectionProps } from "./form";

/** Step "Documents": PAN, Aadhaar, passport and driving licence. */
export default function DocumentsSection({ formData, errors, onChange }: SectionProps) {
    return (
        <div className="card animate-in" style={{ padding: "30px" }}>
            <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Identity Documents</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                    <label className="form-label">PAN Number *</label>
                    <input name="panNumber" value={formData.panNumber} onChange={onChange} className="form-input" placeholder="ABCDE1234F" maxLength={10} />
                    <FieldError message={errors.panNumber} />
                </div>
                <div>
                    <label className="form-label">Aadhaar Number</label>
                    <input name="aadhaar" value={formData.aadhaar} onChange={onChange} className="form-input" placeholder="12 Digit Number" />
                    <FieldError message={errors.aadhaar} />
                </div>
                <div><label className="form-label">Passport Number</label><input name="passportNumber" value={formData.passportNumber} onChange={onChange} className="form-input" /></div>
                <div><label className="form-label">Driving License</label><input name="drivingLicense" value={formData.drivingLicense} onChange={onChange} className="form-input" /></div>
            </div>
        </div>
    );
}

/** Step "System" (new employees only): onboarding email. */
export function SystemSection({ formData, onChange }: Omit<SectionProps, "errors">) {
    return (
        <div className="card animate-in" style={{ padding: "40px" }}>
            <h3 style={{ marginBottom: "25px", color: "var(--primary)" }}>System & Onboarding</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px", padding: "15px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                    <input type="checkbox" name="sendWelcomeEmail" checked={formData.sendWelcomeEmail} onChange={onChange} style={{ width: "20px", height: "20px" }} />
                    <div>
                        <div style={{ fontWeight: 600 }}>Send Welcome Email</div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Employee will receive an invitation to set their password.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
