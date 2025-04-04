"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { fetchUserProfile } from "@/network/profile";
import { getUserCredits } from "@/network/deposit-money";
import { withdrawMoney } from "@/network/withdraw-money";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function YourProfile() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCredits, setUserCredits] = useState(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchData = async () => {
    try {
      const profileData = await fetchUserProfile();
      console.log("Profile data received:", profileData);
      console.log("Portfolio growth:", profileData.portfolio_growth_percentage);
      setUserData(profileData);

      // Fetch user credits
      try {
        const creditsData = await getUserCredits();
        setUserCredits(creditsData.credits);
      } catch (creditsErr) {
        console.error("Error loading credits:", creditsErr);
      }

      setIsLoading(false);
    } catch (err) {
      if (err.message === "No authentication token found") {
        setError("Please log in to view your profile");
      } else {
        setError("Failed to load profile data");
      }
      setIsLoading(false);
      console.error("Error loading profile:", err);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();

    if (
      !withdrawAmount ||
      isNaN(parseFloat(withdrawAmount)) ||
      parseFloat(withdrawAmount) <= 0
    ) {
      setWithdrawError("Please enter a valid amount greater than 0");
      return;
    }

    if (parseFloat(withdrawAmount) > userCredits) {
      setWithdrawError("Insufficient credits available");
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError("");

    try {
      await withdrawMoney(parseFloat(withdrawAmount));
      await fetchData(); // Refresh the data
      setShowWithdrawModal(false);
      setWithdrawAmount("");
    } catch (err) {
      console.error("Error withdrawing money:", err);
      setWithdrawError(
        err.error || "Failed to withdraw money. Please try again."
      );
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawAmountChange = (e) => {
    // Remove any non-numeric characters except decimal point
    let value = e.target.value.replace(/[^\d.]/g, "");

    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) {
      value = value.substring(0, value.indexOf(".", value.indexOf(".") + 1));
    }

    if (value.includes(".")) {
      const parts = value.split(".");
      value = parts[0] + "." + (parts[1] || "").slice(0, 2);
    }

    setWithdrawAmount(value);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  const monthlyPerformance = {
    labels: userData.monthly_performance.map((item) => item.month),
    datasets: [
      {
        label: "Portfolio Value ($)",
        data: userData.monthly_performance.map((item) => item.value),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.4,
      },
    ],
  };

  const generateColors = (count) => {
    const baseColors = [
      "rgba(59, 130, 246, 0.8)",    // Blue
      "rgba(16, 185, 129, 0.8)",    // Green
      "rgba(245, 158, 11, 0.8)",    // Yellow/Orange
      "rgba(139, 92, 246, 0.8)",    // Purple
      "rgba(236, 72, 153, 0.8)",    // Pink
      "rgba(239, 68, 68, 0.8)",     // Red
      "rgba(6, 182, 212, 0.8)",     // Cyan
      "rgba(132, 204, 22, 0.8)",    // Lime
      "rgba(249, 115, 22, 0.8)",    // Orange
      "rgba(168, 85, 247, 0.8)",    // Violet
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.508) % 360;
      colors.push(`hsla(${hue}, 70%, 50%, 0.8)`);
    }
    return colors;
  };

  // Debug sector allocation data
  console.log("Investment by index:", userData.investment_by_index);
  
  const indexLabels = Object.keys(userData.investment_by_index).length > 0
    ? Object.keys(userData.investment_by_index)
    : ["No Index Data"];
  
  const indexValues = Object.keys(userData.investment_by_index).length > 0
    ? Object.keys(userData.investment_by_index).map(key => userData.investment_by_index[key].current_value)
    : [userData.total_investments];
  
  // Generate appropriate number of colors
  const indexColors = generateColors(indexLabels.length);
  console.log("Index labels:", indexLabels);
  console.log("Index values:", indexValues);
  console.log("Index colors:", indexColors);

  const indexAllocation = {
    labels: indexLabels,
    datasets: [
      {
        data: indexValues,
        backgroundColor: indexColors,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 10,
          padding: 10,
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
      title: {
        display: true,
        text: "Portfolio Performance Over Time",
        font: {
          size: window.innerWidth < 768 ? 14 : 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: window.innerWidth < 768 ? "bottom" : "right",
        align: "center",
        labels: {
          boxWidth: 12,
          padding: window.innerWidth < 768 ? 10 : 15,
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            const labels = chart.data.labels;
            
            if (datasets.length === 0) {
              return [];
            }
            
            return labels.map((label, i) => {
              const meta = chart.getDatasetMeta(0);
              const style = meta.controller.getStyle(i);
              
              return {
                text: `${label} (${(datasets[0].data[i] / chart.data.datasets[0].data.reduce((a, b) => a + b, 0) * 100).toFixed(1)}%)`,
                fillStyle: datasets[0].backgroundColor[i],
                strokeStyle: style.borderColor,
                lineWidth: style.borderWidth,
                hidden: isNaN(datasets[0].data[i]) || meta.data[i].hidden,
                index: i
              };
            });
          }
        },
      },
      title: {
        display: true,
        text: "Investment by Index",
        font: {
          size: window.innerWidth < 768 ? 14 : 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const index = context.label;
            const value = context.raw;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value);
            
            // Get performance data for this index
            const indexData = userData.investment_by_index[index];
            const performanceText = indexData ? 
              ` (${indexData.performance >= 0 ? '+' : ''}${indexData.performance.toFixed(1)}%)` : '';
            
            return `${index}: ${formattedValue}${performanceText}`;
          }
        }
      }
    },
    cutout: '60%',
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 text-center sm:text-left">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center mb-2 sm:mb-0">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-200">
                  {userData.first_name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {`${userData.first_name} ${userData.last_name}`}
                </h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  Member since{" "}
                  {new Date(userData.date_joined).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="mb-2 text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Available Credits
                </p>
                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(userCredits)}
                </p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors duration-200 font-medium text-sm sm:text-base relative group"
              >
                <span>Withdraw</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Current Value
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(userData.total_investments)}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Portfolio Growth
            </h3>
            <p
              className={`text-2xl sm:text-3xl font-bold ${
                userData.portfolio_growth_percentage >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {userData.portfolio_growth_percentage !== undefined && userData.portfolio_growth_percentage !== null
                ? `${userData.portfolio_growth_percentage.toFixed(1)}%`
                : "0.0%"}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Initial Investment
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-gray-300">
              {formatCurrency(
                userData.active_investments.reduce(
                  (total, inv) => total + inv.amount,
                  0
                )
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6">
            <div className="h-[300px] sm:h-[400px]">
              <Line options={lineOptions} data={monthlyPerformance} />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6">
            <div className="h-[300px] sm:h-[400px]">
              <Doughnut options={doughnutOptions} data={indexAllocation} />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md p-4 sm:p-6 mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Investment Portfolio
          </h2>
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Index
                      </th>
                      <th
                        scope="col"
                        className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Investment
                      </th>
                      <th
                        scope="col"
                        className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Current Value
                      </th>
                      <th
                        scope="col"
                        className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Performance
                      </th>
                      <th
                        scope="col"
                        className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {userData.active_investments.map((investment, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {investment.index_name}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(investment.amount)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(investment.current_value)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">
                          {investment.performance.toFixed(1)}%
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                            {investment.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(investment.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link
            href="/forgot-password"
            className="flex items-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors"
          >
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Update your security credentials
              </p>
            </div>
          </Link>
          <Link
            href="/deposit-money"
            className="flex items-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors"
          >
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Deposit money
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Invest in an index right now
              </p>
            </div>
          </Link>
          <Link
            href="/profile/investment-history"
            className="flex items-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-md hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors"
          >
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Investment History
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                View your complete history
              </p>
            </div>
          </Link>
        </div>

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowWithdrawModal(false);
              setWithdrawAmount("");
              setWithdrawError("");
            }}
          >
            <div
              className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-lg shadow-xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
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
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Withdraw from Your Account
              </h3>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please enter the amount you would like to withdraw from your
                account.
              </p>

              <form onSubmit={handleWithdrawSubmit}>
                {withdrawError && (
                  <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                    {withdrawError}
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <label
                      htmlFor="withdrawAmount"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Withdrawal Amount ($)
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
                      type="text"
                      id="withdrawAmount"
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-8 pr-12 sm:text-sm border-gray-300 rounded-md py-2 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={handleWithdrawAmountChange}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setWithdrawAmount("");
                      setWithdrawError("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isWithdrawing ||
                      !withdrawAmount ||
                      parseFloat(withdrawAmount) <= 0 ||
                      parseFloat(withdrawAmount) > userCredits
                    }
                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white 
                                    ${
                                      isWithdrawing ||
                                      !withdrawAmount ||
                                      parseFloat(withdrawAmount) <= 0 ||
                                      parseFloat(withdrawAmount) > userCredits
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-primary-600 hover:bg-primary-700"
                                    }`}
                  >
                    {isWithdrawing ? "Processing..." : "Withdraw Now"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
