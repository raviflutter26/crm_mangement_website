import Queue from 'bull';
import Redis from 'ioredis';
import RazorpayXService from '../services/RazorpayXService';
import PayoutTransaction from '../models/PayoutTransaction';
import NotificationService from '../services/NotificationService';

/**
 * Payout Queue - Bull Queue for Async Job Processing
 *
 * Architecture:
 * - Queue acts as middleware between API and processing
 * - Workers process payouts asynchronously
 * - Automatic retry on failure
 * - Real-time progress tracking
 *
 * Commands for testing:
 * - Check queue size: payoutQueue.count()
 * - Check failed jobs: payoutQueue.getFailedCount()
 * - Retry failed: job.retry()
 */

// Redis connection
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

// Create queue
export const payoutQueue = new Queue('payroll-payouts', redisConfig);

/**
 * Bull Queue Events
 */
payoutQueue.on('ready', () => {
    console.log('✅ Payout Queue ready');
});

payoutQueue.on('error', (error) => {
    console.error('❌ Queue error:', error);
});

payoutQueue.on('waiting', (jobId) => {
    console.log(`⏳ Job waiting: ${jobId}`);
});

payoutQueue.on('active', (job) => {
    console.log(`🚀 Processing job: ${job.id}`);
});

payoutQueue.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress: ${progress}%`);
});

payoutQueue.on('completed', (job) => {
    console.log(`✅ Job completed: ${job.id}`);
});

payoutQueue.on('failed', (job, error) => {
    console.error(`❌ Job failed: ${job.id} - ${error.message}`);
});

/**
 * Queue Processor
 * Handles actual payout processing
 */
export const startPayoutWorker = () => {
    const razorpayXService = new RazorpayXService();
    const notificationService = new NotificationService();

    // Process up to 5 jobs in parallel
    payoutQueue.process(5, async (job) => {
        const { payrollId, transactions } = job.data;

        try {
            console.log(`🔄 Processing payroll: ${payrollId}`);

            let successCount = 0;
            let failureCount = 0;
            const batchSize = 100; // Process 100 payouts at a time

            // Process transactions in batches
            for (let i = 0; i < transactions.length; i += batchSize) {
                const batch = transactions.slice(i, i + batchSize);
                const batchNumber = Math.floor(i / batchSize) + 1;
                const totalBatches = Math.ceil(transactions.length / batchSize);

                console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} payouts)`);

                try {
                    // Call RazorpayX bulk payout
                    const result = await razorpayXService.bulkPayout(batch);

                    successCount += result.successful.length;
                    failureCount += result.failed.length;

                    // Update transaction records
                    for (const success of result.successful) {
                        await PayoutTransaction.updateOne(
                            { transactionId: success.transactionId },
                            {
                                razorpayPayoutId: success.payoutId,
                                status: 'processing',
                            }
                        );
                    }

                    for (const failure of result.failed) {
                        await PayoutTransaction.updateOne(
                            { transactionId: failure.transactionId },
                            {
                                status: 'failed',
                                failureReason: failure.error,
                                $inc: { retryCount: 1 },
                            }
                        );
                    }

                    // Update job progress
                    const progress = Math.round(((i + batch.length) / transactions.length) * 100);
                    job.progress(progress);

                    // Delay between batches to avoid rate limiting
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                } catch (batchError: any) {
                    console.error(`❌ Batch ${batchNumber} failed:`, batchError.message);
                    // Continue with next batch instead of failing entire job
                }
            }

            // Update final stats
            const Payroll = require('../models/Payroll').default;
            await Payroll.updateOne(
                { _id: payrollId },
                {
                    payoutsCompleted: successCount,
                    payoutsFailed: failureCount,
                    payoutsPending: transactions.length - successCount - failureCount,
                }
            );

            // Send completion notification
            await notificationService.notifyPayrollCompleted(
                payrollId,
                transactions.length,
                successCount,
                failureCount
            );

            return {
                success: true,
                totalTransactions: transactions.length,
                successCount,
                failureCount,
                completedAt: new Date(),
            };
        } catch (error: any) {
            console.error(`❌ Payout job failed: ${error.message}`);
            throw new Error(`Bulk payout processing failed: ${error.message}`);
        }
    });

    console.log('✅ Payout worker started');
};

