/**
 * Payroll Page Component
 * Manage payroll runs, approvals, and payments
 */

import React, { useState, useEffect } from 'react';
import './PayrollPage.css';

interface PayrollRun {
    id: string;
    month: number;
    year: number;
    status: 'draft' | 'submitted' | 'hr_approved' | 'finance_approved' | 'processing' | 'completed' | 'failed';
    totalAmount: number;
    employeeCount: number;
    createdDate: string;
    processedDate?: string;
    hrApprovedBy?: string;
    financeApprovedBy?: string;
}

interface PayrollStats {
    totalEmployees: number;
    totalAmount: number;
    averageSalary: number;
    lastProcessedDate?: string;
}

const PayrollPage: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([
        {
            id: 'PR001',
            month: 1,
            year: 2024,
            status: 'completed',
            totalAmount: 1500000,
            employeeCount: 45,
            createdDate: '2024-01-01',
            processedDate: '2024-01-31',
            hrApprovedBy: 'Rakesh Singh',
            financeApprovedBy: 'Priya Verma'
        },
        {
            id: 'PR002',
            month: 2,
            year: 2024,
            status: 'finance_approved',
            totalAmount: 1510000,
            employeeCount: 45,
            createdDate: '2024-02-01',
            hrApprovedBy: 'Rakesh Singh',
            financeApprovedBy: 'Priya Verma'
        },
        {
            id: 'PR003',
            month: 3,
            year: 2024,
            status: 'hr_approved',
            totalAmount: 1520000,
            employeeCount: 45,
            createdDate: '2024-03-01',
            hrApprovedBy: 'Rakesh Singh'
        }
    ]);

    const [stats, setStats] = useState<PayrollStats>({
        totalEmployees: 45,
        totalAmount: 1500000,
        averageSalary: 33333,
        lastProcessedDate: '2024-02-29'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        // TODO: Fetch payroll data from API
        // fetchPayrollData();
    }, [selectedMonth, selectedYear]);

    const handleRunPayroll = async () => {
        setLoading(true);
        setError(null);
        try {
            // TODO: Call API to run payroll
            // const response = await payrollService.runPayroll({ month: selectedMonth, year: selectedYear });
            setSuccessMessage(`Payroll for ${selectedMonth}/${selectedYear} started processing...`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('Failed to run payroll. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprovePayroll = async (payrollId: string, approvalType: 'hr' | 'finance') => {
        setLoading(true);
        setError(null);
        try {
            // TODO: Call API to approve payroll
            // await payrollService.approvePayroll(payrollId, approvalType);
            const updatedRuns = payrollRuns.map(run => {
                if (run.id === payrollId) {
                    return {
                        ...run,
                        status: approvalType === 'hr' ? ('hr_approved' as const) : ('finance_approved' as const)
                    };
                }
                return run;
            });
            setPayrollRuns(updatedRuns);
            setSuccessMessage(`Payroll ${approvalType.toUpperCase()} approved successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('Failed to approve payroll. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayment = async (payrollId: string) => {
        setLoading(true);
        setError(null);
        try {
            // TODO: Call API to trigger payout
            // await payrollService.triggerPayout(payrollId);
            const updatedRuns = payrollRuns.map(run => {
                if (run.id === payrollId) {
                    return {
                        ...run,
                        status: 'processing' as const
                    };
                }
                return run;
            });
            setPayrollRuns(updatedRuns);
            setSuccessMessage('Payout processing started...');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('Failed to process payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'draft':
                return 'status-draft';
            case 'submitted':
                return 'status-submitted';
            case 'hr_approved':
                return 'status-hr-approved';
            case 'finance_approved':
                return 'status-finance-approved';
            case 'processing':
                return 'status-processing';
            case 'completed':
                return 'status-completed';
            case 'failed':
                return 'status-failed';
            default:
                return 'status-draft';
        }
    };

    const getStatusLabel = (status: string): string => {
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    return (
        <div className="payroll-page">
            <div className="page-header">
                <h1>Payroll Management</h1>
                <p>Process, approve, and manage employee salary payments</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {successMessage && (
                <div className="alert alert-success">
                    <strong>Success:</strong> {successMessage}
                </div>
            )}

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Employees</h3>
                    <p className="stat-value">{stats.totalEmployees}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Payroll</h3>
                    <p className="stat-value">₹{stats.totalAmount.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <h3>Average Salary</h3>
                    <p className="stat-value">₹{stats.averageSalary.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <h3>Last Processed</h3>
                    <p className="stat-value-date">{stats.lastProcessedDate || 'N/A'}</p>
                </div>
            </div>

            {/* Period Selection and Run Payroll */}
            <div className="payroll-controls">
                <div className="period-selector">
                    <div className="selector-group">
                        <label>Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="selector-input"
                        >
                            {months.map((month, index) => (
                                <option key={index} value={index + 1}>
                                    {month}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="selector-group">
                        <label>Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="selector-input"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleRunPayroll}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? 'Processing...' : 'Run Payroll'}
                    </button>
                </div>
            </div>

            {/* Payroll Runs Table */}
            <div className="payroll-table-container">
                <table className="payroll-table">
                    <thead>
                        <tr>
                            <th>Payroll ID</th>
                            <th>Period</th>
                            <th>Status</th>
                            <th>Employees</th>
                            <th>Total Amount</th>
                            <th>Created Date</th>
                            <th>Approvals</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrollRuns.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="empty-state">
                                    No payroll runs found for the selected period
                                </td>
                            </tr>
                        ) : (
                            payrollRuns.map((run) => (
                                <tr key={run.id}>
                                    <td className="payroll-id">{run.id}</td>
                                    <td>{months[run.month - 1]} {run.year}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(run.status)}`}>
                                            {getStatusLabel(run.status)}
                                        </span>
                                    </td>
                                    <td>{run.employeeCount}</td>
                                    <td className="amount">₹{run.totalAmount.toLocaleString()}</td>
                                    <td>{new Date(run.createdDate).toLocaleDateString()}</td>
                                    <td className="approvals">
                                        <span className={`approval ${run.hrApprovedBy ? 'approved' : 'pending'}`}>
                                            HR: {run.hrApprovedBy ? '✓' : '○'}
                                        </span>
                                        <span className={`approval ${run.financeApprovedBy ? 'approved' : 'pending'}`}>
                                            FIN: {run.financeApprovedBy ? '✓' : '○'}
                                        </span>
                                    </td>
                                    <td className="actions">
                                        {run.status === 'submitted' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprovePayroll(run.id, 'hr')}
                                                    className="btn-small btn-primary"
                                                    disabled={loading}
                                                >
                                                    HR Approve
                                                </button>
                                                <button
                                                    onClick={() => handleApprovePayroll(run.id, 'finance')}
                                                    className="btn-small btn-secondary"
                                                    disabled={loading}
                                                >
                                                    Fin Approve
                                                </button>
                                            </>
                                        )}
                                        {run.status === 'hr_approved' && (
                                            <button
                                                onClick={() => handleApprovePayroll(run.id, 'finance')}
                                                className="btn-small btn-primary"
                                                disabled={loading}
                                            >
                                                Finance Approve
                                            </button>
                                        )}
                                        {run.status === 'finance_approved' && (
                                            <button
                                                onClick={() => handleProcessPayment(run.id)}
                                                className="btn-small btn-success"
                                                disabled={loading}
                                            >
                                                Process Payout
                                            </button>
                                        )}
                                        {run.status === 'completed' && (
                                            <button
                                                className="btn-small btn-secondary"
                                                onClick={() => console.log('View payslips for', run.id)}
                                            >
                                                View Payslips
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Workflow Info */}
            <div className="workflow-info">
                <h3>Payroll Workflow</h3>
                <div className="workflow-steps">
                    <div className="step">
                        <span className="step-number">1</span>
                        <span className="step-label">Run Payroll</span>
                    </div>
                    <div className="arrow">→</div>
                    <div className="step">
                        <span className="step-number">2</span>
                        <span className="step-label">HR Approval</span>
                    </div>
                    <div className="arrow">→</div>
                    <div className="step">
                        <span className="step-number">3</span>
                        <span className="step-label">Finance Approval</span>
                    </div>
                    <div className="arrow">→</div>
                    <div className="step">
                        <span className="step-number">4</span>
                        <span className="step-label">Process Payout</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayrollPage;
