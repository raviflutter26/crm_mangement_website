"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS, API_BASE_URL } from "@/config/api";
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
        esiSalaryLimit: editEmployee?.esiSalaryLimit || 21000,
        bankDetails: { 
            bankName: editEmployee?.bankDetails?.bankName || "", 
            accountHolderName: editEmployee?.bankDetails?.accountHolderName || "", 
            accountNumber: editEmployee?.bankDetails?.accountNumber || "", 
            confirmAccountNumber: editEmployee?.bankDetails?.accountNumber || "", 
            ifscCode: editEmployee?.bankDetails?.ifscCode || "", 
            branchName: editEmployee?.bankDetails?.branchName || "", 
            upiId: editEmployee?.bankDetails?.upiId || "",
            cancelledCheque: editEmployee?.bankDetails?.cancelledCheque || ""
        },
        panNumber: editEmployee?.panNumber || "", 
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
        generateCredentials: true, 
        sendWelcomeEmail: true
    });

    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [isFetchingIFSC, setIsFetchingIFSC] = useState(false);
    const [ifscVerified, setIfscVerified] = useState(false);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [locRes, shiftRes, compRes, tempRes] = await Promise.allSettled([
                    axiosInstance.get(API_ENDPOINTS.LOCATIONS),
                    axiosInstance.get(API_ENDPOINTS.SHIFTS),
                    axiosInstance.get(API_ENDPOINTS.COMPLIANCE),
                    axiosInstance.get(`${API_BASE_URL}/api/salary-templates`)
                ]);
                
                if (locRes.status === 'fulfilled' && locRes.value.data.success) {
                    setLocations(locRes.value.data.data);
                }
                if (shiftRes.status === 'fulfilled' && shiftRes.value.data.success) {
                    setShifts(shiftRes.value.data.data);
                }
                if (tempRes.status === 'fulfilled' && tempRes.value.data.success) {
                    const temps = tempRes.value.data.data;
                    setTemplates(temps);
                    const def = temps.find((t: any) => t.isDefault);
                    if (def) setSelectedTemplate(def);
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

    const fetchBankDetails = async (ifsc: string) => {
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
            setIfscVerified(false);
            return;
        }

        setIsFetchingIFSC(true);
        try {
            const res = await axiosInstance.get(`${API_BASE_URL}/api/bank/ifsc/${ifsc}`);
            if (res.data.success) {
                setFormData(prev => ({
                    ...prev,
                    bankDetails: {
                        ...prev.bankDetails,
                        bankName: res.data.data.bank,
                        branchName: res.data.data.branch
                    }
                }));
                setIfscVerified(true);
            }
        } catch (err) {
            console.error("IFSC fetch failed:", err);
            setIfscVerified(false);
        } finally {
            setIsFetchingIFSC(false);
        }
    };

    const autoCalculateSalary = (ctc: number) => {
        if (!ctc) return;
        const monthly = Math.round(ctc / 12);
        const t = selectedTemplate || { basicPercent: 40, hraPercent: 20, daPercent: 10, specialAllowancePercent: 30 };
        const basic = Math.round(monthly * (t.basicPercent / 100));
        const hra = Math.round(monthly * (t.hraPercent / 100));
        const da = Math.round(monthly * (t.daPercent / 100));
        const specialAllowance = monthly - (basic + hra + da);

        setFormData(prev => ({ ...prev, salary: { basic, hra, da, specialAllowance } }));
    };

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
        if (formData.role === "Admin" && s.name === "Reporting") return false;
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
                if (type === 'number' && value !== "" && Number(value) < 0) return;

                setFormData(prev => {
                    let processedValue = type === 'number' ? (value === "" ? "" : Number(value)) : value;
                    
                    // Auto-capitalize IFSC and PAN
                    if (name === "bankDetails.ifscCode" || name === "panNumber") {
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
            if (type === 'number' && value !== "" && Number(value) < 0) return;

            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === "" ? "" : Number(value)) : value)
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
                if (!formData.uan) { isValid = false; newErrors.uan = "UAN is required when PF is enabled"; missingFields.push("UAN"); }
                else if (!/^\d{12}$/.test(formData.uan)) {
                    isValid = false; newErrors.uan = "UAN must be exactly 12 digits"; missingFields.push("Invalid UAN");
                }
                if (!formData.pfNumber) { isValid = false; newErrors.pfNumber = "PF Number is required when PF is enabled"; missingFields.push("PF Number"); }
                else if (!/^[A-Z0-9]{5,22}$/i.test(formData.pfNumber)) {
                    isValid = false; newErrors.pfNumber = "PF Number format is invalid"; missingFields.push("Invalid PF Number");
                }
            }
            if (formData.esiEnabled) {
                if (!formData.esiNumber) { isValid = false; newErrors.esiNumber = "ESI Number is required when ESI is enabled"; missingFields.push("ESI Number"); }
            }
        } else if (currentStepName === "Bank Details") {
            if (!formData.bankDetails.accountHolderName) { isValid = false; newErrors["bankDetails.accountHolderName"] = "Account Holder Name is required"; missingFields.push("Account Holder Name"); }
            if (!formData.bankDetails.accountNumber) { isValid = false; newErrors["bankDetails.accountNumber"] = "Account Number is required"; missingFields.push("Account Number"); }
            else if (!/^\d{9,18}$/.test(formData.bankDetails.accountNumber)) {
                isValid = false; newErrors["bankDetails.accountNumber"] = "Account number must be 9-18 digits"; missingFields.push("Account Number Format");
            }
            if (!formData.bankDetails.ifscCode) { isValid = false; newErrors["bankDetails.ifscCode"] = "IFSC Code is required"; missingFields.push("IFSC Code"); }
            else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bankDetails.ifscCode)) {
                isValid = false; newErrors["bankDetails.ifscCode"] = "Invalid IFSC format"; missingFields.push("IFSC Format");
            }
            if (formData.bankDetails.accountNumber !== formData.bankDetails.confirmAccountNumber) {
                isValid = false; newErrors["bankDetails.confirmAccountNumber"] = "Account Numbers do not match"; missingFields.push("Account Number Match");
            }
        } else if (currentStepName === "Documents") {
            if (!formData.panNumber) {
                isValid = false; newErrors.panNumber = "PAN Number is required"; missingFields.push("PAN Number");
            } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
                isValid = false; newErrors.panNumber = "Invalid PAN Format (e.g. ABCDE1234F)"; missingFields.push("Invalid PAN");
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
            // Sanitize data: ObjectIds cannot be empty strings
            const sanitizedData = { ...formData };
            if (!sanitizedData.reportingManager) (sanitizedData as any).reportingManager = null;
            if (!sanitizedData.shift) (sanitizedData as any).shift = null;

            if (isEdit && editEmployee) {
                await axiosInstance.put(`${API_ENDPOINTS.EMPLOYEES}/${editEmployee._id}`, sanitizedData);
                showNotify('success', "Employee updated successfully!");
            } else {
                await axiosInstance.post(API_ENDPOINTS.EMPLOYEES, sanitizedData);
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
                const t = selectedTemplate || { basicPercent: 40, hraPercent: 20, daPercent: 10, specialAllowancePercent: 30 };
                const monthlyCTC = Math.round(Number(formData.ctc) / 12);
                const currentSum = Number(formData.salary.basic) + Number(formData.salary.hra) + Number(formData.salary.da) + Number(formData.salary.specialAllowance);
                const isMismatch = formData.ctc > 0 && currentSum !== monthlyCTC;

                return (
                    <div className="card animate-in" style={{ padding: "30px" }}>
                        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <h3 style={{ color: "var(--primary)", marginBottom: "5px" }}>Payroll Details</h3>
                                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                                    Set Annual CTC. Use "Auto Calculate" for percentage-based breakdown.
                                </p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <label className="form-label" style={{ fontSize: "11px" }}>Salary Template</label>
                                <select 
                                    className="form-input" 
                                    style={{ width: "200px", padding: "4px 8px", height: "32px" }}
                                    value={selectedTemplate?._id || ""}
                                    onChange={(e) => {
                                        const found = templates.find(temp => temp._id === e.target.value);
                                        setSelectedTemplate(found);
                                        if (formData.ctc) autoCalculateSalary(formData.ctc);
                                    }}
                                >
                                    {templates.map(temp => <option key={temp._id} value={temp._id}>{temp.name}</option>)}
                                    {templates.length === 0 && <option value="">Standard (40/20/10/30)</option>}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <label className="form-label">Annual CTC (INR) *</label>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <input 
                                        type="number" 
                                        name="ctc" 
                                        value={formData.ctc} 
                                        onChange={handleInputChange} 
                                        onBlur={() => autoCalculateSalary(formData.ctc)}
                                        className="form-input" 
                                    />
                                    <button onClick={() => autoCalculateSalary(formData.ctc)} className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap" }}>Auto Calculate</button>
                                </div>
                                <div style={{ fontSize: "12px", marginTop: "4px", color: "var(--text-muted)" }}>Monthly CTC: ₹{monthlyCTC.toLocaleString()}</div>
                            </div>
                            
                            <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: isMismatch ? "1px solid #FFCDD2" : "1px solid var(--border)" }}>
                                <div><label className="form-label">Basic ({t.basicPercent}%)</label><input type="number" name="salary.basic" value={formData.salary.basic} onChange={handleInputChange} className="form-input" /></div>
                                <div><label className="form-label">HRA ({t.hraPercent}%)</label><input type="number" name="salary.hra" value={formData.salary.hra} onChange={handleInputChange} className="form-input" /></div>
                                <div><label className="form-label">DA ({t.daPercent}%)</label><input type="number" name="salary.da" value={formData.salary.da} onChange={handleInputChange} className="form-input" /></div>
                                <div><label className="form-label">Special Allowance ({t.specialAllowancePercent}%)</label><input type="number" name="salary.specialAllowance" value={formData.salary.specialAllowance} onChange={handleInputChange} className="form-input" /></div>
                                
                                {isMismatch && (
                                    <div style={{ gridColumn: "1/-1", color: "#D32F2F", fontSize: "12px", marginTop: "10px", padding: "8px", background: "#FFEBEE", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        ⚠️ Components total (₹{currentSum.toLocaleString()}) does not match Monthly CTC (₹{monthlyCTC.toLocaleString()})
                                    </div>
                                )}
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
                                            <input placeholder="UAN Number (12 digits) *" name="uan" value={formData.uan} onChange={handleInputChange} className="form-input" />
                                            {errors.uan && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.uan}</div>}
                                        </div>
                                        <div>
                                            <input placeholder="PF Number *" name="pfNumber" value={formData.pfNumber} onChange={handleInputChange} className="form-input" />
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
                                        <input placeholder="ESI Number *" name="esiNumber" value={formData.esiNumber} onChange={handleInputChange} className="form-input" />
                                        {errors.esiNumber && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.esiNumber}</div>}
                                        <input type="date" name="esiJoiningDate" value={formData.esiJoiningDate} onChange={handleInputChange} className="form-input" />
                                        <input placeholder="ESI Dispensary" name="esiDispensary" value={formData.esiDispensary} onChange={handleInputChange} className="form-input" />
                                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                            <label style={{ fontSize: "11px", color: "var(--text-secondary)" }}>ESI Salary Limit (INR)</label>
                                            <input type="number" name="esiSalaryLimit" value={formData.esiSalaryLimit} onChange={handleInputChange} className="form-input" placeholder="21000" />
                                        </div>
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
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label className="form-label">Account Holder Name *</label>
                                <input name="bankDetails.accountHolderName" value={formData.bankDetails.accountHolderName} onChange={handleInputChange} className="form-input" placeholder="Name as per bank records" />
                                {errors["bankDetails.accountHolderName"] && <div className="error-text">{errors["bankDetails.accountHolderName"]}</div>}
                            </div>
                            
                            <div>
                                <label className="form-label">IFSC Code *</label>
                                <div style={{ position: "relative" }}>
                                    <input 
                                        name="bankDetails.ifscCode" 
                                        value={formData.bankDetails.ifscCode} 
                                        onChange={handleInputChange} 
                                        onBlur={(e) => fetchBankDetails(e.target.value)}
                                        className="form-input" 
                                        placeholder="e.g., HDFC0001234" 
                                    />
                                    <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
                                        {isFetchingIFSC ? (
                                            <div className="spinner-small" style={{ width: "16px", height: "16px", border: "2px solid #ccc", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                        ) : ifscVerified ? (
                                            <FiCheckCircle color="#4CAF50" size={18} />
                                        ) : null}
                                    </div>
                                </div>
                                {errors["bankDetails.ifscCode"] && <div className="error-text">{errors["bankDetails.ifscCode"]}</div>}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", gridColumn: "1 / -1" }}>
                                <div>
                                    <label className="form-label">Bank Name</label>
                                    <input name="bankDetails.bankName" value={formData.bankDetails.bankName} className="form-input read-only" readOnly style={{ background: "var(--bg-secondary)" }} placeholder="Auto-filled from IFSC" />
                                </div>
                                <div>
                                    <label className="form-label">Branch Name</label>
                                    <input name="bankDetails.branchName" value={formData.bankDetails.branchName} className="form-input read-only" readOnly style={{ background: "var(--bg-secondary)" }} placeholder="Auto-filled from IFSC" />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Account Number *</label>
                                <input name="bankDetails.accountNumber" value={formData.bankDetails.accountNumber} onChange={handleInputChange} className="form-input" placeholder="9-18 digits" />
                                {errors["bankDetails.accountNumber"] && <div className="error-text">{errors["bankDetails.accountNumber"]}</div>}
                            </div>
                            
                            <div>
                                <label className="form-label">Confirm Account Number *</label>
                                <input name="bankDetails.confirmAccountNumber" value={formData.bankDetails.confirmAccountNumber} onChange={handleInputChange} className="form-input" placeholder="Repeat account number" />
                                {errors["bankDetails.confirmAccountNumber"] && <div className="error-text">{errors["bankDetails.confirmAccountNumber"]}</div>}
                            </div>

                            <div style={{ gridColumn: "1 / -1" }}>
                                <label className="form-label">UPI ID (Optional)</label>
                                <input name="bankDetails.upiId" value={formData.bankDetails.upiId} onChange={handleInputChange} className="form-input" placeholder="e.g., user@okhdfc" />
                            </div>

                            <div style={{ gridColumn: "1 / -1" }}>
                                <label className="form-label">Cancelled Cheque / Passbook Copy</label>
                                <input 
                                    type="file" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // Real implementation would upload to S3/Cloudinary
                                            // For now, we'll store a mock path or base64 if small
                                            setFormData(prev => ({
                                                ...prev,
                                                bankDetails: { ...prev.bankDetails, cancelledCheque: file.name }
                                            }));
                                        }
                                    }} 
                                    className="form-input" 
                                    accept="image/*,.pdf"
                                />
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>Upload a clear photo or PDF for verification.</div>
                            </div>
                        </div>
                        <style>{`
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            .error-text { color: red; fontSize: 11px; margin-top: 4px; }
                        `}</style>
                    </div>
                );

            case "Documents":
                return (
                    <div className="card animate-in" style={{ padding: "30px" }}>
                        <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Identity Documents</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                             <div>
                                <label className="form-label">PAN Number *</label>
                                <input name="panNumber" value={formData.panNumber} onChange={handleInputChange} className="form-input" placeholder="ABCDE1234F" maxLength={10} />
                                {errors.panNumber && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.panNumber}</div>}
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
                    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div className="card" style={{ padding: "30px" }}>
                            <h3 style={{ color: "var(--primary)", marginBottom: "20px" }}>Summary Review</h3>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                                {/* Personal & Role */}
                                <div>
                                    <div style={{ fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FiUser size={16} /> Personal & Role
                                    </div>
                                    <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                                        <div><strong>Email:</strong> {formData.email}</div>
                                        <div><strong>Phone:</strong> {formData.phone}</div>
                                        <div><strong>Role:</strong> {formData.role}</div>
                                        <div><strong>Employee ID:</strong> {formData.employeeId}</div>
                                    </div>
                                </div>

                                {/* Work context */}
                                <div>
                                    <div style={{ fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FiBriefcase size={16} /> Work Context
                                    </div>
                                    <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <div><strong>Department:</strong> {formData.department}</div>
                                        <div><strong>Designation:</strong> {formData.designation}</div>
                                        <div><strong>Joining Date:</strong> {formData.dateOfJoining}</div>
                                        <div><strong>Manager:</strong> {formData.reportingManager || "Not Assigned"}</div>
                                    </div>
                                </div>

                                {/* Payroll */}
                                <div>
                                    <div style={{ fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FiDollarSign size={16} /> Payroll & Salary
                                    </div>
                                    <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <div><strong>Annual CTC:</strong> ₹{formData.ctc.toLocaleString()}</div>
                                        <div style={{ padding: "8px", background: "var(--bg-secondary)", borderRadius: "8px", marginTop: "4px" }}>
                                            <div><strong>Basic:</strong> ₹{formData.salary.basic.toLocaleString()}</div>
                                            <div><strong>HRA:</strong> ₹{formData.salary.hra.toLocaleString()}</div>
                                            <div><strong>DA:</strong> ₹{formData.salary.da.toLocaleString()}</div>
                                            <div><strong>Special:</strong> ₹{formData.salary.specialAllowance.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Details */}
                                <div>
                                    <div style={{ fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FiCreditCard size={16} /> Bank Information
                                    </div>
                                    <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <div><strong>Account Holder:</strong> {formData.bankDetails.accountHolderName}</div>
                                        <div><strong>Bank:</strong> {formData.bankDetails.bankName}</div>
                                        <div><strong>Account No:</strong> ****{formData.bankDetails.accountNumber.slice(-4)}</div>
                                        <div><strong>IFSC:</strong> {formData.bankDetails.ifscCode}</div>
                                    </div>
                                </div>

                                {/* Statutory */}
                                <div>
                                    <div style={{ fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FiPercent size={16} /> Statutory Details
                                    </div>
                                    <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <div><strong>PF Status:</strong> {formData.pfEnabled ? "Enabled" : "Disabled"}</div>
                                        {formData.pfEnabled && (
                                            <>
                                                <div><strong>UAN:</strong> {formData.uan}</div>
                                                <div><strong>PF No:</strong> {formData.pfNumber}</div>
                                            </>
                                        )}
                                        <div><strong>ESI Status:</strong> {formData.esiEnabled ? "Enabled" : "Disabled"}</div>
                                        {formData.esiEnabled && <div><strong>ESI No:</strong> {formData.esiNumber}</div>}
                                    </div>
                                </div>

                                {/* Documents */}
                                <div>
                                    <div style={{ fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FiFileText size={16} /> Documents
                                    </div>
                                    <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                         <div><strong>PAN:</strong> {formData.panNumber || "Not Provided"}</div>
                                        <div><strong>Aadhaar:</strong> {formData.aadhaar || "Not Provided"}</div>
                                        <div><strong>Cheque Copy:</strong> {formData.bankDetails.cancelledCheque || "Not Uploaded"}</div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <div style={{ fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FiMapPin size={16} /> Address Details
                                    </div>
                                    <div style={{ fontSize: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                        <div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "2px" }}>Current Address</div>
                                            <div>{formData.address.currentAddress}, {formData.address.city}, {formData.address.state} - {formData.address.zipCode}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "2px" }}>Permanent Address</div>
                                            <div>{formData.address.permanentAddress || "Same as current"}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: "center", padding: "10px", color: "var(--text-secondary)", fontSize: "14px" }}>
                            Please verify all details above before clicking Submit.
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

