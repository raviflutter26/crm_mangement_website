import type { Metadata } from "next";
import "./globals.css";
import "./tailwind.css";

export const metadata: Metadata = {
  title: "RIVO — HR & Payroll Management",
  description: "RIVO unifies employee management, attendance, leave tracking, and statutory-compliant payroll (EPF, ESI, PT, LWF) in one platform.",
  keywords: ["RIVO", "HRMS", "HR", "Payroll", "Employee Management", "Attendance", "Leave Management", "EPF", "ESI"],
};

import { AuthProvider } from "@/lib/auth";
import { DialogProvider } from "@/components/common/DialogProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <DialogProvider>
            {children}
          </DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
