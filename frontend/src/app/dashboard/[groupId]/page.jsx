"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import indexesService from "@/network/indexes";
import investmentsService from "@/network/investments";
import { getUserCredits } from "@/network/deposit-money";
import votingService from "@/network/voting";

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
  const [userCredits, setUserCredits] = useState(0);
  const [voteWeights, setVoteWeights] = useState([]);
  const [loadingVoteWeights, setLoadingVoteWeights] = useState(false);
  const [votingStatus, setVotingStatus] = useState(null);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [activeInvestment, setActiveInvestment] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");

  // Debug function to check connection to the backend
  const testBackendConnection = async () => {
    try {
      setDebugMessage("Testing connection to backend...");
      // First try to get voting status to see if the endpoint works
      const status = await votingService.getIndexVotingStatus(Number(groupId));
      console.log("Connection test - voting status:", status);
      setDebugMessage(
        `Connection successful! Voting status: ${JSON.stringify(status)}`
      );
      return true;
    } catch (err) {
      console.error("Connection test failed:", err);
      setDebugMessage(`Connection failed: ${err.message}`);
      return false;
    }
  };

  useEffect(() => {
    // Test connection when component mounts
    testBackendConnection();

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

        // Always try to fetch voting status for any index, not just in voting status
        try {
          const status = await votingService.getIndexVotingStatus(
            Number(groupId)
          );
          console.log("Group page: Received voting status:", status);
          setVotingStatus(status);

          // If user has active investments, set the first one as default
          if (
            status.active_investments &&
            status.active_investments.length > 0
          ) {
            setActiveInvestment(status.active_investments[0]);
          }
        } catch (statusError) {
          console.error("Error fetching voting status:", statusError);
        }

        // If index is in voting status or later, fetch vote weights
        if (
          indexDetails.status === "voting" ||
          indexDetails.status === "executed" ||
          indexDetails.status === "archived"
        ) {
          setLoadingVoteWeights(true);
          try {
            const weights = await indexesService.getCompanyVoteWeights(
              Number(groupId)
            );
            console.log("Group page: Received vote weights:", weights);
            setVoteWeights(weights);
          } catch (weightsError) {
            console.error("Error fetching vote weights:", weightsError);
          } finally {
            setLoadingVoteWeights(false);
          }
        }

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

  const handleInvestClick = async () => {
    try {
      const creditsData = await getUserCredits();
      setUserCredits(creditsData.credits);
      setShowInvestModal(true);
      setInvestmentError(null);
    } catch (err) {
      console.error("Error loading user credits:", err);
      setInvestmentError(
        "Failed to load your available credits. Please try again."
      );
    }
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

  // Handle company selection for voting
  const handleCompanySelect = (companyId) => {
    // If already selected, remove it
    if (selectedCompanies.includes(companyId)) {
      setSelectedCompanies(selectedCompanies.filter((id) => id !== companyId));
    } else {
      // If max votes reached, show error
      if (
        votingStatus &&
        selectedCompanies.length >= votingStatus.max_votes_per_user
      ) {
        alert(
          `You can only select up to ${votingStatus.max_votes_per_user} companies`
        );
        return;
      }
      // Add to selected
      setSelectedCompanies([...selectedCompanies, companyId]);
    }
  };

  // Handle vote button click - simplified logic
  const handleVoteClick = (companyId) => {
    // Log the voting status to debug
    console.log("Current voting status:", votingStatus);
    console.log("Clicking vote for company:", companyId);

    // Just toggle company selection for now, we'll validate in the submission phase
    handleCompanySelect(companyId);
  };

  // Open vote submission modal with validation
  const handleVoteSubmitClick = () => {
    console.log(
      "Attempting to submit votes. Selected companies:",
      selectedCompanies
    );
    console.log("Voting status:", votingStatus);

    // Fallback minimum if votingStatus isn't available
    const minVotes = votingStatus?.min_votes_per_user || 1;

    // Check minimum selections
    if (selectedCompanies.length < minVotes) {
      alert(`You must select at least ${minVotes} companies`);
      return;
    }

    // If no active investments but we have voting status
    if (
      votingStatus &&
      (!votingStatus.active_investments ||
        votingStatus.active_investments.length === 0)
    ) {
      alert("You need to invest in this index before voting");
      return;
    }

    // Open the modal
    setShowVoteModal(true);
    setVoteError(null);
  };

  // Close vote modal
  const handleCloseVoteModal = () => {
    setShowVoteModal(false);
    setVoteError(null);
  };

  // Submit votes with better error handling
  const handleSubmitVotes = async () => {
    if (!activeInvestment) {
      setVoteError("No active investment selected");
      return;
    }

    setIsVoting(true);
    setVoteError(null);

    try {
      console.log("Submitting votes:", {
        indexId: Number(groupId),
        companyIds: selectedCompanies,
        investmentId: activeInvestment.id,
      });

      const result = await votingService.submitVotes(
        Number(groupId),
        selectedCompanies,
        activeInvestment.id
      );

      console.log("Vote submission result:", result);
      setVoteSuccess(true);

      // Refresh vote weights
      const weights = await indexesService.getCompanyVoteWeights(
        Number(groupId)
      );
      setVoteWeights(weights);

      // Update voting status
      const status = await votingService.getIndexVotingStatus(Number(groupId));
      setVotingStatus(status);

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowVoteModal(false);
        setVoteSuccess(false);
        setSelectedCompanies([]);
      }, 2000);
    } catch (err) {
      console.error("Error submitting votes:", err);

      // Extract the most specific error message available
      let errorMessage = "Failed to submit votes. Please try again.";
      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.company_ids) {
          errorMessage = err.response.data.company_ids;
        } else if (err.response.data.index_id) {
          errorMessage = err.response.data.index_id;
        } else if (err.response.data.investment_id) {
          errorMessage = err.response.data.investment_id;
        }
      }

      setVoteError(errorMessage);
    } finally {
      setIsVoting(false);
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

        {/* Vote Weights section - only show if in voting stage or later and weights exist */}
        {(indexData?.status === "voting" ||
          indexData?.status === "executed" ||
          indexData?.status === "archived") && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Vote Weights
            </h2>
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Company
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Symbol
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Sector
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Vote Count
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {voteWeights.map((item, idx) => (
                      <tr
                        key={item.company_id}
                        className={
                          idx % 2 === 0
                            ? "bg-white dark:bg-gray-800"
                            : "bg-gray-50 dark:bg-gray-900"
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.company_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.company_symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.sector}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                          {item.vote_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400 text-right">
                          {parseFloat(item.total_weight).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loadingVoteWeights && (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                  Loading vote weights...
                </div>
              )}
              {!loadingVoteWeights && voteWeights.length === 0 && (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No vote data available yet.
                </div>
              )}
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
                className={`bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 flex flex-col h-full ${
                  selectedCompanies.includes(company.id)
                    ? "ring-2 ring-primary-500"
                    : ""
                }`}
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
                  {/* Vote button - always enabled during voting phase */}
                  {indexData.status === "voting" ? (
                    <button
                      className={`ml-4 px-4 py-1.5 border rounded-lg transition-colors text-sm font-medium
                        ${
                          selectedCompanies.includes(company.id)
                            ? "bg-primary-600 text-white border-primary-600"
                            : "border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white"
                        }
                      `}
                      onClick={() => handleVoteClick(company.id)}
                    >
                      {selectedCompanies.includes(company.id)
                        ? "Selected"
                        : "Vote"}
                    </button>
                  ) : (
                    <button
                      className="ml-4 px-4 py-1.5 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium"
                      disabled
                    >
                      {indexData.status === "draft"
                        ? "Not Votable"
                        : "Voting Closed"}
                    </button>
                  )}
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

        {/* Add a floating vote button if companies are selected - simplified condition */}
        {indexData.status === "voting" && selectedCompanies.length > 0 && (
          <div className="fixed bottom-8 right-8 z-30">
            <button
              className="px-6 py-3 bg-primary-600 text-white rounded-lg shadow-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2"
              onClick={handleVoteSubmitClick}
            >
              <span>Submit Votes ({selectedCompanies.length})</span>
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
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </button>
          </div>
        )}

        {/* Vote Submission Modal */}
        {showVoteModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
              <button
                onClick={handleCloseVoteModal}
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
                Confirm Your Votes
              </h3>

              {voteSuccess ? (
                <div className="text-center py-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-10 h-10 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Votes Submitted!
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Your votes have been recorded successfully.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    You're about to vote for {selectedCompanies.length}{" "}
                    companies in this index. These votes will determine the
                    composition of the index.
                  </p>

                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Companies
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <ul className="space-y-1">
                        {selectedCompanies.map((companyId) => {
                          const company = indexData.companies.find(
                            (c) => c.id === companyId
                          );
                          return (
                            <li
                              key={companyId}
                              className="text-sm text-gray-700 dark:text-gray-300 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-2 text-primary-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                              {company ? company.name : `Company ${companyId}`}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  {votingStatus.active_investments.length > 0 && (
                    <div className="mb-6">
                      <label
                        htmlFor="investmentSelect"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Investment to Use
                      </label>
                      <select
                        id="investmentSelect"
                        className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={activeInvestment?.id || ""}
                        onChange={(e) => {
                          const selectedId = Number(e.target.value);
                          const investment =
                            votingStatus.active_investments.find(
                              (inv) => inv.id === selectedId
                            );
                          setActiveInvestment(investment);
                        }}
                      >
                        {votingStatus.active_investments.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            ${inv.amount.toLocaleString()} -{" "}
                            {new Date(inv.date).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {voteError && (
                    <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                      {voteError}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCloseVoteModal}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitVotes}
                      disabled={isVoting}
                      className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white 
                        ${
                          isVoting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary-600 hover:bg-primary-700"
                        }`}
                    >
                      {isVoting ? "Processing..." : "Submit Votes"}
                    </button>
                  </div>
                </>
              )}
            </div>
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
              <div className="flex justify-between items-center mb-4">
                <label
                  htmlFor="investAmount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Investment Amount ($)
                </label>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Available Credits: ${userCredits.toLocaleString()}
                </div>
              </div>
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

      {/* Add a small debug indicator at the bottom of the page */}
      <div className="fixed bottom-0 left-0 p-2 bg-gray-100 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400">
        {debugMessage}
      </div>
    </section>
  );
}
