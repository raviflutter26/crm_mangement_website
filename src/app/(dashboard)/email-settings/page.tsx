"use client";

import { FiMail, FiInfo } from "react-icons/fi";

/**
 * What RIVO actually emails, and to whom.
 *
 * There is no per-organization notification preference store behind this page,
 * so it does not pretend to have one: no "Add New", no toggles that save nothing.
 * Keep this list in step with the backend's sendEmail callers when one is added.
 */
const EMAILS: { name: string; when: string; to: string }[] = [
    { name: "Account setup link", when: "An employee is added, an organization is created, or someone activates their account", to: "The new user" },
    { name: "Password reset link", when: "Someone uses \"Forgot password\"", to: "The account holder" },
    { name: "Welcome email", when: "An employee is added (unless the welcome email is switched off on the form)", to: "The new employee" },
    { name: "Leave request", when: "An employee applies for leave", to: "Their approver" },
    { name: "Leave approved / rejected", when: "A leave request is decided", to: "The employee" },
    { name: "Expense claim submitted", when: "An employee submits an expense claim", to: "HR and the reporting manager" },
    { name: "Salary credited", when: "A salary payout succeeds", to: "The employee" },
    { name: "Payout failed", when: "A salary payout fails", to: "HR" },
];

export default function EmailSettingsPage() {
    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Email & Notifications</h1>
                    <p className="page-subtitle">The emails RIVO sends on your organization&apos;s behalf.</p>
                </div>
            </div>

            <div className="card" style={{ padding: "16px 20px", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "flex-start", color: "var(--text-secondary)", fontSize: "13px" }}>
                <FiInfo style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>
                    These emails are always on. Per-organization templates and on/off preferences are not available yet.
                    Delivery depends on the platform&apos;s email service being configured; if emails are not arriving, contact RIVO support.
                </span>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><FiMail /> Emails sent</h3>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Sent when</th>
                                <th>Recipient</th>
                            </tr>
                        </thead>
                        <tbody>
                            {EMAILS.map(e => (
                                <tr key={e.name}>
                                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                                    <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{e.when}</td>
                                    <td style={{ fontSize: "13px" }}>{e.to}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
