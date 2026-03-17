/**
 * Login Page Component
 * Handles user authentication
 */

import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import './LoginPage.css';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
    const { login, loading, error } = useAuth();
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        confirmPassword: '',
    });
    const [localError, setLocalError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setLocalError(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        try {
            if (!formData.email || !formData.password) {
                setLocalError('Please enter email and password');
                return;
            }

            await login(formData.email, formData.password);
            onLoginSuccess();
        } catch (err: any) {
            setLocalError(err.message || 'Login failed');
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        try {
            if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
                setLocalError('Please fill in all fields');
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setLocalError('Passwords do not match');
                return;
            }

            if (formData.password.length < 8) {
                setLocalError('Password must be at least 8 characters');
                return;
            }

            // TODO: Implement signup using useAuth hook
            console.warn('Signup not yet implemented');
            setLocalError('Signup will be available soon');
        } catch (err: any) {
            setLocalError(err.message || 'Signup failed');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-box">
                    <div className="login-header">
                        <h1>Salary Payout Automation</h1>
                        <p>Secure Payroll Management System</p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}
                    {localError && <div className="alert alert-error">{localError}</div>}

                    {!isSignup ? (
                        <form onSubmit={handleLogin} className="login-form">
                            <h2>Login</h2>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter your email"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter your password"
                                    disabled={loading}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>

                            <div className="form-footer">
                                <p>
                                    Don't have an account?{' '}
                                    <button
                                        type="button"
                                        className="link-btn"
                                        onClick={() => {
                                            setIsSignup(true);
                                            setLocalError(null);
                                        }}
                                    >
                                        Sign up
                                    </button>
                                </p>
                            </div>

                            <div className="demo-login">
                                <p className="text-muted">Demo Credentials</p>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-block"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            email: 'admin@company.com',
                                            password: 'admin123',
                                        });
                                    }}
                                    disabled={loading}
                                >
                                    Use Demo Credentials
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSignup} className="login-form">
                            <h2>Create Account</h2>

                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    placeholder="Enter your first name"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    placeholder="Enter your last name"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="signup-email">Email Address</label>
                                <input
                                    id="signup-email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter your email"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="signup-password">Password</label>
                                <input
                                    id="signup-password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter your password (min 8 characters)"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm your password"
                                    disabled={loading}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>

                            <div className="form-footer">
                                <p>
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        className="link-btn"
                                        onClick={() => {
                                            setIsSignup(false);
                                            setLocalError(null);
                                        }}
                                    >
                                        Login
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}
                </div>

                <div className="login-info">
                    <div className="info-card">
                        <h3>🔒 Secure</h3>
                        <p>Enterprise-grade encryption for sensitive data</p>
                    </div>
                    <div className="info-card">
                        <h3>⚡ Fast</h3>
                        <p>Process 1000+ employee payrolls in minutes</p>
                    </div>
                    <div className="info-card">
                        <h3>✓ Reliable</h3>
                        <p>99%+ success rate with automatic retries</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
