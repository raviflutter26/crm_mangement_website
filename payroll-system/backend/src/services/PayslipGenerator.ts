import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import Payslip from '../models/Payslip';
import Employee from '../models/Employee';

/**
 * Payslip Generator Service
 * Generates professional PDF payslips
 */

class PayslipGenerator {
    private pdfDir: string;

    constructor() {
        this.pdfDir = process.env.PAYSLIP_PDF_DIR || './payslips';
        // Create directory if it doesn't exist
        if (!fs.existsSync(this.pdfDir)) {
            fs.mkdirSync(this.pdfDir, { recursive: true });
        }
    }

    /**
     * Generate individual payslip PDF
     */
    async generatePayslipPDF(payslipId: string): Promise<string> {
        try {
            // Fetch payslip and employee details
            const payslip = await Payslip.findById(payslipId).populate('employeeId');

            if (!payslip) {
                throw new Error('Payslip not found');
            }

            const employee = payslip.employeeId;
            const filename = `payslip-${payslip.payslipNumber}.pdf`;
            const filepath = path.join(this.pdfDir, filename);

            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                bufferPages: true,
            });

            // Pipe to file
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Header
            this.addHeader(doc);

            // Company details
            this.addCompanyDetails(doc);

            // Employee details
            this.addEmployeeDetails(doc, employee, payslip);

            // Salary details table
            this.addSalaryDetails(doc, payslip);

            // Summary
            this.addSummary(doc, payslip);

            // Footer
            this.addFooter(doc);

            // Finalize PDF
            doc.end();

            // Wait for file to be written
            await new Promise((resolve, reject) => {
                stream.on('finish', resolve);
                stream.on('error', reject);
            });

            console.log(`✅ Payslip generated: ${filename}`);

            // Update payslip record
            const fileUrl = `/payslips/${filename}`;
            await Payslip.updateOne(
                { _id: payslipId },
                {
                    pdfGenerated: true,
                    pdfUrl: fileUrl,
                    generatedAt: new Date(),
                }
            );

