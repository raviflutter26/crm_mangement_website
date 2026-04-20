"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiPlus, FiDownload, FiFilter, FiTrash2, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

// Components
import EmployeeTable from "@/components/employees/EmployeeTable";
import EmployeeFilters from "@/components/employees/EmployeeFilters";

interface EmployeesPageProps {
    employees: any[];
    departments: any[];
    onRefresh: () => void;
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
    onAddClick: () => void;
    onEditClick: (emp: any) => void;
    onViewClick: (emp: any) => void;
}

export default function EmployeesPage({ employees, departments, onRefresh, showNotify, onAddClick, onEditClick, onViewClick }: EmployeesPageProps) {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filterDept, setFilterDept] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterRole, setFilterRole] = useState("");
    const [filterManager, setFilterManager] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem('ravi_zoho_user');
        if (raw) { try { setCurrentUser(JSON.parse(raw)); } catch (e) { } }
    }, []);

    const managersList = employees.filter(e => {
        const r = (e.role || "").toLowerCase();
        return ["admin", "superadmin", "hr", "manager"].includes(r);
    });


    const handleDelete = (emp: any) => {
        setEmployeeToDelete(emp);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!employeeToDelete) return;
        try {
            await axiosInstance.delete(`${API_ENDPOINTS.EMPLOYEES}/${employeeToDelete._id}`);
            showNotify('success', "Employee deleted successfully!");
            onRefresh();
        } catch (err: any) {
            showNotify('failure', err.response?.data?.message || "Error deleting employee.");
        } finally {
            setShowDeleteConfirm(false); setEmployeeToDelete(null);
        }
    };

    const handleExport = () => {
        const headers = ["First Name", "Last Name", "Email", "Employee ID", "Department", "Designation", "Reporting Manager", "Phone", "Status"];
        const rows = filtered.map(e => [
            `"${e.firstName || ""}"`, `"${e.lastName || ""}"`, `"${e.email || ""}"`, `"${e.employeeId || ""}"`,
            `"${e.department || ""}"`, `"${e.designation || ""}"`,
            `"${(e.reportingManager && typeof e.reportingManager === 'object') ? `${e.reportingManager.firstName} ${e.reportingManager.lastName}` : (e.reportingManager || "")}"`,
            `"${e.phone || ""}"`, `"${e.status || ""}"`
        ]);
        const csvContent = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `employees_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const uniqueDepartments = Array.from(new Set(employees.flatMap(e => e.department ? e.department.split(',').map((s: string) => s.trim()) : []).filter(Boolean)));
    const uniqueStatuses = Array.from(new Set(employees.map(e => e.status).filter(Boolean)));
    const uniqueRoles = Array.from(new Set(employees.map(e => e.role).filter(Boolean)));

    const filtered = employees.filter(e => {
        const searchLower = search.toLowerCase();
        const matchSearch = `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchLower) || (e.employeeId || "").toLowerCase().includes(searchLower) || (e.department || "").toLowerCase().includes(searchLower);
        const activeFilterDept = currentUser?.role === "Manager" ? currentUser.department : filterDept;
        const matchDept = activeFilterDept ? (e.department && e.department.split(',').map((s: string) => s.trim()).includes(activeFilterDept)) : true;
        const matchStatus = filterStatus ? e.status === filterStatus : true;
        const matchRole = filterRole ? e.role === filterRole : true;
        const managerId = (e.reportingManager && typeof e.reportingManager === 'object') ? e.reportingManager._id : e.reportingManager;
        const matchManager = filterManager ? managerId === filterManager : true;
        return matchSearch && matchDept && matchStatus && matchRole && matchManager;
    });

    return (
        <>
            <div className="page-header" style={{ padding: '16px 24px', marginBottom: '16px' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '20px' }}>Employees</h1>
                    <p className="page-subtitle" style={{ fontSize: '12px' }}>Manage your workforce — {employees.length} total employees</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary" onClick={handleExport}><FiDownload /> Export</button>
                    <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}><FiFilter /> Filter</button>
                    <button className="btn btn-primary" onClick={onAddClick}><FiPlus /> Add Employee</button>
                </div>
            </div>

            <EmployeeFilters 
                search={search} setSearch={setSearch}
                showFilters={showFilters} setShowFilters={setShowFilters}
                filterDept={filterDept} setFilterDept={setFilterDept}
                filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                filterRole={filterRole} setFilterRole={setFilterRole}
                filterManager={filterManager} setFilterManager={setFilterManager}
                uniqueDepartments={uniqueDepartments} uniqueStatuses={uniqueStatuses} uniqueRoles={uniqueRoles}
                managersList={managersList} currentUser={currentUser}
            />

            <EmployeeTable employees={filtered} loading={loading} onEdit={onEditClick} onDelete={handleDelete} onView={onViewClick} onAdd={onAddClick} />

            {showDeleteConfirm && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "var(--overlay-bg)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backdropFilter: "blur(4px)"
                }}>
                    <div className="card animate-in" style={{ width: "400px", padding: "30px", textAlign: "center" }}>
                        <div style={{ width: "60px", height: "60px", borderRadius: "30px", background: "var(--error-bg-light)", color: "var(--error)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", margin: "0 auto 20px" }}>
                            <FiTrash2 />
                        </div>
                        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px" }}>Confirm Delete</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>Are you sure you want to delete <strong>{employeeToDelete?.firstName} {employeeToDelete?.lastName}</strong>? This action cannot be undone.</p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button className="btn btn-secondary" onClick={() => { setShowDeleteConfirm(false); setEmployeeToDelete(null); }} style={{ flex: 1 }}>Cancel</button>
                            <button className="btn btn-primary" onClick={confirmDelete} style={{ flex: 1 }}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
