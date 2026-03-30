"use client";

import { ReactNode } from "react";
import { FiInbox, FiPlus } from "react-icons/fi";

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: any;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export default function EmptyState({ 
    title, 
    description, 
    icon: Icon = FiInbox, 
    actionLabel, 
    onAction, 
    className = "" 
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-20 px-6 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200/60 ${className}`}>
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#FF7A00]/10 rounded-full blur-2xl animate-pulse" />
                <div className="relative flex items-center justify-center w-20 h-20 bg-white border border-slate-200/80 rounded-2xl shadow-xl text-slate-300">
                    <Icon size={36} />
                </div>
            </div>
            
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">
                {title}
            </h3>
            <p className="text-slate-500 font-medium text-[14px] leading-relaxed max-w-[320px] mb-8">
                {description}
            </p>

            {actionLabel && onAction && (
                <button 
                    onClick={onAction}
                    className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#FF7A00] hover:bg-orange-600 text-white font-bold text-[13px] uppercase tracking-wider rounded-xl shadow-lg shadow-orange-200/50 transform transition-all duration-200 hover:-translate-y-1 active:scale-95"
                >
                    <FiPlus size={18} />
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
