'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    // Check if we're on an auth page
    const isAuthPage = pathname?.startsWith('/login') || 
                      pathname?.startsWith('/register') || 
                      pathname?.startsWith('/forgot-password');
    
    if (isAuthPage) return null;

    return (
        <>
            <header className="w-full fixed top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
                <nav className="max-w-[1920px] mx-auto px-6 lg:px-12 py-6">
                    <div className="flex justify-between items-center">
                        <Link href="/" className="flex items-center">
                            <span className="text-3xl font-semibold text-gray-900 dark:text-white">
                                Biufet
                            </span>
                        </Link>
                        
                        {/* Centered Navigation */}
                        <div className="hidden lg:flex items-center justify-center flex-1 gap-12">
                            <Link 
                                href="/" 
                                className={`${
                                    pathname === '/' 
                                    ? 'text-primary-600 dark:text-white' 
                                    : 'text-gray-700 dark:text-gray-300'
                                } text-lg font-medium transition-colors hover:text-primary-600 dark:hover:text-white`}
                            >
                                Home
                            </Link>
                            <Link 
                                href="/dashboard" 
                                className={`${
                                    pathname.startsWith('/dashboard')
                                    ? 'text-primary-600 dark:text-white' 
                                    : 'text-gray-700 dark:text-gray-300'
                                } text-lg font-medium transition-colors hover:text-primary-600 dark:hover:text-white`}
                            >
                                Dashboard
                            </Link>
                            <Link 
                                href="/contact" 
                                className={`${
                                    pathname === '/contact' 
                                    ? 'text-primary-600 dark:text-white' 
                                    : 'text-gray-700 dark:text-gray-300'
                                } text-lg font-medium transition-colors hover:text-primary-600 dark:hover:text-white`}
                            >
                                Contact Us
                            </Link>
                        </div>

                        <button
                            onClick={() => router.push('/profile')}
                            type="button"
                            className="flex items-center justify-center w-10 h-10 rounded-full focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 hover:ring-2"
                        >
                            <span className="sr-only">Open user menu</span>
                            <div className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                                <svg 
                                    className="absolute w-12 h-12 text-gray-400 -left-1" 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path 
                                        fillRule="evenodd" 
                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                        </button>
                    </div>
                </nav>
            </header>
            <div className="h-[88px]" />
        </>
    );
}         
