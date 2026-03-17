import redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

let redisClient: redis.RedisClient | null = null;

/**
 * Create and connect to Redis
 */
export const connectRedis = async (): Promise<redis.RedisClient> => {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        redisClient = redis.createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('✗ Redis reconnection failed after 10 attempts');
                        return new Error('Redis max retries exceeded');
                    }
                    return retries * 50;
                },
            },
        });

        redisClient.on('error', (err) => {
            logger.error('✗ Redis error:', err.message);
        });

        redisClient.on('connect', () => {
            logger.info('✓ Redis connected successfully');
        });

        redisClient.on('ready', () => {
            logger.info('✓ Redis ready for commands');
        });

        await redisClient.connect();
        return redisClient;
    } catch (error: any) {
        logger.error('✗ Redis connection failed:', error.message);
        process.exit(1);
    }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): redis.RedisClient => {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call connectRedis first.');
    }
    return redisClient;
};

/**
 * Disconnect from Redis
 */
export const disconnectRedis = async (): Promise<void> => {
    try {
        if (redisClient) {
            await redisClient.disconnect();
            logger.info('✓ Redis disconnected successfully');
        }
    } catch (error: any) {
        logger.error('✗ Redis disconnection failed:', error.message);
    }
};

/**
 * Check Redis connection status
 */
export const getRedisStatus = (): boolean => {
    return redisClient?.isOpen || false;
};

export default {
    connectRedis,
    getRedisClient,
    disconnectRedis,
    getRedisStatus,
};
