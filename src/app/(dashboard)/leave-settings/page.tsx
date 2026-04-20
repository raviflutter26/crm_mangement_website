"use client";

import LeavePolicyPage from "@/components/LeavePolicyPage";
import { useState } from "react";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiX } from "react-icons/fi";

export default function LeaveSettingsRoute() {
    const [notify, setNotify] = useState<{ type: 'success' | 'failure' | 'warning' | null; message: string }>({ type: null, message: "" });

    const showNotify = (type: 'success' | 'failure' | 'warning', message: string) => {
        setNotify({ type, message });
        setTimeout(() => setNotify({ type: null, message: "" }), 5000);
    };

    return (
        <>
            {notify.type && (
                <div className={`snackbar ${notify.type}`}>
                    <div className="snackbar-icon">
                        {notify.type === 'success' && <FiCheckCircle />}
                        {notify.type === 'failure' && <FiXCircle />}
                        {notify.type === 'warning' && <FiAlertCircle />}
                    </div>
                    <div className="snackbar-content">{notify.message}</div>
                    <button className="snackbar-close" onClick={() => setNotify({ type: null, message: "" })}><FiX /></button>
                </div>
            )}
            <LeavePolicyPage showNotify={showNotify} />
        </>
    );
}
