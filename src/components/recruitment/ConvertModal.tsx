import type { CSSProperties, Dispatch, FormEvent, SetStateAction } from "react";
import { FiCheckCircle, FiUserPlus } from "react-icons/fi";
import { refId, type Branch, type Department } from "@/types/api";
import { LABEL_STYLE, MODAL_BG, type Candidate, type ConvertForm, type ConvertResult } from "./types";

interface ConvertModalProps {
    candidate: Candidate;
    convertForm: ConvertForm;
    setConvertForm: Dispatch<SetStateAction<ConvertForm>>;
    convertMissing: string[];
    convertResult: ConvertResult | null;
    branches: Branch[];
    departments: Department[];
    onSubmit: (e: FormEvent) => void;
    onClose: () => void;
}

/** Turns a hired candidate into an employee. */
export default function ConvertModal({ candidate, convertForm, setConvertForm, convertMissing, convertResult, branches, departments, onSubmit, onClose }: ConvertModalProps) {
    const missingStyle = (field: string): CSSProperties => convertMissing.includes(field) ? { borderColor: "var(--error)", boxShadow: "0 0 0 1px var(--error)" } : {};

    return (
        <div style={MODAL_BG}>
            <div className="card animate-in" style={{ width: "600px", maxHeight: "88vh", overflow: "auto", padding: "24px" }}>
                <h2 style={{ marginBottom: "6px" }}>Convert to employee</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "18px" }}>
                    {candidate.firstName} {candidate.lastName} · {candidate.email}. The employee gets a welcome email and a link to set their password.
                </p>
                {convertResult ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
                            <FiCheckCircle color="var(--secondary)" size={20} />
                            Employee created{convertResult.employee?.employeeId ? ` (${convertResult.employee.employeeId})` : ""}.
                        </div>
                        <div style={{ fontSize: "14px", color: convertResult.setupLinkSent ? "var(--text-secondary)" : "var(--warning, #b45309)" }}>
                            {convertResult.setupLinkSent
                                ? "The password set-up link was emailed."
                                : "The password set-up link could not be emailed. Ask them to use “Forgot password” on the login page, or resend it later."}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button className="btn btn-primary" onClick={onClose}>Done</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div className="grid-2">
                            <div>
                                <label style={LABEL_STYLE}>PAN *</label>
                                <input className="form-input" style={missingStyle("panNumber")} placeholder="ABCDE1234F" maxLength={10}
                                    value={convertForm.panNumber || ""} onChange={e => setConvertForm({ ...convertForm, panNumber: e.target.value.toUpperCase() })} />
                            </div>
                            <div>
                                <label style={LABEL_STYLE}>Last name *</label>
                                <input className="form-input" style={missingStyle("lastName")} value={convertForm.lastName || ""} onChange={e => setConvertForm({ ...convertForm, lastName: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid-2">
                            <div>
                                <label style={LABEL_STYLE}>Phone</label>
                                <input className="form-input" style={missingStyle("phone")} value={convertForm.phone || ""} onChange={e => setConvertForm({ ...convertForm, phone: e.target.value })} />
                            </div>
                            <div>
                                <label style={LABEL_STYLE}>Designation</label>
                                <input className="form-input" value={convertForm.designation || ""} onChange={e => setConvertForm({ ...convertForm, designation: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid-2">
                            <div>
                                <label style={LABEL_STYLE}>Branch</label>
                                <select className="form-input" style={missingStyle("branchId")} value={convertForm.branchId || ""} onChange={e => setConvertForm({ ...convertForm, branchId: e.target.value, departmentId: "" })}>
                                    <option value="">Select branch…</option>
                                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={LABEL_STYLE}>Department</label>
                                <select className="form-input" style={missingStyle("departmentId")} value={convertForm.departmentId || ""} onChange={e => {
                                    const d = departments.find(x => x._id === e.target.value);
                                    setConvertForm({ ...convertForm, departmentId: e.target.value, department: d?.name || "" });
                                }}>
                                    <option value="">Select department…</option>
                                    {departments
                                        .filter(d => !convertForm.branchId || !d.branchId || refId(d.branchId) === convertForm.branchId)
                                        .map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid-2">
                            <div>
                                <label style={LABEL_STYLE}>Date of joining</label>
                                <input type="date" className="form-input" value={convertForm.dateOfJoining || ""} onChange={e => setConvertForm({ ...convertForm, dateOfJoining: e.target.value })} />
                            </div>
                            <div>
                                <label style={LABEL_STYLE}>Annual CTC (₹)</label>
                                <input type="number" min={0} className="form-input" value={convertForm.ctc || ""} onChange={e => setConvertForm({ ...convertForm, ctc: e.target.value })} />
                            </div>
                        </div>
                        {convertMissing.length > 0 && (
                            <div style={{ color: "var(--error)", fontSize: "13px" }}>Please fill in the highlighted fields.</div>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary"><FiUserPlus /> Create Employee</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
