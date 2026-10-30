/**
 * State, defaults, validation and payload for the add/edit employee wizard.
 * The section components in this folder render one step each; AddEmployeePage
 * owns the state and passes it down.
 */
import type { ChangeEvent } from "react";
import { refId, type Employee, type User } from "@/types/api";

/** The signed-in user as the employees page reads it from localStorage. */
export type CurrentUser = (User & { department?: string }) | null;

export type FieldErrors = { [key: string]: string };

export type InputChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
export type InputChangeHandler = (e: InputChangeEvent) => void;

export type StepName =
    | "Basic Info"
    | "Work Info"
    | "Reporting"
    | "Payroll"
    | "Statutory & Compliance"
    | "Bank Details"
    | "Documents"
    | "System"
    | "Review";

export interface SalaryTemplate {
    _id: string;
    name: string;
    basicPercent: number;
    hraPercent: number;
    daPercent: number;
    specialAllowancePercent: number;
    isDefault?: boolean;
}

export const BUILT_IN_TEMPLATES: SalaryTemplate[] = [
    { _id: "standard", name: "Standard (40/20/10/30)", basicPercent: 40, hraPercent: 20, daPercent: 10, specialAllowancePercent: 30, isDefault: true },
    { _id: "aggressive", name: "Aggressive Basic (50/25/10/15)", basicPercent: 50, hraPercent: 25, daPercent: 10, specialAllowancePercent: 15 },
    { _id: "equal", name: "Equal Split (30/20/20/30)", basicPercent: 30, hraPercent: 20, daPercent: 20, specialAllowancePercent: 30 },
];

/** Branch posting / access scope (offered to owners and admins only). */
export interface ScopeState {
    branchId: string;
    branchIds: string[];
    isGroupWide: boolean;
}

/** Common props of every wizard section. */
export interface SectionProps {
    formData: EmployeeForm;
    errors: FieldErrors;
    onChange: InputChangeHandler;
}

const datePart = (value?: string) => (value || "").split("T")[0];

