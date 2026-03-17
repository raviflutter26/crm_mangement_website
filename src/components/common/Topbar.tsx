"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiBell, FiMoon, FiSun, FiChevronDown, FiLogOut } from "react-icons/fi";

export default function Topbar() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userName, setUserName] = useState("Admin User");
    const [userRole, setUserRole] = useState("Administrator");
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('ravi_zoho_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            setIsDark(true);
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            setIsDark(false);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('ravi_zoho_theme', newTheme);
        setIsDark(!isDark);
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem('ravi_zoho_user');
            if (raw) {
                const pb = JSON.parse(raw);
                if (pb.name) setUserName(pb.name);
                if (pb.role) setUserRole(pb.role);
            }
        } catch (e) { }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("ravi_zoho_token");
        localStorage.removeItem("ravi_zoho_user");
        window.location.reload();
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div className="topbar-search">
                    <FiSearch className="topbar-search-icon" />
                    <input type="text" placeholder="Search employees, payroll, leaves..." />
                </div>
            </div>

            <div className="topbar-right">
                <button className="topbar-btn" onClick={toggleTheme} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                    {isDark ? <FiSun /> : <FiMoon />}
                </button>
                <button className="topbar-btn" title="Notifications">
                    <FiBell />
                    <span className="topbar-badge">3</span>
                </button>
                <div style={{ position: "relative" }}>
                    <div
                        className="topbar-user"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                    >
                        <div className="topbar-avatar">{userName.substring(0, 2).toUpperCase()}</div>
                        <div className="topbar-user-info">
                            <div className="topbar-user-name">{userName}</div>
                            <div className="topbar-user-role">{userRole}</div>
                        </div>
                        <FiChevronDown style={{ color: "var(--text-muted)", fontSize: "14px", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: ".3s" }} />
                    </div>

                    {dropdownOpen && (
                        <div className="card animate-in" style={{
                            position: "absolute", top: "110%", right: "0",
                            width: "180px", padding: "10px", zIndex: 1000,
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
                        }}>
                            <button
                                onClick={handleLogout}
                                className="btn"
                                style={{
                                    width: "100%", justifyContent: "flex-start",
                                    background: "transparent", color: "var(--error)", border: "none"
                                }}
                            >
                                <FiLogOut style={{ marginRight: "10px" }} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
