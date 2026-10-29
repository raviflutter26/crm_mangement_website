"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiNavigation, FiRefreshCcw, FiExternalLink, FiSearch } from "react-icons/fi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";

dayjs.extend(relativeTime);

type LastLocation = {
    employee: { _id: string; name: string; employeeId?: string | null; department?: string | null } | null;
    attendanceId: string;
    at: string | null;
    source: string;
    latitude: number;
    longitude: number;
    locationName: string | null;
    mapsUrl: string;
};

/** Each employee's latest known check-in position, from GET /attendance/last-locations. No map library: links out to Google Maps. */
export default function LocationTrackingPage() {
    const [rows, setRows] = useState<LastLocation[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.ATTENDANCE_LAST_LOCATIONS);
            setRows(res.data.data || []);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Couldn't load last known locations.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r => [r.employee?.name, r.employee?.employeeId, r.employee?.department, r.locationName]
            .some(v => String(v || "").toLowerCase().includes(q)));
    }, [rows, query]);

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Location Tracking</h1>
                    <p className="page-subtitle">Where each person last checked in with their location shared.</p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ position: "relative" }}>
                        <FiSearch aria-hidden="true" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                            type="search"
                            className="form-input"
                            aria-label="Search employees or locations"
                            placeholder="Search employee or location"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            style={{ paddingLeft: 32, minWidth: 220 }}
                        />
                    </div>
                    <button className="btn btn-secondary" onClick={load} disabled={loading}>
                        <FiRefreshCcw /> {loading ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
            </div>

            {error ? (
                <EmptyState title="Locations unavailable" description={error} icon={FiNavigation} actionLabel="Try again" onAction={load} />
            ) : loading && rows.length === 0 ? (
                <div className="card" style={{ padding: 24, color: "var(--text-muted)" }}>Loading…</div>
            ) : visible.length === 0 ? (
                <EmptyState
                    title={rows.length === 0 ? "No locations recorded yet" : "No matches"}
                    description={rows.length === 0 ? "Positions appear once people check in from a device that shares its location." : "Try a different name or location."}
                    icon={FiNavigation}
                />
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Last known positions</h3>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{visible.length} {visible.length === 1 ? "person" : "people"}</span>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Last seen</th>
                                    <th>Location</th>
                                    <th>Coordinates</th>
                                    <th>Map</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map(r => (
                                    <tr key={r.attendanceId}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{r.employee?.name || "—"}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                                {[r.employee?.employeeId, r.employee?.department].filter(Boolean).join(" · ") || "—"}
                                            </div>
                                        </td>
                                        <td>
                                            {r.at ? (
                                                <time dateTime={r.at} title={dayjs(r.at).format("DD MMM YYYY, HH:mm")}>{dayjs(r.at).fromNow()}</time>
                                            ) : "—"}
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>{r.source}</div>
                                        </td>
                                        <td>{r.locationName || "—"}</td>
                                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>{r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</td>
                                        <td>
                                            <a
                                                href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary btn-sm"
                                                aria-label={`Open ${r.employee?.name || "this position"} in Google Maps (new tab)`}
                                            >
                                                <FiExternalLink aria-hidden="true" /> Open in Google Maps
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
