import type { Dispatch, SetStateAction } from "react";
import { FiAlertCircle } from "react-icons/fi";
import type { Branch, Shift } from "@/types/api";
import FieldError from "./FieldError";
import type { ScopeState, SectionProps } from "./form";

/** A person who can be picked as reporting manager. */
export interface ManagerOption {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    department?: string;
}

interface ReportingSectionProps extends SectionProps {
    availableManagers: ManagerOption[];
    shifts: Shift[];
    canGrantScope: boolean;
    branches: Branch[];
    scope: ScopeState;
    setScope: Dispatch<SetStateAction<ScopeState>>;
}

/** Step "Reporting": manager, shift and (for owners/admins) branch scope. */
export default function ReportingSection({ formData, errors, onChange, availableManagers, shifts, canGrantScope, branches, scope, setScope }: ReportingSectionProps) {
    return (
        <div className="card animate-in" style={{ padding: "30px" }}>
            <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Reporting & Shift</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                    <label className="form-label">Reporting Manager {formData.role !== "HR" && "*"}</label>
                    <select name="reportingManager" value={formData.reportingManager} onChange={onChange} className="form-input" style={{ borderColor: errors.reportingManager ? "red" : "var(--border)" }}>
                        <option value="">Select Manager</option>
                        {availableManagers.map(m => <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.role})</option>)}
                    </select>
                    <FieldError message={errors.reportingManager} />
                </div>
                <div>
                    <label className="form-label">Shift *</label>
                    <select name="shift" value={formData.shift} onChange={onChange} className="form-input" style={{ borderColor: errors.shift ? "red" : "var(--border)" }}>
                        <option value="">Select Shift</option>
                        {shifts.map(s => <option key={s._id} value={s._id}>{s.name} ({s.startTime}-{s.endTime}){s.isNightShift ? ' 🌙' : ''}</option>)}
                    </select>
                    <FieldError message={errors.shift} />
                </div>
                {canGrantScope && (
                    <>
                        <div>
                            <label className="form-label">Posting Branch</label>
                            <select value={scope.branchId} onChange={(e) => setScope(prev => ({ ...prev, branchId: e.target.value }))} className="form-input">
                                <option value="">Not set</option>
                                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Where they work. Must be one of their access branches when those are set.</div>
                        </div>
                        <div>
                            <label className="form-label">Access</label>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
                                <input type="checkbox" checked={scope.isGroupWide} onChange={(e) => setScope(prev => ({ ...prev, isGroupWide: e.target.checked }))} />
                                Group-wide (sees every branch)
                            </label>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Admin and HR with no branches see nothing unless this is ticked.</div>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label className="form-label">Access Branches</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px" }}>
                                {branches.length === 0 && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>No branches defined.</span>}
                                {branches.map((b) => (
                                    <label key={b._id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={scope.branchIds.includes(String(b._id))}
                                            onChange={(e) => setScope(prev => ({
                                                ...prev,
                                                branchIds: e.target.checked
                                                    ? [...prev.branchIds, String(b._id)]
                                                    : prev.branchIds.filter((id) => id !== String(b._id)),
                                            }))}
                                        />
                                        {b.name}
                                    </label>
                                ))}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Branches this person may act in. None selected means no branch restriction.</div>
                        </div>
                    </>
                )}
                {formData.role === "Employee" && Array.isArray(formData.department) && formData.department.length > 0 && availableManagers.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", padding: "16px", background: "rgba(255, 193, 7, 0.1)", border: "1px solid #FFC107", borderRadius: "10px", color: "#856404", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <FiAlertCircle size={20} />
                        <div>
                            <strong>No Manager Assigned:</strong> This department does not have a manager assigned yet. Please assign a manager to this department to continue.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
