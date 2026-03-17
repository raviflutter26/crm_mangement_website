/**
 * Authentication Service
 * Handles login, signup, and auth-related API calls
 */

import api from './api';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        userId: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    };
    token: string;
}

export interface UserProfile {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

class AuthService {
    /**
     * Login user
     */
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        return api.post<AuthResponse>('/auth/login', credentials);
    }

    /**
     * Signup user
     */
    async signup(data: SignupRequest): Promise<AuthResponse> {
        return api.post<AuthResponse>('/auth/signup', data);
    }

    /**
     * Logout user
     */
    async logout(): Promise<{ success: boolean }> {
        return api.post('/auth/logout', {});
    }

    /**
     * Get user profile
     */
    async getProfile(): Promise<{ success: boolean; data: UserProfile }> {
        return api.get('/auth/profile');
    }

    /**
     * Refresh token
     */
    async refreshToken(): Promise<{ success: boolean; token: string }> {
        return api.post('/auth/refresh-token', {});
    }

    /**
     * Store token in localStorage
     */
    setToken(token: string, user: UserProfile): void {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userId', user.userId);
        localStorage.setItem('userEmail', user.email);
    }

    /**
     * Get token from localStorage
     */
    getToken(): string | null {
        return localStorage.getItem('authToken');
    }

    /**
     * Clear auth data
     */
    clearAuth(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    /**
     * Get user role
     */
    getUserRole(): string | null {
        return localStorage.getItem('userRole');
    }
}

export default new AuthService();
