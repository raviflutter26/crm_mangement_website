"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiUsers } from "react-icons/fi";

export default function SuperAdminSeatsPage() {
    return (
        <SuperAdminPage 
            slug="superadmin-seats" 
            title="Super Admin Seats" 
            subtitle="Manage global administrative access and seat allocation for the command center." 
            icon={FiUsers}
            primaryActionLabel="Provision Seat"
        />
    );
}
