"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** /security has no page of its own; its first section is SSO. */
export default function SecurityIndex() {
    const router = useRouter();
    useEffect(() => { router.replace("/security/sso"); }, [router]);
    return null;
}
