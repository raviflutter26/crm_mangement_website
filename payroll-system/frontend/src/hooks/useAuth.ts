/**
 * useAuth Hook
 * Manages authentication state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import authService, { UserProfile } from '../services/auth';

export interface AuthState {
    isAuthenticated: boolean;
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
}

export const useAuth = () => {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    });

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = authService.getToken();
                if (token) {
                    const response = await authService.getProfile();
                    setState({
                        isAuthenticated: true,
                        user: response.data,
                        loading: false,
                        error: null,
                    });
                } else {
                    setState({
                        isAuthenticated: false,
                        user: null,
                        loading: false,
                        error: null,
                    });
                }
            } catch (error: any) {
                setState({
                    isAuthenticated: false,
                    user: null,
                    loading: false,
                    error: error.message,
                });
            }
        };

        checkAuth();
    }, []);

    // Login
    const login = useCallback(async (email: string, password: string) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const response = await authService.login({ email, password });
            authService.setToken(response.token, response.data);
            setState({
                isAuthenticated: true,
                user: response.data,
                loading: false,
                error: null,
            });
            return response;
        } catch (error: any) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: error.message,
            }));
            throw error;
        }
    }, []);

    // Signup
    const signup = useCallback(
        async (email: string, password: string, firstName: string, lastName: string) => {
            try {
                setState((prev) => ({ ...prev, loading: true, error: null }));
                const response = await authService.signup({
                    email,
                    password,
                    firstName,
                    lastName,
                });
                authService.setToken(response.token, response.data);
                setState({
                    isAuthenticated: true,
                    user: response.data,
                    loading: false,
                    error: null,
                });
                return response;
            } catch (error: any) {
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: error.message,
                }));
                throw error;
            }
        },
        []
    );

    // Logout
    const logout = useCallback(async () => {
        try {
            await authService.logout();
            authService.clearAuth();
            setState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
            });
        } catch (error: any) {
            setState((prev) => ({
                ...prev,
                error: error.message,
            }));
        }
    }, []);

    return {
        ...state,
        login,
        signup,
        logout,
    };
};

export default useAuth;
