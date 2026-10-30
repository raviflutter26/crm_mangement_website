"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OrganizationViewComponent from "@/components/OrganizationViewComponent";
import EmptyState from "@/components/common/EmptyState";
import { FiAlertCircle } from "react-icons/fi";

function ViewOrganizationContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    if (!id) {
        return (
            <div style={{ padding: "80px 24px" }}>
                <EmptyState
                    title="No organization selected"
                    description="Open this page from the Organizations list to view a specific record."
                    icon={FiAlertCircle}
                />
            </div>
        );
    }

    return <OrganizationViewComponent id={id} />;
}

export default function ViewOrganizationPage() {
    return (
        <Suspense fallback={<div className="loading-spinner" style={{ margin: "100px auto" }} />}>
            <ViewOrganizationContent />
        </Suspense>
    );
}
