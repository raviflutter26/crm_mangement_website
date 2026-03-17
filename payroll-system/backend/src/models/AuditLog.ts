import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    entityType: string; // 'Payroll', 'Employee', 'BankAccount', 'Payout', etc.
    entityId: Schema.Types.ObjectId;
    action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'process' | 'decrypt';
    performedBy: Schema.Types.ObjectId;
    changes: {
        fieldName: string;
        oldValue: any;
        newValue: any;
    }[];
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure';
    errorMessage?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        entityType: { type: String, required: true, index: true },
        entityId: { type: Schema.Types.ObjectId, required: true, index: true },
        action: {
            type: String,
            enum: ['create', 'update', 'delete', 'approve', 'reject', 'process', 'decrypt'],
            required: true,
            index: true,
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        changes: [
            {
                fieldName: String,
                oldValue: Schema.Types.Mixed,
                newValue: Schema.Types.Mixed,
            },
        ],
        ipAddress: String,
        userAgent: String,
        status: {
            type: String,
            enum: ['success', 'failure'],
            default: 'success',
        },
        errorMessage: String,
        metadata: Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now, expires: 7776000 }, // 90 days TTL
    },
    { timestamps: false }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
