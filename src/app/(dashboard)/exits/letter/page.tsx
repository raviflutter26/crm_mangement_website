"use client";

import { Suspense } from "react";
import ExitLetter from "../ExitLetter";

export default function ExitLetterPage() {
    return (
        <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading letter...</div>}>
            <ExitLetter />
        </Suspense>
    );
}
