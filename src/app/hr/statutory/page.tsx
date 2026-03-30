"use client";

import StatutoryPage from "@/components/StatutoryPage";

export default function HRStatutoryPage() {
    const showNotify = (type: string, msg: string) => {
        console.log(`${type.toUpperCase()}: ${msg}`);
        alert(msg);
    };

    return <StatutoryPage showNotify={showNotify as any} />;
}
