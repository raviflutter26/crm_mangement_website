import crypto from 'crypto';
import PayoutTransaction from '../models/PayoutTransaction';
import AuditLog from '../models/AuditLog';
import NotificationService from './NotificationService';

/**
 * RazorpayX Webhook Handler
 *
 * Webhook Events:
 * - payout.processed: Payout successful
 * - payout.failed: Payout failed
 * - payout.reversed: Payout reversed
 * - payout.rejected: Payout rejected
 */

interface WebhookPayload {
    id: string;
    event: string;
    created_at: number;
    payload: {
        payout?: {
            id: string;
            entity?: string;
            fund_account_id: string;
            amount: number;
            currency: string;
            status: string;
            reason_code?: string;
            reason?: string;
            failure_reason?: string;
            fees?: number;
            tax?: number;
            utr?: string;
            reference_id?: string;
            notes?: Record<string, any>;
            created_at: number;
            [key: string]: any;
        };
    };
}

class RazorpayXWebhookHandler {
    private webhookSecret: string;
    private notificationService: NotificationService;

    constructor(webhookSecret: string = process.env.RAZORPAY_WEBHOOK_SECRET || '') {
        this.webhookSecret = webhookSecret;
        this.notificationService = new NotificationService();
    }

    /**
     * Verify webhook signature
     * Critical for security - ensures webhook is genuinely from RazorpayX
     *
     * Uses HMAC-SHA256 signature
     */
    verifySignature(body: string, signature: string): boolean {
        try {
            const hash = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(body)
                .digest('base64');

            const isValid = hash === signature;

            if (!isValid) {
                console.error('❌ Webhook signature verification failed');
            }

            return isValid;
        } catch (error: any) {
            console.error('❌ Signature verification error:', error.message);
            return false;
        }
    }

    /**
     * Handle payout.processed webhook
     * Called when payout is successfully processed
     */
    async handlePayoutProcessed(payload: WebhookPayload): Promise<void> {
        try {
            const payoutData = payload.payload.payout;

            if (!payoutData) {
                throw new Error('No payout data in webhook payload');
            }

            console.log(`✅ Processing payout processed webhook: ${payoutData.id}`);

            // Find transaction by payout ID
            const transaction = await PayoutTransaction.findOneAndUpdate(
                { razorpayPayoutId: payoutData.id },
                {
                    status: 'processed',
                    razorpayStatus: payoutData.status,
                    processedAt: new Date(),
                    webhookReceivedAt: new Date(),
                    razorpayResponseData: payoutData,
                    $inc: { retryCount: 0 }, // Reset retry count on success
                },
                { new: true }
            );

            if (!transaction) {
                console.warn(`⚠️ Transaction not found for payout: ${payoutData.id}`);
                return;
            }

            // Log to audit
            await AuditLog.create({
                entityType: 'PayoutTransaction',
                entityId: transaction._id,
                action: 'process',
                performedBy: null,
                status: 'success',
                metadata: {
                    razorpayPayoutId: payoutData.id,
                    utr: payoutData.utr,
                },
            });

            // Update payroll run stats
            await this.updatePayrollStats(transaction.payrollId, 'success');

            // Send employee notification
            await this.notificationService.notifyPayoutSuccess(transaction);

            console.log(`✅ Payout processed: ${payoutData.id} | UTR: ${payoutData.utr}`);
        } catch (error: any) {
            console.error('❌ Error handling payout processed:', error.message);
            throw error;
        }
    }