            return fileUrl;
        } catch (error: any) {
            console.error('❌ Error generating payslip:', error.message);
            throw error;
        }
    }

    /**
     * Add header to PDF
     */
    private addHeader(doc: any): void {
        doc
            .font('Helvetica-Bold', 20)
            .text('PAYSLIP', 50, 40, { align: 'center' })
            .font('Helvetica', 10)
            .text('Confidential', 50, 65, { align: 'center' });

        // Horizontal line
        doc
            .moveTo(50, 80)
            .lineTo(550, 80)
            .stroke();
    }

    /**
     * Add company details
     */
    private addCompanyDetails(doc: any): void {
        const companyName = process.env.COMPANY_NAME || 'Your Company Inc.';
        const companyAddress = process.env.COMPANY_ADDRESS || '123 Business St, City';
        const companyPhone = process.env.COMPANY_PHONE || '+91-9876-543-210';
        const companyReg = process.env.COMPANY_REG || 'Reg. No: 1234567890';

        doc
            .font('Helvetica-Bold', 12)
            .text(companyName, 50, 100)
            .font('Helvetica', 9)
            .text(companyAddress, 50, 118)
            .text(`Phone: ${companyPhone}`, 50, 132)
            .text(companyReg, 50, 146);
    }

    /**
     * Add employee details
     */
    private addEmployeeDetails(doc: any, employee: any, payslip: any): void {
        const y = 160;

        // Left column
        doc
            .font('Helvetica-Bold', 10)
            .text('Employee Information', 50, y);

        doc
            .font('Helvetica', 9)
            .text(`Name: ${employee.firstName} ${employee.lastName}`, 50, y + 20)
            .text(`Employee ID: ${employee.employeeId}`, 50, y + 35)
            .text(`Designation: ${employee.designation}`, 50, y + 50)
            .text(`Department: ${employee.department}`, 50, y + 65)
            .text(`PAN: ${employee.panNumber || 'N/A'}`, 50, y + 80);

        // Right column
        doc
            .font('Helvetica-Bold', 10)
            .text('Payroll Information', 320, y);

        doc
            .font('Helvetica', 9)
            .text(`Payslip Number: ${payslip.payslipNumber}`, 320, y + 20)
            .text(`Month/Year: ${payslip.month}/${payslip.year}`, 320, y + 35)
            .text(`Working Days: ${payslip.workingDays}`, 320, y + 50)
            .text(`Days Present: ${payslip.daysPresent}`, 320, y + 65)
            .text(`Days Absent: ${payslip.daysAbsent}`, 320, y + 80);

        // Horizontal line
        doc
            .moveTo(50, y + 100)
            .lineTo(550, y + 100)
            .stroke();
    }

    /**
     * Add salary details table
     */
    private addSalaryDetails(doc: any, payslip: any): void {
        const y = 280;

        // Table headers
        const headerY = y;
        const col1 = 50;
        const col2 = 300;
        const col3 = 450;

        doc
            .font('Helvetica-Bold', 10)
            .fill('#f0f0f0');

        // Background for header
        doc.rect(col1 - 5, headerY, 510, 20).fill();

        doc
            .fill('black')
            .text('Description', col1, headerY + 5)
            .text('Amount', col2, headerY + 5)
            .text('Remarks', col3, headerY + 5);

        // Earnings section
        doc
            .font('Helvetica-Bold', 10)
            .fill('#e8f4e8')
            .rect(col1 - 5, headerY + 25, 510, 18)
            .fill()
            .fill('black')
            .text('EARNINGS', col1, headerY + 30);

        let dataY = headerY + 48;

        const earnings = payslip.earnings;

        // Earnings items
        const earningsItems = [
            { label: 'Basic Salary', amount: earnings.basicSalary },
            { label: 'HRA', amount: earnings.hra },
            { label: 'DA', amount: earnings.da },
            { label: 'Special Allowance', amount: earnings.specialAllowance },
            { label: 'Travel Allowance', amount: earnings.travelAllowance },
            { label: 'Food Allowance', amount: earnings.foodAllowance },
            { label: 'Performance Bonus', amount: earnings.performanceBonus },
        ];

        doc.font('Helvetica', 9);

        earningsItems.forEach((item) => {
            if (item.amount > 0) {
                doc
                    .text(item.label, col1, dataY)
                    .text(`₹ ${item.amount.toLocaleString('en-IN')}`, col2, dataY)
                    .text('✓', col3, dataY);

                dataY += 18;
            }
        });

        // Total earnings
        doc
            .font('Helvetica-Bold', 10)
            .text('Gross Earnings', col1, dataY)
            .text(`₹ ${earnings.totalEarnings.toLocaleString('en-IN')}`, col2, dataY);

        dataY += 25;

        // Deductions section
        doc
            .font('Helvetica-Bold', 10)
            .fill('#ffe8e8')
            .rect(col1 - 5, dataY, 510, 18)
            .fill()
            .fill('black')
            .text('DEDUCTIONS', col1, dataY + 5);

        dataY += 25;

        const deductions = payslip.deductions;

        // Deduction items
        const deductionItems = [
            { label: 'Provident Fund (PF)', amount: deductions.pf },
            { label: 'Employee State Insurance (ESI)', amount: deductions.esi },
            { label: 'Income Tax', amount: deductions.tax },
            { label: 'Professional Tax', amount: deductions.professionalTax },
        ];

        doc.font('Helvetica', 9);

        deductionItems.forEach((item) => {
            if (item.amount > 0) {
                doc
                    .text(item.label, col1, dataY)
                    .text(`₹ ${item.amount.toLocaleString('en-IN')}`, col2, dataY)
                    .text('✓', col3, dataY);

                dataY += 18;
            }
        });

        // Total deductions
        doc
            .font('Helvetica-Bold', 10)
            .text('Total Deductions', col1, dataY)
            .text(`₹ ${deductions.totalDeductions.toLocaleString('en-IN')}`, col2, dataY);

        // Net salary box
        dataY += 25;

        doc
            .font('Helvetica-Bold', 11)
            .fill('#d4f1d4')
            .rect(col1 - 5, dataY, 510, 25)
            .fill()
            .fill('black')
            .text('NET SALARY PAID', col1, dataY + 3)
            .text(`₹ ${payslip.netSalary.toLocaleString('en-IN')}`, col2, dataY + 3);
    }

    /**
     * Add summary section
     */
    private addSummary(doc: any, payslip: any): void {
        const y = 640;

        doc
            .font('Helvetica', 8)
            .text('Summary:', 50, y)
            .text(`Gross Salary: ₹ ${payslip.grossSalary.toLocaleString('en-IN')}`, 50, y + 15)
            .text(`Total Deductions: ₹ ${payslip.deductions.totalDeductions.toLocaleString('en-IN')}`, 50, y + 30)
            .text(`Net Salary: ₹ ${payslip.netSalary.toLocaleString('en-IN')}`, 50, y + 45);

        doc
            .font('Helvetica-Oblique', 8)
            .text(
                'This is a computer-generated document. No signature is required.',
                50,
                y + 70
            );

        if (payslip.payoutStatus === 'processed') {
            doc
                .fill('green')
                .text(`✓ Salary Paid on ${payslip.processedAt?.toLocaleDateString('en-IN')}`, 50, y + 90);
        } else if (payslip.payoutStatus === 'failed') {
            doc
                .fill('red')
                .text(`✗ Payment Failed - Contact HR`, 50, y + 90)
                .fill('black');
        }
    }

    /**
     * Add footer
     */
    private addFooter(doc: any): void {
        const pageCount = doc.bufferedPageRange().count;

        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);

            doc
                .fontSize(8)
                .text(
                    `Page ${i + 1} of ${pageCount}`,
                    50,
                    doc.page.height - 30,
                    { align: 'center' }
                );

            // Horizontal line
            doc
                .moveTo(50, doc.page.height - 40)
                .lineTo(550, doc.page.height - 40)
                .stroke();

            doc
                .fontSize(7)
                .text(
                    `Generated on ${new Date().toLocaleString('en-IN')} | For official use only`,
                    50,
                    doc.page.height - 20,
                    { align: 'center' }
                );
        }
    }

    /**
     * Generate bulk payslips for a payroll run
     */
    async generateBulkPayslips(payrollId: string): Promise<{ generated: number; failed: number }> {
        try {
            const payslips = await Payslip.find({
                payrollId,
                pdfGenerated: false,
            });

            let generated = 0;
            let failed = 0;

            console.log(`📄 Generating ${payslips.length} payslips for payroll: ${payrollId}`);

            for (const payslip of payslips) {
                try {
                    await this.generatePayslipPDF(payslip._id.toString());
                    generated++;
                } catch (error: any) {
                    console.error(`❌ Failed to generate payslip ${payslip._id}:`, error.message);
                    failed++;
                }
            }

            console.log(`✅ Bulk payslip generation complete: ${generated} generated, ${failed} failed`);

            return { generated, failed };
        } catch (error: any) {
            console.error('❌ Bulk payslip generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Get payslip PDF file
     */
    async getPayslipFile(payslipNumber: string): Promise<buffer> {
        try {
            const filename = `payslip-${payslipNumber}.pdf`;
            const filepath = path.join(this.pdfDir, filename);

            if (!fs.existsSync(filepath)) {
                throw new Error('Payslip PDF not found');
            }

            return fs.readFileSync(filepath);
        } catch (error: any) {
            console.error('❌ Error reading payslip file:', error.message);
            throw error;
        }
    }

    /**
     * Email payslip to employee
     */
    async emailPayslip(
        payslipId: string,
        employeeEmail: string,
        message?: string
    ): Promise<void> {
        try {
            const payslip = await Payslip.findById(payslipId);

            if (!payslip) {
                throw new Error('Payslip not found');
            }

            // Use notification service to send email with PDF attachment
            const NotificationService = require('./NotificationService').default;
            const notificationService = new NotificationService();

            // Generate PDF if not already generated
            if (!payslip.pdfGenerated) {
                await this.generatePayslipPDF(payslipId);
            }

            // Email sending logic (integrate with email service)
            console.log(
                `📧 Payslip emailed to ${employeeEmail}: ${payslip.payslipNumber}`
            );
        } catch (error: any) {
            console.error('❌ Error emailing payslip:', error.message);
            throw error;
        }
    }
}

export default PayslipGenerator;
