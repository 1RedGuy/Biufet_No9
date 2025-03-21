'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LearnMore() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
              How <span className="text-primary-600 dark:text-primary-400">Comdex</span> Works
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              A revolutionary approach to community-driven index investing
            </p>
          </div>
        </div>
      </section>

      {/* What is Comdex */}
      <section className="py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-3xl font-bold text-primary-600 dark:text-primary-400">What is Comdex?</h2>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300">
              Comdex is a community-based investment platform that allows members to invest in company indexes collectively.
              Unlike traditional index funds, our indexes are created and shaped by community voting.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="bg-white/90 dark:bg-gray-700/90 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Community-Driven</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                Our platform empowers members to collectively decide which companies should be included in each index through a democratic voting process.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-gray-700/90 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Diversified Investments</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                Spread your investment across multiple companies within an index, reducing risk while maintaining potential for growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How It Works</h2>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300">
              Our unique approach to index investing combines community wisdom with modern portfolio management
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900 px-3 text-lg font-medium text-gray-900 dark:text-white">The Investment Journey</span>
            </div>
          </div>

          <div className="mt-12">
            <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
              <div className="relative">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-600 text-white text-2xl font-bold mb-4">1</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Deposit Funds</h3>
                <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                  Start by depositing money into your account. These funds become available for investment in any active company group.
                </p>
              </div>

              <div className="relative">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-600 text-white text-2xl font-bold mb-4">2</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Vote on Companies</h3>
                <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                  Browse through investment groups in the voting phase and cast your votes for companies you believe should be included in the index.
                </p>
              </div>

              <div className="relative">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-600 text-white text-2xl font-bold mb-4">3</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Invest & Monitor</h3>
                <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                  Once the voting period ends, the index becomes active. Your investment is distributed across the top-voted companies, and you can monitor performance in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Index Status Explanation */}
      <section className="py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Understanding Index Statuses</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Track your investment journey through these different stages, each representing a crucial phase in the index lifecycle.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-600 flex flex-col h-[220px]">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100">
                  Draft
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Planning Phase</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Newly created index where users can invest but need to be alerted that it is newly created.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-600 flex flex-col h-[220px]">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  Voting
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Community Selection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                The investment period has ended and users can select their final company allocations for receiving the final price.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-600 flex flex-col h-[220px]">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  Active
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Investment Open</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Active indexes have completed the voting process and are open for investment. Funds are distributed across selected companies.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-600 flex flex-col h-[220px]">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                  Archived
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Completed</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                The index has completed its lifecycle and is no longer accepting new investments or changes, though existing investments continue.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-600 flex flex-col h-[220px]">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                  Executed
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Investment Closed</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                All activities (voting, investing, final selections) are completed and final returns have been distributed to participants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Benefits of Investing with Comdex</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white/90 dark:bg-gray-700/90 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Lower Risk</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                By investing in multiple companies through our indexes, you spread risk across diverse assets, reducing the impact of any single company's performance.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-gray-700/90 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Collective Wisdom</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                Leverage the knowledge and insights of the entire community to make investment decisions, rather than relying on individual judgment alone.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-gray-700/90 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Time Efficiency</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                Save time on research and portfolio management. Our platform handles the execution and monitoring, while the community helps with selection.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-gray-700/90 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Transparent Process</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                All voting results and investment allocations are visible to all members, ensuring complete transparency in the investment process.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-gray-700/90 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Virtual Currency</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                Currently using virtual currency (not real money) for all investments and transactions on the platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Ready to Start Investing?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Join our community-driven investment platform today and start growing your portfolio with the power of collective wisdom.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="rounded-full border-2 border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white transition-all duration-200 font-semibold text-base px-8 py-4 flex items-center justify-center"
            >
              Explore Indexes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
} 