"use client";
import SuperAdminPage from "@/page_components/superadmin/SuperAdminPage";
import { FiDatabase } from "react-icons/fi";

export default function DatabaseBackupsPage() {
    return (
        <SuperAdminPage 
            slug="infra-database" 
            title="Database & Backups" 
            subtitle="Monitor database health, cluster persistence, and automated backup schedules." 
            icon={FiDatabase}
            primaryActionLabel="Trigger Backup"
        />
    );
}
