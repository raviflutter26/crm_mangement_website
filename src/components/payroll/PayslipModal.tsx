"use client";

import { FiDownload, FiPrinter } from "react-icons/fi";
import { useState } from "react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmt = (n: any) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface PayslipModalProps {
    data: any;
    onClose: () => void;
    companyName?: string;
}

export default function PayslipModal({ data, onClose, companyName = "Solar Operations Pvt. Ltd." }: PayslipModalProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    if (!data) return null;
    const emp = data.employee || {};
    const month = MONTHS[(data.month || 1) - 1];
    const year = data.year || new Date().getFullYear();

    const earnings = [
        { label: "Basic Salary",        value: data.earnings?.basic },
        { label: "HRA",                 value: data.earnings?.hra },
        { label: "Dearness Allowance",  value: data.earnings?.da },
        { label: "Transport Allowance", value: data.earnings?.ta },
        { label: "Special Allowance",   value: data.earnings?.specialAllowance },
        { label: "Medical Allowance",   value: data.earnings?.medical },
        { label: "Performance Bonus",   value: data.earnings?.bonus },
        { label: "Overtime Pay",        value: data.earnings?.overtime },
    ].filter(r => r.value);

    const deductions = [
        { label: "Provident Fund (PF)",      value: data.deductions?.pf },
        { label: "ESI",                      value: data.deductions?.esi },
        { label: "Professional Tax",         value: data.deductions?.professionalTax },
        { label: "TDS",                      value: data.deductions?.tax },
        { label: "Loan Deduction",           value: data.deductions?.loanDeduction },
        { label: "Other Deductions",         value: data.deductions?.others },
    ].filter(r => r.value);

    const handlePrint = () => {
        const printContent = document.getElementById("payslip-print-area")?.innerHTML;
        if (!printContent) return;
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.write(`<!DOCTYPE html><html><head><title>Payslip</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #1E293B; }
            .slip-header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 24px 32px; }
            .slip-header h2 { font-size: 22px; font-weight: 800; }
            .slip-header p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
            .slip-body { padding: 24px 32px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-bottom: 20px; padding: 16px; background: #F8FAFC; border-radius: 8px; }
            .info-item label { font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-item div { font-size: 13px; font-weight: 700; margin-top: 2px; }
            .earn-ded { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #F1F5F9; padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; }
            td { padding: 7px 12px; border-bottom: 1px solid #F1F5F9; font-size: 12px; }
            td:last-child { text-align: right; font-family: monospace; font-weight: 600; }
            .total-row { background: #F8FAFC; font-weight: 800; }
            .net-pay { text-align: center; background: #EEF2FF; border-radius: 8px; padding: 16px; margin-top: 16px; }
            .net-pay .amount { font-size: 28px; font-weight: 900; color: #4F46E5; font-family: monospace; }
            .net-pay .label { font-size: 12px; color: #64748B; margin-bottom: 6px; }
            .footer { text-align: center; font-size: 11px; color: #94A3B8; padding: 16px; border-top: 1px solid #F1F5F9; margin-top: 16px; }
        </style></head><body>${printContent}</body></html>`);
        w.document.close();
        w.print();
    };

    const handleDownload = async () => {
        const el = document.getElementById("payslip-print-area");
        if (!el) return;
        
        setIsDownloading(true);
        try {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
            <div style="font-family: Arial, sans-serif; font-size: 13px; color: #1E293B; padding: 20px;">
                ${el.innerHTML}
            </div>`;
            
            const style = document.createElement('style');
            style.innerHTML = `
                .slip-header { background: linear-gradient(135deg, #4F46E5, #7C3AED) !important; color: white !important; padding: 24px 32px !important; }
                .slip-header h2 { font-size: 22px; font-weight: 800; }
                .slip-header p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
                .slip-body { padding: 24px 32px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-bottom: 20px; padding: 16px; background: #F8FAFC !important; border-radius: 8px; }
                .info-item label { font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                .info-item div { font-size: 13px; font-weight: 700; margin-top: 2px; }
                .earn-ded { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #F1F5F9 !important; padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; }
                td { padding: 7px 12px; border-bottom: 1px solid #F1F5F9; font-size: 12px; }
                td:last-child { text-align: right; font-family: monospace; font-weight: 600; }
                .total-row { background: #F8FAFC !important; font-weight: 800; }
                .net-pay { text-align: center; background: #EEF2FF !important; border-radius: 8px; padding: 16px; margin-top: 16px; }
                .net-pay .amount { font-size: 28px; font-weight: 900; color: #4F46E5; font-family: monospace; }
                .net-pay .label { font-size: 12px; color: #64748B; margin-bottom: 6px; }
                .footer { text-align: center; font-size: 11px; color: #94A3B8; padding: 16px; border-top: 1px solid #F1F5F9; margin-top: 16px; }
            `;
            wrapper.appendChild(style);
            
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin:       10,
                filename:     `Payslip_${emp.employeeId || "EMP"}_${month}_${year}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            } as const;

            await html2pdf().set(opt).from(wrapper).save();
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Failed to generate PDF. Please try using the Print button.");
        } finally {
            setIsDownloading(false);
        }
    };

    const printHTML = `
    <div class="slip-header">
        <h2>${companyName}</h2>
        <p>Salary Slip for the month of ${month} ${year}</p>
    </div>
    <div class="slip-body">
        <div class="info-grid">
            <div class="info-item"><label>Employee Name</label><div>${emp.firstName || ""} ${emp.lastName || ""}</div></div>
            <div class="info-item"><label>Employee ID</label><div>${emp.employeeId || "—"}</div></div>
            <div class="info-item"><label>Department</label><div>${emp.department || "—"}</div></div>
            <div class="info-item"><label>Designation</label><div>${emp.designation || "—"}</div></div>
            <div class="info-item"><label>Pay Period</label><div>${month} ${year}</div></div>
            <div class="info-item"><label>Days Worked</label><div>${data.presentDays || 0} / ${data.workingDays || 26}</div></div>
            ${emp.uan ? `<div class="info-item"><label>UAN (PF)</label><div>${emp.uan}</div></div>` : ""}
            ${emp.esic ? `<div class="info-item"><label>ESIC No.</label><div>${emp.esic}</div></div>` : ""}
        </div>
        <div class="earn-ded">
            <div>
                <table>
                    <thead><tr><th colspan="2">💰 Earnings</th></tr></thead>
                    <tbody>
                        ${earnings.map(r => `<tr><td>${r.label}</td><td>${fmt(r.value)}</td></tr>`).join("")}
                        <tr class="total-row"><td>Total Earnings</td><td>${fmt(data.totalEarnings)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div>
                <table>
                    <thead><tr><th colspan="2">📉 Deductions</th></tr></thead>
                    <tbody>
                        ${deductions.map(r => `<tr><td>${r.label}</td><td>${fmt(r.value)}</td></tr>`).join("")}
                        <tr class="total-row"><td>Total Deductions</td><td>${fmt(data.totalDeductions)}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="net-pay">
            <div class="label">NET PAY (Take Home)</div>
            <div class="amount">${fmt(data.netPay)}</div>
        </div>
        <div class="footer">This is a computer-generated payslip. No signature required. | Generated on ${new Date().toLocaleDateString("en-IN")}</div>
    </div>`;

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}>
            <div style={{ background: "#fff", borderRadius: 20, width: "min(700px, 100%)", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", padding: "24px 28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px" }}>{companyName}</div>
                            <div style={{ opacity: 0.85, fontSize: 13, marginTop: 4 }}>Salary Slip — {month} {year}</div>
                        </div>
                        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                </div>

                {/* Body (scrollable) */}
                <div style={{ overflowY: "auto", flex: 1 }}>
                    <div id="payslip-print-area" dangerouslySetInnerHTML={{ __html: printHTML }} />
                </div>

                {/* Footer Actions */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                    <button className="btn btn-secondary" onClick={handlePrint}>
                        <FiPrinter size={14} /> Print
                    </button>
                    <button className="btn btn-primary" onClick={handleDownload} disabled={isDownloading}>
                        <FiDownload size={14} /> {isDownloading ? "Generating PDF..." : "Download Payslip"}
                    </button>
                </div>
            </div>
        </div>
    );
}
