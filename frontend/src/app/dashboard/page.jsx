'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const fetchGroups = async () => {
    return [
        {
            id: 1,
            name: 'Technology',
            description: 'Tech companies and startups',
            companyCount: 15,
            totalInvestment: '$2.5M',
            path: '/dashboard/technology'
        },
        {
            id: 2,
            name: 'Healthcare',
            description: 'Healthcare and biotech companies',
            companyCount: 8,
            totalInvestment: '$1.8M',
            path: '/dashboard/healthcare'
        },
        {
            id: 3,
            name: 'Finance',
            description: 'Financial services and fintech',
            companyCount: 12,
            totalInvestment: '$3.2M',
            path: '/dashboard/finance'
        }
    ];
};

export default function Dashboard() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadGroups = async () => {
            try {
                const data = await fetchGroups();
                setGroups(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load groups');
                setLoading(false);
            }
        };

        loadGroups();
    }, []);

    if (loading) {
        return (
            <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
                <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
                <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
                    <div className="text-center text-red-600 dark:text-red-400">
                        <h2 className="text-xl font-bold">{error}</h2>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
            <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
                <div className="lg:mt-14 mt-20 mx-auto max-w-screen-md text-center mb-8 lg:mb-16">
                    <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
                        Investment Groups
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 sm:text-xl">
                        Select a group to view its companies an chose which one to give your vote.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {groups.map((group) => (
                        <Link 
                            key={group.id} 
                            href={group.path}
                            className="group relative p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-800 min-h-[200px] flex flex-col cursor-pointer hover:-translate-y-1"
                        >
                            <div className="h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex justify-center items-center w-10 h-10 rounded-lg bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                                            <svg 
                                                className="w-5 h-5 text-primary-600 lg:w-6 lg:h-6 dark:text-primary-300 group-hover:text-primary-700 dark:group-hover:text-primary-200 transition-colors" 
                                                fill="currentColor" 
                                                viewBox="0 0 20 20" 
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path 
                                                    fillRule="evenodd" 
                                                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" 
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                                <span className="text-gray-500 dark:text-gray-400">Invested </span>
                                                <span className="block mt-1 text-base font-bold">{group.totalInvestment}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {group.name}
                                    </h3>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-gray-600 dark:text-gray-300 text-sm font-medium">
                                    <span className='text-xl'>
                                        {group.companyCount} Companies
                                    </span>
                                    <span className="text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                                        View →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}