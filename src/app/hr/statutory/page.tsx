"use client";

import StatutoryPage from "@/components/StatutoryPage";
import { useToast } from "@/components/common/DialogProvider";

export default function HRStatutoryPage() {
    const toast = useToast();
    const showNotify = (type: string, msg: string) => {
        console.log(`${type.toUpperCase()}: ${msg}`);
        if (type === "success") toast.success(msg);
        else if (type === "failure") toast.error(msg);
        else toast.info(msg);
    };

    return <StatutoryPage showNotify={showNotify as any} />;
}
