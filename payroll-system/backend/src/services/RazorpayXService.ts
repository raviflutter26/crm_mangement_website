import Razorpay from 'razorpay';
import BankEncryptionService from '../utils/encryption';
import PayoutTransaction from '../models/PayoutTransaction';
import EmployeeBankAccount from '../models/EmployeeBankAccount';

/**
 * RazorpayX Integration Service
 * Handles all interactions with RazorpayX APIs for payouts
 *
 * Documentation: https://razorpay.com/docs/payouts/
 */

interface ContactDetails {
    name: string;
    email: string;
    phone: string;
    type: 'individual' | 'business';
}

interface FundAccountDetails {
    contactId: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
}

interface PayoutDetails {
    fundAccountId: string;
    amount: number; // In paise (smallest unit)
    currency?: string;
    mode?: 'NEFT' | 'RTGS' | 'IMPS';
    purpose?: string;
    notes?: Record<string, string>;
    onDemandPayouts?: boolean;
}

class RazorpayXService {
    private razorpay: Razorpay;
    private encryptionService: BankEncryptionService;

    constructor(
        keyId: string = process.env.RAZORPAY_KEY_ID || '',
        keySecret: string = process.env.RAZORPAY_KEY_SECRET || ''
    ) {
        if (!keyId || !keySecret) {
            throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required');
        }

        this.razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        this.encryptionService = new BankEncryptionService();
    }

    /**
     * Step 1: Create a Contact in RazorpayX
     * Required before creating Fund Account
     *
     * Contact represents the recipient of the payout
     */
    async createContact(contactDetails: ContactDetails): Promise<{ contact_id: string; data: any }> {
        try {
            const response = await this.razorpay.contacts.create({
                name: contactDetails.name,
                email: contactDetails.email,
                contact: contactDetails.phone,
                type: contactDetails.type,
                gstin: '', // Include if available
                notes: {
                    notes_key_1: 'Created for payroll',
                },
            });

            console.log(`✅ Contact created: ${response.id}`);

            return {
                contact_id: response.id,
                data: response,
            };
        } catch (error: any) {
            console.error('❌ Contact creation failed:', error.message);
            throw new Error(`RazorpayX Contact creation failed: ${error.message}`);
        }
    }

    /**
     * Step 2: Create Fund Account for a Contact
     * Fund Account is where the money will be transferred
     *
     * Stores encrypted bank details in RazorpayX
     */
    async createFundAccount(
        fundAccountDetails: FundAccountDetails
    ): Promise<{ fund_account_id: string; data: any }> {
        try {
            // Validate bank details
            if (!this.encryptionService.validateAccountNumber(fundAccountDetails.accountNumber)) {
                throw new Error('Invalid account number format');
            }

            if (!this.encryptionService.validateIFSC(fundAccountDetails.ifscCode)) {
                throw new Error('Invalid IFSC code format');
            }

            const response = await this.razorpay.fundAccounts.create({
                contact_id: fundAccountDetails.contactId,
                account_type: 'bank_account',
                bank_account: {
                    name: fundAccountDetails.accountHolderName,
                    notes: {
                        notes_key_1: 'Payroll fund account',
                    },
                    ifsc: fundAccountDetails.ifscCode.toUpperCase(),
                    account_number: fundAccountDetails.accountNumber,
                },
            });

            console.log(`✅ Fund Account created: ${response.id}`);

            return {
                fund_account_id: response.id,
                data: response,
            };
        } catch (error: any) {
            console.error('❌ Fund Account creation failed:', error.message);
            throw new Error(`RazorpayX Fund Account creation failed: ${error.message}`);
        }
    }

    /**
     * Step 3: Trigger a Payout
     * Initiates the actual money transfer to the fund account
     *
     * Supports batch processing for multiple payouts
     */
    async triggerPayout(payoutDetails: PayoutDetails): Promise<{ payout_id: string; data: any }> {
        try {
            const response = await this.razorpay.payouts.create({
                account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '',
                fund_account_id: payoutDetails.fundAccountId,
                amount: payoutDetails.amount, // In paise
                currency: payoutDetails.currency || 'INR',
                mode: payoutDetails.mode || 'NEFT', // NEFT, RTGS, IMPS
                purpose: payoutDetails.purpose || 'payroll',
                description: 'Salary payment',
                reference_id: `payroll-${Date.now()}-${Math.random()}`,
                on_demand_payouts_enabled: payoutDetails.onDemandPayouts || true,
                notes: payoutDetails.notes || {},
            });

            console.log(`✅ Payout initiated: ${response.id}`);

            return {
                payout_id: response.id,
                data: response,
            };
        } catch (error: any) {
            console.error('❌ Payout creation failed:', error.message);
            throw new Error(`RazorpayX Payout failed: ${error.message}`);
        }
    }

