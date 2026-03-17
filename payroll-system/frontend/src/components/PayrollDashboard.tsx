import React, { useState, useEffect } from 'react';

/**
 * Payroll Dashboard Component
 * Main dashboard showing payroll overview and key metrics
 */

interface DashboardMetrics {
    totalEmployees: number;
    totalPayrollAmount: number;
    paidEmployees: number;
    pendingPayments: number;
    failedTransactions: number;
}

const PayrollDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalEmployees: 0,
        totalPayrollAmount: 0,
        paidEmployees: 0,
        pendingPayments: 0,
        failedTransactions: 0,
    });

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'run-payroll' | 'approve' | 'history'>('overview');

    useEffect(() => {
        fetchDashboardMetrics();
    }, []);

    const fetchDashboardMetrics = async () => {
        try {
            setLoading(true);

            const response = await fetch('/api/reports/payroll', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const data = await response.json();

            setMetrics({
                totalEmployees: data.data.totalEmployees,
                totalPayrollAmount: data.data.totalPayrolAmount,
                paidEmployees: data.data.statistics?.find((s: any) => s._id === 'processed')?.count || 0,
                pendingPayments: data.data.statistics?.find((s: any) => s._id === 'pending')?.count || 0,
                failedTransactions: data.data.statistics?.find((s: any) => s._id === 'failed')?.count || 0,
            });
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ color: '#333', marginBottom: '10px' }}>Payroll Dashboard</h1>
                <p style={{ color: '#666' }}>Manage payroll, approvals, and track payments in real-time</p>
            </div>

            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {/* Total Employees */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #2196F3',
                }}>
                    <h3 style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'normal' }}>Total Employees</h3>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{metrics.totalEmployees}</p>
                    <p style={{ margin: '10px 0 0 0', color: '#999', fontSize: '12px' }}>Active employees in system</p>
                </div>

                {/* Total Payroll Amount */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #4CAF50',
                }}>
                    <h3 style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'normal' }}>Total Payroll</h3>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{formatCurrency(metrics.totalPayrollAmount)}</p>
                    <p style={{ margin: '10px 0 0 0', color: '#999', fontSize: '12px' }}>This month's total</p>
                </div>

                {/* Paid Employees */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #8BC34A',
                }}>
                    <h3 style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'normal' }}>Paid Employees</h3>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{metrics.paidEmployees}</p>
                    <p style={{ margin: '10px 0 0 0', color: '#999', fontSize: '12px' }}>Successfully processed</p>
                </div>

                {/* Pending Payments */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #FF9800',
                }}>
                    <h3 style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'normal' }}>Pending Payments</h3>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{metrics.pendingPayments}</p>
                    <p style={{ margin: '10px 0 0 0', color: '#999', fontSize: '12px' }}>In progress</p>
                </div>

                {/* Failed Transactions */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #f44336',
                }}>
                    <h3 style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'normal' }}>Failed Payments</h3>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{metrics.failedTransactions}</p>
                    <p style={{ margin: '10px 0 0 0', color: '#999', fontSize: '12px' }}>Requires attention</p>
                </div>

                {/* Success Rate */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #9C27B0',
                }}>
                    <h3 style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'normal' }}>Success Rate</h3>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                        {metrics.totalEmployees > 0 ? ((metrics.paidEmployees / metrics.totalEmployees) * 100).toFixed(1) : 0}%
                    </p>
                    <p style={{ margin: '10px 0 0 0', color: '#999', fontSize: '12px' }}>Payment success rate</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                borderBottom: '1px solid #ddd',
            }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        backgroundColor: activeTab === 'overview' ? '#2196F3' : 'transparent',
                        color: activeTab === 'overview' ? 'white' : '#666',
                        cursor: 'pointer',
                        borderRadius: '4px 4px 0 0',
                        fontSize: '14px',
                        fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
                    }}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('run-payroll')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        backgroundColor: activeTab === 'run-payroll' ? '#2196F3' : 'transparent',
                        color: activeTab === 'run-payroll' ? 'white' : '#666',
                        cursor: 'pointer',
                        borderRadius: '4px 4px 0 0',
                        fontSize: '14px',
                        fontWeight: activeTab === 'run-payroll' ? 'bold' : 'normal',
                    }}
                >
                    Run Payroll
                </button>
                <button
                    onClick={() => setActiveTab('approve')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        backgroundColor: activeTab === 'approve' ? '#2196F3' : 'transparent',
                        color: activeTab === 'approve' ? 'white' : '#666',
                        cursor: 'pointer',
                        borderRadius: '4px 4px 0 0',
                        fontSize: '14px',
                        fontWeight: activeTab === 'approve' ? 'bold' : 'normal',
                    }}
                >
                    Approvals
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        backgroundColor: activeTab === 'history' ? '#2196F3' : 'transparent',
                        color: activeTab === 'history' ? 'white' : '#666',
                        cursor: 'pointer',
                        borderRadius: '4px 4px 0 0',
                        fontSize: '14px',
                        fontWeight: activeTab === 'history' ? 'bold' : 'normal',
                    }}
                >
                    History
                </button>
            </div>

            {/* Tab Content */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
                {activeTab === 'overview' && (
                    <div>
                        <h2 style={{ color: '#333', marginTop: 0 }}>Payroll Overview</h2>
                        <p style={{ color: '#666' }}>
                            Current month payroll status and key metrics are displayed above.
                            Click on the tabs to manage payroll, approvals, or view history.
                        </p>
                    </div>
                )}

                {activeTab === 'run-payroll' && (
                    <RunPayrollSection />
                )}

                {activeTab === 'approve' && (
                    <ApprovalSection />
                )}

                {activeTab === 'history' && (
                    <PayrollHistory />
                )}
            </div>
        </div>
    );
};

