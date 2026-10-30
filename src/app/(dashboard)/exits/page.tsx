"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FiLogOut, FiCheck, FiX, FiUserX, FiClipboard, FiDollarSign, FiFileText, FiRefreshCw } from "react-icons/fi";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useAuth } from "@/lib/auth";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useConfirm, useToast } from "@/components/common/DialogProvider";

const STATUS_BADGE: Record<string, string> = {
    pending: "pending", approved: "processing", settled: "active", rejected: "inactive", withdrawn: "inactive",
};
const HR_ROLES = ["owner", "admin", "hr"];

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—");
const inr = (n?: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const personName = (p: any) => (p && typeof p === "object" ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : "—");
const dateInput = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const Modal = ({ title, onClose, children, width = "560px" }: { title: string; onClose: () => void; children: React.ReactNode; width?: string }) => (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="card animate-in" style={{ width, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "20px" }}>{title}</h2>
                <button className="btn btn-secondary btn-sm" onClick={onClose}><FiX /></button>
            </div>
            {children}
        </div>
    </div>
);

export default function ExitsPage() {
    const { user } = useAuth();
    const confirm = useConfirm();
    const toast = useToast();
    const isHR = HR_ROLES.includes(String(user?.role || "").toLowerCase());

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [employees, setEmployees] = useState<any[]>([]);

    const [approveFor, setApproveFor] = useState<any>(null);
    const [approveForm, setApproveForm] = useState({ lastWorkingDay: "", remarks: "", waiveShortfall: false });
    const [showTerminate, setShowTerminate] = useState(false);
    const [terminateForm, setTerminateForm] = useState({ employee: "", reason: "", lastWorkingDay: "", remarks: "" });
    const [detail, setDetail] = useState<any>(null);
    const [settleForm, setSettleForm] = useState({ paymentReference: "", paymentMode: "Bank transfer" });
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = statusFilter ? `${API_ENDPOINTS.SEPARATIONS}?status=${statusFilter}` : API_ENDPOINTS.SEPARATIONS;
            const res = await axiosInstance.get(url);
            setItems(res.data.data || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not load exits.");
        } finally { setLoading(false); }
    }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!isHR) return;
        axiosInstance.get(API_ENDPOINTS.EMPLOYEES)
            .then((res) => setEmployees((res.data.data || []).filter((e: any) => e.isActive !== false)))
            .catch(() => setEmployees([]));
    }, [isHR]);

    const openDetail = async (id: string) => {
        try {
            const res = await axiosInstance.get(`${API_ENDPOINTS.SEPARATIONS}/${id}`);
            setDetail(res.data.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not open this exit.");
        }
    };

    const refreshDetail = (data: any) => {
        // Action responses are not populated; keep the populated employee from the current view.
        setDetail((prev: any) => ({ ...data, employee: prev?.employee || data.employee, organizationId: prev?.organizationId || data.organizationId }));
        load();
    };

    const openApprove = (s: any) => {
        setApproveFor(s);
        setApproveForm({ lastWorkingDay: dateInput(s.proposedLastWorkingDay), remarks: "", waiveShortfall: false });
    };

    const doApprove = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const body: any = { lastWorkingDay: approveForm.lastWorkingDay, remarks: approveForm.remarks || undefined };
            if (isHR) body.waiveShortfall = approveForm.waiveShortfall;
            await axiosInstance.patch(`${API_ENDPOINTS.SEPARATIONS}/${approveFor._id}/approve`, body);
            toast.success("Resignation approved. The employee is now serving notice.");
            setApproveFor(null);
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not approve.");
        } finally { setBusy(false); }
    };

    const doReject = async (s: any) => {
        const ok = await confirm({ title: "Reject this resignation?", description: `${personName(s.employee)} will be told it was not accepted.`, confirmLabel: "Reject", danger: true });
        if (!ok) return;
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.SEPARATIONS}/${s._id}/reject`, {});
            toast.success("Resignation rejected.");
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not reject.");
        }
    };

    const doTerminate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!terminateForm.employee || !terminateForm.reason || !terminateForm.lastWorkingDay) {
            toast.error("Choose the employee, a reason and the last working day.");
            return;
        }
        const ok = await confirm({ title: "Terminate employment?", description: "The exit is approved at once and the account closes after the last working day.", confirmLabel: "Terminate", danger: true });
        if (!ok) return;
        setBusy(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.SEPARATION_TERMINATE, { ...terminateForm, remarks: terminateForm.remarks || undefined });
            toast.success("Termination recorded.");
            setShowTerminate(false);
            setTerminateForm({ employee: "", reason: "", lastWorkingDay: "", remarks: "" });
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not terminate.");
        } finally { setBusy(false); }
    };

    const toggleChecklist = async (key: string, done: boolean, recoverUnreturned = false): Promise<void> => {
        try {
            const res = await axiosInstance.patch(`${API_ENDPOINTS.SEPARATIONS}/${detail._id}/checklist`, { key, done, recoverUnreturned });
            refreshDetail(res.data.data);
        } catch (err: any) {
            const unreturned = err.response?.status === 409 ? err.response?.data?.data?.unreturned : null;
            if (unreturned?.length) {
                const list = unreturned.map((a: any) => `${a.name}${a.assetId ? ` (${a.assetId})` : ""} — ${inr(a.currentValue || a.purchaseValue)}`).join(", ");
                const ok = await confirm({
                    title: "Assets not yet returned",
                    description: `Still issued: ${list}. Recover their value from the full & final settlement instead?`,
                    confirmLabel: "Recover in F&F",
                });
                if (ok) return toggleChecklist(key, done, true);
                return;
            }
            toast.error(err.response?.data?.message || "Could not update the checklist.");
        }
    };

    const computeFnF = async () => {
        setBusy(true);
        try {
            const res = await axiosInstance.post(`${API_ENDPOINTS.SEPARATIONS}/${detail._id}/fnf`, {});
            refreshDetail(res.data.data);
            toast.success("Full & final settlement computed.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not compute the F&F.");
        } finally { setBusy(false); }
    };

    const settle = async () => {
        const ok = await confirm({ title: "Mark as settled?", description: `Record that ${inr(detail.fnf?.netPayable)} has been settled.`, confirmLabel: "Settle" });
        if (!ok) return;
        setBusy(true);
        try {
            const res = await axiosInstance.patch(`${API_ENDPOINTS.SEPARATIONS}/${detail._id}/settle`, settleForm);
            refreshDetail(res.data.data);
            toast.success("Settlement recorded.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not settle.");
        } finally { setBusy(false); }
    };

    const counts = {
        pending: items.filter((s) => s.status === "pending").length,
        approved: items.filter((s) => s.status === "approved").length,
        settled: items.filter((s) => s.status === "settled").length,
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Exits</h1>
                    <p className="page-subtitle">Resignations, terminations, exit checklists and full &amp; final settlement.</p>
                </div>
                {isHR && <button className="btn btn-primary" onClick={() => setShowTerminate(true)}><FiUserX /> Initiate termination</button>}
            </div>

            <div className="stats-grid">
                <div className="stat-card orange"><div className="stat-card-value">{counts.pending}</div><div className="stat-card-label">Awaiting approval</div></div>
                <div className="stat-card blue"><div className="stat-card-value">{counts.approved}</div><div className="stat-card-label">Serving notice</div></div>
                <div className="stat-card green"><div className="stat-card-value">{counts.settled}</div><div className="stat-card-label">Settled</div></div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Exit requests</h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <select className="form-input" style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="settled">Settled</option>
                            <option value="rejected">Rejected</option>
                            <option value="withdrawn">Withdrawn</option>
                        </select>
                        <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><FiRefreshCw /></button>
                    </div>
                </div>
                <div className="table-wrapper">
                    {loading ? <TableSkeleton rows={5} /> : (
                        <table>
                            <thead><tr><th>Employee</th><th>Type</th><th>Submitted</th><th>Last working day</th><th>Shortfall</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {items.map((s) => (
                                    <tr key={s._id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{personName(s.employee)}</div>
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.employee?.employeeId} {s.employee?.designation ? `· ${s.employee.designation}` : ""}</div>
                                        </td>
                                        <td style={{ textTransform: "capitalize" }}>{s.type}</td>
                                        <td>{fmt(s.submittedAt)}</td>
                                        <td>{fmt(s.lastWorkingDay || s.proposedLastWorkingDay)}{!s.lastWorkingDay && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}> (proposed)</span>}</td>
                                        <td>{s.noticeShortfallDays > 0 ? `${s.noticeShortfallDays}d${s.shortfallWaived ? " (waived)" : ""}` : "—"}</td>
                                        <td><span className={`badge ${STATUS_BADGE[s.status] || "pending"}`}>{s.status}</span>{s.deactivatedAt && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>account closed</div>}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                {s.status === "pending" && (
                                                    <>
                                                        <button className="btn btn-primary btn-sm" onClick={() => openApprove(s)} title="Approve"><FiCheck /></button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => doReject(s)} title="Reject" style={{ color: "var(--error)" }}><FiX /></button>
                                                    </>
                                                )}
                                                <button className="btn btn-secondary btn-sm" onClick={() => openDetail(s._id)}><FiClipboard /> Details</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr><td colSpan={7} style={{ padding: "60px 40px" }}>
                                        <EmptyState icon={FiLogOut} title="No exits" description="Resignations submitted by employees in your scope, and terminations HR initiates, appear here." />
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {approveFor && (
                <Modal title={`Approve resignation — ${personName(approveFor.employee)}`} onClose={() => setApproveFor(null)}>
                    <form onSubmit={doApprove} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                            Notice period {approveFor.noticePeriodDays} days. Proposed last day {fmt(approveFor.proposedLastWorkingDay)}. Reason: {approveFor.reason}
                        </div>
                        <div>
                            <label className="form-label">Final last working day *</label>
                            <input required type="date" className="form-input" value={approveForm.lastWorkingDay} onChange={(e) => setApproveForm({ ...approveForm, lastWorkingDay: e.target.value })} />
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Any shortfall against the notice period is recorded and recovered in the F&amp;F unless waived.</div>
                        </div>
                        {isHR && (
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                                <input type="checkbox" checked={approveForm.waiveShortfall} onChange={(e) => setApproveForm({ ...approveForm, waiveShortfall: e.target.checked })} />
                                Waive notice shortfall recovery
                            </label>
                        )}
                        <div>
                            <label className="form-label">Remarks</label>
                            <textarea className="form-input" rows={2} value={approveForm.remarks} onChange={(e) => setApproveForm({ ...approveForm, remarks: e.target.value })} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setApproveFor(null)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={busy}>Approve</button>
                        </div>
                    </form>
                </Modal>
            )}

            {showTerminate && (
                <Modal title="Initiate termination" onClose={() => setShowTerminate(false)}>
                    <form onSubmit={doTerminate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div>
                            <label className="form-label">Employee *</label>
                            <select className="form-input" value={terminateForm.employee} onChange={(e) => setTerminateForm({ ...terminateForm, employee: e.target.value })}>
                                <option value="">Select employee</option>
                                {employees.filter((e) => e._id !== user?._id).map((e) => (
                                    <option key={e._id} value={e._id}>{personName(e)}{e.employeeId ? ` (${e.employeeId})` : ""}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Reason *</label>
                            <textarea className="form-input" rows={3} value={terminateForm.reason} onChange={(e) => setTerminateForm({ ...terminateForm, reason: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">Last working day *</label>
                            <input type="date" className="form-input" value={terminateForm.lastWorkingDay} onChange={(e) => setTerminateForm({ ...terminateForm, lastWorkingDay: e.target.value })} />
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>A date in the past closes the account immediately.</div>
                        </div>
                        <div>
                            <label className="form-label">Remarks</label>
                            <input className="form-input" value={terminateForm.remarks} onChange={(e) => setTerminateForm({ ...terminateForm, remarks: e.target.value })} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowTerminate(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={busy} style={{ background: "var(--error)" }}>Terminate</button>
                        </div>
                    </form>
                </Modal>
            )}

            {detail && (
                <Modal title={`${detail.type === "termination" ? "Termination" : "Resignation"} — ${personName(detail.employee)}`} onClose={() => setDetail(null)} width="860px">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px", fontSize: "14px", marginBottom: "20px" }}>
                        <div><div className="form-label">Status</div><span className={`badge ${STATUS_BADGE[detail.status] || "pending"}`}>{detail.status}</span></div>
                        <div><div className="form-label">Submitted</div>{fmt(detail.submittedAt)}</div>
                        <div><div className="form-label">Last working day</div>{fmt(detail.lastWorkingDay || detail.proposedLastWorkingDay)}</div>
                        <div><div className="form-label">Notice</div>{detail.noticeServedDays}/{detail.noticePeriodDays} days</div>
                        <div><div className="form-label">Shortfall</div>{detail.noticeShortfallDays || 0} days{detail.shortfallWaived ? " (waived)" : ""}</div>
                        <div><div className="form-label">Approved by</div>{personName(detail.approvedBy)}</div>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Reason: {detail.reason}</div>

                    {["approved", "settled"].includes(detail.status) && (
                        <>
                            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}><FiClipboard /> Exit checklist</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                                {(detail.checklist || []).map((item: any) => (
                                    <label key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "8px", cursor: isHR && detail.status === "approved" ? "pointer" : "default" }}>
                                        <input
                                            type="checkbox"
                                            checked={!!item.done}
                                            disabled={!isHR || detail.status !== "approved"}
                                            onChange={(e) => toggleChecklist(item.key, e.target.checked)}
                                            style={{ marginTop: "3px" }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{item.label || item.key}</div>
                                            {item.done && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Done {fmt(item.doneAt)}</div>}
                                            {item.notes && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{item.notes}</div>}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}><FiDollarSign /> Full &amp; final settlement</h3>
                                {isHR && detail.status === "approved" && (
                                    <button className="btn btn-secondary btn-sm" onClick={computeFnF} disabled={busy}>{detail.fnf?.computedAt ? "Recompute" : "Compute F&F"}</button>
                                )}
                            </div>
                            {detail.fnf?.computedAt ? (
                                <div className="table-wrapper" style={{ marginBottom: "16px" }}>
                                    <table>
                                        <thead><tr><th>Component</th><th>Basis</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
                                        <tbody>
                                            {detail.fnf.lines.map((l: any) => (
                                                <tr key={l.key}>
                                                    <td style={{ fontWeight: 600 }}>{l.label}</td>
                                                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{l.basis}</td>
                                                    <td style={{ textAlign: "right", fontFamily: "monospace", color: l.kind === "deduction" ? "var(--error)" : undefined }}>
                                                        {l.kind === "deduction" && l.amount ? "−" : ""}{inr(l.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr><td colSpan={2} style={{ fontWeight: 600 }}>Total earnings</td><td style={{ textAlign: "right", fontFamily: "monospace" }}>{inr(detail.fnf.totalEarnings)}</td></tr>
                                            <tr><td colSpan={2} style={{ fontWeight: 600 }}>Total recoveries</td><td style={{ textAlign: "right", fontFamily: "monospace", color: "var(--error)" }}>−{inr(detail.fnf.totalDeductions)}</td></tr>
                                            <tr>
                                                <td colSpan={2} style={{ fontWeight: 800 }}>{detail.fnf.netPayable < 0 ? "Net recoverable from employee" : "Net payable"}</td>
                                                <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 800 }}>{inr(Math.abs(detail.fnf.netPayable))}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    {(detail.fnf.notes || []).map((n: string) => (
                                        <div key={n} style={{ fontSize: "12px", color: "var(--text-muted)", padding: "6px 12px" }}>• {n}</div>
                                    ))}
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", padding: "0 12px 8px" }}>Computed {new Date(detail.fnf.computedAt).toLocaleString("en-IN")}</div>
                                </div>
                            ) : (
                                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>Not computed yet.</div>
                            )}

                            {isHR && detail.status === "approved" && detail.fnf?.computedAt && (
                                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", padding: "16px", border: "1px solid var(--border)", borderRadius: "8px", marginBottom: "16px" }}>
                                    <div style={{ flex: 1, minWidth: "180px" }}>
                                        <label className="form-label">Payment reference</label>
                                        <input className="form-input" value={settleForm.paymentReference} onChange={(e) => setSettleForm({ ...settleForm, paymentReference: e.target.value })} placeholder="UTR / cheque no." />
                                    </div>
                                    <div style={{ minWidth: "160px" }}>
                                        <label className="form-label">Payment mode</label>
                                        <select className="form-input" value={settleForm.paymentMode} onChange={(e) => setSettleForm({ ...settleForm, paymentMode: e.target.value })}>
                                            <option>Bank transfer</option><option>Cheque</option><option>Payroll</option><option>Cash</option>
                                        </select>
                                    </div>
                                    <button className="btn btn-primary" onClick={settle} disabled={busy}>Mark settled</button>
                                </div>
                            )}
                            {detail.status === "settled" && (
                                <div style={{ fontSize: "13px", marginBottom: "16px" }}>
                                    Settled {fmt(detail.settledAt)}{detail.paymentReference ? ` · Ref ${detail.paymentReference}` : ""}{detail.paymentMode ? ` · ${detail.paymentMode}` : ""}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <Link className="btn btn-secondary btn-sm" href={`/exits/letter?id=${detail._id}&type=exit`} target="_blank"><FiFileText /> {detail.type === "termination" ? "Termination letter" : "Acceptance letter"}</Link>
                                {detail.status === "settled" && (
                                    <Link className="btn btn-secondary btn-sm" href={`/exits/letter?id=${detail._id}&type=relieving`} target="_blank"><FiFileText /> Relieving letter</Link>
                                )}
                            </div>
                        </>
                    )}
                </Modal>
            )}
        </>
    );
}
