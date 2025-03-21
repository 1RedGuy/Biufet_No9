import axios from "axios";
import Cookies from "js-cookie";

// API URL and token key using hardcoded values
const API_URL = "http://localhost:8000/";
const AUTH_TOKEN_KEY = "token";

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

// Mock data for fallback when API is unavailable
const mockIndexes = [
  {
    id: 1,
    name: "Technology",
    description: "Tech companies and startups",
    company_count: 15,
    total_investment: 2500000,
  },
  {
    id: 2,
    name: "Healthcare",
    description: "Healthcare and biotech companies",
    company_count: 8,
    total_investment: 1800000,
  },
  {
    id: 3,
    name: "Finance",
    description: "Financial services and fintech",
    company_count: 12,
    total_investment: 3200000,
  },
];

const indexesService = {
  async getIndexes(params = {}) {
    try {
      // Check for token
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        console.log("No auth token available, returning mock data");
        return { results: mockIndexes };
      }

      // Create fresh api instance with current token
      const api = createApiInstance();

      // Make the request
      const response = await api.get("indexes/", { params });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch indexes:", error.message);
      // Return mock data instead of throwing
      return { results: mockIndexes };
    }
  },

  async getIndexDetails(id) {
    try {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        // Find mock data for this ID
        const mockIndex = mockIndexes.find((index) => index.id === Number(id));
        return mockIndex || null;
      }

      const api = createApiInstance();
      const response = await api.get(`indexes/${id}/`);
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch index details for ID ${id}:`,
        error.message
      );
      // Find mock data for this ID
      const mockIndex = mockIndexes.find((index) => index.id === Number(id));
      return mockIndex || null;
    }
  },

  async getIndexCompaniesStats(id) {
    try {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        return {
          total_companies: 0,
          total_market_cap: 0,
          average_price: 0,
          companies_by_market_cap: [],
        };
      }

      const api = createApiInstance();
      const response = await api.get(`indexes/${id}/companies_stats/`);
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch companies stats for index ID ${id}:`,
        error.message
      );
      return {
        total_companies: 0,
        total_market_cap: 0,
        average_price: 0,
        companies_by_market_cap: [],
      };
    }
  },

  async getIndexStats() {
    try {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        return {
          total_indexes: mockIndexes.length,
          active_indexes: mockIndexes.length,
          average_companies_per_index: 12,
        };
      }

      const api = createApiInstance();
      const response = await api.get("indexes/stats/");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch index stats:", error.message);
      return {
        total_indexes: mockIndexes.length,
        active_indexes: mockIndexes.length,
        average_companies_per_index: 12,
      };
    }
  },

  async activateIndex(id) {
    try {
      const api = createApiInstance();
      const response = await api.post(`indexes/${id}/activate/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to activate index ${id}:`, error.message);
      throw error;
    }
  },

  async archiveIndex(id) {
    try {
      const api = createApiInstance();
      const response = await api.post(`indexes/${id}/archive/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to archive index ${id}:`, error.message);
      throw error;
    }
  },
};

export default indexesService;
