"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EmployeeStatutoryComponent from "@/components/EmployeeStatutoryComponent";

/** /employees/statutory?id=<employee id> — an employee's PF/ESI/PT details. */
function EmployeeStatutory() {
    const id = useSearchParams().get("id") || "";
    if (!id) return <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>No employee selected.</div>;
    return <EmployeeStatutoryComponent id={id} />;
}

export default function EmployeeStatutoryPage() {
    return <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading...</div>}><EmployeeStatutory /></Suspense>;
}
