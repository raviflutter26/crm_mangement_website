import React, { useState, useEffect } from 'react';

/**
 * Employee Bank Account Form Component
 * Allows employees to add/update their bank details
 */

interface BankFormData {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    accountType: 'savings' | 'current';
}

interface EmployeeBankFormProps {
    employeeId: string;
    onSuccess?: () => void;
}

const EmployeeBankForm: React.FC<EmployeeBankFormProps> = ({ employeeId, onSuccess }) => {
    const [formData, setFormData] = useState<BankFormData>({
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: '',
        accountType: 'savings',
    });

    const [existingBank, setExistingBank] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchBankDetails();
    }, [employeeId]);

    const fetchBankDetails = async () => {
        try {
            const response = await fetch(`/api/employees/${employeeId}/bank`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setExistingBank(data.data);
                setFormData({
                    accountNumber: data.data.accountNumber || '',
                    ifscCode: data.data.ifscCode || '',
                    accountHolderName: data.data.accountHolderName || '',
                    bankName: data.data.bankName || '',
                    accountType: data.data.accountType || 'savings',
                });
            }
        } catch (error) {
            console.error('Failed to fetch bank details:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (!formData.accountNumber.match(/^\d{9,18}$/)) {
            setMessage({ type: 'error', text: 'Invalid account number (9-18 digits)' });
            return;
        }

        if (!formData.ifscCode.match(/^[A-Z]{4}0[A-Z0-9]{6}$/)) {
            setMessage({ type: 'error', text: 'Invalid IFSC code format (e.g., HDFC0000123)' });
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`/api/employees/${employeeId}/bank`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Bank details saved successfully!' });
                setExistingBank(data.data);

                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: (error as any).message });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        try {
            setLoading(true);

            const response = await fetch(`/api/employees/${employeeId}/bank/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Bank account verified with RazorpayX!' });
                setExistingBank((prev: any) => ({
                    ...prev,
                    razorpayFundAccountStatus: 'active',
                }));
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: (error as any).message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Bank Account Details</h2>

            {message && (
                <div style={{
                    padding: '12px',
                    marginBottom: '20px',
                    borderRadius: '4px',
                    backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                }}>
                    {message.text}
                </div>
            )}

            {existingBank && (
                <div style={{
                    padding: '12px',
                    marginBottom: '20px',
                    backgroundColor: '#e2f0fb',
                    borderLeft: '4px solid #2196F3',
                    borderRadius: '4px',
                }}>
                    <p style={{ margin: '0 0 8px 0', color: '#0c5aa0', fontWeight: 'bold' }}>Current Bank Account</p>
                    <p style={{ margin: '0 0 4px 0', color: '#0c5aa0', fontSize: '14px' }}>
                        {existingBank.accountNumberMasked} • {existingBank.bankName}
                    </p>
                    <p style={{ margin: '0 0 4px 0', color: '#0c5aa0', fontSize: '14px' }}>
                        Status: {existingBank.razorpayFundAccountStatus === 'active' ? '✓ Verified' : '⏳ Pending Verification'}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        color: '#333',
                        fontWeight: 'bold',
                        fontSize: '14px',
                    }}>
                        Account Holder Name *
                    </label>
                    <input
                        type="text"
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleChange}
                        placeholder="Enter name as per bank records"
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            fontSize: '14px',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        color: '#333',
                        fontWeight: 'bold',
                        fontSize: '14px',
                    }}>
                        Bank Name *
                    </label>
                    <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        placeholder="e.g., HDFC Bank, ICICI Bank"
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            fontSize: '14px',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        color: '#333',
                        fontWeight: 'bold',
                        fontSize: '14px',
                    }}>
                        Account Number *
                    </label>
                    <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        placeholder="Enter 9-18 digit account number"
                        required
                        maxLength={18}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            fontSize: '14px',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        color: '#333',
                        fontWeight: 'bold',
                        fontSize: '14px',
                    }}>
                        IFSC Code *
                    </label>
                    <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode.toUpperCase()}
                        onChange={handleChange}
                        placeholder="e.g., HDFC0000123"
                        required
                        maxLength={11}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            fontSize: '14px',
                            textTransform: 'uppercase',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        color: '#333',
                        fontWeight: 'bold',
                        fontSize: '14px',
                    }}>
                        Account Type *
                    </label>
                    <select
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            fontSize: '14px',
                        }}
                    >
                        <option value="savings">Savings Account</option>
                        <option value="current">Current Account</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: loading ? '#ccc' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px',
                        }}
                    >
                        {loading ? 'Saving...' : 'Save Bank Details'}
                    </button>

                    {existingBank && existingBank.razorpayFundAccountStatus !== 'active' && (
                        <button
                            type="button"
                            onClick={handleVerify}
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '10px',
                                backgroundColor: loading ? '#ccc' : '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px',
                            }}
                        >
                            {loading ? 'Verifying...' : 'Verify Account'}
                        </button>
                    )}
                </div>

                <p style={{ margin: '15px 0 0 0', fontSize: '12px', color: '#999' }}>
                    🔒 Your bank details are encrypted and securely stored. They will not be visible in plain text.
                </p>
            </form>
        </div>
    );
};

export default EmployeeBankForm;
