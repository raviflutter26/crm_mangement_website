"use client";

import { Suspense } from "react";
import ExitLetter from "@/app/(dashboard)/exits/ExitLetter";

export default function MyExitLetterPage() {
    return (
        <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading letter...</div>}>
            <ExitLetter />
        </Suspense>
    );
}
