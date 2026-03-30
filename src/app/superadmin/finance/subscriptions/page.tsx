"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiPackage } from "react-icons/fi";

export default function SubscriptionsPage() {
    return (
        <SuperAdminPage 
            slug="finance-subscriptions" 
            title="Subscription Plans" 
            subtitle="Define and manage global SaaS subscription tiers and feature entitlements." 
            icon={FiPackage}
            primaryActionLabel="New Plan"
        />
    );
}
