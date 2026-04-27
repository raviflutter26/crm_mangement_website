import OrganizationViewComponent from "@/components/OrganizationViewComponent";
import { use } from "react";

export function generateStaticParams() {
    return [{ id: "placeholder" }];
}

export default async function ViewOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <OrganizationViewComponent id={id} />;
}