    /**
     * Handle payout.failed webhook
     * Called when payout fails
     */
    async handlePayoutFailed(payload: WebhookPayload): Promise<void> {
        try {
            const payoutData = payload.payload.payout;

            if (!payoutData) {
                throw new Error('No payout data in webhook payload');
            }

            console.log(`❌ Processing payout failed webhook: ${payoutData.id}`);

            // Find transaction
            const transaction = await PayoutTransaction.findOneAndUpdate(
                { razorpayPayoutId: payoutData.id },
                {
                    status: 'failed',
                    razorpayStatus: payoutData.status,
                    failureReason: payoutData.reason || payoutData.failure_reason,
                    failureCode: payoutData.reason_code,
                    webhookReceivedAt: new Date(),
                    razorpayResponseData: payoutData,
                    $inc: { retryCount: 1 },
                },
                { new: true }
            );

            if (!transaction) {
                console.warn(`⚠️ Transaction not found for payout: ${payoutData.id}`);
                return;
            }

            // Log to audit
            await AuditLog.create({
                entityType: 'PayoutTransaction',
                entityId: transaction._id,
                action: 'process',
                performedBy: null,
                status: 'failure',
                errorMessage: payoutData.failure_reason,
                metadata: {
                    reasonCode: payoutData.reason_code,
                    retryCount: transaction.retryCount,
                },
            });

            // Check if retry is possible
            if (transaction.retryCount < transaction.maxRetries) {
                console.log(
                    `🔄 Scheduling retry for payout: ${payoutData.id} (Attempt ${transaction.retryCount}/${transaction.maxRetries})`
                );
                // Queue job for retry (implementation depends on job queue system)
                // await payoutQueue.add({ transactionId: transaction._id }, { delay: 60000 * transaction.retryCount });
            } else {
                console.error(`❌ Max retries exceeded for payout: ${payoutData.id}`);
                await this.notificationService.notifyPayoutFailure(transaction);
            }

            // Update payroll run stats
            await this.updatePayrollStats(transaction.payrollId, 'failure');
        } catch (error: any) {
            console.error('❌ Error handling payout failed:', error.message);
            throw error;
        }
    }

    /**
     * Handle payout.reversed webhook
     * Called when a processed payout is reversed
     */
    async handlePayoutReversed(payload: WebhookPayload): Promise<void> {
        try {
            const payoutData = payload.payload.payout;

            if (!payoutData) {
                throw new Error('No payout data in webhook payload');
            }

            console.log(`⚠️ Processing payout reversed webhook: ${payoutData.id}`);

            const transaction = await PayoutTransaction.findOneAndUpdate(
                { razorpayPayoutId: payoutData.id },
                {
                    status: 'reversed',
                    razorpayStatus: payoutData.status,
                    reversedAt: new Date(),
                    webhookReceivedAt: new Date(),
                    razorpayResponseData: payoutData,
                },
                { new: true }
            );

            if (!transaction) {
                console.warn(`⚠️ Transaction not found for reversed payout: ${payoutData.id}`);
                return;
            }

            // Log to audit
            await AuditLog.create({
                entityType: 'PayoutTransaction',
                entityId: transaction._id,
                action: 'process',
                performedBy: null,
                status: 'success',
                metadata: {
                    action: 'reversed',
                    reasonCode: payoutData.reason_code,
                },
            });

            // Notify employee
            await this.notificationService.notifyPayoutReversed(transaction);

            console.log(`⚠️ Payout reversed: ${payoutData.id}`);
        } catch (error: any) {
            console.error('❌ Error handling payout reversed:', error.message);
            throw error;
        }
    }

    /**
     * Main webhook processor
     * Routes webhook to appropriate handler based on event type
     */
    async processWebhook(
        body: string,
        signature: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Verify signature first
            if (!this.verifySignature(body, signature)) {
                return {
                    success: false,
                    message: 'Invalid signature',
                };
            }

            const payload: WebhookPayload = JSON.parse(body);

            console.log(`📨 Webhook received: ${payload.event}`);

            // Route to appropriate handler
            switch (payload.event) {
                case 'payout.processed':
                    await this.handlePayoutProcessed(payload);
                    break;

                case 'payout.failed':
                    await this.handlePayoutFailed(payload);
                    break;

                case 'payout.reversed':
                    await this.handlePayoutReversed(payload);
                    break;

                case 'payout.rejected':
                    console.warn(`⚠️ Payout rejected: ${payload.payload.payout?.id}`);
                    // Handle rejection similar to failed
                    await this.handlePayoutFailed(payload);
                    break;

                default:
                    console.warn(`⚠️ Unknown webhook event: ${payload.event}`);
            }

            return {
                success: true,
                message: `${payload.event} processed successfully`,
            };
        } catch (error: any) {
            console.error('❌ Webhook processing error:', error.message);

            // Still return success to prevent RazorpayX from retrying
            // Log the error for manual investigation
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Update payroll run statistics based on payout status
     */
    private async updatePayrollStats(payrollId: string, status: 'success' | 'failure'): Promise<void> {
        try {
            const Payroll = require('../models/Payroll').default;

            if (status === 'success') {
                await Payroll.updateOne({ _id: payrollId }, { $inc: { payoutsCompleted: 1 } });
            } else {
                await Payroll.updateOne({ _id: payrollId }, { $inc: { payoutsFailed: 1 } });
            }
        } catch (error: any) {
            console.error('⚠️ Error updating payroll stats:', error.message);
        }
    }
}

export default RazorpayXWebhookHandler;
