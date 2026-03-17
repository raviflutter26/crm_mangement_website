import { Router, Request, Response } from 'express';
import express from 'express';
import RazorpayXWebhookHandler from '../webhooks/razorpayXWebhook';

const router = Router();

/**
 * RazorpayX Webhook Routes
 * These endpoints are called by RazorpayX with payout status updates
 */

const webhookHandler = new RazorpayXWebhookHandler(
    process.env.RAZORPAY_WEBHOOK_SECRET
);

/**
 * POST /webhooks/razorpay
 * Receive payout status updates from RazorpayX
 *
 * Webhook Events:
 * - payout.processed: Salary successfully transferred
 * - payout.failed: Transfer failed
 * - payout.reversed: Transfer reversed
 *
 * Headers:
 * - x-razorpay-signature: HMAC-SHA256 signature for verification
 *
 * No authentication required (signature verified instead)
 */
router.post('/razorpay', express.raw({ type: 'application/json' }), async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;
        const body = JSON.stringify(req.body);

        console.log(`📨 Webhook received: ${req.headers['x-razorpay-signature']?.substring(0, 20)}...`);

        const result = await webhookHandler.processWebhook(body, signature);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message,
            });
        }
    } catch (error: any) {
        console.error('❌ Webhook error:', error.message);

        // Always return 200 to prevent RazorpayX from retrying
        // Log error for manual investigation
        res.status(200).json({
            success: false,
            message: 'Webhook processed with errors',
            error: error.message,
        });
    }
});

/**
 * Health check for webhooks
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'webhook_receiver_healthy',
        timestamp: new Date(),
    });
});

export default router;
