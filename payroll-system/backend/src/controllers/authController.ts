import { Request, Response } from 'express';
import { generateToken } from '../middleware/auth';
import bcrypt from 'bcryptjs';

/**
 * User model interface
 */
interface IUser {
    _id?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'finance' | 'hr' | 'employee';
    createdAt?: Date;
}

/**
 * In-memory user storage (for development)
 * In production, use MongoDB
 */
const users: Map<string, IUser> = new Map();

/**
 * Authentication Controller
 */
export class AuthController {
    /**
     * POST /api/auth/signup
     * Register a new user
     */
    async signup(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, firstName, lastName, role } = req.body;

            // Validation
            if (!email || !password || !firstName || !lastName) {
                res.status(400).json({
                    error: 'Missing required fields',
                    required: ['email', 'password', 'firstName', 'lastName'],
                });
                return;
            }

            if (password.length < 8) {
                res.status(400).json({
                    error: 'Password must be at least 8 characters',
                });
                return;
            }

            // Check if user exists
            const existingUser = Array.from(users.values()).find(
                (u) => u.email === email
            );

            if (existingUser) {
                res.status(409).json({
                    error: 'User already exists',
                    email: email,
                });
                return;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const newUser: IUser = {
                _id: `user_${Date.now()}`,
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: role || 'employee',
                createdAt: new Date(),
            };

            users.set(newUser._id, newUser);

            // Generate token
            const token = generateToken(newUser._id, newUser.role, newUser.email);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    userId: newUser._id,
                    email: newUser.email,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    role: newUser.role,
                },
                token,
            });
        } catch (error: any) {
            res.status(500).json({
                error: 'Signup failed',
                message: error.message,
            });
        }
    }

    /**
     * POST /api/auth/login
     * Authenticate user and return token
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                res.status(400).json({
                    error: 'Missing email or password',
                });
                return;
            }

            // Find user
            const user = Array.from(users.values()).find((u) => u.email === email);

            if (!user) {
                res.status(401).json({
                    error: 'Invalid email or password',
                });
                return;
            }

            // Check password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                res.status(401).json({
                    error: 'Invalid email or password',
                });
                return;
            }

            // Generate token
            const token = generateToken(user._id!, user.role, user.email);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    userId: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
                token,
            });
        } catch (error: any) {
            res.status(500).json({
                error: 'Login failed',
                message: error.message,
            });
        }
    }

    /**
     * POST /api/auth/logout
     * Logout user (token invalidation in frontend)
     */
    async logout(req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error: any) {
            res.status(500).json({
                error: 'Logout failed',
                message: error.message,
            });
        }
    }

    /**
     * GET /api/auth/profile
     * Get authenticated user profile
     */
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId;

            if (!userId) {
                res.status(401).json({
                    error: 'Unauthorized',
                });
                return;
            }

            const user = users.get(userId);

            if (!user) {
                res.status(404).json({
                    error: 'User not found',
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    userId: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            });
        } catch (error: any) {
            res.status(500).json({
                error: 'Get profile failed',
                message: error.message,
            });
        }
    }

    /**
     * POST /api/auth/refresh-token
     * Refresh JWT token
     */
    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            const userRole = req.userRole;
            const userEmail = req.userEmail;

            if (!userId || !userRole || !userEmail) {
                res.status(401).json({
                    error: 'Unauthorized',
                });
                return;
            }

            const newToken = generateToken(userId, userRole, userEmail);

            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                token: newToken,
            });
        } catch (error: any) {
            res.status(500).json({
                error: 'Token refresh failed',
                message: error.message,
            });
        }
    }
}

export default AuthController;
