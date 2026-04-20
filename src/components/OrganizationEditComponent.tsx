"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { FiArrowLeft, FiSave, FiBriefcase, FiMapPin, FiClock } from "react-icons/fi";

export default function OrganizationEditComponent({ id }: { id: string }) {
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
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Business Sector</label>
                                <select name="industry" value={formData.industry} onChange={handleChange} className="w-full px-6 py-5 bg-[#F8FAFC] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#FF7A00]/5 focus:border-[#FF7A00] transition-all text-base font-bold text-slate-900 shadow-inner">
                                    <option value="">Select Sector</option>
                                    <option value="IT">IT & Software</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Finance">Financial Services</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-10 border-t border-slate-200">
                        <button type="button" onClick={() => router.back()} className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                            <FiArrowLeft /> Discard Changes
                        </button>
                        <button type="submit" disabled={saving} className="flex items-center gap-3 px-10 py-4 bg-[#FF7A00] hover:bg-[#E66D00] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/30 active:scale-95 transition-all disabled:opacity-50">
                            {saving ? "Synchronizing..." : <><FiSave size={16} /> Deploy Configuration</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
