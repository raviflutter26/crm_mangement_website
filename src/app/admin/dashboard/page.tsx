"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import AdminOverview from "@/components/dashboard/AdminOverview";

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("month");

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            // In a real app, this would be a unified stats endpoint
            // For now, we'll fetch collective data
            const res = await axiosInstance.get(`${API_ENDPOINTS.DASHBOARD}?filter=${filter}`);
            setData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [filter]);

    if (loading || !data) return <div style={{ padding: "100px", textAlign: "center", color: "#94A3B8" }}>Loading organizational metrics...</div>;

    return (
        <AdminOverview 
            data={data} 
            userName={user?.firstName || "Admin"} 
            filter={filter} 
            setFilter={setFilter} 
            onRefresh={fetchDashboard} 
        />
    );
}
