# Salary Payout Automation Module - Complete Architecture

## System Overview

A production-grade HRMS Salary Payout Module with RazorpayX integration designed to handle 10,000+ employees, supporting bulk payroll processing with automated webhook tracking and compliance reporting.

---

## Part 1: Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        HR Dashboard (Frontend)                   │
│  - Run Payroll │ Approve Payroll │ View Reports │ Download Slip  │
└────────────────────────┬─────────────────────────┬───────────────┘
                         │                         │
┌────────────────────────▼──────────────────────────▼──────────────┐
│                    API Gateway & Auth Layer                       │
│  - JWT Authentication │ RBAC │ Rate Limiting │ Audit Logging    │
└────────────────────────┬──────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬──────────────────┐
         │               │               │                  │
    ┌────▼────┐  ┌───────▼────┐  ┌──────▼──────┐  ┌────────▼──────┐
    │Payroll  │  │ Employee   │  │  Payout    │  │  Payslip     │
    │  API    │  │  Bank  API │  │   API      │  │  Generator   │
    └────┬────┘  └───────┬────┘  └──────┬──────┘  └────────┬──────┘
         │               │               │                  │
    ┌────▼────────────────▼───────────────▼──────────────────▼──────┐
│                      Service Layer                                 │
│  - PayrollEngine │ EmployeeService │ RazorpayXService │ Payout   │
└─────────┬──────────────────────────────────────────────────────────┘
          │
    ┌─────▼────────────────────────────────────┐
    │      Queue & Job Processing              │
    │  - Bull Queue │ Redis │ Worker Processes│
    └─────┬────────────────────────────────────┘
          │
    ┌─────▼─────────────────────────────────────┐
    │   RazorpayX API Integration                │
    │ - Create Contact                           │
    │ - Create Fund Account                      │
    │ - Trigger Payout                           │
    │ - Webhook Listener                         │
    └─────┬─────────────────────────────────────┘
          │
    ┌─────▼────────────────────────────────────┐
    │        Database Layer                    │
    │ - MongoDB (Primary Data Store)           │
    │ - Redis (Caching, Queue)                 │
    │ - PostgreSQL (Audit Logs - Optional)     │
    └────────────────────────────────────────┘
```

---

## Part 2: Data Models & MongoDB Schemas

### 2.1 Employee Schema
```javascript
// Bank account encrypted at rest
```

### 2.2 Payroll Calculation
- Basic Salary: As per agreement
- Allowances: HRA, DA, Special Allowance
- Bonuses: Performance, Productivity
- Deductions: PF, Tax, Professional Tax
- Net Salary = Basic + Allowances + Bonuses - Deductions

### 2.3 Payout Flow
1. HR Runs Payroll → Calculation Complete
2. Approval Workflow → Finance Review
3. Generate Payslips → PDF Creation
4. Bulk Payout → RazorpayX API
5. Track Status → Webhook Updates
6. Employee Notification → Email/SMS

---

## Part 3: RazorpayX Integration Flow

### 3.1 Contact & Fund Account Creation
```
Employee Bank Details (Encrypted)
         ↓
Decrypt for API Call (In-Memory Only)
         ↓
Call: POST /contacts (Create Contact)
         ↓
Get: contact_id
         ↓
Call: POST /fund_accounts (Create Fund Account)
         ↓
Get: fund_account_id (Store Encrypted)
         ↓
Ready for Payout
```

### 3.2 Payout Trigger
```
Approved Payroll
         ↓
Create Batch (100-1000 employees)
         ↓
FOR EACH batch:
  Create Queue Job
         ↓
  Call: POST /payouts (RazorpayX)
         ↓
  Store payout_id, transaction_id
         ↓
Add Webhook Listener
```

### 3.3 Webhook Status Updates
```
RazorpayX Webhook Event
         ↓
Verify Signature (HMAC)
         ↓
Update Transaction Status
         ↓
Send Employee Notification
         ↓
