import { Router, Request, Response } from 'express';
import { authenticate, authorize, asyncHandler } from '../middleware/auth';
import PayrollController from '../controllers/payrollController';
import BankAccountController from '../controllers/bankAccountController';
import authRoutes from './auth';

const router = Router();
const payrollController = new PayrollController();
const bankAccountController = new BankAccountController();

/**
 * ============================================
 * AUTHENTICATION ROUTES
 * ============================================
 */
router.use('/auth', authRoutes);

/**
 * ============================================
 * PAYROLL MANAGEMENT ROUTES
 * ============================================
 */

/**
 * POST /api/payroll/run
 * Run payroll calculation for a month
 * Required roles: HR, Admin
 */
router.post('/payroll/run', authenticate, authorize('hr', 'admin'), asyncHandler(
    (req: Request, res: Response) => payrollController.runPayroll(req, res)
));

/**
 * GET /api/payroll/:payrollRunId
 * Get payroll details
 * Required roles: HR, Finance, Admin
 */
router.get('/payroll/:payrollRunId', authenticate, authorize('hr', 'finance', 'admin'), asyncHandler(
    (req: Request, res: Response) => payrollController.getPayrollDetails(req, res)
));

/**
 * POST /api/payroll/:payrollRunId/approve
 * Approve payroll (HR or Finance)
 * Required roles: HR, Finance, Admin
 */
router.post('/payroll/:payrollRunId/approve', authenticate, authorize('hr', 'finance', 'admin'), asyncHandler(
    (req: Request, res: Response) => payrollController.approvePayroll(req, res)
));

/**
 * POST /api/payroll/:payrollRunId/payout
 * Trigger bulk payout via RazorpayX
 * Required roles: Finance, Admin
 */
router.post('/payroll/:payrollRunId/payout', authenticate, authorize('finance', 'admin'), asyncHandler(
    (req: Request, res: Response) => payrollController.triggerPayout(req, res)
));

/**
 * GET /api/payroll/:payrollRunId/status
 * Get real-time payout status
 * Required roles: All authenticated users
 */
router.get('/payroll/:payrollRunId/status', authenticate, asyncHandler(
    (req: Request, res: Response) => payrollController.getPayoutStatus(req, res)
));

/**
 * GET /api/payroll/:payrollRunId/payslips
 * Get all payslips for a payroll run
 * Required roles: HR, Admin
 */
router.get('/payroll/:payrollRunId/payslips', authenticate, authorize('hr', 'admin'), asyncHandler(
    (req: Request, res: Response) => payrollController.getPayslips(req, res)
));

/**
 * GET /api/payroll/:payrollRunId/payslip/:employeeId
 * Download payslip as PDF
 * Required roles: Employee (own), HR, Admin
 */
router.get('/payroll/:payrollRunId/payslip/:employeeId', authenticate, asyncHandler(
    (req: Request, res: Response) => payrollController.downloadPayslip(req, res)
));

/**
 * ============================================
 * BANK ACCOUNT MANAGEMENT ROUTES
 * ============================================
 */

/**
 * POST /api/employees/:employeeId/bank
 * Add or update employee bank account (encrypted)
 * Required roles: Employee (own), HR, Admin
 */
router.post('/employees/:employeeId/bank', authenticate, asyncHandler(
    (req: Request, res: Response) => bankAccountController.addBankAccount(req, res)
));

/**
 * GET /api/employees/:employeeId/bank
 * Get employee bank account (decrypted in-memory)
 * Required roles: Employee (own), HR, Admin
 */
router.get('/employees/:employeeId/bank', authenticate, asyncHandler(
    (req: Request, res: Response) => bankAccountController.getBankAccount(req, res)
));

/**
 * POST /api/employees/:employeeId/bank/verify
 * Verify bank account with RazorpayX
 * Creates Contact and Fund Account
 * Required roles: HR, Admin
 */
router.post('/employees/:employeeId/bank/verify', authenticate, authorize('hr', 'admin'), asyncHandler(
    (req: Request, res: Response) => bankAccountController.verifyBankAccount(req, res)
));

/**
 * DELETE /api/employees/:employeeId/bank
 * Remove bank account
 * Required roles: HR, Admin
 */
router.delete('/employees/:employeeId/bank', authenticate, authorize('hr', 'admin'), asyncHandler(
    (req: Request, res: Response) => bankAccountController.deleteBankAccount(req, res)
));

/**
 * ============================================
 * REPORTING ROUTES
 * ============================================
 */

/**
 * GET /api/reports/payroll
 * Get payroll summary report
 * Required roles: HR, Finance, Admin
 */
router.get('/reports/payroll', authenticate, authorize('hr', 'finance', 'admin'), asyncHandler(
    (req: Request, res: Response) => payrollController.getPayrollSummary(req, res)
));

/**
 * GET /api/reports/tax
 * Get tax calculation report
 * Required roles: Finance, Admin
 */
router.get('/reports/tax', authenticate, authorize('finance', 'admin'), asyncHandler(
    (req: Request, res: Response) => payrollController.getTaxReport(req, res)
));

/**
 * Health check
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
    });
});

export default router;
