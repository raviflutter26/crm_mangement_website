import mongoose, { Schema, Document } from 'mongoose';

export interface IPayoutTransaction extends Document {
    transactionId: string;
    payrollId: Schema.Types.ObjectId;
    employeeId: Schema.Types.ObjectId;
    razorpayPayoutId: string;
    razorpayFundAccountId: string;
    amount: number;
    grossSalary: number;
    deductions: number;
    netAmount: number;
    status: 'pending' | 'processing' | 'processed' | 'failed' | 'reversed' | 'rejected';
    razorpayStatus?: string; // Raw RazorpayX status
    failureReason?: string;
    failureCode?: string;
    retryCount: number;
    maxRetries: number;
    initiatedAt: Date;
    processedAt?: Date;
    webhookReceivedAt?: Date;
    reverseReason?: string;
    reversedAt?: Date;
    razorpayResponseData?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const PayoutTransactionSchema = new Schema<IPayoutTransaction>(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        payrollId: {
            type: Schema.Types.ObjectId,
            ref: 'Payroll',
            required: true,
            index: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true,
        },
        razorpayPayoutId: {
            type: String,
            index: true,
        },
        razorpayFundAccountId: {
            type: String,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        grossSalary: { type: Number, required: true },
        deductions: { type: Number, required: true },
        netAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['pending', 'processing', 'processed', 'failed', 'reversed', 'rejected'],
            default: 'pending',
            index: true,
        },
        razorpayStatus: String,
        failureReason: String,
        failureCode: String,
        retryCount: { type: Number, default: 0 },
        maxRetries: { type: Number, default: 3 },
        initiatedAt: {
            type: Date,
            default: Date.now,
        },
        processedAt: Date,
        webhookReceivedAt: Date,
        reverseReason: String,
        reversedAt: Date,
        razorpayResponseData: Schema.Types.Mixed,
    },
    { timestamps: true }
);

// Compound index for fast status queries
PayoutTransactionSchema.index({ payrollId: 1, status: 1 });
PayoutTransactionSchema.index({ employeeId: 1, status: 1 });
PayoutTransactionSchema.index({ razorpayPayoutId: 1 });

export default mongoose.model<IPayoutTransaction>(
    'PayoutTransaction',
    PayoutTransactionSchema
);
