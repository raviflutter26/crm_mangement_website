import OrganizationEditComponent from "@/components/OrganizationEditComponent";
import { use } from "react";

export function generateStaticParams() {
    return [{ id: "placeholder" }];
}

export default async function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <OrganizationEditComponent id={id} />;
}
