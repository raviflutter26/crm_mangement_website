"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiGlobe } from "react-icons/fi";

export default function CDNStoragePage() {
    return (
        <SuperAdminPage 
            slug="infra-cdn" 
            title="CDN & Storage" 
            subtitle="Monitor global asset distribution, cache hit ratios, and storage bucket health." 
            icon={FiGlobe}
            primaryActionLabel="Purge Cache"
        />
    );
}
