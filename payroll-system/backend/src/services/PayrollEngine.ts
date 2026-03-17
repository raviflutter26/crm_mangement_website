import Employee from '../models/Employee';
import SalaryStructure from '../models/SalaryStructure';
import Payroll from '../models/Payroll';
import Payslip from '../models/Payslip';
import PayoutTransaction from '../models/PayoutTransaction';

/**
 * Payroll Engine
 * Core business logic for salary calculation
 * Handles all components: basic, allowances, bonuses, deductions
 */

interface EmployeePayrollData {
    employeeId: string;
    salaryStructure: any;
    workingDays: number;
    daysPresent: number;
    daysAbsent: number;
    overtime?: number;
    bonusAmount?: number;
}

interface PayrollCalculation {
    basicSalary: number;
    allowances: {
        hra: number;
        da: number;
        specialAllowance: number;
        travelAllowance: number;
        foodAllowance: number;
        overtime?: number;
        performanceBonus?: number;
        total: number;
    };
    deductions: {
        pf: number;
        esi?: number;
        tax: number;
        professionalTax: number;
        total: number;
    };
    grossSalary: number;
    netSalary: number;
}

class PayrollEngine {
    /**
     * Calculate salary for a single employee
     * Follows Indian payroll calculation standards
     */
    calculateEmployeeSalary(data: EmployeePayrollData): PayrollCalculation {
        const { salaryStructure, workingDays, daysPresent, daysAbsent, overtime, bonusAmount } = data;

        // Calculate basic salary based on attendance
        const attendanceRatio = daysPresent / workingDays;
        const basicSalary = salaryStructure.basicSalary * attendanceRatio;

        // Calculate allowances
        const allowances = {
            hra: salaryStructure.allowances.hra * attendanceRatio,
            da: salaryStructure.allowances.da * attendanceRatio,
            specialAllowance: salaryStructure.allowances.specialAllowance * attendanceRatio,
            travelAllowance: salaryStructure.allowances.travelAllowance * attendanceRatio,
            foodAllowance: salaryStructure.allowances.foodAllowance * attendanceRatio,
            overtime: overtime || 0,
            performanceBonus: bonusAmount || 0,
            total: 0,
        };

        // Sum allowances
        allowances.total =
            allowances.hra +
            allowances.da +
            allowances.specialAllowance +
            allowances.travelAllowance +
            allowances.foodAllowance +
            allowances.overtime +
            allowances.performanceBonus;

        // Gross salary (before deductions)
        const grossSalary = basicSalary + allowances.total;

        // Calculate deductions
        const deductions = {
            pf: this.calculatePF(basicSalary),
            esi: this.calculateESI(grossSalary),
            tax: this.calculateIncomeTax(grossSalary, basicSalary),
            professionalTax: this.calculateProfessionalTax(grossSalary),
            total: 0,
        };

        // Sum deductions
        deductions.total =
            deductions.pf + (deductions.esi || 0) + deductions.tax + deductions.professionalTax;

        // Net salary
        const netSalary = grossSalary - deductions.total;

        return {
            basicSalary: Math.round(basicSalary),
            allowances: {
                ...allowances,
                total: Math.round(allowances.total),
            },
            deductions: {
                ...deductions,
                total: Math.round(deductions.total),
            },
            grossSalary: Math.round(grossSalary),
            netSalary: Math.round(netSalary),
        };
    }

    /**
     * Calculate PF (Provident Fund)
     * Employee contribution: 12% of basic salary
     * Employer contribution: 12% of basic salary (stored separately)
     *
     * Note: PF is calculated on basic salary only, not on allowances
     */
    calculatePF(basicSalary: number): number {
        const PF_RATE = 0.12; // 12% employee contribution
        return Math.round(basicSalary * PF_RATE);
    }

    /**
     * Calculate ESI (Employee State Insurance)
     * Only applicable if salary > 21,000/month
     * Employee contribution: 0.75% of gross salary
     * Employer contribution: 3.25% of gross salary (stored separately)
     */
    calculateESI(grossSalary: number): number {
        const ESI_THRESHOLD = 21000;
        const ESI_EMPLOYEE_RATE = 0.0075; // 0.75%

        if (grossSalary > ESI_THRESHOLD) {
            return Math.round(grossSalary * ESI_EMPLOYEE_RATE);
        }

        return 0;
    }

    /**
     * Calculate Income Tax
     * Uses simplified slab calculation (can be enhanced with detailed tax slabs)
     * Indian financial year: April to March
     */
    calculateIncomeTax(grossSalary: number, basicSalary: number): number {
        // Monthly annualized income
        const annualIncome = grossSalary * 12;

        // Standard deduction: ₹50,000
        const standardDeduction = 50000;
        const taxableIncome = Math.max(0, annualIncome - standardDeduction);

        let annualTax = 0;

        // Tax slabs for FY 2024-25 (individuals below 60 years)
        if (taxableIncome <= 300000) {
            annualTax = 0;
        } else if (taxableIncome <= 600000) {
            annualTax = (taxableIncome - 300000) * 0.05;
        } else if (taxableIncome <= 900000) {
            annualTax = 15000 + (taxableIncome - 600000) * 0.1;
        } else if (taxableIncome <= 1200000) {
            annualTax = 45000 + (taxableIncome - 900000) * 0.15;
        } else if (taxableIncome <= 1500000) {
            annualTax = 90000 + (taxableIncome - 1200000) * 0.2;
        } else {
            annualTax = 150000 + (taxableIncome - 1500000) * 0.3;
        }

        // Add 4% Health and Education Cess
        const healthCess = annualTax * 0.04;
        annualTax += healthCess;

        // Monthly tax
        const monthlyTax = annualTax / 12;

        return Math.round(monthlyTax);
    }

