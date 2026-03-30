"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiKey } from "react-icons/fi";

export default function GatewayKeysPage() {
    return (
        <SuperAdminPage 
            slug="infra-gateway" 
            title="API Gateway & Keys" 
            subtitle="Manage global API access, rate limiting, and master integration keys." 
            icon={FiKey}
            primaryActionLabel="Generate Key"
        />
    );
}
