"use client";

interface PermissionModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    permissionForm: { date: string, hoursRequest: number, reason: string };
    setPermissionForm: (form: any) => void;
    actionLoading: boolean;
}

export default function PermissionModal({
    show,
    onClose,
    onSubmit,
    permissionForm,
    setPermissionForm,
    actionLoading
}: PermissionModalProps) {
    if (!show) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "var(--overlay-bg)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
        }}>
            <div className="card" style={{ width: "400px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <h3 className="card-title" style={{ margin: 0 }}>Request Permission</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-secondary)" }}>&times;</button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="form-group" style={{ marginBottom: "16px" }}>
                        <label className="form-label" style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Date</label>
                        <input type="date" required className="form-control" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                            value={permissionForm.date} onChange={e => setPermissionForm({...permissionForm, date: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: "16px" }}>
                        <label className="form-label" style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Hours Needed (Max 2)</label>
                        <select className="form-control" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                            value={permissionForm.hoursRequest} onChange={e => setPermissionForm({...permissionForm, hoursRequest: Number(e.target.value)})}>
                            <option value={1}>1 Hour</option>
                            <option value={2}>2 Hours</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: "20px" }}>
                        <label className="form-label" style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Reason</label>
                        <textarea required rows={3} className="form-control" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                            value={permissionForm.reason} onChange={e => setPermissionForm({...permissionForm, reason: e.target.value})} placeholder="Why do you need permission?"></textarea>
                    </div>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                            {actionLoading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
