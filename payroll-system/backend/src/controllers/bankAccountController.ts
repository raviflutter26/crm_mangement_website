import { Request, Response } from 'express';
import Employee from '../models/Employee';
import EmployeeBankAccount from '../models/EmployeeBankAccount';
import BankEncryptionService from '../utils/encryption';
import RazorpayXService from '../services/RazorpayXService';
import AuditLog from '../models/AuditLog';

/**
 * Employee Bank Account Controller
 * Handles secure storage and management of employee bank details
 */

class BankAccountController {
    private encryptionService: BankEncryptionService;
    private razorpayXService: RazorpayXService;

    constructor() {
        this.encryptionService = new BankEncryptionService();
        this.razorpayXService = new RazorpayXService();
    }

    /**
     * POST /api/employees/:employeeId/bank
     * Add or update employee bank account
     * Bank details are encrypted before storage
     */
    async addBankAccount(req: Request, res: Response): Promise<void> {
        try {
            const { employeeId } = req.params;
            const { accountNumber, ifscCode, accountHolderName, bankName, accountType } = req.body;
            const userId = (req as any).userId;
            const userRole = (req as any).userRole;

            // Validate role (only HR and employees can add their own)
            if (userRole === 'employee' && userId !== employeeId) {
                res.status(403).json({ error: 'Employees can only update their own bank details' });
                return;
            }

            // Validate inputs
            if (!accountNumber || !ifscCode || !accountHolderName) {
                res.status(400).json({
                    error: 'Missing required fields: accountNumber, ifscCode, accountHolderName',
                });
                return;
            }

            // Validate format
            if (!this.encryptionService.validateAccountNumber(accountNumber)) {
                res.status(400).json({
                    error:
                        'Invalid account number format. Should be 9-18 digits.',
                });
                return;
            }

            if (!this.encryptionService.validateIFSC(ifscCode)) {
                res.status(400).json({
                    error: 'Invalid IFSC code format. Format: ABCD0123456',
                });
                return;
            }

            // Check if employee exists
            const employee = await Employee.findById(employeeId);
            if (!employee) {
                res.status(404).json({ error: 'Employee not found' });
                return;
            }

            // Encrypt bank details
            const encryptedAccountNumber = this.encryptionService.encrypt(accountNumber);
            const encryptedIFSC = this.encryptionService.encrypt(ifscCode);

            // Check if bank account already exists
            let bankAccount = await EmployeeBankAccount.findOne({ employeeId, isPrimary: true });

            if (bankAccount) {
                // Update existing
                bankAccount.accountNumber = (encryptedAccountNumber.encrypted as any);
                bankAccount.ifscCode = (encryptedIFSC.encrypted as any);
                bankAccount.accountHolderName = accountHolderName;
                bankAccount.bankName = bankName;
                bankAccount.accountType = accountType || 'savings';
                bankAccount.encryptionVersion = 1;
                bankAccount.updatedBy = userId;
                await bankAccount.save();
            } else {
                // Create new
                bankAccount = new EmployeeBankAccount({
                    employeeId,
                    accountNumber: (encryptedAccountNumber.encrypted as any),
                    ifscCode: (encryptedIFSC.encrypted as any),
                    accountHolderName,
                    bankName,
                    accountType: accountType || 'savings',
                    isPrimary: true,
                    encryptionVersion: 1,
                    createdBy: userId,
                });
                await bankAccount.save();

                // Update employee with bank account reference
                await Employee.updateOne({ _id: employeeId }, { bankAccountId: bankAccount._id });
            }

            // Log to audit
            await AuditLog.create({
                entityType: 'EmployeeBankAccount',
                entityId: bankAccount._id,
                action: 'update',
                performedBy: userId,
                status: 'success',
                changes: [
                    {
                        fieldName: 'bankDetails',
                        oldValue: 'encrypted',
                        newValue: 'encrypted-updated',
                    },
                ],
            });

            res.json({
                success: true,
                message: 'Bank account saved successfully',
                data: {
                    bankAccountId: bankAccount._id,
                    accountHolderName: bankAccount.accountHolderName,
                    bankName: bankAccount.bankName,
                    accountNumber: this.encryptionService.maskAccountNumber(accountNumber),
                    ifscCode: ifscCode.toUpperCase(),
                    accountType: bankAccount.accountType,
                },
            });
        } catch (error: any) {
            console.error('❌ Error adding bank account:', error.message);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/employees/:employeeId/bank
     * Get employee bank account (authenticated access only)
     * Decrypts bank details in-memory only
     */
    async getBankAccount(req: Request, res: Response): Promise<void> {
        try {
            const { employeeId } = req.params;
            const userId = (req as any).userId;
            const userRole = (req as any).userRole;

            // Validate permissions
            if (userRole === 'employee' && userId !== employeeId) {
                res.status(403).json({ error: 'You can only view your own bank details' });
                return;
            }

            const bankAccount = await EmployeeBankAccount.findOne({
                employeeId,
                isPrimary: true,
            }).select('+accountNumber +ifscCode');

            if (!bankAccount) {
                res.status(404).json({ error: 'Bank account not found' });
                return;
            }

            // Decrypt in-memory only (never stored decrypted)
            const decryptedAccountNumber = this.encryptionService.decrypt({
                encrypted: bankAccount.accountNumber as string,
                iv: '', // These would be stored properly
                authTag: '',
                version: bankAccount.encryptionVersion,
            });

            const decryptedIFSC = this.encryptionService.decrypt({
                encrypted: bankAccount.ifscCode as string,
                iv: '',
                authTag: '',
                version: bankAccount.encryptionVersion,
            });

            // Log decryption access to audit
            await AuditLog.create({
                entityType: 'EmployeeBankAccount',
                entityId: bankAccount._id,
                action: 'decrypt',
                performedBy: userId,
                status: 'success',
                metadata: {
                    reason: 'bank_detail_view',
                },
            });

            res.json({
                success: true,
                data: {
                    bankAccountId: bankAccount._id,
                    accountHolderName: bankAccount.accountHolderName,
                    accountNumber: decryptedAccountNumber,
                    accountNumberMasked: this.encryptionService.maskAccountNumber(decryptedAccountNumber),
                    ifscCode: decryptedIFSC,
                    bankName: bankAccount.bankName,
                    accountType: bankAccount.accountType,
                    isVerified: bankAccount.isVerified,
                    razorpayFundAccountStatus: bankAccount.razorpayFundAccountStatus,
                },
            });
        } catch (error: any) {
            console.error('❌ Error retrieving bank account:', error.message);
            res.status(500).json({ error: 'Failed to retrieve bank details' });
        }
    }

    /**
     * POST /api/employees/:employeeId/bank/verify
     * Verify bank account with RazorpayX
     * Creates Contact and Fund Account in RazorpayX
     */
    async verifyBankAccount(req: Request, res: Response): Promise<void> {
        try {
            const { employeeId } = req.params;
            const userId = (req as any).userId;

            // Get employee
            const employee = await Employee.findById(employeeId);
            if (!employee) {
                res.status(404).json({ error: 'Employee not found' });
                return;
            }

            // Get bank account
            const bankAccount = await EmployeeBankAccount.findOne({
                employeeId,
                isPrimary: true,
            }).select('+accountNumber +ifscCode');

            if (!bankAccount) {
                res.status(404).json({ error: 'Bank account not found' });
                return;
            }

            // Check if already verified
            if (bankAccount.razorpayFundAccountStatus === 'active') {
                res.json({
                    success: true,
                    message: 'Bank account already verified',
                    data: {
                        fundAccountId: bankAccount.razorpayFundAccountId,
                        status: 'active',
                    },
                });
                return;
            }

            // Decrypt bank details
            const decryptedAccountNumber = this.encryptionService.decrypt({
                encrypted: bankAccount.accountNumber as string,
                iv: '',
                authTag: '',
                version: bankAccount.encryptionVersion,
            });

            const decryptedIFSC = this.encryptionService.decrypt({
                encrypted: bankAccount.ifscCode as string,
                iv: '',
                authTag: '',
                version: bankAccount.encryptionVersion,
            });

            // Setup with RazorpayX (creates Contact and Fund Account)
            const setupResult = await this.razorpayXService.setupAndPayEmployee({
                employeeId: employee.employeeId,
                fullName: `${employee.firstName} ${employee.lastName}`,
                email: employee.email,
                phone: employee.phone,
                accountNumber: decryptedAccountNumber,
                ifscCode: decryptedIFSC,
                accountHolderName: bankAccount.accountHolderName,
                bankName: bankAccount.bankName,
                salaryAmount: 0, // We don't payout here, just verify
            });

            // Update bank account with RazorpayX details
            await EmployeeBankAccount.updateOne(
                { _id: bankAccount._id },
                {
                    razorpayFundAccountId: setupResult.fundAccountId,
                    razorpayFundAccountStatus: 'active',
                    isVerified: true,
                    verificationMethod: 'auto',
                    verificationDate: new Date(),
                    updatedBy: userId,
                }
            );

            // Update employee with Razorpay contact
            await Employee.updateOne(
                { _id: employeeId },
                { razorpayContactId: setupResult.contactId, razorpayFundAccountId: setupResult.fundAccountId }
            );

            res.json({
                success: true,
                message: 'Bank account verified successfully',
                data: {
                    fundAccountId: setupResult.fundAccountId,
                    status: 'active',
                    verifiedAt: new Date(),
                },
            });
        } catch (error: any) {
            console.error('❌ Bank account verification failed:', error.message);
            res.status(500).json({
                error: error.message || 'Verification failed',
            });
        }
    }

    /**
     * DELETE /api/employees/:employeeId/bank
     * Remove bank account (soft delete)
     */
    async deleteBankAccount(req: Request, res: Response): Promise<void> {
        try {
            const { employeeId } = req.params;
            const userId = (req as any).userId;

            // Security: Only HR can delete
            const userRole = (req as any).userRole;
            if (!['hr', 'admin'].includes(userRole)) {
                res.status(403).json({ error: 'Only HR can delete bank details' });
                return;
            }

            const bankAccount = await EmployeeBankAccount.findOneAndUpdate(
                { employeeId, isPrimary: true },
                { isPrimary: false },
                { new: true }
            );

            if (!bankAccount) {
                res.status(404).json({ error: 'Bank account not found' });
                return;
            }

            res.json({
                success: true,
                message: 'Bank account removed',
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default BankAccountController;
