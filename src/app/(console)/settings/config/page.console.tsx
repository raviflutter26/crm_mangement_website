"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiSettings } from "react-icons/fi";

export default function GlobalConfigPage() {
    return (
        <SuperAdminPage 
            slug="settings-config" 
            title="Global Configuration" 
            subtitle="Manage core system variables, branding, and platform-wide defaults." 
            icon={FiSettings}
            primaryActionLabel="Save Changes"
        />
    );
}
