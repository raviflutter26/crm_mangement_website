/**
 * Shapes of the records the RIVO API returns, as the website reads them.
 *
 * Fields are optional unless every endpoint that returns the record always
 * sends them: the API populates references on some routes and not others,
 * and older records predate several fields. A reference that may or may not
 * be populated is typed `Ref<T>`.
 */

/** A Mongo id as JSON. */
export type Id = string;

/** A reference that the API may send populated (an object) or as a bare id. */
export type Ref<T extends { _id: Id }> = T | Id;

/** The id of a possibly-populated reference. */
export function refId<T extends { _id: Id }>(ref: Ref<T> | null | undefined): Id {
    if (!ref) return '';
    return typeof ref === 'string' ? ref : String(ref._id);
}

/** A reference's populated object, or undefined when the API sent a bare id. */
export function populated<T extends { _id: Id }>(ref: Ref<T> | null | undefined): T | undefined {
    return ref && typeof ref === 'object' ? ref : undefined;
}

/** The usual `{ success, data, message }` envelope. */
export interface ApiResponse<T> {
    success?: boolean;
    data: T;
    message?: string;
}

export type CompanyRoleName = 'owner' | 'admin' | 'hr' | 'manager' | 'employee';
export type RoleName = CompanyRoleName | 'superadmin';

/** The signed-in account (login, /api/auth/me, password reset). */
export interface User {
    _id?: Id;
    id?: Id;
    employeeId?: string | null;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    role: RoleName | string;
    organizationId?: Id | null;
    department?: string;
    departmentId?: Id | null;
    designation?: string;
}

export interface Branch {
    _id: Id;
    name: string;
    code?: string;
    city?: string;
    state?: string;
    isHeadOffice?: boolean;
}

export interface Department {
    _id: Id;
    name: string;
    description?: string;
    head?: Ref<{ _id: Id; firstName?: string; lastName?: string }> | null;
    branchId?: Ref<Branch> | null;
}

export interface Shift {
    _id: Id;
    name: string;
    startTime?: string;
    endTime?: string;
    isNightShift?: boolean;
}

export interface Location {
    _id: Id;
    name: string;
    branch?: string;
}

/** Statutory settings as stored on the employee (backend/src/models/User.js). */
export interface EmployeeStatutory {
    pf?: {
        enabled?: boolean;
        uanNumber?: string;
        pfNumber?: string;
        pfJoiningDate?: string;
        employeeContributionRate?: number;
        employerContributionRate?: number;
        contributionPreferences?: { includeEmployerPF?: boolean; includeEDLI?: boolean; includeAdminCharges?: boolean };
        allowOverride?: boolean;
        proRateRestrictedPFWage?: boolean;
        considerComponentsOnLOP?: boolean;
        eligibleForABRY?: boolean;
    };
    esi?: { enabled?: boolean; esiNumber?: string; esiJoiningDate?: string; dispensary?: string; salaryLimit?: number; deductionCycle?: string };
    pt?: { enabled?: boolean; ptRegistrationNumber?: string; deductionCycle?: string };
    lwf?: { enabled?: boolean; lwfAccountNumber?: string; deductionCycle?: string };
    statutoryBonus?: { enabled?: boolean; bonusAmount?: number };
}

export interface BankDetails {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    upiId?: string;
    cancelledCheque?: string;
}

export interface Address {
    currentAddress?: string;
    permanentAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    zipCode?: string;
}

export interface SalaryBreakdown {
    basic?: number;
    hra?: number;
    da?: number;
    specialAllowance?: number;
}

/** An employee record (GET /api/employees). Employees are users of a company. */
export interface Employee {
    _id: Id;
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    role?: string;
    status?: string;
    organizationId?: Ref<{ _id: Id; name?: string }> | null;
    dateOfBirth?: string;
    maritalStatus?: string;
    profilePhoto?: string;
    /** Comma-separated department names. */
    department?: string;
    designation?: string;
    reportingManager?: Ref<{ _id: Id; firstName?: string; lastName?: string }> | null;
    location?: string;
    employmentType?: string;
    dateOfJoining?: string;
    shift?: Ref<Shift> | null;
    salaryStructure?: string;
    salary?: SalaryBreakdown;
    ctc?: number;
    paymentCycle?: string;
    statutory?: EmployeeStatutory;
    bankDetails?: BankDetails;
    panNumber?: string;
    aadhaar?: string;
    passportNumber?: string;
    drivingLicense?: string;
    address?: Address;
    branchId?: Ref<Branch> | null;
    branchIds?: Ref<Branch>[];
    isGroupWide?: boolean;
    /** Flat statutory fields written by older versions of the form. */
    esiDeductionCycle?: string;
    pfEnabled?: boolean;
    uan?: string;
    pfNumber?: string;
    pfJoiningDate?: string;
    pfEmployeeContributionRate?: number;
    pfEmployerContributionRate?: number;
    pfContributionPreferences?: { employerPF?: boolean; edli?: boolean; adminCharges?: boolean };
    pfOverrideEnabled?: boolean;
    pfProRateRestrictedWage?: boolean;
    pfLOPBased?: boolean;
    pfABRYEligible?: boolean;
    esiEnabled?: boolean;
    esiNumber?: string;
    esiJoiningDate?: string;
    esiDispensary?: string;
    esiSalaryLimit?: number;
    ptEnabled?: boolean;
    ptNumber?: string;
    ptDeductionCycle?: string;
    lwfEnabled?: boolean;
    lwfNumber?: string;
    lwfDeductionCycle?: string;
    statutoryBonusEnabled?: boolean;
    statutoryBonusAmount?: number;
}

export type PayrollRunStatus = 'draft' | 'processing' | 'processed' | 'approved' | 'paid' | 'locked' | string;

export interface PayrollRun {
    _id: Id;
    month: number;
    year: number;
    status: PayrollRunStatus;
    totalEmployees?: number;
    totalGross?: number;
    totalDeductions?: number;
    totalNet?: number;
    createdAt?: string;
}

export interface Payroll {
    _id: Id;
    employee?: Ref<Employee>;
    month?: number;
    year?: number;
    grossSalary?: number;
    totalDeductions?: number;
    netSalary?: number;
    status?: string;
}

export interface Leave {
    _id: Id;
    employee?: Ref<Employee>;
    leaveType?: string;
    startDate: string;
    endDate: string;
    days?: number;
    reason?: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | string;
}

export interface Attendance {
    _id: Id;
    employee?: Ref<Employee>;
    date: string;
    status?: string;
    checkIn?: string | null;
    checkOut?: string | null;
    workHours?: number;
}
