import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ravi Zoho - HR & Payroll Management",
  description: "Comprehensive HR and Payroll management system integrated with Zoho People and Zoho Payroll. Manage employees, attendance, leaves, and payroll seamlessly.",
  keywords: ["Zoho", "HR", "Payroll", "Employee Management", "Attendance", "Leave Management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
