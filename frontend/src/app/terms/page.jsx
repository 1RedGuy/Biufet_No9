'use client';

import Link from 'next/link';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 to-white dark:from-primary-950 dark:to-gray-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-8">
          <div className="mb-8">
            <Link 
              href="/register" 
              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
              <span>Back to Registration</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Terms and Conditions</h1>
          
          <div className="space-y-6 text-gray-600 dark:text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to Comdex. By accessing and using our platform, you agree to be bound by these Terms and Conditions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. User Accounts</h2>
              <p className="mb-4">
                When you create an account with us, you guarantee that the information you provide is accurate and complete. 
                You are responsible for maintaining the confidentiality of your account and password.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. Investment Information</h2>
              <p className="mb-4">
                The investment information provided on our platform is for informational purposes only and should not be 
                considered as financial advice. We make no guarantees regarding the accuracy or completeness of market data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. User Conduct</h2>
              <p className="mb-4">
                Users agree to use the platform in compliance with all applicable laws and regulations. Any form of 
                market manipulation, fraudulent activity, or misuse of the platform is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. Privacy</h2>
              <p className="mb-4">
                Your privacy is important to us. We collect and process personal data in accordance with our Privacy Policy 
                and applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">6. Limitation of Liability</h2>
              <p className="mb-4">
                Comdex shall not be liable for any direct, indirect, incidental, special, or consequential damages 
                resulting from the use or inability to use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">7. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. Users will be notified of any changes, and 
                continued use of the platform constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">8. Contact Information</h2>
              <p className="mb-4">
                For any questions regarding these Terms and Conditions, please contact our support team.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: 21.03.2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