/** The wizard's initial values: the edited employee's, or blanks for a new one. */
export function initialFormData(editEmployee: Employee | undefined, currentUser: CurrentUser) {
    const st = editEmployee?.statutory;
    return {
        firstName: editEmployee?.firstName || "",
        lastName: editEmployee?.lastName || "",
        employeeId: editEmployee?.employeeId || "",
        email: editEmployee?.email || "",
        phone: editEmployee?.phone || "",
        gender: editEmployee?.gender || "Male",
        organizationId: currentUser?.organizationId
            ? currentUser.organizationId
            : refId(editEmployee?.organizationId),
        dateOfBirth: datePart(editEmployee?.dateOfBirth),
        maritalStatus: editEmployee?.maritalStatus || "Single",
        profilePhoto: editEmployee?.profilePhoto || "",
        department: (editEmployee?.department
            ? (editEmployee.department.includes(",") ? editEmployee.department.split(",").map((s: string) => s.trim()) : [editEmployee.department])
            : (currentUser?.role === "Manager" ? [currentUser.department] : [])) as string[],
        designation: editEmployee?.designation || "",
        reportingManager: refId(editEmployee?.reportingManager) || (currentUser?.role === "Manager" ? currentUser._id as string : ""),
        location: editEmployee?.location || "",
        employmentType: editEmployee?.employmentType || "Full-time",
        dateOfJoining: datePart(editEmployee?.dateOfJoining),
        shift: refId(editEmployee?.shift),
        status: editEmployee?.status || "Active",
        salaryStructure: editEmployee?.salaryStructure || "Standard",
        salary: {
            basic: editEmployee?.salary?.basic || 0,
            hra: editEmployee?.salary?.hra || 0,
            da: editEmployee?.salary?.da || 0,
            specialAllowance: editEmployee?.salary?.specialAllowance || 0,
        },
        ctc: editEmployee?.ctc || 0,
        paymentCycle: editEmployee?.paymentCycle || "Monthly",
        esiDeductionCycle: st?.esi?.deductionCycle || editEmployee?.esiDeductionCycle || "Monthly",
        // Statutory nested object mapping for edit (matches backend/src/models/User.js schema paths)
        pfEnabled: st?.pf?.enabled ?? editEmployee?.pfEnabled ?? true,
        uan: st?.pf?.uanNumber || editEmployee?.uan || "",
        pfNumber: st?.pf?.pfNumber || editEmployee?.pfNumber || "",
        pfJoiningDate: datePart(st?.pf?.pfJoiningDate || editEmployee?.pfJoiningDate),
        pfEmployeeContributionRate: st?.pf?.employeeContributionRate || editEmployee?.pfEmployeeContributionRate || 12,
        pfEmployerContributionRate: st?.pf?.employerContributionRate || editEmployee?.pfEmployerContributionRate || 12,
        pfContributionPreferences: {
            employerPF: st?.pf?.contributionPreferences?.includeEmployerPF ?? editEmployee?.pfContributionPreferences?.employerPF ?? true,
            edli: st?.pf?.contributionPreferences?.includeEDLI ?? editEmployee?.pfContributionPreferences?.edli ?? true,
            adminCharges: st?.pf?.contributionPreferences?.includeAdminCharges ?? editEmployee?.pfContributionPreferences?.adminCharges ?? true,
        },
        pfOverrideEnabled: st?.pf?.allowOverride ?? editEmployee?.pfOverrideEnabled ?? false,
        pfProRateRestrictedWage: st?.pf?.proRateRestrictedPFWage ?? editEmployee?.pfProRateRestrictedWage ?? true,
        pfLOPBased: st?.pf?.considerComponentsOnLOP ?? editEmployee?.pfLOPBased ?? true,
        pfABRYEligible: st?.pf?.eligibleForABRY ?? editEmployee?.pfABRYEligible ?? false,
        esiEnabled: st?.esi?.enabled ?? editEmployee?.esiEnabled ?? true,
        esiNumber: st?.esi?.esiNumber || editEmployee?.esiNumber || "",
        esiJoiningDate: datePart(st?.esi?.esiJoiningDate || editEmployee?.esiJoiningDate),
        esiDispensary: st?.esi?.dispensary || editEmployee?.esiDispensary || "",
        esiSalaryLimit: st?.esi?.salaryLimit || editEmployee?.esiSalaryLimit || 21000,
        ptEnabled: st?.pt?.enabled ?? editEmployee?.ptEnabled ?? false,
        ptNumber: st?.pt?.ptRegistrationNumber || editEmployee?.ptNumber || "",
        ptDeductionCycle: st?.pt?.deductionCycle || editEmployee?.ptDeductionCycle || "Monthly",
        lwfEnabled: st?.lwf?.enabled ?? editEmployee?.lwfEnabled ?? false,
        lwfNumber: st?.lwf?.lwfAccountNumber || editEmployee?.lwfNumber || "",
        lwfDeductionCycle: st?.lwf?.deductionCycle || editEmployee?.lwfDeductionCycle || "Monthly",
        statutoryBonusEnabled: st?.statutoryBonus?.enabled ?? editEmployee?.statutoryBonusEnabled ?? false,
        statutoryBonusAmount: st?.statutoryBonus?.bonusAmount || editEmployee?.statutoryBonusAmount || 0,
        bankDetails: {
            bankName: editEmployee?.bankDetails?.bankName || "",
            accountHolderName: editEmployee?.bankDetails?.accountHolderName || "",
            accountNumber: editEmployee?.bankDetails?.accountNumber || "",
            confirmAccountNumber: editEmployee?.bankDetails?.accountNumber || "",
            ifscCode: editEmployee?.bankDetails?.ifscCode || "",
            branchName: editEmployee?.bankDetails?.branchName || "",
            upiId: editEmployee?.bankDetails?.upiId || "",
            cancelledCheque: editEmployee?.bankDetails?.cancelledCheque || "",
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
            pincode: editEmployee?.address?.pincode || editEmployee?.address?.zipCode || "",
        },
        role: editEmployee?.role || "Employee",
        sendWelcomeEmail: true,
    };
}

export type EmployeeForm = ReturnType<typeof initialFormData>;

export function initialScope(editEmployee: Employee | undefined): ScopeState {
    return {
        branchId: refId(editEmployee?.branchId),
        branchIds: (editEmployee?.branchIds || []).map((b) => refId(b)),
        isGroupWide: !!editEmployee?.isGroupWide,
    };
}

