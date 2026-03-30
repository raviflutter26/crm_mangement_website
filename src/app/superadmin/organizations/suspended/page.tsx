"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiLayers } from "react-icons/fi";

export default function SuspendedOrgsPage() {
    return (
        <SuperAdminPage 
            slug="org-suspended" 
            title="Suspended Organizations" 
            subtitle="Organizations with restricted access due to billing or compliance policy violations." 
            icon={FiLayers}
            primaryActionLabel="Batch Unlock"
        />
    );
}
