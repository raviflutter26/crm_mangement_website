import type { Dispatch, SetStateAction } from "react";
import type { Department, Location } from "@/types/api";
import FieldError from "./FieldError";
import type { EmployeeForm, SectionProps } from "./form";

interface JobSectionProps extends SectionProps {
    setFormData: Dispatch<SetStateAction<EmployeeForm>>;
    departmentsList: Department[];
    locations: Location[];
    statesList: { name: string; state_code?: string }[];
    citiesList: string[];
    loadingStates: boolean;
    loadingCities: boolean;
    onStateChange: (stateName: string) => void;
}

/** Step "Work Info": departments, role, designation, location and address. */
export default function JobSection({
    formData, errors, onChange, setFormData, departmentsList, locations,
    statesList, citiesList, loadingStates, loadingCities, onStateChange,
}: JobSectionProps) {
    return (
        <div className="card animate-in" style={{ padding: "30px" }}>
            <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Work & Address Info</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                    <label className="form-label">Department * (Select Multiple if applicable)</label>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        padding: "15px",
                        background: "var(--bg-secondary)",
                        borderRadius: "8px",
                        border: errors.department ? "1px solid red" : "1px solid var(--border)",
                        maxHeight: "200px",
                        overflowY: "auto"
                    }}>
                        {departmentsList.map((d) => (
                            <div key={d._id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                    type="checkbox"
                                    id={`dept-${d._id}`}
                                    checked={Array.isArray(formData.department) && formData.department.includes(d.name)}
                                    onChange={(e) => {
                                        const currentDepts = Array.isArray(formData.department) ? [...formData.department] : [];
                                        if (e.target.checked) {
                                            setFormData(prev => ({ ...prev, department: [...currentDepts, d.name] }));
                                        } else {
                                            setFormData(prev => ({ ...prev, department: currentDepts.filter(name => name !== d.name) }));
                                        }
                                    }}
                                />
                                <label htmlFor={`dept-${d._id}`} style={{ fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</label>
                            </div>
                        ))}
                    </div>
                    <FieldError message={errors.department} />
                </div>
                <div>
                    <label className="form-label">System Role *</label>
                    <select name="role" value={formData.role} onChange={onChange} className="form-input">
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                        <option value="HR">HR</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                <div><label className="form-label">Designation</label><input name="designation" value={formData.designation} onChange={onChange} className="form-input" /></div>
                <div>
                    <label className="form-label">Employment Type</label>
                    <select name="employmentType" value={formData.employmentType} onChange={onChange} className="form-input">
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Intern">Intern</option>
                    </select>
                </div>
                <div>
                    <label className="form-label">Location</label>
                    <select name="location" value={formData.location} onChange={onChange} className="form-input">
                        <option value="">Select Location</option>
                        {locations.map(l => <option key={l._id} value={l.name}>{l.branch ? `${l.branch} - ${l.name}` : l.name}</option>)}
                    </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Current Address</label>
                    <textarea name="address.currentAddress" value={formData.address.currentAddress} onChange={onChange} className="form-input" style={{ height: "80px" }} />
                </div>
                <div>
                    <label className="form-label">State {loadingStates && "(Loading...)"}</label>
                    <div style={{ position: "relative" }}>
                        <select
                            name="address.state"
                            value={formData.address.state}
                            onChange={(e) => {
                                onChange(e);
                                onStateChange(e.target.value);
                            }}
                            className="form-input"
                            style={{ marginTop: "5px" }}
                        >
                            <option value="">Select State</option>
                            {statesList
                                .map(state => (
                                    <option key={state.state_code || state.name} value={state.name}>{state.name}</option>
                                ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="form-label">District {loadingCities && "(Loading...)"}</label>
                    <div style={{ position: "relative" }}>
                        <select
                            name="address.city"
                            value={formData.address.city}
                            onChange={onChange}
                            className="form-input"
                            style={{ marginTop: "5px" }}
                            disabled={!formData.address.state || loadingCities}
                        >
                            <option value="">{loadingCities ? "Loading districts..." : "Select District"}</option>
                            {citiesList
                                .map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            {!loadingCities && citiesList.length === 0 && formData.address.state && (
                                <option value="" disabled>No districts found</option>
                            )}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="form-label">Pincode *</label>
                    <input name="address.pincode" value={formData.address.pincode} onChange={onChange} className="form-input" placeholder="600001" maxLength={6} />
                    <FieldError message={errors.pincode} />
                </div>
                <div><label className="form-label">Date of Joining *</label><input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={onChange} className="form-input" /></div>
            </div>
        </div>
    );
}
