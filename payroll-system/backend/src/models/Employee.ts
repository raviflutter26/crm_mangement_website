import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfJoining: Date;
    dateOfBirth: Date;
    department: string;
    designation: string;
    reportingManager: Schema.Types.ObjectId;
    status: 'active' | 'inactive' | 'on-leave' | 'separated';
    salaryStructureId: Schema.Types.ObjectId;
    bankAccountId?: Schema.Types.ObjectId;
    razorpayContactId?: string;
    razorpayFundAccountId?: string;
    pfNumber?: string;
    panNumber?: string;
    aadharNumber?: string;
    gender: 'M' | 'F' | 'Other';
    bloodGroup?: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
    createdAt: Date;
    updatedAt: Date;
    createdBy?: Schema.Types.ObjectId;
    updatedBy?: Schema.Types.ObjectId;
    deletedAt?: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
    {
        employeeId: { type: String, required: true, unique: true, index: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        phone: { type: String, required: true },
        dateOfJoining: { type: Date, required: true },
        dateOfBirth: { type: Date, required: true },
        department: { type: String, required: true, index: true },
        designation: { type: String, required: true },
        reportingManager: { type: Schema.Types.ObjectId, ref: 'Employee' },
        status: {
            type: String,
            enum: ['active', 'inactive', 'on-leave', 'separated'],
            default: 'active',
            index: true,
        },
        salaryStructureId: { type: Schema.Types.ObjectId, ref: 'SalaryStructure', required: true },
        bankAccountId: { type: Schema.Types.ObjectId, ref: 'EmployeeBankAccount' },
        razorpayContactId: { type: String },
        razorpayFundAccountId: { type: String },
        pfNumber: { type: String },
        panNumber: { type: String },
        aadharNumber: { type: String },
        gender: { type: String, enum: ['M', 'F', 'Other'] },
        bloodGroup: String,
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: { type: String, default: 'India' },
        },
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String,
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        deletedAt: { type: Date, index: true },
    },
    { timestamps: true }
);

// Soft delete middleware
EmployeeSchema.query.active = function () {
    return this.where({ deletedAt: { $eq: null } });
};

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
