import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { surfaceHeaders } from '@/lib/surface';

/**
 * The session is an HttpOnly cookie set by the API (rivo_session, or
 * rivo_console for the platform console). Page scripts never see or send the
 * token: withCredentials makes the browser attach the cookie, and
 * X-Requested-With is the anti-forgery header the API requires on
 * cookie-authenticated writes.
 */
export const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        // X-RIVO-Surface: console in the console build → the API uses the
        // separate 'rivo_console' cookie.
        ...surfaceHeaders(),
    },
});

/** Cached profile for display only (non-sensitive); auth state comes from GET /api/auth/me. */
export const USER_CACHE_KEY = 'ravi_zoho_user';
/** Where the session token used to live. Only ever removed now. */
export const LEGACY_TOKEN_KEY = 'ravi_zoho_token';

// First load after the cookie migration: drop any token a previous build left
// in localStorage, where any script on the page could read it.
if (typeof window !== 'undefined') {
    try { localStorage.removeItem(LEGACY_TOKEN_KEY); } catch { /* storage blocked */ }
}

// Add request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const userRaw = typeof window !== 'undefined' ? localStorage.getItem(USER_CACHE_KEY) : null;

        // Convenience only — NOT a security boundary.
        //
        // Anything attached here is editable in DevTools, so the API must never
        // trust it. The backend re-derives organizationId from the authenticated
        // user and overwrites whatever arrives in the body or query
        // (see backend src/utils/tenancy.js). This block only spares callers
        // from passing the org explicitly on every request.
        if (userRaw) {
            try {
                const user = JSON.parse(userRaw);
                const role = user?.role?.toLowerCase();
                const orgId = user?.organizationId;

                if (orgId && role !== 'superadmin') {
                    // Inject organizationId into Body for POST/PUT/PATCH
                    if (['post', 'put', 'patch'].includes(config.method || '')) {
                        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
                            if (!config.data.organizationId) {
                                config.data.organizationId = orgId;
                            }
                        }
                    }
                    // Inject organizationId into Params for GET
                    if (config.method === 'get') {
                        config.params = { ...config.params, organizationId: orgId };
                    }
                }
            } catch (e) {
                // Silently handle parse errors
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // A read-only company tried to change something: tell the topbar to show its banner.
        if (error.response?.status === 403 && error.response?.data?.code === 'ORG_READ_ONLY' && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('rivo:read-only', { detail: error.response.data.readOnlyUntil }));
        }
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            // Session gone: drop the cached user and go to /login — except for
            // auth endpoints, where a 401 means "wrong credentials" (or, for
            // /me, "not signed in", which AuthProvider handles itself).
            if (!url.includes('/api/auth/login') &&
                !url.includes('/api/auth/register') &&
                !url.includes('/api/auth/mfa/challenge') &&
                !url.includes('/api/auth/logout') &&
                !url.includes('/api/auth/me')) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(USER_CACHE_KEY);
                    if (window.location.pathname !== '/login') window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
