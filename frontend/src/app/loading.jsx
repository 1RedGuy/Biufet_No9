'use client';

import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 to-white dark:from-primary-950 dark:to-gray-950 flex items-center justify-center">
      <LoadingSpinner size="large" text="Loading..." />
    </div>
  );
} 