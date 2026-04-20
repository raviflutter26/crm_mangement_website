"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiMapPin } from "react-icons/fi";

export default function LocationTrackingPage() {
    return (
        <SuperAdminPage 
            slug="location-tracking" 
            title="Location Tracking" 
            subtitle="Monitor global asset movement and authorized operational zones." 
            icon={FiMapPin}
            primaryActionLabel="New Zone"
        />
    );
}
