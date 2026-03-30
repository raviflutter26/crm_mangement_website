"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { FiArrowLeft, FiSave, FiBriefcase, FiMapPin, FiClock, FiCreditCard, FiZap } from "react-icons/fi";

export default function EditOrganizationPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const res = await axiosInstance.get(`/api/organizations/${id}`);
                const org = res.data.data;
                
                setFormData({
                    name: org.name || "",
                    slug: org.slug || "",
                    industry: org.industry || "",
                    companySize: org.companySize || "1-10",
                    foundedYear: org.foundedYear || "",
                    website: org.website || "",
                    description: org.description || "",
                    email: org.email || "",
                    phone: org.phone || "",
                    country: org.address?.country || "",
                    state: org.address?.state || "",
                    city: org.address?.city || "",
                    address: org.address?.street || "",
                    pincode: org.address?.pincode || "",
                    timezone: org.settings?.attendance?.timezone || "Asia/Kolkata",
                    defaultStartTime: org.settings?.attendance?.defaultStartTime || "09:00",
                    defaultEndTime: org.settings?.attendance?.defaultEndTime || "18:00",
                    workingHours: org.settings?.attendance?.workingHours || 8,
                    graceMinutes: org.settings?.attendance?.graceMinutes || 15,
                    weekStart: org.settings?.attendance?.weekStart || "Mon",
                    breakDuration: org.settings?.attendance?.breakDuration || 60,
                    overtimePolicy: org.settings?.attendance?.overtimePolicy || "None",
                    planType: org.planType || "Starter",
                    billingCycle: org.billingCycle || "Monthly",
                    maxEmployees: org.maxEmployees || 50,
                    currency: org.settings?.payroll?.currency || "INR",
                    payrollCycle: org.settings?.payroll?.payrollCycle || "Monthly",
                    pfApplicable: org.settings?.payroll?.epfEnabled || false,
                    esiApplicable: org.settings?.payroll?.esiEnabled || false
                });
            } catch (err: any) {
                alert("Error loading organization: " + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchOrg();
    }, [id]);

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                industry: formData.industry,
                companySize: formData.companySize,
                foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
                website: formData.website,
                description: formData.description,
                email: formData.email,
                phone: formData.phone,
                address: {
                    street: formData.address,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    pincode: formData.pincode
                },
                settings: {
                    attendance: {
                        timezone: formData.timezone,
                        workingHours: formData.workingHours,
                        graceMinutes: formData.graceMinutes,
                        defaultStartTime: formData.defaultStartTime,
                        defaultEndTime: formData.defaultEndTime,
                        weekStart: formData.weekStart,
                        breakDuration: formData.breakDuration,
                        overtimePolicy: formData.overtimePolicy
                    },
                    payroll: {
                        currency: formData.currency,
                        payrollCycle: formData.payrollCycle,
                        epfEnabled: formData.pfApplicable,
                        esiEnabled: formData.esiApplicable
                    }
                },
                planType: formData.planType,
                billingCycle: formData.billingCycle,
                maxEmployees: formData.maxEmployees,
            };

            await axiosInstance.put(`/api/organizations/${id}`, payload);
            alert("Configuration updated successfully");
            router.push(`/superadmin/organizations/${id}`);
        } catch (err: any) {
            alert("Error updating configuration: " + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-[#94A3B8] animate-pulse">Retrieving node configuration...</div>;
    if (!formData) return <div className="p-8 text-center text-red-500 font-bold">Failed to initialize node state.</div>;

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-4xl mx-auto space-y-14">
                {/* Modern Navigation Header */}
                <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-sm">
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={() => router.back()}
                            className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#FF7A00] hover:border-[#FF7A00] transition-all shadow-sm group active:scale-95"
                        >
                            <FiArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Edit Organization</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Node:</span>
                                <span className="text-sm font-bold text-[#FF7A00]">{formData.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12 pb-20">
                    
                    {/* SECTION 1: Company Identity */}
                    <div className="bg-white p-14 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2.5 h-full bg-[#FF7A00]" />
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF7A00] flex items-center justify-center border border-orange-100 shadow-sm">
                                <FiBriefcase size={22} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-[0.1em]">Business Identity</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Official Organization Name *</label>
                                <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-6 py-5 bg-[#F8FAFC] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#FF7A00]/5 focus:border-[#FF7A00] transition-all text-base font-bold text-slate-900 placeholder:text-slate-300 shadow-inner" placeholder="e.g. Acme Corp" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Organization ID [Internal]</label>
                                <div className="px-6 py-5 border border-slate-100 rounded-2xl bg-slate-50 text-slate-400 text-base font-mono flex items-center gap-3 cursor-not-allowed">
                                    <FiBriefcase className="opacity-50" />
                                    {formData.slug}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Business Sector</label>
                                <div className="relative">
                                    <select name="industry" value={formData.industry} onChange={handleChange} className="w-full px-6 py-5 bg-[#F8FAFC] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#FF7A00]/5 focus:border-[#FF7A00] transition-all text-base font-bold text-slate-900 shadow-inner appearance-none">
                                        <option value="">Select Sector</option>
                                        <option value="IT">IT & Software</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Finance">Financial Services</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <FiSave size={16} className="rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Contact Details */}
                    <div className="bg-white p-14 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2.5 h-full bg-blue-500" />
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shadow-sm">
                                <FiMapPin size={22} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-[0.1em]">Connect & Location</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Operations Email *</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-6 py-5 bg-[#F8FAFC] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-base font-bold text-slate-900 shadow-inner" placeholder="operations@company.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Office Phone</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-6 py-5 bg-[#F8FAFC] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-base font-bold text-slate-900 shadow-inner" placeholder="+1 (555) 000-0000" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Operations */}
                    <div className="bg-white p-14 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2.5 h-full bg-purple-500" />
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100 shadow-sm">
                                <FiClock size={22} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-[0.1em]">Global Operations</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-10">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Regional Timezone *</label>
                                <select name="timezone" value={formData.timezone} onChange={handleChange} className="w-full px-6 py-5 bg-[#F8FAFC] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500 transition-all text-base font-bold text-slate-900 appearance-none shadow-inner">
                                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                    <option value="America/New_York">America/New_York (EST)</option>
                                    <option value="Europe/London">Europe/London (GMT)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="flex items-center justify-between pt-10 border-t border-slate-200">
                        <button 
                            type="button" 
                            onClick={() => router.back()} 
                            className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                        >
                            <FiArrowLeft /> Discard Changes
                        </button>
                        <button 
                            type="submit" 
                            disabled={saving} 
                            className="flex items-center gap-3 px-10 py-4 bg-[#FF7A00] hover:bg-[#E66D00] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/30 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Synchronizing...
                                </div>
                            ) : (
                                <><FiSave size={16} /> Deploy Configuration</>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
