"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiServer } from "react-icons/fi";

export default function ServerShardingPage() {
    return (
        <SuperAdminPage 
            slug="infra-server" 
            title="Server & Sharding" 
            subtitle="Monitor infrastructure health, cluster distribution, and request load across shards." 
            icon={FiServer}
            primaryActionLabel="Provision Node"
        />
    );
}
