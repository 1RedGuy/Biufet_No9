'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 to-white dark:from-primary-950 dark:to-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-500">500</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-4">Something went wrong!</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          We apologize for the inconvenience. Please try again later.
        </p>
        <div className="mt-6 space-x-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
          >
            Try Again
          </button>
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
} 