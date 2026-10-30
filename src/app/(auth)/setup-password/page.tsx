"use client";
// Invitation / reset links from the API land here (`${WEBSITE_URL}/setup-password?token=…`).
// A RIVO team account is sent on to the console's sign-in page (see SetupPassword).
import SetupPassword from "@/components/auth/SetupPassword";
export default function SetupPasswordPage() { return <SetupPassword />; }
