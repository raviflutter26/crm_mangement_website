import LegacyRedirect from "@/components/routing/LegacyRedirect";
import { legacyTarget } from "@/config/legacyRoutes";

/** Old /payroll-module → new URL (see src/config/legacyRoutes.ts). */
export default function Legacy() {
    return <LegacyRedirect to={legacyTarget("payroll-module")} />;
}
