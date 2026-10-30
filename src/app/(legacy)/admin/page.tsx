import LegacyRedirect from "@/components/routing/LegacyRedirect";
import { legacyTarget } from "@/config/legacyRoutes";

/** Old /admin → new URL (see src/config/legacyRoutes.ts). */
export default function Legacy() {
    return <LegacyRedirect to={legacyTarget("admin")} />;
}
