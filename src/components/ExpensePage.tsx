"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiCheckCircle,
    FiClock, FiFile, FiFilter
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

const STATUS_COLORS: any = {
    draft: "pending", submitted: "processing", approved: "active",
    rejected: "inactive", reimbursed: "active",
};

const CATEGORY_ICONS: any = {
    travel: "✈️", food: "🍕", accommodation: "🏨", equipment: "💻",
    training: "📚", medical: "🏥", other: "📎",
};

export default function ExpensePage() {
    const [expenses, setExpenses] = useState<any[]>([]);
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
            const url = filterStatus ? `${API_ENDPOINTS.EXPENSES}?status=${filterStatus}` : API_ENDPOINTS.EXPENSES;
            const res = await axiosInstance.get(url);
            setExpenses(res.data.data || []);
        } catch (err) { console.error("Fetch error", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [filterStatus]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const openAdd = () => {
        setIsEditing(false);
        setFormData({ category: "other", status: "draft", currency: "INR", date: new Date().toISOString().split("T")[0] });
        setShowModal(true);
    };

    const openEdit = (item: any) => {
        setIsEditing(true); setEditId(item._id);
        setFormData({
            employeeName: item.employeeName || "", title: item.title || "",
            category: item.category || "other", amount: item.amount || "",
            date: item.date ? new Date(item.date).toISOString().split("T")[0] : "",
            description: item.description || "", status: item.status || "draft",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axiosInstance.put(`${API_ENDPOINTS.EXPENSES}/${editId}`, formData);
                showToast("Updated!");
            } else {
                await axiosInstance.post(API_ENDPOINTS.EXPENSES, formData);
                showToast("Expense submitted!");
            }
            setShowModal(false); fetchData();
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try { await axiosInstance.delete(`${API_ENDPOINTS.EXPENSES}/${id}`); showToast("Deleted!"); fetchData(); }
        catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await axiosInstance.patch(`${API_ENDPOINTS.EXPENSES}/${id}/status`, { status });
            showToast(`Expense ${status}!`); fetchData();
        } catch (err: any) { alert("Error: " + (err.response?.data?.message || err.message)); }
    };

    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const approvedAmount = expenses.filter(e => e.status === "approved" || e.status === "reimbursed").reduce((sum, e) => sum + (e.amount || 0), 0);
    const pendingAmount = expenses.filter(e => e.status === "submitted").reduce((sum, e) => sum + (e.amount || 0), 0);

    const stats = [
        { label: "Total Claims", value: expenses.length, icon: FiFile, color: "blue" },
        { label: "Total Amount", value: `₹${totalAmount.toLocaleString()}`, icon: FiDollarSign, color: "purple" },
        { label: "Approved", value: `₹${approvedAmount.toLocaleString()}`, icon: FiCheckCircle, color: "green" },
        { label: "Pending", value: `₹${pendingAmount.toLocaleString()}`, icon: FiClock, color: "orange" },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Expenses</h1>
                    <p className="page-subtitle">Manage expense claims, approvals, and reimbursements</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Submit Expense</button>
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
                    <h3 className="card-title">Expense Claims</h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <select className="form-input" style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="reimbursed">Reimbursed</option>
                        </select>
                    </div>
                </div>
                <div className="table-wrapper">
                    {loading ? <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div> : (
                        <table>
                            <thead><tr><th>Employee</th><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {expenses.map(e => (
                                    <tr key={e._id}>
                                        <td style={{ fontWeight: 600 }}>{e.employeeName || "-"}</td>
                                        <td>{e.title}</td>
                                        <td><span>{CATEGORY_ICONS[e.category] || "📎"} {e.category}</span></td>
                                        <td style={{ fontWeight: 700, fontFamily: "monospace" }}>₹{(e.amount || 0).toLocaleString()}</td>
                                        <td>{e.date ? new Date(e.date).toLocaleDateString() : "-"}</td>
                                        <td><span className={`badge ${STATUS_COLORS[e.status]}`}>{e.status}</span></td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                {e.status === "submitted" && (
                                                    <>
                                                        <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(e._id, "approved")} title="Approve">✓</button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(e._id, "rejected")} style={{ color: "var(--error)" }} title="Reject">✗</button>
                                                    </>
                                                )}
                                                {e.status === "approved" && (
                                                    <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(e._id, "reimbursed")} title="Mark Reimbursed">💰</button>
                                                )}
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}><FiEdit2 /></button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(e._id)} style={{ color: "var(--error)" }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No expenses found.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--overlay-bg)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "520px", maxHeight: "80vh", overflow: "auto", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit" : "Submit"} Expense</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Employee Name</label>
                                <input type="text" className="form-input" value={formData.employeeName || ""} onChange={e => setFormData({ ...formData, employeeName: e.target.value })} placeholder="Employee name" /></div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Expense Title *</label>
                                <input required type="text" className="form-input" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Client meeting travel" /></div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Category</label>
                                    <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option value="travel">Travel</option><option value="food">Food</option><option value="accommodation">Accommodation</option>
                                        <option value="equipment">Equipment</option><option value="training">Training</option><option value="medical">Medical</option><option value="other">Other</option>
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Amount (₹) *</label>
                                    <input required type="number" className="form-input" value={formData.amount || ""} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} min={0} /></div>
                            </div>
                            <div className="grid-2">
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Date</label>
                                    <input type="date" className="form-input" value={formData.date || ""} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
                                <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Status</label>
                                    <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="draft">Draft</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="reimbursed">Reimbursed</option>
                                    </select></div>
                            </div>
                            <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Description</label>
                                <textarea className="form-input" value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ resize: "none" }} /></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? "Save" : "Submit"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "var(--success-bg)", color: "white", padding: "12px 20px", borderRadius: "8px", zIndex: 3000, boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, animation: "fadeInUp 0.3s ease-out" }}>
                    <FiCheckCircle size={20} /> {toast}
                </div>
            )}
        </>
    );
}
