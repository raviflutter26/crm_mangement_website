import EmployeeStatutoryComponent from "@/components/EmployeeStatutoryComponent";
import { use } from "react";

export function generateStaticParams() {
    return [{ id: "placeholder" }];
}

export const dynamicParams = false;

export default function EmployeeStatutoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <EmployeeStatutoryComponent id={id} />;
}
