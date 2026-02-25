# Backend CORS Configuration Fix

## Issue
The frontend is getting a "Network Error" when trying to login. This is typically a CORS (Cross-Origin Resource Sharing) issue.

## Solution

Your backend server needs to enable CORS to allow requests from the frontend running on a different origin.

### For Node.js/Express Backend

1. **Install CORS package** (if not already installed):
```bash
npm install cors
```

2. **Update your main server file** (e.g., `server.js` or `index.js`):

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',           // Local development
    'https://59cwtf0p-5001.inc1.devtunnels.ms'  // DevTunnels frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Your other middleware and routes
app.use(express.json());

// Your API routes here...

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

3. **Alternative: Using Express middleware directly**:

```javascript
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://59cwtf0p-5001.inc1.devtunnels.ms'
  ];
  
  if (allowedOrigins.includes(req.headers.origin)) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

### Frontend Configuration (Already Updated)

✅ Frontend has been updated to:
- Centralize API configuration in `/src/config/api.ts`
- Remove hardcoded localhost URLs
- Add axios interceptors for proper error handling
- Use environment variables for API base URL

## Testing

1. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. **Restart both backend and frontend servers**
3. **Try logging in again**

## API Endpoints Required

Ensure these endpoints exist on your backend:

- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `GET /api/dashboard` - Dashboard data
- `GET/POST /api/employees` - Employee management
- `GET/POST /api/departments` - Department management
- `GET/POST /api/attendance` - Attendance tracking
- `GET/POST /api/leaves` - Leave management
- `GET/POST /api/payroll` - Payroll processing

All endpoints should accept `Authorization: Bearer <token>` header for authenticated requests.
