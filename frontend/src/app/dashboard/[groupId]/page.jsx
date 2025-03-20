'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { dashboardService } from '@/network/dashboard';

export default function GroupPage() {
    const { groupId } = useParams();
    const [groupData, setGroupData] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                setLoading(true);
                const [groupDetails, companiesData] = await Promise.all([
                    dashboardService.getGroupDetails(groupId),
                    dashboardService.getCompaniesByGroup(groupId)
                ]);
                setGroupData(groupDetails);
                setCompanies(companiesData);
                setError(null);
            } catch (err) {
                setError('Failed to load group data. Please try again later.');
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupData();
    }, [groupId]);

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
                {/* Group Header */}
                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {groupData?.name}
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                                {groupData?.description}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Companies</p>
                                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                    {groupData?.companyCount}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Investment</p>
                                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                    {groupData?.totalInvestment}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Companies Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((company) => (
                        <Link
                            key={company.id}
                            href={`/companies/${company.id}`}
                            className="group bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {company.name}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                        {company.description}
                                    </p>
                                </div>
                                {company.trend > 0 ? (
                                    <span className="text-green-600 dark:text-green-400">+{company.trend}%</span>
                                ) : (
                                    <span className="text-red-600 dark:text-red-400">{company.trend}%</span>
                                )}
                            </div>
                            <div className="mt-4 flex justify-between items-end">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Market Cap: {company.marketCap}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Volume: {company.volume}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                        View Details →
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
} 