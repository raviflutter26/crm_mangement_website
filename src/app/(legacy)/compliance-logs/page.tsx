import LegacyRedirect from "@/components/routing/LegacyRedirect";
import { RENAMED_ROUTES } from "@/config/legacyRoutes";

/** Old /compliance-logs → new URL (see src/config/legacyRoutes.ts). */
export default function Legacy() {
    return <LegacyRedirect to={RENAMED_ROUTES["compliance-logs"]} />;
}
