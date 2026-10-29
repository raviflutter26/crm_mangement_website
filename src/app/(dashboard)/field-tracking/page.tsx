"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axios";
import { FiMapPin, FiRefreshCcw, FiExternalLink } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";

type FieldCheckIn = {
    _id: string;
    employee: { _id: string; name: string; employeeId?: string | null; department?: string | null } | null;
    checkIn: string;
    checkOut?: string | null;
    status: string;
    isLate: boolean;
    source: string;
    latitude: number | null;
    longitude: number | null;
    locationName: string | null;
    assignedLocation: string | null;
    distanceMeters: number | null;
    geofenceRadiusMeters: number | null;
    mapsUrl: string | null;
};

const SOURCE_LABEL: Record<string, string> = { gps: "GPS", mobile: "Mobile", biometric: "Biometric", web: "Web", manual: "Manual", system: "System" };

const fmtTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");
const fmtDistance = (m: number | null) => (m === null ? "—" : m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
const isBeyond = (r: FieldCheckIn) => r.distanceMeters !== null && r.geofenceRadiusMeters !== null && r.distanceMeters > r.geofenceRadiusMeters;

/** Today's site/GPS check-ins in the caller's scope, from GET /attendance/field-today. */
export default function FieldTrackingPage() {
    const [rows, setRows] = useState<FieldCheckIn[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [location, setLocation] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.ATTENDANCE_FIELD_TODAY);
            setRows(res.data.data || []);
            setLocations(res.data.locations || []);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Couldn't load today's field check-ins.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const visible = useMemo(
        () => (location ? rows.filter(r => (r.locationName || "") === location) : rows),
        [rows, location]
    );
    const outside = visible.filter(isBeyond).length;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Field Team Tracking</h1>
                    <p className="page-subtitle">Today&apos;s site and GPS check-ins for the people you look after.</p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                        aria-label="Filter by location"
                        className="form-input"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        style={{ minWidth: 180 }}
                    >
                        <option value="">All locations</option>
                        {locations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button className="btn btn-secondary" onClick={load} disabled={loading}>
                        <FiRefreshCcw /> {loading ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
            </div>

            <div className="grid-3" style={{ marginBottom: 24, gap: 16 }}>
                <Stat label="Field check-ins today" value={visible.length} />
                <Stat label="Still on site" value={visible.filter(r => !r.checkOut).length} />
                <Stat label="Outside geofence" value={outside} tone={outside > 0 ? "bad" : undefined} />
            </div>

            {error ? (
                <EmptyState title="Field check-ins unavailable" description={error} icon={FiMapPin} actionLabel="Try again" onAction={load} />
            ) : loading && rows.length === 0 ? (
                <div className="card" style={{ padding: 24, color: "var(--text-muted)" }}>Loading…</div>
            ) : visible.length === 0 ? (
                <EmptyState
                    title="No field check-ins today"
                    description={location ? `Nobody has checked in at ${location} today.` : "Check-ins from GPS, mobile or biometric devices appear here as they happen."}
                    icon={FiMapPin}
                />
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Today&apos;s check-ins</h3>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{visible.length} total</span>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Checked in</th>
                                    <th>Checked out</th>
                                    <th>Source</th>
                                    <th>Location</th>
                                    <th>Coordinates</th>
                                    <th>Distance from site</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map(r => {
                                    const beyond = isBeyond(r);
                                    return (
                                        <tr key={r._id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{r.employee?.name || "—"}</div>
                                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                                    {[r.employee?.employeeId, r.employee?.department].filter(Boolean).join(" · ") || "—"}
                                                </div>
                                            </td>
                                            <td>
                                                {fmtTime(r.checkIn)}
                                                {r.isLate && <span className="badge pending" style={{ marginLeft: 6 }}>Late</span>}
                                            </td>
                                            <td>{fmtTime(r.checkOut)}</td>
                                            <td>{SOURCE_LABEL[r.source] || r.source}</td>
                                            <td>
                                                <div>{r.locationName || "—"}</div>
                                                {r.assignedLocation && r.assignedLocation !== r.locationName && (
                                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Assigned: {r.assignedLocation}</div>
                                                )}
                                            </td>
                                            <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                                                {r.latitude !== null && r.longitude !== null && r.mapsUrl ? (
                                                    <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}
                                                        aria-label={`${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)} — open in Google Maps (new tab)`}>
                                                        {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)} <FiExternalLink aria-hidden="true" />
                                                    </a>
                                                ) : "—"}
                                            </td>
                                            <td style={{ color: beyond ? "var(--error)" : undefined, fontWeight: beyond ? 700 : undefined }}>
                                                {fmtDistance(r.distanceMeters)}
                                                {beyond && <span style={{ fontSize: 12 }}> (outside {r.geofenceRadiusMeters} m)</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "bad" }) {
    return (
        <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: tone === "bad" ? "var(--error)" : "var(--text-primary)" }}>{value}</div>
        </div>
    );
}
