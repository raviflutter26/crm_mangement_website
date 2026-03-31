"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/common/Sidebar";
import Topbar from "@/components/common/Topbar";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiX } from "react-icons/fi";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [notify, setNotify] = useState<{type: 'success' | 'failure' | 'warning' | null, message: string}>({ type: null, message: "" });

  useEffect(() => {
    // Only redirect if explicitly not loading and no user found
    if (!loading && !user) {
      const storedToken = localStorage.getItem("ravi_zoho_token");
      if (!storedToken) {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  const showNotify = (type: 'success' | 'failure' | 'warning', message: string) => {
    setNotify({ type, message });
    setTimeout(() => setNotify({ type: null, message: "" }), 5000);
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <div style={{ textAlign: "center" }}>
           <div style={{ width: "40px", height: "40px", border: "4px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
           <p style={{ fontWeight: 600 }}>Loading workspace...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Final safety check
  if (!user) return null;

  return (
    <div className="page-wrapper">
      {notify.type && (
        <div className={`snackbar ${notify.type}`}>
          <div className="snackbar-icon">
            {notify.type === 'success' && <FiCheckCircle />}
            {notify.type === 'failure' && <FiXCircle />}
            {notify.type === 'warning' && <FiAlertCircle />}
          </div>
          <div className="snackbar-content">{notify.message}</div>
          <button className="snackbar-close" onClick={() => setNotify({ type: null, message: "" })}>
            <FiX />
          </button>
        </div>
      )}

      {/* Sidebar and Topbar now part of the persistent layout */}
      <Sidebar /> 
      <div className="main-content">
        <Topbar />
        <div className="page-content animate-in">
          {/* Inject showNotify as a prop or through context if needed in the future */}
          {children}
        </div>
      </div>

      <style jsx global>{`
        .snackbar {
          position: fixed;
          top: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          z-index: 10000;
          animation: slideIn 0.3s ease-out;
          min-width: 300px;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .snackbar.success { background: white; border-left: 5px solid #34A853; }
        .snackbar.failure { background: white; border-left: 5px solid #EA4335; }
        .snackbar.warning { background: white; border-left: 5px solid #FBBC04; }
        
        .snackbar-icon { font-size: 20px; display: flex; align-items: center; }
        .success .snackbar-icon { color: #34A853; }
        .failure .snackbar-icon { color: #EA4335; }
        .warning .snackbar-icon { color: #FBBC04; }
        
        .snackbar-content { flex: 1; font-size: 14px; font-weight: 600; color: #1f2937; }
        .snackbar-close { background: none; border: none; color: #9ca3af; cursor: pointer; display: flex; align-items: center; font-size: 16px; }
        .snackbar-close:hover { color: #4b5563; }
      `}</style>
    </div>
  );
}
