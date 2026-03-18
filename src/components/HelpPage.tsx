"use client";

import { useState } from "react";
import { FiBookOpen, FiMessageCircle, FiVideo, FiExternalLink, FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi";

interface HelpPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function HelpPage({ showNotify }: HelpPageProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [openFaq, setOpenFaq] = useState<number | null>(0); // Initialize first FAQ open
    const [dialogState, setDialogState] = useState({ show: false, message: "" });
    const [supportMsg, setSupportMsg] = useState("");

    const faqs = [
        { q: "How do I run payroll for a new employee?", a: "To run payroll, navigate to the Payroll tab from the sidebar. Click the 'Run Payroll' button in the top right. Select your employee, enter their gross and tax variables, and the system automatically calculates net pay and inserts the record." },
        { q: "Can I export payroll records to my bank?", a: "Yes. From the Payroll page, apply any necessary Date filters if you'd like to restrict the batch, then click 'Export Bank Format' to download a clean CSV ledger." },
        { q: "How do employees apply for leaves?", a: "You or your employees can track leaves via the Leave Management module. Click 'Apply Leave', fill in the duration, and its status will queue as 'Pending' until you Approve or Reject it." },
        { q: "What does Zoho Sync do?", a: "The Zoho Sync engine securely transmits your processed payroll, employee states, and leave approvals bidirectionally with your master Zoho People credentials." }
    ];

    const handleSendMessage = (e: any) => {
        e.preventDefault();
        setDialogState({ show: true, message: "Support ticket submitted. We'll be in touch!" });
        setSupportMsg("");
        setTimeout(() => setDialogState({ show: false, message: "" }), 3000);
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Help & Support</h1>
                    <p className="page-subtitle">Resources and guidance for your HR system</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

                {/* Left Column: FAQs */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    <div className="card" style={{ padding: "20px" }}>
                        <h3 className="card-title" style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <FiSearch /> Quick Answers
                        </h3>
                        <div style={{ position: "relative", marginBottom: "20px" }}>
                            <FiSearch style={{ position: "absolute", left: "15px", top: "12px", color: "var(--text-muted)" }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search our knowledge base..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: "40px" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())).map((faq, index) => (
                                <div key={index} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
                                    <button
                                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        style={{
                                            width: "100%", padding: "15px", background: "var(--bg-secondary)",
                                            border: "none", display: "flex", justifyContent: "space-between",
                                            alignItems: "center", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer"
                                        }}
                                    >
                                        {faq.q}
                                        {openFaq === index ? <FiChevronUp /> : <FiChevronDown />}
                                    </button>
                                    {openFaq === index && (
                                        <div style={{ padding: "15px", background: "var(--bg-primary)", color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6" }}>
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: "20px" }}>
                        <h3 className="card-title" style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <FiBookOpen /> Interactive Guides
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <button className="btn btn-secondary" style={{ justifyContent: "flex-start" }}><FiVideo /> Watch Payroll Tutorial</button>
                            <button className="btn btn-secondary" style={{ justifyContent: "flex-start" }}><FiExternalLink /> View API Documentation</button>
                            <button className="btn btn-secondary" style={{ justifyContent: "flex-start" }}><FiExternalLink /> Read Admin Handbook</button>
                        </div>
                    </div>

                </div>

                {/* Right Column: Contact Support */}
                <div className="card" style={{ padding: "25px", height: "fit-content" }}>
                    <h3 className="card-title" style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ padding: "8px", background: "var(--primary)", color: "white", borderRadius: "8px", display: "flex" }}>
                            <FiMessageCircle />
                        </div>
                        Contact Technical Support
                    </h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
                        Can't find what you're looking for? Send us a direct message and our operations team will assist you within 24 hours.
                    </p>

                    <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Subject</label>
                            <select className="form-input">
                                <option>General Inquiry</option>
                                <option>Bug Report</option>
                                <option>Zoho Sync Issue</option>
                                <option>Feature Request</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Detailed Description</label>
                            <textarea
                                className="form-input"
                                rows={6}
                                value={supportMsg}
                                onChange={e => setSupportMsg(e.target.value)}
                                placeholder="Please provide specific details..."
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ justifyContent: "center" }}>
                            Send Message
                        </button>
                    </form>
                </div>

            </div>

            {/* Quick Success Toast */}
            {dialogState.show && (
                <div style={{
                    position: "fixed", bottom: "20px", right: "20px",
                    background: "rgba(34, 197, 94, 0.9)", color: "white",
                    padding: "12px 20px", borderRadius: "8px", zIndex: 3000,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px",
                    fontWeight: 600, animation: "fadeIn 0.3s ease-out"
                }}>
                    <FiMessageCircle size={20} /> {dialogState.message}
                </div>
            )}
        </>
    );
}

