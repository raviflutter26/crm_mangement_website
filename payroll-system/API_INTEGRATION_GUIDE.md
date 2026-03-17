# API Integration Guide

This guide covers how to connect the frontend components to the backend API services.

## Current Status

### Services Already Available
- ✅ `ApiClient` - Generic HTTP wrapper with Bearer token injection
- ✅ `AuthService` - Authentication (login, signup, logout, profile, refresh)
- ✅ `PayrollService` - All payroll endpoints
- ✅ `useAuth` hook - React hook for authentication state

### Components Needing Integration
- ⏳ EmployeesPage - fetch employees list
- ⏳ PayrollPage - fetch payroll runs, create, approve, process
- ⏳ ReportsPage - fetch reports, export functionality
- ⏳ Signup flow in LoginPage - connect to useAuth hook

## Integration Patterns

### Pattern 1: Using Services Directly in Components

**Example: EmployeesPage**

```typescript
// Before (mock data)
const [employees, setEmployees] = useState<Employee[]>([
    { employeeId: 'EMP001', ... },
    // mock data
]);

// After (API call)
const [employees, setEmployees] = useState<Employee[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await payrollService.getEmployees(); // Needs to be implemented in backend
            setEmployees(data);
        } catch (err) {
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };
    
    fetchEmployees();
}, []);

// Show loading state
if (loading) return <div>Loading...</div>;
if (error) return <div className="alert alert-error">{error}</div>;
```

### Pattern 2: Using React Hooks for State Management

**Example: Create a usePayroll Hook**

```typescript
// frontend/src/hooks/usePayroll.ts
import { useState, useCallback } from 'react';
import payrollService from '../services/payroll';

interface UsePayrollState {
  payrolls: PayrollRun[];
  loading: boolean;
  error: string | null;
}

export const usePayroll = () => {
  const [state, setState] = useState<UsePayrollState>({
    payrolls: [],
    loading: false,
    error: null
  });

  const fetchPayrolls = useCallback(async (month: number, year: number) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const data = await payrollService.getPayrollDetails(month, year);
      setState(prev => ({ ...prev, payrolls: data, error: null }));
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to fetch payroll' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  return { ...state, fetchPayrolls };
};

// Usage in PayrollPage
const { payrolls, loading, error, fetchPayrolls } = usePayroll();

useEffect(() => {
  fetchPayrolls(selectedMonth, selectedYear);
}, [selectedMonth, selectedYear, fetchPayrolls]);
```

### Pattern 3: Form Submission with API

**Example: LoginPage Signup**

```typescript
// Before (stub)
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  console.warn('Signup functionality not yet connected');
};

// After (connected)
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setLocalError(null);

  // Validation
  if (formData.password !== formData.confirmPassword) {
    setLocalError('Passwords do not match');
    return;
  }
  if (formData.password.length < 8) {
    setLocalError('Password must be at least 8 characters');
    return;
  }

  try {
    // Call hook method
    await hook.signup(formData.email, formData.password, formData.firstName, formData.lastName);
    onLoginSuccess?.();
  } catch (error) {
    setLocalError((error as Error).message);
  }
};
```

### Pattern 4: Table Data Fetching

**Example: PayrollPage**

```typescript
useEffect(() => {
  const loadPayrollRuns = async () => {
    setLoading(true);
    try {
      // TODO: Implement backend endpoint
      // const runs = await payrollService.getPayrollRuns(selectedMonth, selectedYear);
      // setPayrollRuns(runs);
      console.log('Fetching payroll runs for', selectedMonth, '/', selectedYear);
    } catch (error) {
      setError('Failed to load payroll runs');
    } finally {
      setLoading(false);
    }
  };

  loadPayrollRuns();
}, [selectedMonth, selectedYear]);
```

## Backend Endpoints Needed

### Missing Endpoints to Implement

The following endpoints are used by the UI but don't exist in the backend yet:

#### Employee Management
- `GET /api/employees` - Get all employees (with search/filter)
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

#### Payroll Management
- `GET /api/payroll` - Get payroll runs (with filters)
- `POST /api/payroll/run` - Create/run payroll
- `GET /api/payroll/:id` - Get payroll details
- `POST /api/payroll/:id/approve` - Approve payroll
- `POST /api/payroll/:id/payout` - Trigger payout

#### Reports
- `GET /api/reports/tax` - Get tax report
- `GET /api/reports/compliance` - Get compliance status
- `GET /api/reports/analytics` - Get analytics data
- `POST /api/reports/export` - Export report as PDF/Excel/CSV

