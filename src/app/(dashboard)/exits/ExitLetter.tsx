"use client";

/**
 * Printable exit letters, rendered from GET /api/separations/:id.
 *
 *   type=exit       resignation acceptance (or termination notice), once approved
 *   type=relieving  relieving letter, once the F&F is settled
 *
 * Used by both the HR view (/exits/letter) and the employee's own view
 * (/me/resignation/letter); the API decides who may read which record.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiPrinter } from "react-icons/fi";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

const fmt = (d?: string | Date | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "—";

export default function ExitLetter() {
    const params = useSearchParams();
    const id = params.get("id") || "";
    const type = params.get("type") === "relieving" ? "relieving" : "exit";
    const [sep, setSep] = useState<any>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) { setError("No exit record was named."); return; }
        axiosInstance.get(`${API_ENDPOINTS.SEPARATIONS}/${id}`)
            .then((res) => setSep(res.data.data))
            .catch((err) => setError(err.response?.data?.message || "Could not load this exit record."));
    }, [id]);

    if (error) return <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>{error}</div>;
    if (!sep) return <div style={{ padding: "40px", textAlign: "center" }}>Loading letter...</div>;

    const emp = sep.employee || {};
    const org = sep.organizationId && typeof sep.organizationId === "object" ? sep.organizationId : {};
    const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
    const signatory = sep.settledBy || sep.approvedBy;
    const signatoryName = signatory ? `${signatory.firstName || ""} ${signatory.lastName || ""}`.trim() : "Authorised Signatory";
    const isTermination = sep.type === "termination";

    const notReady =
        type === "relieving" ? sep.status !== "settled" : !["approved", "settled"].includes(sep.status);

    const address = org.address ? [org.address.street, org.address.city, org.address.state, org.address.pincode].filter(Boolean).join(", ") : "";

    return (
        <div>
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", maxWidth: "800px", margin: "0 auto 20px" }}>
                <h1 className="page-title" style={{ margin: 0 }}>{type === "relieving" ? "Relieving Letter" : isTermination ? "Termination Letter" : "Resignation Acceptance"}</h1>
                <button className="btn btn-primary" onClick={() => window.print()} disabled={notReady}><FiPrinter /> Print</button>
            </div>

            {notReady ? (
                <div className="card no-print" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", maxWidth: "800px", margin: "0 auto" }}>
                    {type === "relieving"
                        ? "The relieving letter is available once the full & final settlement is complete."
                        : "This letter is available once the exit has been approved."}
                </div>
            ) : (
                <div className="print-letter" style={{ background: "white", color: "#111827", maxWidth: "800px", margin: "0 auto", padding: "56px 64px", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "15px", lineHeight: 1.7 }}>
                    <div style={{ borderBottom: "2px solid #111827", paddingBottom: "12px", marginBottom: "28px" }}>
                        <div style={{ fontSize: "22px", fontWeight: 700 }}>{org.name || "Company"}</div>
                        {address && <div style={{ fontSize: "12px", color: "#4b5563" }}>{address}</div>}
                        {(org.email || org.phone) && <div style={{ fontSize: "12px", color: "#4b5563" }}>{[org.email, org.phone].filter(Boolean).join(" · ")}</div>}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                        <div>Date: {fmt(type === "relieving" ? sep.settledAt : sep.approvedAt)}</div>
                        <div>Ref: {(emp.employeeId || "").toString()}/{String(sep._id).slice(-6).toUpperCase()}</div>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <div>To,</div>
                        <div style={{ fontWeight: 700 }}>{name}</div>
                        {emp.designation && <div>{emp.designation}</div>}
                        {emp.employeeId && <div>Employee ID: {emp.employeeId}</div>}
                    </div>

                    {type === "relieving" ? (
                        <>
                            <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: "16px" }}>Subject: Relieving Letter</div>
                            <p>Dear {emp.firstName || name},</p>
                            <p>
                                This is to certify that {name}{emp.employeeId ? ` (Employee ID ${emp.employeeId})` : ""} was employed with {org.name || "the company"}
                                {emp.designation ? ` as ${emp.designation}` : ""} from {fmt(emp.dateOfJoining)} to {fmt(sep.lastWorkingDay)}.
                            </p>
                            <p>
                                {isTermination
                                    ? `You are relieved of your duties with effect from the close of business on ${fmt(sep.lastWorkingDay)}.`
                                    : `Your resignation has been accepted and you are relieved of your duties with effect from the close of business on ${fmt(sep.lastWorkingDay)}.`}
                                {" "}Your full and final settlement has been processed and you have no further obligations to the company, save those under any confidentiality agreement you have signed.
                            </p>
                            <p>We thank you for your contribution and wish you every success in the future.</p>
                        </>
                    ) : isTermination ? (
                        <>
                            <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: "16px" }}>Subject: Termination of Employment</div>
                            <p>Dear {emp.firstName || name},</p>
                            <p>This is to inform you that your employment with {org.name || "the company"} is terminated, with your last working day being {fmt(sep.lastWorkingDay)}.</p>
                            {sep.reason && <p>Reason: {sep.reason}</p>}
                            <p>Please return all company property in your possession and complete the exit formalities with HR. Your full and final settlement will be processed as per company policy.</p>
                        </>
                    ) : (
                        <>
                            <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: "16px" }}>Subject: Acceptance of Resignation</div>
                            <p>Dear {emp.firstName || name},</p>
                            <p>
                                We acknowledge receipt of your resignation dated {fmt(sep.submittedAt)}. Your resignation has been accepted, and your last working day with
                                {" "}{org.name || "the company"} will be {fmt(sep.lastWorkingDay)}.
                            </p>
                            {sep.noticeShortfallDays > 0 && (
                                <p>
                                    This is {sep.noticeShortfallDays} day(s) short of your {sep.noticePeriodDays}-day notice period
                                    {sep.shortfallWaived ? "; the shortfall has been waived." : "; the shortfall will be adjusted in your full and final settlement."}
                                </p>
                            )}
                            <p>Please complete the hand-over of your responsibilities and return all company property before your last working day.</p>
                        </>
                    )}

                    <div style={{ marginTop: "56px" }}>
                        <div>For {org.name || "the company"},</div>
                        <div style={{ marginTop: "48px", fontWeight: 700 }}>{signatoryName}</div>
                        <div style={{ fontSize: "13px", color: "#4b5563" }}>{signatory?.designation || "Human Resources"}</div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    .no-print, .sidebar, aside, nav, header { display: none !important; }
                    .main-content { margin: 0 !important; padding: 0 !important; }
                    .print-letter { border: none !important; padding: 0 !important; max-width: none !important; }
                }
            `}</style>
        </div>
    );
}
