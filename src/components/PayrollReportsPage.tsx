"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { 
    FiSearch, FiFilter, FiDownload, FiBarChart2, FiPieChart, 
    FiFileText, FiPrinter, FiChevronRight, FiGrid, FiList, FiChevronLeft
} from "react-icons/fi";

const COLUMNS = [
    {
        sections: [
            {
                title: "Payroll Overview",
                dataType: "payroll",
                items: [
                    "Payroll Summary", "Salary Register - Monthly", "Salary Statement",
                    "Pay Summary", "Payroll Liability Summary", "Leave Encashment Summary",
                    "LOP Summary", "Variable Pay Earnings Report"
                ]
            },
            {
                title: "Declarations & Investments",
                dataType: "payroll",
                items: ["FBP Declaration Report", "Investment Declaration Report", "Proof of Investment Report"]
            },
            {
                title: "Loan Reports",
                dataType: "payroll",
                items: ["Loan Outstanding Summary", "Loan Perquisite Summary", "Loan Perquisite Projection", "Loan Overall Summary"]
            }
        ]
    },
    {
        sections: [
            {
                title: "Statutory Reports",
                dataType: "payroll",
                items: [
                    "EPF Summary", "EPF-ECR Report", "ESI Summary", "ESIC Return Report",
                    "PT Summary", "PT Monthly Statement", "PT Annual Return Statement",
                    "LWF Summary"
                ]
            },
            {
                title: "Deduction Reports",
                dataType: "payroll",
                items: ["Benefits & Deductions Summary", "Deductions Summary", "Benefits Summary"]
            },
            {
                title: "Payroll Journal",
                dataType: "payroll",
                items: ["Payroll Journal Summary"]
            }
        ]
    },
    {
        sections: [
            {
                title: "Employee Reports",
                dataType: "employees",
                items: [
                    "Compensation Details", "Reimbursement Summary", "Perquisite Summary",
                    "Full and Final Settlement", "Salary Revision Report",
                    "Salary Revision History", "Salary Withheld Report"
                ]
            },
            {
                title: "Taxes and Forms",
                dataType: "payroll",
                items: ["TDS (Tax Deduction Summary)", "Form 24Q"]
            },
            {
                title: "Activity",
                dataType: "activity",
                items: ["Activity Logs"]
            }
        ]
    }
];

interface PayrollReportsProps {
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function PayrollReportsPage({ showNotify }: PayrollReportsProps) {
    const [view, setView] = useState<"explorer" | "history">("explorer");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [dataStatus, setDataStatus] = useState({
        employees: false,
        payroll: false,
        attendance: false,
        leaves: false,
        activity: true
    });

    useEffect(() => {
        fetchHistory();
        checkDataAvailability();
    }, []);

    const checkDataAvailability = async () => {
        try {
            const [empRes, payRes, attRes, leaveRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.EMPLOYEES).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.PAYROLL).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.ATTENDANCE).catch(() => ({ data: { data: [] } })),
                axiosInstance.get(API_ENDPOINTS.LEAVES).catch(() => ({ data: { data: [] } }))
            ]);

            const status = {
                employees: (empRes.data?.data?.length || 0) > 0,
                payroll: (payRes.data?.data?.length || 0) > 0,
                attendance: (attRes.data?.data?.length || 0) > 0,
                leaves: (leaveRes.data?.data?.length || 0) > 0,
                activity: true
            };
            setDataStatus(status);

            // If no data at all, warn the user
            if (!status.employees && !status.payroll) {
                showNotify('warning', "No records found in the system. Some report categories are hidden.");
            }
        } catch (err) {
            console.error("Failed to check data availability", err);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.PAYROLL_REPORTS);
            setHistory(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch report history", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id: string, name: string) => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`${API_ENDPOINTS.PAYROLL_REPORTS}/${id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${name.replace(/\s+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showNotify('success', "Download started!");
        } catch (err) {
            console.error("Download failed", err);
            showNotify('failure', "Failed to download report");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async (reportName: string, category: string) => {
        try {
            setLoading(true);
            const res = await axiosInstance.post(API_ENDPOINTS.PAYROLL_REPORTS, {
                reportName,
                reportCategory: category,
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                department: "All"
            });
            showNotify('success', `${reportName} generated successfully!`);
            fetchHistory();
            setView("history");
            
            // Auto download
            if (res.data?.data?._id) {
                handleDownload(res.data.data._id, reportName);
            }
        } catch (err: any) {
            showNotify('failure', err.response?.data?.message || "Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height: "100%", overflowY: "auto", padding: "0 40px 40px" }}>
            <div style={{ 
                padding: "20px 0", 
                borderBottom: "1px solid var(--border)", 
                marginBottom: "30px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {view === "history" && (
                        <button 
                            onClick={() => setView("explorer")}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", display: "flex", alignItems: "center" }}
                        >
                            <FiChevronLeft size={20} />
                        </button>
                    )}
                    <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Reports</h1>
                    {!loading && view === "explorer" && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "10px", padding: "4px 12px", background: "var(--bg-secondary)", borderRadius: "20px", border: "1px solid var(--border)" }}>
                            Showing categories with data
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                    <div className="topbar-search" style={{ width: "300px", background: "var(--bg-secondary)" }}>
                        <FiSearch className="topbar-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search report name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => setView(view === "explorer" ? "history" : "explorer")}
                    >
                        {view === "explorer" ? <><FiList /> History</> : <><FiGrid /> Explorer</>}
                    </button>
                </div>
            </div>

            {view === "explorer" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }}>
                    {COLUMNS.map((column, cIdx) => (
                        <div key={cIdx} style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                            {column.sections.map((section, sIdx) => {
                                // Requirement: "i want any data availabe report list only show"
                                const hasData = (dataStatus as any)[section.dataType];
                                if (!hasData) return null;

                                const filteredItems = section.items.filter(item => 
                                    item.toLowerCase().includes(searchQuery.toLowerCase())
                                );
                                if (filteredItems.length === 0) return null;

                                return (
                                    <div key={sIdx}>
                                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "15px" }}>
                                            {section.title}
                                        </h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            {filteredItems.map((item, iIdx) => (
                                                <div 
                                                    key={iIdx}
                                                    onClick={() => handleGenerateReport(item, section.title)}
                                                    className="report-link"
                                                    style={{
                                                        fontSize: "13px",
                                                        color: "var(--primary)",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        transition: "0.2s"
                                                    }}
                                                >
                                                    <span style={{ color: "var(--text-muted)", fontSize: "16px" }}>›</span>
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Report Name</th>
                                    <th>Category</th>
                                    <th>Period</th>
                                    <th>Generated By</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{h.reportName}</td>
                                        <td><span className="badge active">{h.reportCategory}</span></td>
                                        <td>{new Date(0, h.month - 1).toLocaleString('default', { month: 'short' })} {h.year}</td>
                                        <td>{h.generatedBy?.name || "System"}</td>
                                        <td style={{ color: "var(--text-muted)" }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "10px" }}>
                                                <button 
                                                    className="topbar-btn" 
                                                    onClick={() => handleDownload(h._id, h.reportName)}
                                                    title="Download Report"
                                                >
                                                    <FiDownload />
                                                </button>
                                                <button className="topbar-btn" title="Print Report"><FiPrinter /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>No history found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style jsx>{`
                .report-link:hover {
                    color: #FF6D00;
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
