'use client';

import { useState } from 'react';

export default function ManageItems() {
    const [items, setItems] = useState([
        { id: 1, title: 'Item 1', status: 'active'},
        { id: 2, title: 'Item 2', status: 'drafted'},
        { id: 3, title: 'Item 3', status: 'archive'},
    ]);

    const [selectedStatus, setSelectedStatus] = useState('all');

    const handleStatusChange = (itemId, newStatus) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, status: newStatus } : item
            )
        );
    };

    const filteredItems = selectedStatus === 'all'
        ? items
        : items.filter(item => item.status === selectedStatus);

    const statusColors = {
        active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        drafted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        archive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };

    return (
        <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                        Manage Indexes
                    </h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Filter by Status
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">All Items</option>
                            <option value="active">Active</option>
                            <option value="drafted">Drafted</option>
                            <option value="archive">Archive</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            >
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {item.title}
                                    </h3>
                                    <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mt-2 ${statusColors[item.status]}`}>
                                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                    </span>
                                </div>
                                
                                <div className="flex-shrink-0 w-full sm:w-auto">
                                    <select
                                        value={item.status}
                                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="active">Active</option>
                                        <option value="drafted">Draft</option>
                                        <option value="archive">Archive</option>
                                    </select>
                                </div>
                            </div>
                        ))}

                        {filteredItems.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No items found with the selected status.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
} 