"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiCheckCircle, FiXCircle, FiInfo, FiX } from "react-icons/fi";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

type ToastKind = "success" | "error" | "info";

interface ToastItem {
    id: number;
    kind: ToastKind;
    message: string;
}

interface DialogContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    toast: {
        success: (message: string) => void;
        error: (message: string) => void;
        info: (message: string) => void;
    };
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export function DialogProvider({ children }: { children: ReactNode }) {
    const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [mounted, setMounted] = useState(false);
    const toastIdRef = useRef(0);

    // Portal target (document.body) only exists client-side. Render nothing on the
    // server and on the client's first (pre-hydration) pass, then flip on after
    // mount so the initial client render matches the server output exactly.
    useEffect(() => {
        setMounted(true);
    }, []);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setConfirmState({ ...options, resolve });
        });
    }, []);

    const closeConfirm = (result: boolean) => {
        confirmState?.resolve(result);
        setConfirmState(null);
    };

    const pushToast = useCallback((kind: ToastKind, message: string) => {
        const id = ++toastIdRef.current;
        setToasts((prev) => [...prev, { id, kind, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const toast = {
        success: (message: string) => pushToast("success", message),
        error: (message: string) => pushToast("error", message),
        info: (message: string) => pushToast("info", message),
    };

    const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
        <DialogContext.Provider value={{ confirm, toast }}>
            {children}
            {mounted && createPortal(
                <>
                    {confirmState && (
                        <div
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-4"
                            onClick={() => closeConfirm(false)}
                        >
                            <div
                                className="bg-white rounded-2xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.25)] w-full max-w-sm p-6"
                                onClick={(e) => e.stopPropagation()}
                                style={{ animation: "dialogPopIn 0.15s ease-out" }}
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${confirmState.danger ? "bg-red-50 text-red-500" : "bg-orange-50 text-[#FF7A00]"}`}>
                                    <FiAlertTriangle size={20} />
                                </div>
                                <h3 className="text-[16px] font-bold text-slate-900 mb-1.5">{confirmState.title}</h3>
                                {confirmState.description && (
                                    <p className="text-[13px] text-slate-500 leading-relaxed mb-6">{confirmState.description}</p>
                                )}
                                {!confirmState.description && <div className="mb-6" />}
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => closeConfirm(false)}
                                        className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        {confirmState.cancelLabel || "Cancel"}
                                    </button>
                                    <button
                                        onClick={() => closeConfirm(true)}
                                        className={`px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-colors ${confirmState.danger ? "bg-red-500 hover:bg-red-600" : "bg-[#1E2A3A] hover:bg-slate-800"}`}
                                    >
                                        {confirmState.confirmLabel || "Confirm"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none">
                        {toasts.map((t) => {
                            const Icon = t.kind === "success" ? FiCheckCircle : t.kind === "error" ? FiXCircle : FiInfo;
                            const cls = t.kind === "success"
                                ? "bg-white border-emerald-200/80 text-emerald-600"
                                : t.kind === "error"
                                    ? "bg-white border-red-200/80 text-red-500"
                                    : "bg-white border-slate-200/80 text-slate-600";
                            return (
                                <div
                                    key={t.id}
                                    className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-[0_16px_48px_-8px_rgba(0,0,0,0.12)] ${cls}`}
                                    style={{ animation: "toastSlideIn 0.2s ease-out" }}
                                >
                                    <Icon size={18} className="shrink-0 mt-0.5" />
                                    <span className="text-[13px] font-semibold text-slate-700 flex-1">{t.message}</span>
                                    <button onClick={() => dismissToast(t.id)} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
                                        <FiX size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <style>{`
                        @keyframes dialogPopIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
                        @keyframes toastSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                    `}</style>
                </>,
                document.body
            )}
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error("useDialog must be used within a DialogProvider");
    return ctx;
}

export function useConfirm() {
    return useDialog().confirm;
}

export function useToast() {
    return useDialog().toast;
}
