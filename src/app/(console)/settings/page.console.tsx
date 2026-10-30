"use client";

import { FiSettings, FiShield, FiGlobe, FiDatabase } from "react-icons/fi";

export default function PlatformSettingsPage() {
    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-[#1E293B]">Platform Settings</h1>
                    <p className="text-[#64748B] mt-2">Global configuration and core system management.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-start gap-4 hover:border-[#FF7A00] transition-colors cursor-pointer">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF7A00] flex items-center justify-center shrink-0">
                            <FiGlobe size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#1E293B]">Global Variables</h3>
                            <p className="text-sm text-[#64748B] mt-1">Configure application-wide defaults like default timezone and currency.</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-start gap-4 hover:border-[#FF7A00] transition-colors cursor-pointer">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <FiShield size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#1E293B]">Security Rules</h3>
                            <p className="text-sm text-[#64748B] mt-1">Manage global SSO configurations, password policies, and session limits.</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-start gap-4 hover:border-[#FF7A00] transition-colors cursor-pointer">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF7A00] flex items-center justify-center shrink-0">
                            <FiDatabase size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#1E293B]">Data Backups</h3>
                            <p className="text-sm text-[#64748B] mt-1">Configure automated backup intervals and retention policies.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
