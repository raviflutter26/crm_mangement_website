"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiLayers } from "react-icons/fi";

export default function PendingOrgsPage() {
    return (
        <SuperAdminPage 
            slug="org-pending" 
            title="Pending Approvals" 
            subtitle="Organizations awaiting administrative confirmation to join the platform." 
            icon={FiLayers}
            primaryActionLabel="Approve Batch"
        />
    );
}
