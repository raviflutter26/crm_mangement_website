"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/lib/auth";
import { FiPlus, FiUsers, FiEdit2, FiTrash2, FiPhone, FiMail, FiCheckCircle, FiSearch } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

const STATUS_COLORS: any = { Active: "active", Inactive: "inactive", "Pending Approval": "pending", Blacklisted: "inactive" };

interface VendorsPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function VendorsPage({ showNotify }: VendorsPageProps) {
    const { user } = useAuth();
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState<any>({ status: 'Active', type: 'Contractor' });
    const [filterStatus, setFilterStatus] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = API_ENDPOINTS.VENDORS;
            const res = await axiosInstance.get(url, {
                params: { 
                    status: filterStatus || undefined,
                    organizationId: user?.organizationId
                }
            });
            setVendors(res.data.data || []);
        } catch (err) { 
            console.error("Fetch error:", err);
            showNotify?.('failure', "Failed to load vendors");
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [filterStatus]);

    const openAdd = () => { setIsEditing(false); setFormData({ status: 'Active', type: 'Contractor' }); setShowModal(true); };
    const openEdit = (v: any) => {
        setIsEditing(true); setEditId(v._id);
        setFormData({ name: v.name, contactPerson: v.contactPerson, type: v.type, email: v.email, phone: v.phone, address: v.address, gstNumber: v.gstNumber, panNumber: v.panNumber, status: v.status, notes: v.notes });
        setShowModal(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (isEditing) { await axiosInstance.put(`${API_ENDPOINTS.VENDORS}/${editId}`, formData); }
            else { await axiosInstance.post(API_ENDPOINTS.VENDORS, formData); }
            setShowModal(false); fetchData();
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this vendor?")) return;
        try { await axiosInstance.delete(`${API_ENDPOINTS.VENDORS}/${id}`); fetchData(); }
        catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const stats = [
        { label: "Total Vendors", value: vendors.length, color: "blue" },
        { label: "Active", value: vendors.filter(v => v.status === 'Active').length, color: "green" },
        { label: "Pending Approval", value: vendors.filter(v => v.status === 'Pending Approval').length, color: "orange" },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Vendors & Contractors</h1>
                    <p className="page-subtitle">Manage third-party vendors, contractors, and supplier relationships.</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add Vendor</button>
            </div>

            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div key={i} className={`stat-card ${s.color}`}>
                        <div className="stat-card-value">{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Vendor Directory</h3>
                    <select className="form-input" style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending Approval">Pending Approval</option>
                    </select>
                </div>
                <div className="table-wrapper">
                    {loading ? <TableSkeleton rows={5} /> : (
                        <table>
                            <thead><tr><th>Vendor</th><th>Type</th><th>Contact Person</th><th>Email</th><th>Phone</th><th>GST</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {vendors.map(v => (
                                    <tr key={v._id}>
                                        <td style={{ fontWeight: 600 }}>{v.name}</td>
                                        <td>{v.type}</td>
                                        <td>{v.contactPerson || '-'}</td>
                                        <td style={{ fontSize: "12px" }}>{v.email || '-'}</td>
                                        <td style={{ fontSize: "12px" }}>{v.phone || '-'}</td>
                                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{v.gstNumber || '-'}</td>
                                        <td><span className={`badge ${STATUS_COLORS[v.status] || 'inactive'}`}>{v.status}</span></td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(v)}><FiEdit2 /></button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(v._id)} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {vendors.length === 0 && (
                                    <tr><td colSpan={8} style={{ textAlign: "center", padding: "80px 40px" }}>
                                        <EmptyState title="No Vendors Found" description="Add your first vendor or contractor to start managing supplier relationships." icon={FiUsers} actionLabel="Add Vendor" onAction={openAdd} />
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "560px", maxHeight: "85vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit" : "Add"} Vendor</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Company Name *</label>
                                <input required type="text" className="form-input" value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Type</label>
                                    <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="Material Supplier">Material Supplier</option><option value="Contractor">Contractor</option>
                                        <option value="Service Provider">Service Provider</option><option value="Consultant">Consultant</option><option value="Other">Other</option>
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Status</label>
                                    <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Active">Active</option><option value="Inactive">Inactive</option>
                                        <option value="Pending Approval">Pending Approval</option><option value="Blacklisted">Blacklisted</option>
                                    </select></div>
                            </div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Contact Person</label>
                                <input type="text" className="form-input" value={formData.contactPerson || ""} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} /></div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Email</label>
                                    <input type="email" className="form-input" value={formData.email || ""} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Phone</label>
                                    <input type="text" className="form-input" value={formData.phone || ""} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                            </div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>GST Number</label>
                                    <input type="text" className="form-input" value={formData.gstNumber || ""} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} /></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>PAN</label>
                                    <input type="text" className="form-input" value={formData.panNumber || ""} onChange={e => setFormData({ ...formData, panNumber: e.target.value })} /></div>
                            </div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Address</label>
                                <textarea className="form-input" value={formData.address || ""} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} style={{ resize: "none" }} /></div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Notes</label>
                                <textarea className="form-input" value={formData.notes || ""} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} style={{ resize: "none" }} /></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? "Save" : "Add Vendor"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