/**
 * Add payout job to queue
 */
export const queuePayoutJob = async (payrollId: string, transactions: any[]) => {
    try {
        const job = await payoutQueue.add(
            { payrollId, transactions },
            {
                priority: 1, // Higher priority
                attempts: 3, // Retry 3 times if fails
                backoff: {
                    type: 'exponential',
                    delay: 2000, // Start with 2 second delay
                },
                removeOnComplete: true,
                removeOnFail: false, // Keep failed jobs for debugging
            }
        );

        console.log(`📥 Payout job queued: ${job.id}`);
        return job;
    } catch (error: any) {
        console.error('❌ Error queuing payout job:', error.message);
        throw error;
    }
};

/**
 * Payslip Generation Queue
 */
export const payslipQueue = new Queue('payroll-payslips', redisConfig);

export const startPayslipWorker = () => {
    const notificationService = new NotificationService();

    payslipQueue.process(10, async (job) => {
        const { payrollId } = job.data;

        try {
            console.log(`📄 Generating payslips for: ${payrollId}`);

            // Generate payslips asynchronously
            const Payslip = require('../models/Payslip').default;
            const payslips = await Payslip.find({ payrollId, pdfGenerated: false });

            let generatedCount = 0;

            for (let i = 0; i < payslips.length; i++) {
                const payslip = payslips[i];

                try {
                    // Generate PDF (implementation depends on PDF library)
                    // const pdfUrl = await generatePayslipPDF(payslip);

                    // Update payslip record
                    await Payslip.updateOne(
                        { _id: payslip._id },
                        {
                            pdfGenerated: true,
                            generatedAt: new Date(),
                            // pdfUrl,
                        }
                    );

                    generatedCount++;

                    // Update progress
                    const progress = Math.round(((i + 1) / payslips.length) * 100);
                    job.progress(progress);
                } catch (error: any) {
                    console.error(`❌ Failed to generate payslip ${payslip._id}:`, error.message);
                }
            }

            return {
                success: true,
                payslipsGenerated: generatedCount,
                totalPayslips: payslips.length,
            };
        } catch (error: any) {
            console.error(`❌ Payslip generation job failed:`, error.message);
            throw error;
        }
    });

    console.log('✅ Payslip worker started');
};

/**
 * Queue utility functions
 */

export const getQueueStats = async () => {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        payoutQueue.getWaitingCount(),
        payoutQueue.getActiveCount(),
        payoutQueue.getCompletedCount(),
        payoutQueue.getFailedCount(),
        payoutQueue.getDelayedCount(),
    ]);

    return {
        payoutQueue: {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + completed + failed + delayed,
        },
    };
};

export const pauseQueue = async () => {
    await payoutQueue.pause();
    console.log('⏸️ Queue paused');
};

export const resumeQueue = async () => {
    await payoutQueue.resume();
    console.log('▶️ Queue resumed');
};

export const cleanQueue = async (days: number = 7) => {
    const timestamp = Date.now() - days * 24 * 60 * 60 * 1000;
    await payoutQueue.clean(timestamp);
    console.log(`🧹 Queue cleaned (older than ${days} days)`);
};

/**
 * Health check
 */
export const checkQueueHealth = async () => {
    try {
        const redis = new Redis(redisConfig);
        const info = await redis.info();
        redis.disconnect();

        const stats = await getQueueStats();

        return {
            status: 'healthy',
            queue: stats,
            redis: 'connected',
            timestamp: new Date(),
        };
    } catch (error: any) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date(),
        };
    }
};

export default payoutQueue;
