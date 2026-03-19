import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiArrowLeft, FiUser, FiBriefcase, FiDollarSign, FiCreditCard, FiFileText, FiMapPin, FiClock, FiSettings, FiCheckCircle, FiEdit2, FiDownload } from "react-icons/fi";

interface EmployeeDetailsPageProps {
    employee: any;
    onBack: () => void;
    onEdit: (emp: any) => void;
    currentUser: any;
}

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

const DetailField = ({ label, value }: { label: string, value: any }) => (
    <div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{value || "-"}</div>
    </div>
);

export default function EmployeeDetailsPage({ employee, onBack, onEdit, currentUser }: EmployeeDetailsPageProps) {
    const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axiosInstance.get(`${API_ENDPOINTS.PAYROLL}?employee=${employee._id}`);
                setPayrollHistory(res.data.data);
            } catch (err) {
                console.error("Failed to fetch payroll history", err);
            } finally {
                setLoadingHistory(false);
            }
        };
        if (employee?._id) fetchHistory();
    }, [employee?._id]);

    if (!employee) return null;

    const isVisible = (section: string) => {
        if (currentUser?.role === "Manager" && (section === "Payroll" || section === "Statutory & Compliance")) return false;
        return true;
    };

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "60px" }}>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: "30px", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                    <button onClick={onBack} className="btn btn-secondary" style={{ padding: "10px", borderRadius: "10px" }}>
                        <FiArrowLeft size={20} />
                    </button>
                    <div style={{
                        width: "80px", height: "80px", borderRadius: "20px",
                        background: `hsl(210, 55%, 30%)`, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "28px", color: "white",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}>
                        {(employee.firstName?.[0] || "")}{(employee.lastName?.[0] || "")}
                    </div>
                    <div>
                        <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>{employee.firstName} {employee.lastName}</h1>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{employee.employeeId}</span>
                            <span style={{ width: "4px", height: "4px", borderRadius: "2px", background: "var(--border)" }}></span>
                            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{employee.designation}</span>
                            <span className={`badge ${employee.status === "Active" ? "active" : "inactive"}`} style={{ marginLeft: "8px" }}>
                                {employee.status}
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={() => onEdit(employee)} className="btn btn-primary">
                    <FiEdit2 /> Edit Profile
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                {/* Main Details */}
                <div>
                    <DetailSection title="Personal Information" icon={<FiUser />}>
                        <DetailField label="Full Name" value={`${employee.firstName} ${employee.lastName}`} />
                        <DetailField label="Email Address" value={employee.email} />
                        <DetailField label="Phone Number" value={employee.phone} />
                        <DetailField label="Gender" value={employee.gender} />
                        <DetailField label="Date of Birth" value={employee.dateOfBirth?.split('T')[0]} />
                        <DetailField label="Marital Status" value={employee.maritalStatus} />
                    </DetailSection>

                    <DetailSection title="Work Information" icon={<FiBriefcase />}>
                        <DetailField label="Department" value={employee.department} />
                        <DetailField label="Designation" value={employee.designation} />
                        <DetailField label="Employee ID" value={employee.employeeId} />
                        <DetailField label="Employment Type" value={employee.employmentType} />
                        <DetailField label="Date of Joining" value={employee.dateOfJoining?.split('T')[0]} />
                        <DetailField label="Work Location" value={employee.location} />
                        <DetailField label="Status" value={employee.status} />
                        <DetailField label="Role in System" value={employee.role} />
                    </DetailSection>

                    {isVisible("Payroll") && (
                        <DetailSection title="Financial & Payroll" icon={<FiDollarSign />}>
                            <DetailField label="Annual CTC" value={`₹${employee.ctc?.toLocaleString()}`} />
                            <DetailField label="Monthly Basic" value={`₹${employee.salary?.basic?.toLocaleString()}`} />
                            <DetailField label="HRA" value={`₹${employee.salary?.hra?.toLocaleString()}`} />
                            <DetailField label="DA" value={`₹${employee.salary?.da?.toLocaleString()}`} />
                            <DetailField label="TA" value={`₹${employee.salary?.ta?.toLocaleString()}`} />
                            <DetailField label="Special Allowance" value={`₹${employee.salary?.specialAllowance?.toLocaleString()}`} />
                            <DetailField label="Payment Cycle" value={employee.paymentCycle} />
                        </DetailSection>
                    )}

                    {isVisible("Statutory & Compliance") && (
                        <DetailSection title="Compliance (PF & ESI)" icon={<FiCheckCircle />}>
                            <DetailField label="PF Enabled" value={employee.pfEnabled ? "Yes" : "No"} />
                            <DetailField label="UAN Number" value={employee.uan} />
                            <DetailField label="PF Number" value={employee.pfNumber} />
                            <DetailField label="PF Joining Date" value={employee.pfJoiningDate?.split('T')[0]} />
                            <DetailField label="ESI Enabled" value={employee.esiEnabled ? "Yes" : "No"} />
                            <DetailField label="ESI Number" value={employee.esiNumber} />
                            <DetailField label="ESI Dispensary" value={employee.esiDispensary} />
                        </DetailSection>
                    )}

                    <DetailSection title="Bank Details" icon={<FiCreditCard />}>
                        <DetailField label="Bank Name" value={employee.bankDetails?.bankName} />
                        <DetailField label="Account Number" value={employee.bankDetails?.accountNumber} />
                        <DetailField label="IFSC Code" value={employee.bankDetails?.ifscCode} />
                        <DetailField label="Branch" value={employee.bankDetails?.branchName} />
                        <DetailField label="Account Holder" value={employee.bankDetails?.accountHolderName || `${employee.firstName} ${employee.lastName}`} />
                        <DetailField label="UPI ID" value={employee.bankDetails?.upiId} />
                    </DetailSection>

                    <DetailSection title="Identity Documents" icon={<FiFileText />}>
                        <DetailField label="PAN Card" value={employee.pan} />
                        <DetailField label="Aadhaar Number" value={employee.aadhaar} />
                        <DetailField label="Passport Number" value={employee.passportNumber} />
                        <DetailField label="Driving License" value={employee.drivingLicense} />
                    </DetailSection>

                    {isVisible("Payroll") && (
                        <div className="card" style={{ marginBottom: "24px", overflow: "hidden" }}>
                            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-secondary)" }}>
                                <div style={{ color: "var(--primary)", fontSize: "20px", display: "flex" }}><FiDollarSign /></div>
                                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Payroll History</h3>
                            </div>
                            <div style={{ padding: "0" }}>
                                <div className="table-wrapper" style={{ boxShadow: "none", border: "none", borderRadius: "0" }}>
                                    <table style={{ margin: 0 }}>
                                        <thead>
                                            <tr>
                                                <th>Month / Year</th>
                                                <th>Gross Pay</th>
                                                <th>Net Pay</th>
                                                <th>Status</th>
                                                <th>Payslip</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payrollHistory.map((run) => (
                                                <tr key={run._id}>
                                                    <td>{MONTHS[run.month - 1]} {run.year}</td>
                                                    <td style={{ fontFamily: "monospace" }}>₹{run.totalEarnings?.toLocaleString()}</td>
                                                    <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--success)" }}>₹{run.netPay?.toLocaleString()}</td>
                                                    <td><span className={`badge ${run.paymentStatus === 'Paid' ? 'active' : 'pending'}`}>{run.paymentStatus}</span></td>
                                                    <td>
                                                        <button className="btn btn-secondary btn-sm" title="Download Payslip">
                                                            <FiDownload size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {payrollHistory.length === 0 && !loadingHistory && (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                                                        No payroll records found for this employee.
                                                    </td>
                                                </tr>
                                            )}
                                            {loadingHistory && (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: "center", padding: "15px" }}>Loading records...</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Details */}
                <div>
                    <DetailSection title="Reporting & Shift" icon={<FiClock />}>
                        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "20px" }}>
                            <DetailField
                                label="Reporting Manager"
                                value={employee.reportingManager ? (
                                    typeof employee.reportingManager === 'object' ?
                                        `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}` :
                                        employee.reportingManager
                                ) : "N/A"}
                            />
                            <DetailField label="Shift Slot" value={employee.shift ? (typeof employee.shift === 'object' ? `${employee.shift.name} (${employee.shift.startTime}-${employee.shift.endTime})` : employee.shift) : "N/A"} />
                        </div>
                    </DetailSection>

                    <DetailSection title="Address Details" icon={<FiMapPin />}>
                        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "20px" }}>
                            <DetailField label="Current Address" value={employee.address?.currentAddress} />
                            <DetailField label="City" value={employee.address?.city} />
                            <DetailField label="State" value={employee.address?.state} />
                            <DetailField label="Zip Code" value={employee.address?.zipCode} />
                            <DetailField label="Country" value={employee.address?.country} />
                        </div>
                    </DetailSection>

                    <DetailSection title="System Access" icon={<FiSettings />}>
                        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ color: "var(--success)" }}><FiCheckCircle /></div>
                                <span style={{ fontSize: "14px" }}>System Account Created</span>
                            </div>
                            <DetailField label="Last Updated" value={new Date(employee.updatedAt || employee.createdAt).toLocaleDateString()} />
                        </div>
                    </DetailSection>
                </div>
            </div>
        </div>
    );
}
