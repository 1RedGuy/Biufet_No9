'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dashboardService } from '@/network/dashboard';

export default function Dashboard() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoading(true);
                const data = await dashboardService.getGroups();
                setGroups(data);
                setError(null);
            } catch (err) {
                setError('Failed to load groups. Please try again later.');
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <Link 
                            key={group.id}
                            href={`/dashboard/${group.id}`}
                            className="group bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {group.name}
                                </h3>
                                <p className="mt-2 text-gray-600 dark:text-gray-300">
                                    {group.description}
                                </p>
                                <div className="mt-4 flex justify-between items-end">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Companies: {group.companyCount}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Total Investment: {group.totalInvestment}
                                        </p>
                                    </div>
                                    <span className="text-6xl font-bold text-gray-200 dark:text-gray-700 absolute bottom-4 right-4 transition-transform group-hover:scale-110">
                                        {String(group.id).padStart(2, '0')}
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