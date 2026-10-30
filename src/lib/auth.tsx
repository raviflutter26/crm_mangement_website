"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axiosInstance, { USER_CACHE_KEY } from './axios';
import { isSessionRejected } from './session';
import { useRouter } from 'next/navigation';
import { roleAllowedOnSurface } from './surface';

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

export interface LoginCredentials { email: string; password: string }

/** What login() resolves to: done, or waiting on an MFA code for this preAuthToken. */
export type LoginResult = { mfaRequired: false } | { mfaRequired: true; preAuthToken: string };

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<LoginResult>;
    completeMfaLogin: (preAuthToken: string, code: string) => Promise<void>;
    completeSsoLogin: () => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The landing page after sign-in. The one place this mapping lives: login and
 * the route guards send people here. Both surfaces use the neutral /dashboard
 * (the page itself is role-aware); a role that belongs on the other surface
 * (the RIVO team on the company app, a company user on the console) lands on
 * /wrong-app, which points them to the right address.
 */
export function dashboardPathFor(role?: string | null): string {
    return roleAllowedOnSurface(role) ? '/dashboard' : '/wrong-app';
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
function normalizeUser(raw: unknown): User | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Partial<User> & { id?: string };
    const id = r._id ?? r.id;
    return { ...r, _id: id, id } as User;
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
                localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
            }
        } catch (err) {
            if (isSessionRejected(err)) {
                setUser(null);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(USER_CACHE_KEY);
                }
            } else if (typeof window !== 'undefined') {
                // Keep the session cookie and fall back to the cached user so the
                // app stays usable. This is not a security decision: every
                // request is re-authorised server-side, and the cached user only
                // controls which screens are offered.
                try {
                    const cached = localStorage.getItem(USER_CACHE_KEY);
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

    /**
     * Finish a login and go to the user's dashboard. The session itself is the
     * HttpOnly cookie the API just set; only the display profile is cached.
     */
    const finishLogin = (data: { user?: unknown }) => {
        const userData = normalizeUser(data.user);

        if (typeof window !== 'undefined') {
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
        }

        setUser(userData);
        router.push(dashboardPathFor(userData?.role));
    };

    const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
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
     * Finish an SSO login: the API's callback set the session cookie and
     * redirected to /sso-complete. Load the profile and go to the user's
     * dashboard — the same end state as a password login.
     */
    const completeSsoLogin = async () => {
        const res = await axiosInstance.get('/api/auth/me');
        finishLogin({ user: res.data.data });
    };

    const logout = async () => {
        try {
            await axiosInstance.post('/api/auth/logout');
        } catch (err) {
            // console.error('Logout error:', err); // Removed error logging as per instruction
        } finally {
            setUser(null);
            // The API cleared the cookie and revoked the session.
            if (typeof window !== 'undefined') {
                localStorage.removeItem(USER_CACHE_KEY);
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
