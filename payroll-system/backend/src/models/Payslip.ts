import mongoose, { Schema, Document } from 'mongoose';

export interface IPayslip extends Document {
    payslipNumber: string;
    payrollId: Schema.Types.ObjectId;
    employeeId: Schema.Types.ObjectId;
    month: number;
    year: number;
    workingDays: number;
    daysPresent: number;
    daysAbsent: number;
    earnings: {
        basicSalary: number;
        hra: number;
        da: number;
        specialAllowance: number;
        travelAllowance: number;
        foodAllowance: number;
        overtime?: number;
        performanceBonus?: number;
        otherEarnings?: Record<string, number>;
        totalEarnings: number;
    };
    deductions: {
        pf: number;
        esi?: number;
        tax: number;
        professionalTax: number;
        otherDeductions?: Record<string, number>;
        totalDeductions: number;
    };
    netSalary: number;
    grossSalary: number;
    bankAccountLastFour?: string;
    transactionId?: string;
    payoutStatus?: string;
    pdfUrl?: string;
    pdfGenerated: boolean;
    generatedAt?: Date;
    issuedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PayslipSchema = new Schema<IPayslip>(
    {
        payslipNumber: {
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
        month: { type: Number, required: true, min: 1, max: 12 },
        year: { type: Number, required: true },
        workingDays: { type: Number, default: 30 },
        daysPresent: { type: Number, default: 0 },
        daysAbsent: { type: Number, default: 0 },
        earnings: {
            basicSalary: { type: Number, required: true },
            hra: { type: Number, default: 0 },
            da: { type: Number, default: 0 },
            specialAllowance: { type: Number, default: 0 },
            travelAllowance: { type: Number, default: 0 },
            foodAllowance: { type: Number, default: 0 },
            overtime: { type: Number, default: 0 },
            performanceBonus: { type: Number, default: 0 },
            otherEarnings: { type: Map, of: Number, default: {} },
            totalEarnings: { type: Number, required: true },
        },
        deductions: {
            pf: { type: Number, default: 0 },
            esi: { type: Number, default: 0 },
            tax: { type: Number, default: 0 },
            professionalTax: { type: Number, default: 0 },
            otherDeductions: { type: Map, of: Number, default: {} },
            totalDeductions: { type: Number, required: true },
        },
        netSalary: { type: Number, required: true },
        grossSalary: { type: Number, required: true },
        bankAccountLastFour: String,
        transactionId: { type: String, index: true },
        payoutStatus: {
            type: String,
            enum: ['pending', 'processed', 'failed', 'reversed'],
        },
        pdfUrl: String,
        pdfGenerated: { type: Boolean, default: false },
        generatedAt: Date,
        issuedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Compound indices
PayslipSchema.index({ payrollId: 1, employeeId: 1 });
PayslipSchema.index({ month: 1, year: 1, employeeId: 1 });

export default mongoose.model<IPayslip>('Payslip', PayslipSchema);
