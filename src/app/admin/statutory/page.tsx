"use client";

import StatutoryPage from "@/components/StatutoryPage";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/common/DialogProvider";

export default function AdminStatutoryPage() {
    const toast = useToast();
    const showNotify = (type: string, msg: string) => {
        console.log(`${type.toUpperCase()}: ${msg}`);
        if (type === "success") toast.success(msg);
        else if (type === "failure") toast.error(msg);
        else toast.info(msg);
    };

    return <StatutoryPage showNotify={showNotify as any} />;
}
