"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS, API_BASE_URL } from "@/config/api";
import { errorMessage } from "@/lib/fetchError";
import type { Branch, Department, Employee, Location, Shift } from "@/types/api";
import { FiUser, FiBriefcase, FiClock, FiDollarSign, FiPercent, FiCreditCard, FiFileText, FiSettings, FiCheckCircle } from "react-icons/fi";
import {
    BUILT_IN_TEMPLATES, buildPayload, initialFormData, initialScope, validateStep,
    type CurrentUser, type EmployeeForm, type FieldErrors, type InputChangeEvent, type SalaryTemplate, type StepName,
} from "./add-employee/form";
import PersonalSection from "./add-employee/PersonalSection";
import JobSection from "./add-employee/JobSection";
import ReportingSection, { type ManagerOption } from "./add-employee/ReportingSection";
import SalarySection from "./add-employee/SalarySection";
import StatutorySection from "./add-employee/StatutorySection";
import BankSection from "./add-employee/BankSection";
import DocumentsSection, { SystemSection } from "./add-employee/DocumentsSection";
import ReviewSection from "./add-employee/ReviewSection";

interface AddEmployeePageProps {
    onBack: () => void;
    onSuccess: () => void;
    showNotify: (type: 'success' | 'failure' | 'warning', message: string) => void;
    currentUser: CurrentUser;
    employees: Employee[];
    departmentsList: Department[];
    editEmployee?: Employee;
}

type ComplianceSettings = Parameters<typeof StatutorySection>[0]["complianceSettings"] & {
    epf?: { epfEnabled?: boolean; employeeContributionRate?: number };
    esi?: { esiEnabled?: boolean; esiSalaryLimit?: number };
    professionalTax?: { enabled?: boolean };
    labourWelfareFund?: { enabled?: boolean };
    statutoryBonus?: { enabled?: boolean };
};

// Dynamic Location API Data (States/Cities) will be fetched from Backend

/**
 * The add/edit employee wizard. Each step is a section component in
 * ./add-employee; this component owns the form state, loads the dropdown
 * lists, validates each step and submits.
 */
