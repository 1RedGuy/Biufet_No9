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

const investmentsService = {
  // Create a new investment in an index
  async createInvestment(indexId, amount) {
    try {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        console.error("No auth token available");
        throw new Error("Authentication required");
      }

      const api = createApiInstance();
      const response = await api.post("investments/", {
        index_id: indexId,
        amount: amount,
      });

      return response.data;
    } catch (error) {
      console.error("Failed to create investment:", error.message);
      throw error;
    }
  },

  // Get all user investments
  async getUserInvestments() {
    try {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        console.error("No auth token available");
        throw new Error("Authentication required");
      }

      const api = createApiInstance();
      const response = await api.get("investments/");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user investments:", error.message);
      throw error;
    }
  },

  // Get investment details by ID
  async getInvestmentDetails(id) {
    try {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        console.error("No auth token available");
        throw new Error("Authentication required");
      }

      const api = createApiInstance();
      const response = await api.get(`investments/${id}/`);
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch investment details for ID ${id}:`,
        error.message
      );
      throw error;
    }
  },

  // Get investment statistics
  async getInvestmentStats() {
    try {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        console.error("No auth token available");
        throw new Error("Authentication required");
      }

      const api = createApiInstance();
      const response = await api.get("investments/statistics/");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch investment statistics:", error.message);
      throw error;
    }
  },

  // Withdraw an investment
  async withdrawInvestment(id) {
    try {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) {
        console.error("No auth token available");
        throw new Error("Authentication required");
      }

      const api = createApiInstance();
      const response = await api.post(`investments/${id}/withdraw/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to withdraw investment ID ${id}:`, error.message);
      throw error;
    }
  },
};

export default investmentsService;
