"use client";

import { ReactNode } from "react";

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
}

export function Skeleton({ width = "100%", height = "20px", borderRadius = "8px", className = "" }: SkeletonProps) {
    return (
        <div 
            className={`animate-pulse bg-slate-200/60 ${className}`} 
            style={{ width, height, borderRadius }} 
        />
    );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
    return (
        <div className="w-full space-y-4">
            <div className="flex items-center space-x-4 px-4 py-2 border-b border-slate-100">
                {[...Array(cols)].map((_, i) => (
                    <Skeleton key={i} height={12} width={`${100 / cols}%`} />
                ))}
            </div>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 px-4 py-4 border-b border-slate-100/50 last:border-0">
                    {[...Array(cols)].map((_, j) => (
                        <Skeleton key={j} height={16} width={`${[60, 40, 50, 30, 40, 20][j % 6]}%`} />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton width={48} height={48} borderRadius={16} />
                <div className="space-y-2">
                    <Skeleton width={120} height={16} />
                    <Skeleton width={80} height={10} />
                </div>
            </div>
            <Skeleton width="100%" height={60} />
            <div className="flex justify-between pt-2">
                <Skeleton width={100} height={32} />
                <Skeleton width={80} height={32} />
            </div>
        </div>
    );
}

export default function LoadingSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div className="space-y-3">
                    <Skeleton width={240} height={32} />
                    <Skeleton width={400} height={16} />
                </div>
                <div className="flex gap-3">
                    <Skeleton width={120} height={44} />
                    <Skeleton width={140} height={44} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/40 space-y-4">
                        <Skeleton width={40} height={40} borderRadius={10} />
                        <Skeleton width={60} height={24} />
                        <Skeleton width={100} height={12} />
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <Skeleton width="100%" height={44} />
                </div>
                <TableSkeleton rows={8} />
            </div>
        </div>
    );
}
