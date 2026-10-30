import LegacyRedirect from "@/components/routing/LegacyRedirect";
import { legacyParams, legacyTarget } from "@/config/legacyRoutes";

/** Old /payroll-module/... → new URL (see src/config/legacyRoutes.ts). */
export const dynamicParams = false;
export function generateStaticParams() {
    return legacyParams("payroll-module");
}

export default async function Legacy({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    return <LegacyRedirect to={legacyTarget("payroll-module", slug)} />;
}