#### Bank Accounts
- `GET /api/employees/:id/bank` - Get employee bank details
- `POST /api/employees/:id/bank` - Add/update bank details
- `PUT /api/employees/:id/bank/verify` - Verify bank account
- `DELETE /api/employees/:id/bank` - Delete bank account

## Step-by-Step Integration Checklist

### Week 1: Core Integration
- [ ] Add missing endpoints to backend
- [ ] Connect LoginPage signup to useAuth hook
- [ ] Create usePayroll hook
- [ ] Integrate EmployeesPage with API
- [ ] Add loading/error states to all components
- [ ] Test all API calls with mock delays

### Week 2: Advanced Features
- [ ] Implement pagination for large datasets
- [ ] Add search/filter on backend
- [ ] Implement real-time status polling
- [ ] Add data caching with localStorage
- [ ] Create toast notifications for actions

### Week 3: Refinement
- [ ] Add optimistic updates
- [ ] Implement error recovery
- [ ] Add retry logic for failed requests
- [ ] Create request cancellation
- [ ] Add analytics/logging

## Error Handling Best Practices

### Always Wrap API Calls
```typescript
try {
  const result = await apiService.call();
} catch (error) {
  if (error instanceof Error) {
    setError(error.message);
  } else {
    setError('An unknown error occurred');
  }
}
```

### Use Error Boundaries
```typescript
// Already wrapped in app - catches:
// - React component errors
// - Event handler errors
// - Async errors in lifecycle
```

### Provide User Feedback
```typescript
// Always show:
// - Loading state
// - Error message
// - Success confirmation
// - Retry option if failed
```

## API Response Format

All responses follow a standard format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}
```

## Common Issues & Solutions

### Issue: Token Not Sent
**Solution**: Verify ApiClient getAuthHeader() is called before every request

### Issue: CORS Errors
**Solution**: Check CORS configuration in backend/app.ts

### Issue: 401 Unauthorized
**Solution**: Token expired - implement refresh flow in useAuth hook

### Issue: Components Still Showing Mock Data
**Solution**: Verify you removed mock state and added useEffect to fetch real data

### Issue: Form Submissions Failing
**Solution**: Check form validation and error messages in console

## Testing API Integration

### Manual Testing
1. Open browser DevTools → Network tab
2. Perform action in UI
3. Check network request in Network tab
4. Verify response status and payload
5. Check component state updated correctly

### Automated Testing (Todo)
```typescript
// Use Vitest + React Testing Library
describe('EmployeesPage', () => {
  test('fetches and displays employees', async () => {
    const mock = vi.spyOn(payrollService, 'getEmployees');
    mock.mockResolvedValue([...]);
    
    render(<EmployeesPage />);
    await waitFor(() => {
      expect(screen.getByText('Employee Name')).toBeInTheDocument();
    });
  });
});
```

## Quick Reference: Service Methods

### AuthService
```typescript
await authService.login(email, password);
await authService.signup(email, password, firstName, lastName);
await authService.logout();
await authService.getProfile();
await authService.refreshToken();
authService.getToken();
authService.isAuthenticated();
```

### PayrollService
```typescript
await payrollService.runPayroll({ month, year });
await payrollService.getPayrollDetails(month, year);
await payrollService.approvePayroll(payrollId);
await payrollService.triggerPayout(payrollId);
await payrollService.getPayoutStatus(payrollId);
await payrollService.getPayslips(employeeId);
await payrollService.downloadPayslip(payslipId);
await payrollService.getPayrollSummary(startDate, endDate);
await payrollService.getTaxReport(financialYear);
await payrollService.addBankAccount(employeeId, bankData);
await payrollService.getBankAccount(employeeId);
```

## Logging & Debugging

Enable debug logging in frontend/.env:
```
VITE_DEBUG=true
```

Then check console for detailed API logs:
```typescript
// In api.ts
if (import.meta.env.VITE_DEBUG) {
  console.log('[API]', method, url, data);
}
```

## Next Session Plan

1. **Backend**: Implement missing endpoints
2. **Frontend**: Connect UI to real API calls
3. **Integration**: End-to-end testing
4. **Deployment**: Docker & environment setup
5. **Documentation**: User guides & API docs

---

**Last Updated**: Session 3 Complete
**Status**: Ready for API Integration Phase
