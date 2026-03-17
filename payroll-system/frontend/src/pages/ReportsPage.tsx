/**
 * Reports Page Component
 * View tax reports, compliance reports, and payroll analytics
 */

import React, { useState } from 'react';
import './ReportsPage.css';

interface TaxReport {
    employeeId: string;
    employeeName: string;
    email: string;
    totalGross: number;
    basicSalary: number;
    da: number;
    hra: number;
    medical: number;
    conveyance: number;
    totalDeductions: number;
    professionalTax: number;
    providentFund: number;
    incomeTax: number;
    netSalary: number;
    financialYear: string;
}

interface ReportStats {
    totalTaxCollected: number;
    totalPFCollected: number;
    averageTax: number;
    employeesReported: number;
}

interface ComplianceItem {
    id: string;
    name: string;
    status: 'compliant' | 'pending' | 'non-compliant';
    description: string;
    lastChecked: string;
}

const ReportsPage: React.FC = () => {
    const [reportType, setReportType] = useState<'tax' | 'compliance' | 'analytics'>('tax');
    const [dateFrom, setDateFrom] = useState('2024-01-01');
    const [dateTo, setDateTo] = useState('2024-12-31');
    const [selectedFinancialYear, setSelectedFinancialYear] = useState('2023-24');
    const [loading, setLoading] = useState(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('excel');

    const [taxReports, setTaxReports] = useState<TaxReport[]>([
        {
            employeeId: 'EMP001',
            employeeName: 'Rajesh Kumar',
            email: 'rajesh@company.com',
            totalGross: 600000,
            basicSalary: 300000,
            da: 90000,
            hra: 75000,
            medical: 20000,
            conveyance: 15000,
            totalDeductions: 180000,
            professionalTax: 2400,
            providentFund: 120000,
            incomeTax: 57600,
            netSalary: 420000,
            financialYear: '2023-24'
        },
        {
            employeeId: 'EMP002',
            employeeName: 'Priya Singh',
            email: 'priya@company.com',
            totalGross: 750000,
            basicSalary: 375000,
            da: 112500,
            hra: 93750,
            medical: 25000,
            conveyance: 16875,
            totalDeductions: 225000,
            professionalTax: 2400,
            providentFund: 150000,
            incomeTax: 72600,
            netSalary: 525000,
            financialYear: '2023-24'
        },
        {
            employeeId: 'EMP003',
            employeeName: 'Amit Patel',
            email: 'amit@company.com',
            totalGross: 550000,
            basicSalary: 275000,
            da: 82500,
            hra: 68750,
            medical: 18000,
            conveyance: 13750,
            totalDeductions: 165000,
            professionalTax: 2400,
            providentFund: 110000,
            incomeTax: 52560,
            netSalary: 385000,
            financialYear: '2023-24'
        }
    ]);

    const [stats, setStats] = useState<ReportStats>({
        totalTaxCollected: 1890000,
        totalPFCollected: 3780000,
        averageTax: 630000,
        employeesReported: 45
    });

    const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([
        {
            id: 'C001',
            name: 'PF Submissions',
            status: 'compliant',
            description: 'All PF contributions submitted on time',
            lastChecked: '2024-03-15'
        },
        {
            id: 'C002',
            name: 'Income Tax Filing',
            status: 'pending',
            description: 'Pending IT filing for FY 2023-24',
            lastChecked: '2024-03-10'
        },
        {
            id: 'C003',
            name: 'Labor Compliance',
            status: 'compliant',
            description: 'All labor laws complied',
            lastChecked: '2024-03-12'
        },
        {
            id: 'C004',
            name: 'ESI Submissions',
            status: 'compliant',
            description: 'ESI contributions up to date',
            lastChecked: '2024-03-14'
        },
        {
            id: 'C005',
            name: 'Form 12BA',
            status: 'non-compliant',
            description: 'TDS certification pending',
            lastChecked: '2024-03-08'
        }
    ]);

    const handleExportReport = async () => {
        setLoading(true);
        try {
            // TODO: Call API to export report
            // const data = await reportService.exportReport({ reportType, dateFrom, dateTo, format: exportFormat });
            console.log(`Exporting ${reportType} report as ${exportFormat}`);
            alert(`Report exported as ${exportFormat.toUpperCase()}`);
        } catch (err) {
            alert('Failed to export report');
        } finally {
            setLoading(false);
        }
    };

    const getComplianceStatusColor = (status: string): string => {
        switch (status) {
            case 'compliant':
                return 'status-compliant';
            case 'pending':
                return 'status-compliance-pending';
            case 'non-compliant':
                return 'status-non-compliant';
            default:
                return 'status-pending';
        }
    };

    return (
        <div className="reports-page">
            <div className="page-header">
                <h1>Reports & Compliance</h1>
                <p>View tax reports, compliance status, and payroll analytics</p>
            </div>

            {/* Report Type Selector */}
            <div className="report-selector">
                <div className="selector-buttons">
                    <button
                        className={`selector-btn ${reportType === 'tax' ? 'active' : ''}`}
                        onClick={() => setReportType('tax')}
                    >
                        Tax Report
                    </button>
                    <button
                        className={`selector-btn ${reportType === 'compliance' ? 'active' : ''}`}
                        onClick={() => setReportType('compliance')}
                    >
                        Compliance
                    </button>
                    <button
                        className={`selector-btn ${reportType === 'analytics' ? 'active' : ''}`}
                        onClick={() => setReportType('analytics')}
                    >
                        Analytics
                    </button>
                </div>
            </div>

            {/* Tax Report Section */}
            {reportType === 'tax' && (
                <div className="report-section">
                    <div className="report-controls">
                        <div className="control-group">
                            <label>Financial Year</label>
                            <select
                                value={selectedFinancialYear}
                                onChange={(e) => setSelectedFinancialYear(e.target.value)}
                                className="control-input"
                            >
                                <option value="2023-24">2023-24</option>
                                <option value="2022-23">2022-23</option>
                                <option value="2021-22">2021-22</option>
                            </select>
                        </div>

                        <div className="control-group">
                            <label>Export as</label>
                            <select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv' | 'excel')}
                                className="control-input"
                            >
                                <option value="excel">Excel</option>
                                <option value="csv">CSV</option>
                                <option value="pdf">PDF</option>
                            </select>
                        </div>

                        <button
                            onClick={handleExportReport}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Exporting...' : 'Export Report'}
                        </button>
                    </div>

                    <div className="tax-stats">
                        <div className="tax-stat-card">
                            <h4>Total Gross Salary</h4>
                            <p className="stat-value">₹{(stats.employeesReported * 625000).toLocaleString()}</p>
                        </div>
                        <div className="tax-stat-card">
                            <h4>Total Tax Collected</h4>
                            <p className="stat-value">₹{stats.totalTaxCollected.toLocaleString()}</p>
                        </div>
                        <div className="tax-stat-card">
                            <h4>Total PF Collected</h4>
                            <p className="stat-value">₹{stats.totalPFCollected.toLocaleString()}</p>
                        </div>
                        <div className="tax-stat-card">
                            <h4>Employees Reported</h4>
                            <p className="stat-value">{stats.employeesReported}</p>
                        </div>
                    </div>

                    <div className="tax-table-container">
                        <table className="tax-table">
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Total Gross</th>
                                    <th>Deductions</th>
                                    <th>Income Tax</th>
                                    <th>PF</th>
                                    <th>Professional Tax</th>
                                    <th>Net Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taxReports.map((report) => (
                                    <tr key={report.employeeId}>
                                        <td className="emp-id">{report.employeeId}</td>
                                        <td>{report.employeeName}</td>
                                        <td className="amount">₹{report.totalGross.toLocaleString()}</td>
                                        <td className="amount">₹{report.totalDeductions.toLocaleString()}</td>
                                        <td className="amount">₹{report.incomeTax.toLocaleString()}</td>
                                        <td className="amount">₹{report.providentFund.toLocaleString()}</td>
                                        <td className="amount">₹{report.professionalTax.toLocaleString()}</td>
                                        <td className="net-salary">₹{report.netSalary.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Compliance Section */}
            {reportType === 'compliance' && (
                <div className="report-section">
                    <div className="compliance-cards">
                        {/* Compliance Summary */}
                        <div className="compliance-summary">
                            <h3>Compliance Overview</h3>
                            <div className="compliance-stats">
                                <div className="compliance-stat">
                                    <span className="stat-label">Compliant</span>
                                    <span className="stat-count compliant">
                                        {complianceItems.filter(c => c.status === 'compliant').length}
                                    </span>
                                </div>
                                <div className="compliance-stat">
                                    <span className="stat-label">Pending</span>
                                    <span className="stat-count pending">
                                        {complianceItems.filter(c => c.status === 'pending').length}
                                    </span>
                                </div>
                                <div className="compliance-stat">
                                    <span className="stat-label">Non-Compliant</span>
                                    <span className="stat-count non-compliant">
                                        {complianceItems.filter(c => c.status === 'non-compliant').length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Compliance Details */}
                        <div className="compliance-list">
                            {complianceItems.map((item) => (
                                <div key={item.id} className="compliance-item">
                                    <div className="compliance-header">
                                        <h4>{item.name}</h4>
                                        <span className={`compliance-badge ${getComplianceStatusColor(item.status)}`}>
                                            {item.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="compliance-description">{item.description}</p>
                                    <span className="compliance-date">Last checked: {item.lastChecked}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Section */}
            {reportType === 'analytics' && (
                <div className="report-section">
                    <div className="analytics-grid">
                        <div className="date-filter">
                            <h3>Payroll Analytics</h3>

                            <div className="filter-group">
                                <label>From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            <div className="filter-group">
                                <label>To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>

                            <button onClick={handleExportReport} disabled={loading} className="btn btn-primary">
                                {loading ? 'Loading...' : 'Generate Analytics'}
                            </button>
                        </div>

                        <div className="analytics-content">
                            <div className="analytics-card">
                                <h4>Salary Distribution</h4>
                                <div className="chart-placeholder">
                                    <p>Chart visualization would appear here</p>
                                    <p className="sub-text">(Implementation requires charting library like Chart.js or Recharts)</p>
                                </div>
                            </div>

                            <div className="analytics-card">
                                <h4>Department-wise Payroll</h4>
                                <div className="chart-placeholder">
                                    <ul className="analytics-list">
                                        <li><span>Sales:</span> ₹18,75,000</li>
                                        <li><span>Operations:</span> ₹15,00,000</li>
                                        <li><span>IT:</span> ₹22,50,000</li>
                                        <li><span>HR:</span> ₹7,50,000</li>
                                        <li><span>Finance:</span> ₹9,00,000</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="analytics-card">
                                <h4>Deduction Breakdown</h4>
                                <div className="chart-placeholder">
                                    <ul className="analytics-list">
                                        <li><span>Income Tax:</span> 45%</li>
                                        <li><span>PF:</span> 35%</li>
                                        <li><span>Professional Tax:</span> 2%</li>
                                        <li><span>Other:</span> 18%</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
