'use client';

import { useState, useEffect, use } from 'react';

const fetchGroupData = async (groupId) => {
    const groups = {
        'technology': {
            id: 1,
            name: 'Technology',
            description: 'Tech companies and startups',
            companies: [
                { id: 1, name: 'TechCorp', investment: '$500K', performance: '+15%' },
                { id: 2, name: 'InnovateTech', investment: '$750K', performance: '+8%' },
                { id: 3, name: 'FutureTech', investment: '$1.25M', performance: '+22%' },
            ]
        },
        'healthcare': {
            id: 2,
            name: 'Healthcare',
            description: 'Healthcare and biotech companies',
            companies: [
                { id: 1, name: 'HealthPlus', investment: '$600K', performance: '+12%' },
                { id: 2, name: 'BioInnovate', investment: '$450K', performance: '-5%' },
            ]
        },
        'finance': {
            id: 3,
            name: 'Finance',
            description: 'Financial services and fintech',
            companies: [
                { id: 1, name: 'FinTech Solutions', investment: '$800K', performance: '+18%' },
                { id: 2, name: 'PaymentPro', investment: '$950K', performance: '+25%' },
                { id: 3, name: 'WealthManage', investment: '$1.45M', performance: '+15%' },
            ]
        }
    };
    
    return groups[groupId] || null;
};

export default function GroupPage({ params }) {
    const resolvedParams = use(params); 
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadGroupData = async () => {
            try {
                const data = await fetchGroupData(resolvedParams.group);
                if (data) {
                    setGroupData(data);
                } else {
                    setError('Group not found');
                }
                setLoading(false);
            } catch (err) {
                setError('Failed to load group data');
                setLoading(false);
            }
        };

        loadGroupData();
    }, [resolvedParams.group]);

    const handleGroupInvest = () => {
        // Here you can add the investment logic for the entire group
        alert(`Investing in the entire ${groupData.name} group!`);
        // Typically you would make an API call here
    };

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
                        {groupData.name}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 sm:text-xl">
                        {groupData.description}
                    </p>
                    <button
                        onClick={handleGroupInvest}
                        className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors dark:bg-primary-700 dark:hover:bg-primary-800 mt-4"
                    >
                        Invest in Entire Group
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupData.companies.map((company) => (
                        <div 
                            key={company.id}
                            className="p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800 hover:shadow-xl transition-shadow"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {company.name}
                                </h3>
                                <span className={`text-sm font-bold ${
                                    company.performance.startsWith('+') 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-red-600 dark:text-red-400'
                                }`}>
                                    {company.performance}
                                </span>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 mb-4">
                                Investment: {company.investment}
                            </div>
                            <button
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors dark:bg-primary-700 dark:hover:bg-primary-800"
                                onClick={() => {}}
                            >
                                Give credit to
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}