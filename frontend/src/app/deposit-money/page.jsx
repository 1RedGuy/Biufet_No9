'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { depositMoney } from '@/network/deposit-money';

export default function DepositMoney() {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await depositMoney(parseFloat(amount));
            router.push('/profile');
        } catch (err) {
            console.error('Error depositing money:', err);
            setError(err.error || 'Failed to deposit money. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAmountChange = (e) => {
        // Remove any non-numeric characters except decimal point
        let value = e.target.value.replace(/[^\d.]/g, '');
        
        const decimalCount = (value.match(/\./g) || []).length;
        if (decimalCount > 1) {
            value = value.substring(0, value.indexOf('.', value.indexOf('.') + 1));
        }
        
        if (value.includes('.')) {
            const parts = value.split('.');
            value = parts[0] + '.' + (parts[1] || '').slice(0, 2);
        }

        setAmount(value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    return (
        <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            Deposit Money
                        </h1>
                        <Link
                            href="/profile"
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                            Back to Profile
                        </Link>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Amount to Deposit
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                                <input
                                    type="text"
                                    id="amount"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    onKeyDown={handleKeyDown}
                                    className="block w-full pl-8 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-medium border-gray-300 dark:border-gray-600"
                                    placeholder="0.00"
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Enter the amount you wish to deposit
                            </p>
                        </div>

                        <div className="bg-gray-50/50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Important Information
                            </h3>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li>Deposits are processed instantly</li>
                                <li>Funds will be available for investment immediately</li>
                                <li>All transactions are secure and encrypted</li>
                                <li>You can view your deposit history in your profile</li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !amount || parseFloat(amount) <= 0}
                            className={`w-full px-6 py-3 text-white rounded-lg shadow-sm transition-colors duration-200 font-medium text-base sm:text-lg
                                ${(isLoading || !amount || parseFloat(amount) <= 0)
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-primary-600 hover:bg-primary-700'}`}
                        >
                            {isLoading ? 'Processing...' : 'Deposit Now'}
                        </button>
                    </form>
                </div>

                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Need Help?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        If you have any questions about depositing money or need assistance, our support team is here to help.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                    >
                        Contact Support
                        <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
} 