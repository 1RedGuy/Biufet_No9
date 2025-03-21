"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import indexesService from "@/network/indexes";

export default function GroupPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const [indexData, setIndexData] = useState(null);
  const [companyStats, setCompanyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Group page: Fetching data for index ID ${groupId}`);
        setLoading(true);

        // Fetch index details and company stats in parallel
        const [indexDetails, indexCompaniesStats] = await Promise.all([
          indexesService.getIndexDetails(Number(groupId)),
          indexesService.getIndexCompaniesStats(Number(groupId)),
        ]);

        console.log("Group page: Received index details:", indexDetails);
        console.log("Group page: Received company stats:", indexCompaniesStats);

        // Check if we got valid data back
        if (!indexDetails) {
          setError("Index not found or you do not have permission to view it");
          return;
        }

        setIndexData(indexDetails);
        setCompanyStats(indexCompaniesStats);
        setError(null);
      } catch (err) {
        console.error("Error fetching index data:", err);
        setError("Failed to load index data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  // Handle back navigation
  const handleBack = () => {
    router.push("/dashboard");
  };

  if (loading) {
    // Format values for display
    const totalInvestment = indexData?.total_investment
      ? `$${(indexData.total_investment / 1000000).toFixed(1)}M`
      : "$0M";

    return (
      <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Group Header */}
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {indexData?.name}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {indexData?.description}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Investment
                  </p>
                  <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {totalInvestment}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Error
          </h2>
          <p className="text-red-600 dark:text-red-400 text-lg mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!indexData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Index Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The investment group you're looking for could not be found or you
            may not have access to view it.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Format values for display
  const totalInvestment = indexData.total_investment
    ? `$${(indexData.total_investment / 1000000).toFixed(1)}M`
    : "$0M";

  return (
    <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={handleBack}
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
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Group Header */}
        <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {indexData.name}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {indexData.description}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Investment
                </p>
                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {totalInvestment}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {companyStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                Companies
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {companyStats.total_companies}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                Market Cap
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${(companyStats.total_market_cap / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                Avg. Price
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${companyStats.average_price?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        )}

        {/* Companies Grid */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Companies
        </h2>
        {indexData.companies && indexData.companies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {indexData.companies.map((company) => (
              <div
                key={company.id}
                className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {company.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {company.ticker} • {company.sector || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-lg font-bold ${
                        company.price_change > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {company.price_change > 0 ? "+" : ""}
                      {company.price_change}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Price: ${company.price?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Market Cap: ${(company.market_cap / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-300 text-center">
              No companies found in this investment group.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
