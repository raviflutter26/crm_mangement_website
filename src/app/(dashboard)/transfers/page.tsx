"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FiShuffle, FiPlus, FiCheck, FiX, FiSlash, FiRefreshCw } from "react-icons/fi";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useConfirm, useToast } from "@/components/common/DialogProvider";

const STATUS_BADGE: Record<string, string> = {
    pending: "pending", approved: "processing", applied: "active", rejected: "inactive", cancelled: "inactive",
};

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—");
const nm = (v: any) => (v && typeof v === "object" ? (v.name || `${v.firstName || ""} ${v.lastName || ""}`.trim()) : v) || "—";
const idOf = (v: any) => String(v?._id || v || "");
const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = { employee: "", effectiveDate: today(), reason: "", branchId: "", departmentId: "", reportingManager: "", designation: "", location: "" };

/** One line per field the transfer changes. */
const changesOf = (t: any) => {
    const out: string[] = [];
    if (t.to?.branchId) out.push(`Branch: ${nm(t.from?.branchId)} → ${nm(t.to.branchId)}`);
    if (t.to?.departmentId) out.push(`Department: ${nm(t.from?.departmentId) !== "—" ? nm(t.from?.departmentId) : (t.from?.department || "—")} → ${nm(t.to.departmentId)}`);
    if (t.to?.reportingManager) out.push(`Manager: ${nm(t.from?.reportingManager)} → ${nm(t.to.reportingManager)}`);
    if (t.to?.designation) out.push(`Designation: ${t.from?.designation || "—"} → ${t.to.designation}`);
    if (t.to?.location) out.push(`Location: ${t.from?.location || "—"} → ${t.to.location}`);
    return out;
};

