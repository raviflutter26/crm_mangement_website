import { useState, useEffect } from 'react'
import PayrollDashboard from './components/PayrollDashboard'
import EmployeeBankForm from './components/EmployeeBankForm'
import LoginPage from './pages/LoginPage'
import EmployeesPage from './pages/EmployeesPage'
import PayrollPage from './pages/PayrollPage'
import ReportsPage from './pages/ReportsPage'
import './App.css'

type PageType = 'dashboard' | 'employees' | 'payroll' | 'reports' | 'bank-form' | 'login'

function App() {
    const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        // Check if user is authenticated (has token in localStorage)
        const token = localStorage.getItem('authToken')
        const role = localStorage.getItem('userRole')

        if (token && role) {
            setIsAuthenticated(true)
            setUserRole(role)
        } else {
            setCurrentPage('login')
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userRole')
        setIsAuthenticated(false)
        setCurrentPage('login')
    }

    if (!isAuthenticated) {
        return (
            <LoginPage
                onLoginSuccess={() => {
                    const token = localStorage.getItem('authToken')
                    const role = localStorage.getItem('userRole')
                    if (token && role) {
                        setIsAuthenticated(true)
                        setUserRole(role)
                        setCurrentPage('dashboard')
                    }
                }}
            />
        )
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <h1>Salary Payout Automation</h1>
                    <nav className="nav-menu">
                        <button
                            className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('dashboard')}
                        >
                            Dashboard
                        </button>
                        <button
                            className={`nav-btn ${currentPage === 'employees' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('employees')}
                        >
                            Employees
                        </button>
                        <button
                            className={`nav-btn ${currentPage === 'payroll' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('payroll')}
                        >
                            Payroll
                        </button>
                        <button
                            className={`nav-btn ${currentPage === 'reports' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('reports')}
                        >
                            Reports
                        </button>
                        <button
                            className={`nav-btn ${currentPage === 'bank-form' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('bank-form')}
                        >
                            Bank Settings
                        </button>
                        <button
                            className="nav-btn logout"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </header>

            <main className="app-main">
                <div className="page-container">
                    {currentPage === 'dashboard' && <PayrollDashboard />}
                    {currentPage === 'employees' && <EmployeesPage />}
                    {currentPage === 'payroll' && <PayrollPage />}
                    {currentPage === 'reports' && <ReportsPage />}
                    {currentPage === 'bank-form' && <EmployeeBankForm />}
                </div>
            </main>

            <footer className="app-footer">
                <p>&copy; 2024 Salary Payout Automation System. All rights reserved.</p>
            </footer>
        </div>
    )
}

export default App
