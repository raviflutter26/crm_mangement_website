"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiMonitor, FiPlus, FiEdit2, FiTrash2, FiCheckCircle,
    FiPackage, FiTool, FiAlertCircle
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

const STATUS_COLORS: any = {
    available: "active", assigned: "processing", "under-repair": "pending",
    retired: "inactive", lost: "inactive",
};

const TYPE_ICONS: any = {
    laptop: "💻", desktop: "🖥️", monitor: "🖥️", phone: "📱", tablet: "📱",
    furniture: "🪑", vehicle: "🚗", "id-card": "🪪", other: "📦",
};

interface AssetPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function AssetPage({ showNotify }: AssetPageProps) {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<any>({});
    const [toast, setToast] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = filterStatus ? `${API_ENDPOINTS.ASSETS}?status=${filterStatus}` : API_ENDPOINTS.ASSETS;
            const res = await axiosInstance.get(url);
            setAssets(res.data.data || []);
        } catch (err) { console.error("Fetch error", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [filterStatus]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const openAdd = () => {
        setIsEditing(false);
        setFormData({ status: "available", type: "laptop", condition: "new" });
        setShowModal(true);
    };

    const openEdit = (item: any) => {
        setIsEditing(true); setEditId(item._id);
        setFormData({
            name: item.name || "", type: item.type || "other", brand: item.brand || "",
            model: item.model || "", serialNumber: item.serialNumber || "",
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split("T")[0] : "",
            purchaseValue: item.purchaseValue || 0, currentValue: item.currentValue || 0,
            warrantyExpiry: item.warrantyExpiry ? new Date(item.warrantyExpiry).toISOString().split("T")[0] : "",
            assignedToName: item.assignedToName || "", status: item.status || "available",
            condition: item.condition || "good", notes: item.notes || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axiosInstance.put(`${API_ENDPOINTS.ASSETS}/${editId}`, formData);
                showToast("Updated!");
            } else {
                await axiosInstance.post(API_ENDPOINTS.ASSETS, formData);
                showToast("Asset added!");
            }
            setShowModal(false); fetchData();
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try { await axiosInstance.delete(`${API_ENDPOINTS.ASSETS}/${id}`); showToast("Deleted!"); fetchData(); }
        catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const handleReturn = async (id: string) => {
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.ASSETS}/${id}/return`, { condition: "good" });
            showToast("Asset returned!"); fetchData();
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const stats = [
        { label: "Total Assets", value: assets.length, icon: FiPackage, color: "blue" },
        { label: "Available", value: assets.filter(a => a.status === "available").length, icon: FiCheckCircle, color: "green" },
        { label: "Assigned", value: assets.filter(a => a.status === "assigned").length, icon: FiMonitor, color: "purple" },
        { label: "Under Repair", value: assets.filter(a => a.status === "under-repair").length, icon: FiTool, color: "orange" },
    ];

    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || a.purchaseValue || 0), 0);

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Assets</h1>
                    <p className="page-subtitle">Track company assets and equipment — Total Value: ₹{totalValue.toLocaleString()}</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add Asset</button>
            </div>

            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div key={i} className={`stat-card ${s.color}`}>
                        <div className="stat-card-header"><div className={`stat-card-icon ${s.color}`}><s.icon /></div></div>
                        <div className="stat-card-value">{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Asset Inventory</h3>
                    <select className="form-input" style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="available">Available</option>
                        <option value="assigned">Assigned</option>
                        <option value="under-repair">Under Repair</option>
                        <option value="retired">Retired</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>
                <div className="table-wrapper">
                    {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : (
                        <table>
                            <thead><tr><th>Asset</th><th>Type</th><th>Brand/Model</th><th>Serial No.</th><th>Assigned To</th><th>Value</th><th>Condition</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {assets.map(a => (
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
                                        <td>{a.brand} {a.model}</td>
                                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{a.serialNumber || "-"}</td>
                                        <td>{a.assignedToName || "-"}</td>
                                        <td style={{ fontWeight: 700, fontFamily: "monospace" }}>₹{(a.currentValue || a.purchaseValue || 0).toLocaleString()}</td>
                                        <td><span className={`badge ${a.condition === "new" || a.condition === "good" ? "active" : a.condition === "fair" ? "pending" : "inactive"}`}>{a.condition}</span></td>
                                        <td><span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status.replace("-", " ")}</span></td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                {a.status === "assigned" && (
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleReturn(a._id)} title="Return">↩️</button>
                                                )}
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}><FiEdit2 /></button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(a._id)} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {assets.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No assets found.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "560px", maxHeight: "85vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit" : "Add"} Asset</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Asset Name *</label>
                                <input required type="text" className="form-input" value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., MacBook Pro 16 inch" /></div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Type</label>
                                    <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="laptop">Laptop</option><option value="desktop">Desktop</option><option value="monitor">Monitor</option>
                                        <option value="phone">Phone</option><option value="tablet">Tablet</option><option value="furniture">Furniture</option>
                                        <option value="vehicle">Vehicle</option><option value="id-card">ID Card</option><option value="other">Other</option>
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Condition</label>
                                    <select className="form-input" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}>
                                        <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option>
                                    </select></div>
                            </div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Brand</label>
                                    <input type="text" className="form-input" value={formData.brand || ""} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Apple" /></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Model</label>
                                    <input type="text" className="form-input" value={formData.model || ""} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="Pro 16" /></div>
                            </div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Serial Number</label>
                                <input type="text" className="form-input" value={formData.serialNumber || ""} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} /></div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Purchase Value (₹)</label>
                                    <input type="number" className="form-input" value={formData.purchaseValue || ""} onChange={e => setFormData({ ...formData, purchaseValue: parseFloat(e.target.value) })} min={0} /></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Current Value (₹)</label>
                                    <input type="number" className="form-input" value={formData.currentValue || ""} onChange={e => setFormData({ ...formData, currentValue: parseFloat(e.target.value) })} min={0} /></div>
                            </div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Purchase Date</label>
                                    <input type="date" className="form-input" value={formData.purchaseDate || ""} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} /></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Status</label>
                                    <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="available">Available</option><option value="assigned">Assigned</option><option value="under-repair">Under Repair</option>
                                        <option value="retired">Retired</option><option value="lost">Lost</option>
                                    </select></div>
                            </div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Assigned To</label>
                                <input type="text" className="form-input" value={formData.assignedToName || ""} onChange={e => setFormData({ ...formData, assignedToName: e.target.value })} placeholder="Employee name" /></div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Notes</label>
                                <textarea className="form-input" value={formData.notes || ""} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} style={{ resize: "none" }} /></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? "Save" : "Add Asset"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "rgba(34, 197, 94, 0.9)", color: "white", padding: "12px 20px", borderRadius: "8px", zIndex: 3000, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, animation: "fadeInUp 0.3s ease-out" }}>
                    <FiCheckCircle size={20} /> {toast}
                </div>
            )}
        </>
    );
}
