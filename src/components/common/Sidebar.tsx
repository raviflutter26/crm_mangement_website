"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import {
    FiGrid, FiUsers, FiClock, FiCalendar, FiDollarSign, FiBriefcase,
    FiSettings, FiHelpCircle, FiZap, FiLayers, FiUserPlus, FiTarget,
    FiFileText, FiPackage, FiUser, FiBarChart2, FiShield, FiLock, FiSliders, FiLogOut, FiActivity, FiSearch, FiGlobe, FiDatabase, FiServer, FiKey, FiMail, FiFlag, FiTag, FiMapPin, FiChevronDown, FiMoreVertical, FiPlay, FiCreditCard
} from "react-icons/fi";
import { API_ENDPOINTS } from "@/config/api";

interface MenuItem {
    id: string;
    label: string;
    icon?: any;
    badge?: string;
    badgeColor?: 'green' | 'red' | 'orange' | 'gray';
    href?: string;
    roles: string[];
    children?: MenuItem[];
    exact?: boolean;
}

const getMenuItems = (counts: any, role: string, empCount: string, leaveCount: string): { [key: string]: MenuItem[] } => {
    // SuperAdmin: dedicated platform-operator console, entirely separate from any tenant's
    // operational menu. SuperAdmin has no organizationId of its own, so tenant modules like
    // Attendance/Leave/Payroll/Assets have no meaningful data to show here.
    if (role === 'superadmin') {
        return {
            "COMMAND CENTER": [
                { id: "dashboard", label: "Dashboard", icon: FiGrid, href: "/superadmin/dashboard", roles: ["superadmin"] },
                { id: "analytics", label: "Analytics & Reports", icon: FiBarChart2, href: "/superadmin/analytics", roles: ["superadmin"] },
                { id: "demo-requests", label: "Demo Requests", icon: FiTarget, href: "/superadmin/demo-requests", roles: ["superadmin"], badge: counts?.newDemoRequests ? String(counts.newDemoRequests) : undefined, badgeColor: "orange" },
                {
                    id: "organizations", label: "Organizations", icon: FiLayers, roles: ["superadmin"],
                    badge: counts?.pendingOrgs ? String(counts.pendingOrgs) : undefined, badgeColor: "orange",
                    children: [
                        { id: "organizations-all", label: "All Organizations", icon: FiLayers, href: "/superadmin/organizations", roles: ["superadmin"] },
                        { id: "organizations-pending", label: "Pending Approval", icon: FiLayers, href: "/superadmin/organizations/pending", roles: ["superadmin"], badge: counts?.pendingOrgs ? String(counts.pendingOrgs) : undefined, badgeColor: "orange" },
                        { id: "organizations-suspended", label: "Suspended", icon: FiLayers, href: "/superadmin/organizations/suspended", roles: ["superadmin"] },
                        { id: "organizations-add", label: "Add New", icon: FiUserPlus, href: "/superadmin/organizations/add", roles: ["superadmin"] },
                    ]
                },
                {
                    id: "users", label: "Global Users", icon: FiUsers, roles: ["superadmin"],
                    badge: counts?.lockedAccounts ? String(counts.lockedAccounts) : undefined, badgeColor: "red",
                    children: [
                        { id: "users-all", label: "All Users", icon: FiUsers, href: "/superadmin/users", roles: ["superadmin"] },
                        { id: "users-invitations", label: "Invitations", icon: FiMail, href: "/superadmin/users/invitations", roles: ["superadmin"], badge: counts?.pendingInvites ? String(counts.pendingInvites) : undefined, badgeColor: "orange" },
                        { id: "users-locked", label: "Locked Accounts", icon: FiLock, href: "/superadmin/users/locked", roles: ["superadmin"], badge: counts?.lockedAccounts ? String(counts.lockedAccounts) : undefined, badgeColor: "red" },
                    ]
                },
            ],
            "PLATFORM OPERATIONS": [
                { id: "health", label: "System Health", icon: FiActivity, href: "/superadmin/health", roles: ["superadmin"] },
                {
                    id: "infra", label: "Infrastructure", icon: FiServer, roles: ["superadmin"],
                    children: [
                        { id: "infra-server", label: "Server", icon: FiServer, href: "/superadmin/infra/server", roles: ["superadmin"] },
                        { id: "infra-database", label: "Database", icon: FiDatabase, href: "/superadmin/infra/database", roles: ["superadmin"] },
                        { id: "infra-gateway", label: "Gateway", icon: FiGlobe, href: "/superadmin/infra/gateway", roles: ["superadmin"] },
                        { id: "infra-cdn", label: "CDN", icon: FiZap, href: "/superadmin/infra/cdn", roles: ["superadmin"] },
                    ]
                },
            ],
            "BILLING & SUBSCRIPTIONS": [
                { id: "finance-subscriptions", label: "Subscriptions", icon: FiCreditCard, href: "/superadmin/finance/subscriptions", roles: ["superadmin"] },
                { id: "finance-revenue", label: "Platform Revenue", icon: FiDollarSign, href: "/superadmin/finance/revenue", roles: ["superadmin"] },
                { id: "seats", label: "Seats & Licenses", icon: FiUsers, href: "/superadmin/seats", roles: ["superadmin"] },
            ],
            "SECURITY": [
                { id: "audit-log", label: "Audit Log", icon: FiShield, href: "/superadmin/audit-log", roles: ["superadmin"], badge: counts?.criticalLogs ? String(counts.criticalLogs) : undefined, badgeColor: "red" },
                { id: "auth-sso", label: "SSO", icon: FiKey, href: "/superadmin/auth/sso", roles: ["superadmin"] },
                { id: "auth-mfa", label: "MFA", icon: FiLock, href: "/superadmin/auth/mfa", roles: ["superadmin"] },
                { id: "auth-sessions", label: "Sessions", icon: FiClock, href: "/superadmin/auth/sessions", roles: ["superadmin"] },
                { id: "auth-ip-allowlist", label: "IP Allowlist", icon: FiGlobe, href: "/superadmin/auth/ip-allowlist", roles: ["superadmin"] },
            ],
            "SUPPORT & CONFIG": [
                { id: "support", label: "Support", icon: FiHelpCircle, href: "/superadmin/support", roles: ["superadmin"], badge: counts?.openTickets ? String(counts.openTickets) : undefined, badgeColor: "orange" },
                {
                    id: "platform-settings", label: "Platform Settings", icon: FiSettings, roles: ["superadmin"],
                    children: [
                        { id: "settings-config", label: "General Config", icon: FiSliders, href: "/superadmin/settings/config", roles: ["superadmin"] },
                        { id: "settings-email", label: "Email Templates", icon: FiMail, href: "/superadmin/settings/email", roles: ["superadmin"] },
                        { id: "settings-features", label: "Feature Flags", icon: FiFlag, href: "/superadmin/settings/features", roles: ["superadmin"] },
                    ]
                },
            ],
        };
    }

    // Standard Admin/HR/Manager Groups based on Command Center UI
    if (role !== 'employee') {
        return {
            "COMMAND CENTER": [
                { id: "dashboard", label: "Dashboard", icon: FiGrid, roles: ["admin", "hr", "manager"] },
                { id: "analytics", label: "Analytics & Reports", icon: FiBarChart2, roles: ["admin"] },
            ],
            "ORGANISATION": [
                { id: "departments", label: "Departments", icon: FiBriefcase, roles: ["admin", "hr"] },
                { id: "employees", label: "Employees", icon: FiUsers, roles: ["admin", "hr", "manager"], badge: empCount || undefined, badgeColor: "green" },
                { id: "locations", label: "Sites & Locations", icon: FiMapPin, roles: ["admin", "hr"] },
                { id: "projects", label: "Project Management", icon: FiLayers, roles: ["admin", "manager"] },
                { id: "vendors", label: "Vendors & Contractors", icon: FiUserPlus, roles: ["admin"] },
            ],
            "HUMAN CAPITAL": [
                { id: "recruitment", label: "Recruitment", icon: FiSearch, roles: ["admin", "hr"] },
                { id: "attendance", label: "Attendance tracking", icon: FiClock, roles: ["admin", "hr", "manager"], badge: "2", badgeColor: "red" },
                { id: "leaves", label: "Leave management", icon: FiCalendar, roles: ["admin", "hr", "manager"], badge: leaveCount || "5", badgeColor: "red" },
                { id: "shifts", label: "Shift & Roster", icon: FiCalendar, roles: ["admin", "hr"] },
                { id: "performance", label: "Performance", icon: FiTarget, roles: ["admin", "hr", "manager"] },
                { id: "training", label: "Training & Certifications", icon: FiTarget, roles: ["admin", "hr"] },
            ],
            "FIELD OPERATIONS": [
                { id: "field-tracking", label: "Field Team Tracking", icon: FiMapPin, roles: ["admin", "manager"] },
                { id: "job-cards", label: "Job Cards / Work Logs", icon: FiBriefcase, roles: ["admin", "manager"] },
                { id: "timesheets", label: "Timesheets", icon: FiFileText, roles: ["admin", "hr", "manager"] },
                { id: "travel", label: "Travel & Site Visits", icon: FiMapPin, roles: ["admin", "manager"] },
                { id: "inventory", label: "Inventory & Materials", icon: FiPackage, roles: ["admin", "manager"] },
            ],
            "SAFETY & COMPLIANCE": [
                { id: "safety-inductions", label: "Safety Inductions", icon: FiShield, roles: ["admin", "hr"] },
                { id: "incidents", label: "Incident Reports", icon: FiActivity, roles: ["admin", "hr", "manager"], badge: "1", badgeColor: "red" },
                { id: "ppe-records", label: "PPE & Tool Records", icon: FiPackage, roles: ["admin", "manager"] },
                { id: "compliance", label: "Compliance & Licences", icon: FiFileText, roles: ["admin", "hr"] },
            ],
            "FINANCE & BILLING": [
                {
                    id: "payroll-module",
                    label: "Payroll Module",
                    icon: FiDollarSign,
                    href: "/payroll-module",
                    roles: ["admin", "hr"],
                    children: [
                        { id: "payroll-module", label: "Overview", icon: FiGrid, href: "/payroll-module", roles: ["admin", "hr"] },
                        { id: "payroll-module/employees", label: "Employees & Bank", icon: FiUsers, href: "/payroll-module/employees", roles: ["admin", "hr"] },
                        { id: "payroll-module/attendance", label: "Attendance", icon: FiClock, href: "/payroll-module/attendance", roles: ["admin", "hr"] },
                        { id: "payroll-module/payroll-runs", label: "Payroll Runs", icon: FiPlay, href: "/payroll-module/payroll-runs", roles: ["admin", "hr"] },
                        { id: "payroll-module/payouts", label: "Payout Status", icon: FiCreditCard, href: "/payroll-module/payouts", roles: ["admin", "hr"] },
                        { id: "payroll-module/reports", label: "Reports", icon: FiBarChart2, href: "/payroll-module/reports", roles: ["admin", "hr"] },
                        { id: "payroll-module/audit", label: "Audit Logs", icon: FiShield, href: "/payroll-module/audit", roles: ["admin", "hr"] },
                    ]
                },
                { id: "reimbursements", label: "Reimbursements", icon: FiFileText, roles: ["admin", "hr", "manager"], badge: "3", badgeColor: "red" },
                { id: "allowances", label: "Site Allowances", icon: FiBriefcase, roles: ["admin", "manager"] },
                { id: "revenue", label: "Project Financials", icon: FiFileText, roles: ["admin"] },
            ],
            "ACCESS CONTROL": [
                { id: "roles", label: "Roles & Permissions", icon: FiLock, roles: ["admin"] },
                { id: "authentication", label: "Authentication", icon: FiKey, roles: ["admin"] },
                { id: "ip-allowlist", label: "IP Allowlist", icon: FiGlobe, roles: ["admin"] },
            ],
            "ASSETS": [
                { id: "assets", label: "Asset Management", icon: FiPackage, roles: ["admin", "hr"] },
                { id: "location-tracking", label: "Location Tracking", icon: FiMapPin, roles: ["admin"] },
            ],
            "PLATFORM SETTINGS": [
                { id: "email-settings", label: "Email & Notifications", icon: FiMail, roles: ["admin"] },
                { id: "support-tickets", label: "Support Tickets", icon: FiTag, roles: ["admin"] },
                { id: "compliance-logs", label: "Compliance & Logs", icon: FiFileText, roles: ["admin"] },
                { id: "attendance-settings", label: "Attendance Rules", icon: FiClock, roles: ["admin"] },
                { id: "permission-settings", label: "Permission Policy", icon: FiShield, roles: ["admin"] },
                { id: "leave-settings", label: "Leave Policy", icon: FiCalendar, roles: ["admin"] },
                { id: "settings", label: "General Settings", icon: FiSettings, roles: ["admin"] },
            ]
        };
    }

    // 👷 Employee Specific Groups (Branded Theme)
    return {
        "HOME": [
            { id: "dashboard", label: "My Dashboard", icon: FiGrid, roles: ["employee"] },
            { id: "profile", label: "My Profile", icon: FiUser, roles: ["employee"] },
        ],
        "ATTENDANCE & TIME": [
            { id: "checkin", label: "Check-In / Check-out", icon: FiClock, roles: ["employee"] },
            { id: "site-attendance", label: "Site Attendance", icon: FiMapPin, roles: ["employee"], badge: "Field", badgeColor: "orange" },
            { id: "job-card", label: "Job Card / Work Log", icon: FiBriefcase, roles: ["employee"], badge: "Field", badgeColor: "orange" },
            { id: "shift-schedule", label: "Shift Schedule", icon: FiCalendar, roles: ["employee"], badge: "Factory", badgeColor: "gray" },
            { id: "timesheets", label: "Timesheets", icon: FiFileText, roles: ["employee"] },
        ],
        "LEAVE & TRAVEL": [
            { id: "leaves", label: "Leave Request", icon: FiCalendar, roles: ["employee"], badge: leaveCount || "2", badgeColor: "orange" },
            { id: "travel-request", label: "Travel / Site Visit Request", icon: FiMapPin, roles: ["employee"], badge: "Field", badgeColor: "orange" },
            { id: "reimbursement", label: "Travel Reimbursement", icon: FiFileText, roles: ["employee"] },
        ],
        "PAYROLL & BENEFITS": [
            { id: "payslips", label: "Pay Slips", icon: FiDollarSign, roles: ["employee"] },
            { id: "allowance", label: "Site Allowance Claims", icon: FiBriefcase, roles: ["employee"], badge: "Field", badgeColor: "orange" },
            { id: "esi-pf", label: "ESI / PF Details", icon: FiShield, roles: ["employee"] },
            { id: "tax", label: "Tax Documents", icon: FiFileText, roles: ["employee"] },
        ],
        "SAFETY & COMPLIANCE": [
            { id: "safety", label: "Safety Induction Status", icon: FiShield, roles: ["employee"] },
            { id: "incident", label: "Incident / Hazard Report", icon: FiActivity, roles: ["employee"] },
            { id: "ppe", label: "PPE & Tool Checklist", icon: FiPackage, roles: ["employee"], badge: "Field", badgeColor: "orange" },
        ],
        "TRAINING & SKILLS": [
            { id: "training", label: "Training Courses", icon: FiBriefcase, roles: ["employee"] },
            { id: "certifications", label: "Certifications", icon: FiTarget, roles: ["employee"] },
            { id: "skills", label: "Solar & Technical Skills", icon: FiZap, roles: ["employee"], badge: "Field", badgeColor: "orange" },
        ],
        "PERFORMANCE": [
            { id: "targets", label: "My Targets", icon: FiTarget, roles: ["employee"] },
            { id: "appraisals", label: "Appraisals", icon: FiTarget, roles: ["employee"] },
        ],
        "MORE": [
            { id: "announcements", label: "Announcements", icon: FiMail, roles: ["employee"], badge: "4", badgeColor: "orange" },
            { id: "documents", label: "My Documents", icon: FiFileText, roles: ["employee"] },
            { id: "team", label: "Team Directory", icon: FiUsers, roles: ["employee"] },
            { id: "settings", label: "Settings", icon: FiSettings, roles: ["employee"] },
        ]
    };
};

