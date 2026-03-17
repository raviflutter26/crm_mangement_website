# Complete Salary Payout Automation - Implementation Guide

## 1. Full Code Implementation - Node.js API Server

### 1.1 Express App Setup (app.ts)

```typescript
import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { startPayoutWorker, startPayslipWorker } from './queues/payoutQueue';
import PayrollController from './controllers/payrollController';
import BankAccountController from './controllers/bankAccountController';
import RazorpayXWebhookHandler from './webhooks/razorpayXWebhook';

const app: Express = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP',
});
app.use(limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as any);

// Start queue workers
startPayoutWorker();
startPayslipWorker();

// Controllers
const payrollController = new PayrollController();
const bankAccountController = new BankAccountController();
const webhookHandler = new RazorpayXWebhookHandler(process.env.RAZORPAY_WEBHOOK_SECRET);

// Routes
app.post('/api/payroll/run', (req, res) => payrollController.runPayroll(req, res));
app.get('/api/payroll/:payrollRunId', (req, res) => payrollController.getPayrollDetails(req, res));
app.post('/api/payroll/:payrollRunId/approve', (req, res) =>
  payrollController.approvePayroll(req, res)
);
app.post('/api/payroll/:payrollRunId/payout', (req, res) =>
  payrollController.triggerPayout(req, res)
);
app.get('/api/payroll/:payrollRunId/status', (req, res) =>
  payrollController.getPayoutStatus(req, res)
);

app.post('/api/employees/:employeeId/bank', (req, res) =>
  bankAccountController.addBankAccount(req, res)
);
app.get('/api/employees/:employeeId/bank', (req, res) =>
  bankAccountController.getBankAccount(req, res)
);
app.post('/api/employees/:employeeId/bank/verify', (req, res) =>
  bankAccountController.verifyBankAccount(req, res)
);

// Webhook endpoint - No authentication required
app.post('/webhooks/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);

    const result = await webhookHandler.processWebhook(body, signature);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export default app;
```

### 1.2 Authentication Middleware

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    (req as any).userId = (decoded as any).userId;
    (req as any).userRole = (decoded as any).role; // 'admin', 'hr', 'finance', 'employee'

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// RBAC Middleware
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

### 1.3 Environment Variables (.env)

```bash
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/payroll

# Redis (for Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=24h

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxx
RAZORPAY_ACCOUNT_NUMBER=1112220105623456
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Bank Encryption
BANK_ENCRYPTION_KEY=your-32-char-encryption-key-here
HASH_SALT=your-hash-salt

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@company.com
HR_EMAIL=hr@company.com

# AWS (Optional)
AWS_REGION=ap-south-1
AWS_SECRETS_MANAGER_ARN=arn:aws:secretsmanager:region:account:secret:payroll
```

---

## 2. Working Example: Complete Salary Payout Workflow

### 2.1 Step-by-Step Employee Setup

```typescript
// Example: Setup an employee for payroll

import Employee from './models/Employee';
import SalaryStructure from './models/SalaryStructure';
import EmployeeBankAccount from './models/EmployeeBankAccount';
import BankEncryptionService from './utils/encryption';
import RazorpayXService from './services/RazorpayXService';

async function setupEmployeePayroll(employeeData: any) {
  // 1. Create salary structure
  const salaryStructure = await SalaryStructure.create({
    name: 'Standard Salary Structure',
    basicSalary: 50000,
    allowances: {
      hra: 15000,
      da: 5000,
      specialAllowance: 5000,
      travelAllowance: 2000,
      foodAllowance: 1000,
    },
    deductions: {
      pf: 6000, // 12% of basic
      tax: 4000,
      professionalTax: 200,
    },
    paymentFrequency: 'monthly',
    effectiveDate: new Date(),
    isActive: true,
  });

  // 2. Create employee
  const employee = await Employee.create({
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+919876543210',
    dateOfJoining: new Date(),
    dateOfBirth: new Date('1990-01-15'),
    department: 'Engineering',
    designation: 'Senior Developer',
    status: 'active',
    salaryStructureId: salaryStructure._id,
    address: {
      street: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
    },
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+919876543211',
      relationship: 'Spouse',
    },
  });

  // 3. Add encrypted bank details
  const encryptionService = new BankEncryptionService();

  const encryptedAccount = encryptionService.encrypt('9876543210123456');
  const encryptedIFSC = encryptionService.encrypt('HDFC0000123');

  const bankAccount = await EmployeeBankAccount.create({
    employeeId: employee._id,
    accountHolderName: 'John Doe',
    accountNumber: encryptedAccount.encrypted,
    ifscCode: encryptedIFSC.encrypted,
    bankName: 'HDFC Bank',
    accountType: 'savings',
    isPrimary: true,
    encryptionVersion: 1,
  });

  // 4. Verify with RazorpayX (creates Contact and Fund Account)
  const razorpayService = new RazorpayXService();

  const setupResult = await razorpayService.setupAndPayEmployee({
    employeeId: employee.employeeId,
    fullName: `${employee.firstName} ${employee.lastName}`,
    email: employee.email,
    phone: employee.phone,
    accountNumber: '9876543210123456',
    ifscCode: 'HDFC0000123',
    accountHolderName: 'John Doe',
    bankName: 'HDFC Bank',
    salaryAmount: salaryStructure.netSalary,
  });

  // Update with Razorpay IDs
  await Employee.updateOne(
    { _id: employee._id },
    {
      razorpayContactId: setupResult.contactId,
      razorpayFundAccountId: setupResult.fundAccountId,
    }
  );

  await EmployeeBankAccount.updateOne(
    { _id: bankAccount._id },
    {
      razorpayFundAccountId: setupResult.fundAccountId,
      razorpayFundAccountStatus: 'active',
      isVerified: true,
    }
  );

  console.log('✅ Employee setup complete');
  console.log(`   Razorpay Contact ID: ${setupResult.contactId}`);
  console.log(`   Razorpay Fund Account ID: ${setupResult.fundAccountId}`);

  return {
    employee,
    salaryStructure,
    bankAccount,
    razorpaySetup: setupResult,
  };
}
```

