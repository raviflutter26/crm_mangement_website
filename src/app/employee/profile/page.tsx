"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiCalendar, FiEdit2, FiShield, FiLock, FiCreditCard, FiFileText, FiClock } from "react-icons/fi";

const DetailSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <div className="card" style={{ marginBottom: "24px", overflow: "hidden" }}>
        <div style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "var(--bg-secondary)"
        }}>
            <div style={{ color: "var(--primary)", fontSize: "20px", display: "flex" }}>{icon}</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{title}</h3>
        </div>
        <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                {children}
            </div>
        </div>
    </div>
);

const DetailField = ({ label, value, icon }: { label: string, value: any, icon?: React.ReactNode }) => (
    <div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            {icon && <span style={{ display: "flex" }}>{icon}</span>}
            {value || "-"}
        </div>
    </div>
);

export default function EmployeeProfilePage() {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?._id) return;
            try {
                const res = await axiosInstance.get(API_ENDPOINTS.EMPLOYEES);
                const employees = res.data.data;
                
                const employeeData = Array.isArray(employees) 
                    ? (employees.find(e => e._id === user._id || e.email === user.email) || employees[0])
                    : employees;

                if (employeeData) {
                    setProfileData(employeeData);
                }
                setError(null);
            } catch (err: any) {
                console.error("Profile Fetch Error:", err);
                setError(err.response?.data?.message || "Failed to fetch profile details");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?._id]);

    const userName = profileData 
        ? `${profileData.firstName} ${profileData.lastName}`.trim() 
        : user ? `${user.firstName} ${user.lastName}`.trim() : "User";

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 1s linear infinite" }} />
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Fetching your enterprise credentials...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "60px" }}>
            
            {/* 🚀 Header / Hero Banner (Branded Orange) */}
            <div style={{
                background: "linear-gradient(135deg, var(--primary) 0%, #FF8C00 100%)",
                borderRadius: "24px", padding: "40px", color: "white",
                position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: "32px",
                boxShadow: "0 10px 30px -10px rgba(255, 107, 0, 0.4)"
            }}>
                <div style={{ 
                    position: "relative", zIndex: 1, width: "120px", height: "120px", borderRadius: "30px", 
                    background: "rgba(255,255,255,0.2)", border: "4px solid rgba(255,255,255,0.3)", 
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", fontWeight: 900,
                    boxShadow: "0 15px 35px rgba(0,0,0,0.1)"
                }}>
                    {userName.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ background: "rgba(255, 255, 255, 0.2)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", border: "1px solid rgba(255, 255, 255, 0.3)" }}>
                            {profileData?.role || user?.role || "Employee"}
                        </span>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>•</span>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                            Emp ID: {profileData?.employeeId || "N/A"}
                        </span>
                    </div>
                    <h1 style={{ fontSize: "42px", fontWeight: 900, margin: "0 0 4px 0", letterSpacing: "-1.5px" }}>{userName}</h1>
                    <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
                        <FiBriefcase /> {profileData?.designation || "N/A"} • {profileData?.department || "N/A"}
                    </div>
                </div>

                <div style={{ position: "absolute", right: "40px", top: "40px", zIndex: 1 }}>
                    <button className="btn" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "10px 20px", fontWeight: 700 }}>
                        <FiEdit2 /> Update Records
                    </button>
                </div>
                
                {/* Decorative Elements */}
                <div style={{ position: "absolute", right: "-5%", top: "-5%", opacity: 0.1, fontSize: "280px", fontWeight: 900 }}>Z</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                
                {/* 🛡️ Main Details Column */}
                <div>
                    <DetailSection title="Personal Information" icon={<FiUser />}>
                        <DetailField label="Full Name" value={userName} />
                        <DetailField label="Email Address" value={profileData?.email || user?.email} icon={<FiMail style={{ color: "var(--primary)" }} />} />
                        <DetailField label="Phone Number" value={profileData?.phone} icon={<FiPhone style={{ color: "#10B981" }} />} />
                        <DetailField label="Gender" value={profileData?.gender} />
                        <DetailField label="Date of Birth" value={profileData?.dateOfBirth?.split('T')[0]} />
                        <DetailField label="Marital Status" value={profileData?.maritalStatus} />
                    </DetailSection>

                    <DetailSection title="Work Information" icon={<FiBriefcase />}>
                        <DetailField label="Department" value={profileData?.department} />
                        <DetailField label="Designation" value={profileData?.designation} />
                        <DetailField label="Employment Type" value={profileData?.employmentType} />
                        <DetailField label="Joined On" value={profileData?.dateOfJoining?.split('T')[0]} icon={<FiCalendar style={{ color: "var(--primary)" }} />} />
                        <DetailField label="Work Location" value={profileData?.location} icon={<FiMapPin style={{ color: "#EF4444" }} />} />
                    </DetailSection>

                    <DetailSection title="Bank Details" icon={<FiCreditCard />}>
                        <DetailField label="Bank Name" value={profileData?.bankDetails?.bankName} />
                        <DetailField label="A/C Number" value={profileData?.bankDetails?.accountNumber} />
                        <DetailField label="IFSC Code" value={profileData?.bankDetails?.ifscCode} />
                        <DetailField label="Branch Name" value={profileData?.bankDetails?.branchName} />
                        <DetailField label="A/C Holder" value={profileData?.bankDetails?.accountHolderName} />
                        <DetailField label="UPI ID" value={profileData?.bankDetails?.upiId} />
                    </DetailSection>

                    <DetailSection title="Identity Documents" icon={<FiFileText />}>
                        <DetailField label="PAN Card" value={profileData?.panNumber} />
                        <DetailField label="Aadhaar No" value={profileData?.aadhaar} />
                        <DetailField label="Passport No" value={profileData?.passportNumber} />
                        <DetailField label="Driving License" value={profileData?.drivingLicense} />
                    </DetailSection>
                </div>

                {/* 🛡️ Sidebar Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <DetailSection title="Reporting & Shift" icon={<FiClock />}>
                        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "24px" }}>
                            <DetailField 
                                label="Reporting Manager" 
                                value={profileData?.reportingManager?.firstName ? `${profileData.reportingManager.firstName} ${profileData.reportingManager.lastName}` : profileData?.reportingManager} 
                            />
                            <DetailField 
                                label="Assigned Shift" 
                                value={profileData?.shift?.name ? `${profileData.shift.name} (${profileData.shift.startTime} - ${profileData.shift.endTime})` : profileData?.shift} 
                            />
                        </div>
                    </DetailSection>

                    <DetailSection title="Address Context" icon={<FiMapPin />}>
                        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "24px" }}>
                            <DetailField label="Current Address" value={profileData?.address?.currentAddress} />
                            <DetailField label="City / State" value={profileData?.address?.city && `${profileData.address.city}, ${profileData.address.state}`} />
                            <DetailField label="Zip / Country" value={profileData?.address?.pincode && `${profileData.address.pincode}, ${profileData.address.country}`} />
                        </div>
                    </DetailSection>

                    <div className="card" style={{ background: "#f0fdf4", border: "1px solid #dcfce7" }}>
                        <div className="card-body" style={{ padding: "32px", textAlign: "center" }}>
                            <FiShield size={40} style={{ color: "#22c55e", marginBottom: "16px" }} />
                            <h4 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 800, color: "#166534" }}>Certified Profile</h4>
                            <p style={{ fontSize: "13px", color: "#166534", opacity: 0.8, margin: "0 0 24px", lineHeight: "1.6", fontWeight: 500 }}>
                                All data is encrypted and used only for payroll and compliance reporting within the organization.
                            </p>
                            <button className="btn btn-sm" style={{ width: "100%", background: "#22c55e", border: "none", color: "white", fontWeight: 700 }}>View Security Audit</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
