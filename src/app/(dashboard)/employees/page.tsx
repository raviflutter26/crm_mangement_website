"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import EmployeesPage from "@/pages/employees/EmployeesPage";
import AddEmployeePage from "@/pages/employees/AddEmployeePage";
import EmployeeDetailsPage from "@/pages/employees/EmployeeDetailsPage";

export default function Employees() {
  const [employeesView, setEmployeesView] = useState<"list" | "add" | "edit" | "view">("list");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notify, setNotify] = useState<{ type: 'success' | 'failure' | 'warning' | null, message: string }>({ type: null, message: "" });

  const showNotify = (type: 'success' | 'failure' | 'warning', message: string) => {
    setNotify({ type, message });
    setTimeout(() => setNotify({ type: null, message: "" }), 5000);
  };

  const fetchLists = useCallback(async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.EMPLOYEES),
        axiosInstance.get(API_ENDPOINTS.DEPARTMENTS)
      ]);
      setEmployees(empRes.data.data);
      setDepartmentsList(deptRes.data.data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    const rawUser = localStorage.getItem("ravi_zoho_user");
    if (rawUser) { try { setCurrentUser(JSON.parse(rawUser)); } catch (e) {} }
    fetchLists();
  }, [fetchLists]);

  const handleUpdateSuccess = async () => {
    await fetchLists();
    setEmployeesView("list");
    setSelectedEmployee(null);
  };

  return (
    <div style={{ position: "relative" }}>
      {notify.type && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          padding: "12px 24px", borderRadius: "8px", background: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderLeft: `4px solid ${notify.type === 'success' ? '#10b981' : notify.type === 'failure' ? '#ef4444' : '#f59e0b'}`,
          display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, animation: "slideIn 0.3s ease-out"
        }}>
          {notify.message}
          <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        </div>
      )}

      {employeesView === "list" ? (
        <EmployeesPage 
          employees={employees}
          departments={departmentsList}
          onRefresh={fetchLists}
          showNotify={showNotify} 
          onAddClick={() => setEmployeesView("add")} 
          onEditClick={(emp) => { setSelectedEmployee(emp); setEmployeesView("edit"); }} 
          onViewClick={(emp) => { setSelectedEmployee(emp); setEmployeesView("view"); }}
        />
      ) : employeesView === "view" ? (
        <EmployeeDetailsPage 
          employee={selectedEmployee} 
          onBack={() => { setEmployeesView("list"); setSelectedEmployee(null); }} 
          onEdit={(emp) => { setSelectedEmployee(emp); setEmployeesView("edit"); }}
          currentUser={currentUser}
        />
      ) : (
        <AddEmployeePage 
          onBack={() => { setEmployeesView("list"); setSelectedEmployee(null); }} 
          onSuccess={handleUpdateSuccess}
          showNotify={showNotify} 
          currentUser={currentUser} 
          employees={employees} 
          departmentsList={departmentsList} 
          editEmployee={employeesView === "edit" ? selectedEmployee : null}
        />
      )}
    </div>
  );
}
