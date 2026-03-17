# API Documentation - Salary Payout Automation System

## Base URL
```
Production: https://api.yourcompany.com/api
Development: http://localhost:5000/api
```

## Authentication
All API endpoints (except webhooks) require JWT Bearer token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Authentication Endpoints

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "user@company.com",
    "role": "hr"
  }
}
```

---

## Payroll Management

### 1. Run Payroll
Calculate salary for all employees for a specific month.

```
POST /payroll/run
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "month": 2,
  "year": 2024,
  "companyId": "COMP001"
}

Response (201 Created):
{
  "success": true,
  "message": "Payroll calculated successfully",
  "data": {
    "payrollRunId": "PAYROLL-2024-02-1708903245123",
    "totalEmployees": 250,
    "totalPayrollAmount": 12500000,
    "totalDeductions": 2500000
  }
}
```

**Required Role:** HR, Admin

---

### 2. Get Payroll Details
```
GET /payroll/:payrollRunId
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "payrollRunId": "PAYROLL-2024-02-1708903245123",
    "month": 2,
    "year": 2024,
    "status": "calculated",
    "totalEmployees": 250,
    "totalPayrolAmount": 12500000,
    "approvalWorkflow": {
      "hr": {
        "approvedAt": null
      },
      "finance": {
        "approvedAt": null
      }
    },
    "calculatedAt": "2024-02-25T10:30:00Z"
  }
}
```

**Required Role:** HR, Finance, Admin

---

### 3. Approve Payroll
Multi-level approval: HR → Finance → Ready to Payout

```
POST /payroll/:payrollRunId/approve
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "approvingAs": "hr",  // or "finance"
  "comment": "Approved by HR manager"
}

Response (200 OK):
{
  "success": true,
  "message": "Payroll approved by hr",
  "data": {
    "payrollRunId": "PAYROLL-2024-02-1708903245123",
    "status": "calculated",
    "approvalWorkflow": {
      "hr": {
        "approvedAt": "2024-02-25T11:00:00Z",
        "approvedBy": "user123",
        "comment": "Approved by HR manager"
      }
    }
  }
}
```

**Required Role:** HR, Finance, Admin
**Status Transition:** calculated → approved (when both HR and Finance approve)

---

### 4. Trigger Bulk Payout
Initiate RazorpayX payouts for all approved employees.

```
POST /payroll/:payrollRunId/payout
Authorization: Bearer <token>
Content-Type: application/json

Response (200 OK):
{
  "success": true,
  "message": "Payout processing started",
  "data": {
    "payrollRunId": "PAYROLL-2024-02-1708903245123",
    "status": "in-process",
    "queuedAt": "2024-02-25T11:30:00Z"
  }
}
```

**Required Role:** Finance, Admin
**Status Transition:** approved → in-process

---

### 5. Get Payout Status
Real-time status of payout processing.

```
GET /payroll/:payrollRunId/status
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "payrollRunId": "PAYROLL-2024-02-1708903245123",
    "status": "in-process",
    "totalEmployees": 250,
    "statistics": [
      {
        "_id": "processed",
        "count": 200,
        "totalAmount": 12000000
      },
      {
        "_id": "pending",
        "count": 45,
        "totalAmount": 400000
      },
      {
        "_id": "failed",
        "count": 5,
        "totalAmount": 100000
      }
    ],
    "payoutStartedAt": "2024-02-25T11:30:00Z"
  }
}
```

**Required Role:** All authenticated users

---

## Bank Account Management

### 1. Add Bank Account
Add or update employee bank details (encrypted).

```
POST /employees/:employeeId/bank
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "accountNumber": "9876543210123456",
  "ifscCode": "HDFC0000123",
  "accountHolderName": "John Doe",
  "bankName": "HDFC Bank",
  "accountType": "savings"
}

