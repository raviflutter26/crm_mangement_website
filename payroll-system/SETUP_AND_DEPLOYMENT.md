# Setup & Deployment Guide

## Quick Start (5 minutes)

### 1. Clone & Install

```bash
# Navigate to project directory
cd payroll-system/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Start Services

```bash
# Terminal 1: MongoDB (if using local)
mongod

# Terminal 2: Redis (if using local)
redis-server

# Terminal 3: Node.js API
npm start
```

### 3. Test

```bash
# Health check
curl http://localhost:5000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":123}
```

---

## Complete Installation Guide

### Prerequisites

- **Node.js:** v18+
- **MongoDB:** v5+
- **Redis:** v6+
- **Razorpay Account:** For testing/production payouts
- **SMTP Service:** For email notifications

### Environment Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourcompany/payroll-system.git
   cd payroll-system
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   cd ..
   ```

4. **Configure Environment Variables**

   Create `backend/.env`:
   ```bash
   # Server
   NODE_ENV=development
   PORT=5000

   # Database
   MONGODB_URI=mongodb://localhost:27017/payroll

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # JWT
   JWT_SECRET=your-super-secret-key-min-32-chars
   JWT_EXPIRY=24h

   # Razorpay
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   RAZORPAY_ACCOUNT_NUMBER=1112220105623456
   RAZORPAY_WEBHOOK_SECRET=xxxxx

   # Encryption
   BANK_ENCRYPTION_KEY=your-32-char-encryption-key

   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-specific-password
   ```

5. **Start Development Server**

   ```bash
   # Terminal 1: API
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

   Access:
   - API: http://localhost:5000
   - Frontend: http://localhost:3000

---

## Docker Deployment

### Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: payroll

  redis:
    image: redis:7.0
    ports:
      - "6379:6379"

  api:
    build: ./backend
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - redis
    environment:
      MONGODB_URI: mongodb://mongodb:27017/payroll
      REDIS_HOST: redis
      REDIS_PORT: 6379
      NODE_ENV: development
    volumes:
      - ./backend/src:/app/src

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - api
    environment:
      REACT_APP_API_URL: http://api:5000/api

volumes:
  mongodb_data:
```

Run:

```bash
docker-compose up --build
```

---

## Production Deployment

### AWS Deployment

#### 1. Create AWS RDS MongoDB

```bash
# Use MongoDB Atlas (recommended) or AWS DocumentDB
# Create cluster with:
# - Multi-AZ enabled
# - Automated backups (daily)
# - Encryption at rest enabled
```

#### 2. Create AWS ElastiCache (Redis)

```bash
# Create cluster with:
# - Multi-AZ enabled
# - Encryption enabled
# - Automated failover
```

#### 3. Deploy to EC2

```bash
# 1. Launch EC2 instance (t3.medium minimum)
# 2. Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repository
git clone https://github.com/yourcompany/payroll-system.git
cd payroll-system/backend

# 4. Install dependencies
npm install --production

# 5. Create .env with production values
nano .env

# 6. Start with PM2
npm install -g pm2
pm2 start npm --name "payroll-api" -- start
pm2 startup
pm2 save
```

#### 4. Configure Nginx

Create `/etc/nginx/sites-available/payroll`:

```nginx
upstream api {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name api.yourcompany.com;

    location / {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /webhooks {
        proxy_pass http://api;
        proxy_request_buffering off;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/payroll /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

#### 5. Setup SSL (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourcompany.com
```

#### 6. Configure Razorpay Webhook

In RazorpayX Dashboard:
- Webhooks → Add Webhook
- URL: `https://api.yourcompany.com/webhooks/razorpay`
- Events: `payout.processed`, `payout.failed`, `payout.reversed`
- Secret: Your RAZORPAY_WEBHOOK_SECRET

---

## Database Management

### MongoDB

```bash
# Backup database
mongodump --uri="mongodb://localhost:27017/payroll" --out=./backup

# Restore database
mongorestore --uri="mongodb://localhost:27017/payroll" ./backup

# Create indexes
db.employees.createIndex({ email: 1, deletedAt: 1 })
db.payrolls.createIndex({ month: 1, year: 1, companyId: 1 })
```

### Redis

