import type { CSSProperties } from "react";
import type { Ref } from "@/types/api";

export interface JobPosting {
    _id: string;
    title?: string;
    department?: string;
    designation?: string;
    description?: string;
    requirements?: string;
    location?: string;
    employmentType?: string;
    experienceMin?: number;
    experienceMax?: number;
    salaryMin?: number;
    salaryMax?: number;
    openings?: number;
    status: string;
}

/** A job candidate (GET /api/recruitment/candidates), as the modals read it. */
export interface Candidate {
    _id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    status: string;
    expectedCTC?: number | string;
    currentCTC?: number;
    currentCompany?: string;
    experience?: number;
    noticePeriod?: number;
    source?: string;
    notes?: string;
    /** Set once the candidate has been converted to an employee. */
    employeeId?: string | null;
    jobPosting?: Ref<{ _id: string; title?: string; designation?: string }> | null;
}

/** The add/edit form for a posting or a candidate (whichever tab is open). */
export type RecruitmentForm = { [field: string]: string | number | undefined };

/** An employee who can interview. */
export interface Person {
    _id: string;
    firstName?: string;
    lastName?: string;
    designation?: string;
}

export interface Interview {
    _id: string;
    round: string;
    scheduledAt: string;
    interviewer?: Person | null;
    mode: string;
    location?: string;
    rating?: number;
    result: string;
    feedback?: string;
}

export interface InterviewForm {
    round?: string;
    interviewer?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    mode?: string;
    location?: string;
}

export interface FeedbackForm {
    feedback?: string;
    rating?: number | string;
    result?: string;
}

/** Fields sent to POST /api/recruitment/candidates/:id/convert (empty ones are dropped). */
export type ConvertForm = { [field: string]: string | number | undefined };

export interface ConvertResult {
    employee?: { employeeId?: string };
    setupLinkSent?: boolean;
}

export const LABEL_STYLE: CSSProperties = { display: "block", marginBottom: "5px", fontSize: "14px", color: "var(--text-secondary)" };
export const MODAL_BG: CSSProperties = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "var(--overlay-bg)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center"
};