    /**
     * Calculate Professional Tax
     * Varies by state (using Maharashtra rates as example)
     * Quarterly payment deducted monthly
     */
    calculateProfessionalTax(grossSalary: number): number {
        // Maharashtra professional tax (example)
        // 0-0 for ≤ 8,500
        // ₹200 for 8,501 - 10,000
        // ₹400 for 10,001 - 15,000
        // ₹600 for 15,001+

        if (grossSalary <= 8500) {
            return 0;
        } else if (grossSalary <= 10000) {
            return Math.round(200 / 3); // Distribute quarterly amount monthly
        } else if (grossSalary <= 15000) {
            return Math.round(400 / 3);
        } else {
            return Math.round(600 / 3);
        }
    }

    /**
     * Run complete payroll for a month
     * Process all active employees and generate payroll run
     */
    async runMonthlyPayroll(
        month: number,
        year: number,
        companyId: string,
        userId: string
    ): Promise<{
        payrollRunId: string;
        totalEmployees: number;
        totalPayrollAmount: number;
        totalDeductions: number;
    }> {
        const payrollRunId = `PAYROLL-${year}-${String(month).padStart(2, '0')}-${Date.now()}`;

        try {
            // Fetch all active employees with salary structures
            const employees = await Employee.find({ status: 'active' })
                .populate('salaryStructureId')
                .select('+encryptionKey');

            if (employees.length === 0) {
                throw new Error('No active employees found');
            }

            let totalPayrollAmount = 0;
            let totalDeductions = 0;
            const payslips = [];
            const transactions = [];

            // Calculate salary for each employee
            for (const employee of employees) {
                const salaryStructure = employee.salaryStructureId;

                // Default working days per month (can be adjusted)
                const workingDays = 30;
                const daysPresent = 30; // Should come from attendance system
                const daysAbsent = 0;

                // Calculate salary
                const calculation = this.calculateEmployeeSalary({
                    employeeId: employee._id.toString(),
                    salaryStructure,
                    workingDays,
                    daysPresent,
                    daysAbsent,
                });

                totalPayrollAmount += calculation.netSalary;
                totalDeductions += calculation.deductions.total;

                // Create payslip record
                const payslipNumber = `PS-${year}-${String(month).padStart(2, '0')}-${employee.employeeId}`;

                const payslip = await Payslip.create({
                    payslipNumber,
                    payrollId: payrollRunId,
                    employeeId: employee._id,
                    month,
                    year,
                    workingDays,
                    daysPresent,
                    daysAbsent,
                    earnings: {
                        basicSalary: calculation.basicSalary,
                        ...calculation.allowances,
                        totalEarnings: calculation.grossSalary,
                    },
                    deductions: {
                        ...calculation.deductions,
                    },
                    netSalary: calculation.netSalary,
                    grossSalary: calculation.grossSalary,
                    pdfGenerated: false,
                    issuedAt: new Date(),
                });

                payslips.push(payslip);

                // Create transaction record
                const transactionId = `TXN-${payrollRunId}-${employee.employeeId}`;

                const transaction = await PayoutTransaction.create({
                    transactionId,
                    payrollId: payrollRunId,
                    employeeId: employee._id,
                    amount: calculation.netSalary,
                    grossSalary: calculation.grossSalary,
                    deductions: calculation.deductions.total,
                    netAmount: calculation.netSalary,
                    status: 'pending',
                    retryCount: 0,
                    maxRetries: 3,
                    initiatedAt: new Date(),
                });

                transactions.push(transaction);
            }

            // Create payroll run record
            const payroll = await Payroll.create({
                payrollRunId,
                month,
                year,
                companyId,
                status: 'calculated',
                totalEmployees: employees.length,
                totalPayrolAmount,
                totalDeductions,
                totalApprovedAmount: 0,
                payslipsGenerated: payslips.length,
                calculatedAt: new Date(),
                createdBy: userId,
                payrollTransactions: transactions.map((t) => t._id),
            });

            console.log(`✅ Payroll run created: ${payrollRunId}`);

            return {
                payrollRunId,
                totalEmployees: employees.length,
                totalPayrollAmount,
                totalDeductions,
            };
        } catch (error: any) {
            console.error('❌ Payroll calculation failed:', error.message);
            throw new Error(`Payroll processing failed: ${error.message}`);
        }
    }

    /**
     * Get payroll summary for reporting
     */
    async getPayrollSummary(
        month: number,
        year: number,
        companyId: string
    ): Promise<any> {
        const payroll = await Payroll.findOne({
            month,
            year,
            companyId,
        }).populate('payrollTransactions');

        if (!payroll) {
            throw new Error('Payroll not found');
        }

        return {
            payrollRunId: payroll.payrollRunId,
            month: payroll.month,
            year: payroll.year,
            status: payroll.status,
            totalEmployees: payroll.totalEmployees,
            totalPayrollAmount: payroll.totalPayrolAmount,
            totalDeductions: payroll.totalDeductions,
            payoutsSummary: {
                completed: payroll.payoutsCompleted,
                failed: payroll.payoutsFailed,
                pending: payroll.payoutsPending,
            },
            calculatedAt: payroll.calculatedAt,
            approvedAt: payroll.approvedAt,
            completedAt: payroll.completedAt,
        };
    }
}

export default PayrollEngine;
