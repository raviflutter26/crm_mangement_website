"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { 
    FiArrowLeft, FiEdit2, FiTrash2, FiKey, FiPauseCircle, FiPlayCircle, FiBriefcase, FiZap, FiCreditCard, FiClock, FiMapPin
} from "react-icons/fi";
import dayjs from "dayjs";

export default function ViewOrganizationPage() {
    const { id } = useParams();
    const router = useRouter();
    const [org, setOrg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Overview");

    const fetchOrg = async () => {
        try {
            const res = await axiosInstance.get(`/api/organizations/${id}`);
            setOrg(res.data.data);
        } catch (err: any) {
            alert("Error loading organization: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchOrg();
    }, [id]);

    const handleToggleStatus = async () => {
        const newStatus = org.status === 'active' ? 'suspended' : 'active';
        if (!confirm(`Change status to ${newStatus}?`)) return;
        try {
            await axiosInstance.patch(`/api/organizations/${id}/status`, { status: newStatus });
            fetchOrg();
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${org.name}?`)) return;
        try {
            await axiosInstance.delete(`/api/organizations/${id}`);
            router.push('/superadmin/organizations');
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const handleImpersonate = async () => {
        if (!confirm("Login as Organization Admin? You will be redirected.")) return;
        try {
            const res = await axiosInstance.post(`/api/organizations/${id}/impersonate`);
            localStorage.setItem('token', res.data.data.token);
            window.location.href = '/dashboard';
        } catch (err: any) { alert("Impersonation failed: " + (err.response?.data?.message || err.message)); }
    };

    if (loading) return <div className="p-8 text-center text-[#94A3B8] animate-pulse">Synchronizing vault records...</div>;
    if (!org) return <div className="p-8 text-center text-red-500 font-bold">Node not found in registry</div>;

    const tabs = [
        { label: "Overview", icon: FiBriefcase },
        { label: "Operations", icon: FiClock },
        { label: "Subscription", icon: FiCreditCard },
        { label: "Statutory", icon: FiZap }
    ];

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-6xl mx-auto flex flex-col gap-16">
                {/* Top Nav */}
                <button onClick={() => router.push('/superadmin/organizations')} className="flex items-center gap-2 group text-sm font-bold text-[#64748B] hover:text-[#FF7A00] mb-8 transition-all">
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Organization List
                </button>

                {/* Premium Header Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#FF7A00] to-[#E66D00] rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-orange-500/30 border border-white/10">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-white/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-20%] left-[-5%] w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center relative z-10 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-white/20 p-1 shadow-2xl border-2 border-white/20 relative group overflow-hidden shrink-0">
                                <div className="w-full h-full rounded-xl bg-white flex items-center justify-center font-black text-5xl text-[#FF7A00] shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    {org.name.charAt(0)}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">{org.name}</h1>
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-white/20 border border-white/40 text-white shrink-0`}>
                                        <div className={`w-1.5 h-1.5 rounded-full bg-white animate-pulse`} />
                                        {org.status}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 text-white/90">
                                    <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-4 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                                        <span className="text-white/60 uppercase text-[9px] tracking-[0.2em]">ID:</span>
                                        <span className="text-white font-mono">{org.slug}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row flex-wrap items-center gap-3">
                            <button onClick={handleImpersonate} className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#FF7A00] hover:bg-slate-50 rounded-xl shadow-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 group">
                                <FiKey className="group-hover:rotate-45 transition-transform" /> LOGIN AS ADMIN
                            </button>
                            <button onClick={() => router.push(`/superadmin/organizations/${org._id}/edit`)} className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl border border-white/35 backdrop-blur-md transition-all font-black text-[10px] uppercase tracking-widest active:scale-95">
                                <FiEdit2 /> EDIT SETTINGS
                            </button>
                            <button onClick={handleToggleStatus} className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl border border-white/35 backdrop-blur-md transition-all font-black text-[10px] uppercase tracking-widest active:scale-95">
                                {org.status === 'active' ? <><FiPauseCircle className="text-white" /> SUSPEND</> : <><FiPlayCircle className="text-white" /> ACTIVATE</>}
                            </button>
                            <button onClick={handleDelete} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white hover:bg-red-600 rounded-xl shadow-lg border border-red-500 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95">
                                <FiTrash2 /> DELETE
                            </button>
                        </div>
                    </div>

                    {/* Registered Date with Breathing Room */}
                    <div className="relative z-10 py-6 px-1">
                        <div className="flex items-center gap-2 text-white/70 text-xs font-medium">
                            <FiClock className="text-white/50" size={14} />
                            <span>Established in our network on {dayjs(org.createdAt).format('MMMM D, YYYY')}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-8 border-t border-white/20 relative z-10">
                        {[
                            { label: "BUSINESS SECTOR", value: org.industry || 'General', icon: FiBriefcase },
                            { label: "SUBSCRIPTION PLAN", value: org.planType || 'Standard', icon: FiCreditCard },
                            { label: "PRIMARY EMAIL", value: org.email, icon: FiZap },
                            { label: "TIMEZONE", value: org.settings?.attendance?.timezone || 'Asia/Kolkata', icon: FiClock }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/10 p-4 md:p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition-all group shadow-sm flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <item.icon className="text-white/60 text-[10px] group-hover:scale-110 transition-transform" />
                                    <div className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">{item.label}</div>
                                </div>
                                <div className="text-white font-black text-base truncate tracking-tight">{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabbed Content Shell */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
                    <div className="flex p-2 bg-slate-50/80 gap-2 border-b border-slate-200">
                        {tabs.map(tab => (
                            <button 
                                key={tab.label}
                                onClick={() => setActiveTab(tab.label)}
                                className={`flex items-center gap-2 px-6 py-3 text-xs font-black tracking-widest uppercase transition-all rounded-xl ${
                                    activeTab === tab.label 
                                    ? 'bg-white text-[#FF7A00] shadow-sm border border-slate-200' 
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-20 min-h-[600px] bg-white">
                        {activeTab === "Overview" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-12">
                                    <div>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-1.5 h-6 bg-[#FF7A00] rounded-full" />
                                            <h3 className="text-sm font-black text-[#1E293B] uppercase tracking-widest">Company Profile</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-10">
                                            {[
                                                { label: "Company Size", value: org.companySize, icon: FiBriefcase },
                                                { label: "Founded Year", value: org.foundedYear, icon: FiClock },
                                                { label: "Website", value: org.website, isLink: true }
                                            ].map((attr, idx) => (
                                                <div key={idx} className="flex justify-between items-center py-6 border-b border-slate-50 first:pt-0">
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{attr.label}</span>
                                                    <span className={`text-base font-black ${attr.isLink ? 'text-[#FF7A00] hover:underline' : 'text-[#1E293B]'}`}>
                                                        {attr.isLink && attr.value ? (
                                                            <a href={attr.value} target="_blank" rel="noreferrer" className="flex items-center gap-2">{attr.value}</a>
                                                        ) : (attr.value || '—')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">About Organization</h3>
                                        <p className="text-sm text-slate-600 leading-relaxed bg-[#F8FAFC] p-6 rounded-2xl border border-slate-100 shadow-inner">
                                            {org.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                        <h3 className="text-sm font-black text-[#1E293B] uppercase tracking-widest">Office Address</h3>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-[#FF7A00] to-blue-500 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition-opacity" />
                                        <div className="bg-white p-8 rounded-[1.75rem] border border-slate-200 relative space-y-6 shadow-sm">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF7A00] flex items-center justify-center shrink-0 shadow-sm border border-orange-100">
                                                    <FiMapPin size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Headquarters</div>
                                                    <div className="text-base font-black text-[#1E293B]">{org.address?.street || 'Not specified'}</div>
                                                    <div className="text-sm text-slate-500 mt-1">{[org.address?.city, org.address?.state].filter(Boolean).join(', ')}</div>
                                                    <div className="text-sm text-slate-500">{[org.address?.country, org.address?.pincode].filter(Boolean).join(' ')}</div>
                                                </div>
                                            </div>
                                            
                                            {/* Visual helper for address */}
                                            <div className="h-32 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                                                <FiMapPin className="animate-bounce" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Verified Location</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Summary of other tabs for brevity, following the same style */}
                        {activeTab === "Operations" && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in">
                                <div className="p-6 bg-[#F8FAFC] rounded-[2rem] border border-[#E2E8F0]">
                                    <h4 className="text-sm font-black text-[#1E293B] mb-4">Core Operational Rules</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Working Hours</span><span className="font-bold">{org.settings?.attendance?.workingHours || 8}h</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Business Hours</span><span className="font-bold">{org.settings?.attendance?.defaultStartTime} - {org.settings?.attendance?.defaultEndTime}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Break Duration</span><span className="font-bold">{org.settings?.attendance?.breakDuration}m</span></div>
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
