/**
 * Which RIVO surface this bundle was built for.
 *
 * One codebase produces two static sites (see ROUTES.md):
 *   - 'tenant'  (default) the company app: owners, admins, HR, managers, employees
 *   - 'console' the RIVO platform console for the RIVO team (role superadmin)
 *
 * NEXT_PUBLIC_* values are inlined at build time, so each build only carries
 * its own surface's value.
 */
export type AppSurface = 'tenant' | 'console';

export const APP_SURFACE: AppSurface =
    process.env.NEXT_PUBLIC_APP_SURFACE === 'console' ? 'console' : 'tenant';

export const isConsoleSurface = APP_SURFACE === 'console';

const trimSlash = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url);

/** Base URL of the company app (used by the console to link to it). */
export const APP_URL = trimSlash(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

/** Base URL of the RIVO platform console (used by the company app to point the RIVO team there). */
export const CONSOLE_URL = trimSlash(process.env.NEXT_PUBLIC_CONSOLE_URL || 'http://localhost:3100');

/** Company roles: everyone who signs in to the tenant surface. */
export const COMPANY_ROLES = ['owner', 'admin', 'hr', 'manager', 'employee'] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];

/** The single role allowed on the console. The tenant surface admits COMPANY_ROLES only. */
export const PLATFORM_ROLE = 'superadmin';

/** Whether a signed-in role may use the surface this bundle was built for. */
export function roleAllowedOnSurface(role?: string | null): boolean {
    const r = String(role || '').toLowerCase().trim();
    // Spelled as the env comparison (not isConsoleSurface) so each build's
    // minifier drops the other surface's branch entirely.
    if (process.env.NEXT_PUBLIC_APP_SURFACE === 'console') return r === PLATFORM_ROLE;
    return (COMPANY_ROLES as readonly string[]).includes(r);
}

/**
 * Headers every API request from this bundle must carry. The backend keys the
 * session cookie on X-RIVO-Surface, so the console and the company app hold
 * separate sessions even on a shared parent domain.
 *
 * The axios instance (src/lib/axios.ts) spreads this into its default headers.
 */
export function surfaceHeaders(): Record<string, string> {
    return isConsoleSurface ? { 'X-RIVO-Surface': 'console' } : {};
}

/**
 * `?notice=` value /setup-password adds when it sends someone to a sign-in
 * page (on either surface); the login page shows a "password set" message.
 */
export const PASSWORD_SET_NOTICE = 'password-set';
