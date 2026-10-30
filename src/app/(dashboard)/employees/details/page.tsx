"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useAuth } from "@/lib/auth";
import EmployeeDetailsPage from "@/page_components/employees/EmployeeDetailsPage";

/** /employees/details?id=<employee id> — a linkable employee profile. */
function EmployeeDetails() {
    const id = useSearchParams().get("id") || "";
    const router = useRouter();
    const { user } = useAuth();
    const [employee, setEmployee] = useState<any>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        axiosInstance.get(`${API_ENDPOINTS.EMPLOYEES}/${encodeURIComponent(id)}`)
            .then(res => { if (!cancelled) setEmployee(res.data?.data || null); })
            .catch(err => { if (!cancelled) setError(err.response?.data?.message || "Could not load this employee."); });
        return () => { cancelled = true; };
    }, [id]);

    if (!id) return <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>No employee selected.</div>;
    if (error) return <div style={{ padding: 40, textAlign: "center", color: "#B91C1C" }}>{error}</div>;
    if (!employee) return <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading employee...</div>;

    return (
        <EmployeeDetailsPage
            employee={employee}
            currentUser={user}
            onBack={() => router.push("/employees")}
            onEdit={(emp) => router.push(`/employees?edit=${encodeURIComponent(emp?._id || id)}`)}
        />
    );
}

export default function EmployeeDetailsRoute() {
    return <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading...</div>}><EmployeeDetails /></Suspense>;
}
