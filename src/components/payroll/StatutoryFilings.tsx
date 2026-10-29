"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/components/common/DialogProvider";
import { FiDownload, FiInfo } from "react-icons/fi";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const fyOf = (d: Date) => {
    const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
};
const recentFYs = () => {
    const start = parseInt(fyOf(new Date()).slice(0, 4), 10);
    return Array.from({ length: 5 }).map((_, i) => `${start - i}-${String((start - i + 1) % 100).padStart(2, "0")}`);
};

/** Save a response body as a file, using the server's filename when it sent one. */
const saveBlob = (data: Blob, headers: any, fallback: string) => {
    const cd: string = headers?.["content-disposition"] || "";
    const name = /filename="([^"]+)"/.exec(cd)?.[1] || fallback;
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/** A blob error body is JSON text; surface its message. */
const blobErrorMessage = async (e: any, fallback: string) => {
    try {
        const text = await e?.response?.data?.text?.();
        return JSON.parse(text).message || fallback;
    } catch { return e?.response?.data?.message || fallback; }
};

type Props = {
    period: { month: number; year: number };
    employees: { _id: string; name: string; employeeId?: string }[];
    /** Optional branch filter. Filings are per company by default (one PF/ESI establishment). */
    branchId?: string;
};

/**
 * Portal-format statutory files: EPFO ECR, ESIC, PT summary, Form 24Q
 * annexure and Form 16 Part B.
 */
export default function StatutoryFilings({ period, employees, branchId }: Props) {
    const toast = useToast();
    const [busy, setBusy] = useState<string | null>(null);
    const [fy, setFy] = useState(fyOf(new Date()));
    const [quarter, setQuarter] = useState("Q1");
    const [form16Employee, setForm16Employee] = useState("");

    const download = async (key: string, url: string, params: any, fallback: string, after?: (headers: any) => void) => {
        setBusy(key);
        try {
            const res = await axiosInstance.get(url, { params, responseType: "blob" });
            saveBlob(res.data, res.headers, fallback);
            after?.(res.headers);
        } catch (e: any) {
            toast.error(await blobErrorMessage(e, "Download failed"));
        } finally { setBusy(null); }
    };

    const b = branchId ? { branchId } : {};
    const p = { month: period.month, year: period.year, ...b };
    const tag = `${period.year}_${String(period.month).padStart(2, "0")}`;
    const card = { border: "1px solid #E2E8F0", padding: 20, borderRadius: 16, display: "flex", flexDirection: "column" as const, gap: 10 };
    const title = { fontWeight: 700, fontSize: 15, color: "#1E293B" };
    const desc = { fontSize: 12, color: "#64748B", flex: 1 };

    return (
        <div style={{ marginTop: 28 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1E1B4B", marginBottom: 4 }}>Portal filing files</div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
                Monthly files use the period above ({MONTHS[period.month - 1]} {period.year}){branchId ? " for the selected branch" : ", for the whole company"}. The PT summary is grouped by state.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                <div style={card}>
                    <div style={title}>EPFO ECR 2.0</div>
                    <div style={desc}>#~# separated text file for the EPFO unified portal. Members without a UAN are left out and listed after download.</div>
                    <button className="btn btn-primary" disabled={busy === "ecr"} onClick={() => download("ecr", API_ENDPOINTS.STATUTORY_FILING("ecr"), p, `ECR_${tag}.txt`, (h) => {
                        const n = Number(h?.["x-ecr-skipped-count"] || 0);
                        if (n > 0) {
                            let ids: string[] = [];
                            try { ids = JSON.parse(decodeURIComponent(h["x-ecr-skipped"])); } catch { /* header not exposed */ }
                            toast.error(`${n} member(s) skipped for missing UAN${ids.length ? `: ${ids.join(", ")}` : ""}`);
                        }
                    })}>
                        <FiDownload /> {busy === "ecr" ? "Generating…" : "Download ECR (.txt)"}
                    </button>
                </div>
                <div style={card}>
                    <div style={title}>ESIC contribution</div>
                    <div style={desc}>IP number, days, wages, reason code — ESI-covered employees only (wages ≤ ₹21,000). Opens in Excel.</div>
                    <button className="btn btn-primary" style={{ background: "#10B981", border: "none" }} disabled={busy === "esic"} onClick={() => download("esic", API_ENDPOINTS.STATUTORY_FILING("esic"), p, `ESIC_${tag}.csv`)}>
                        <FiDownload /> {busy === "esic" ? "Generating…" : "Download ESIC (.csv)"}
                    </button>
                </div>
                <div style={card}>
                    <div style={title}>Professional Tax summary</div>
                    <div style={desc}>Employees and PT per state slab for the month, with totals.</div>
                    <button className="btn btn-primary" style={{ background: "#0EA5E9", border: "none" }} disabled={busy === "pt"} onClick={() => download("pt", API_ENDPOINTS.STATUTORY_FILING("pt"), p, `PT_${tag}.csv`)}>
                        <FiDownload /> {busy === "pt" ? "Generating…" : "Download PT (.csv)"}
                    </button>
                </div>
                <div style={card}>
                    <div style={title}>Form 24Q annexure</div>
                    <div style={desc}>Deductee details (PAN, amount paid, TDS, dates) for the quarter.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <select className="form-input" value={fy} onChange={e => setFy(e.target.value)}>{recentFYs().map(f => <option key={f}>{f}</option>)}</select>
                        <select className="form-input" style={{ width: 80 }} value={quarter} onChange={e => setQuarter(e.target.value)}>{["Q1", "Q2", "Q3", "Q4"].map(q => <option key={q}>{q}</option>)}</select>
                    </div>
                    <div style={{ fontSize: 11, color: "#92400E", background: "#FEF3C7", borderRadius: 8, padding: "6px 8px", display: "flex", gap: 6 }}>
                        <FiInfo style={{ flexShrink: 0, marginTop: 2 }} /> Import this into the NSDL Return Preparation Utility; the FVU file must be generated with NSDL&apos;s File Validation Utility.
                    </div>
                    <button className="btn btn-primary" style={{ background: "#F59E0B", border: "none" }} disabled={busy === "24q"} onClick={() => download("24q", API_ENDPOINTS.STATUTORY_FILING("form24q"), { fy, quarter, ...b }, `Form24Q_${fy}_${quarter}.csv`)}>
                        <FiDownload /> {busy === "24q" ? "Generating…" : "Download 24Q (.csv)"}
                    </button>
                </div>
                <div style={card}>
                    <div style={title}>Form 16 — Part B</div>
                    <div style={desc}>Salary, exemptions, deductions and tax for the FY, per employee. Part A comes from TRACES.</div>
                    <select className="form-input" value={form16Employee} onChange={e => setForm16Employee(e.target.value)}>
                        <option value="">Select employee…</option>
                        {employees.map(e => <option key={e._id} value={e._id}>{e.name}{e.employeeId ? ` (${e.employeeId})` : ""}</option>)}
                    </select>
                    <select className="form-input" value={fy} onChange={e => setFy(e.target.value)}>{recentFYs().map(f => <option key={f}>{f}</option>)}</select>
                    <button className="btn btn-primary" style={{ background: "#8B5CF6", border: "none" }} disabled={!form16Employee || busy === "f16"} onClick={() => download("f16", API_ENDPOINTS.FORM16(form16Employee), { fy }, `Form16_PartB_${fy}.pdf`)}>
                        <FiDownload /> {busy === "f16" ? "Generating…" : "Download Form 16 (PDF)"}
                    </button>
                </div>
            </div>
        </div>
    );
}
