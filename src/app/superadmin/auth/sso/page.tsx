"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiLock } from "react-icons/fi";

export default function SSOProvidersPage() {
    return (
        <SuperAdminPage 
            slug="auth-sso" 
            title="SSO Providers" 
            subtitle="Configure enterprise identity providers (SAML, OIDC) for global authentication." 
            icon={FiLock}
            primaryActionLabel="Add Provider"
        />
    );
}