export function calculateAge(dob: string): number {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/** Checks one wizard step. `missingFields` feeds the toast; `errors` the inline messages. */
export function validateStep(stepName: StepName, formData: EmployeeForm): { isValid: boolean; errors: FieldErrors; missingFields: string[] } {
    let isValid = true;
    const missingFields: string[] = [];
    const newErrors: FieldErrors = {};

    if (stepName === "Basic Info") {
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
    } else if (stepName === "Work Info") {
        if (!formData.department || (Array.isArray(formData.department) && formData.department.length === 0)) { isValid = false; newErrors.department = "At least one department is required"; missingFields.push("Department"); }
        if (!formData.dateOfJoining) { isValid = false; newErrors.dateOfJoining = "Join Date is required"; missingFields.push("Join Date"); }
        if (formData.address.pincode && !/^\d{6}$/.test(formData.address.pincode)) {
            isValid = false; newErrors.pincode = "Pincode must be exactly 6 digits"; missingFields.push("Invalid Pincode");
        }
    } else if (stepName === "Reporting") {
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
    } else if (stepName === "Payroll") {
        if (!formData.ctc) { isValid = false; newErrors.ctc = "Annual CTC is required"; missingFields.push("Annual CTC"); }
    } else if (stepName === "Statutory & Compliance") {
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
    } else if (stepName === "Bank Details") {
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
    } else if (stepName === "Documents") {
        if (!formData.panNumber) {
            isValid = false; newErrors.panNumber = "PAN Number is required"; missingFields.push("PAN Number");
        } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
            isValid = false; newErrors.panNumber = "Invalid PAN Format (e.g. ABCDE1234F)"; missingFields.push("Invalid PAN");
        }
        if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar)) {
            isValid = false; newErrors.aadhaar = "Aadhaar must be 12 digits"; missingFields.push("Invalid Aadhaar");
        }
    }

    return { isValid, errors: newErrors, missingFields };
}

/** Flat form fields that buildPayload moves under `statutory`. */
const STATUTORY_FLAT_FIELDS = [
    "pfEnabled", "uan", "pfNumber", "pfJoiningDate", "pfEmployeeContributionRate", "pfEmployerContributionRate",
    "pfContributionPreferences", "pfOverrideEnabled", "pfProRateRestrictedWage", "pfLOPBased", "pfABRYEligible",
    "esiEnabled", "esiNumber", "esiJoiningDate", "esiDispensary", "esiSalaryLimit", "esiDeductionCycle",
    "ptEnabled", "ptNumber", "ptDeductionCycle", "lwfEnabled", "lwfNumber", "lwfDeductionCycle",
    "statutoryBonusEnabled", "statutoryBonusAmount",
] as const;

/** The body for POST/PUT /api/employees. */
export function buildPayload(formData: EmployeeForm, scope: ScopeState | null): Record<string, unknown> {
    // Field names here must match backend/src/models/User.js's statutory schema paths exactly —
    // Mongoose silently drops any sub-field name that doesn't match the schema.
    const statutory = {
        pf: {
            enabled: formData.pfEnabled,
            uanNumber: formData.uan,
            pfNumber: formData.pfNumber,
            pfJoiningDate: formData.pfJoiningDate,
            employeeContributionRate: formData.pfEmployeeContributionRate,
            employerContributionRate: formData.pfEmployerContributionRate,
            contributionPreferences: {
                includeEmployerPF: formData.pfContributionPreferences.employerPF,
                includeEDLI: formData.pfContributionPreferences.edli,
                includeAdminCharges: formData.pfContributionPreferences.adminCharges,
            },
            allowOverride: formData.pfOverrideEnabled,
            proRateRestrictedPFWage: formData.pfProRateRestrictedWage,
            considerComponentsOnLOP: formData.pfLOPBased,
            eligibleForABRY: formData.pfABRYEligible,
        },
        esi: {
            enabled: formData.esiEnabled,
            esiNumber: formData.esiNumber,
            esiJoiningDate: formData.esiJoiningDate,
            dispensary: formData.esiDispensary,
            salaryLimit: formData.esiSalaryLimit,
            deductionCycle: formData.esiDeductionCycle,
        },
        pt: {
            enabled: formData.ptEnabled,
            ptRegistrationNumber: formData.ptNumber,
            deductionCycle: formData.ptDeductionCycle,
        },
        lwf: {
            enabled: formData.lwfEnabled,
            lwfAccountNumber: formData.lwfNumber,
            deductionCycle: formData.lwfDeductionCycle,
        },
        statutoryBonus: {
            enabled: formData.statutoryBonusEnabled,
            bonusAmount: formData.statutoryBonusAmount,
        },
    };

    const payload: Record<string, unknown> = {
        ...formData,
        department: Array.isArray(formData.department) ? formData.department.join(", ") : formData.department,
        statutory, // Inject structured statutory data
    };

    // Remove flat fields that were moved to statutory
    STATUTORY_FLAT_FIELDS.forEach((f) => delete payload[f]);

    if (scope) {
        payload.branchId = scope.branchId || null;
        payload.branchIds = scope.branchIds;
        payload.isGroupWide = scope.isGroupWide;
    }

    if (!payload.reportingManager) payload.reportingManager = null;
    if (!payload.shift) payload.shift = null;

    return payload;
}
