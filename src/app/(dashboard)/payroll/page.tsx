import { redirect } from "next/navigation";

export default function PayrollOldPage() {
    redirect("/admin/dashboard/payroll/payroll-runs");
}
