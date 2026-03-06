"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { FiSearch, FiPlus, FiDownload, FiFilter, FiEdit2, FiTrash2 } from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [departmentsList, setDepartmentsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState("");
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        employeeId: "",
        department: "",
        designation: "",
        phone: "",
        reportingManager: "",
        status: "Active"
    });

    const getToken = async () => {
        let token = localStorage.getItem('ravi_zoho_token');
        if (!token) { window.location.reload(); throw new Error("No token"); }
        return token;
    };

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const [empRes, deptRes] = await Promise.all([
                axiosInstance.get(API_ENDPOINTS.EMPLOYEES),
                axiosInstance.get(API_ENDPOINTS.DEPARTMENTS)
            ]);
            setEmployees(empRes.data.data);
            setDepartmentsList(deptRes.data.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('ravi_zoho_token');
                // optionally fetch again without loop: return fetchEmployees() but carefully. Just let it log error for now, next fetch will work
            }
            console.error("Failed to fetch employees", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleInputChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({
            firstName: "", lastName: "", email: "", employeeId: "",
            department: "", designation: "", phone: "", reportingManager: "", status: "Active"
        });
        setShowModal(true);
    };

    const openEditModal = (emp: any) => {
        setIsEditing(true);
        setEditId(emp._id);
        setFormData({
            firstName: emp.firstName || "",
            lastName: emp.lastName || "",
            email: emp.email || "",
            employeeId: emp.employeeId || "",
            department: emp.department || "",
            designation: emp.designation || "",
            phone: emp.phone || "",
            reportingManager: emp.reportingManager || "",
            status: emp.status || "Active"
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const token = await getToken();
            if (isEditing) {
                await axiosInstance.put(`${API_ENDPOINTS.EMPLOYEES}/${editId}`, formData);
            } else {
                await axiosInstance.post(API_ENDPOINTS.EMPLOYEES, formData);
            }
            setShowModal(false);
            fetchEmployees();
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('ravi_zoho_token');
                alert("Session expired. Please try again.");
            } else {
                console.error("Failed to save employee", err);
                alert("Error saving employee: " + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this employee?")) return;
        try {
            const token = await getToken();
            await axiosInstance.delete(`${API_ENDPOINTS.EMPLOYEES}/${id}`);
            fetchEmployees();
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('ravi_zoho_token');
                alert("Session expired. Please try again.");
            } else {
                console.error("Failed to delete", err);
                alert("Error deleting employee.");
            }
        }
    };

    const [showFilters, setShowFilters] = useState(false);
    const [filterDept, setFilterDept] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const handleExport = () => {
        const headers = ["First Name", "Last Name", "Email", "Employee ID", "Department", "Designation", "Phone", "Status"];
        const rows = filtered.map(e => [
            `"${e.firstName || ""}"`,
            `"${e.lastName || ""}"`,
            `"${e.email || ""}"`,
            `"${e.employeeId || ""}"`,
            `"${e.department || ""}"`,
            `"${e.designation || ""}"`,
            `"${e.reportingManager || ""}"`,
            `"${e.phone || ""}"`,
            `"${e.status || ""}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "employees_report.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const uniqueDepartments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
    const uniqueStatuses = Array.from(new Set(employees.map(e => e.status).filter(Boolean)));

    const filtered = employees.filter(e => {
        const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
        const searchLower = search.toLowerCase();
        const empId = (e.employeeId || "").toLowerCase();
        const dept = (e.department || "").toLowerCase();

        const matchSearch = fullName.includes(searchLower) || empId.includes(searchLower) || dept.includes(searchLower);
        const matchDept = filterDept ? e.department === filterDept : true;
        const matchStatus = filterStatus ? e.status === filterStatus : true;

        return matchSearch && matchDept && matchStatus;
    });

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Employees</h1>
                    <p className="page-subtitle">Manage your workforce — {employees.length} total employees</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary" onClick={handleExport}><FiDownload /> Export</button>
                    <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}><FiFilter /> Filter</button>
                    <button className="btn btn-primary" onClick={openAddModal}><FiPlus /> Add Employee</button>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div className="topbar-search" style={{ width: "100%" }}>
                        <FiSearch className="topbar-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or department..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: "100%" }}
                        />
                    </div>
                    {showFilters && (
                        <div className="card animate-in" style={{ padding: "15px", display: "flex", gap: "15px", alignItems: "center" }}>
                            <div>
                                <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px", display: "block" }}>Department</label>
                                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="form-input" style={{ width: "200px", padding: "8px" }}>
                                    <option value="">All Departments</option>
                                    {uniqueDepartments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px", display: "block" }}>Status</label>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input" style={{ width: "200px", padding: "8px" }}>
                                    <option value="">All Statuses</option>
                                    {uniqueStatuses.map((s: any) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            {(filterDept || filterStatus) && (
                                <div style={{ marginTop: "22px" }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => { setFilterDept(""); setFilterStatus(""); }}>Clear Filters</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center" }}>Loading Employees...</div>
                    ) : (
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
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                                            No employees found.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((emp, i) => (
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
                                            <td>{emp.reportingManager || "-"}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>{emp.phone}</td>
                                            <td>
                                                <span className={`badge ${emp.status === "Active" ? "active" : emp.status === "Inactive" ? "inactive" : "leave"}`}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button onClick={() => openEditModal(emp)} className="topbar-btn" style={{ padding: "6px", fontSize: "16px", color: "var(--primary-color)" }}>
                                                        <FiEdit2 />
                                                    </button>
                                                    <button onClick={() => handleDelete(emp._id)} className="topbar-btn" style={{ padding: "6px", fontSize: "16px", color: "red" }}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal for Add / Edit */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div className="card" style={{ width: "500px", padding: "20px", maxHeight: "90vh", overflowY: "auto" }}>
                        <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit Employee" : "Add Employee"}</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>First Name</label>
                                    <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
                                        className="form-input" placeholder="e.g., John" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Last Name</label>
                                    <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
                                        className="form-input" placeholder="e.g., Doe" />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Email</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleInputChange}
                                    className="form-input" placeholder="john.doe@ravizoho.com" />
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Employee ID</label>
                                    <input required type="text" name="employeeId" value={formData.employeeId} onChange={handleInputChange}
                                        className="form-input" placeholder="e.g., EMP001" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Phone</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange}
                                        className="form-input" placeholder="+1 234 567 8900" />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Department</label>
                                    <select name="department" value={formData.department} onChange={handleInputChange} className="form-input">
                                        <option value="">Select Department</option>
                                        {departmentsList.map((d: any) => (
                                            <option key={d._id} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Designation</label>
                                    <input type="text" name="designation" value={formData.designation} onChange={handleInputChange}
                                        className="form-input" placeholder="e.g., Senior Developer" />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Reporting Manager</label>
                                    <select name="reportingManager" value={formData.reportingManager} onChange={handleInputChange} className="form-input">
                                        <option value="">No Manager</option>
                                        {employees.map(e => (
                                            <option key={e._id} value={`${e.firstName} ${e.lastName}`}>
                                                {e.firstName} {e.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" }}>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="form-input">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Terminated">Terminated</option>
                                        <option value="On Leave">On Leave</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? "Save Changes" : "Create Employee"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
