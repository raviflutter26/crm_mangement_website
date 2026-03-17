import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import winston from 'winston';

import { errorHandler, auditLogger } from './src/middleware/errorHandler';
import apiRoutes from './src/routes/index';
import webhookRoutes from './src/routes/webhooks';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();

// Logger setup
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Export logger for use throughout the app
export { logger };

/**
 * ============================================
 * SECURITY MIDDLEWARE
 * ============================================
 */

// Helmet: Set security HTTP headers
app.use(helmet());

// CORS: Enable cross-origin requests
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Rate limiting: Prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

app.use(limiter);

/**
 * ============================================
 * BODY PARSING MIDDLEWARE
 * ============================================
 */

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// URL-encoded body parser
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * ============================================
 * LOG MIDDLEWARE
 * ============================================
 */

// Audit logger: Log all requests and responses
app.use(auditLogger);

/**
 * ============================================
 * HEALTH CHECK ENDPOINT
 * ============================================
 */

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

/**
 * ============================================
 * API ROUTES
 * ============================================
 */

// Webhook routes (should come before auth, as webhooks have their own verification)
app.use('/webhooks', webhookRoutes);

// API routes (with authentication)
app.use('/api', apiRoutes);

/**
 * ============================================
 * 404 HANDLER
 * ============================================
 */

app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.path} not found`,
        path: req.path,
        method: req.method,
    });
});

/**
 * ============================================
 * ERROR HANDLING MIDDLEWARE
 * ============================================
 */

app.use(errorHandler);

// Export app
export default app;
