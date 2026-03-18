"use client";

import { FiSearch, FiFilter } from "react-icons/fi";

interface EmployeeFiltersProps {
    search: string;
    setSearch: (s: string) => void;
    showFilters: boolean;
    setShowFilters: (b: boolean) => void;
    filterDept: string;
    setFilterDept: (s: string) => void;
    filterStatus: string;
    setFilterStatus: (s: string) => void;
    filterRole: string;
    setFilterRole: (s: string) => void;
    filterManager: string;
    setFilterManager: (s: string) => void;
    uniqueDepartments: string[];
    uniqueStatuses: string[];
    uniqueRoles: string[];
    managersList: any[];
    currentUser: any;
}

export default function EmployeeFilters({
    search, setSearch,
    showFilters, setShowFilters,
    filterDept, setFilterDept,
    filterStatus, setFilterStatus,
    filterRole, setFilterRole,
    filterManager, setFilterManager,
    uniqueDepartments, uniqueStatuses, uniqueRoles,
    managersList, currentUser
}: EmployeeFiltersProps) {
    return (
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
                    <div className="card animate-in" style={{ padding: "15px", display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px", display: "block" }}>Department</label>
                            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="form-input" style={{ width: "200px", padding: "8px" }}>
                                <option value="">All Departments</option>
                                {uniqueDepartments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px", display: "block" }}>Status</label>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input" style={{ width: "160px", padding: "8px" }}>
                                <option value="">All Statuses</option>
                                {uniqueStatuses.map((s: any) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px", display: "block" }}>Role</label>
                            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="form-input" style={{ width: "160px", padding: "8px" }}>
                                <option value="">All Roles</option>
                                {uniqueRoles.map((r: any) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        {currentUser?.role !== "Manager" && (
                            <div>
                                <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px", display: "block" }}>Manager</label>
                                <select value={filterManager} onChange={(e) => setFilterManager(e.target.value)} className="form-input" style={{ width: "180px", padding: "8px" }}>
                                    <option value="">All Managers</option>
                                    {managersList.map((m: any) => (
                                        <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {(filterDept || filterStatus || filterRole || filterManager) && (
                            <div style={{ marginTop: "22px" }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => { 
                                    setFilterDept(""); 
                                    setFilterStatus(""); 
                                    setFilterRole("");
                                    setFilterManager("");
                                }}>Clear Filters</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
