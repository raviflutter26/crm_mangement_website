import OrganizationViewComponent from "@/components/OrganizationViewComponent";
import { use } from "react";

export function generateStaticParams() {
    return [{ id: "placeholder" }];
}

export const dynamicParams = false;

export default function ViewOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <OrganizationViewComponent id={id} />;
}
