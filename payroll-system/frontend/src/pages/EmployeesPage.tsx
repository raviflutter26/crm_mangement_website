/**
 * Employees Page Component
 * Manage employee records
 */

import { useState, useEffect } from 'react';
import './EmployeesPage.css';

interface Employee {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    designation: string;
    dateOfJoining: string;
    bankStatus?: 'verified' | 'pending' | 'failed';
}

export const EmployeesPage = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        designation: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
    });

    // Fetch employees
    useEffect(() => {
        // TODO: Fetch from API
        // For now, use mock data
        const mockEmployees: Employee[] = [
            {
                employeeId: 'EMP001',
                firstName: 'Rajesh',
                lastName: 'Kumar',
                email: 'rajesh@company.com',
                department: 'Engineering',
                designation: 'Senior Developer',
                dateOfJoining: '2023-01-15',
                bankStatus: 'verified',
            },
            {
                employeeId: 'EMP002',
                firstName: 'Priya',
                lastName: 'Singh',
                email: 'priya@company.com',
                department: 'HR',
                designation: 'HR Manager',
                dateOfJoining: '2022-06-20',
                bankStatus: 'verified',
            },
            {
                employeeId: 'EMP003',
                firstName: 'Amit',
                lastName: 'Patel',
                email: 'amit@company.com',
                department: 'Finance',
                designation: 'Finance Manager',
                dateOfJoining: '2021-03-10',
                bankStatus: 'pending',
            },
        ];
        setEmployees(mockEmployees);
    }, []);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // TODO: Call API to add employee
            console.log('Adding employee:', formData);

            const newEmployee: Employee = {
                employeeId: `EMP${(employees.length + 1).toString().padStart(3, '0')}`,
                ...formData,
                bankStatus: 'pending',
            };

            setEmployees([...employees, newEmployee]);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                department: '',
                designation: '',
                dateOfJoining: new Date().toISOString().split('T')[0],
            });
            setShowForm(false);
        } catch (error: any) {
            console.error('Error adding employee:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter employees
    const filteredEmployees = employees.filter((emp) => {
        const matchesSearch =
            emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment =
            selectedDepartment === 'all' || emp.department === selectedDepartment;

        return matchesSearch && matchesDepartment;
    });

    const departments = Array.from(
        new Set(employees.map((emp) => emp.department))
    );

    return (
        <div className="employees-page">
            <div className="page-header">
                <h1>Employee Management</h1>
                <p>Total Employees: {employees.length}</p>
            </div>

            <div className="actions-bar">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                        <option key={dept} value={dept}>
                            {dept}
                        </option>
                    ))}
                </select>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    {showForm ? 'Cancel' : '+ Add Employee'}
                </button>
            </div>

            {showForm && (
                <div className="add-employee-form">
                    <h2>Add New Employee</h2>
                    <form onSubmit={handleAddEmployee}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Designation</label>
                                <input
                                    type="text"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Date of Joining</label>
                            <input
                                type="date"
                                name="dateOfJoining"
                                value={formData.dateOfJoining}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Employee'}
                        </button>
                    </form>
                </div>
            )}

            <div className="employees-table">
                <table>
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Joining Date</th>
                            <th>Bank Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                                <tr key={emp.employeeId}>
                                    <td className="emp-id">{emp.employeeId}</td>
                                    <td className="emp-name">
                                        {emp.firstName} {emp.lastName}
                                    </td>
                                    <td>{emp.email}</td>
                                    <td>{emp.department}</td>
                                    <td>{emp.designation}</td>
                                    <td>{emp.dateOfJoining}</td>
                                    <td>
                                        <span
                                            className={`status-badge status-${emp.bankStatus || 'pending'}`}
                                        >
                                            {emp.bankStatus || 'pending'}
                                        </span>
                                    </td>
                                    <td className="actions">
                                        <button className="btn-small btn-primary">Edit</button>
                                        <button className="btn-small btn-danger">Delete</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="empty-state">
                                    No employees found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeesPage;
