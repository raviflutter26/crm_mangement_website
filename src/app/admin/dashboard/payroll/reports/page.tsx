"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import PayrollTrendChart from "@/components/payroll/PayrollTrendChart";
import PayslipModal from "@/components/payroll/PayslipModal";
import { FiBarChart2, FiDownload, FiSearch, FiFileText } from "react-icons/fi";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (n: any) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function ReportsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [runs, setRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [payslipData, setPayslipData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"trend" | "payslips" | "compliance">("trend");
    const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

    const downloadComplianceReport = async (reportName: string) => {
        setDownloadingReport(reportName);
        try {
            const res = await axiosInstance.post(API_ENDPOINTS.PAYROLL_REPORTS, {
                reportName,
                reportCategory: 'Compliance',
                month: new Date().getMonth() + 1, // Current month for demo
                year: new Date().getFullYear(),
                reportType: 'csv'
            });
            const fileUrl = res.data.data.fileUrl;
            
            // Create a fake link to download the base64 CSV
            const a = document.createElement("a");
            a.href = fileUrl;
            a.download = `${reportName.replace(/\s+/g, '_')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            alert("Failed to download report");
        } finally {
            setDownloadingReport(null);
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [recRes, runsRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.PAYROLL).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.PAYROLL_RUNS).catch(() => ({ data: { data: [] } })),
            ]);
            setRecords(recRes.data.data || []);
            setRuns(runsRes.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Build trend data from runs
    const now = new Date();
    const trendData = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const run = runs.find(r => r.month === d.getMonth() + 1 && r.year === d.getFullYear());
        return {
            month: MONTHS_SHORT[d.getMonth()],
            netPay: run?.totalNetPay || 0,
            grossPay: run?.totalGrossPay || 0,
            deductions: run?.totalDeductions || 0,
        };
    });

    // Total disbursed (paid runs)
    const totalDisbursed = runs.filter(r => r.status === "paid").reduce((s, r) => s + (r.totalNetPay || 0), 0);
    const avgMonthly = runs.length > 0 ? runs.reduce((s, r) => s + (r.totalNetPay || 0), 0) / runs.length : 0;

    // Filter records for payslip search
    const filtered = records.filter(r => {
        const name = `${r.employee?.firstName || ""} ${r.employee?.lastName || ""} ${r.employee?.employeeId || ""}`.toLowerCase();
        return name.includes(search.toLowerCase());
    });

    return (
        <>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E1B4B", margin: 0 }}>Payroll Reports</h1>
                <p style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>Monthly trends, disbursement tracking, and payslip generation</p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                    { label: "Total Disbursed", value: fmt(totalDisbursed), sub: "All time via RazorpayX", color: "#6366F1", bg: "#EEF2FF" },
                    { label: "Avg Monthly Payroll", value: fmt(avgMonthly), sub: `Over ${runs.length} run(s)`, color: "#10B981", bg: "#D1FAE5" },
                    { label: "Payroll Records", value: records.length, sub: "Individual payslips", color: "#F59E0B", bg: "#FEF3C7" },
                ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: `1px solid ${s.bg}` }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", marginTop: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Tab Toggle */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <button
                    className={`btn ${activeTab === "trend" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveTab("trend")}
                >
                    <FiBarChart2 size={14} /> Monthly Trend
                </button>
                <button
                    className={`btn ${activeTab === "payslips" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveTab("payslips")}
                >
                    <FiFileText size={14} /> Employee Payslips
                </button>
                <button
                    className={`btn ${activeTab === "compliance" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveTab("compliance")}
                >
                    <FiDownload size={14} /> Compliance Exports
                </button>
            </div>

            {/* Monthly Trend */}
            {activeTab === "trend" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "24px 28px", border: "1px solid #E8EAFF" }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1E1B4B", marginBottom: 4 }}>6-Month Payroll Trend</div>
                        <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>Gross pay vs net pay over time</div>
                        <PayrollTrendChart data={trendData} type="area" height={260} />
                    </div>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "24px 28px", border: "1px solid #E8EAFF" }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1E1B4B", marginBottom: 4 }}>Component Breakdown</div>
                        <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>Earnings vs deductions per month</div>
                        <PayrollTrendChart data={trendData} type="bar" height={260} />
                    </div>

                    {/* Run Summary Table */}
                    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8EAFF", gridColumn: "1 / -1" }}>
                        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9", fontWeight: 800, fontSize: 15, color: "#1E1B4B" }}>
                            Payroll Run History
                        </div>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Run ID</th><th>Month</th><th>Employees</th>
                                        <th>Gross Pay</th><th>Deductions</th><th>Net Pay</th>
                                        <th>PF</th><th>ESI</th><th>TDS</th><th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({length:4}).map((_,i) => <tr key={i}>{Array.from({length:10}).map((_,j) => <td key={j}><div className="skeleton-pulse" style={{height:16,borderRadius:6}}/></td>)}</tr>)
                                    ) : runs.length === 0 ? (
                                        <tr><td colSpan={10} style={{textAlign:"center",padding:"60px",color:"#94A3B8"}}>No payroll runs yet</td></tr>
                                    ) : (
                                        runs.map((run: any) => (
                                            <tr key={run._id}>
                                                <td style={{fontFamily:"monospace",fontSize:12,fontWeight:700}}>{run.runId}</td>
                                                <td style={{fontWeight:600}}>{MONTHS[(run.month||1)-1]} {run.year}</td>
                                                <td>{run.totalEmployees||0}</td>
                                                <td style={{fontFamily:"monospace"}}>{fmt(run.totalGrossPay)}</td>
                                                <td style={{fontFamily:"monospace",color:"#EF4444"}}>{fmt(run.totalDeductions)}</td>
                                                <td style={{fontFamily:"monospace",fontWeight:800,color:"#6366F1"}}>{fmt(run.totalNetPay)}</td>
                                                <td style={{fontFamily:"monospace",fontSize:12}}>{fmt(run.totalPF)}</td>
                                                <td style={{fontFamily:"monospace",fontSize:12}}>{fmt(run.totalESI)}</td>
                                                <td style={{fontFamily:"monospace",fontSize:12}}>{fmt(run.totalTDS)}</td>
                                                <td>
                                                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:run.status==="paid"?"#D1FAE5":"#EEF2FF",color:run.status==="paid"?"#059669":"#6366F1"}}>
                                                        {run.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee Payslips */}
            {activeTab === "payslips" && (
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8EAFF" }}>
                    <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9" }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1E1B4B", marginBottom: 12 }}>Employee Payslips</div>
                        <div style={{ position: "relative", maxWidth: 340 }}>
                            <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                            <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th><th>Month/Year</th>
                                    <th>Gross Pay</th><th>PF</th><th>TDS</th><th>Net Pay</th><th>Status</th><th>Payslip</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({length:5}).map((_,i) => <tr key={i}>{Array.from({length:8}).map((_,j) => <td key={j}><div className="skeleton-pulse" style={{height:16,borderRadius:6}}/></td>)}</tr>)
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={8} style={{textAlign:"center",padding:"60px",color:"#94A3B8"}}>No payslip records found</td></tr>
                                ) : (
                                    filtered.map((rec:any) => (
                                        <tr key={rec._id}>
                                            <td style={{fontWeight:600}}>{rec.employee?.firstName} {rec.employee?.lastName}
                                                <div style={{fontSize:11,color:"#94A3B8"}}>{rec.employee?.employeeId}</div>
                                            </td>
                                            <td>{MONTHS[(rec.month||1)-1]} {rec.year}</td>
                                            <td style={{fontFamily:"monospace"}}>{fmt(rec.totalEarnings)}</td>
                                            <td style={{fontFamily:"monospace",fontSize:12}}>{fmt(rec.deductions?.pf)}</td>
                                            <td style={{fontFamily:"monospace",fontSize:12}}>{fmt(rec.deductions?.tax)}</td>
                                            <td style={{fontFamily:"monospace",fontWeight:800,color:"#6366F1"}}>{fmt(rec.netPay)}</td>
                                            <td>
                                                <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:rec.paymentStatus==="Paid"?"#D1FAE5":"#FEF3C7",color:rec.paymentStatus==="Paid"?"#059669":"#D97706"}}>
                                                    {rec.paymentStatus||"Pending"}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => setPayslipData(rec)}>
                                                    <FiDownload size={13} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Compliance Exports */}
            {activeTab === "compliance" && (
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8EAFF", padding: 30 }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: "#1E1B4B", marginBottom: 8 }}>Statutory & Compliance Filings</div>
                    <div style={{ fontSize: 14, color: "#64748B", marginBottom: 30 }}>Download auto-generated CSV files formatted for government portal uploads based on the latest approved payroll run.</div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                        <div style={{ border: "1px solid #E2E8F0", padding: 24, borderRadius: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#1E293B", marginBottom: 8 }}>PF Challan (ECR)</div>
                            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 20, minHeight: 40 }}>Electronic Challan cum Return format for EPFO portal upload. Includes UAN, EPF Wages, and Contributions.</div>
                            <button 
                                className="btn btn-primary" 
                                style={{ width: "100%", justifyContent: "center" }}
                                onClick={() => downloadComplianceReport('PF Challan')}
                                disabled={downloadingReport === 'PF Challan'}
                            >
                                <FiDownload /> {downloadingReport === 'PF Challan' ? 'Generating...' : 'Download ECR CSV'}
                            </button>
                        </div>

                        <div style={{ border: "1px solid #E2E8F0", padding: 24, borderRadius: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#1E293B", marginBottom: 8 }}>ESI Challan</div>
                            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 20, minHeight: 40 }}>Monthly ESI contribution report with IP numbers and exact worked days for ESIC portal.</div>
                            <button 
                                className="btn btn-primary" 
                                style={{ width: "100%", justifyContent: "center", background: "#10B981", border: "none" }}
                                onClick={() => downloadComplianceReport('ESI Challan')}
                                disabled={downloadingReport === 'ESI Challan'}
                            >
                                <FiDownload /> {downloadingReport === 'ESI Challan' ? 'Generating...' : 'Download ESI CSV'}
                            </button>
                        </div>

                        <div style={{ border: "1px solid #E2E8F0", padding: 24, borderRadius: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#1E293B", marginBottom: 8 }}>TDS Report (Income Tax)</div>
                            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 20, minHeight: 40 }}>Monthly TDS deduction report per employee with PAN and gross salary for IT department.</div>
                            <button 
                                className="btn btn-primary" 
                                style={{ width: "100%", justifyContent: "center", background: "#F59E0B", border: "none" }}
                                onClick={() => downloadComplianceReport('TDS Report')}
                                disabled={downloadingReport === 'TDS Report'}
                            >
                                <FiDownload /> {downloadingReport === 'TDS Report' ? 'Generating...' : 'Download TDS CSV'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {payslipData && <PayslipModal data={payslipData} onClose={() => setPayslipData(null)} />}
        </>
    );
}
