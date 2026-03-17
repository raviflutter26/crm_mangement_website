# Quick Start Guide - Salary Payout Automation System

**Total Setup Time: 15 minutes**

---

## Prerequisites

- **Node.js** 18+ installed
- **MongoDB** instance (local or cloud)
- **Redis** instance (local or cloud)
- **RazorpayX** account (sandbox)
- **Git** for version control

---

## Phase 1: Environment Setup (3 minutes)

### 1.1 Create Environment File

Create `/backend/.env`:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/salary-payout
MONGODB_USER=admin
MONGODB_PASSWORD=yourpassword

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-long!
JWT_EXPIRY=24h

# RazorpayX (Sandbox)
RAZORPAY_API_KEY=rzp_test_your_key
RAZORPAY_API_SECRET=your_secret
RAZORPAY_ACCOUNT_NUMBER=1112220105623456

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key-abcd!
ENCRYPTION_ALGORITHM=aes-256-gcm

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@company.com

# Server
PORT=3000
NODE_ENV=development

# AWS (Optional for production)
AWS_REGION=ap-south-1
AWS_S3_BUCKET=payroll-payslips
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### 1.2 Create Frontend Environment File

Create `/frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENV=development
```

---

## Phase 2: Backend Setup (5 minutes)

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

### 2.2 Build TypeScript

```bash
npm run build
```

### 2.3 Start Local MongoDB (using Docker)

```bash
docker run -d \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=yourpassword \
  --name mongodb \
  mongo:latest
```

### 2.4 Start Local Redis (using Docker)

```bash
docker run -d \
  -p 6379:6379 \
  --name redis \
  redis:latest
```

### 2.5 Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run start
```

**Expected Output:**
```
✓ Database connected
✓ Redis connected
✓ Queue workers started (5 payout workers)
✓ Payslip queue started
✓ Server listening on port 3000
```

---

## Phase 3: Frontend Setup (4 minutes)

### 3.1 Install Dependencies

```bash
cd frontend
npm install
```

### 3.2 Start Development Server

```bash
npm start
```

**Frontend runs on:** `http://localhost:3000`

---

## Phase 4: Quick Test (3 minutes)

### 4.1 Test API Health

```bash
curl http://localhost:3000/health

# Response:
# {
#   "status": "ok",
#   "timestamp": "2024-02-28T10:00:00Z",
#   "uptime": 123.45
# }
```

### 4.2 Create Test User (Admin)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'

# Response: { "token": "eyJhbGc...", "user": {...} }
```

### 4.3 Save Token

```bash
TOKEN="eyJhbGc..." # From above response

# Store for subsequent requests
export AUTH_TOKEN=$TOKEN
```

### 4.4 Create Test Employee

```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "employeeId": "EMP001",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "email": "rajesh@company.com",
    "phone": "+919876543210",
    "dateOfJoining": "2023-01-15",
    "department": "Engineering",
    "designation": "Senior Developer",
    "salaryStructureId": "struct_default"
  }'

# Response: { "success": true, "data": { "employeeId": "EMP001", ... } }
```

### 4.5 Add Bank Account

```bash
curl -X POST http://localhost:3000/api/employees/EMP001/bank \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "accountNumber": "9876543210123456",
    "ifscCode": "HDFC0000123",
    "accountHolderName": "Rajesh Kumar",
    "bankName": "HDFC Bank",
    "accountType": "savings"
  }'

# Response: { "success": true, "data": { "status": "pending_verification" } }
```

### 4.6 Verify Bank Account

```bash
curl -X POST http://localhost:3000/api/employees/EMP001/bank/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# This creates RazorpayX Contact + Fund Account
# Response: { "success": true, "data": { "fundAccountId": "fa_...", "status": "active" } }
```

### 4.7 Run Payroll

```bash
curl -X POST http://localhost:3000/api/payroll/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "month": 2,
    "year": 2024
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "payrollRunId": "PAYROLL-2024-02-...",
#     "totalEmployees": 1,
#     "totalPayrollAmount": 64415,
#     "totalDeductions": 13585
#   }
# }
```

### 4.8 Approve Payroll

```bash
PAYROLL_ID="PAYROLL-2024-02-..." # From above

# HR Approval
curl -X POST http://localhost:3000/api/payroll/$PAYROLL_ID/approve \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "approvingAs": "hr", "comment": "Approved by HR" }'

