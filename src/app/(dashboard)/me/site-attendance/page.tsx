"use client";

import React, { useState, useEffect } from "react";
import { FiMapPin, FiNavigation, FiRadio, FiCheckCircle, FiShield, FiAlertTriangle, FiLogOut } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

type Status = "idle" | "scanning" | "verified" | "error";

function getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by this browser."));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
        });
    });
}

export default function SiteAttendancePage() {
    const { user } = useAuth();
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [checkedInAt, setCheckedInAt] = useState<Date | null>(null);
    const [isAlreadyCheckedIn, setIsAlreadyCheckedIn] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);

    const fetchStatus = async () => {
        if (!user) return;
        try {
            const historyRes = await axiosInstance.get(`${API_ENDPOINTS.ATTENDANCE}?employeeId=${user._id}`);
            const history = historyRes.data.data || [];
            const openRecord = history.find((h: any) => h.sessions?.some((s: any) => !s.checkOut));
            if (openRecord) {
                const openSession = openRecord.sessions.find((s: any) => !s.checkOut);
                setIsAlreadyCheckedIn(true);
                setCheckedInAt(new Date(openSession.checkIn));
                setStatus("verified");
            } else {
                setIsAlreadyCheckedIn(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLocations = async () => {
        try {
            const params = user?.organizationId ? `?organizationId=${user.organizationId}` : "";
            const res = await axiosInstance.get(`${API_ENDPOINTS.LOCATIONS}${params}`);
            setLocations(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchLocations();
    }, [user]);

    const handleScan = async () => {
        setStatus("scanning");
        setErrorMsg("");
        try {
            const position = await getPosition();
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setCoords({ lat, lng });

            await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_IN, {
                employeeId: user?._id,
                source: "gps",
                latitude: lat,
                longitude: lng,
            });

            setCheckedInAt(new Date());
            setIsAlreadyCheckedIn(true);
            setStatus("verified");
        } catch (err: any) {
            const message =
                err?.code === 1 // GeolocationPositionError.PERMISSION_DENIED
                    ? "Location permission denied. Please allow location access to verify attendance."
                    : err?.response?.data?.message || err?.message || "Verification failed.";
            setErrorMsg(message);
            setStatus("error");
        }
    };

    const handleCheckOut = async () => {
        setStatus("scanning");
        setErrorMsg("");
        try {
            const position = await getPosition().catch(() => null);
            await axiosInstance.post(API_ENDPOINTS.ATTENDANCE_CHECK_OUT, {
                employeeId: user?._id,
                latitude: position?.coords.latitude,
                longitude: position?.coords.longitude,
            });
            setIsAlreadyCheckedIn(false);
            setCheckedInAt(null);
            setCoords(null);
            setStatus("idle");
        } catch (err: any) {
            setErrorMsg(err?.response?.data?.message || err?.message || "Check-out failed.");
            setStatus("error");
        }
    };

    return (
        <div className="page-content" style={{ background: 'var(--bg-primary)' }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header"
            >
                <div>
                    <h1 className="page-title" style={{ fontSize: "28px", fontWeight: 950 }}>Site Attendance</h1>
                    <p className="page-subtitle">GPS-verified attendance for field-based operations.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                   <div style={{
                       background: 'white', padding: '8px 16px', borderRadius: '12px',
                       border: '1px solid var(--border-light)', display: 'flex',
                       alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700
                    }}>
                       <FiShield style={{ color: '#10b981' }} /> Secure Endpoint
                   </div>
                </div>
            </motion.div>

            <div className="grid-2" style={{ gridTemplateColumns: "1fr 400px", gap: "32px", marginTop: "32px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Main Interaction Card */}
                    <motion.div
                        className="card"
                        style={{
                            padding: "40px", textAlign: "center", border: "1px solid var(--border-light)",
                            background: "linear-gradient(to bottom, #ffffff, #f8fafc)"
                        }}
                    >
                        <div style={{
                            width: "120px", height: "120px", borderRadius: "40px",
                            background: status === 'verified' ? '#f0fdf4' : status === 'error' ? '#fef2f2' : '#fff7ed',
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 32px", color: status === 'verified' ? '#10b981' : status === 'error' ? '#ef4444' : 'var(--primary)',
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)"
                        }}>
                            {status === 'scanning' ? <FiRadio className="rotate" size={48} /> :
                             status === 'verified' ? <FiCheckCircle size={48} /> :
                             status === 'error' ? <FiAlertTriangle size={48} /> :
                             <FiMapPin size={48} />}
                        </div>

                        <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>
                            {status === 'idle' ? "Ready to Verify" :
                             status === 'scanning' ? "Reading device location..." :
                             status === 'error' ? "Verification Failed" :
                             "Location Verified"}
                        </h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "400px", margin: "0 auto 32px" }}>
                            {status === 'idle' ? "Your device's GPS coordinates will be captured and logged with your check-in." :
                             status === 'scanning' ? "Requesting location permission from your browser..." :
                             status === 'error' ? errorMsg :
                             coords ? `Checked in at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}.` : "Checked in."}
                        </p>

                        <AnimatePresence mode="wait">
                            {status === 'idle' || status === 'error' ? (
                                <motion.button
                                    key="scan-btn"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="btn btn-primary"
                                    style={{ padding: "16px 48px", fontSize: "16px", fontWeight: 800, borderRadius: "16px" }}
                                    onClick={handleScan}
                                >
                                    <FiNavigation /> START VERIFICATION
                                </motion.button>
                            ) : status === 'verified' ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                                    <motion.div
                                        key="success-badge"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: "10px",
                                            background: "#f0fdf4", color: "#10b981", padding: "12px 24px",
                                            borderRadius: "100px", fontWeight: 800, fontSize: "14px",
                                            border: "1px solid #dcfce7"
                                        }}
                                    >
                                        <FiCheckCircle /> CHECKED IN {checkedInAt ? `AT ${checkedInAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}
                                    </motion.div>
                                    {isAlreadyCheckedIn && (
                                        <button
                                            className="btn"
                                            style={{ padding: "12px 32px", fontSize: "14px", fontWeight: 800, borderRadius: "14px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}
                                            onClick={handleCheckOut}
                                        >
                                            <FiLogOut /> CHECK OUT
                                        </button>
                                    )}
                                </div>
                            ) : null}
                        </AnimatePresence>
                    </motion.div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "20px" }}>Registered Sites</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {locations.length === 0 ? (
                                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                                    No sites registered for your organization yet.
                                </div>
                            ) : (
                                locations.map((loc) => (
                                    <LocationTile key={loc._id} name={loc.name} sub={[loc.branch, loc.city].filter(Boolean).join(" · ")} />
                                ))
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ padding: "24px", border: "1px solid var(--border-light)", background: "#fff7ed" }}>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <FiAlertTriangle style={{ color: "var(--primary)", flexShrink: 0 }} size={20} />
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 800, color: "#92400e" }}>Compliance Note</div>
                                <div style={{ fontSize: "12px", color: "#b45309", marginTop: "4px", lineHeight: "1.5" }}>
                                    Your location is only captured at the moment of check-in/check-out.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LocationTile({ name, sub }: { name: string; sub: string }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px", borderRadius: "12px", background: "#f8fafc",
            border: "1px solid #e2e8f0"
        }}>
            <div>
                <div style={{ fontSize: "13px", fontWeight: 800 }}>{name}</div>
                {sub && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{sub}</div>}
            </div>
        </div>
    );
}
