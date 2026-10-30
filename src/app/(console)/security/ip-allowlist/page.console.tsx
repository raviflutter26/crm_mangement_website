"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiGlobe } from "react-icons/fi";

export default function IPAllowlistPage() {
    return (
        <SuperAdminPage 
            slug="auth-ip-allowlist" 
            title="IP Allowlist" 
            subtitle="Restrict administrative access to specific or authorized IP ranges across the platform." 
            icon={FiGlobe}
            primaryActionLabel="Add IP Range"
        />
    );
}
