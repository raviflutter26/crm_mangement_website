"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiDollarSign } from "react-icons/fi";

export default function RevenueInvoicesPage() {
    return (
        <SuperAdminPage 
            slug="finance-revenue" 
            title="Revenue & Invoices" 
            subtitle="Monitor global platform earnings, invoice history, and settlement statuses." 
            icon={FiDollarSign}
            primaryActionLabel="Export Ledger"
        />
    );
}
