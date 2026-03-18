"use client";
import StatutoryPage from "@/components/StatutoryPage";
import { useState } from "react";

export default function Statutory() {
    const [showNotification, setShowNotification] = useState(false);
    const [notifType, setNotifType] = useState<'success' | 'failure' | 'warning'>('success');
    const [notifMessage, setNotifMessage] = useState('');

    const showNotify = (type: any, message: string) => {
        setNotifType(type);
        setNotifMessage(message);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    return (
        <>
            <StatutoryPage showNotify={showNotify} />
            {showNotification && (
                <div className={`notification ${notifType}`} style={{ position: "fixed", bottom: "40px", right: "40px", zIndex: 1000 }}>
                    {notifMessage}
                </div>
            )}
        </>
    );
}
