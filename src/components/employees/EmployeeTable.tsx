"use client";

import { FiEdit2, FiTrash2, FiEye } from "react-icons/fi";

interface EmployeeTableProps {
    employees: any[];
    loading: boolean;
    onEdit: (emp: any) => void;
    onDelete: (emp: any) => void;
    onView: (emp: any) => void;
}

export default function EmployeeTable({ employees, loading, onEdit, onDelete, onView }: EmployeeTableProps) {
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
                            <th>Employee</th>
                            <th>Employee ID</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Reporting Manager</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                                    No employees found.
                                </td>
                            </tr>
                        ) : (
                            employees.map((emp, i) => (
                                <tr key={emp._id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{
                                                width: "38px", height: "38px", borderRadius: "10px",
                                                background: `hsl(${i * 36}, 55%, 30%)`, display: "flex",
                                                alignItems: "center", justifyContent: "center",
                                                fontWeight: 700, fontSize: "13px", color: "white"
                                            }}>
                                                {(emp.firstName?.[0] || "")}{(emp.lastName?.[0] || "")}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</div>
                                                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{emp.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{emp.employeeId}</td>
                                    <td>{emp.department}</td>
                                    <td>{emp.designation}</td>
                                    <td>
                                        {emp.reportingManager ? (
                                            typeof emp.reportingManager === 'object' ?
                                                `${emp.reportingManager.firstName} ${emp.reportingManager.lastName} (${emp.reportingManager.designation || emp.reportingManager.role})` :
                                                emp.reportingManager
                                        ) : "-"}
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>{emp.phone}</td>
                                    <td>
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
