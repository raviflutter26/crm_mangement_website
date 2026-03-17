import { Request, Response } from 'express';
import PayrollEngine from '../services/PayrollEngine';
import RazorpayXService from '../services/RazorpayXService';
import Payroll from '../models/Payroll';
import Payslip from '../models/Payslip';
import PayoutTransaction from '../models/PayoutTransaction';
import NotificationService from '../services/NotificationService';

/**
 * Payroll Controller
 * Handles all payroll-related API endpoints
 */

class PayrollController {
    private payrollEngine: PayrollEngine;
    private razorpayXService: RazorpayXService;
    private notificationService: NotificationService;

    constructor() {
        this.payrollEngine = new PayrollEngine();
        this.razorpayXService = new RazorpayXService();
        this.notificationService = new NotificationService();
    }

    /**
     * POST /api/payroll/run
     * Run payroll calculation for a month
     * This calculates salaries but does NOT trigger payouts
     */
    async runPayroll(req: Request, res: Response): Promise<void> {
        try {
            const { month, year, companyId } = req.body;
            const userId = (req as any).userId; // From auth middleware

            // Validate input
            if (!month || !year || !companyId) {
                res.status(400).json({ error: 'Missing required fields: month, year, companyId' });
                return;
            }

            if (month < 1 || month > 12) {
                res.status(400).json({ error: 'Invalid month (1-12)' });
                return;
            }

            // Check if payroll already exists for this month
            const existingPayroll = await Payroll.findOne({ month, year, companyId });
            if (existingPayroll) {
                res.status(409).json({
                    error: 'Payroll already exists for this month',
                    payrollRunId: existingPayroll.payrollRunId,
                });
                return;
            }

            // Run payroll calculation
            const result = await this.payrollEngine.runMonthlyPayroll(
                month,
                year,
                companyId,
                userId
            );

            res.status(201).json({
                success: true,
                message: 'Payroll calculated successfully',
                data: result,
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/payroll/:payrollRunId
     * Get payroll details
     */
    async getPayrollDetails(req: Request, res: Response): Promise<void> {
        try {
            const { payrollRunId } = req.params;

            const payroll = await Payroll.findOne({ payrollRunId })
                .populate('payrollTransactions')
                .populate('createdBy', 'firstName lastName email');

            if (!payroll) {
                res.status(404).json({ error: 'Payroll not found' });
                return;
            }

            res.json({
                success: true,
                data: payroll,
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/payroll/:payrollRunId/approve
     * Approve payroll (multi-level approval workflow)
     * Requires HR and Finance approval
     */
    async approvePayroll(req: Request, res: Response): Promise<void> {
        try {
            const { payrollRunId } = req.params;
            const { approvingAs, comment } = req.body;
            const userId = (req as any).userId;
            const userRole = (req as any).userRole; // From auth middleware

            // Validate role
            if (!['hr', 'finance', 'admin'].includes(approvingAs)) {
                res.status(400).json({ error: 'Invalid approval role' });
                return;
            }

            // Check permission based on role
            const allowedRoles = {
                hr: ['hr', 'admin'],
                finance: ['finance', 'admin'],
                admin: ['admin'],
            };

            if (!allowedRoles[approvingAs as keyof typeof allowedRoles]?.includes(userRole)) {
                res.status(403).json({ error: 'Insufficient permissions' });
                return;
            }

            const payroll = await Payroll.findOne({ payrollRunId });

            if (!payroll) {
                res.status(404).json({ error: 'Payroll not found' });
                return;
            }

            if (payroll.status !== 'calculated') {
                res.status(400).json({
                    error: `Cannot approve payroll in ${payroll.status} status`,
                });
                return;
            }

            // Update approval workflow
            const updateData: any = {};
            updateData[`approvalWorkflow.${approvingAs}`] = {
                approvedAt: new Date(),
                comment,
                approvedBy: userId,
            };

            // Check if all required approvals are done
            const hr = payroll.approvalWorkflow.hr;
            const finance = payroll.approvalWorkflow.finance;

            let newStatus = payroll.status;
            if (hr && finance && approvingAs === 'finance') {
                newStatus = 'approved';
            }

            const updated = await Payroll.findOneAndUpdate(
                { payrollRunId },
                {
                    ...updateData,
                    ...(newStatus === 'approved' && { status: 'approved', approvedAt: new Date() }),
                    updatedBy: userId,
                },
                { new: true }
            );

            res.json({
                success: true,
                message: `Payroll approved by ${approvingAs}`,
                data: updated,
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/payroll/:payrollRunId/payout
     * Trigger bulk payout
     * Initiates RazorpayX payouts for all employees
     */
    async triggerPayout(req: Request, res: Response): Promise<void> {
        try {
            const { payrollRunId } = req.params;
            const userId = (req as any).userId;

            const payroll = await Payroll.findOne({ payrollRunId });

            if (!payroll) {
                res.status(404).json({ error: 'Payroll not found' });
                return;
            }

            if (payroll.status !== 'approved') {
                res.status(400).json({
                    error: `Cannot payout payroll in ${payroll.status} status. Must be approved first.`,
                });
                return;
            }

            // Update status
            await Payroll.updateOne(
                { payrollRunId },
                {
                    status: 'in-process',
                    payoutStartedAt: new Date(),
                    updatedBy: userId,
                }
            );

            // Send notification
            await this.notificationService.notifyPayrollStarted(payrollRunId, payroll.totalEmployees);

            // Queue bulk payout job (in real implementation, use Bull Queue)
            // This would be processed asynchronously
            console.log(`🚀 Payout job queued for: ${payrollRunId}`);

            res.json({
                success: true,
                message: 'Payout processing started',
                data: {
                    payrollRunId,
                    status: 'in-process',
                    queuedAt: new Date(),
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/payroll/:payrollRunId/status
     * Get payout status for a payroll run
     */
    async getPayoutStatus(req: Request, res: Response): Promise<void> {
        try {
            const { payrollRunId } = req.params;

            const payroll = await Payroll.findOne({ payrollRunId });

            if (!payroll) {
                res.status(404).json({ error: 'Payroll not found' });
                return;
            }

            // Get transaction statistics
            const transactions = await PayoutTransaction.aggregate([
                { $match: { payrollId: payroll._id } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                    },
                },
            ]);

            res.json({
                success: true,
                data: {
                    payrollRunId,
                    status: payroll.status,
                    totalEmployees: payroll.totalEmployees,
                    statistics: transactions,
                    payoutStartedAt: payroll.payoutStartedAt,
                    completedAt: payroll.completedAt,
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/payroll/:payrollRunId/payslips
     * Get all payslips for a payroll run
     */
    async getPayslips(req: Request, res: Response): Promise<void> {
        try {
            const { payrollRunId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const skip = ((parseInt(page as string) || 1) - 1) * parseInt(limit as string);

            const payslips = await Payslip.find({ payrollId: payrollRunId })
                .populate('employeeId', 'firstName lastName email employeeId')
                .skip(skip)
                .limit(parseInt(limit as string))
                .sort({ createdAt: -1 });

            const total = await Payslip.countDocuments({ payrollId: payrollRunId });

            res.json({
                success: true,
                data: payslips,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    pages: Math.ceil(total / parseInt(limit as string)),
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/payroll/:payrollRunId/payslip/:employeeId
     * Download payslip as PDF
     */
    async downloadPayslip(req: Request, res: Response): Promise<void> {
        try {
            const { payrollRunId, employeeId } = req.params;

            const payslip = await Payslip.findOne({
                payrollId: payrollRunId,
                employeeId,
            }).populate('employeeId');

            if (!payslip) {
                res.status(404).json({ error: 'Payslip not found' });
                return;
            }

            // In production, check pdfUrl and stream file from storage (S3, etc.)
            // For now, return JSON representation
            res.json({
                success: true,
                data: payslip,
                message: 'Generate PDF from frontend or use PDF generation service',
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/payroll/reports/summary
     * Get payroll summary for reporting
     */
    async getPayrollSummary(req: Request, res: Response): Promise<void> {
        try {
            const { month, year, companyId } = req.query;

            if (!month || !year || !companyId) {
                res.status(400).json({ error: 'Missing required filters' });
                return;
            }

            const summary = await this.payrollEngine.getPayrollSummary(
                parseInt(month as string),
                parseInt(year as string),
                companyId as string
            );

            res.json({
                success: true,
                data: summary,
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/payroll/reports/tax
     * Generate tax report
     */
    async getTaxReport(req: Request, res: Response): Promise<void> {
        try {
            const { month, year, companyId } = req.query;

            const payslips = await Payslip.find({
                month: parseInt(month as string),
                year: parseInt(year as string),
            })
                .populate('employeeId')
                .lean();

            const taxReport = payslips.map((slip: any) => ({
                employeeId: slip.employeeId.employeeId,
                employeeName: `${slip.employeeId.firstName} ${slip.employeeId.lastName}`,
                grossSalary: slip.grossSalary,
                tax: slip.deductions.tax,
                professionalTax: slip.deductions.professionalTax,
                totalTax: slip.deductions.tax + slip.deductions.professionalTax,
                pf: slip.deductions.pf,
            }));

            const totalTax = taxReport.reduce((sum: number, row: any) => sum + row.totalTax, 0);
            const totalPF = taxReport.reduce((sum: number, row: any) => sum + row.pf, 0);

            res.json({
                success: true,
                data: {
                    period: `${month}/${year}`,
                    employeeCount: taxReport.length,
                    taxDetails: taxReport,
                    summary: {
                        totalTax,
                        totalPF,
                        averageTax: taxReport.length > 0 ? totalTax / taxReport.length : 0,
                    },
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default PayrollController;