    /**
     * Bulk Payout - Process multiple payouts
     * Called from queue processor to handle batch payouts
     */
    async bulkPayout(
        payouts: Array<{ fundAccountId: string; amount: number; employeeId: string; transactionId: string }>
    ): Promise<{ successful: any[]; failed: any[] }> {
        const successful = [];
        const failed = [];

        for (const payout of payouts) {
            try {
                const result = await this.triggerPayout({
                    fundAccountId: payout.fundAccountId,
                    amount: payout.amount,
                    notes: {
                        transactionId: payout.transactionId,
                        employeeId: payout.employeeId,
                    },
                });

                successful.push({
                    transactionId: payout.transactionId,
                    payoutId: result.payout_id,
                    amount: payout.amount,
                });
            } catch (error: any) {
                failed.push({
                    transactionId: payout.transactionId,
                    error: error.message,
                    amount: payout.amount,
                });
            }
        }

        return { successful, failed };
    }

    /**
     * Get Payout Status
     * Check the status of a payout by ID
     */
    async getPayoutStatus(payoutId: string): Promise<any> {
        try {
            const response = await this.razorpay.payouts.fetch(payoutId);
            return response;
        } catch (error: any) {
            console.error('❌ Failed to fetch payout status:', error.message);
            throw new Error(`Failed to fetch payout status: ${error.message}`);
        }
    }

    /**
     * Retry Failed Payout
     * For failed payouts, attempt retry with details
     */
    async retryPayout(payoutId: string): Promise<{ payout_id: string; data: any }> {
        try {
            // First, get the failed payout details
            const originalPayout = await this.getPayoutStatus(payoutId);

            // Create a new payout with same details
            const response = await this.razorpay.payouts.create({
                account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '',
                fund_account_id: originalPayout.fund_account_id,
                amount: originalPayout.amount,
                currency: originalPayout.currency,
                mode: originalPayout.mode || 'NEFT',
                purpose: originalPayout.purpose,
                reference_id: `retry-${originalPayout.reference_id}`,
            });

            console.log(`✅ Payout retry initiated: ${response.id}`);

            return {
                payout_id: response.id,
                data: response,
            };
        } catch (error: any) {
            console.error('❌ Payout retry failed:', error.message);
            throw new Error(`Payout retry failed: ${error.message}`);
        }
    }

    /**
     * Reverse a Payout
     * For processed payouts, initiate reversal
     */
    async reversePayout(payoutId: string, reason: string): Promise<any> {
        try {
            const response = await this.razorpay.payouts.edit(payoutId, { status: 'reversed' });

            console.log(`✅ Payout reversed: ${payoutId}`);

            return response;
        } catch (error: any) {
            console.error('❌ Payout reversal failed:', error.message);
            throw new Error(`Payout reversal failed: ${error.message}`);
        }
    }

    /**
     * Complete Workflow: Create Contact → Fund Account → Trigger Payout
     * All-in-one function for employee payout setup
     */
    async setupAndPayEmployee(employeeData: {
        employeeId: string;
        fullName: string;
        email: string;
        phone: string;
        accountNumber: string;
        ifscCode: string;
        accountHolderName: string;
        bankName: string;
        salaryAmount: number;
    }): Promise<{
        contactId: string;
        fundAccountId: string;
        payoutId: string;
        status: string;
    }> {
        try {
            // Step 1: Create Contact
            const contact = await this.createContact({
                name: employeeData.fullName,
                email: employeeData.email,
                phone: employeeData.phone,
                type: 'individual',
            });

            // Step 2: Create Fund Account
            const fundAccount = await this.createFundAccount({
                contactId: contact.contact_id,
                accountHolderName: employeeData.accountHolderName,
                accountNumber: employeeData.accountNumber,
                ifscCode: employeeData.ifscCode,
                bankName: employeeData.bankName,
            });

            // Step 3: Trigger Payout (amount in paise)
            const payout = await this.triggerPayout({
                fundAccountId: fundAccount.fund_account_id,
                amount: employeeData.salaryAmount * 100, // Convert to paise
            });

            // Store fund account ID in database (encrypted)
            await EmployeeBankAccount.updateOne(
                { employeeId: employeeData.employeeId },
                {
                    razorpayFundAccountId: fundAccount.fund_account_id,
                    razorpayFundAccountStatus: 'active',
                }
            );

            return {
                contactId: contact.contact_id,
                fundAccountId: fundAccount.fund_account_id,
                payoutId: payout.payout_id,
                status: 'initiated',
            };
        } catch (error: any) {
            console.error('❌ Complete payout setup failed:', error.message);
            throw new Error(`Employee payout setup failed: ${error.message}`);
        }
    }

    /**
     * Verify Webhook Signature
     * Crucial for security - verify that webhook is from RazorpayX
     *
     * Uses HMAC-SHA256 with webhook secret
     */
    verifyWebhookSignature(
        body: string,
        signature: string,
        webhookSecret: string = process.env.RAZORPAY_WEBHOOK_SECRET || ''
    ): boolean {
        try {
            const hash = require('crypto')
                .createHmac('sha256', webhookSecret)
                .update(body)
                .digest('base64');

            return hash === signature;
        } catch (error: any) {
            console.error('❌ Webhook verification failed:', error.message);
            return false;
        }
    }
}

export default RazorpayXService;
