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
    role: 'superadmin' | 'admin' | 'hr' | 'manager' | 'employee';
    organizationId: string | null;
    departmentId: string | null;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

    const login = async (credentials: any) => {
        const res = await axiosInstance.post('/api/auth/login', credentials);
        const { user: rawUser, token: userToken } = res.data.data;
        const userData = normalizeUser(rawUser);

        // Persist to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('ravi_zoho_token', userToken);
            localStorage.setItem('ravi_zoho_user', JSON.stringify(userData));
        }
        
        setUser(userData);
        
        // Role-based redirection
        const role = userData.role;
        switch (role) {
            case 'superadmin': router.push('/superadmin/dashboard'); break;
            case 'admin': router.push('/admin/dashboard'); break;
            case 'hr': router.push('/hr/dashboard'); break;
            case 'manager': router.push('/manager/dashboard'); break;
            default: router.push('/employee/dashboard'); break;
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
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
