"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PLAN_FEATURES: Record<string, string[]> = {
  Starter: ["Up to 50 employees", "Core HR modules", "Email support", "Basic reports"],
  Professional: ["Up to 500 employees", "Advanced payroll", "Priority support", "Analytics & insights", "API access"],
  Enterprise: ["Unlimited employees", "Global compliance", "24/7 SLA", "Dedicated CSM", "Custom integrations", "White-labeling"],
};

// ─── Icons (Inline SVGs for compliance) ──────────────────────────────────────

const Icons = {
  Briefcase: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  ),
  UserContact: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM3 8l7.89 5.26a2 2 0 002.22 0L21 8" /></svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  CreditCard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
  ),
  ArrowLeft: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
  ),
  Globe: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
  ),
  Phone: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
  ),
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // The admin gets an emailed setup link; no password is ever shown or sent.
  const [setupInfo, setSetupInfo] = useState<{ email: string; emailSent: boolean } | null>(null);
  // Set when this form was opened from a demo request, which is closed once the org exists.
  const [fromDemo, setFromDemo] = useState<string | null>(null);
  const [industries, setIndustries] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Address dynamic settings
  const [statesList, setStatesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    companySize: "1-10",
    foundedYear: "",
    website: "",
    adminFirstName: "",
    adminLastName: "",
    email: "", 
    phone: "",
    address: { street: "", city: "", state: "", country: "India", pincode: "" },
    timezone: "Asia/Kolkata",
    weekStart: "Mon",
    startTime: "09:00",
    endTime: "18:00",
    planType: "Starter",
    billingCycle: "Monthly",
  });

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchStates = useCallback(async (country: string = "India") => {
    setLoadingStates(true);
    try {
      const res = await axiosInstance.get(`/api/organizations/locations/states?country=${country}`);
      if (res.data.success) {
        setStatesList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch states", err);
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const fetchCitiesForState = useCallback(async (stateName: string, country: string = "India") => {
    if (!stateName) return;
    setLoadingCities(true);
    try {
      const res = await axiosInstance.get(`/api/organizations/locations/cities?country=${country}&state=${encodeURIComponent(stateName)}`);
      if (res.data.success) {
        setCitiesList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch cities", err);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  // Pre-fill from a demo request ("Create org" on /superadmin/demo-requests). Read
  // from window.location rather than useSearchParams, which a static export would
  // need a Suspense boundary for.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (!q.get("fromDemo")) return;
    const [first, ...rest] = (q.get("contactName") || "").trim().split(/\s+/);
    setFromDemo(q.get("fromDemo"));
    setFormData(prev => ({
      ...prev,
      name: q.get("name") || prev.name,
      adminFirstName: first || prev.adminFirstName,
      adminLastName: rest.join(" ") || prev.adminLastName,
      email: q.get("email") || prev.email,
      phone: q.get("phone") || prev.phone,
    }));
  }, []);

  useEffect(() => {
    const initFetch = async () => {
      try {
        const res = await axiosInstance.get("/api/master/industries");
        if (res.data.success) setIndustries(res.data.data);
      } catch (err) {
        console.error("Failed to fetch industries", err);
      }
      fetchStates();
    };
    initFetch();
  }, [fetchStates]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Business name is required";
      if (!formData.industry) newErrors.industry = "Industry is required";
    }
    if (step === 2) {
      if (!formData.adminFirstName.trim()) newErrors.adminFirstName = "First name is required";
      if (!formData.adminLastName.trim()) newErrors.adminLastName = "Last name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(s => Math.min(5, s + 1));
  };

  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const handleChange = (field: string, value: any, section?: string) => {
    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...(prev as any)[section], [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        orgData: {
          name: formData.name,
          industry: formData.industry,
          companySize: formData.companySize,
          foundedYear: parseInt(formData.foundedYear || "2024"),
          email: formData.email, 
          phone: formData.phone,
          address: formData.address,
          settings: {
            attendance: { timezone: formData.timezone, workingHours: 8, defaultStartTime: formData.startTime, defaultEndTime: formData.endTime },
            payroll: { currency: "INR", payrollCycle: "Monthly", epfEnabled: true, esiEnabled: true },
          },
          planType: formData.planType,
          billingCycle: formData.billingCycle,
          maxEmployees: formData.planType === "Starter" ? 50 : formData.planType === "Professional" ? 500 : 9999,
        },
        admin: {
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          email: formData.email,
          // No password: the backend emails the admin a link to set one.
        },
      };
      const res = await axiosInstance.post("/api/organizations", payload);
      const admin = res.data?.data?.admin;
      setSetupInfo({ email: admin?.email ?? formData.email, emailSent: admin?.setupEmailSent !== false });
      if (fromDemo) {
        // Best effort: the organization exists either way.
        axiosInstance.patch(`/api/demo-requests/${fromDemo}/status`, { status: "closed" }).catch(() => {});
      }
      setSuccess(true);
    } catch (err: any) {
      // A validation rejection carries a message from the API; a timeout or a
      // dropped request carries no response at all. Telling the user to "review
      // the details" in the second case sends them hunting for a data problem
      // that isn't there — and the organization may in fact have been created,
      // so it must not read as a clean failure either.
      const apiMessage = err.response?.data?.message;
      if (apiMessage) {
        setSubmitError(apiMessage);
      } else if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
        setSubmitError(
          "The server did not respond in time. The organization may still have been created — check the organizations list before trying again."
        );
      } else {
        setSubmitError("Could not reach the server. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: "Identity", icon: Icons.Briefcase },
    { id: 2, label: "Admin & Contact", icon: Icons.UserContact },
    { id: 3, label: "Operations", icon: Icons.Settings },
    { id: 4, label: "Agreement", icon: Icons.CreditCard },
    { id: 5, label: "Review", icon: Icons.Check },
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12 font-sans text-slate-900">
        <div className="max-w-lg w-full bg-white border-[0.5px] border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-6">
            <Icons.Check />
          </div>
          <h2 className="text-xl font-bold text-[#1E2A3A] mb-2">Organization Created</h2>
          <p className="text-sm text-slate-500 mb-8">
            <span className="font-semibold text-[#1E2A3A]">{formData.name}</span> is live on the platform.
          </p>

          {setupInfo && (
            <div className="text-left bg-gray-50 border border-slate-200 rounded-xl p-5 mb-8">
              <div className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-3">Administrator Access</div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-slate-400">Email</span>
                <span className="text-xs font-bold">{setupInfo.email}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {setupInfo.emailSent
                  ? "A link to set their password has been emailed to the administrator. It expires in 24 hours."
                  : "The setup email could not be sent. The administrator can use \"Forgot password\" on the login page to receive a setup link once email delivery is working."}
              </p>
            </div>
          )}

          <button
            onClick={() => router.push("/superadmin/organizations")}
            className="w-full h-12 bg-[#1E2A3A] text-white rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
          >
            Go to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="bg-[#1E2A3A] text-white py-12 px-6">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Organization</h1>
            <p className="text-slate-400 mt-2 font-medium uppercase tracking-widest text-xs flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Registration System V2.4
            </p>
          </div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider">
            <Icons.ArrowLeft /> Cancel Session
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-[1280px] mx-auto w-full px-6 -mt-8 relative z-20">
        <div className="bg-white border-[0.5px] border-slate-200 rounded-2xl p-6 flex items-center justify-between">
          {steps.map((s, idx) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 flex-1 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? "bg-[#F97316] text-white" : isCompleted ? "bg-[#F3F4F6] text-[#F97316]" : "bg-[#F9FAFB] text-slate-300"}`}>
                  {isCompleted ? <Icons.Check /> : <Icon />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? "text-[#1E2A3A]" : "text-slate-400"}`}>{s.label}</span>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute left-1/2 w-full top-5 h-[2px] bg-gray-100 -z-10 translate-x-[20px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-[1280px] mx-auto w-full flex-1 px-6 py-12">
        <div className="bg-white border-[0.5px] border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-10 min-h-[500px] flex flex-col">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold mb-8 text-[#1E2A3A]">Business Identity</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Official Business Name <span className="text-orange-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Icons.Briefcase /></div>
                      <input 
                        className={`w-full h-12 pl-12 pr-4 bg-gray-50 border ${errors.name ? "border-red-500" : "border-slate-200"} rounded-lg focus:outline-none focus:border-[#F97316] transition-colors`}
                        placeholder="e.g. Acme Corporation Global" 
                        value={formData.name} onChange={e => handleChange("name", e.target.value)} 
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Industry <span className="text-orange-500">*</span></label>
                    <select className={`w-full h-12 px-4 bg-gray-50 border ${errors.industry ? "border-red-500" : "border-slate-200"} rounded-lg focus:outline-none focus:border-[#F97316]`} value={formData.industry} onChange={e => handleChange("industry", e.target.value)}>
                      <option value="">Select Domain</option>
                      {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                    {errors.industry && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.industry}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Company size</label>
                    <select className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" value={formData.companySize} onChange={e => handleChange("companySize", e.target.value)}>
                      <option value="1-10">1–10 Scale</option>
                      <option value="11-50">11–50 Scale</option>
                      <option value="51-200">51–200 Scale</option>
                      <option value="200+">200+ Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Founded Year</label>
                    <input className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" type="number" placeholder="2024" value={formData.foundedYear} onChange={e => handleChange("foundedYear", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Company website</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Icons.Globe /></div>
                      <input className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" placeholder="https://portal.company" value={formData.website} onChange={e => handleChange("website", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold mb-8 text-[#1E2A3A]">Primary Admin & Contact Information</h2>
                
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#F97316] rounded-full" /> Administrator Identity
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">First name <span className="text-orange-500">*</span></label>
                    <input className={`w-full h-12 px-4 bg-gray-50 border ${errors.adminFirstName ? "border-red-500" : "border-slate-200"} rounded-lg focus:outline-none focus:border-[#F97316]`} placeholder="Jane" value={formData.adminFirstName} onChange={e => handleChange("adminFirstName", e.target.value)} />
                    {errors.adminFirstName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.adminFirstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Last name <span className="text-orange-500">*</span></label>
                    <input className={`w-full h-12 px-4 bg-gray-50 border ${errors.adminLastName ? "border-red-500" : "border-slate-200"} rounded-lg focus:outline-none focus:border-[#F97316]`} placeholder="Smith" value={formData.adminLastName} onChange={e => handleChange("adminLastName", e.target.value)} />
                    {errors.adminLastName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.adminLastName}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Email Address (Login & Billing) <span className="text-orange-500">*</span></label>
                    <input className={`w-full h-12 px-4 bg-gray-50 border ${errors.email ? "border-red-500" : "border-slate-200"} rounded-lg focus:outline-none focus:border-[#F97316]`} placeholder="admin@company.com" value={formData.email} onChange={e => handleChange("email", e.target.value)} />
                    {errors.email && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.email}</p>}
                  </div>
                </div>

                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#F97316] rounded-full" /> Headquarters Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Street address</label>
                    <input className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" placeholder="Tower A, Cyber City, Suite 404" value={formData.address.street} onChange={e => handleChange("street", e.target.value, "address")} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Phone number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Icons.Phone /></div>
                      <input className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" placeholder="+91 00000 00000" value={formData.phone} onChange={e => handleChange("phone", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Country</label>
                      <select 
                        className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" 
                        value={formData.address.country} 
                        onChange={e => {
                          handleChange("country", e.target.value, "address");
                          fetchStates(e.target.value);
                          handleChange("state", "", "address");
                          setCitiesList([]);
                        }}
                      >
                        <option value="India">India</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">State {loadingStates && "..."}</label>
                      <select 
                        className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" 
                        value={formData.address.state}
                        disabled={loadingStates}
                        onChange={e => {
                          handleChange("state", e.target.value, "address");
                          handleChange("city", "", "address");
                          setCitiesList([]);
                          fetchCitiesForState(e.target.value, formData.address.country);
                        }}
                      >
                        <option value="">Select State</option>
                        {statesList.map(st => <option key={st.state_code || st.name} value={st.name}>{st.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">City {loadingCities && "..."}</label>
                      <select 
                        className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" 
                        value={formData.address.city}
                        disabled={!formData.address.state || loadingCities}
                        onChange={e => handleChange("city", e.target.value, "address")}
                      >
                        <option value="">{loadingCities ? "Loading..." : "Select City"}</option>
                        {citiesList.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                      </select>
                    </div>
                    <div>
                       <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Postal code</label>
                       <input className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" placeholder="411045" value={formData.address.pincode} onChange={e => handleChange("pincode", e.target.value, "address")} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold mb-8 text-[#1E2A3A]">Operational Rules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">System timezone</label>
                    <select className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" value={formData.timezone} onChange={e => handleChange("timezone", e.target.value)}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Work week starts on</label>
                    <select className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" value={formData.weekStart} onChange={e => handleChange("weekStart", e.target.value)}>
                      <option value="Mon">Monday</option>
                      <option value="Sun">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Work start time</label>
                    <input className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" type="time" value={formData.startTime} onChange={e => handleChange("startTime", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Work end time</label>
                    <input className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" type="time" value={formData.endTime} onChange={e => handleChange("endTime", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold mb-8 text-[#1E2A3A]">Service Plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {["Starter", "Professional", "Enterprise"].map(plan => (
                    <button 
                      key={plan}
                      onClick={() => handleChange("planType", plan)}
                      className={`p-6 rounded-xl border-[0.5px] text-left transition-all ${formData.planType === plan ? "border-[#F97316] bg-orange-50/30" : "border-slate-200 hover:border-[#1E2A3A]"}`}
                    >
                      <h3 className={`font-bold mb-1 ${formData.planType === plan ? "text-[#F97316]" : "text-[#1E2A3A]"}`}>{plan}</h3>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Click to select this tier for your organization.</p>
                      <div className="space-y-2">
                        {PLAN_FEATURES[plan].slice(0, 3).map(f => (
                          <div key={f} className="flex items-center gap-2 text-[11px] text-slate-600">
                            <div className="text-[#F97316]"><Icons.Check /></div>{f}
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="max-w-md mx-auto">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Billing cycle</label>
                  <select className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]" value={formData.billingCycle} onChange={e => handleChange("billingCycle", e.target.value)}>
                    <option value="Monthly">Monthly Cycle</option>
                    <option value="Quarterly">Quarterly (5% Delta)</option>
                    <option value="Annually">Annually (15% Efficiency)</option>
                  </select>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold mb-8 text-[#1E2A3A]">Final Review</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12 border-b border-slate-100 pb-12">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 border-b pb-2 border-slate-100">Organization Identity</h3>
                    <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Company Name</span><span className="text-xs font-bold">{formData.name}</span></div>
                    <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Industry</span><span className="text-xs font-bold">{formData.industry || "—"}</span></div>
                    <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Headquarters</span><span className="text-xs font-bold">{formData.address.city}, {formData.address.state}, {formData.address.country}</span></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 border-b pb-2 border-slate-100">Contact & Authority</h3>
                    <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Administrator</span><span className="text-xs font-bold">{formData.adminFirstName} {formData.adminLastName}</span></div>
                    <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Email Login</span><span className="text-xs font-bold">{formData.email}</span></div>
                    <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Phone</span><span className="text-xs font-bold">{formData.phone || "—"}</span></div>
                  </div>
                </div>

                <div className="bg-[#1E2A3A] rounded-2xl p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Icons.Briefcase /></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-[#F97316] text-[10px] font-bold uppercase rounded-full">Selected Plan</span>
                        <h4 className="text-2xl font-bold">{formData.planType} Tier</h4>
                      </div>
                      <p className="text-slate-400 text-xs mb-0">Billed {formData.billingCycle.toLowerCase()} · Full platform access</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      {PLAN_FEATURES[formData.planType].map(f => (
                        <div key={f} className="flex items-center gap-2 text-[10px] font-medium text-slate-300">
                          <div className="text-[#F97316]"><Icons.Check /></div>{f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mt-6 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
                {submitError}
              </div>
            )}

            <div className="mt-auto pt-10 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleBack}
                className={`flex items-center gap-2 text-slate-400 hover:text-[#1E2A3A] transition-colors text-xs font-bold uppercase tracking-widest ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
              >
                <Icons.ArrowLeft /> Back
              </button>
              {step === 5 ? (
                <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="bg-[#1E2A3A] text-white px-10 py-4 rounded-full font-bold text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? "Processing..." : "Register Organization"}
                </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="bg-[#1E2A3A] text-white px-10 py-4 rounded-full font-bold text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-[0.98]"
                >
                  Next Step <Icons.ChevronRight />
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border-t-[0.5px] border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#F97316] rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Core Verified</span>
              </div>
              <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Sharding V4</span>
              </div>
            </div>
            <button className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity">
              Request Assistance <Icons.ChevronRight />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
