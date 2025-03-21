'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function YourProfile() {
    const [userData] = useState({
        name: 'John Doe',
        email: 'john.doe@example.com',
        joinDate: 'January 2024',
        totalInvestments: '$125,000',
        portfolioGrowth: '+15.4%',
        companiesInvested: 8
    });

    const [monthlyPerformance] = useState({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Portfolio Value ($)',
                data: [125000, 128000, 132000, 129000, 135000, 142000],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.4
            }
        ]
    });

    const [sectorAllocation] = useState({
        labels: ['Technology', 'Healthcare', 'Finance', 'Real Estate', 'Energy'],
        datasets: [
            {
                data: [40, 20, 15, 15, 10],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                ]
            }
        ]
    });

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 10,
                    padding: 10,
                    font: {
                        size: window.innerWidth < 768 ? 10 : 12
                    }
                }
            },
            title: {
                display: true,
                text: 'Portfolio Performance Over Time',
                font: {
                    size: window.innerWidth < 768 ? 14 : 16
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                ticks: {
                    font: {
                        size: window.innerWidth < 768 ? 10 : 12
                    }
                }
            },
            x: {
                ticks: {
                    font: {
                        size: window.innerWidth < 768 ? 10 : 12
                    }
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: window.innerWidth < 768 ? 'bottom' : 'right',
                align: 'center',
                labels: {
                    boxWidth: 10,
                    padding: window.innerWidth < 768 ? 8 : 15,
                    font: {
                        size: window.innerWidth < 768 ? 10 : 12
                    }
                }
            },
            title: {
                display: true,
                text: 'Investment Sector Allocation',
                font: {
                    size: window.innerWidth < 768 ? 14 : 16
                }
            }
        }
    };

    const [portfolioData] = useState([
        {
            id: 1,
            company: 'TechCorp',
            investmentAmount: '$25,000',
            performance: '+12.5%',
            status: 'Active',
            date: '2024-01-15'
        },
        {
            id: 2,
            company: 'InnovateTech',
            investmentAmount: '$30,000',
            performance: '+8.3%',
            status: 'Active',
            date: '2024-02-01'
        },
        {
            id: 3,
            company: 'FutureTech',
            investmentAmount: '$20,000',
            performance: '+22.1%',
            status: 'Active',
            date: '2024-02-15'
        }
    ]);

    return (
        <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center sm:space-x-4 text-center sm:text-left">
                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center mb-2 sm:mb-0">
                                <span className="text-2xl font-bold text-primary-600 dark:text-primary-200">
                                    {userData.name.charAt(0)}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{userData.name}</h1>
                                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Member since {userData.joinDate}</p>
                            </div>
                        </div>
                        <button
                            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors duration-200 font-medium text-sm sm:text-base"
                            onClick={() => {}}
                        >
                            Withdraw Funds
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Investments</h3>
                        <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">{userData.totalInvestments}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">Portfolio Growth</h3>
                        <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{userData.portfolioGrowth}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">Indexes Invested</h3>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-gray-300">{userData.companiesInvested}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6">
                        <div className="h-[300px] sm:h-[400px]">
                            <Line options={lineOptions} data={monthlyPerformance} />
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6">
                        <div className="h-[300px] sm:h-[400px]">
                            <Doughnut options={doughnutOptions} data={sectorAllocation} />
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6 mb-8">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Investment Portfolio</h2>
                    <div className="overflow-x-auto -mx-4 sm:-mx-6">
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                    <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                                        <tr>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Investment</th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Performance</th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {portfolioData.map((investment) => (
                                            <tr key={investment.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {investment.company}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {investment.investmentAmount}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">
                                                    {investment.performance}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                                                        {investment.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {investment.date}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Link 
                        href="/profile/change-password"
                        className="flex items-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors"
                    >
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Update your security credentials</p>
                        </div>
                    </Link>
                    <Link 
                        href="/profile/payment-methods"
                        className="flex items-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors"
                    >
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Manage your payment options</p>
                        </div>
                    </Link>
                    <Link 
                        href="/profile/investment-history"
                        className="flex items-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors"
                    >
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Investment History</h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">View your complete history</p>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
}
