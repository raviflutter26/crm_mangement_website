"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiLogOut, FiFileText, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useConfirm, useToast } from "@/components/common/DialogProvider";

const STATUS_BADGE: Record<string, string> = {
    pending: "pending", approved: "processing", settled: "active", rejected: "inactive", withdrawn: "inactive",
};
const STATUS_LABEL: Record<string, string> = {
    pending: "Awaiting approval", approved: "Approved — serving notice", settled: "Settled", rejected: "Rejected", withdrawn: "Withdrawn",
};

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—");
const inr = (n?: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function ResignationPage() {
    const confirm = useConfirm();
    const toast = useToast();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ reason: "", proposedLastWorkingDay: "", remarks: "" });

    const load = async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.SEPARATIONS_MY);
            setItems(res.data.data || []);
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const open = items.find((s) => ["pending", "approved"].includes(s.status));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.reason.trim()) { toast.error("Please give a reason."); return; }
        const ok = await confirm({
            title: "Submit resignation?",
            description: "Your manager and HR will be notified. You can withdraw it while it is still awaiting approval.",
            confirmLabel: "Submit", danger: true,
        });
        if (!ok) return;
        setSubmitting(true);
        try {
            const payload: any = { reason: form.reason.trim(), remarks: form.remarks || undefined };
            if (form.proposedLastWorkingDay) payload.proposedLastWorkingDay = form.proposedLastWorkingDay;
            await axiosInstance.post(API_ENDPOINTS.SEPARATIONS, payload);
            toast.success("Resignation submitted.");
            setForm({ reason: "", proposedLastWorkingDay: "", remarks: "" });
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not submit your resignation.");
        } finally { setSubmitting(false); }
    };

    const withdraw = async (id: string) => {
        const ok = await confirm({ title: "Withdraw resignation?", description: "Your resignation will be cancelled.", confirmLabel: "Withdraw" });
        if (!ok) return;
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.SEPARATIONS}/${id}/withdraw`);
            toast.success("Resignation withdrawn.");
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not withdraw.");
        }
    };

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)" }}>
            <div className="page-header" style={{ marginBottom: "24px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <Link href="/dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                        <h1 className="page-title" style={{ margin: 0 }}>Resignation</h1>
                    </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Submit your resignation and follow it through approval, exit formalities and full &amp; final settlement.</p>
                </div>
            </div>

            {!loading && !open && (
                <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
                    <h3 style={{ marginBottom: "6px", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}><FiLogOut /> Submit resignation</h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                        Your notice period is set by your organization (30 days unless your company or contract says otherwise). If you leave it blank,
                        your proposed last working day is the end of your notice period. Leaving earlier may be recovered from your full &amp; final settlement unless HR waives it.
                    </p>
                    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label className="form-label">Reason *</label>
                            <textarea className="form-input" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why are you leaving?" style={{ resize: "vertical" }} />
                        </div>
                        <div>
                            <label className="form-label">Proposed last working day</label>
                            <input type="date" className="form-input" value={form.proposedLastWorkingDay} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, proposedLastWorkingDay: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">Remarks</label>
                            <input className="form-input" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
                        </div>
                        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Submitting..." : "Submit resignation"}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: "24px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: 700 }}>My exit requests</h3>
                {loading ? <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div> : items.length === 0 ? (
                    <EmptyState icon={FiFileText} title="No resignation on record" description="Anything you submit will appear here with its status." />
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {items.map((s) => (
                            <div key={s._id} style={{ padding: "20px", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--bg-secondary)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                                        {s.status === "settled" ? <FiCheckCircle color="var(--success)" /> : ["rejected", "withdrawn"].includes(s.status) ? <FiXCircle color="var(--error)" /> : <FiClock color="var(--primary)" />}
                                        {s.type === "termination" ? "Termination" : "Resignation"} submitted {fmt(s.submittedAt)}
                                    </div>
                                    <span className={`badge ${STATUS_BADGE[s.status] || "pending"}`}>{STATUS_LABEL[s.status] || s.status}</span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", fontSize: "14px" }}>
                                    <div><div className="form-label">Proposed last day</div>{fmt(s.proposedLastWorkingDay)}</div>
                                    <div><div className="form-label">Approved last day</div>{fmt(s.lastWorkingDay)}</div>
                                    <div><div className="form-label">Notice period</div>{s.noticePeriodDays} days</div>
                                    <div>
                                        <div className="form-label">Notice shortfall</div>
                                        {s.noticeShortfallDays > 0 ? `${s.noticeShortfallDays} days${s.shortfallWaived ? " (waived)" : ""}` : "None"}
                                    </div>
                                    {s.status === "settled" && (
                                        <div><div className="form-label">Net F&amp;F payable</div><strong>{inr(s.fnf?.netPayable)}</strong></div>
                                    )}
                                </div>
                                {s.reason && <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "12px" }}>Reason: {s.reason}</div>}
                                {s.approverRemarks && <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Approver note: {s.approverRemarks}</div>}
                                <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
                                    {s.status === "pending" && s.type === "resignation" && (
                                        <button className="btn btn-secondary btn-sm" onClick={() => withdraw(s._id)}>Withdraw</button>
                                    )}
                                    {["approved", "settled"].includes(s.status) && (
                                        <Link className="btn btn-secondary btn-sm" href={`/me/resignation/letter?id=${s._id}&type=exit`}>
                                            {s.type === "termination" ? "Termination letter" : "Acceptance letter"}
                                        </Link>
                                    )}
                                    {s.status === "settled" && (
                                        <Link className="btn btn-primary btn-sm" href={`/me/resignation/letter?id=${s._id}&type=relieving`}>Relieving letter</Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
