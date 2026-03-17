import app, { logger } from './app';
import { connectDatabase, getDatabaseStatus } from './src/config/database';
import { connectRedis, getRedisStatus, getRedisClient } from './src/config/redis';

const PORT = process.env.PORT || 3000;

/**
 * Start the Express server
 */
const startServer = async (): Promise<void> => {
    try {
        // Connect to databases
        logger.info('Connecting to MongoDB...');
        await connectDatabase();

        logger.info('Connecting to Redis...');
        await connectRedis();

        // Start server
        const server = app.listen(PORT, () => {
            logger.info(`✓ Server running on http://localhost:${PORT}`);
            logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        /**
         * Graceful shutdown handler
         */
        const gracefulShutdown = async (): Promise<void> => {
            logger.info('Graceful shutdown initiated...');

            server.close(async () => {
                logger.info('✓ Server closed');

                try {
                    // Close Redis connection
                    const redisClient = getRedisClient();
                    await redisClient.disconnect();
                    logger.info('✓ Redis disconnected');
                } catch (err) {
                    logger.error('Error disconnecting Redis:', err);
                }

                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('✗ Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle termination signals
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);

        // Handle uncaught exceptions
        process.on('uncaughtException', (error: Error) => {
            logger.error('✗ Uncaught Exception:', error.message, error.stack);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason: any) => {
            logger.error('✗ Unhandled Rejection:', reason);
            process.exit(1);
        });
    } catch (error: any) {
        logger.error('✗ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Start the server
startServer();

export default app;
