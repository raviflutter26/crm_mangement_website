"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/lib/auth";
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiGlobe } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { useConfirm, useToast } from "@/components/common/DialogProvider";

interface LocationsPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function LocationsPage({ showNotify }: LocationsPageProps) {
    const { user } = useAuth();
    const confirmDialog = useConfirm();
    const toast = useToast();
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        city: "",
        state: "",
        country: "Australia",
        pincode: "",
        type: "Site",
        isActive: true,
        // Attendance geofence (enforced by the API when enabled).
        latitude: "" as string | number,
        longitude: "" as string | number,
        radiusMeters: 200 as string | number,
        geofenceEnabled: false,
        geofenceAllSources: false,
    });

    const getToken = async () => {
        let token = localStorage.getItem('ravi_zoho_token');
        if (!token) { window.location.reload(); throw new Error("No token"); }
        return token;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(API_ENDPOINTS.LOCATIONS, { 
                params: { organizationId: user?.organizationId } 
            });
            setLocations(res.data.data || []);
        } catch (err: any) {
            console.error("Failed to fetch locations", err);
            showNotify?.('failure', "Failed to load locations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e: any) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({ name: "", address: "", city: "", state: "", country: "Australia", pincode: "", type: "Site", isActive: true, latitude: "", longitude: "", radiusMeters: 200, geofenceEnabled: false, geofenceAllSources: false });
        setShowModal(true);
    };

    const openEditModal = (loc: any) => {
        setIsEditing(true);
        setEditId(loc._id);
        setFormData({
            name: loc.name || "",
            address: loc.address || "",
            city: loc.city || "",
            state: loc.state || "",
            country: loc.country || "Australia",
            pincode: loc.pincode || "",
            type: loc.type || "Site",
            isActive: loc.isActive !== false,
            latitude: loc.latitude ?? "",
            longitude: loc.longitude ?? "",
            radiusMeters: loc.radiusMeters ?? 200,
            geofenceEnabled: Boolean(loc.geofenceEnabled),
            geofenceAllSources: Boolean(loc.geofenceAllSources),
        });
        setShowModal(true);
    };

    /** Fill the site's coordinates from this device (stand at the site to use it). */
    const useCurrentPosition = () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            toast.error("Location is not available in this browser");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => setFormData(f => ({ ...f, latitude: Number(pos.coords.latitude.toFixed(6)), longitude: Number(pos.coords.longitude.toFixed(6)) })),
            () => toast.error("Could not read your location"),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const payload = { ...formData, organizationId: user?.organizationId };
            if (isEditing) {
                await axiosInstance.put(`${API_ENDPOINTS.LOCATIONS}/${editId}`, payload);
            } else {
                await axiosInstance.post(API_ENDPOINTS.LOCATIONS, payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            console.error("Failed to save location", err);
            toast.error(err.response?.data?.message || "Error saving location");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        const ok = await confirmDialog({
            title: `Delete ${name}?`,
            description: "This action cannot be undone.",
            confirmLabel: "Delete",
            danger: true,
        });
        if (!ok) return;
        try {
            await axiosInstance.delete(`${API_ENDPOINTS.LOCATIONS}/${id}`);
            fetchData();
        } catch (err: any) {
            console.error("Failed to delete", err);
            toast.error("Error deleting location");
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sites & Locations</h1>
                    <p className="page-subtitle">Manage project sites, office locations, and operational zones — {locations.length} total active.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={openAddModal}><FiPlus /> Add Location</button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 1s linear infinite" }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <div className="grid-3">
                    {locations.map((loc) => (
                        <div key={loc._id} className="card animate-in" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px" }}>
                                        <FiMapPin />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "16px", fontWeight: "700" }}>{loc.name}</h3>
                                        <span className={`badge ${loc.isActive ? "active" : "inactive"}`} style={{ marginTop: "4px" }}>
                                            {loc.type || 'Site'} • {loc.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                <FiGlobe style={{ marginRight: "6px" }} />
                                {loc.address}, {loc.city}, {loc.state} {loc.pincode}
                            </p>
                            {loc.geofenceEnabled && (
                                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                    <FiMapPin style={{ marginRight: "6px" }} />
                                    Geofence: {loc.radiusMeters || 200} m around {loc.latitude}, {loc.longitude}{loc.geofenceAllSources ? " (all punches)" : " (GPS/mobile punches)"}
                                </p>
                            )}

                            <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                                <button onClick={() => openEditModal(loc)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                                    <FiEdit2 /> Edit
                                </button>
                                <button onClick={() => handleDelete(loc._id, loc.name)} className="btn btn-secondary btn-sm" style={{ padding: "8px", color: "var(--error)" }}>
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                    {locations.length === 0 && (
                        <div style={{ gridColumn: "1 / -1" }}>
                            <EmptyState
                                title="No Locations Found"
                                description="Start by adding your first project site or office location."
                                icon={FiMapPin}
                                actionLabel="Add Location"
                                onAction={openAddModal}
                            />
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backdropFilter: "blur(4px)"
                }}>
                    <div className="card animate-in" style={{ width: "500px", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit Location" : "Add New Location"}</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div className="grid-2" style={{ gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 600 }}>Location Name</label>
                                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" placeholder="e.g., Sydney HQ" />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 600 }}>Type</label>
                                    <select name="type" value={formData.type} onChange={handleInputChange} className="form-input">
                                        <option value="Site">Project Site</option>
                                        <option value="Office">Regional Office</option>
                                        <option value="Warehouse">Warehouse</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 600 }}>Address</label>
                                <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="form-input" placeholder="Street Address" />
                            </div>
                            <div className="grid-2" style={{ gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 600 }}>City</label>
                                    <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="form-input" />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 600 }}>State</label>
                                    <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="form-input" />
                                </div>
                            </div>
                            <fieldset style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                <legend style={{ fontSize: "12px", fontWeight: 700, padding: "0 6px" }}>Attendance geofence</legend>
                                <div className="grid-2" style={{ gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 600 }}>Latitude</label>
                                        <input type="number" step="any" min={-90} max={90} name="latitude" value={formData.latitude} onChange={handleInputChange} className="form-input" placeholder="e.g. 12.9716" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 600 }}>Longitude</label>
                                        <input type="number" step="any" min={-180} max={180} name="longitude" value={formData.longitude} onChange={handleInputChange} className="form-input" placeholder="e.g. 77.5946" />
                                    </div>
                                </div>
                                <div className="grid-2" style={{ gap: "12px", alignItems: "end" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: 600 }}>Radius (metres)</label>
                                        <input type="number" min={10} max={100000} name="radiusMeters" value={formData.radiusMeters} onChange={handleInputChange} className="form-input" />
                                    </div>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={useCurrentPosition}>Use my current position</button>
                                </div>
                                <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px" }}>
                                    <input type="checkbox" name="geofenceEnabled" checked={formData.geofenceEnabled} onChange={handleInputChange} />
                                    Require GPS/mobile check-ins to be within the radius
                                </label>
                                <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px" }}>
                                    <input type="checkbox" name="geofenceAllSources" checked={formData.geofenceAllSources} onChange={handleInputChange} disabled={!formData.geofenceEnabled} />
                                    Apply to every check-in at this site (web punches must share location too)
                                </label>
                            </fieldset>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? "Save Changes" : "Add Location"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
