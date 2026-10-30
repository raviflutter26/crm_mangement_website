"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiShield } from "react-icons/fi";

export default function MFAPoliciesPage() {
    return (
        <SuperAdminPage 
            slug="auth-mfa" 
            title="MFA Policies" 
            subtitle="Define global multi-factor authentication requirements for high-privilege accounts." 
            icon={FiShield}
            primaryActionLabel="New Policy"
        />
    );
}
