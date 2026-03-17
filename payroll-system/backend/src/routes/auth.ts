import { Router, Request, Response } from 'express';
import { authenticate, asyncHandler } from '../middleware/auth';
import AuthController from '../controllers/authController';

const router = Router();
const authController = new AuthController();

/**
 * ============================================
 * AUTHENTICATION ROUTES
 * ============================================
 */

/**
 * POST /api/auth/signup
 * Register a new user
 * Public endpoint
 */
router.post(
    '/signup',
    asyncHandler((req: Request, res: Response) =>
        authController.signup(req, res)
    )
);

/**
 * POST /api/auth/login
 * Authenticate user and receive JWT token
 * Public endpoint
 */
router.post(
    '/login',
    asyncHandler((req: Request, res: Response) =>
        authController.login(req, res)
    )
);

/**
 * POST /api/auth/logout
 * Logout user (invalidate token on frontend)
 * Protected endpoint
 */
router.post(
    '/logout',
    authenticate,
    asyncHandler((req: Request, res: Response) =>
        authController.logout(req, res)
    )
);

/**
 * GET /api/auth/profile
 * Get authenticated user profile
 * Protected endpoint
 */
router.get(
    '/profile',
    authenticate,
    asyncHandler((req: Request, res: Response) =>
        authController.getProfile(req, res)
    )
);

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token
 * Protected endpoint
 */
router.post(
    '/refresh-token',
    authenticate,
    asyncHandler((req: Request, res: Response) =>
        authController.refreshToken(req, res)
    )
);

export default router;
