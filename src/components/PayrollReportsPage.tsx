"use client";

import { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { 
    FiSearch, FiFilter, FiDownload, FiBarChart2, FiPieChart, 
    FiFileText, FiPrinter, FiChevronRight, FiGrid, FiList, FiChevronLeft, FiChevronDown,
    FiActivity, FiPackage, FiShield, FiFilePlus
} from "react-icons/fi";

const COLUMNS = [
    {
        sections: [
            {
                title: "Payroll Overview",
                dataType: "payroll",
                icon: FiBarChart2,
                items: [
                    "Payroll Summary", "Salary Register - Monthly", "Salary Statement",
                    "Pay Summary", "Payroll Liability Summary", "Leave Encashment Summary",
                    "LOP Summary", "Variable Pay Earnings Report"
                ]
            },
            {
                title: "Declarations & Investments",
                dataType: "payroll",
                icon: FiFilePlus,
                items: ["FBP Declaration Report", "Investment Declaration Report", "Proof of Investment Report"]
            },
            {
                title: "Loan Reports",
                dataType: "payroll",
                icon: FiPackage,
                items: ["Loan Outstanding Summary", "Loan Perquisite Summary", "Loan Perquisite Projection", "Loan Overall Summary"]
            }
        ]
    },
    {
        sections: [
            {
                title: "Statutory Reports",
                dataType: "payroll",
                icon: FiShield,
                items: [
                    "EPF Summary", "EPF-ECR Report", "ESI Summary", "ESIC Return Report",
                    "PT Summary", "PT Monthly Statement", "PT Annual Return Statement",
                    "LWF Summary"
                ]
            },
            {
                title: "Deduction Reports",
                dataType: "payroll",
                icon: FiFilter,
                items: ["Benefits & Deductions Summary", "Deductions Summary", "Benefits Summary"]
            },
            {
                title: "Payroll Journal",
                dataType: "payroll",
                icon: FiFileText,
                items: ["Payroll Journal Summary"]
            }
        ]
    },
    {
        sections: [
            {
                title: "Employee Reports",
                dataType: "employees",
                icon: FiList,
                items: [
                    "Compensation Details", "Reimbursement Summary", "Perquisite Summary",
                    "Full and Final Settlement", "Salary Revision Report",
                    "Salary Revision History", "Salary Withheld Report"
                ]
            },
            {
                title: "Taxes and Forms",
                dataType: "payroll",
                icon: FiPrinter,
                items: ["TDS (Tax Deduction Summary)", "Form 24Q"]
            },
            {
                title: "Activity",
                dataType: "activity",
                icon: FiActivity,
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
    const [downloadDropdown, setDownloadDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dataStatus, setDataStatus] = useState({
        employees: false,
        payroll: false,
        attendance: false,
        leaves: false,
        activity: true
    });

    // Close download dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDownloadDropdown(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

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

    const handleDownload = async (id: string, name: string, format: string = "csv") => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`${API_ENDPOINTS.PAYROLL_REPORTS}/${id}/download`, {
                responseType: 'blob'
            });

            const blob = new Blob([res.data], { 
                type: format === 'pdf' ? 'application/pdf' : 
                      format === 'doc' ? 'application/vnd.ms-word' : 
                      'text/csv' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${name.replace(/\s+/g, '_')}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showNotify('success', `${format.toUpperCase()} download started!`);
            setDownloadDropdown(null);
        } catch (err) {
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
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-[1400px] mx-auto">
                {/* Enterprise Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        {view === "history" && (
                            <button 
                                onClick={() => setView("explorer")}
                                className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#FF7A00] hover:bg-orange-50 transition-all shadow-sm"
                            >
                                <FiChevronLeft size={20} />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-black text-[#1E293B] tracking-tight">Analytical Reports</h1>
                            <p className="text-sm text-[#64748B] font-medium">Generate and track platform intelligence</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                            <input 
                                type="text" 
                                placeholder="Search definitions..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#FF7A00]/10 focus:border-[#FF7A00] outline-none transition-all"
                            />
                        </div>
                        <button 
                            onClick={() => setView(view === "explorer" ? "history" : "explorer")}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#1E293B] text-white rounded-xl font-bold text-sm hover:bg-[#0F172A] transition-all shadow-lg shadow-slate-900/10 active:scale-95 whitespace-nowrap"
                        >
                            {view === "explorer" ? <><FiList /> Activity History</> : <><FiGrid /> Report Explorer</>}
                        </button>
                    </div>
                </div>

                {view === "explorer" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {COLUMNS.map((column, cIdx) => (
                            <div key={cIdx} className="space-y-8">
                                {column.sections.map((section, sIdx) => {
                                    const hasData = (dataStatus as any)[section.dataType];
                                    if (!hasData) return null;

                                    const filteredItems = section.items.filter(item => 
                                        item.toLowerCase().includes(searchQuery.toLowerCase())
                                    );
                                    if (filteredItems.length === 0) return null;

                                    return (
                                        <div key={sIdx} className="bg-white rounded-[2rem] border border-[#E2E8F0] shadow-sm overflow-hidden group hover:border-[#FF7A00]/30 transition-all">
                                            <div className="p-6 border-b border-[#F1F5F9] bg-slate-50/50 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF7A00] flex items-center justify-center">
                                                        <section.icon size={18} />
                                                    </div>
                                                    <h3 className="font-black text-[#1E293B] tracking-tight">{section.title}</h3>
                                                </div>
                                                <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">{filteredItems.length} items</span>
                                            </div>
                                            <div className="p-4 space-y-1">
                                                {filteredItems.map((item, iIdx) => (
                                                    <button 
                                                        key={iIdx}
                                                        onClick={() => handleGenerateReport(item, section.title)}
                                                        className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-orange-50 group/item transition-all text-left"
                                                    >
                                                        <span className="text-sm font-bold text-[#475569] group-hover/item:text-[#FF7A00] transition-colors">{item}</span>
                                                        <FiChevronRight className="text-[#CBD5E1] group-hover/item:text-[#FF7A00] group-hover/item:translate-x-1 transition-all" size={16} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-[#E2E8F0] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                                        <th className="px-8 py-5 text-[11px] font-black text-[#64748B] uppercase tracking-widest">Report Identifier</th>
                                        <th className="px-8 py-5 text-[11px] font-black text-[#64748B] uppercase tracking-widest">Classification</th>
                                        <th className="px-8 py-5 text-[11px] font-black text-[#64748B] uppercase tracking-widest">Temporal Node</th>
                                        <th className="px-8 py-5 text-[11px] font-black text-[#64748B] uppercase tracking-widest">Timestamp</th>
                                        <th className="px-8 py-5 text-[11px] font-black text-[#64748B] uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((h, i) => (
                                        <tr key={i} className="border-b border-[#F1F5F9] hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF7A00] flex items-center justify-center shrink-0">
                                                        <FiFileText size={14} />
                                                    </div>
                                                    <span className="text-sm font-black text-[#1E293B]">{h.reportName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-[10px] font-black text-[#64748B] uppercase tracking-wider">
                                                    {h.reportCategory}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-[#475569]">
                                                {new Date(0, h.month - 1).toLocaleString('default', { month: 'short' })} {h.year}
                                            </td>
                                            <td className="px-8 py-5 text-sm text-[#94A3B8] font-medium">
                                                {new Date(h.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="inline-block relative" ref={downloadDropdown === h._id ? dropdownRef : undefined}>
                                                    <button 
                                                        onClick={() => setDownloadDropdown(downloadDropdown === h._id ? null : h._id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-black text-[#475569] hover:border-[#FF7A00] hover:text-[#FF7A00] transition-all active:scale-95 shadow-sm"
                                                    >
                                                        <FiDownload /> Export
                                                        <FiChevronDown size={14} className={downloadDropdown === h._id ? "rotate-180 transition-transform" : "transition-transform"} />
                                                    </button>
                                                    
                                                    {downloadDropdown === h._id && (
                                                        <div className="absolute top-full right-0 mt-3 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl shadow-slate-900/10 min-w-[200px] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                            {[
                                                                { label: "Portable Document", ext: "pdf", format: "PDF", icon: FiPrinter, color: "text-red-500" },
                                                                { label: "Word Document", ext: "doc", format: "DOC", icon: FiFileText, color: "text-orange-500" },
                                                                { label: "Data Spreadsheet", ext: "csv", format: "CSV", icon: FiGrid, color: "text-green-500" },
                                                            ].map((opt, idx) => (
                                                                <button 
                                                                    key={idx} 
                                                                    onClick={() => handleDownload(h._id, h.reportName, opt.ext)}
                                                                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-orange-50 transition-colors text-left border-b border-[#F1F5F9] last:border-0"
                                                                >
                                                                    <div className={`w-8 h-8 rounded-lg bg-slate-50 ${opt.color} flex items-center justify-center`}>
                                                                        <opt.icon size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[11px] font-black text-[#1E293B] mb-0.5">{opt.format}</div>
                                                                        <div className="text-[10px] font-bold text-[#94A3B8] leading-none">{opt.label}</div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="w-16 h-16 bg-slate-50 text-[#CBD5E1] rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FiFileText size={32} />
                                                </div>
                                                <div className="text-sm font-black text-[#1E293B]">Zero Intelligence Found</div>
                                                <div className="text-xs text-[#94A3B8] mt-1">No reports have been generated for this node yet.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
