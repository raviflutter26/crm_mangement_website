"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiClock } from "react-icons/fi";

export default function SessionMgmtPage() {
    return (
        <SuperAdminPage 
            slug="auth-sessions" 
            title="Session Management" 
            subtitle="Monitor and control active administrative sessions across the platform." 
            icon={FiClock}
            primaryActionLabel="Invalidate All"
        />
    );
}