export default function TransfersPage() {
    const confirm = useConfirm();
    const toast = useToast();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [employees, setEmployees] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = statusFilter ? `${API_ENDPOINTS.TRANSFERS}?status=${statusFilter}` : API_ENDPOINTS.TRANSFERS;
            const res = await axiosInstance.get(url);
            setItems(res.data.data || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not load transfers.");
        } finally { setLoading(false); }
    }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        Promise.allSettled([
            axiosInstance.get(API_ENDPOINTS.EMPLOYEES),
            axiosInstance.get(API_ENDPOINTS.BRANCHES),
            axiosInstance.get(API_ENDPOINTS.DEPARTMENTS),
            axiosInstance.get(`${API_ENDPOINTS.EMPLOYEES}/managers`),
        ]).then(([e, b, d, m]) => {
            if (e.status === "fulfilled") setEmployees((e.value.data.data || []).filter((x: any) => x.isActive !== false));
            if (b.status === "fulfilled") setBranches(b.value.data.data || []);
            if (d.status === "fulfilled") setDepartments(d.value.data.data || []);
            if (m.status === "fulfilled") setManagers(m.value.data.data || []);
        });
    }, []);

    const selected = useMemo(() => employees.find((e) => e._id === form.employee), [employees, form.employee]);
    const targetBranch = form.branchId || idOf(selected?.branchId);
    const deptOptions = departments.filter((d) => !targetBranch || !d.branchId || idOf(d.branchId) === targetBranch);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) { toast.error("Choose the employee."); return; }
        // Send only the fields that actually change.
        const body: any = { employee: form.employee, effectiveDate: form.effectiveDate, reason: form.reason || undefined };
        if (form.branchId && form.branchId !== idOf(selected.branchId)) body.branchId = form.branchId;
        if (form.departmentId && form.departmentId !== idOf(selected.departmentId)) body.departmentId = form.departmentId;
        if (form.reportingManager && form.reportingManager !== idOf(selected.reportingManager)) body.reportingManager = form.reportingManager;
        if (form.designation.trim() && form.designation.trim() !== (selected.designation || "")) body.designation = form.designation.trim();
        if (form.location.trim() && form.location.trim() !== (selected.location || "")) body.location = form.location.trim();
        if (Object.keys(body).length <= 3) { toast.error("Choose at least one thing to change."); return; }

        setBusy(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.TRANSFERS, body);
            toast.success("Transfer requested. Approve it to put it into effect.");
            setShowForm(false);
            setForm({ ...EMPTY_FORM });
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not create the transfer.");
        } finally { setBusy(false); }
    };

    const act = async (t: any, action: "approve" | "reject" | "cancel") => {
        const labels = {
            approve: { title: "Approve transfer?", description: new Date(t.effectiveDate) <= new Date() ? "It takes effect immediately." : `It takes effect on ${fmt(t.effectiveDate)}.`, confirmLabel: "Approve" },
            reject: { title: "Reject transfer?", description: "The employee's placement stays as it is.", confirmLabel: "Reject", danger: true },
            cancel: { title: "Cancel transfer?", description: "It will not be applied.", confirmLabel: "Cancel transfer", danger: true },
        };
        const ok = await confirm(labels[action]);
        if (!ok) return;
        try {
            const res = await axiosInstance.patch(`${API_ENDPOINTS.TRANSFERS}/${t._id}/${action}`, {});
            toast.success(action === "approve"
                ? (res.data.data?.status === "applied" ? "Transfer approved and applied." : "Transfer approved; it applies on the effective date.")
                : `Transfer ${action === "reject" ? "rejected" : "cancelled"}.`);
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Could not ${action} the transfer.`);
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Transfers</h1>
                    <p className="page-subtitle">Move employees between branches, departments, managers and roles, effective on a date.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}><FiPlus /> New transfer</button>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Transfer requests</h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <select className="form-input" style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved (scheduled)</option>
                            <option value="applied">Applied</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><FiRefreshCw /></button>
                    </div>
                </div>
                <div className="table-wrapper">
                    {loading ? <TableSkeleton rows={5} /> : (
                        <table>
                            <thead><tr><th>Employee</th><th>Changes</th><th>Effective</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {items.map((t) => (
                                    <tr key={t._id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{nm(t.employee)}</div>
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{t.employee?.employeeId}</div>
                                        </td>
                                        <td style={{ fontSize: "13px" }}>{changesOf(t).map((c) => <div key={c}>{c}</div>)}</td>
                                        <td>{fmt(t.effectiveDate)}</td>
                                        <td style={{ fontSize: "13px", maxWidth: "200px" }}>{t.reason || "—"}</td>
                                        <td>
                                            <span className={`badge ${STATUS_BADGE[t.status] || "pending"}`}>{t.status}</span>
                                            {t.applyError && <div style={{ fontSize: "11px", color: "var(--error)" }}>{t.applyError}</div>}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                {t.status === "pending" && (
                                                    <>
                                                        <button className="btn btn-primary btn-sm" onClick={() => act(t, "approve")} title="Approve"><FiCheck /></button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => act(t, "reject")} title="Reject" style={{ color: "var(--error)" }}><FiX /></button>
                                                    </>
                                                )}
                                                {["pending", "approved"].includes(t.status) && (
                                                    <button className="btn btn-secondary btn-sm" onClick={() => act(t, "cancel")} title="Cancel"><FiSlash /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr><td colSpan={6} style={{ padding: "60px 40px" }}>
                                        <EmptyState icon={FiShuffle} title="No transfers" description="Create a transfer to move an employee to another branch, department, manager or designation." actionLabel="New transfer" onAction={() => setShowForm(true)} />
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showForm && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                    <div className="card animate-in" style={{ width: "620px", maxWidth: "100%", maxHeight: "90vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>New transfer</h2>
                        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">Employee *</label>
                                <select className="form-input" value={form.employee} onChange={(e) => {
                                    const emp = employees.find((x) => x._id === e.target.value);
                                    setForm({
                                        ...EMPTY_FORM, employee: e.target.value, effectiveDate: form.effectiveDate, reason: form.reason,
                                        designation: emp?.designation || "", location: emp?.location || "",
                                    });
                                }}>
                                    <option value="">Select employee</option>
                                    {employees.map((e) => <option key={e._id} value={e._id}>{nm(e)}{e.employeeId ? ` (${e.employeeId})` : ""}</option>)}
                                </select>
                                {selected && (
                                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                                        Currently: {nm(branches.find((b) => b._id === idOf(selected.branchId))) !== "—" ? nm(branches.find((b) => b._id === idOf(selected.branchId))) : "no branch"}
                                        {" · "}{selected.department || "no department"}
                                        {" · reports to "}{nm(selected.reportingManager)}
                                    </div>
                                )}
                            </div>
                            <div className="grid-2">
                                <div>
                                    <label className="form-label">New branch</label>
                                    <select className="form-input" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value, departmentId: "" })}>
                                        <option value="">Unchanged</option>
                                        {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">New department</label>
                                    <select className="form-input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                                        <option value="">Unchanged</option>
                                        {deptOptions.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div>
                                    <label className="form-label">New reporting manager</label>
                                    <select className="form-input" value={form.reportingManager} onChange={(e) => setForm({ ...form, reportingManager: e.target.value })}>
                                        <option value="">Unchanged</option>
                                        {managers.filter((m) => m._id !== form.employee).map((m) => <option key={m._id} value={m._id}>{nm(m)} ({m.role})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Effective date *</label>
                                    <input required type="date" className="form-input" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div>
                                    <label className="form-label">Designation</label>
                                    <input className="form-input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Location</label>
                                    <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Reason</label>
                                <textarea className="form-input" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                The transfer is applied when approved if the effective date is today or earlier; otherwise it applies automatically on that date.
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={busy}>Create transfer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
