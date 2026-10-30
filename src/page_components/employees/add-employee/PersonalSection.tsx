import FieldError from "./FieldError";
import type { SectionProps } from "./form";

/** Step "Basic Info": name, contact, ID and personal details. */
export default function PersonalSection({ formData, errors, onChange, onGenerateId }: SectionProps & { onGenerateId: () => void }) {
    return (
        <div className="card animate-in" style={{ padding: "30px" }}>
            <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Basic Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div><label className="form-label">First Name *</label><input name="firstName" value={formData.firstName} onChange={onChange} className="form-input" /><FieldError message={errors.firstName} /></div>
                <div><label className="form-label">Last Name *</label><input name="lastName" value={formData.lastName} onChange={onChange} className="form-input" /><FieldError message={errors.lastName} /></div>
                <div><label className="form-label">Email *</label><input type="email" name="email" value={formData.email} onChange={onChange} className="form-input" /><FieldError message={errors.email} /></div>
                <div>
                    <label className="form-label">Employee ID *</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <input name="employeeId" value={formData.employeeId} onChange={onChange} className="form-input" />
                        <button onClick={onGenerateId} className="btn btn-secondary btn-sm">Auto</button>
                    </div>
                    <FieldError message={errors.employeeId} />
                </div>
                <div>
                    <label className="form-label">Phone *</label>
                    <input name="phone" value={formData.phone} onChange={onChange} className="form-input" placeholder="e.g. 9876543210" />
                    <FieldError message={errors.phone} />
                </div>
                <div>
                    <label className="form-label">Gender</label>
                    <select name="gender" value={formData.gender} onChange={onChange} className="form-input">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="form-label">Date of Birth</label>
                    <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={onChange}
                        className="form-input"
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    />
                    <FieldError message={errors.dateOfBirth} />
                </div>
                <div>
                    <label className="form-label">Marital Status</label>
                    <select name="maritalStatus" value={formData.maritalStatus} onChange={onChange} className="form-input">
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                    </select>
                </div>
                <div style={{ display: "none" }}>
                    <input type="hidden" name="organizationId" value={formData.organizationId} />
                </div>

            </div>
        </div>
    );
}
