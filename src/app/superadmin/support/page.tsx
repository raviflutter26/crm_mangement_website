"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiTag } from "react-icons/fi";

export default function SupportTicketsPage() {
    return (
        <SuperAdminPage 
            slug="support-tickets" 
            title="Support Tickets" 
            subtitle="Monitor and resolve system-wide support inquiries and high-priority incidents." 
            icon={FiTag}
            primaryActionLabel="New Ticket"
        />
    );
}
