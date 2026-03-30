"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import {
    FiUsers, FiShield, FiEdit2, FiCheckCircle, FiXCircle,
    FiUser, FiSearch, FiLock
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

const ROLES = [
    { value: "Admin", label: "Admin", color: "#EA4335", desc: "Full access to all modules" },
    { value: "HR", label: "HR", color: "#1A73E8", desc: "Manage employees, payroll, compliance" },
    { value: "Manager", label: "Manager", color: "#FF6D00", desc: "View team, approve leaves & attendance" },
    { value: "Employee", label: "Employee", color: "#34A853", desc: "Self-service portal access" },
];

interface RoleManagementPageProps {
    showNotify?: (type: 'success' | 'failure' | 'warning', message: string) => void;
}

export default function RoleManagementPage({ showNotify }: RoleManagementPageProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState("");
    const [editingUser, setEditingUser] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [modulePermissions, setModulePermissions] = useState<any[]>([]);
    const [savingPermissions, setSavingPermissions] = useState(false);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

    const fetchUsers = useCallback(async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.AUTH_USERS);
            setUsers(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    const fetchPermissions = useCallback(async () => {
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.ROLE_PERMISSIONS);
            setModulePermissions(res.data.data || []);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => { 
        fetchUsers(); 
        fetchPermissions();
    }, [fetchUsers, fetchPermissions]);

    const handleUpdateRole = async () => {
        try {
            await axiosInstance.put(`${API_ENDPOINTS.AUTH_USERS}/${editingUser._id}`, {
                role: editingUser.role,
                isActive: editingUser.isActive,
            });
            showToast("User updated successfully!");
            setShowEditModal(false);
            fetchUsers();
        } catch (err: any) { alert(err.response?.data?.message || "Update failed"); }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const roleStats = ROLES.map(r => ({
        ...r,
        count: users.filter(u => u.role === r.value).length,
    }));

    const togglePermission = (moduleName: string, role: string) => {
        setModulePermissions(prev => prev.map(p => {
            if (p.module === moduleName) {
                const newRoles = p.roles.includes(role) 
                    ? p.roles.filter((r: string) => r !== role)
                    : [...p.roles, role];
                return { ...p, roles: newRoles };
            }
            return p;
        }));
    };

    const handleSavePermissions = async () => {
        setSavingPermissions(true);
        try {
            await axiosInstance.put(API_ENDPOINTS.ROLE_PERMISSIONS, { permissions: modulePermissions });
            showToast("Permissions updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save permissions");
        } finally {
            setSavingPermissions(false);
        }
    };

    if (loading) return (
        <div style={{ padding: "20px" }}>
            <TableSkeleton rows={8} />
        </div>
    );

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Role Management</h1>
                    <p className="page-subtitle">Manage user roles, permissions, and access control</p>
                </div>
            </div>

            {/* Role Overview Cards */}
            <div className="stats-grid">
                {roleStats.map(r => (
                    <div key={r.value} className="stat-card" style={{ borderLeft: `4px solid ${r.color}` }}>
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: `${r.color}20`, color: r.color }}><FiShield /></div>
                        </div>
                        <div className="stat-card-value">{r.count}</div>
                        <div className="stat-card-label">{r.label}s</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input type="text" className="form-input" placeholder="Search users by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "36px" }} />
                </div>
            </div>

            {/* Users Table */}
            <div className="card">
                <div className="card-header"><h3 className="card-title">All Users ({filteredUsers.length})</h3></div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>User</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => {
                                const role = ROLES.find(r => r.value === user.role) || ROLES[3];
                                return (
                                    <tr key={user._id}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${role.color}20`, color: role.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" }}>
                                                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{user.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{user.email}</td>
                                        <td>{user.department || "-"}</td>
                                        <td>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", background: `${role.color}15`, color: role.color, fontWeight: 600, fontSize: "12px" }}>
                                                <FiShield size={12} /> {role.label}
                                            </span>
                                        </td>
                                        <td>
                                            {user.isActive !== false ? (
                                                <span className="badge active"><FiCheckCircle size={12} /> Active</span>
                                            ) : (
                                                <span className="badge inactive"><FiXCircle size={12} /> Inactive</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" onClick={() => { setEditingUser({ ...user }); setShowEditModal(true); }}>
                                                <FiEdit2 size={14} /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                             {filteredUsers.length === 0 && (
                                 <tr>
                                     <td colSpan={7} style={{ textAlign: "center", padding: "80px 40px" }}>
                                         <EmptyState 
                                             title="No Users Found"
                                             description="No user accounts match your search criteria. Try a different name or email."
                                             icon={FiUser}
                                         />
                                     </td>
                                 </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Permissions Matrix */}
            <div className="card" style={{ marginTop: "16px" }}>
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 className="card-title">Role Permissions Matrix</h3>
                    <button 
                        className="btn btn-primary btn-sm" 
                        onClick={handleSavePermissions}
                        disabled={savingPermissions}
                    >
                        {savingPermissions ? "Saving..." : "Save Matrix"}
                    </button>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>Module</th><th style={{ textAlign: "center" }}>Admin</th><th style={{ textAlign: "center" }}>HR</th><th style={{ textAlign: "center" }}>Manager</th><th style={{ textAlign: "center" }}>Employee</th></tr>
                        </thead>
                        <tbody>
                            {modulePermissions.map((row, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{row.module.replace(/([A-Z])/g, ' $1').trim()}</td>
                                    {["Admin", "HR", "Manager", "Employee"].map(role => {
                                        const hasAccess = row.roles.includes(role);
                                        const isRestricted = role === "Admin" && row.module === "roles"; // Admin must have access to role management
                                        return (
                                            <td key={role} style={{ textAlign: "center" }}>
                                                <button 
                                                    onClick={() => !isRestricted && togglePermission(row.module, role)}
                                                    style={{ 
                                                        background: 'none', border: 'none', cursor: isRestricted ? 'default' : 'pointer',
                                                        color: hasAccess ? "#34A853" : "#ccc",
                                                        fontSize: '20px'
                                                    }}
                                                >
                                                    {hasAccess ? <FiCheckCircle /> : <FiXCircle />}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {modulePermissions.length === 0 && (
                     <div style={{ padding: "80px 40px" }}>
                         <EmptyState 
                             title="No Matrix Data"
                             description="Module permission data is unavailable. Please initialize module permissions to configure access control."
                             icon={FiLock}
                             actionLabel="Initialize Permissions"
                             onAction={fetchPermissions}
                         />
                     </div>
                 )}
            </div>

            {/* Edit Role Modal */}
            {showEditModal && editingUser && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card animate-in" style={{ width: "480px", padding: "24px" }}>
                        <h2 style={{ marginBottom: "20px" }}>Edit User Role</h2>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", padding: "12px", background: "var(--bg-primary)", borderRadius: "10px" }}>
                            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(26,115,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontWeight: 700 }}>
                                {editingUser.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>{editingUser.name}</div>
                                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{editingUser.email}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>Role</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                {ROLES.map(r => (
                                    <div key={r.value} onClick={() => setEditingUser({ ...editingUser, role: r.value })}
                                        style={{ padding: "12px", borderRadius: "10px", border: `2px solid ${editingUser.role === r.value ? r.color : "var(--border)"}`, cursor: "pointer", transition: "0.2s", background: editingUser.role === r.value ? `${r.color}08` : "transparent" }}>
                                        <div style={{ fontWeight: 700, color: r.color, fontSize: "13px" }}>{r.label}</div>
                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{r.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                <input type="checkbox" checked={editingUser.isActive !== false} onChange={e => setEditingUser({ ...editingUser, isActive: e.target.checked })} />
                                <span style={{ fontWeight: 600 }}>Account Active</span>
                            </label>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleUpdateRole}><FiCheckCircle /> Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "rgba(34, 197, 94, 0.9)", color: "white", padding: "12px 20px", borderRadius: "8px", zIndex: 3000, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
                    <FiCheckCircle size={20} /> {toast}
                </div>
            )}
        </>
    );
}
