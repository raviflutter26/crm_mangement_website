"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS, API_BASE_URL } from "@/config/api";
import { FiUser, FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiPercent, FiCreditCard, FiFileText, FiSettings, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

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

// Dynamic Location API Data (States/Cities) will be fetched from Backend

export default function AddEmployeePage({ onBack, onSuccess, showNotify, currentUser, employees, departmentsList, editEmployee }: AddEmployeePageProps) {
    const isEdit = !!editEmployee;

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Fetch lists for dropdowns
    const [locations, setLocations] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [complianceSettings, setComplianceSettings] = useState<any>(null);
    const [organizationsList, setOrganizationsList] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        firstName: editEmployee?.firstName || "",
        lastName: editEmployee?.lastName || "",
        employeeId: editEmployee?.employeeId || "",
        email: editEmployee?.email || "",
        phone: editEmployee?.phone || "",
        gender: editEmployee?.gender || "Male",
        organizationId: (currentUser?.role !== 'superadmin' && currentUser?.organizationId) 
            ? currentUser.organizationId 
            : (editEmployee?.organizationId?._id || editEmployee?.organizationId || ""),
        dateOfBirth: (editEmployee?.dateOfBirth || "").split('T')[0],
        maritalStatus: editEmployee?.maritalStatus || "Single",
        profilePhoto: editEmployee?.profilePhoto || "",
        department: (editEmployee?.department ? (editEmployee.department.includes(',') ? editEmployee.department.split(',').map((s: string) => s.trim()) : [editEmployee.department]) : (currentUser?.role === "Manager" ? [currentUser.department] : [])),
        designation: editEmployee?.designation || "",
        reportingManager: (editEmployee?.reportingManager?._id || editEmployee?.reportingManager) || (currentUser?.role === "Manager" ? currentUser._id : ""),
        location: editEmployee?.location || "",
        employmentType: editEmployee?.employmentType || "Full-time",
        dateOfJoining: (editEmployee?.dateOfJoining || "").split('T')[0],
        shift: (editEmployee?.shift?._id || editEmployee?.shift) || "",
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
        esiDeductionCycle: editEmployee?.statutory?.esi?.esiDeductionCycle || editEmployee?.esiDeductionCycle || "Monthly",
        // Statutory Nested Object Mapping for Edit (Standardized)
        pfEnabled: editEmployee?.statutory?.pf?.epfEnabled ?? editEmployee?.pfEnabled ?? true,
        uan: editEmployee?.statutory?.pf?.uanNumber || editEmployee?.uan || "",
        pfNumber: editEmployee?.statutory?.pf?.epfNumber || editEmployee?.pfNumber || "",
        pfJoiningDate: (editEmployee?.statutory?.pf?.pfJoiningDate || editEmployee?.pfJoiningDate || "").split('T')[0],
        pfEmployeeContributionRate: editEmployee?.statutory?.pf?.employeeContributionRate || editEmployee?.pfEmployeeContributionRate || 12,
        pfEmployerContributionRate: editEmployee?.statutory?.pf?.employerContributionRate || editEmployee?.pfEmployerContributionRate || 12,
        pfContributionPreferences: {
            employerPF: editEmployee?.statutory?.pf?.contributionPreferences?.employerPFContribution ?? editEmployee?.pfContributionPreferences?.employerPF ?? true,
            edli: editEmployee?.statutory?.pf?.contributionPreferences?.edliContribution ?? editEmployee?.pfContributionPreferences?.edli ?? true,
            adminCharges: editEmployee?.statutory?.pf?.contributionPreferences?.adminCharges ?? editEmployee?.pfContributionPreferences?.adminCharges ?? true
        },
        pfOverrideEnabled: editEmployee?.statutory?.pf?.allowEmployeeLevelOverride ?? editEmployee?.pfOverrideEnabled ?? false,
        pfProRateRestrictedWage: editEmployee?.statutory?.pf?.proRateRestrictedPFWage ?? editEmployee?.pfProRateRestrictedWage ?? true,
        pfLOPBased: editEmployee?.statutory?.pf?.considerSalaryComponentsOnLOP ?? editEmployee?.pfLOPBased ?? true,
        pfABRYEligible: editEmployee?.statutory?.pf?.eligibleForABRYScheme ?? editEmployee?.pfABRYEligible ?? false,
        esiEnabled: editEmployee?.statutory?.esi?.esiEnabled ?? editEmployee?.esiEnabled ?? true,
        esiNumber: editEmployee?.statutory?.esi?.esiNumber || editEmployee?.esiNumber || "",
        esiJoiningDate: (editEmployee?.statutory?.esi?.esiJoiningDate || editEmployee?.esiJoiningDate || "").split('T')[0],
        esiDispensary: editEmployee?.statutory?.esi?.dispensary || editEmployee?.esiDispensary || "",
        esiSalaryLimit: editEmployee?.statutory?.esi?.esiSalaryLimit || editEmployee?.esiSalaryLimit || 21000,
        ptEnabled: editEmployee?.statutory?.pt?.ptEnabled ?? editEmployee?.ptEnabled ?? false,
        ptNumber: editEmployee?.statutory?.pt?.ptRegistrationNumber || editEmployee?.ptNumber || "",
        ptDeductionCycle: editEmployee?.statutory?.pt?.ptDeductionCycle || editEmployee?.ptDeductionCycle || "Monthly",
        lwfEnabled: editEmployee?.statutory?.lwf?.lwfEnabled ?? editEmployee?.lwfEnabled ?? false,
        lwfNumber: editEmployee?.statutory?.lwf?.lwfAccountNumber || editEmployee?.lwfNumber || "",
        lwfDeductionCycle: editEmployee?.statutory?.lwf?.lwfDeductionCycle || editEmployee?.lwfDeductionCycle || "Monthly",
        statutoryBonusEnabled: editEmployee?.statutory?.statutoryBonus?.statutoryBonusEnabled ?? editEmployee?.statutoryBonusEnabled ?? false,
        statutoryBonusAmount: editEmployee?.statutory?.statutoryBonus?.bonusAmount || editEmployee?.statutoryBonusAmount || 0,
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
            pincode: editEmployee?.address?.pincode || editEmployee?.address?.zipCode || ""
        },
        role: editEmployee?.role || "Employee",
        generateCredentials: true,
        sendWelcomeEmail: true
    });

    const [stateSearch, setStateSearch] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const [statesList, setStatesList] = useState<any[]>([]);
    const [citiesList, setCitiesList] = useState<string[]>([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [locationsCache, setLocationsCache] = useState<{ [key: string]: string[] }>({});

    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [isFetchingIFSC, setIsFetchingIFSC] = useState(false);
    const [ifscVerified, setIfscVerified] = useState(false);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [locRes, shiftRes, compRes, tempRes, statesRes, orgsRes] = await Promise.allSettled([
                    axiosInstance.get(API_ENDPOINTS.LOCATIONS),
                    axiosInstance.get(API_ENDPOINTS.SHIFTS),
                    axiosInstance.get(API_ENDPOINTS.COMPLIANCE), // Use COMPLIANCE instead of statutory/config
                    axiosInstance.get(`${API_BASE_URL}/api/salary-templates`),
                    axiosInstance.get(`${API_ENDPOINTS.LOCATIONS}/states?country=India`),
                    axiosInstance.get('/api/organization')
                ]);

                if (orgsRes.status === 'fulfilled' && orgsRes.value.data.success) {
                    setOrganizationsList(orgsRes.value.data.data);
                }

                if (locRes.status === 'fulfilled' && locRes.value.data.success) {
                    setLocations(locRes.value.data.data);
                }
                if (shiftRes.status === 'fulfilled' && shiftRes.value.data.success) {
                    setShifts(shiftRes.value.data.data);
                }
                if (tempRes.status === 'fulfilled') {
                    const temps = tempRes.value.data.data || tempRes.value.data;
                    if (Array.isArray(temps)) {
                        setTemplates(temps);
                        const def = temps.find((t: any) => t.isDefault);
                        if (def) setSelectedTemplate(def);
                    }
                }
                if (statesRes.status === 'fulfilled' && statesRes.value.data.success) {
                    setStatesList(statesRes.value.data.data);
                }
                if (compRes.status === 'fulfilled' && compRes.value.data.success) {
                    const comp = compRes.value.data.data;
                    setComplianceSettings(comp);
                    // Standardize defaults from global config
                    setFormData(prev => ({
                        ...prev,
                        pfEnabled: comp.epf?.epfEnabled ?? prev.pfEnabled,
                        pfEmployeeContributionRate: comp.epf?.employeeContributionRate ?? prev.pfEmployeeContributionRate,
                        esiEnabled: comp.esi?.esiEnabled ?? prev.esiEnabled,
                        esiSalaryLimit: comp.esi?.esiSalaryLimit ?? prev.esiSalaryLimit,
                        ptEnabled: comp.professionalTax?.enabled ?? prev.ptEnabled,
                        lwfEnabled: comp.labourWelfareFund?.enabled ?? prev.lwfEnabled,
                        statutoryBonusEnabled: comp.statutoryBonus?.enabled ?? prev.statutoryBonusEnabled
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch metadata:", err);
            }
        };
        fetchMetadata();
    }, []);

    const fetchCitiesForState = async (stateName: string) => {
        if (!stateName) return;

        // Check cache
        if (locationsCache[stateName]) {
            setCitiesList(locationsCache[stateName]);
            return;
        }

        setLoadingCities(true);
        try {
            const res = await axiosInstance.get(`${API_ENDPOINTS.LOCATIONS}/cities?country=India&state=${encodeURIComponent(stateName)}`);
            if (res.data.success) {
                const cities = Array.from(new Set(res.data.data as string[]));
                setCitiesList(cities);
                setLocationsCache(prev => ({ ...prev, [stateName]: cities }));
            } else {
                showNotify('warning', res.data.message || 'Unable to load cities for this state.');
            }
        } catch (err) {
            console.error("Failed to fetch cities:", err);
            showNotify('failure', "Network error while loading cities.");
        } finally {
            setLoadingCities(false);
        }
    };

    // Prefetch cities if editing
    useEffect(() => {
        if (formData.address.state && citiesList.length === 0) {
            fetchCitiesForState(formData.address.state);
        }
    }, [formData.address.state]);

    useEffect(() => {
        const fetchOrgShifts = async () => {
            if (!formData.organizationId) return;
            try {
                const res = await axiosInstance.get(`/api/shifts?organizationId=${formData.organizationId}`);
                if (res.data.success) {
                    setShifts(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching shifts for org", err);
            }
        };
        fetchOrgShifts();
    }, [formData.organizationId]);

    const fetchBankDetails = async (ifsc: string) => {
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
            setIfscVerified(false);
            return;
        }

        setIsFetchingIFSC(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.BANK_IFSC(ifsc));
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

    const BUILT_IN_TEMPLATES = [
        { _id: "standard", name: "Standard (40/20/10/30)", basicPercent: 40, hraPercent: 20, daPercent: 10, specialAllowancePercent: 30, isDefault: true },
        { _id: "aggressive", name: "Aggressive Basic (50/25/10/15)", basicPercent: 50, hraPercent: 25, daPercent: 10, specialAllowancePercent: 15 },
        { _id: "equal", name: "Equal Split (30/20/20/30)", basicPercent: 30, hraPercent: 20, daPercent: 20, specialAllowancePercent: 30 },
    ];

    const allTemplates = [...BUILT_IN_TEMPLATES, ...templates.filter(t => !BUILT_IN_TEMPLATES.some(b => b.name === t.name))];

    const autoCalculateSalary = (ctc: number, templateOverride?: any) => {
        if (!ctc) return;
        const monthly = Math.round(ctc / 12);
        const t = templateOverride || selectedTemplate || BUILT_IN_TEMPLATES[0];
        const basic = Math.round(monthly * (t.basicPercent / 100));
        const hra = Math.round(monthly * (t.hraPercent / 100));
        const da = Math.round(monthly * (t.daPercent / 100));
        const specialAllowance = monthly - (basic + hra + da);

        setFormData(prev => ({ ...prev, salary: { basic, hra, da, specialAllowance } }));
    };

    const steps = [
        { name: "Basic Info", icon: <FiUser /> },
        { name: "Work Info", icon: <FiBriefcase /> },
        { name: "Reporting", icon: <FiClock /> },
        { name: "Payroll", icon: <FiDollarSign /> },
        { name: "Statutory & Compliance", icon: <FiPercent /> },
        { name: "Bank Details", icon: <FiCreditCard /> },
        { name: "Documents", icon: <FiFileText /> },
        { name: "System", icon: <FiSettings /> },
        { name: "Review", icon: <FiCheckCircle /> }
    ].filter(s => {
        if (currentUser?.role === "Manager" && (s.name === "Payroll" || s.name === "Statutory & Compliance")) return false;
        if (isEdit && s.name === "System") return false;
        if (["Admin", "HR"].includes(formData.role) && s.name === "Reporting") return false;
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
                    let processedValue = type === 'checkbox' ? checked : (type === 'number' ? (value === "" ? "" : Number(value)) : value);

                    // Auto-capitalize IFSC and PAN
                    if (name === "bankDetails.ifscCode" || name === "panNumber") {
                        processedValue = value.toUpperCase();
                    }

                    // Pincode validation (numeric only, max 6)
                    if (name === "address.pincode") {
                        if (value !== "" && !/^\d*$/.test(value)) return prev;
                        if (value.length > 6) return prev;
                        processedValue = value;
                    }

                    return {
                        ...prev,
                        [parent]: { ...((prev as any)[parent] || {}), [child]: processedValue }
                    };
                });
            } else if (parts.length === 3) {
                const [grandparent, parent, child] = parts;
                setFormData(prev => ({
                    ...prev,
                    [grandparent]: {
                        ...((prev as any)[grandparent] || {}),
                        [parent]: {
                            ...(((prev as any)[grandparent] || {})[parent] || {}),
                            [child]: type === 'checkbox' ? checked : value
                        }
                    }
                }));
            }
        } else {
            // Prevent negative numbers for specific root fields
            if (type === 'number' && value !== "" && Number(value) < 0) return;

            setFormData(prev => {
                let processedValue = type === 'checkbox' ? checked : (type === 'number' ? (value === "" ? "" : Number(value)) : value);

                // Auto-capitalize PAN
                if (name === "panNumber") {
                    processedValue = value.toUpperCase();
                }

                // Phone validation (numeric only)
                if (name === "phone") {
                    if (value !== "" && !/^\d*$/.test(value)) return prev;
                }

                // Statutory numeric validations
                if (name === "uan" || name === "esiNumber") {
                    if (value !== "" && !/^\d*$/.test(value)) return prev;
                }

                return {
                    ...prev,
                    [name]: processedValue
                };
            });
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
        if (currentStepName === "Basic Info") {
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
            if (!formData.department || (Array.isArray(formData.department) && formData.department.length === 0)) { isValid = false; newErrors.department = "At least one department is required"; missingFields.push("Department"); }
            if (!formData.dateOfJoining) { isValid = false; newErrors.dateOfJoining = "Join Date is required"; missingFields.push("Join Date"); }
            if (formData.address.pincode && !/^\d{6}$/.test(formData.address.pincode)) {
                isValid = false; newErrors.pincode = "Pincode must be exactly 6 digits"; missingFields.push("Invalid Pincode");
            }
        } else if (currentStepName === "Reporting") {
            if (formData.role !== "HR") {
                if (!formData.reportingManager) {
                    isValid = false;
                    newErrors.reportingManager = "Reporting Manager is required";
                    missingFields.push("Reporting Manager");
                }
            }
            if (!formData.shift) {
                isValid = false;
                newErrors.shift = "Shift is required";
                missingFields.push("Shift");
            }
        } else if (currentStepName === "Payroll") {
            if (!formData.ctc) { isValid = false; newErrors.ctc = "Annual CTC is required"; missingFields.push("Annual CTC"); }
        } else if (currentStepName === "Statutory & Compliance") {
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
            if (formData.ptEnabled) {
                if (!formData.ptNumber) { isValid = false; newErrors.ptNumber = "PT Number is required when PT is enabled"; missingFields.push("PT Number"); }
            }
            if (formData.lwfEnabled) {
                if (!formData.lwfNumber) { isValid = false; newErrors.lwfNumber = "LWF Number is required when LWF is enabled"; missingFields.push("LWF Number"); }
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
            const statutory = {
                pf: {
                    epfEnabled: formData.pfEnabled,
                    uanNumber: formData.uan,
                    epfNumber: formData.pfNumber,
                    pfJoiningDate: formData.pfJoiningDate,
                    employeeContributionRate: formData.pfEmployeeContributionRate,
                    employerContributionRate: formData.pfEmployerContributionRate,
                    contributionPreferences: {
                        employerPFContribution: formData.pfContributionPreferences.employerPF,
                        edliContribution: formData.pfContributionPreferences.edli,
                        adminCharges: formData.pfContributionPreferences.adminCharges
                    },
                    allowEmployeeLevelOverride: formData.pfOverrideEnabled,
                    proRateRestrictedPFWage: formData.pfProRateRestrictedWage,
                    considerSalaryComponentsOnLOP: formData.pfLOPBased,
                    eligibleForABRYScheme: formData.pfABRYEligible
                },
                esi: {
                    esiEnabled: formData.esiEnabled,
                    esiNumber: formData.esiNumber,
                    esiJoiningDate: formData.esiJoiningDate,
                    dispensary: formData.esiDispensary,
                    esiSalaryLimit: formData.esiSalaryLimit,
                    esiDeductionCycle: formData.esiDeductionCycle
                },
                pt: {
                    ptEnabled: formData.ptEnabled,
                    ptRegistrationNumber: formData.ptNumber,
                    ptDeductionCycle: formData.ptDeductionCycle
                },
                lwf: {
                    lwfEnabled: formData.lwfEnabled,
                    lwfAccountNumber: formData.lwfNumber,
                    lwfDeductionCycle: formData.lwfDeductionCycle
                },
                statutoryBonus: {
                    statutoryBonusEnabled: formData.statutoryBonusEnabled,
                    bonusAmount: formData.statutoryBonusAmount
                }
            };

            const sanitizedData = {
                ...formData,
                department: Array.isArray(formData.department) ? formData.department.join(', ') : formData.department,
                statutory // Inject structured statutory data
            };

            // Remove flat fields that were moved to statutory (optional but cleaner)
            const fieldsToRemove = [
                'pfEnabled', 'uan', 'pfNumber', 'pfJoiningDate', 'pfEmployeeContributionRate', 'pfEmployerContributionRate',
                'pfContributionPreferences', 'pfOverrideEnabled', 'pfProRateRestrictedWage', 'pfLOPBased', 'pfABRYEligible',
                'esiEnabled', 'esiNumber', 'esiJoiningDate', 'esiDispensary', 'esiSalaryLimit', 'esiDeductionCycle',
                'ptEnabled', 'ptNumber', 'ptDeductionCycle', 'lwfEnabled', 'lwfNumber', 'lwfDeductionCycle',
                'statutoryBonusEnabled', 'statutoryBonusAmount'
            ];
            fieldsToRemove.forEach(f => delete (sanitizedData as any)[f]);

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

    const getAllPotentialManagers = () => {
        const list = [...employees];
        if (currentUser && ["admin", "hr", "manager", "superadmin"].includes(currentUser.role?.toLowerCase())) {
            const alreadyInList = list.some(e => e.email?.toLowerCase() === currentUser.email?.toLowerCase());
            if (!alreadyInList) {
                list.push({
                    _id: currentUser._id || currentUser.id,
                    firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || "Admin",
                    lastName: currentUser.lastName || currentUser.name?.split(' ')[1] || "User",
                    email: currentUser.email,
                    role: currentUser.role,
                    department: currentUser.department || ""
                });
            }
        }
        return list;
    };

    const availableManagers = getAllPotentialManagers().filter(e => {
        if (isEdit && e._id === editEmployee?._id) return false;
        
        const r = (e.role || "").toLowerCase().trim();
        const empDepts = Array.isArray(formData.department) ? formData.department : (formData.department ? [formData.department] : []);
        const managerDepts = (e.department || "").split(',').map((s: string) => s.trim());
        
        // Match if no department is selected yet OR if there's at least one common department
        const deptMatch = empDepts.length === 0 || empDepts.some(d => managerDepts.includes(d));

        if (formData.role === "Manager") {
            // Managers can report to other Managers (in same dept), HR, or Admin
            if (["hr", "admin", "superadmin"].includes(r)) return true;
            if (r === "manager" && deptMatch) return true;
            return false;
        }
        
        if (formData.role === "Employee") {
            // Employees report to Managers/HR/Admin in their department
            return ["manager", "hr", "admin", "superadmin"].includes(r) && deptMatch;
        }
        
        // Others (like HR/Admin) see all potential managers (HR, Admin, Superadmin, Manager)
        return ["admin", "superadmin", "hr", "manager"].includes(r);
    });

    const renderStepContent = () => {
        const stepName = steps[currentStep - 1].name;

        switch (stepName) {
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
                            {currentUser?.role === 'superadmin' ? (
                                <div>
                                    <label className="form-label">Organization *</label>
                                    <select 
                                        name="organizationId" 
                                        value={formData.organizationId} 
                                        onChange={handleInputChange} 
                                        className="form-input"
                                        required
                                    >
                                        <option value="">Select Organization</option>
                                        {organizationsList.map(org => (
                                            <option key={org._id} value={org._id}>{org.name}</option>
                                        ))}
                                    </select>
                                    {errors.organizationId && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.organizationId}</div>}
                                </div>
                            ) : (
                                <div style={{ display: "none" }}>
                                    <input type="hidden" name="organizationId" value={formData.organizationId} />
                                </div>
                            )}
                        </div>
                    </div>
                );

            case "Work Info":
                return (
                    <div className="card animate-in" style={{ padding: "30px" }}>
                        <h3 style={{ marginBottom: "20px", color: "var(--primary)" }}>Work & Address Info</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <label className="form-label">Department * (Select Multiple if applicable)</label>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "10px",
                                    padding: "15px",
                                    background: "var(--bg-secondary)",
                                    borderRadius: "8px",
                                    border: errors.department ? "1px solid red" : "1px solid var(--border)",
                                    maxHeight: "200px",
                                    overflowY: "auto"
                                }}>
                                    {departmentsList.map((d: any) => (
                                        <div key={d._id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <input
                                                type="checkbox"
                                                id={`dept-${d._id}`}
                                                checked={Array.isArray(formData.department) && formData.department.includes(d.name)}
                                                onChange={(e) => {
                                                    const currentDepts = Array.isArray(formData.department) ? [...formData.department] : [];
                                                    if (e.target.checked) {
                                                        setFormData(prev => ({ ...prev, department: [...currentDepts, d.name] }));
                                                    } else {
                                                        setFormData(prev => ({ ...prev, department: currentDepts.filter(name => name !== d.name) }));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`dept-${d._id}`} style={{ fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</label>
                                        </div>
                                    ))}
                                </div>
                                {errors.department && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.department}</div>}
                            </div>
                            <div>
                                <label className="form-label">System Role *</label>
                                <select name="role" value={formData.role} onChange={handleInputChange} className="form-input">
                                    <option value="Employee">Employee</option>
                                    <option value="Manager">Manager</option>
                                    <option value="HR">HR</option>
                                    <option value="Admin">Admin</option>
                                </select>
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
                                <label className="form-label">State {loadingStates && "(Loading...)"}</label>
                                <div style={{ position: "relative" }}>
                                    <select
                                        name="address.state"
                                        value={formData.address.state}
                                        onChange={(e) => {
                                            handleInputChange(e);
                                            fetchCitiesForState(e.target.value);
                                        }}
                                        className="form-input"
                                        style={{ marginTop: "5px" }}
                                    >
                                        <option value="">Select State</option>
                                        {statesList
                                            .map(state => (
                                                <option key={state.state_code || state.name} value={state.name}>{state.name}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="form-label">District {loadingCities && "(Loading...)"}</label>
                                <div style={{ position: "relative" }}>
                                    <select
                                        name="address.city"
                                        value={formData.address.city}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        style={{ marginTop: "5px" }}
                                        disabled={!formData.address.state || loadingCities}
                                    >
                                        <option value="">{loadingCities ? "Loading districts..." : "Select District"}</option>
                                        {citiesList
                                            .map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        {!loadingCities && citiesList.length === 0 && formData.address.state && (
                                            <option value="" disabled>No districts found</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Pincode *</label>
                                <input name="address.pincode" value={formData.address.pincode} onChange={handleInputChange} className="form-input" placeholder="600001" maxLength={6} />
                                {errors.pincode && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.pincode}</div>}
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
                                <label className="form-label">Reporting Manager {formData.role !== "HR" && "*"}</label>
                                <select name="reportingManager" value={formData.reportingManager} onChange={handleInputChange} className="form-input" style={{ borderColor: errors.reportingManager ? "red" : "var(--border)" }}>
                                    <option value="">Select Manager</option>
                                    {availableManagers.map(m => <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.role})</option>)}
                                </select>
                                {errors.reportingManager && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.reportingManager}</div>}
                            </div>
                            <div>
                                <label className="form-label">Shift *</label>
                                <select name="shift" value={formData.shift} onChange={handleInputChange} className="form-input" style={{ borderColor: errors.shift ? "red" : "var(--border)" }}>
                                    <option value="">Select Shift</option>
                                    {shifts.map(s => <option key={s._id} value={s._id}>{s.name} ({s.startTime}-{s.endTime}){s.isNightShift ? ' 🌙' : ''}</option>)}
                                </select>
                                {errors.shift && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.shift}</div>}
                            </div>
                            {formData.role === "Employee" && Array.isArray(formData.department) && formData.department.length > 0 && availableManagers.length === 0 && (
                                <div style={{ gridColumn: "1 / -1", padding: "16px", background: "rgba(255, 193, 7, 0.1)", border: "1px solid #FFC107", borderRadius: "10px", color: "#856404", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <FiAlertCircle size={20} />
                                    <div>
                                        <strong>No Manager Assigned:</strong> This department does not have a manager assigned yet. Please assign a manager to this department to continue.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case "Payroll":
                const t = selectedTemplate || BUILT_IN_TEMPLATES[0];
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
                                <label className="form-label" style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>Salary Template</label>
                                <select
                                    className="form-input"
                                    style={{ width: "220px", padding: "6px 10px", height: "34px", fontSize: "13px", borderColor: "var(--primary)", borderWidth: "1.5px" }}
                                    value={selectedTemplate?._id || "standard"}
                                    onChange={(e) => {
                                        const found = allTemplates.find(temp => temp._id === e.target.value);
                                        setSelectedTemplate(found || BUILT_IN_TEMPLATES[0]);
                                        if (formData.ctc) autoCalculateSalary(formData.ctc, found || BUILT_IN_TEMPLATES[0]);
                                    }}
                                >
                                    {allTemplates.map(temp => <option key={temp._id} value={temp._id}>{temp.name}</option>)}
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
                                        placeholder="e.g. 600000"
                                    />
                                    <button onClick={() => autoCalculateSalary(formData.ctc)} className="btn btn-primary btn-sm" style={{ whiteSpace: "nowrap", background: "var(--primary)", color: "white" }}>Auto Calculate</button>
                                </div>
                                <div style={{ fontSize: "12px", marginTop: "6px", color: "var(--text-muted)" }}>Monthly CTC: <strong>₹{monthlyCTC.toLocaleString()}</strong></div>
                                {errors.ctc && <div style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{errors.ctc}</div>}
                            </div>

                            <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: isMismatch ? "2px solid #EF5350" : "1px solid var(--border)" }}>
                                <div><label className="form-label">Basic ({t.basicPercent}%)</label><input type="number" name="salary.basic" value={formData.salary.basic} onChange={handleInputChange} className="form-input" /></div>
                                <div><label className="form-label">HRA ({t.hraPercent}%)</label><input type="number" name="salary.hra" value={formData.salary.hra} onChange={handleInputChange} className="form-input" /></div>
                                <div><label className="form-label">DA ({t.daPercent}%)</label><input type="number" name="salary.da" value={formData.salary.da} onChange={handleInputChange} className="form-input" /></div>
                                <div><label className="form-label">Special Allowance ({t.specialAllowancePercent}%)</label><input type="number" name="salary.specialAllowance" value={formData.salary.specialAllowance} onChange={handleInputChange} className="form-input" /></div>

                                <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Components Total</span>
                                    <span style={{ fontSize: "15px", fontWeight: 700, color: isMismatch ? "#EF5350" : "var(--secondary)", fontFamily: "monospace" }}>₹{currentSum.toLocaleString()}</span>
                                </div>

                                {isMismatch && (
                                    <div style={{ gridColumn: "1/-1", color: "#D32F2F", fontSize: "12px", padding: "10px 14px", background: "#FFEBEE", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        ⚠️ Components total (₹{currentSum.toLocaleString()}) does not match Monthly CTC (₹{monthlyCTC.toLocaleString()}). Click <strong style={{ cursor: "pointer", textDecoration: "underline", marginLeft: "4px" }} onClick={() => autoCalculateSalary(formData.ctc)}>Auto Calculate</strong> to fix.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case "Statutory & Compliance":
                return (
                    <div className="animate-in" style={{ padding: "0" }}>
                        <h3 style={{ fontSize: "22px", fontWeight: 600, color: "#333", marginBottom: "8px" }}>Statutory & Compliance Details</h3>
                        <p style={{ fontSize: "13px", color: "#888", marginBottom: "28px" }}>Configure statutory deductions and compliance settings for this employee.</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                            {/* ─── Provident Fund (PF) ─── */}
                            <div style={{
                                background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb",
                                borderLeft: formData.pfEnabled ? "4px solid #f97316" : "4px solid #d1d5db",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.3s ease"
                            }}>
                                <div style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "18px 24px", borderBottom: formData.pfEnabled ? "1px solid #f3f4f6" : "none"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Provident Fund (PF)</h4>
                                        {formData.pfEnabled ? (
                                            <span style={{ fontSize: "11px", background: "#dcfce7", color: "#16a34a", padding: "2px 10px", borderRadius: "12px", fontWeight: 500 }}>Enabled</span>
                                        ) : (
                                            <span style={{ fontSize: "11px", background: "#f3f4f6", color: "#9ca3af", padding: "2px 10px", borderRadius: "12px", fontWeight: 500 }}>Disabled</span>
                                        )}
                                    </div>
                                    <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                                        <input type="checkbox" name="pfEnabled" checked={formData.pfEnabled} onChange={handleInputChange}
                                            style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                                        <div style={{
                                            width: "44px", height: "24px", borderRadius: "12px",
                                            background: formData.pfEnabled ? "#f97316" : "#d1d5db", transition: "0.3s",
                                            position: "relative"
                                        }}>
                                            <div style={{
                                                width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
                                                position: "absolute", top: "3px", left: formData.pfEnabled ? "23px" : "3px",
                                                transition: "0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                                            }} />
                                        </div>
                                    </label>
                                </div>
                                {formData.pfEnabled && (
                                    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>UAN Number (12 digits) *</label>
                                                <input placeholder="123456789012" name="uan" value={formData.uan} onChange={handleInputChange} maxLength={12}
                                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none", transition: "border 0.2s" }} />
                                                {errors.uan && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{errors.uan}</div>}
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>PF Number *</label>
                                                <input placeholder="MH/BAN/12345/123" name="pfNumber" value={formData.pfNumber} onChange={handleInputChange}
                                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                                {errors.pfNumber && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{errors.pfNumber}</div>}
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>PF Joining Date</label>
                                                <input type="date" name="pfJoiningDate" value={formData.pfJoiningDate} onChange={handleInputChange}
                                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                            </div>
                                        </div>

                                        {/* Contribution Preferences */}
                                        <div style={{ background: "#fefce8", border: "1px solid #fef08a", padding: "16px 20px", borderRadius: "8px" }}>
                                            <h5 style={{ fontSize: "13px", fontWeight: 600, color: "#854d0e", marginBottom: "14px", margin: "0 0 14px 0" }}>Contribution Preferences</h5>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                                {[
                                                    { name: "pfContributionPreferences.employerPF", label: "Employer's PF contribution in CTC", checked: formData.pfContributionPreferences.employerPF },
                                                    { name: "pfContributionPreferences.edli", label: "EDLI contribution in CTC", checked: formData.pfContributionPreferences.edli },
                                                    { name: "pfContributionPreferences.adminCharges", label: "Admin charges in CTC", checked: formData.pfContributionPreferences.adminCharges },
                                                ].map((pref) => (
                                                    <label key={pref.name} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#78350f", cursor: "pointer", lineHeight: "1.4" }}>
                                                        <input type="checkbox" name={pref.name} checked={pref.checked} onChange={handleInputChange} style={{ marginTop: "2px", accentColor: "#f97316" }} />
                                                        {pref.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Bottom toggles */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#f9fafb", padding: "14px 18px", borderRadius: "8px" }}>
                                            {[
                                                { name: "pfOverrideEnabled", label: "Allow Employee level Override", checked: formData.pfOverrideEnabled },
                                                { name: "pfProRateRestrictedWage", label: "Pro-rate Restricted PF Wage", checked: formData.pfProRateRestrictedWage },
                                                { name: "pfLOPBased", label: "Consider salary components on LOP", checked: formData.pfLOPBased },
                                                { name: "pfABRYEligible", label: "Eligible for ABRY Scheme", checked: formData.pfABRYEligible },
                                            ].map((opt) => (
                                                <label key={opt.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#374151", cursor: "pointer" }}>
                                                    <input type="checkbox" name={opt.name} checked={opt.checked} onChange={handleInputChange} style={{ accentColor: "#f97316" }} />
                                                    {opt.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ─── Employees' State Insurance (ESI) ─── */}
                            <div style={{
                                background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb",
                                borderLeft: formData.esiEnabled ? "4px solid #f97316" : "4px solid #d1d5db",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.3s ease"
                            }}>
                                <div style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "18px 24px", borderBottom: formData.esiEnabled ? "1px solid #f3f4f6" : "none"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Employees&apos; State Insurance (ESI)</h4>
                                        {formData.esiEnabled ? (
                                            <span style={{ fontSize: "11px", background: "#dcfce7", color: "#16a34a", padding: "2px 10px", borderRadius: "12px", fontWeight: 500 }}>Enabled</span>
                                        ) : (
                                            <span style={{ fontSize: "11px", background: "#f3f4f6", color: "#9ca3af", padding: "2px 10px", borderRadius: "12px", fontWeight: 500 }}>Disabled</span>
                                        )}
                                    </div>
                                    <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                                        <input type="checkbox" name="esiEnabled" checked={formData.esiEnabled} onChange={handleInputChange}
                                            style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                                        <div style={{
                                            width: "44px", height: "24px", borderRadius: "12px",
                                            background: formData.esiEnabled ? "#f97316" : "#d1d5db", transition: "0.3s",
                                            position: "relative"
                                        }}>
                                            <div style={{
                                                width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
                                                position: "absolute", top: "3px", left: formData.esiEnabled ? "23px" : "3px",
                                                transition: "0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                                            }} />
                                        </div>
                                    </label>
                                </div>
                                {formData.esiEnabled && (
                                    <div style={{ padding: "20px 24px" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>ESI Number *</label>
                                                <input placeholder="56-00-140218-000-0607" name="esiNumber" value={formData.esiNumber} onChange={handleInputChange}
                                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                                {errors.esiNumber && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{errors.esiNumber}</div>}
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>ESI Joining Date</label>
                                                <input type="date" name="esiJoiningDate" value={formData.esiJoiningDate} onChange={handleInputChange}
                                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Deduction Cycle</label>
                                                <select name="esiDeductionCycle" value={formData.esiDeductionCycle} onChange={handleInputChange}
                                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", background: "#fff", outline: "none" }}>
                                                    <option value="Monthly">Monthly</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>ESI Salary Limit (₹)</label>
                                                <input type="number" name="esiSalaryLimit" value={formData.esiSalaryLimit} onChange={handleInputChange} placeholder="21000"
                                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#1f2937", outline: "none" }} />
                                            </div>
                                        </div>
                                        <div style={{ marginTop: "14px", display: "flex", gap: "24px", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 18px", borderRadius: "8px", fontSize: "13px", color: "#1e40af" }}>
                                            <span>Employee Contribution: <strong>{complianceSettings?.esi?.employeeContribution || 0.75}%</strong> of Gross Pay</span>
                                            <span>Employer Contribution: <strong>{complianceSettings?.esi?.employerContribution || 3.25}%</strong> of Gross Pay</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ─── PT, LWF, Bonus — 3 compact cards ─── */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

                                {/* Professional Tax */}
                                <div style={{
                                    background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb",
                                    borderLeft: formData.ptEnabled ? "4px solid #8b5cf6" : "4px solid #d1d5db",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.3s ease"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: formData.ptEnabled ? "1px solid #f3f4f6" : "none" }}>
                                        <h5 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>Professional Tax</h5>
                                        <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                                            <input type="checkbox" name="ptEnabled" checked={formData.ptEnabled} onChange={handleInputChange}
                                                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                                            <div style={{
                                                width: "36px", height: "20px", borderRadius: "10px",
                                                background: formData.ptEnabled ? "#8b5cf6" : "#d1d5db", transition: "0.3s", position: "relative"
                                            }}>
                                                <div style={{
                                                    width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
                                                    position: "absolute", top: "3px", left: formData.ptEnabled ? "19px" : "3px",
                                                    transition: "0.3s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                                                }} />
                                            </div>
                                        </label>
                                    </div>
                                    {formData.ptEnabled && (
                                        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>PT Registration No.</label>
                                                <input placeholder="PT Registration No." name="ptNumber" value={formData.ptNumber} onChange={handleInputChange}
                                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", color: "#1f2937", outline: "none" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Deduction Cycle</label>
                                                <select name="ptDeductionCycle" value={formData.ptDeductionCycle} onChange={handleInputChange}
                                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", color: "#1f2937", background: "#fff", outline: "none" }}>
                                                    <option value="Monthly">Monthly</option>
                                                    <option value="Half Yearly">Half Yearly</option>
                                                    <option value="Yearly">Yearly</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Labour Welfare Fund */}
                                <div style={{
                                    background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb",
                                    borderLeft: formData.lwfEnabled ? "4px solid #0ea5e9" : "4px solid #d1d5db",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.3s ease"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: formData.lwfEnabled ? "1px solid #f3f4f6" : "none" }}>
                                        <h5 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>Labour Welfare Fund</h5>
                                        <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                                            <input type="checkbox" name="lwfEnabled" checked={formData.lwfEnabled} onChange={handleInputChange}
                                                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                                            <div style={{
                                                width: "36px", height: "20px", borderRadius: "10px",
                                                background: formData.lwfEnabled ? "#0ea5e9" : "#d1d5db", transition: "0.3s", position: "relative"
                                            }}>
                                                <div style={{
                                                    width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
                                                    position: "absolute", top: "3px", left: formData.lwfEnabled ? "19px" : "3px",
                                                    transition: "0.3s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                                                }} />
                                            </div>
                                        </label>
                                    </div>
                                    {formData.lwfEnabled && (
                                        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>LWF Account No.</label>
                                                <input placeholder="LWF Account No." name="lwfNumber" value={formData.lwfNumber} onChange={handleInputChange}
                                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", color: "#1f2937", outline: "none" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Deduction Cycle</label>
                                                <select name="lwfDeductionCycle" value={formData.lwfDeductionCycle} onChange={handleInputChange}
                                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", color: "#1f2937", background: "#fff", outline: "none" }}>
                                                    <option value="Monthly">Monthly</option>
                                                    <option value="Half Yearly">Half Yearly</option>
                                                    <option value="Yearly">Yearly</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Statutory Bonus */}
                                <div style={{
                                    background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb",
                                    borderLeft: formData.statutoryBonusEnabled ? "4px solid #10b981" : "4px solid #d1d5db",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.3s ease"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: formData.statutoryBonusEnabled ? "1px solid #f3f4f6" : "none" }}>
                                        <h5 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>Statutory Bonus</h5>
                                        <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                                            <input type="checkbox" name="statutoryBonusEnabled" checked={formData.statutoryBonusEnabled} onChange={handleInputChange}
                                                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                                            <div style={{
                                                width: "36px", height: "20px", borderRadius: "10px",
                                                background: formData.statutoryBonusEnabled ? "#10b981" : "#d1d5db", transition: "0.3s", position: "relative"
                                            }}>
                                                <div style={{
                                                    width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
                                                    position: "absolute", top: "3px", left: formData.statutoryBonusEnabled ? "19px" : "3px",
                                                    transition: "0.3s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                                                }} />
                                            </div>
                                        </label>
                                    </div>
                                    {formData.statutoryBonusEnabled && (
                                        <div style={{ padding: "14px 16px" }}>
                                            <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bonus Amount</label>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontSize: "16px", fontWeight: 600, color: "#374151" }}>₹</span>
                                                <input type="number" name="statutoryBonusAmount" value={formData.statutoryBonusAmount} onChange={handleInputChange} placeholder="8,333"
                                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", color: "#1f2937", outline: "none" }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
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

                                { /* Statutory */}
                                <div>
                                    <div style={{ fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FiPercent size={16} /> Statutory Details
                                    </div>
                                    <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <div><strong>PF:</strong> {formData.pfEnabled ? `Enabled (${formData.uan})` : "Disabled"}</div>
                                        {formData.pfEnabled && (
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "10px" }}>
                                                • LOP Based: {formData.pfLOPBased ? "Yes" : "No"} | ABRY: {formData.pfABRYEligible ? "Yes" : "No"}
                                            </div>
                                        )}
                                        <div><strong>ESI:</strong> {formData.esiEnabled ? `Enabled (${formData.esiNumber})` : "Disabled"}</div>
                                        <div><strong>PT:</strong> {formData.ptEnabled ? `Enabled (${formData.ptNumber}) - ${formData.ptDeductionCycle}` : "Disabled"}</div>
                                        <div><strong>LWF:</strong> {formData.lwfEnabled ? `Enabled (${formData.lwfNumber}) - ${formData.lwfDeductionCycle}` : "Disabled"}</div>
                                        <div><strong>Bonus:</strong> {formData.statutoryBonusEnabled ? `₹${formData.statutoryBonusAmount}` : "Disabled"}</div>
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
                                            <div>{formData.address.currentAddress}, {formData.address.city}, {formData.address.state} - {formData.address.pincode}</div>
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

