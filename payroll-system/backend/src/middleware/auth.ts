import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userRole?: 'admin' | 'finance' | 'hr' | 'employee';
            userEmail?: string;
        }
    }
}

/**
 * JWT Authentication Middleware
 * Verifies token and attaches user info to request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key') as any;

        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.userEmail = decoded.email;

        next();
    } catch (error: any) {
        res.status(401).json({
            error: 'Invalid token',
            message: error.message,
        });
    }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 */
export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.userRole) {
            res.status(401).json({ error: 'User role not found' });
            return;
        }

        if (!allowedRoles.includes(req.userRole)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.userRole,
            });
            return;
        }

        next();
    };
};

/**
 * Generate JWT Token
 */
export const generateToken = (userId: string, role: string, email: string): string => {
    return jwt.sign(
        {
            userId,
            role,
            email,
            iat: Math.floor(Date.now() / 1000),
        },
        process.env.JWT_SECRET || 'secret-key',
        {
            expiresIn: process.env.JWT_EXPIRY || '24h',
        }
    );
};
