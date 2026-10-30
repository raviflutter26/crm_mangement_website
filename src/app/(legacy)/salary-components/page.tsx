import LegacyRedirect from "@/components/routing/LegacyRedirect";
import { RENAMED_ROUTES } from "@/config/legacyRoutes";

/** Old /salary-components → new URL (see src/config/legacyRoutes.ts). */
export default function Legacy() {
    return <LegacyRedirect to={RENAMED_ROUTES["salary-components"]} />;
}
