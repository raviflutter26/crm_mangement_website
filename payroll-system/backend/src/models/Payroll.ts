import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
    payrollRunId: string;
    month: number; // 1-12
    year: number;
    companyId: Schema.Types.ObjectId;
    status: 'draft' | 'calculated' | 'approved' | 'in-process' | 'completed' | 'failed';
    payrollType: 'regular' | 'supplementary' | 'adjustment';
    totalEmployees: number;
    totalPayrolAmount: number;
    totalDeductions: number;
    totalApprovedAmount: number;
    payslipsGenerated: number;
    payoutsCompleted: number;
    payoutsFailed: number;
    payoutsPending: number;
    approvalWorkflow: {
        hr: { approvedAt?: Date; comment?: string; approvedBy: Schema.Types.ObjectId };
        finance: { approvedAt?: Date; comment?: string; approvedBy: Schema.Types.ObjectId };
        admin?: { approvedAt?: Date; comment?: string; approvedBy: Schema.Types.ObjectId };
    };
    calculatedAt?: Date;
    approvedAt?: Date;
    payoutStartedAt?: Date;
    completedAt?: Date;
    payrollTransactions: Schema.Types.ObjectId[]; // References to PayoutTransaction
    createdAt: Date;
    updatedAt: Date;
    createdBy: Schema.Types.ObjectId;
    updatedBy?: Schema.Types.ObjectId;
    notes?: string;
    failureReason?: string;
}

const PayrollSchema = new Schema<IPayroll>(
    {
        payrollRunId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: true,
        },
        companyId: {
            type: Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['draft', 'calculated', 'approved', 'in-process', 'completed', 'failed'],
            default: 'draft',
            index: true,
        },
        payrollType: {
            type: String,
            enum: ['regular', 'supplementary', 'adjustment'],
            default: 'regular',
        },
        totalEmployees: { type: Number, default: 0 },
        totalPayrolAmount: { type: Number, default: 0 },
        totalDeductions: { type: Number, default: 0 },
        totalApprovedAmount: { type: Number, default: 0 },
        payslipsGenerated: { type: Number, default: 0 },
        payoutsCompleted: { type: Number, default: 0 },
        payoutsFailed: { type: Number, default: 0 },
        payoutsPending: { type: Number, default: 0 },
        approvalWorkflow: {
            hr: {
                approvedAt: Date,
                comment: String,
                approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            },
            finance: {
                approvedAt: Date,
                comment: String,
                approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            },
            admin: {
                approvedAt: Date,
                comment: String,
                approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            },
        },
        calculatedAt: Date,
        approvedAt: Date,
        payoutStartedAt: Date,
        completedAt: Date,
        payrollTransactions: [{ type: Schema.Types.ObjectId, ref: 'PayoutTransaction' }],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        notes: String,
        failureReason: String,
    },
    { timestamps: true }
);

// Create compound index for month + year + company
PayrollSchema.index({ month: 1, year: 1, companyId: 1 });
PayrollSchema.index({ status: 1, companyId: 1 });

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);
