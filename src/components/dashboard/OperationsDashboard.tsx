"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import AdminOverview from "@/components/dashboard/AdminOverview";

/**
 * The admin / HR / manager overview (formerly /admin/dashboard, /hr/dashboard
 * and /manager/dashboard — identical screens). GET /api/dashboard is scoped
 * per role on the server, so a manager sees their team only.
 */
export default function OperationsDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("month");
    const role = String(user?.role || "").toLowerCase();

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD}?filter=${filter}`);
            setData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDashboard(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading || !data) {
        return <div style={{ padding: "100px", textAlign: "center", color: "#94A3B8" }}>{role === "manager" ? "Loading team metrics..." : "Loading organizational metrics..."}</div>;
    }

    const fallbackName = role === "hr" ? "HR" : role === "manager" ? "Manager" : "Admin";
    return <AdminOverview data={data} userName={user?.firstName || fallbackName} filter={filter} setFilter={setFilter} onRefresh={fetchDashboard} />;
}
