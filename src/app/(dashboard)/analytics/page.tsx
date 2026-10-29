"use client";

// This route was a generic list stub that fetched /api/dashboard (an object)
// and called .map on it, crashing the page. The real analytics view already
// exists and reads /api/dashboard/analytics, which is scoped per role on the
// server, so the tenant dashboard renders that same view.
export { default } from "@/app/admin/analytics/page";
