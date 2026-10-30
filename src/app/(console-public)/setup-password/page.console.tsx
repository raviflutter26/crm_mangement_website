"use client";
// The console's own set-password page: same form and API calls as the company
// app's /setup-password (GET/PUT /api/auth/reset-password/:token).
import SetupPassword from "@/components/auth/SetupPassword";
export default function SetupPasswordPage() { return <SetupPassword />; }
