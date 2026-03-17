import mongoose from 'mongoose';
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

/**
 * Connect to MongoDB
 */
export const connectDatabase = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/salary-payout';

        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info('✓ MongoDB connected successfully');
    } catch (error: any) {
        logger.error('✗ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        logger.info('✓ MongoDB disconnected successfully');
    } catch (error: any) {
        logger.error('✗ MongoDB disconnection failed:', error.message);
    }
};

/**
 * Get MongoDB connection status
 */
export const getDatabaseStatus = (): boolean => {
    return mongoose.connection.readyState === 1;
};

export default {
    connectDatabase,
    disconnectDatabase,
    getDatabaseStatus,
};