/**
 * Run Payroll Section Component
 */
const RunPayrollSection: React.FC = () => {
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    const handleRunPayroll = async () => {
        try {
            setLoading(true);

            const response = await fetch('/api/payroll/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ month, year, companyId: 'your-company-id' }),
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Payroll calculated successfully!\n\nPayroll Run ID: ${data.data.payrollRunId}\nEmployees: ${data.data.totalEmployees}\nTotal Amount: ₹${data.data.totalPayrolAmount}`);
            } else {
                alert(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            alert(`Error: ${(error as any).message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ color: '#333', marginTop: 0 }}>Run Payroll</h2>
            <form style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>Month</label>
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                        }}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                            <option key={m} value={m}>
                                {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>Year</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                        }}
                    >
                        {[2024, 2025, 2026].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={handleRunPayroll}
                    disabled={loading}
                    style={{
                        padding: '8px 20px',
                        backgroundColor: loading ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginTop: '23px',
                    }}
                >
                    {loading ? 'Processing...' : 'Run Payroll'}
                </button>
            </form>
        </div>
    );
};

/**
 * Approval Section Component
 */
const ApprovalSection: React.FC = () => {
    return (
        <div>
            <h2 style={{ color: '#333', marginTop: 0 }}>Payroll Approvals</h2>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '15px',
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Payroll ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Period</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Employees</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', color: '#666' }}>PAYROLL-2024-02-123456</td>
                        <td style={{ padding: '12px', color: '#666' }}>February 2024</td>
                        <td style={{ padding: '12px', color: '#666' }}>250</td>
                        <td style={{ padding: '12px' }}>
                            <span style={{
                                backgroundColor: '#fff3cd',
                                color: '#856404',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                            }}>Pending Finance Approval</span>
                        </td>
                        <td style={{ padding: '12px' }}>
                            <button style={{
                                padding: '6px 12px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                            }}>
                                Approve
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

/**
 * Payroll History Component
 */
const PayrollHistory: React.FC = () => {
    return (
        <div>
            <h2 style={{ color: '#333', marginTop: 0 }}>Payroll History</h2>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '15px',
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Payroll ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Period</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Employees</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Amount</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', color: '#666' }}>PAYROLL-2024-01-123456</td>
                        <td style={{ padding: '12px', color: '#666' }}>January 2024</td>
                        <td style={{ padding: '12px', color: '#666' }}>250</td>
                        <td style={{ padding: '12px', color: '#666' }}>₹12,500,000</td>
                        <td style={{ padding: '12px' }}>
                            <span style={{
                                backgroundColor: '#d4edda',
                                color: '#155724',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                            }}>✓ Completed</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default PayrollDashboard;
