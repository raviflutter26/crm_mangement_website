"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiMail } from "react-icons/fi";

export default function EmailNotifPage() {
    return (
        <SuperAdminPage 
            slug="settings-email" 
            title="Email & Notifications" 
            subtitle="Configure global SMTP settings, SMS gateways, and system-wide notification templates." 
            icon={FiMail}
            primaryActionLabel="Test Delivery"
        />
    );
}