### 2.2 Complete Salaryayout Workflow

```typescript
// Example: Complete monthly payroll processing

import PayrollEngine from './services/PayrollEngine';
import Payroll from './models/Payroll';
import { queuePayoutJob } from './queues/payoutQueue';

async function completePayrollWorkflow() {
  console.log('📋 Starting monthly payroll workflow...\n');

  const payrollEngine = new PayrollEngine();
  const month = 2;
  const year = 2024;
  const companyId = 'COMP001';
  const userId = 'USER123';

  // Step 1: Run payroll calculation
  console.log('Step 1️⃣: Running payroll calculation...');
  const payrollResult = await payrollEngine.runMonthlyPayroll(
    month,
    year,
    companyId,
    userId
  );

  console.log(`✅ Payroll calculated for ${payrollResult.totalEmployees} employees`);
  console.log(`   Total Payout Amount: ₹${payrollResult.totalPayrolAmount.toLocaleString()}`);
  console.log(`   Total Deductions: ₹${payrollResult.totalDeductions.toLocaleString()}\n`);

  // Step 2: HR Approval
  console.log('Step 2️⃣: HR Approval...');
  await Payroll.updateOne(
    { payrollRunId: payrollResult.payrollRunId },
    {
      approvalWorkflow: {
        hr: {
          approvedAt: new Date(),
          approvedBy: userId,
          comment: 'Approved by HR Manager',
        },
      },
    }
  );
  console.log('✅ HR approved\n');

  // Step 3: Finance Approval
  console.log('Step 3️⃣: Finance Approval...');
  await Payroll.updateOne(
    { payrollRunId: payrollResult.payrollRunId },
    {
      approval Workflow: {
        finance: {
          approvedAt: new Date(),
          approvedBy: userId,
          comment: 'Budget allocated',
        },
      },
      status: 'approved',
      approvedAt: new Date(),
    }
  );
  console.log('✅ Finance approved\n');

  // Step 4: Generate payslips
  console.log('Step 4️⃣: Generating payslips...');
  const Payslip = require('./models/Payslip').default;
  const payslipsCount = await Payslip.countDocuments({
    payrollId: payrollResult.payrollRunId,
  });
  console.log(`✅ ${payslipsCount} payslips generated\n`);

  // Step 5: Queue bulk payout
  console.log('Step 5️⃣: Queuing bulk payout...');
  const payroll = await Payroll.findOne({ payrollRunId: payrollResult.payrollRunId });

  const transactions = await require('./models/PayoutTransaction').default.find({
    payrollId: payroll._id,
  });

  const job = await queuePayoutJob(payroll._id, transactions);
  console.log(`✅ Payout job queued with ID: ${job.id}\n`);

  // Step 6: Monitor progress
  console.log('Step 6️⃣: Monitoring payout progress...');

  await new Promise((resolve) => {
    job.on('progress', (progress) => {
      console.log(`📊 Progress: ${progress}%`);
    });

    job.on('completed', (result) => {
      console.log(`\n✅ Payout completed!\n`);
      console.log(`   Successful: ${result.successCount}`);
      console.log(`   Failed: ${result.failureCount}`);
      console.log(`   Completed At: ${result.completedAt}`);
      resolve(result);
    });

    job.on('failed', (error) => {
      console.error(`\n❌ Payout failed: ${error.message}`);
      resolve(null);
    });
  });

  console.log('\n✅ Complete payroll workflow finished');
}

// Run it
completePayrollWorkflow().catch(console.error);
```