Response (200 OK):
{
  "success": true,
  "message": "Bank account saved successfully",
  "data": {
    "bankAccountId": "bank123",
    "accountHolderName": "John Doe",
    "bankName": "HDFC Bank",
    "accountNumber": "XXXX-XXXX-XXXX-3456",
    "ifscCode": "HDFC0000123",
    "accountType": "savings"
  }
}
```

**Required Role:** Employee (own), HR, Admin
**Security:** Account number and IFSC are encrypted with AES-256-GCM

---

### 2. Get Bank Account
Retrieve employee bank details (decrypted in-memory only).

```
GET /employees/:employeeId/bank
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "bankAccountId": "bank123",
    "accountHolderName": "John Doe",
    "accountNumber": "9876543210123456",
    "accountNumberMasked": "XXXX-XXXX-XXXX-3456",
    "ifscCode": "HDFC0000123",
    "bankName": "HDFC Bank",
    "accountType": "savings",
    "isVerified": false,
    "razorpayFundAccountStatus": "created"
  }
}
```

**Required Role:** Employee (own), HR, Admin

---

### 3. Verify Bank Account
Verify with RazorpayX (creates Contact and Fund Account).

```
POST /employees/:employeeId/bank/verify
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "message": "Bank account verified successfully",
  "data": {
    "fundAccountId": "fa_1234567890",
    "status": "active",
    "verifiedAt": "2024-02-25T12:00:00Z"
  }
}
```

**Required Role:** HR, Admin

---

## Payslips

### 1. Get Payslips
Retrieve all payslips for a payroll run.

```
GET /payroll/:payrollRunId/payslips?page=1&limit=20
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "payslipNumber": "PS-2024-02-EMP001",
      "employeeId": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@company.com"
      },
      "month": 2,
      "year": 2024,
      "grossSalary": 50000,
      "netSalary": 45000,
      "payoutStatus": "processed"
    }
  ],
  "pagination": {
    "total": 250,
    "page": 1,
    "pages": 13
  }
}
```

**Required Role:** HR, Admin

---

### 2. Download Payslip
Download payslip as PDF.

```
GET /payroll/:payrollRunId/payslip/:employeeId
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": { ... payslip details ... }
}
```

**Required Role:** Employee (own), HR, Admin

---

## Reports

### 1. Payroll Summary
```
GET /reports/payroll?month=2&year=2024&companyId=COMP001
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "payrollRunId": "PAYROLL-2024-02-123456",
    "month": 2,
    "year": 2024,
    "status": "completed",
    "totalEmployees": 250,
    "totalPayrollAmount": 12500000,
    "totalDeductions": 2500000,
    "payoutsSummary": {
      "completed": 245,
      "failed": 5,
      "pending": 0
    }
  }
}
```

**Required Role:** HR, Finance, Admin

---

### 2. Tax Report
```
GET /reports/tax?month=2&year=2024
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "period": "2/2024",
    "employeeCount": 250,
    "taxDetails": [
      {
        "employeeId": "EMP001",
        "employeeName": "John Doe",
        "grossSalary": 50000,
        "tax": 5000,
        "professionalTax": 200,
        "totalTax": 5200,
        "pf": 6000
      }
    ],
    "summary": {
      "totalTax": 1250000,
      "totalPF": 1500000,
      "averageTax": 5000
    }
  }
}
```

**Required Role:** Finance, Admin

---

## Webhooks

### RazorpayX Webhook Events
Receive payout status updates from RazorpayX.

**Endpoint:** `POST /webhooks/razorpay`

**Headers:**
```
x-razorpay-signature: HMAC-SHA256 signature
Content-Type: application/json
```

**Events:**

#### payout.processed
```json
{
  "id": "webhook_123",
  "event": "payout.processed",
  "payload": {
    "payout": {
      "id": "payout_1234567890",
      "status": "processed",
      "fund_account_id": "fa_1234567890",
      "amount": 50000,
      "utr": "1234567890123",
      "created_at": 1708929600
    }
  }
}
```

#### payout.failed
```json
{
  "id": "webhook_124",
  "event": "payout.failed",
  "payload": {
    "payout": {
      "id": "payout_1234567891",
      "status": "failed",
      "reason_code": "INSUFFICIENT_FUNDS",
      "failure_reason": "Insufficient balance in account"
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": ["Field is required"]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token",
  "message": "Token expired"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "required": ["hr", "admin"],
  "current": "employee"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Duplicate entry",
  "field": "email"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- **General:** 1000 requests per 15 minutes per IP
- **RazorpayX:** 100 requests per minute
- **Webhooks:** No rate limit

Responses include rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1708933200
```

---

## Code Examples

### cURL
```bash
# Get payroll details
curl -X GET https://api.yourcompany.com/api/payroll/PAYROLL-2024-02-123456 \
  -H "Authorization: Bearer eyJhbGc..."

# Run payroll
curl -X POST https://api.yourcompany.com/api/payroll/run \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "month": 2,
    "year": 2024,
    "companyId": "COMP001"
  }'
```

### JavaScript/Node.js
```javascript
// Fetch payroll details
const response = await fetch('/api/payroll/PAYROLL-2024-02-123456', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data);
```

### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {token}'
}

response = requests.get(
    'https://api.yourcompany.com/api/payroll/PAYROLL-2024-02-123456',
    headers=headers
)

print(response.json())
```

---

## Summary Table

| Endpoint | Method | Auth Required | Min Role |
|----------|--------|---|---|
| /payroll/run | POST | Yes | HR |
| /payroll/:id | GET | Yes | HR |
| /payroll/:id/approve | POST | Yes | HR |
| /payroll/:id/payout | POST | Yes | Finance |
| /employees/:id/bank | POST | Yes | Employee |
| /employees/:id/bank | GET | Yes | Employee |
| /reports/payroll | GET | Yes | HR |
| /webhooks/razorpay | POST | No | - |