export default function Sidebar() {
    const pathname = usePathname();
    const { user, loading, logout } = useAuth();
    const [backendPermissions, setBackendPermissions] = useState<any[]>([]);
    const [empCount, setEmpCount] = useState<string>("");
    const [leaveCount, setLeaveCount] = useState<string>("");
    const [sidebarCounts, setSidebarCounts] = useState<any>({
        pendingOrgs: 0,
        criticalLogs: 0,
        lockedAccounts: 0,
        pendingInvites: 0,
        openTickets: 0,
        newDemoRequests: 0,
        systemHealth: 'OK'
    });
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    
    // Safety check for user role
    const role = (user?.role || "").toLowerCase().trim();
    const menuGroups = getMenuItems(sidebarCounts, role, empCount, leaveCount);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                if (role === 'superadmin') {
                    const countsRes = await axiosInstance.get('/api/superadmin/sidebar-counts');
                    if (countsRes.data?.data) {
                        setSidebarCounts(countsRes.data.data);
                    }
                } else if (role !== 'employee') {
                    const dashRes = await axiosInstance.get(API_ENDPOINTS.DASHBOARD);
                    if (dashRes.data?.data) {
                        setEmpCount(dashRes.data.data.employees?.total?.toString() || "");
                        setLeaveCount(dashRes.data.data.leaves?.pending?.toString() || "");
                    }
                }

                if (role === "admin" || role === "hr") {
                    try {
                        const permRes = await axiosInstance.get(API_ENDPOINTS.ROLE_PERMISSIONS);
                        if (permRes.data?.data) {
                            setBackendPermissions(permRes.data.data);
                        }
                    } catch (permErr) {
                        console.warn("Failed to fetch dynamic permissions", permErr);
                    }
                }
            } catch (err) {
                console.error("Failed to load sidebar data", err);
            }
        };
        fetchData();
        
        const timer = setInterval(fetchData, 60000);
        return () => clearInterval(timer);
    }, [user, role]);

    const filterByRole = (items: MenuItem[]) => {
        if (!role) return [];
        return items.filter(item => {
            const itemRoles = (item.roles || []).map(r => r.toLowerCase().trim());
            
            if (role === 'superadmin') {
                return itemRoles.includes('superadmin');
            }

            const dynamicPerm = backendPermissions.find((p: any) => p.module === item.id);
            if (dynamicPerm) {
                const permRoles = (dynamicPerm.roles || []).map((r: string) => r.toLowerCase().trim());
                return permRoles.includes(role);
            }
            
            return itemRoles.includes(role);
        });
    };

    const getHref = (id: string | undefined) => {
        if (!id) return '#';
        
        const roleLower = role.toLowerCase();
        
        // SuperAdmin specific logic
        if (roleLower === 'superadmin') {
            const superAdminPaths = [
                'dashboard', 'organizations', 'users', 'settings', 'analytics', 
                'audit-log', 'health', 'infra', 'finance', 'support', 'locations', 'seats'
            ];
            if (superAdminPaths.includes(id)) return `/superadmin/${id}`;
            if (id.startsWith('superadmin/')) return `/${id}`;
            
            // For other modules, SuperAdmins should use the standard dashboard routes
            const standardModules = [
                'employees', 'attendance', 'leaves', 'shifts', 'payroll', 'projects',
                'compliance-logs', 'attendance-settings', 'leave-settings', 'settings'
            ];
            if (standardModules.includes(id)) return `/${id}`;
        }
        
        // Base Role Routes (Admin/HR/Manager)
        if (roleLower !== 'superadmin' && (id === 'dashboard' || id === 'analytics')) {
            return `/${roleLower}/${id}`;
        }

        // HR-prefixed module routes
        if (roleLower === 'hr' && ['employees', 'attendance', 'leaves', 'recruitment'].includes(id)) {
            return `/hr/${id}`;
        }

        // Manager-prefixed module routes
        if (roleLower === 'manager' && ['employees', 'attendance', 'leaves', 'projects'].includes(id)) {
            return `/manager/${id}`;
        }

        // Employee Module Hub
        if (roleLower === 'employee') {
            if (id === 'checkin') return '/employee/check-in';
            if (id === 'leaves') return '/employee/leaves';
            if (id === 'profile') return '/employee/profile';
            if (id === 'payslips') return '/employee/payslips';
            const employeeSpecificRoutes = [
                'site-attendance', 'job-card', 'shift-schedule', 'timesheets',
                'travel-request', 'reimbursement', 'allowance', 'esi-pf', 'tax',
                'safety', 'incident', 'ppe', 'training', 'certifications', 'skills',
                'targets', 'appraisals', 'announcements', 'documents', 'team', 'settings'
            ];
            if (employeeSpecificRoutes.includes(id)) {
                return `/employee/${id}`;
            }
        }
        
        return `/${id}`;
    };

    const toggleExpand = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const renderMenuItem = (item: MenuItem, isSubItem = false) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.id);
        const href = item.href || (hasChildren ? undefined : getHref(item.id));

        const existingRoutes = [
            '/superadmin/dashboard', '/superadmin/organizations', '/superadmin/users', '/superadmin/settings',
            '/superadmin/analytics', '/superadmin/demo-requests', '/superadmin/audit-log', '/superadmin/users/invitations', '/superadmin/users/locked', '/superadmin/health',
            '/superadmin/organizations/pending', '/superadmin/organizations/suspended', '/superadmin/organizations/add',
            '/superadmin/seats', '/superadmin/auth/sso', '/superadmin/auth/mfa', '/superadmin/auth/sessions', '/superadmin/auth/ip-allowlist',
            '/superadmin/finance/subscriptions', '/superadmin/finance/revenue',
            '/superadmin/infra/server', '/superadmin/infra/database', '/superadmin/infra/gateway', '/superadmin/infra/cdn',
            '/superadmin/settings/features', '/superadmin/settings/email', '/superadmin/settings/config', '/superadmin/support', '/superadmin/location',
            '/dashboard', '/employees', '/attendance', '/leaves', '/payroll', '/statutory', '/reports', '/departments', '/recruitment', '/performance', '/payroll-reports', '/expenses', '/shifts', '/attendance-settings', '/leave-settings', '/permission-settings', '/salary-settings', '/salary-components', '/roles', '/assets', '/compliance', '/organizations',
            '/admin/dashboard', '/hr/dashboard', '/manager/dashboard', '/admin/analytics', '/superadmin/analytics', '/projects', '/vendors', '/field-tracking', '/job-cards', '/timesheets', '/travel', '/inventory', '/safety-inductions', '/incidents', '/ppe-records', '/reimbursements', '/allowances', '/authentication', '/location-tracking', '/compliance-logs', '/training', '/analytics', '/locations', '/revenue', '/ip-allowlist', '/email-settings', '/support-tickets', '/settings',
            '/admin/dashboard/payroll', '/admin/dashboard/payroll/employees', '/admin/dashboard/payroll/attendance', '/admin/dashboard/payroll/payroll-runs', '/admin/dashboard/payroll/payouts', '/admin/dashboard/payroll/reports', '/admin/dashboard/payroll/audit',
            '/payroll-module', '/payroll-module/employees', '/payroll-module/attendance', '/payroll-module/payroll-runs', '/payroll-module/payouts', '/payroll-module/reports', '/payroll-module/audit',
            '/employee/attendance', '/employee/dashboard', '/employee/profile', '/employee/payslips', '/employee/leaves',
            '/employee/site-attendance', '/employee/job-card', '/employee/shift-schedule', '/employee/timesheets',
            '/employee/travel-request', '/employee/reimbursement', '/employee/allowance', '/employee/esi-pf', '/employee/tax',
            '/employee/safety', '/employee/incident', '/employee/ppe', '/employee/training', '/employee/certifications', '/employee/skills',
            '/employee/targets', '/employee/appraisals', '/employee/announcements', '/employee/documents', '/employee/team', '/employee/settings',
            '/hr/employees', '/hr/attendance', '/hr/leaves', '/hr/recruitment', '/hr/statutory',
            '/manager/employees', '/manager/attendance', '/manager/leaves', '/manager/projects'
        ];

        // Ensure analytics works for admin even if it's named superadmin/analytics
        const finalHref = href && (existingRoutes.includes(href) || href.startsWith('/superadmin/')) ? href : (hasChildren ? undefined : '#');
        const isActive = finalHref && finalHref !== '#' ? (pathname === finalHref || (finalHref !== '/' && pathname.startsWith(finalHref))) : false;

        const content = (
            <>
                {item.icon && (
                   <span className="sidebar-item-icon">
                        {typeof item.icon === 'string' ? item.icon : React.isValidElement(item.icon) ? item.icon : (typeof item.icon === 'function' ? <item.icon /> : null)}
                   </span>
                )}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                    <span className={`sidebar-badge ${item.badgeColor || ''}`}
                        style={{
                            background: item.badgeColor === 'orange' ? 'var(--primary)' : 
                                       item.badgeColor === 'gray' ? 'var(--bg-hover)' :
                                       item.badgeColor === 'green' ? 'var(--secondary)' : 
                                       item.badgeColor === 'red' ? 'rgba(139, 0, 0, 0.8)' : 'var(--bg-hover)',
                             color: 'white'
                        }}>
                        {item.badge}
                    </span>
                )}
                {hasChildren && <FiChevronDown className={`sidebar-item-chevron ${isExpanded ? 'expanded' : ''}`} />}
            </>
        );

        if (hasChildren) {
            return (
                <div key={item.id}>
                    <div
                        className={`sidebar-item ${isActive ? "active" : ""}`}
                        onClick={() => toggleExpand(item.id)}
                    >
                        {content}
                    </div>
                    {isExpanded && (
                        <div className="sidebar-sub-menu">
                            {filterByRole(item.children!).map(child => renderMenuItem(child, true))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                key={item.id}
                href={finalHref || '#'}
                className={isSubItem ? `sidebar-sub-item ${isActive ? "active" : ""}` : `sidebar-item ${isActive ? "active" : ""}`}
            >
                {content}
            </Link>
        );
    };

    const renderSection = (title: string, items: MenuItem[]) => {
        const filteredItems = filterByRole(items);
        if (filteredItems.length === 0) return null;

        return (
            <div key={title} style={{ marginBottom: '24px' }}>
                <div className="sidebar-section-title">{title}</div>
                {filteredItems.map(item => renderMenuItem(item))}
            </div>
        );
    };

    // If still loading or no user, show a simplified loading state for the sidebar
    if (loading || !user) {
        return (
            <aside className="sidebar loading" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-light)' }}>
                <div className="sidebar-header">
                   <div style={{ height: "40px", width: "120px", background: "var(--bg-hover)", borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
                </div>
                <div className="sidebar-nav" style={{ padding: "20px" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} style={{ height: "35px", background: "var(--bg-hover)", borderRadius: "8px", marginBottom: "12px", animation: "pulse 1.5s infinite" }} />
                    ))}
                </div>
                <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
            </aside>
        );
    }

    return (
        <aside className="sidebar" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-light)' }}>
            <div className="sidebar-header" style={{ borderBottom: 'none', paddingBottom: '10px' }}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon" style={{ background: 'transparent' }}>
                        <img src="/rivo-icon.png" alt="RIVO" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', background: 'none', WebkitTextFillColor: 'initial', fontWeight: 800 }}>RIVO</h2>
                        <p style={{ fontSize: '10px' }}>{role === 'superadmin' ? 'Super Admin Console' : role === 'employee' ? 'Employee Self Service' : 'Business Management'}</p>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {Object.keys(menuGroups).map(group => renderSection(group, menuGroups[group]))}
            </nav>

            <div className="sidebar-footer-profile">
                <div className="sidebar-profile-avatar">
                    {user?.firstName?.charAt(0) || 'R'}
                </div>
                <div className="sidebar-profile-info">
                    <div className="sidebar-profile-name">{user ? `${user.firstName} ${user.lastName}` : 'RIVO'}</div>
                    <div className="sidebar-profile-role">{role === 'superadmin' ? 'Super Administrator' : (role.charAt(0).toUpperCase() + role.slice(1) + ' Administrator')}</div>
                </div>
                <div className="sidebar-profile-action" onClick={() => logout()}>
                    <FiMoreVertical />
                </div>
            </div>
        </aside>
    );
}
