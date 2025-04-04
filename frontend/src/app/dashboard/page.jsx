"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import indexesService from "@/network/indexes";

export default function Dashboard() {
  const [indexes, setIndexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [stats, setStats] = useState({
    total_indexes: 0,
    active_indexes: 0,
    voting_indexes: 0,
    average_companies_per_index: 0,
  });

  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100",
    VOTING: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    ARCHIVED:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
    EXECUTED: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
  };

  const getStatusLabel = (status) => {
    const labels = {
      DRAFT: "Draft",
      VOTING: "Voting",
      ACTIVE: "Active",
      EXECUTED: "Executed",
      ARCHIVED: "Archived",
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Dashboard: Starting data fetch");

        const statusParam =
          activeFilter !== "all" ? { status: activeFilter } : {};

        const [indexesResponse, statsResponse] = await Promise.all([
          indexesService.getIndexes(statusParam),
          indexesService.getIndexStats(),
        ]);

        console.log("Dashboard: Received indexes response:", indexesResponse);
        console.log("Dashboard: Received stats response:", statsResponse);

        const indexList = indexesResponse.results || [];

        const formattedIndexes = indexList.map((index) => ({
          id: index.id,
          name: index.name,
          status: index.status,
          companyCount: index.company_count || 0,
          status: index.status,
          totalInvestment: index.total_investment
            ? index.total_investment >= 1000000
              ? `$${(index.total_investment / 1000000).toFixed(1)}M`
              : `$${index.total_investment.toLocaleString()}`
            : "$0",
          path: `/dashboard/${index.id}`,
        }));

        // Calculate average companies locally if needed
        const totalCompanies = formattedIndexes.reduce(
          (sum, index) => sum + index.companyCount,
          0
        );
        const avgCompanies =
          formattedIndexes.length > 0
            ? totalCompanies / formattedIndexes.length
            : 0;

        setIndexes(formattedIndexes);
        setStats({
          ...statsResponse,
          average_companies_per_index: avgCompanies,
        });
      } catch (error) {
        console.error("Dashboard: Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeFilter]);

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
        <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (indexes.length === 0) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
        <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
          <div className="lg:mt-14 mt-20 mx-auto max-w-screen-md text-center mb-8 lg:mb-16">
            <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
              Investment Groups
            </h2>
            <p className="text-gray-500 dark:text-gray-400 sm:text-xl mb-8">
              No investment groups available at the moment.
            </p>
            <div className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Link href="/auth/login">Log in to view investment groups</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
      <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
        <div className="lg:mt-14 mt-20 mx-auto max-w-screen-md text-center mb-8 lg:mb-16">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
            Investment Groups
          </h2>
          <p className="text-gray-600 dark:text-gray-300 sm:text-xl mb-8">
            Select a group to view its companies and choose which one to give
            your vote.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12 px-4">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 sm:px-5 py-2.5 text-sm sm:text-base rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              All Groups
            </button>
            <button
              onClick={() => setActiveFilter("active")}
              className={`px-4 sm:px-5 py-2.5 text-sm sm:text-base rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === "active"
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter("voting")}
              className={`px-4 sm:px-5 py-2.5 text-sm sm:text-base rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === "voting"
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              Voting
            </button>
            <button
              onClick={() => setActiveFilter("draft")}
              className={`px-4 sm:px-5 py-2.5 text-sm sm:text-base rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === "draft"
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setActiveFilter("archived")}
              className={`px-4 sm:px-5 py-2.5 text-sm sm:text-base rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === "archived"
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => setActiveFilter("executed")}
              className={`px-4 sm:px-5 py-2.5 text-sm sm:text-base rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === "executed"
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              Executed
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8 mb-10">
          <div className="p-6 bg-white/90 dark:bg-gray-700/90 rounded-xl shadow-lg dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">
              Total Groups
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total_indexes}
            </p>
          </div>
          <div className="p-6 bg-white/90 dark:bg-gray-700/90 rounded-xl shadow-lg dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">
              Active Groups
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.active_indexes}
            </p>
          </div>
          <div className="p-6 bg-white/90 dark:bg-gray-700/90 rounded-xl shadow-lg dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">
              Avg. Companies
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.average_companies_per_index?.toFixed(1) || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
          {indexes.map((index) => (
            <Link
              key={index.id}
              href={index.path}
              className="group relative p-6 bg-white/90 dark:bg-gray-700/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-800 min-h-[200px] flex flex-col cursor-pointer hover:-translate-y-1"
            >
              <div className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex justify-center items-center w-10 h-10 rounded-lg bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                      <svg
                        className="w-5 h-5 text-primary-600 lg:w-6 lg:h-6 dark:text-primary-300 group-hover:text-primary-700 dark:group-hover:text-primary-200 transition-colors"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        <span className="text-gray-600 dark:text-gray-300">
                          Invested{" "}
                        </span>
                        <span className="block mt-1 text-base font-bold">
                          {index.totalInvestment}
                        </span>
                      </p>
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {index.name}
                  </h3>
                  {index.status && (
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusColors[index.status]
                        }`}
                      >
                        {getStatusLabel(index.status)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between text-gray-600 dark:text-gray-300 text-sm font-medium">
                  <span className="text-xl">
                    {index.companyCount} Companies
                  </span>
                  <span className="text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
