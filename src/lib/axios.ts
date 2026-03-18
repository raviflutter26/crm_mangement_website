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

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            // Only redirect to login if the request was NOT for an auth endpoint
            if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('ravi_zoho_token');
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
