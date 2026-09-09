"use client";

import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import type { FetchError } from "@/lib/fetchError";

interface ErrorStateProps {
    /** One or more failures to report. Nothing renders when this is empty. */
    errors: FetchError[];
    onRetry?: () => void;
    /** "banner" sits above partially-loaded content; "panel" replaces it entirely. */
    variant?: "banner" | "panel";
    title?: string;
}

/**
 * Surfaces a failed request instead of letting it masquerade as an empty table.
 *
 * Pair with EmptyState, never replace it: EmptyState means "the server answered
 * and there is nothing here", this means "we could not get an answer".
 */
export default function ErrorState({
    errors,
    onRetry,
    variant = "banner",
    title = "Some data could not be loaded",
}: ErrorStateProps) {
    if (!errors || errors.length === 0) return null;

    // The same outage usually rejects every parallel request, so collapse
    // duplicates rather than repeating one message five times.
    const unique = Array.from(new Set(errors.map((e) => e.message)));
    const retryable = errors.some((e) => e.retryable);

    if (variant === "panel") {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-red-50/40 rounded-[2rem] border-2 border-dashed border-red-200/70">
                <div className="flex items-center justify-center w-16 h-16 bg-white border border-red-200 rounded-2xl shadow-lg text-red-400 mb-5">
                    <FiAlertTriangle size={30} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-2">{title}</h3>
                <ul className="text-slate-600 text-[13px] leading-relaxed max-w-[420px] space-y-1 mb-6">
                    {unique.map((m) => (
                        <li key={m}>{m}</li>
                    ))}
                </ul>
                {onRetry && retryable && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-[12px] uppercase tracking-wider rounded-xl shadow-sm transition-colors"
                    >
                        <FiRefreshCw size={15} /> Try again
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            role="alert"
            className="flex items-start gap-3 px-4 py-3 mb-5 bg-red-50 border border-red-200 rounded-xl"
        >
            <FiAlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="font-bold text-[13px] text-red-900">{title}</div>
                <ul className="text-[12.5px] text-red-800/90 leading-relaxed mt-0.5 space-y-0.5">
                    {unique.map((m) => (
                        <li key={m}>{m}</li>
                    ))}
                </ul>
            </div>
            {onRetry && retryable && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:border-red-300 text-red-700 font-bold text-[11px] uppercase tracking-wider rounded-lg shrink-0 transition-colors"
                >
                    <FiRefreshCw size={13} /> Retry
                </button>
            )}
        </div>
    );
}