```bash
# Connect to Redis
redis-cli

# Flush all (danger!)
FLUSHALL

# Monitor commands
MONITOR

# Check key count
DBSIZE
```

---

## Monitoring & Logging

### ELK Stack Setup

```bash
# 1. Start Elasticsearch
docker run -d --name elasticsearch \
  -e "discovery.type=single-node" \
  -p 9200:9200 docker.elastic.co/elasticsearch/elasticsearch:8.0.0

# 2. Start Kibana
docker run -d --name kibana \
  -p 5601:5601 \
  -e ELASTICSEARCH_HOSTS=http://elasticsearch:9200 \
  docker.elastic.co/kibana/kibana:8.0.0

# 3. Configure Winston logger in backend
npm install winston elasticsearch-connector
```

### Application Monitoring

```bash
# Install PM2 Plus
npm install -g pm2-plus
pm2 link YOUR_SECRET YOUR_PUBLIC_KEY

# Monitor from dashboard
# https://app.pm2.io
```

---

## Testing

### Unit Tests

```bash
npm test

# With coverage
npm test -- --coverage
```

### Integration Tests

```bash
npm run test:integration
```

### Load Testing

```bash
npm install -g artillery

artillery quick --count 100 --num 10 http://localhost:5000/api/health
```

---

## Troubleshooting

### Connection Refused

```bash
# Check if services are running
lsof -i :5000  # API
lsof -i :6379  # Redis
lsof -i :27017 # MongoDB
```

### Queue Jobs Stuck

```bash
# In Node.js console
const queue = require('./src/queues/payoutQueue').default;
await queue.clean(0);  // Remove all jobs
```

### Bank Encryption Errors

```bash
# Verify encryption key
echo $BANK_ENCRYPTION_KEY | wc -c  # Should be > 32
```

### Webhook Not Received

```bash
# 1. Check webhook secret matches
# 2. Verify URL is accessible
curl -X POST https://api.yourcompany.com/webhooks/razorpay
# Should return 200

# 3. Check Razorpay dashboard for webhook logs
```

---

## Security Checklist

- [ ] Change all default credentials
- [ ] Enable HTTPS/SSL everywhere
- [ ] Setup VPC and security groups
- [ ] Enable database encryption
- [ ] Rotate encryption keys monthly
- [ ] Setup WAF (Web Application Firewall)
- [ ] Enable audit logging
- [ ] Setup monitoring and alerts
- [ ] Regular security audits
- [ ] Penetration testing

---

## Performance Optimization

### Database Optimization

```javascript
// Create indexes
db.employees.createIndex({ status: 1, department: 1 })
db.payrolls.createIndex({ status: 1, companyId: 1 })
db.transactions.createIndex({ razorpayPayoutId: 1 })
```

### Caching Strategy

```javascript
// Cache salary structures for 1 hour
redis.setex('salary:structure:1', 3600, JSON.stringify(structure))
```

### Query Optimization

```javascript
// Good: Fetch only needed fields
Employee.find({}, 'firstName lastName email')

// Bad: Fetch all fields
Employee.find({})
```

---

## Backup & Disaster Recovery

### Automated Backups

```bash
# MongoDB backup daily
0 2 * * * /usr/bin/mongodump --uri="mongodb://..." --out=/backups/mongo-$(date +\%Y\%m\%d)

# S3 sync hourly
0 * * * * aws s3 sync /backups s3://your-bucket/backups --delete
```

### Restore Procedure

```bash
# 1. Restore MongoDB
mongorestore --uri="mongodb://..." /backups/mongo-backup

# 2. Restart services
pm2 restart all

# 3. Verify webhooks are reprocessed
```

---

## Support & Documentation

- API Docs: `./API_DOCUMENTATION.md`
- Architecture: `../PAYROLL_ARCHITECTURE.md`
- Razorpay Docs: https://razorpay.com/docs/payouts/
- MongoDB Docs: https://docs.mongodb.com/
- Redis Docs: https://redis.io/documentation

---

## Next Steps

1. ✅ Development setup complete
2. → Test with sandbox Razorpay account
3. → Load test with 1000+ employees
4. → Deploy to staging environment
5. → Final security audit
6. → Production deployment
7. → Monitor and optimize

