"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiFlag } from "react-icons/fi";

export default function FeatureFlagsPage() {
    return (
        <SuperAdminPage 
            slug="settings-features" 
            title="Feature Flags" 
            subtitle="Manage global feature rollouts, A/B tests, and tenant-specific entitlements." 
            icon={FiFlag}
            primaryActionLabel="New Flag"
        />
    );
}
