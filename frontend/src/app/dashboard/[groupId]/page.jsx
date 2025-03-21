"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import indexesService from "@/network/indexes";
import investmentsService from "@/network/investments";

export default function GroupPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const [indexData, setIndexData] = useState(null);
  const [companyStats, setCompanyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState(100);
  const [isInvesting, setIsInvesting] = useState(false);
  const [investmentError, setInvestmentError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Group page: Fetching data for index ID ${groupId}`);
        setLoading(true);

        const [indexDetails, indexCompaniesStats] = await Promise.all([
          indexesService.getIndexDetails(Number(groupId)),
          indexesService.getIndexCompaniesStats(Number(groupId)),
        ]);

        console.log("Group page: Received index details:", indexDetails);
        console.log("Group page: Received company stats:", indexCompaniesStats);

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

  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleInvestClick = () => {
    setShowInvestModal(true);
    setInvestmentError(null);
  };

  const handleCloseModal = () => {
    setShowInvestModal(false);
    setInvestAmount(100);
    setInvestmentError(null);
  };

  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setInvestAmount(value);
    }
  };

  const handleInvest = async () => {
    setIsInvesting(true);
    setInvestmentError(null);

    try {
      await investmentsService.createInvestment(Number(groupId), investAmount);

      // Close modal
      setShowInvestModal(false);

      // Refresh data
      const [indexDetails, indexCompaniesStats] = await Promise.all([
        indexesService.getIndexDetails(Number(groupId)),
        indexesService.getIndexCompaniesStats(Number(groupId)),
      ]);

      setIndexData(indexDetails);
      setCompanyStats(indexCompaniesStats);

      // Show success message or notification here if needed
    } catch (err) {
      console.error("Error creating investment:", err);
      setInvestmentError(
        err.response?.data?.error ||
          "Failed to create investment. Please check your available credits and try again."
      );
    } finally {
      setIsInvesting(false);
    }
  };

  if (loading) {
    const totalInvestment = indexData?.total_investment
      ? indexData.total_investment >= 1000000
        ? `$${(indexData.total_investment / 1000000).toFixed(1)}M`
        : `$${indexData.total_investment.toLocaleString()}`
      : "$0";

    return (
      <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <button
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium self-end"
                  onClick={() => {}}
                >
                  Invest
                </button>
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

  const totalInvestment = indexData.total_investment
    ? indexData.total_investment >= 1000000
      ? `$${(indexData.total_investment / 1000000).toFixed(1)}M`
      : `$${indexData.total_investment.toLocaleString()}`
    : "$0";

  return (
    <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {indexData.name}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {indexData.description}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    indexData.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                      : indexData.status === "voting"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                      : indexData.status === "executed"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                  }`}
                >
                  {indexData.status.charAt(0).toUpperCase() +
                    indexData.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Investment
                </p>
                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {totalInvestment}
                </p>
              </div>
              {indexData.status === "active" && (
                <button
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  onClick={handleInvestClick}
                >
                  Invest
                </button>
              )}
              {indexData.status !== "active" && (
                <div className="px-6 py-2 bg-gray-300 text-gray-600 rounded-lg text-sm font-medium cursor-not-allowed">
                  Investing Unavailable
                </div>
              )}
            </div>
          </div>
        </div>

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

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Companies
        </h2>
        {indexData.companies && indexData.companies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {indexData.companies.map((company) => (
              <div
                key={company.id}
                className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-6">
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
                <div className="mt-auto flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Price: ${company.price?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Market Cap: ${(company.market_cap / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <button
                    className="ml-4 px-4 py-1.5 border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white rounded-lg transition-colors text-sm font-medium"
                    onClick={() => {}}
                  >
                    Vote
                  </button>
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

      {/* Investment Modal */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Invest in {indexData.name}
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please enter the amount you would like to invest in this index.
              Minimum investment is $100.
            </p>

            <div className="mb-6">
              <label
                htmlFor="investAmount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Investment Amount ($)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="investAmount"
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-8 pr-12 sm:text-sm border-gray-300 rounded-md py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="100"
                  min="100"
                  step="10"
                  value={investAmount}
                  onChange={handleAmountChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">USD</span>
                </div>
              </div>
            </div>

            {investmentError && (
              <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                {investmentError}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                disabled={isInvesting || investAmount < 100}
                className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white 
                  ${
                    isInvesting || investAmount < 100
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-primary-600 hover:bg-primary-700"
                  }`}
              >
                {isInvesting ? "Processing..." : "Invest Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
