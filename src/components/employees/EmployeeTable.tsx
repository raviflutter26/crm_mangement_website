"use client";

import { FiEdit2, FiTrash2, FiEye, FiUsers } from "react-icons/fi";
import EmptyState from "@/components/common/EmptyState";

interface EmployeeTableProps {
    employees: any[];
    loading: boolean;
    onEdit: (emp: any) => void;
    onDelete: (emp: any) => void;
    onView: (emp: any) => void;
    onAdd?: () => void;
}

export default function EmployeeTable({ employees, loading, onEdit, onDelete, onView, onAdd }: EmployeeTableProps) {
    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>Loading Employees...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="card">
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th style={{ padding: '12px 16px' }}>Employee</th>
                            <th style={{ padding: '12px 16px' }}>Employee ID</th>
                            <th style={{ padding: '12px 16px' }}>Department</th>
                            <th style={{ padding: '12px 16px' }}>Designation</th>
                            <th style={{ padding: '12px 16px' }}>Reporting Manager</th>
                            <th style={{ padding: '12px 16px' }}>Phone</th>
                            <th style={{ padding: '12px 16px' }}>Status</th>
                            <th style={{ padding: '12px 16px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: "center", padding: "40px 20px" }}>
                                    <EmptyState 
                                        title="No Employees Found" 
                                        description="Your workforce registry is empty. Add your first employee to start managing your team."
                                        icon={FiUsers}
                                        actionLabel="Add Employee"
                                        onAction={onAdd}
                                    />
                                </td>
                            </tr>
                        ) : (
                            employees.map((emp, i) => (
                                <tr key={emp._id}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{
                                                width: "32px", height: "32px", borderRadius: "8px",
                                                background: `hsl(${i * 36}, 55%, 30%)`, display: "flex",
                                                alignItems: "center", justifyContent: "center",
                                                fontWeight: 700, fontSize: "11px", color: "white"
                                            }}>
                                                {(emp.firstName?.[0] || "")}{(emp.lastName?.[0] || "")}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '13px', lineHeight: 1.2 }}>{emp.firstName} {emp.lastName}</div>
                                                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: '1px' }}>{emp.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontFamily: "monospace", color: "var(--text-secondary)", fontSize: '12px' }}>{emp.employeeId}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{emp.department}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{emp.designation}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                                        {emp.reportingManager ? (
                                            typeof emp.reportingManager === 'object' ?
                                                `${emp.reportingManager.firstName} ${emp.reportingManager.lastName} (${emp.reportingManager.designation || emp.reportingManager.role})` :
                                                emp.reportingManager
                                        ) : "-"}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: "var(--text-secondary)", fontSize: '12px' }}>{emp.phone}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span className={`badge ${emp.status === "Active" ? "active" : emp.status === "Inactive" ? "inactive" : "leave"}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button onClick={() => onView(emp)} className="topbar-btn" style={{ padding: "6px", fontSize: "16px", color: "var(--text-secondary)" }} title="View Details">
                                                <FiEye />
                                            </button>
                                            <button onClick={() => onEdit(emp)} className="topbar-btn" style={{ padding: "6px", fontSize: "16px", color: "var(--primary-color)" }} title="Edit">
                                                <FiEdit2 />
                                            </button>
                                            <button onClick={() => onDelete(emp)} className="topbar-btn" style={{ padding: "6px", fontSize: "16px", color: "red" }} title="Delete">
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