export default function AddEmployeePage({ onBack, onSuccess, showNotify, currentUser, employees, departmentsList, editEmployee }: AddEmployeePageProps) {
    const isEdit = !!editEmployee;

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});

    // Fetch lists for dropdowns
    const [locations, setLocations] = useState<Location[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [complianceSettings, setComplianceSettings] = useState<ComplianceSettings | null>(null);
    // Loaded with the other lists; not shown by any step yet.
    const [, setOrganizationsList] = useState<unknown[]>([]);

    const [formData, setFormData] = useState<EmployeeForm>(() => initialFormData(editEmployee, currentUser));

    // Branch posting / access scope. Only an owner or admin is offered these;
    // the backend still enforces who may grant what.
    const canGrantScope = ["owner", "admin"].includes(String(currentUser?.role || "").toLowerCase());
    const [branches, setBranches] = useState<Branch[]>([]);
    const [scope, setScope] = useState(() => initialScope(editEmployee));
    useEffect(() => {
        if (!canGrantScope) return;
        axiosInstance.get(API_ENDPOINTS.BRANCHES)
            .then((res) => setBranches(res.data.data || []))
            .catch(() => setBranches([]));
    }, [canGrantScope]);

    const [statesList, setStatesList] = useState<{ name: string; state_code?: string }[]>([]);
    const [citiesList, setCitiesList] = useState<string[]>([]);
    const [loadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [locationsCache, setLocationsCache] = useState<{ [key: string]: string[] }>({});

    const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<SalaryTemplate | null>(null);
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
                        const def = (temps as SalaryTemplate[]).find((t) => t.isDefault);
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

    const allTemplates = [...BUILT_IN_TEMPLATES, ...templates.filter(t => !BUILT_IN_TEMPLATES.some(b => b.name === t.name))];

    const autoCalculateSalary = (ctc: number, templateOverride?: SalaryTemplate) => {
        if (!ctc) return;
        const monthly = Math.round(ctc / 12);
        const t = templateOverride || selectedTemplate || BUILT_IN_TEMPLATES[0];
        const basic = Math.round(monthly * (t.basicPercent / 100));
        const hra = Math.round(monthly * (t.hraPercent / 100));
        const da = Math.round(monthly * (t.daPercent / 100));
        const specialAllowance = monthly - (basic + hra + da);

        setFormData(prev => ({ ...prev, salary: { basic, hra, da, specialAllowance } }));
    };

    const steps = ([
        { name: "Basic Info", icon: <FiUser /> },
        { name: "Work Info", icon: <FiBriefcase /> },
        { name: "Reporting", icon: <FiClock /> },
        { name: "Payroll", icon: <FiDollarSign /> },
        { name: "Statutory & Compliance", icon: <FiPercent /> },
        { name: "Bank Details", icon: <FiCreditCard /> },
        { name: "Documents", icon: <FiFileText /> },
        { name: "System", icon: <FiSettings /> },
        { name: "Review", icon: <FiCheckCircle /> }
    ] as { name: StepName; icon: React.ReactNode }[]).filter(s => {
        if (currentUser?.role === "Manager" && (s.name === "Payroll" || s.name === "Statutory & Compliance")) return false;
        if (isEdit && s.name === "System") return false;
        if (["Admin", "HR"].includes(formData.role) && s.name === "Reporting") return false;
        return true;
    });

    const totalSteps = steps.length;

    const handleInputChange = (e: InputChangeEvent) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        if (errors[name]) {
            const newErrors = { ...errors };
            delete newErrors[name];
            setErrors(newErrors);
        }
        // Nested paths ("salary.basic", "pfContributionPreferences.edli") are
        // written generically, so the state is handled as a plain record here.
        type Nested = Record<string, Record<string, unknown>>;
        if (name.includes('.')) {
            const parts = name.split('.');
            if (parts.length === 2) {
                const [parent, child] = parts;

                // Prevent negative numbers for specific nested fields
                if (type === 'number' && value !== "" && Number(value) < 0) return;

                setFormData(prev => {
                    let processedValue: unknown = type === 'checkbox' ? checked : (type === 'number' ? (value === "" ? "" : Number(value)) : value);

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
                        [parent]: { ...((prev as unknown as Nested)[parent] || {}), [child]: processedValue }
                    };
                });
            } else if (parts.length === 3) {
                const [grandparent, parent, child] = parts;
                setFormData(prev => {
                    const group = ((prev as unknown as Nested)[grandparent] || {}) as Nested;
                    return {
                        ...prev,
                        [grandparent]: {
                            ...group,
                            [parent]: {
                                ...(group[parent] || {}),
                                [child]: type === 'checkbox' ? checked : value
                            }
                        }
                    };
                });
            }
        } else {
            // Prevent negative numbers for specific root fields
            if (type === 'number' && value !== "" && Number(value) < 0) return;

            setFormData(prev => {
                let processedValue: unknown = type === 'checkbox' ? checked : (type === 'number' ? (value === "" ? "" : Number(value)) : value);

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
        const existingIds = new Set(employees.map((e) => e.employeeId));
        let id = "";
        do {
            id = "SRS" + Math.floor(100000 + Math.random() * 900000);
        } while (existingIds.has(id));
        setFormData({ ...formData, employeeId: id });
    };

    const checkCurrentStep = () => {
        const result = validateStep(steps[currentStep - 1].name, formData);
        setErrors(result.errors);
        if (!result.isValid) showNotify('failure', `Validation Errors: ${result.missingFields.join(", ")}`);
        return result.isValid;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = buildPayload(formData, canGrantScope ? scope : null);

            if (isEdit && editEmployee) {
                await axiosInstance.put(`${API_ENDPOINTS.EMPLOYEES}/${editEmployee._id}`, payload);
                showNotify('success', "Employee updated successfully!");
            } else {
                await axiosInstance.post(API_ENDPOINTS.EMPLOYEES, payload);
                showNotify('success', "Employee created successfully!");
            }
            onSuccess();
        } catch (err) {
            showNotify('failure', errorMessage(err, `Failed to ${isEdit ? 'update' : 'create'} employee`));
        } finally {
            setLoading(false);
        }
    };

    const getAllPotentialManagers = (): ManagerOption[] => {
        const list: ManagerOption[] = [...employees];
        if (currentUser && ["admin", "hr", "manager"].includes(currentUser.role?.toLowerCase())) {
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
            if (["hr", "admin"].includes(r)) return true;
            if (r === "manager" && deptMatch) return true;
            return false;
        }

        if (formData.role === "Employee") {
            // Employees report to Managers/HR/Admin in their department
            return ["manager", "hr", "admin"].includes(r) && deptMatch;
        }

        // Others (like HR/Admin) see all potential managers (HR, Admin, Superadmin, Manager)
        return ["admin", "hr", "manager"].includes(r);
    });

    const renderStepContent = () => {
        const section = { formData, errors, onChange: handleInputChange };

        switch (steps[currentStep - 1].name) {
            case "Basic Info":
                return <PersonalSection {...section} onGenerateId={generateEmpId} />;
            case "Work Info":
                return (
                    <JobSection
                        {...section}
                        setFormData={setFormData}
                        departmentsList={departmentsList}
                        locations={locations}
                        statesList={statesList}
                        citiesList={citiesList}
                        loadingStates={loadingStates}
                        loadingCities={loadingCities}
                        onStateChange={fetchCitiesForState}
                    />
                );
            case "Reporting":
                return (
                    <ReportingSection
                        {...section}
                        availableManagers={availableManagers}
                        shifts={shifts}
                        canGrantScope={canGrantScope}
                        branches={branches}
                        scope={scope}
                        setScope={setScope}
                    />
                );
            case "Payroll":
                return (
                    <SalarySection
                        {...section}
                        selectedTemplate={selectedTemplate}
                        allTemplates={allTemplates}
                        onTemplateChange={setSelectedTemplate}
                        onAutoCalculate={autoCalculateSalary}
                    />
                );
            case "Statutory & Compliance":
                return <StatutorySection {...section} complianceSettings={complianceSettings} />;
            case "Bank Details":
                return (
                    <BankSection
                        {...section}
                        setFormData={setFormData}
                        isFetchingIFSC={isFetchingIFSC}
                        ifscVerified={ifscVerified}
                        onIfscBlur={fetchBankDetails}
                    />
                );
            case "Documents":
                return <DocumentsSection {...section} />;
            case "System":
                return <SystemSection formData={formData} onChange={handleInputChange} />;
            case "Review":
                return <ReviewSection formData={formData} />;
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
                        <button className="btn btn-primary" style={{ width: "120px", justifyContent: "center" }} onClick={() => { if (checkCurrentStep()) setCurrentStep(s => s + 1); }}>Next</button>
                    ) : (
                        <button className="btn btn-primary" style={{ width: "120px", justifyContent: "center" }} onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : isEdit ? "Update" : "Submit"}</button>
                    )}
                </div>
            </div>
        </div>
    );
}