# Finance Approval
curl -X POST http://localhost:3000/api/payroll/$PAYROLL_ID/approve \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "approvingAs": "finance", "comment": "Approved by Finance" }'
```

### 4.9 Trigger Payout

```bash
curl -X POST http://localhost:3000/api/payroll/$PAYROLL_ID/payout \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Response: { "success": true, "message": "Payout processing started" }

# This queues 1 payout job for RazorpayX processing
```

### 4.10 Check Payout Status

```bash
# Poll this endpoint (every 10 seconds) to see progress
curl http://localhost:3000/api/payroll/$PAYROLL_ID/status \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Response:
# {
#   "success": true,
#   "data": {
#     "status": "in-process",
#     "statistics": [
#       { "_id": "processed", "count": 0 },
#       { "_id": "processing", "count": 1 },
#       { "_id": "pending", "count": 0 }
#     ]
#   }
# }
```

---

## Common Issues & Fixes

### Issue 1: MongoDB Connection Refused

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Fix:**
```bash
# Make sure MongoDB is running
docker ps | grep mongodb

# If not running, start it:
docker start mongodb

# Or restart:
docker restart mongodb
```

### Issue 2: Redis Connection Failed

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Fix:**
```bash
# Start Redis:
docker start redis

# Or restart:
docker restart redis
```

### Issue 3: JWT Secret Not Set

**Error:** `JWT_SECRET is required`

**Fix:**
```bash
# Add to .env:
JWT_SECRET=your-super-secret-key-min-32-characters-long!
```

### Issue 4: RazorpayX API Key Invalid

**Error:** `Invalid API key provided`

**Fix:**
```bash
# Get sandbox credentials from:
# 1. Go to https://dashboard.razorpay.com
# 2. Settings → API Keys → Generate Test Key
# 3. Copy key and secret to .env
```

### Issue 5: Bank Account Verification Fails

**Error:** `Fund account creation failed`

**Fix:**
```bash
# Check account number format (9-18 digits):
✓ Valid: 9876543210123456
✗ Invalid: 123

# Check IFSC code format (ABCD0000123):
✓ Valid: HDFC0000123
✗ Invalid: HDFC
```

---

## Useful Commands

### Start All Services (Docker Compose)

```bash
# Create docker-compose.yml (see SETUP_AND_DEPLOYMENT.md)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### View Database

```bash
# Connect to MongoDB
mongosh mongodb://admin:yourpassword@localhost:27017/salary-payout

# View collections
show collections

# View employees
db.employees.find()

# View payroll runs
db.payrolls.find()

# View audit logs
db.auditlogs.find().sort({ createdAt: -1 }).limit(10)
```

### View Redis Queue

```bash
# Connect to Redis
redis-cli

# View queues
KEYS "*"

# View payout queue jobs
LRANGE payout-queue 0 -1

# Monitor Real-time
MONITOR
```

### Database Backup

```bash
# Backup MongoDB
mongodump --uri="mongodb://admin:yourpassword@localhost:27017/salary-payout" --out=./backup

# Restore MongoDB
mongorestore --uri="mongodb://admin:yourpassword@localhost:27017/salary-payout" --dir=./backup
```

### API Testing with Postman

1. Import API collection:
   - Download from `/API_DOCUMENTATION.md`
   - Import to Postman
   - Set environment variable: `token` = Bearer token from login

2. Or use cURL:
   ```bash
   curl -X GET http://localhost:3000/api/payroll \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## Next Steps

1. **Read** [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Working code examples
2. **Review** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Full API reference
3. **Deploy** [SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md) - Production deployment

---

## Production Deployment Checklist

- [ ] Configure RazorpayX live credentials
- [ ] Set up MongoDB Atlas (cloud)
- [ ] Set up Redis Cloud or AWS ElastiCache
- [ ] Configure AWS S3 for payslip PDFs
- [ ] Set up SMTP with SendGrid/AWS SES
- [ ] Configure SSL certificates
- [ ] Set up monitoring (CloudWatch, DataDog)
- [ ] Configure backups and disaster recovery
- [ ] Test with 10-100 test employees first
- [ ] Performance testing at scale (1000+ employees)
- [ ] Security audit
- [ ] Load testing

---

**You're ready to go!** 🚀

If you encounter any issues, check:
1. Environment variables in `.env`
2. Database connections (MongoDB + Redis)
3. RazorpayX credentials
4. Network/firewall settings