Update Audit Logs
```

---

## Part 4: Security Stack

### 4.1 Encryption
- **At Rest**: AES-256-GCM for bank accounts
- **In Transit**: TLS 1.3
- **Keys**: Stored in environment/AWS Secrets Manager

### 4.2 Authentication & Authorization
- **JWT**: Access + Refresh tokens
- **RBAC**: HR, Finance, Admin, Employee roles
- **Payroll Approval**: Multi-level workflow

### 4.3 Audit & Compliance
- All payroll operations logged
- Who approved? When? What changed?
- Encrypted transaction logs

---

## Part 5: Scalability Considerations

### 5.1 Database Indexing
- Employee email, ID (unique)
- Payroll runs by date range
- Transaction status queries
- Fund account lookups

### 5.2 Horizontal Scaling
- Stateless API servers
- Redis for distributed caching
- Bull Queue for job distribution
- Multiple worker processes

### 5.3 Rate Limiting
- RazorpayX: 100 requests/min
- Batch payouts: Max 5000 per request
- Employee API: 1000 requests/min per user

---

## Part 6: Folder Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── Employee.ts
│   │   ├── EmployeeBankAccount.ts
│   │   ├── Payroll.ts
│   │   ├── SalaryStructure.ts
│   │   ├── PayslipTemplate.ts
│   │   ├── PayoutTransaction.ts
│   │   ├── RazorpayContact.ts
│   │   └── AuditLog.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── employeeController.ts
│   │   ├── bankAccountController.ts
│   │   ├── payrollController.ts
│   │   ├── payoutController.ts
│   │   └── reportController.ts
│   ├── services/
│   │   ├── PayrollEngine.ts
│   │   ├── EmployeeService.ts
│   │   ├── RazorpayXService.ts
│   │   ├── BankEncryptionService.ts
│   │   ├── PayslipGenerator.ts
│   │   └── NotificationService.ts
│   ├── queues/
│   │   ├── PayoutQueue.ts
│   │   ├── PayslipQueue.ts
│   │   └── workers/
│   │       ├── payoutWorker.ts
│   │       └── payslipWorker.ts
│   ├── webhooks/
│   │   └── razorpayXWebhook.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── auditLogger.ts
│   │   └── rateLimiter.ts
│   ├── utils/
│   │   ├── encryption.ts
│   │   ├── validation.ts
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── employee.routes.ts
│   │   ├── payroll.routes.ts
│   │   ├── payout.routes.ts
│   │   └── webhook.routes.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── razorpay.ts
│   ├── types/
│   │   └── index.ts
│   └── app.ts
├── tests/
├── .env
├── .env.example
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── components/
│   │   ├── PayrollDashboard.tsx
│   │   ├── EmployeeBankForm.tsx
│   │   ├── PayslipViewer.tsx
│   │   ├── PayoutApproval.tsx
│   │   ├── PayoutHistory.tsx
│   │   └── Reports/
│   │       ├── PayrollReport.tsx
│   │       ├── TaxReport.tsx
│   │       └── ComplianceReport.tsx
│   ├── pages/
│   │   ├── payroll/
│   │   ├── employees/
│   │   └── reports/
│   └── hooks/
│       ├── usePayroll.ts
│       ├── usePayoutStatus.ts
│       └── usePayslip.ts
```

---

## Part 7: API Endpoints

### Employee Management
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Bank Account Management
- `POST /api/employees/:id/bank` - Add bank account
- `GET /api/employees/:id/bank` - Get bank details (encrypted)
- `PUT /api/employees/:id/bank` - Update bank account
- `POST /api/employees/:id/bank/verify` - Verify bank account

### Payroll Management
- `POST /api/payroll/run` - Run payroll calculation
- `GET /api/payroll/runs` - List payroll runs
- `POST /api/payroll/:runId/approve` - Approve payroll
- `GET /api/payroll/:runId/details` - Get payroll details
- `GET /api/payroll/:id/payslip` - Download payslip

### Payout Management
- `POST /api/payroll/:runId/payout` - Trigger bulk payout
- `GET /api/payouts` - Get payout history
- `GET /api/payouts/:id` - Get payout details
- `POST /api/payouts/:id/retry` - Retry failed payout

### Reports
- `GET /api/reports/payroll` - Payroll summary
- `GET /api/reports/tax` - Tax calculations
- `GET /api/reports/compliance` - Compliance report

---

## Part 8: Technology Stack

### Backend
- **Framework**: Express.js / Fastify
- **Language**: TypeScript
- **Database**: MongoDB
- **Caching**: Redis
- **Queue**: Bull Queue
- **Encryption**: crypto, @noble/ciphers
- **API**: Razorpay SDK

### Frontend
- **Framework**: React / Next.js
- **UI Library**: Material-UI or Tailwind CSS
- **State Management**: Redux/Zustand
- **Reports**: ReportLab / PDFKit

### DevOps
- **Container**: Docker
- **Orchestration**: Kubernetes (for 10K+ scale)
- **Logging**: ELK Stack / CloudWatch
- **Monitoring**: Prometheus + Grafana

---

## Part 9: Key Features

### Core
✅ Payroll Calculation (All components)
✅ Bulk Payout (100-1000 employees)
✅ Bank Account Management (Encrypted)
✅ Approval Workflow
✅ Payslip Generation (PDF)
✅ Webhook Integration
✅ Audit Logging

### Advanced
✅ Multi-level Approval
✅ Scheduled Payroll
✅ Tax Calculations (Indian)
✅ Expense Reimbursement
✅ Contractor Payments
✅ Vendor Payouts
✅ Compliance Reports

---

## Part 10: Performance Targets

- **Payroll Calculation**: < 2 minutes for 1000 employees
- **Payout Processing**: < 5 seconds per 100 employees
- **Payslip Generation**: < 1 second per slip
- **API Response Time**: < 200ms (p95)
- **Database Query**: < 50ms (p95)

---

## Part 11: Deployment Checklist

- [ ] Database backups configured
- [ ] Encryption keys secured (AWS Secrets Manager)
- [ ] Rate limiting configured
- [ ] Webhook signature verification enabled
- [ ] Audit logging enabled
- [ ] Mobile phone verification for large payouts
- [ ] Email notifications configured
- [ ] Monitoring alerts set
- [ ] Disaster recovery plan
- [ ] Load testing completed

This document will be supplemented with implementation code in following files.
