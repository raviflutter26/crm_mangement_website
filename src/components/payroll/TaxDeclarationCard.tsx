"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";
import { FiCheckCircle, FiDownload, FiSave } from "react-icons/fi";

const fyOf = (d: Date) => {
    const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
};
const previousFY = (fy: string) => {
    const y = parseInt(fy.slice(0, 4), 10) - 1;
    return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
};

const EMPTY = { section80C: 0, section80D: 0, otherChapterVIA: 0, rentPaidAnnual: 0, metroCity: false, hraExemption: 0 };

/**
 * The employee's own income-tax declaration for a financial year. Amounts
 * only reduce TDS under the old regime; the regime chosen here applies to
 * the whole FY. Once HR verifies it, it is read-only.
 */
export default function TaxDeclarationCard({ userId }: { userId?: string }) {
    const toast = useToast();
    const [fy, setFy] = useState(fyOf(new Date()));
    const [regime, setRegime] = useState<"" | "new" | "old">("");
    const [sections, setSections] = useState<typeof EMPTY>(EMPTY);
    const [status, setStatus] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.TAX_DECLARATIONS, { params: { financialYear: fy } });
            const d = (res.data.data || [])[0];
            setRegime(d?.regime || "");
            setSections({ ...EMPTY, ...(d?.sections || {}) });
            setStatus(d?.status || null);
        } catch {
            setStatus(null);
        }
    }, [fy]);

    useEffect(() => { load(); }, [load]);

    const verified = status === "verified";
    const num = (k: keyof typeof EMPTY) => (
        <input type="number" min={0} className="form-input" disabled={verified}
            value={Number(sections[k]) || 0}
            onChange={e => setSections({ ...sections, [k]: Number(e.target.value) })} />
    );

    const submit = async () => {
        setSaving(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.TAX_DECLARATIONS_MY, { financialYear: fy, regime: regime || null, sections });
            toast.success("Declaration submitted — it will be used for your TDS from the next payroll run");
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Could not submit the declaration");
        } finally { setSaving(false); }
    };

    const downloadForm16 = async (year: string) => {
        if (!userId) return;
        setDownloading(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.FORM16(userId), { params: { fy: year }, responseType: "blob" });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Form16_PartB_${year}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            const code = err?.response?.status;
            toast.error(code === 404 ? `No payroll for FY ${year} yet` : code === 503 ? "Form 16 PDF isn't available right now" : "Could not download Form 16");
        } finally { setDownloading(false); }
    };

    const label = { display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700 } as const;

    return (
        <div className="card" style={{ border: "1px solid var(--border-light)", padding: 0, background: "white", marginBottom: 24 }}>
            <div style={{ padding: 24, borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Investment Declaration</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Used to compute your monthly TDS. Deductions apply under the old regime only.</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <select className="form-input" value={fy} onChange={e => setFy(e.target.value)} style={{ width: 120 }}>
                        {[fyOf(new Date()), previousFY(fyOf(new Date()))].map(f => <option key={f}>{f}</option>)}
                    </select>
                    {status && (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 6, background: verified ? "#ecfdf5" : "#fffbeb", color: verified ? "#10b981" : "#f59e0b" }}>
                            {verified ? <><FiCheckCircle /> VERIFIED</> : "SUBMITTED"}
                        </span>
                    )}
                </div>
            </div>
            <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div>
                    <label style={label}>Tax regime for FY {fy}</label>
                    <select className="form-input" disabled={verified} value={regime} onChange={e => setRegime(e.target.value as any)}>
                        <option value="">As on my profile</option>
                        <option value="new">New regime (default)</option>
                        <option value="old">Old regime</option>
                    </select>
                </div>
                <div><label style={label}>80C (PPF, ELSS, LIC…) ₹</label>{num("section80C")}</div>
                <div><label style={label}>80D (health insurance) ₹</label>{num("section80D")}</div>
                <div><label style={label}>Other Chapter VI-A ₹</label>{num("otherChapterVIA")}</div>
                <div><label style={label}>Rent paid in the year ₹</label>{num("rentPaidAnnual")}</div>
                <div>
                    <label style={label}>Rented home in a metro?</label>
                    <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, paddingTop: 8 }}>
                        <input type="checkbox" disabled={verified} checked={Boolean(sections.metroCity)} onChange={e => setSections({ ...sections, metroCity: e.target.checked })} />
                        Delhi, Mumbai, Kolkata or Chennai
                    </label>
                </div>
            </div>
            <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <button className="btn btn-secondary" onClick={() => downloadForm16(previousFY(fyOf(new Date())))} disabled={downloading || !userId}>
                    <FiDownload /> {downloading ? "Preparing…" : `Form 16 Part B (FY ${previousFY(fyOf(new Date()))})`}
                </button>
                {!verified && (
                    <button className="btn btn-primary" onClick={submit} disabled={saving}>
                        <FiSave /> {saving ? "Submitting…" : "Submit declaration"}
                    </button>
                )}
            </div>
        </div>
    );
}
