"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axiosInstance from './axios';
import { useRouter } from 'next/navigation';

interface User {
    _id: string;
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
            const userData = res.data.data;
            setUser(userData);
            if (typeof window !== 'undefined') {
                localStorage.setItem('ravi_zoho_user', JSON.stringify(userData));
            }
        } catch (err) {
            setUser(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('ravi_zoho_token');
                localStorage.removeItem('ravi_zoho_user');
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials: any) => {
        const res = await axiosInstance.post('/api/auth/login', credentials);
        const { user: userData, token: userToken } = res.data.data;
        
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
