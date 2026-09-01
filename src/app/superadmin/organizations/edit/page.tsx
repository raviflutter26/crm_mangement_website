"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OrganizationEditComponent from "@/components/OrganizationEditComponent";
import EmptyState from "@/components/common/EmptyState";
import { FiAlertCircle } from "react-icons/fi";

function EditOrganizationContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    if (!id) {
        return (
            <div style={{ padding: "80px 24px" }}>
                <EmptyState
                    title="No organization selected"
                    description="Open this page from the Organizations list to edit a specific record."
                    icon={FiAlertCircle}
                />
            </div>
        );
    }

    return <OrganizationEditComponent id={id} />;
}

export default function EditOrganizationPage() {
    return (
        <Suspense fallback={<div className="loading-spinner" style={{ margin: "100px auto" }} />}>
            <EditOrganizationContent />
        </Suspense>
    );
}
