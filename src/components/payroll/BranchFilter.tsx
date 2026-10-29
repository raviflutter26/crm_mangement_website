"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export interface BranchOption {
    _id: string;
    name: string;
    state?: string;
    isDefault?: boolean;
}

/**
 * The branches the signed-in user may act in (GET /api/branches is already
 * confined to the caller's branches). Payroll runs per branch, so payroll
 * pages use this for their branch selector.
 */
export function useBranches() {
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        let alive = true;
        axiosInstance.get(API_ENDPOINTS.BRANCH_LIST)
            .then(res => { if (alive) setBranches((res.data?.data || []).filter((b: any) => b.isActive !== false)); })
            .catch(() => { if (alive) setBranches([]); })
            .finally(() => { if (alive) setLoaded(true); });
        return () => { alive = false; };
    }, []);
    return { branches, loaded };
}

interface BranchFilterProps {
    branches: BranchOption[];
    value: string;
    onChange: (branchId: string) => void;
    /** Offer "All branches" (value ""). Off when the caller must pick one. */
    allowAll?: boolean;
    label?: string;
}

/** A branch dropdown. Hidden entirely when there is nothing to choose between. */
export default function BranchFilter({ branches, value, onChange, allowAll = true, label = "Branch" }: BranchFilterProps) {
    if (branches.length <= 1 && allowAll) return null;
    return (
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#475569" }}>
            {label}
            <select className="form-input" value={value} onChange={e => onChange(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, minWidth: 180 }}>
                {allowAll && <option value="">All branches</option>}
                {!allowAll && !value && <option value="">Select branch…</option>}
                {branches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}{b.state ? ` (${b.state})` : ""}</option>
                ))}
            </select>
        </label>
    );
}
