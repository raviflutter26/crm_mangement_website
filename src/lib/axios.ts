import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

// Create axios instance with default headers
export const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('ravi_zoho_token') : null;
        const userRaw = typeof window !== 'undefined' ? localStorage.getItem('ravi_zoho_user') : null;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

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
            // Only redirect to login if the request was NOT for an auth endpoint
            if (!url.includes('/api/auth/login') && 
                !url.includes('/api/auth/register') && 
                !url.includes('/api/auth/mfa/challenge') &&
                !url.includes('/api/auth/me')) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('ravi_zoho_token');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
