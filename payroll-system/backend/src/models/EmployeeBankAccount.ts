import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeBankAccount extends Document {
    employeeId: Schema.Types.ObjectId;
    accountHolderName: string;
    accountNumber: string; // ENCRYPTED
    ifscCode: string; // ENCRYPTED
    bankName: string;
    accountType: 'savings' | 'current';
    isVerified: boolean;
    verificationMethod?: 'micro-deposit' | 'manual' | 'auto';
    verificationDate?: Date;
    isPrimary: boolean;
    razorpayFundAccountId?: string;
    razorpayFundAccountStatus?: 'created' | 'active' | 'failed';
    encryptionVersion: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: Schema.Types.ObjectId;
    updatedBy?: Schema.Types.ObjectId;
}

const EmployeeBankAccountSchema = new Schema<IEmployeeBankAccount>(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true,
        },
        accountHolderName: { type: String, required: true },
        // Encrypted in application layer before storing
        accountNumber: {
            type: String,
            required: true,
            select: false, // Don't select by default
        },
        // Encrypted in application layer before storing
        ifscCode: {
            type: String,
            required: true,
            select: false, // Don't select by default
        },
        bankName: { type: String, required: true },
        accountType: {
            type: String,
            enum: ['savings', 'current'],
            default: 'savings',
        },
        isVerified: { type: Boolean, default: false },
        verificationMethod: {
            type: String,
            enum: ['micro-deposit', 'manual', 'auto'],
        },
        verificationDate: Date,
        isPrimary: { type: Boolean, default: true, index: true },
        razorpayFundAccountId: { type: String, index: true },
        razorpayFundAccountStatus: {
            type: String,
            enum: ['created', 'active', 'failed'],
            default: 'created',
        },
        encryptionVersion: { type: Number, default: 1 },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

// Create compound index for employee + primary account
EmployeeBankAccountSchema.index({ employeeId: 1, isPrimary: 1 });

// Instance methods for encryption/decryption are handled in service layer
export default mongoose.model<IEmployeeBankAccount>(
    'EmployeeBankAccount',
    EmployeeBankAccountSchema
);
