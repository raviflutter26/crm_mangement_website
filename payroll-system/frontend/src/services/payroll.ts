/**
 * Payroll Service
 * Handles payroll-related API calls
 */

import api from './api';

export interface RunPayrollRequest {
    month: number;
    year: number;
}

export interface PayrollData {
    payrollRunId: string;
    month: number;
    year: number;
    status: string;
    totalEmployees: number;
    totalPayrollAmount: number;
    totalDeductions: number;
}

export interface PayoutStatus {
    payrollRunId: string;
    status: string;
    statistics: Array<{
        _id: string;
        count: number;
        totalAmount: number;
    }>;
}

export interface PayslipData {
    payslipNumber: string;
    employeeId: string;
    employeeName: string;
    grossSalary: number;
    netSalary: number;
    month: number;
    year: number;
}

export interface BankAccount {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    accountType: string;
}

class PayrollService {
    /**
     * Run payroll calculation
     */
    async runPayroll(request: RunPayrollRequest): Promise<{ success: boolean; data: PayrollData }> {
        return api.post('/payroll/run', request);
    }

    /**
     * Get payroll details
     */
    async getPayrollDetails(payrollRunId: string): Promise<{ success: boolean; data: PayrollData }> {
        return api.get(`/payroll/${payrollRunId}`);
    }

    /**
     * Approve payroll
     */
    async approvePayroll(
        payrollRunId: string,
        approvingAs: 'hr' | 'finance',
        comment?: string
    ): Promise<{ success: boolean; message: string }> {
        return api.post(`/payroll/${payrollRunId}/approve`, {
            approvingAs,
            comment,
        });
    }

    /**
     * Trigger payout
     */
    async triggerPayout(payrollRunId: string): Promise<{ success: boolean; message: string }> {
        return api.post(`/payroll/${payrollRunId}/payout`, {});
    }

    /**
     * Get payout status
     */
    async getPayoutStatus(payrollRunId: string): Promise<{ success: boolean; data: PayoutStatus }> {
        return api.get(`/payroll/${payrollRunId}/status`);
    }

    /**
     * Get payslips
     */
    async getPayslips(payrollRunId: string): Promise<{ success: boolean; data: PayslipData[] }> {
        return api.get(`/payroll/${payrollRunId}/payslips`);
    }

    /**
     * Download payslip PDF
     */
    async downloadPayslip(payrollRunId: string, employeeId: string): Promise<Blob> {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/payroll/${payrollRunId}/payslip/${employeeId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to download payslip');
        }

        return response.blob();
    }

    /**
     * Get payroll summary
     */
    async getPayrollSummary(): Promise<{ success: boolean; data: any }> {
        return api.get('/reports/payroll');
    }

    /**
     * Get tax report
     */
    async getTaxReport(): Promise<{ success: boolean; data: any }> {
        return api.get('/reports/tax');
    }

    /**
     * Add bank account
     */
    async addBankAccount(employeeId: string, bankData: BankAccount): Promise<{ success: boolean; data: any }> {
        return api.post(`/employees/${employeeId}/bank`, bankData);
    }

    /**
     * Get bank account
     */
    async getBankAccount(employeeId: string): Promise<{ success: boolean; data: BankAccount }> {
        return api.get(`/employees/${employeeId}/bank`);
    }

    /**
     * Verify bank account with RazorpayX
     */
    async verifyBankAccount(employeeId: string): Promise<{ success: boolean; data: any }> {
        return api.post(`/employees/${employeeId}/bank/verify`, {});
    }

    /**
     * Delete bank account
     */
    async deleteBankAccount(employeeId: string): Promise<{ success: boolean; message: string }> {
        return api.delete(`/employees/${employeeId}/bank`);
    }
}

export default new PayrollService();
