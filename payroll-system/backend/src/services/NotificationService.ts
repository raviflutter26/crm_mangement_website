import nodemailer from 'nodemailer';
import PayoutTransaction from '../models/PayoutTransaction';
import Employee from '../models/Employee';

/**
 * Notification Service
 * Handles email and SMS notifications for payroll events
 */

class NotificationService {
    private emailTransporter: any;

    constructor() {
        // Configure email transporter
        // For production: Use SendGrid, AWS SES, or Mailgun
        this.emailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    /**
     * Notify employee about successful payout
     */
    async notifyPayoutSuccess(transaction: any): Promise<void> {
        try {
            // Fetch employee details
            const employee = await Employee.findById(transaction.employeeId);

            if (!employee) {
                console.warn(`⚠️ Employee not found: ${transaction.employeeId}`);
                return;
            }

            const subject = '✅ Salary Credited to Your Account';
            const htmlContent = `
        <h2>Salary Credited Successfully</h2>
        <p>Dear ${employee.firstName},</p>
        <p>Your salary for this month has been successfully credited to your bank account.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount:</strong> ₹${(transaction.amount / 100).toLocaleString('en-IN')}</p>
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
        
        <p>Please log in to your HR portal to download your payslip.</p>
        <p>If you have any queries, please contact HR.</p>
        
        <p>Best regards,<br/>HR Team</p>
      `;

            await this.sendEmail(employee.email, subject, htmlContent);

            // Send SMS notification (using SMS gateway)
            await this.sendSMS(employee.phone, `Salary of ₹${transaction.amount / 100} credited. Ref: ${transaction.transactionId}`);

            console.log(`📧 Notification sent to ${employee.email}`);
        } catch (error: any) {
            console.error('❌ Error sending payout success notification:', error.message);
        }
    }

    /**
     * Notify employee about failed payout
     */
    async notifyPayoutFailure(transaction: any): Promise<void> {
        try {
            const employee = await Employee.findById(transaction.employeeId);

            if (!employee) {
                return;
            }

            const subject = '⚠️ Salary Payment Failed - Action Required';
            const htmlContent = `
        <h2 style="color: #d9534f;">Salary Payment Failed</h2>
        <p>Dear ${employee.firstName},</p>
        <p>We encountered an error while processing your salary payment.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; color: #d9534f;">
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Reason:</strong> ${transaction.failureReason || 'Technical issue'}</p>
          <p><strong>Amount:</strong> ₹${(transaction.amount / 100).toLocaleString('en-IN')}</p>
        </div>
        
        <p>Our HR team is working to resolve this issue and will contact you shortly.</p>
        <p>Please verify your bank account details are correct:</p>
        <ul>
          <li>Account Holder Name</li>
          <li>Account Number (masked for security)</li>
          <li>IFSC Code</li>
        </ul>
        
        <p>Contact HR if the information needs to be updated.</p>
        <p>Best regards,<br/>HR Team</p>
      `;

            await this.sendEmail(employee.email, subject, htmlContent);
            await this.sendSMS(
                employee.phone,
                `⚠️ Your salary payment failed. Ref: ${transaction.transactionId}. Contact HR.`
            );

            // Also notify HR
            await this.notifyHRPayoutFailure(transaction, employee);

            console.log(`📧 Failure notification sent to ${employee.email}`);
        } catch (error: any) {
            console.error('❌ Error sending payout failure notification:', error.message);
        }
    }

    /**
     * Notify employee about payout reversal
     */
    async notifyPayoutReversed(transaction: any): Promise<void> {
        try {
            const employee = await Employee.findById(transaction.employeeId);

            if (!employee) {
                return;
            }

            const subject = '⚠️ Salary Payment Reversed';
            const htmlContent = `
        <h2 style="color: #f0ad4e;">Salary Payment Reversed</h2>
        <p>Dear ${employee.firstName},</p>
        <p>The salary payment made to your account has been reversed.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount Reversed:</strong> ₹${(transaction.amount / 100).toLocaleString('en-IN')}</p>
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Reason:</strong> ${transaction.reverseReason || 'As per company policy'}</p>
        </div>
        
        <p>Please contact HR for clarification on this reversal.</p>
        <p>Best regards,<br/>HR Team</p>
      `;

            await this.sendEmail(employee.email, subject, htmlContent);
            console.log(`📧 Reversal notification sent to ${employee.email}`);
        } catch (error: any) {
            console.error('❌ Error sending reversal notification:', error.message);
        }
    }

    /**
     * Notify HR about failed payouts
     */
    private async notifyHRPayoutFailure(transaction: any, employee: any): Promise<void> {
        try {
            const hrEmail = process.env.HR_EMAIL || 'hr@company.com';
            const subject = `⚠️ Salary Payment Failed - ${employee.firstName} ${employee.lastName}`;
            const htmlContent = `
        <h2>Salary Payment Failure Alert</h2>
        <p>A salary payment for the following employee has failed:</p>
        
        <table style="border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Employee</td>
            <td style="padding: 10px;">${employee.firstName} ${employee.lastName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Employee ID</td>
            <td style="padding: 10px;">${employee.employeeId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Amount</td>
            <td style="padding: 10px;">₹${(transaction.amount / 100).toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Failure Reason</td>
            <td style="padding: 10px;">${transaction.failureReason}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Transaction ID</td>
            <td style="padding: 10px;">${transaction.transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Retry Count</td>
            <td style="padding: 10px;">${transaction.retryCount}/${transaction.maxRetries}</td>
          </tr>
        </table>
        
        <p>Please take action to resolve this issue.</p>
      `;

            await this.sendEmail(hrEmail, subject, htmlContent);
        } catch (error: any) {
            console.error('❌ Error notifying HR:', error.message);
        }
    }

    /**
     * Send email
     */
    private async sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
        try {
            await this.emailTransporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@company.com',
                to,
                subject,
                html: htmlContent,
            });
        } catch (error: any) {
            console.error('❌ Error sending email:', error.message);
            throw error;
        }
    }

    /**
     * Send SMS (integrate with Twilio, AWS SNS, etc.)
     */
    private async sendSMS(phone: string, message: string): Promise<void> {
        try {
            // Implementation depends on SMS provider
            // Example with Twilio:
            // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            // await client.messages.create({
            //   body: message,
            //   from: process.env.TWILIO_PHONE_NUMBER,
            //   to: phone,
            // });

            console.log(`📱 SMS sent to ${phone}: ${message.substring(0, 50)}...`);
        } catch (error: any) {
            console.error('❌ Error sending SMS:', error.message);
        }
    }

    /**
     * Send bulk payroll started notification to all HR users
     */
    async notifyPayrollStarted(payrollRunId: string, totalEmployees: number): Promise<void> {
        try {
            const subject = `🚀 Payroll Processing Started - ${payrollRunId}`;
            const htmlContent = `
        <h2>Payroll Processing Started</h2>
        <p>Payroll processing has started.</p>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Payroll Run ID:</strong> ${payrollRunId}</p>
          <p><strong>Total Employees:</strong> ${totalEmployees}</p>
          <p><strong>Started At:</strong> ${new Date().toLocaleString('en-IN')}</p>
        </div>
        
        <p>Please monitor the progress in the HR dashboard.</p>
      `;

            const hrEmail = process.env.HR_EMAIL || 'hr@company.com';
            await this.sendEmail(hrEmail, subject, htmlContent);

            console.log(`📧 Payroll started notification sent`);
        } catch (error: any) {
            console.error('❌ Error sending payroll started notification:', error.message);
        }
    }

    /**
     * Send bulk payroll completed notification
     */
    async notifyPayrollCompleted(
        payrollRunId: string,
        totalEmployees: number,
        successCount: number,
        failedCount: number
    ): Promise<void> {
        try {
            const subject = `✅ Payroll Processing Completed - ${payrollRunId}`;
            const htmlContent = `
        <h2>Payroll Processing Completed</h2>
        <p>Payroll processing has been completed.</p>
        
        <table style="border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Payroll Run ID</td>
            <td style="padding: 10px;">${payrollRunId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; font-weight: bold;">Total Employees</td>
            <td style="padding: 10px;">${totalEmployees}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd; background: #d4edda;">
            <td style="padding: 10px; font-weight: bold;">✅ Successful</td>
            <td style="padding: 10px;">${successCount}</td>
          </tr>
          <tr style="background: #f8d7da;">
            <td style="padding: 10px; font-weight: bold;">❌ Failed</td>
            <td style="padding: 10px;">${failedCount}</td>
          </tr>
        </table>
        
        <p>Success Rate: ${((successCount / totalEmployees) * 100).toFixed(2)}%</p>
        <p>Check the HR dashboard for detailed reports.</p>
      `;

            const hrEmail = process.env.HR_EMAIL || 'hr@company.com';
            await this.sendEmail(hrEmail, subject, htmlContent);

            console.log(`📧 Payroll completed notification sent`);
        } catch (error: any) {
            console.error('❌ Error sending payroll completed notification:', error.message);
        }
    }
}

export default NotificationService;
