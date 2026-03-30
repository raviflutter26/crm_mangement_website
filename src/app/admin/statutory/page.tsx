"use client";

import StatutoryPage from "@/components/StatutoryPage";
import { useAuth } from "@/lib/auth";

export default function AdminStatutoryPage() {
    // In a real app, we'd have a toast/notification system
    const showNotify = (type: string, msg: string) => {
        console.log(`${type.toUpperCase()}: ${msg}`);
        alert(msg);
    };

    return <StatutoryPage showNotify={showNotify as any} />;
}
