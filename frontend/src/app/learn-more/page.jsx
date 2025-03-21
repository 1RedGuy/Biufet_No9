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
                  Start by depositing money into your account. These funds become available for investment in any active index.
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
      <section className="py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Understanding Index Statuses</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100 mb-4">
                Draft
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Planning Phase</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Indexes in the draft stage are being prepared but are not yet open for voting or investments.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 mb-4">
                Voting
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Community Selection</h3>
              <p className="text-gray-600 dark:text-gray-300">
                During this phase, community members can vote for companies they want included in the final index.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 mb-4">
                Active
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Investment Open</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Active indexes have completed the voting process and are open for investment. Funds are distributed across selected companies.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 mb-4">
                Archived
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Completed</h3>
              <p className="text-gray-600 dark:text-gray-300">
                These indexes have completed their lifecycle and are no longer accepting new investments, though existing investments continue.
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Learn & Grow</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                Expand your investment knowledge by participating in community discussions and observing how different investment strategies perform.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-gray-700/90 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Flexible Investments</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                Deposit and withdraw funds on your schedule, with no long-term lock-in periods required. Your money remains accessible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">What is the minimum investment amount?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                You can start investing with any amount. There's no minimum requirement to participate in our indexes.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">How are companies selected for indexes?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Companies are selected through community voting. Members vote for their preferred companies during the voting phase, and the top-voted companies are included in the final index.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">When can I withdraw my investment?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                You can withdraw your investment at any time from active indexes. The withdrawal will be processed based on the current value of your investment.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">How is my money distributed across companies?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your investment is distributed equally across all companies in the index. This ensures a balanced exposure to all selected companies.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Are there any fees?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We maintain a transparent fee structure. Details about any applicable fees are clearly displayed before you make an investment.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">How secure is my investment?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We implement industry-standard security measures to protect your account and investments. However, all investments carry inherent market risks.
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
              href="/register"
              className="rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-all duration-200 font-semibold text-base px-8 py-4 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Create Account
            </Link>
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