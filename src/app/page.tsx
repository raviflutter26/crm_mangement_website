"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Dashboard from "@/components/Dashboard";
import EmployeesPage from "@/components/EmployeesPage";
import AttendancePage from "@/components/AttendancePage";
import LeavePage from "@/components/LeavePage";
import PayrollPage from "@/components/PayrollPage";
import DepartmentsPage from "@/components/DepartmentsPage";
import SettingsPage from "@/components/SettingsPage";
import HelpPage from "@/components/HelpPage";
import LoginPage from "@/components/LoginPage";

export default function Home() {
  const [activePage, setActivePage] = useState("dashboard");
  const [token, setToken] = useState<string | null>("loading");

  useEffect(() => {
    setToken(localStorage.getItem("ravi_zoho_token"));
  }, []);

  const handleLogin = (t: string, user: any) => {
    localStorage.setItem("ravi_zoho_token", t);
    localStorage.setItem("ravi_zoho_user", JSON.stringify(user));
    setToken(t);
  };

  if (token === "loading") return null;

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "employees":
        return <EmployeesPage />;
      case "attendance":
        return <AttendancePage />;
      case "leaves":
        return <LeavePage />;
      case "payroll":
        return <PayrollPage />;
      case "departments":
        return <DepartmentsPage />;
      case "settings":
        return <SettingsPage />;
      case "help":
        return <HelpPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="page-wrapper">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="main-content">
        <Topbar />
        <div className="page-content animate-in" key={activePage}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
