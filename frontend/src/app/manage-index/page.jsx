'use client';

import { useState, useEffect } from 'react';
import indexesService from "@/network/indexes";

export default function ManageItems() {
    const [indexes, setIndexes] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusLoading, setStatusLoading] = useState(null); // Track which index is being updated

    useEffect(() => {
        fetchIndexes();
    }, [selectedStatus]);

    const fetchIndexes = async () => {
        try {
            setError(null);
            const statusParam = selectedStatus !== 'all' ? { status: selectedStatus } : {};
            const response = await indexesService.getIndexes(statusParam);
            setIndexes(response.results || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch indexes');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (indexId, newStatus) => {
        try {
            setStatusLoading(indexId);
            setError(null);

            if (newStatus === 'active') {
                await indexesService.activateIndex(indexId);
            } else if (newStatus === 'archived') {
                await indexesService.archiveIndex(indexId);
            } else {
                throw new Error('Invalid status transition');
            }
            
            // Refresh the indexes list
            await fetchIndexes();
        } catch (err) {
            console.error('Error updating status:', err);
            setError(err.response?.data?.error || err.message || 'Failed to update index status');
        } finally {
            setStatusLoading(null);
        }
    };

    const getAvailableStatusTransitions = (currentStatus) => {
        switch (currentStatus) {
            case 'draft':
                return ['draft', 'active', 'archived'];
            case 'active':
                return ['active', 'archived'];
            case 'executed':
                return ['executed', 'archived'];
            case 'archived':
                return ['archived'];
            default:
                return [];
        }
    };

    const filteredIndexes = selectedStatus === 'all'
        ? indexes
        : indexes.filter(index => index.status === selectedStatus);

    const statusColors = {
        draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        executed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Draft',
            active: 'Active (Voting)',
            executed: 'Executed',
            archived: 'Archived'
        };
        return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

    return (
        <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                        Manage Indexes
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Filter by Status
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">All Indexes</option>
                            <option value="draft">Draft</option>
                            <option value="active">Active (Voting)</option>
                            <option value="executed">Executed</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        {filteredIndexes.map(index => (
                            <div
                                key={index.id}
                                className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            >
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {index.name}
                                    </h3>
                                    <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mt-2 ${statusColors[index.status]}`}>
                                        {getStatusLabel(index.status)}
                                    </span>
                                </div>
                                
                                <div className="flex-shrink-0 w-full sm:w-auto">
                                    <select
                                        value={index.status}
                                        onChange={(e) => handleStatusChange(index.id, e.target.value)}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        disabled={statusLoading === index.id || !getAvailableStatusTransitions(index.status).length}
                                    >
                                        {getAvailableStatusTransitions(index.status).map(status => (
                                            <option key={status} value={status}>
                                                {getStatusLabel(status)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}

                        {filteredIndexes.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No indexes found with the selected status.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
} 