### 2.3 Bulk Payout Processing (Worker)

```typescript
// Example: How bulk payout works in real-time

async function demonstrateBulkPayout() {
  const RazorpayXService = require('./services/RazorpayXService').default;
  const razorpayService = new RazorpayXService();

  // Example batch of 100 employees to pay
  const payoutBatch = [
    {
      fundAccountId: 'fa_00000000000001',
      amount: 50000 * 100, // In paise
      employeeId: 'EMP001',
      transactionId: 'TXN-0001',
    },
    {
      fundAccountId: 'fa_00000000000002',
      amount: 60000 * 100,
      employeeId: 'EMP002',
      transactionId: 'TXN-0002',
    },
    // ... up to 1000 employees in production
  ];

  console.log(`🚀 Processing ${payoutBatch.length} payouts...\n`);

  const startTime = Date.now();

  // Process in batches of 100 (RazorpayX limit)
  const batchSize = 100;
  let totalSuccessful = 0;
  let totalFailed = 0;

  for (let i = 0; i < payoutBatch.length; i += batchSize) {
    const batch = payoutBatch.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    console.log(`📦 Batch ${batchNumber}: Processing ${batch.length} payouts...`);

    try {
      const result = await razorpayService.bulkPayout(batch);

      totalSuccessful += result.successful.length;
      totalFailed += result.failed.length;

      // Display results
      console.log(`   ✅ Successful: ${result.successful.length}`);
      console.log(`   ❌ Failed: ${result.failed.length}`);

      result.successful.forEach((payout: any) => {
        console.log(`      ✅ ${payout.transactionId} -> ${payout.payoutId}`);
      });

      result.failed.forEach((failure: any) => {
        console.log(`      ❌ ${failure.transactionId}: ${failure.error}`);
      });

      // Delay between batches
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`   ❌ Batch error: ${error.message}`);
    }

    console.log();
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('📊 Final Results:');
  console.log(`   Total Payouts: ${payoutBatch.length}`);
  console.log(`   ✅ Successful: ${totalSuccessful}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   ⏱️ Time: ${duration}s`);
  console.log(`   📈 Speed: ${(payoutBatch.length / parseFloat(duration)).toFixed(0)} payouts/sec`);
}

demonstrateBulkPayout().catch(console.error);
```

---

## 3. Production Deployment Checklist

### 3.1 Environment Setup
- [ ] MongoDB cluster (Atlas with backups)
- [ ] Redis cluster (for queue, caching)
- [ ] Node.js server (PM2 or Docker)
- [ ] Load balancer (Nginx/AWS ALB)
- [ ] CDN for static assets
- [ ] SSL certificates (Let's Encrypt)

### 3.2 Security
- [ ] Encrypt bank data (AES-256-GCM)
- [ ] Store keys in AWS Secrets Manager
- [ ] Enable database encryption at rest
- [ ] VPC for database isolation
- [ ] IP whitelisting for RazorpayX
- [ ] WAF (Web Application Firewall)
- [ ] Regular security audits

### 3.3 Monitoring & Logging
- [ ] ELK Stack for logs
- [ ] Prometheus + Grafana for metrics
- [ ] CloudWatch for AWS resources
- [ ] Error tracking (Sentry)
- [ ] APM (Application Performance Monitoring)
- [ ] Real-time alerts configured

###3.4 Testing
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] Load testing (1000+ concurrent requests)
- [ ] Disaster recovery drill
- [ ] RazorpayX sandbox testing

---

## 4. Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| Payout fails with "Invalid Fund Account" | Verify Fund Account is active in RazorpayX dashboard |
| Encryption errors | Check BANK_ENCRYPTION_KEY length (must be 32+ chars) |
| Queue jobs stuck | Check Redis connection, restart Bull workers |
| Webhook not received | Verify webhook URL and secret in RazorpayX settings |
| Rate limit errors | Implement exponential backoff, increase batch delay |
| Database lock during bulk operation | Use connection pooling, optimize aggregation queries |

---

## 5. Performance Optimization

- **DB Indexing**: All foreign keys and status fields indexed
- **Connection Pooling**: Pool size = 50 connections
- **Caching**: Redis cache all employee salary structures
- **Batching**: Process payouts in groups of 100
- **Async Jobs**: All heavy operations in background queues
- **CDN**: Static payslip PDFs served from CDN

---

## Next Steps

1. Set up all environment variables
2. Configure MongoDB and Redis instances
3. Run `npm install` dependencies
4. Test with sandbox RazorpayX API
5. Load test with 1000+ employees
6. Deploy to production with monitoring
7. Set up disaster recovery

Detailed implementation files are ready in the backend directory!
