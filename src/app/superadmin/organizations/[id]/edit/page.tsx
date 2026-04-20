import OrganizationEditComponent from "@/components/OrganizationEditComponent";
import { use } from "react";

export function generateStaticParams() {
    return [{ id: "placeholder" }];
}

export const dynamicParams = false;

export default function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <OrganizationEditComponent id={id} />;
}
