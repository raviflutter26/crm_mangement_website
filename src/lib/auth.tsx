"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axiosInstance from './axios';
import { isSessionRejected } from './session';
import { useRouter } from 'next/navigation';

interface User {
    _id: string;
    employeeId: string | null;
    firstName: string;
    lastName: string;
    email: string;
    role: 'superadmin' | 'owner' | 'admin' | 'hr' | 'manager' | 'employee';
    organizationId: string | null;
    departmentId: string | null;
    /** Set while the company is read-only (trial ended unpaid or subscription cancelled). */
    readOnlyUntil?: string | null;
    avatar?: string;
}

/** What login() resolves to: done, or waiting on an MFA code for this preAuthToken. */
export type LoginResult = { mfaRequired: false } | { mfaRequired: true; preAuthToken: string };

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: any) => Promise<LoginResult>;
    completeMfaLogin: (preAuthToken: string, code: string) => Promise<void>;
    completeSsoLogin: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The landing page for a role. The one place this mapping lives: login and
 * RoleGuard both send people here. An owner is the tenant's top administrator
 * and uses the admin area.
 */
export function dashboardPathFor(role?: string | null): string {
    switch (String(role || '').toLowerCase()) {
        case 'superadmin': return '/superadmin/dashboard';
        case 'owner':
        case 'admin': return '/admin/dashboard';
        case 'hr': return '/hr/dashboard';
        case 'manager': return '/manager/dashboard';
        default: return '/employee/dashboard';
    }
}

/**
 * Give the user object one identity field, whichever endpoint supplied it.
 *
 * /api/auth/login returns `id`; /api/auth/me returns `_id`. Pages guard on
 * `user?._id` (36 places), so a user restored from the login response looked
 * identity-less: effects that start with `if (!user?._id) return;` bailed out
 * and left their screens spinning forever. It cleared on refresh — checkAuth()
 * populates the other shape — which is why it read as intermittent.
 */
function normalizeUser(raw: any) {
    if (!raw) return raw;
    const id = raw._id ?? raw.id;
    return { ...raw, _id: id, id };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await axiosInstance.get('/api/auth/me');
            const userData = normalizeUser(res.data.data);
            setUser(userData);
            if (typeof window !== 'undefined') {
                localStorage.setItem('ravi_zoho_user', JSON.stringify(userData));
            }
        } catch (err) {
            if (isSessionRejected(err)) {
                setUser(null);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('ravi_zoho_token');
                    localStorage.removeItem('ravi_zoho_user');
                }
            } else if (typeof window !== 'undefined') {
                // Keep the credentials and fall back to the cached user so the
                // app stays usable. This is not a security decision: every
                // request is re-authorised server-side, and the cached user only
                // controls which screens are offered.
                try {
                    const cached = localStorage.getItem('ravi_zoho_user');
                    setUser(cached ? normalizeUser(JSON.parse(cached)) : null);
                } catch {
                    setUser(null);   // corrupt cache — treat as signed out
                }
            } else {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    /** Store the session from a login or MFA-challenge response and go to the user's dashboard. */
    const finishLogin = (data: any) => {
        const { user: rawUser, token: userToken } = data;
        const userData = normalizeUser(rawUser);

        // Persist to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('ravi_zoho_token', userToken);
            localStorage.setItem('ravi_zoho_user', JSON.stringify(userData));
        }

        setUser(userData);
        router.push(dashboardPathFor(userData.role));
    };

    const login = async (credentials: any): Promise<LoginResult> => {
        const res = await axiosInstance.post('/api/auth/login', credentials);
        const data = res.data.data;
        // With MFA on, the password step only yields a short-lived preAuthToken;
        // the session comes from /api/auth/mfa/challenge once a code is entered.
        if (data?.mfaRequired) {
            return { mfaRequired: true, preAuthToken: data.preAuthToken };
        }
        finishLogin(data);
        return { mfaRequired: false };
    };

    const completeMfaLogin = async (preAuthToken: string, code: string) => {
        const res = await axiosInstance.post('/api/auth/mfa/challenge', { preAuthToken, code: code.trim() });
        finishLogin(res.data.data);
    };

    /**
     * Finish an SSO login: the API's callback redirected to /sso-complete with
     * the session token in the URL fragment. Store it, load the profile, and go
     * to the user's dashboard — the same end state as a password login.
     */
    const completeSsoLogin = async (ssoToken: string) => {
        if (typeof window !== 'undefined') localStorage.setItem('ravi_zoho_token', ssoToken);
        try {
            const res = await axiosInstance.get('/api/auth/me');
            finishLogin({ user: res.data.data, token: ssoToken });
        } catch (err) {
            if (typeof window !== 'undefined') localStorage.removeItem('ravi_zoho_token');
            throw err;
        }
    };

    const logout = async () => {
        try {
            await axiosInstance.post('/api/auth/logout');
        } catch (err) {
            // console.error('Logout error:', err); // Removed error logging as per instruction
        } finally {
            setUser(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('ravi_zoho_token');
                localStorage.removeItem('ravi_zoho_user'); // Added this line as per instruction
            }
            router.push('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, completeMfaLogin, completeSsoLogin, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
