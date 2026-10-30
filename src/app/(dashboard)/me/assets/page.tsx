"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiPackage } from "react-icons/fi";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

const TYPE_ICONS: Record<string, string> = {
    laptop: "💻", desktop: "🖥️", monitor: "🖥️", phone: "📱", tablet: "📱",
    furniture: "🪑", vehicle: "🚗", "id-card": "🪪", other: "📦",
};

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");

export default function MyAssetsPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get(API_ENDPOINTS.ASSETS_MY)
            .then((res) => setAssets(res.data.data || []))
            .catch((err) => console.error("Fetch error:", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="page-content" style={{ background: "var(--bg-primary)" }}>
            <div className="page-header" style={{ marginBottom: "24px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <Link href="/dashboard" style={{ color: "var(--text-muted)" }}><FiArrowLeft /></Link>
                        <h1 className="page-title" style={{ margin: 0 }}>My Assets</h1>
                    </div>
                    <p className="page-subtitle" style={{ marginLeft: "28px" }}>Company equipment currently issued to you. Return these to HR before your last working day.</p>
                </div>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    {loading ? <TableSkeleton rows={4} /> : assets.length === 0 ? (
                        <div style={{ padding: "60px 24px" }}>
                            <EmptyState icon={FiPackage} title="No assets issued" description="Laptops, phones, ID cards and other equipment issued to you will be listed here." />
                        </div>
                    ) : (
                        <table>
                            <thead><tr><th>Asset</th><th>Type</th><th>Brand / Model</th><th>Serial No.</th><th>Issued On</th><th>Condition</th></tr></thead>
                            <tbody>
                                {assets.map((a) => (
                                    <tr key={a._id}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontSize: "18px" }}>{TYPE_ICONS[a.type] || "📦"}</span>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{a.name}</div>
                                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>{a.assetId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{a.type}</td>
                                        <td>{[a.brand, a.model].filter(Boolean).join(" ") || "-"}</td>
                                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{a.serialNumber || "-"}</td>
                                        <td>{fmtDate(a.assignedDate)}</td>
                                        <td><span className={`badge ${a.condition === "new" || a.condition === "good" ? "active" : a.condition === "fair" ? "pending" : "inactive"}`}>{a.condition}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
