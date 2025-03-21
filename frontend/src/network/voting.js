import axios from "axios";
import Cookies from "js-cookie";

// API URL and token key using hardcoded values
const API_URL = "http://localhost:8000/";
const AUTH_TOKEN_KEY = "token";

// Add a debug log to check URL
console.log("Voting service initialized with API URL:", API_URL);

// Helper function to log requests and responses for debugging
const logRequest = (method, url, data = null, headers = null) => {
  console.log(`📤 ${method} Request:`, url);
  if (data) console.log("Request Data:", data);
  if (headers) console.log("Request Headers:", headers);
};

const logResponse = (response) => {
  console.log(`📥 Response (${response.status}):`, response.data);
  return response;
};

const logError = (error) => {
  console.error("🚨 API Error:", {
    status: error.response?.status,
    message: error.message,
    data: error.response?.data,
  });
  return Promise.reject(error);
};

// Create a configured axios instance
const createApiInstance = () => {
  const token = Cookies.get(AUTH_TOKEN_KEY);

  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    withCredentials: true,
  });

  // Log all requests and responses
  instance.interceptors.request.use(
    (config) => {
      logRequest(
        config.method.toUpperCase(),
        config.url,
        config.data,
        config.headers
      );
      return config;
    },
    (error) => logError(error)
  );

  instance.interceptors.response.use(
    (response) => logResponse(response),
    (error) => logError(error)
  );

  return instance;
};

const votingService = {
  async getIndexVotingStatus(indexId) {
    try {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        console.log("No auth token available for voting status");
        return {
          is_voting_active: false,
          has_investment: false,
          has_voted: false,
          active_investments: [],
          min_votes_per_user: 1,
          max_votes_per_user: 5,
        };
      }

      const api = createApiInstance();
      const response = await api.get(
        `voting/index-voting-status/?index_id=${indexId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch voting status for index ID ${indexId}:`,
        error.message
      );
      // Return a default object if the API fails
      return {
        is_voting_active: true, // Default to true to enable voting UI
        has_investment: true, // Default to true to enable voting UI
        has_voted: false,
        active_investments: [],
        min_votes_per_user: 1,
        max_votes_per_user: 5,
      };
    }
  },

  async getMyVotes(indexId) {
    try {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        return [];
      }

      const api = createApiInstance();
      const response = await api.get(
        `voting/votes/my_votes/?index_id=${indexId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch my votes for index ID ${indexId}:`,
        error.message
      );
      throw error;
    }
  },

  async submitVotes(indexId, companyIds, investmentId) {
    try {
      console.log("Submitting votes with data:", {
        index_id: indexId,
        company_ids: companyIds,
        investment_id: investmentId,
      });

      const api = createApiInstance();
      const response = await api.post(`voting/votes/submit_votes/`, {
        index_id: indexId,
        company_ids: companyIds,
        investment_id: investmentId,
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to submit votes for index ID ${indexId}:`, error);

      // Enhanced error logging to help with debugging
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }

      throw error;
    }
  },
};

export default votingService;
