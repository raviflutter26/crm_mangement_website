import mongoose, { Schema, Document } from 'mongoose';

export interface ISalaryStructure extends Document {
    employeeId?: Schema.Types.ObjectId;
    name: string;
    description?: string;
    basicSalary: number;
    allowances: {
        hra: number;
        da: number;
        specialAllowance: number;
        travelAllowance: number;
        foodAllowance: number;
        otherAllowances?: Record<string, number>;
    };
    deductions: {
        pf: number; // Provident Fund - normally 12% of basic
        esi?: number; // ESI - if applicable
        tax: number; // Income Tax
        professionalTax: number;
        otherDeductions?: Record<string, number>;
    };
    bonuses: {
        annualBonus?: number;
        performanceBonus?: number;
        festivalBonus?: number;
        gratuity?: number;
    };
    grossSalary: number; // Calculated: Basic + Allowances
    totalDeductions: number; // Calculated: All deductions
    netSalary: number; // Calculated: Gross - Deductions
    paymentFrequency: 'monthly' | 'bi-weekly' | 'weekly';
    effectiveDate: Date;
    expiryDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: Schema.Types.ObjectId;
    updatedBy?: Schema.Types.ObjectId;
}

const SalaryStructureSchema = new Schema<ISalaryStructure>(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            index: true,
        },
        name: { type: String, required: true },
        description: String,
        basicSalary: {
            type: Number,
            required: true,
            min: 0,
        },
        allowances: {
            hra: { type: Number, default: 0, min: 0 },
            da: { type: Number, default: 0, min: 0 },
            specialAllowance: { type: Number, default: 0, min: 0 },
            travelAllowance: { type: Number, default: 0, min: 0 },
            foodAllowance: { type: Number, default: 0, min: 0 },
            otherAllowances: { type: Map, of: Number, default: {} },
        },
        deductions: {
            pf: { type: Number, default: 0, min: 0 },
            esi: { type: Number, default: 0, min: 0 },
            tax: { type: Number, default: 0, min: 0 },
            professionalTax: { type: Number, default: 0, min: 0 },
            otherDeductions: { type: Map, of: Number, default: {} },
        },
        bonuses: {
            annualBonus: { type: Number, default: 0, min: 0 },
            performanceBonus: { type: Number, default: 0, min: 0 },
            festivalBonus: { type: Number, default: 0, min: 0 },
            gratuity: { type: Number, default: 0, min: 0 },
        },
        grossSalary: { type: Number, required: true, min: 0 },
        totalDeductions: { type: Number, required: true, min: 0 },
        netSalary: { type: Number, required: true, min: 0 },
        paymentFrequency: {
            type: String,
            enum: ['monthly', 'bi-weekly', 'weekly'],
            default: 'monthly',
        },
        effectiveDate: { type: Date, required: true, index: true },
        expiryDate: Date,
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

// Pre-save hook to calculate salary totals
SalaryStructureSchema.pre('save', function (next) {
    const doc = this;

    // Calculate gross salary
    let grossAllowances = 0;
    if (doc.allowances) {
        grossAllowances =
            (doc.allowances.hra || 0) +
            (doc.allowances.da || 0) +
            (doc.allowances.specialAllowance || 0) +
            (doc.allowances.travelAllowance || 0) +
            (doc.allowances.foodAllowance || 0);

        if (doc.allowances.otherAllowances) {
            Object.values(doc.allowances.otherAllowances).forEach((val: any) => {
                grossAllowances += val;
            });
        }
    }

    doc.grossSalary = doc.basicSalary + grossAllowances;

    // Calculate total deductions
    let totalDed = 0;
    if (doc.deductions) {
        totalDed =
            (doc.deductions.pf || 0) +
            (doc.deductions.esi || 0) +
            (doc.deductions.tax || 0) +
            (doc.deductions.professionalTax || 0);

        if (doc.deductions.otherDeductions) {
            Object.values(doc.deductions.otherDeductions).forEach((val: any) => {
                totalDed += val;
            });
        }
    }

    doc.totalDeductions = totalDed;

    // Calculate net salary
    doc.netSalary = doc.grossSalary - doc.totalDeductions;

    next();
});

export default mongoose.model<ISalaryStructure>(
    'SalaryStructure',
    SalaryStructureSchema
);
