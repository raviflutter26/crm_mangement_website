"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { FiUser, FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiPercent, FiCreditCard, FiFileText, FiSettings, FiCheckCircle } from "react-icons/fi";

const Section = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="card" style={{ marginBottom: "20px", overflow: "hidden" }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: "15px 20px", background: "var(--bg-secondary)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", borderBottom: isOpen ? "1px solid var(--border)" : "none"
                }}
            >
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--primary)" }}>{title}</h3>
                <span style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "0.2s" }}>▼</span>
            </div>
            {isOpen && <div style={{ padding: "20px" }}>{children}</div>}
        </div>
    );
};

interface AddEmployeePageProps {
    onBack: () => void;
    onSuccess: () => void;
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
    currentUser: any;
    employees: any[];
    departmentsList: any[];
    editEmployee?: any;
}

const INDIAN_STATES_CITIES: { [key: string]: string[] } = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
    "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Pasighat"],
    "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
    "Haryana": ["Faridabad", "Gurugram", "Panipat", "Ambala"],
    "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
    "Manipur": ["Imphal"],
    "Meghalaya": ["Shillong"],
    "Mizoram": ["Aizawl"],
    "Nagaland": ["Kohima", "Dimapur"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
    "Sikkim": ["Gangtok"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Erode", "Tirunelveli", "Vellore"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
    "Tripura": ["Agartala"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi"],
    "Puducherry": ["Puducherry"]
};

export default function AddEmployeePage({ onBack, onSuccess, showNotify, currentUser, employees, departmentsList, editEmployee }: AddEmployeePageProps) {
    const isEdit = !!editEmployee;

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    // Fetch lists for dropdowns
    const [locations, setLocations] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [complianceSettings, setComplianceSettings] = useState<any>(null);

    const [formData, setFormData] = useState({
        firstName: editEmployee?.firstName || "", 
        lastName: editEmployee?.lastName || "", 
        employeeId: editEmployee?.employeeId || "", 
        email: editEmployee?.email || "", 
        phone: editEmployee?.phone || "", 
        gender: editEmployee?.gender || "Male", 
        dateOfBirth: (editEmployee?.dateOfBirth || "").split('T')[0], 
        maritalStatus: editEmployee?.maritalStatus || "Single", 
        profilePhoto: editEmployee?.profilePhoto || "",
        department: editEmployee?.department || (currentUser?.role === "Manager" ? currentUser.department : ""), 
        designation: editEmployee?.designation || "", 
        reportingManager: (editEmployee?.reportingManager?._id || editEmployee?.reportingManager) || (currentUser?.role === "Manager" ? currentUser._id : ""), 
        location: editEmployee?.location || "", 
        employmentType: editEmployee?.employmentType || "Full-time", 
        dateOfJoining: (editEmployee?.dateOfJoining || "").split('T')[0], 
        shift: (editEmployee?.shift?._id || editEmployee?.shift) ||  "", 
        status: editEmployee?.status || "Active",
        salaryStructure: editEmployee?.salaryStructure || "Standard", 
        salary: { 
            basic: editEmployee?.salary?.basic || 0, 
            hra: editEmployee?.salary?.hra || 0, 
            da: editEmployee?.salary?.da || 0, 
            ta: editEmployee?.salary?.ta || 0, 
            specialAllowance: editEmployee?.salary?.specialAllowance || 0 
        }, 
        ctc: editEmployee?.ctc || 0, 
        paymentCycle: editEmployee?.paymentCycle || "Monthly",
        pfEnabled: editEmployee?.pfEnabled ?? true, 
        uan: editEmployee?.uan || "", 
        pfNumber: editEmployee?.pfNumber || "", 
        pfJoiningDate: (editEmployee?.pfJoiningDate || "").split('T')[0], 
        pfEmployeeContributionRate: editEmployee?.pfEmployeeContributionRate || 12, 
        pfEmployerContributionRate: editEmployee?.pfEmployerContributionRate || 12,
        esiEnabled: editEmployee?.esiEnabled ?? true, 
        esiNumber: editEmployee?.esiNumber || "", 
        esiJoiningDate: (editEmployee?.esiJoiningDate || "").split('T')[0], 
        esiDispensary: editEmployee?.esiDispensary || "",
        bankDetails: { 
            bankName: editEmployee?.bankDetails?.bankName || "", 
            accountHolderName: editEmployee?.bankDetails?.accountHolderName || "", 
            accountNumber: editEmployee?.bankDetails?.accountNumber || "", 
            confirmAccountNumber: editEmployee?.bankDetails?.accountNumber || "", 
            ifscCode: editEmployee?.bankDetails?.ifscCode || "", 
            branchName: editEmployee?.bankDetails?.branchName || "", 
            upiId: editEmployee?.bankDetails?.upiId || "" 
        },
        pan: editEmployee?.pan || "", 
        aadhaar: editEmployee?.aadhaar || "", 
        passportNumber: editEmployee?.passportNumber || "", 
        drivingLicense: editEmployee?.drivingLicense || "",
        address: { 
            currentAddress: editEmployee?.address?.currentAddress || "", 
            permanentAddress: editEmployee?.address?.permanentAddress || "", 
            city: editEmployee?.address?.city || "", 
            state: editEmployee?.address?.state || "", 
            country: editEmployee?.address?.country || "India", 
            zipCode: editEmployee?.address?.zipCode || "" 
        },
        role: editEmployee?.role || "Employee", 
        generateCredentials: false, 
        sendWelcomeEmail: false
    });

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [locRes, shiftRes, compRes] = await Promise.allSettled([
                    axiosInstance.get(API_ENDPOINTS.LOCATIONS),
                    axiosInstance.get(API_ENDPOINTS.SHIFTS),
                    axiosInstance.get(API_ENDPOINTS.COMPLIANCE)
                ]);
                
                if (locRes.status === 'fulfilled' && locRes.value.data.success) {
                    setLocations(locRes.value.data.data);
                }
                if (shiftRes.status === 'fulfilled' && shiftRes.value.data.success) {
                    setShifts(shiftRes.value.data.data);
                }
                if (compRes.status === 'fulfilled' && compRes.value.data.success) {
                    const comp = compRes.value.data.data;
                    setComplianceSettings(comp);
                    // Standardize defaults from compliance
                    setFormData(prev => ({
                        ...prev,
                        pfEnabled: comp.pf?.enabled ?? prev.pfEnabled,
                        pfEmployeeContributionRate: comp.pf?.employeeContribution ?? prev.pfEmployeeContributionRate,
                        pfEmployerContributionRate: comp.pf?.employerContribution ?? prev.pfEmployerContributionRate,
                        esiEnabled: comp.esi?.enabled ?? prev.esiEnabled,
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch metadata:", err);
            }
        };
        fetchMetadata();
    }, []);

    const steps = [
        { name: "Select Role", icon: <FiUser /> },
        { name: "Basic Info", icon: <FiUser /> },
        { name: "Work Info", icon: <FiBriefcase /> },
        { name: "Reporting", icon: <FiClock /> },
        { name: "Payroll", icon: <FiDollarSign /> },
        { name: "PF / ESI", icon: <FiPercent /> },
        { name: "Bank Details", icon: <FiCreditCard /> },
        { name: "Documents", icon: <FiFileText /> },
        { name: "System", icon: <FiSettings /> },
        { name: "Review", icon: <FiCheckCircle /> }
    ].filter(s => {
        if (currentUser?.role === "Manager" && (s.name === "Payroll" || s.name === "PF / ESI")) return false;
        if (isEdit && s.name === "System") return false;
        return true;
    });

    const totalSteps = steps.length;

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        if (errors[name]) {
            const newErrors = { ...errors };
            delete newErrors[name];
            setErrors(newErrors);
        }

        if (name.includes('.')) {
            const parts = name.split('.');
            if (parts.length === 2) {
                const [parent, child] = parts;
                
                // Prevent negative numbers for specific nested fields
                if (type === 'number' && Number(value) < 0) return;

                setFormData(prev => {
                    let processedValue = type === 'number' ? Number(value) : value;
                    
                    // Auto-capitalize IFSC and PAN
                    if (name === "bankDetails.ifscCode" || name === "pan") {
                        processedValue = value.toUpperCase();
                    }

                    const newData: any = {
                        ...prev,
                        [parent]: { ...((prev as any)[parent] || {}), [child]: processedValue }
                    };
                    
                    // Special case: reset city when state changes
                    if (name === "address.state") {
                        newData.address.city = "";
                    }
                    
                    return newData;
                });
            }
        } else {
            // Prevent negative numbers for specific root fields
            if (type === 'number' && Number(value) < 0) return;

            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
            }));
        }
    };

    const generateEmpId = () => {
        const id = "SRS" + Math.floor(1000 + Math.random() * 9000);
        setFormData({ ...formData, employeeId: id });
    };

    const calculateAge = (dob: string) => {
        if (!dob) return 0;
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const validateStep = () => {
        let isValid = true;
        let missingFields: string[] = [];
        const newErrors: { [key: string]: string } = {};

        const currentStepName = steps[currentStep - 1].name;
        if (currentStepName === "Select Role") {
            if (!formData.role) { isValid = false; newErrors.role = "Role is required"; missingFields.push("Role"); }
        } else if (currentStepName === "Basic Info") {
            if (!formData.firstName) { isValid = false; newErrors.firstName = "First Name is required"; missingFields.push("First Name"); }
            if (!formData.lastName) { isValid = false; newErrors.lastName = "Last Name is required"; missingFields.push("Last Name"); }
            if (!formData.email) { isValid = false; newErrors.email = "Email is required"; missingFields.push("Email"); }
            if (!formData.employeeId) { isValid = false; newErrors.employeeId = "Employee ID is required"; missingFields.push("Employee ID"); }
            if (!formData.phone) { 
                isValid = false; newErrors.phone = "Phone is required"; missingFields.push("Phone"); 
            } else if (!/^\d{10,12}$/.test(formData.phone)) {
                isValid = false; newErrors.phone = "Phone must be 10-12 numbers only"; missingFields.push("Invalid Phone Format");
            }

            if (formData.dateOfBirth) {
                const age = calculateAge(formData.dateOfBirth);
                if (age < 18) {
                    isValid = false; newErrors.dateOfBirth = "Employee must be 18 years or older"; missingFields.push("Underage (18+)");
                }
            }
        } else if (currentStepName === "Work Info") {
            if (!formData.department) { isValid = false; newErrors.department = "Department is required"; missingFields.push("Department"); }
            if (!formData.dateOfJoining) { isValid = false; newErrors.dateOfJoining = "Join Date is required"; missingFields.push("Join Date"); }
            if (formData.address.zipCode && !/^\d{6}$/.test(formData.address.zipCode)) {
                isValid = false; newErrors.zipCode = "Zip Code must be exactly 6 digits"; missingFields.push("Invalid Zip Code");
            }
        } else if (currentStepName === "Reporting") {
            // No strict validations for reporting yet
        } else if (currentStepName === "Payroll") {
            if (!formData.ctc) { isValid = false; newErrors.ctc = "Annual CTC is required"; missingFields.push("Annual CTC"); }
        } else if (currentStepName === "PF / ESI") {
            if (formData.pfEnabled) {
                if (formData.uan && !/^\d{12}$/.test(formData.uan)) {
                    isValid = false; newErrors.uan = "UAN must be exactly 12 digits"; missingFields.push("Invalid UAN");
                }
                if (formData.pfNumber && !/^[A-Z0-9]{5,22}$/i.test(formData.pfNumber)) {
                    isValid = false; newErrors.pfNumber = "PF Number format is invalid"; missingFields.push("Invalid PF Number");
                }
            }
        } else if (currentStepName === "Bank Details") {
            if (!formData.bankDetails.accountNumber) { isValid = false; newErrors["bankDetails.accountNumber"] = "Account Number is required"; missingFields.push("Account Number"); }
            if (formData.bankDetails.accountNumber !== formData.bankDetails.confirmAccountNumber) {
                isValid = false;
                newErrors["bankDetails.confirmAccountNumber"] = "Numbers do not match";
                missingFields.push("Account Number Mismatch");
            }
            const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
            if (formData.bankDetails.ifscCode && !ifscRegex.test(formData.bankDetails.ifscCode)) {
                isValid = false; newErrors.ifscCode = "Invalid IFSC Code format"; missingFields.push("Invalid IFSC");
            }
        } else if (currentStepName === "Documents") {
            if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
                isValid = false; newErrors.pan = "Invalid PAN Format (ABCDE1234F)"; missingFields.push("Invalid PAN");
            }
            if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar)) {
                isValid = false; newErrors.aadhaar = "Aadhaar must be 12 digits"; missingFields.push("Invalid Aadhaar");
            }
        }

        setErrors(newErrors);
        if (!isValid) showNotify('failure', `Validation Errors: ${missingFields.join(", ")}`);
        return isValid;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (isEdit && editEmployee) {
                await axiosInstance.put(`${API_ENDPOINTS.EMPLOYEES}/${editEmployee._id}`, formData);
                showNotify('success', "Employee updated successfully!");
            } else {
                await axiosInstance.post(API_ENDPOINTS.EMPLOYEES, formData);
                showNotify('success', "Employee created successfully!");
            }
            onSuccess();
        } catch (err: any) {
            showNotify('failure', err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} employee`);
        } finally {
            setLoading(false);
        }
    };

    const availableManagers = formData.department 
        ? employees.filter(e => e.department === formData.department && ["Admin", "HR", "Manager"].includes(e.role))
        : employees.filter(e => ["Admin", "HR", "Manager"].includes(e.role));

    const renderStepContent = () => {
        const stepName = steps[currentStep - 1].name;

        switch (stepName) {
            case "Select Role":
                return (
                    <div className="card animate-in" style={{ padding: "40px", textAlign: "center" }}>
                        <h2 style={{ marginBottom: "30px" }}>What is the employee's role?</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
                            {["Admin", "HR", "Manager", "Employee"].map(role => (
                                <div key={role} onClick={() => setFormData({ ...formData, role: role as any, reportingManager: "" })}
                                    style={{
                                        padding: "30px", borderRadius: "16px", border: "2px solid",
                                        borderColor: formData.role === role ? "var(--primary)" : "var(--border)",
                                        background: formData.role === role ? "var(--primary-bg-light)" : "var(--bg-secondary)",
                                        cursor: "pointer", transition: "0.2s", textAlign: "left"
                                    }}>
                                    <div style={{ fontSize: "18px", fontWeight: 700, color: formData.role === role ? "var(--primary)" : "var(--text-primary)", marginBottom: "8px" }}>{role}</div>
                                    <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Assign {role} access to the user.</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case "Basic Info":
                return (
                    <div className="card animate-in" style={{ padding: "30px" }}>
                        <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Basic Information</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div><label className="form-label">First Name *</label><input name="firstName" value={formData.firstName} onChange={handleInputChange} className="form-input" />{errors.firstName && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.firstName}</div>}</div>
                            <div><label className="form-label">Last Name *</label><input name="lastName" value={formData.lastName} onChange={handleInputChange} className="form-input" />{errors.lastName && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.lastName}</div>}</div>
                            <div><label className="form-label">Email *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" />{errors.email && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.email}</div>}</div>
                            <div>
                                <label className="form-label">Employee ID *</label>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <input name="employeeId" value={formData.employeeId} onChange={handleInputChange} className="form-input" />
                                    <button onClick={generateEmpId} className="btn btn-secondary btn-sm">Auto</button>
                                </div>
                                {errors.employeeId && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.employeeId}</div>}
                            </div>
                            <div>
                                <label className="form-label">Phone *</label>
                                <input name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder="e.g. 9876543210" />
                                {errors.phone && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.phone}</div>}
                            </div>
                            <div>
                                <label className="form-label">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleInputChange} className="form-input">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                             <div>
                                <label className="form-label">Date of Birth</label>
                                <input 
                                    type="date" 
                                    name="dateOfBirth" 
                                    value={formData.dateOfBirth} 
                                    onChange={handleInputChange} 
                                    className="form-input" 
                                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                />
                                {errors.dateOfBirth && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.dateOfBirth}</div>}
                            </div>
                            <div>
                                <label className="form-label">Marital Status</label>
                                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} className="form-input">
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case "Work Info":
                return (
                    <div className="card animate-in" style={{ padding: "30px" }}>
                        <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Work & Address Info</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <label className="form-label">Department *</label>
                                <select name="department" value={formData.department} onChange={handleInputChange} className="form-input">
                                    <option value="">Select</option>
                                    {departmentsList.map((d: any) => <option key={d._id} value={d.name}>{d.name}</option>)}
                                </select>
                                {errors.department && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.department}</div>}
                            </div>
                            <div><label className="form-label">Designation</label><input name="designation" value={formData.designation} onChange={handleInputChange} className="form-input" /></div>
                            <div>
                                <label className="form-label">Employment Type</label>
                                <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="form-input">
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Intern">Intern</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Location</label>
                                <select name="location" value={formData.location} onChange={handleInputChange} className="form-input">
                                    <option value="">Select Location</option>
                                    {locations.map(l => <option key={l._id} value={l.name}>{l.branch ? `${l.branch} - ${l.name}` : l.name}</option>)}
                                </select>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label className="form-label">Current Address</label>
                                <textarea name="address.currentAddress" value={formData.address.currentAddress} onChange={handleInputChange} className="form-input" style={{ height: "80px" }} />
                            </div>
                            <div>
                                <label className="form-label">State</label>
                                <select name="address.state" value={formData.address.state} onChange={handleInputChange} className="form-input">
                                    <option value="">Select State</option>
                                    {Object.keys(INDIAN_STATES_CITIES).map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">City</label>
                                <select name="address.city" value={formData.address.city} onChange={handleInputChange} className="form-input" disabled={!formData.address.state}>
                                    <option value="">Select City</option>
                                    {(INDIAN_STATES_CITIES[formData.address.state] || []).map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Zip Code</label>
                                <input name="address.zipCode" value={formData.address.zipCode} onChange={handleInputChange} className="form-input" placeholder="600001" />
                                {errors.zipCode && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.zipCode}</div>}
                            </div>
                            <div><label className="form-label">Date of Joining *</label><input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleInputChange} className="form-input" /></div>
                        </div>
                    </div>
                );

            case "Reporting":
                return (
                    <div className="card animate-in" style={{ padding: "30px" }}>
                        <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Reporting & Shift</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <label className="form-label">Reporting Manager</label>
                                <select name="reportingManager" value={formData.reportingManager} onChange={handleInputChange} className="form-input">
                                    <option value="">Select Manager</option>
                                    {availableManagers.map(m => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Shift</label>
                                <select name="shift" value={formData.shift} onChange={handleInputChange} className="form-input">
                                    <option value="">Select Shift</option>
                                    {shifts.map(s => <option key={s._id} value={s._id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case "Payroll":
                return (
                    <div className="card animate-in" style={{ padding: "30px" }}>
                        <div style={{ marginBottom: "20px" }}>
                            <h3 style={{ color: "var(--primary)", marginBottom: "5px" }}>Payroll Details</h3>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                                Set the employee's Annual CTC and its components (Basic, HRA, etc.). 
                                Values must be positive and represent the monthly breakdown for salary generation.
                            </p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div><label className="form-label">Annual CTC (INR) *</label><input type="number" name="ctc" value={formData.ctc} onChange={handleInputChange} className="form-input" /></div>
                            <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", padding: "15px", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                                <div><label className="form-label">Basic</label><input type="number" name="salary.basic" value={formData.salary.basic} onChange={handleInputChange} className="form-input" /></div>
                                <div><label className="form-label">HRA</label><input type="number" name="salary.hra" value={formData.salary.hra} onChange={handleInputChange} className="form-input" /></div>
                                <div><label className="form-label">TA</label><input type="number" name="salary.ta" value={formData.salary.ta} onChange={handleInputChange} className="form-input" /></div>
                                <div><label className="form-label">DA</label><input type="number" name="salary.da" value={formData.salary.da} onChange={handleInputChange} className="form-input" /></div>
                                <div><label className="form-label">Special Allowance</label><input type="number" name="salary.specialAllowance" value={formData.salary.specialAllowance} onChange={handleInputChange} className="form-input" /></div>
                            </div>
                        </div>
                    </div>
                );

            case "PF / ESI":
                return (
                    <div className="card animate-in" style={{ padding: "30px" }}>
                        <div style={{ display: "flex", gap: "40px" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                                    <h4 style={{ color: "var(--primary)" }}>Provident Fund (PF)</h4>
                                    <input type="checkbox" name="pfEnabled" checked={formData.pfEnabled} onChange={handleInputChange} />
                                </div>
                                {formData.pfEnabled && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <div>
                                            <input placeholder="UAN Number (12 digits)" name="uan" value={formData.uan} onChange={handleInputChange} className="form-input" />
                                            {errors.uan && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.uan}</div>}
                                        </div>
                                        <div>
                                            <input placeholder="PF Number" name="pfNumber" value={formData.pfNumber} onChange={handleInputChange} className="form-input" />
                                            {errors.pfNumber && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.pfNumber}</div>}
                                        </div>
                                        <input type="date" name="pfJoiningDate" value={formData.pfJoiningDate} onChange={handleInputChange} className="form-input" />
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                            <div>
                                                <label style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Employee PF Rate (%)</label>
                                                <input type="number" name="pfEmployeeContributionRate" value={formData.pfEmployeeContributionRate} onChange={handleInputChange} className="form-input" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Employer PF Rate (%)</label>
                                                <input type="number" name="pfEmployerContributionRate" value={formData.pfEmployerContributionRate} onChange={handleInputChange} className="form-input" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                                    <h4 style={{ color: "var(--primary)" }}>ESI</h4>
                                    <input type="checkbox" name="esiEnabled" checked={formData.esiEnabled} onChange={handleInputChange} />
                                </div>
                                {formData.esiEnabled && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <input placeholder="ESI Number" name="esiNumber" value={formData.esiNumber} onChange={handleInputChange} className="form-input" />
                                        <input type="date" name="esiJoiningDate" value={formData.esiJoiningDate} onChange={handleInputChange} className="form-input" />
                                        <input placeholder="ESI Dispensary" name="esiDispensary" value={formData.esiDispensary} onChange={handleInputChange} className="form-input" />
                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", padding: "5px", background: "var(--bg-secondary)", borderRadius: "4px" }}>
                                            Rates: {complianceSettings?.esi?.employeeContribution || 0.75}% (Employee) / {complianceSettings?.esi?.employerContribution || 3.25}% (Employer)
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case "Bank Details":
                return (
                    <div className="card animate-in" style={{ padding: "30px" }}>
                        <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Bank Account Information</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div><label className="form-label">Bank Name</label><input name="bankDetails.bankName" value={formData.bankDetails.bankName} onChange={handleInputChange} className="form-input" /></div>
                            <div><label className="form-label">Branch Name</label><input name="bankDetails.branchName" value={formData.bankDetails.branchName} onChange={handleInputChange} className="form-input" /></div>
                            <div><label className="form-label">Account Number</label><input name="bankDetails.accountNumber" value={formData.bankDetails.accountNumber} onChange={handleInputChange} className="form-input" />{errors["bankDetails.accountNumber"] && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors["bankDetails.accountNumber"]}</div>}</div>
                            <div><label className="form-label">Confirm Account Number</label><input name="bankDetails.confirmAccountNumber" value={formData.bankDetails.confirmAccountNumber} onChange={handleInputChange} className="form-input" />{errors["bankDetails.confirmAccountNumber"] && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors["bankDetails.confirmAccountNumber"]}</div>}</div>
                            <div>
                                <label className="form-label">IFSC Code</label>
                                <input name="bankDetails.ifscCode" value={formData.bankDetails.ifscCode} onChange={handleInputChange} className="form-input" placeholder="e.g., HDFC0001234" />
                                {errors.ifscCode && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.ifscCode}</div>}
                            </div>
                            <div><label className="form-label">UPI ID (Optional)</label><input name="bankDetails.upiId" value={formData.bankDetails.upiId} onChange={handleInputChange} className="form-input" /></div>
                        </div>
                    </div>
                );

            case "Documents":
                return (
                    <div className="card animate-in" style={{ padding: "30px" }}>
                        <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Identity Documents</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                             <div>
                                <label className="form-label">PAN Number</label>
                                <input name="pan" value={formData.pan} onChange={handleInputChange} className="form-input" placeholder="ABCDE1234F" />
                                {errors.pan && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.pan}</div>}
                            </div>
                            <div>
                                <label className="form-label">Aadhaar Number</label>
                                <input name="aadhaar" value={formData.aadhaar} onChange={handleInputChange} className="form-input" placeholder="12 Digit Number" />
                                {errors.aadhaar && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.aadhaar}</div>}
                            </div>
                            <div><label className="form-label">Passport Number</label><input name="passportNumber" value={formData.passportNumber} onChange={handleInputChange} className="form-input" /></div>
                            <div><label className="form-label">Driving License</label><input name="drivingLicense" value={formData.drivingLicense} onChange={handleInputChange} className="form-input" /></div>
                        </div>
                    </div>
                );

            case "System":
                return (
                    <div className="card animate-in" style={{ padding: "40px" }}>
                        <h3 style={{ marginBottom: "25px", color: "var(--primary)" }}>System & Onboarding</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "15px", padding: "15px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                                <input type="checkbox" name="sendWelcomeEmail" checked={formData.sendWelcomeEmail} onChange={handleInputChange} style={{ width: "20px", height: "20px" }} />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Send Welcome Email</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Employee will receive an invitation to set their password.</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "15px", padding: "15px", background: "var(--bg-secondary)", borderRadius: "10px" }}>
                                <input type="checkbox" name="generateCredentials" checked={formData.generateCredentials} onChange={handleInputChange} style={{ width: "20px", height: "20px" }} />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Auto-Generate Credentials</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>System will automatically create a user account for this employee.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Review":
                return (
                    <div className="animate-in">
                        <div className="card" style={{ padding: "30px", marginBottom: "20px" }}>
                            <h3 style={{ color: "var(--primary)", marginBottom: "20px" }}>Summary Review</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                                <div>
                                    <div style={{ fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px" }}>Personal & Role</div>
                                    <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "5px" }}>
                                        <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                                        <div><strong>Email:</strong> {formData.email}</div>
                                        <div><strong>Role:</strong> {formData.role}</div>
                                        <div><strong>ID:</strong> {formData.employeeId}</div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px" }}>Work Context</div>
                                    <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "5px" }}>
                                        <div><strong>Department:</strong> {formData.department}</div>
                                        <div><strong>Designation:</strong> {formData.designation}</div>
                                        <div><strong>Joining:</strong> {formData.dateOfJoining}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)", fontSize: "14px" }}>
                            Please verify all details before clicking Submit.
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div style={{ position: "relative", paddingBottom: "120px" }}>
            <div className="page-header" style={{ marginBottom: "20px" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="btn btn-secondary" onClick={onBack}>← Back</button>
                    <div>
                        <h1 className="page-title">{isEdit ? "Edit Employee" : "Add New Employee"}</h1>
                        <p className="page-subtitle">{isEdit ? "Update employee information" : "Full Onboarding Wizard"}</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: "24px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                    {steps.map((s, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1, position: "relative", zIndex: 1 }}>
                            <div style={{
                                width: "32px", height: "32px", borderRadius: "16px",
                                background: currentStep === i + 1 ? "var(--primary)" : currentStep > i + 1 ? "var(--secondary)" : "var(--bg-card)",
                                color: currentStep >= i + 1 ? "white" : "var(--text-muted)",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", border: "2px solid var(--border)",
                                fontWeight: 700, transition: "0.3s"
                            }}>{currentStep > i + 1 ? "✓" : i + 1}</div>
                            <span style={{ fontSize: "10px", fontWeight: currentStep === i + 1 ? 700 : 500, color: currentStep === i + 1 ? "var(--text-primary)" : "var(--text-muted)", textAlign: "center", maxWidth: "60px" }}>{s.name}</span>
                        </div>
                    ))}
                    <div style={{ position: "absolute", top: "16px", left: "5%", right: "5%", height: "2px", background: "var(--border)", zIndex: 0 }} />
                </div>
            </div>

            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                {renderStepContent()}

                <div style={{ position: "fixed", bottom: 0, left: "260px", right: 0, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--border)", padding: "20px 40px", display: "flex", justifyContent: "space-between", zIndex: 100 }}>
                    <button className="btn btn-secondary" style={{ width: "120px", justifyContent: "center" }} onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 1}>Prev</button>
                    {currentStep < totalSteps ? (
                        <button className="btn btn-primary" style={{ width: "120px", justifyContent: "center" }} onClick={() => { if (validateStep()) setCurrentStep(s => s + 1); }}>Next</button>
                    ) : (
                        <button className="btn btn-primary" style={{ width: "120px", justifyContent: "center" }} onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : isEdit ? "Update" : "Submit"}</button>
                    )}
                </div>
            </div>
        </div>
    );
}
