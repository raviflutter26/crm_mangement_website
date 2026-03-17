import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';

/**
 * Error Handler Middleware
 * Centralized error handling
 */
export const errorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('❌ Error:', error);

    // MongoDB validation error
    if (error.name === 'ValidationError') {
        res.status(400).json({
            error: 'Validation failed',
            details: Object.values(error.errors).map((err: any) => err.message),
        });
        return;
    }

    // MongoDB duplicate key error
    if (error.code === 11000) {
        res.status(409).json({
            error: 'Duplicate entry',
            field: Object.keys(error.keyPattern)[0],
        });
        return;
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    if (error.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expired' });
        return;
    }

    // Default error
    res.status(error.status || 500).json({
        error: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Audit Logger Middleware
 * Logs all API calls for security and compliance
 */
export const auditLogger = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const startTime = Date.now();

        // Capture response data
        const originalJson = res.json;
        res.json = function (data) {
            const duration = Date.now() - startTime;

            // Log to audit after response is sent
            setImmediate(async () => {
                try {
                    await AuditLog.create({
                        entityType: 'API_Request',
                        entityId: req.userId || 'anonymous',
                        action: 'create',
                        performedBy: req.userId,
                        status: res.statusCode < 400 ? 'success' : 'failure',
                        metadata: {
                            method: req.method,
                            path: req.path,
                            statusCode: res.statusCode,
                            duration: `${duration}ms`,
                            ip: req.ip,
                            userAgent: req.headers['user-agent'],
                        },
                    });
                } catch (logError) {
                    console.error('❌ Audit logging failed:', logError);
                }
            });

            return originalJson.call(this, data);
        };

        next();
    } catch (error) {
        console.error('❌ Audit logger error:', error);
        next();
    }
};
