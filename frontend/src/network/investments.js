import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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

// Get the auth token from cookies
const getAuthHeader = () => {
  const token = Cookies.get(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create a configured axios instance
const createApiInstance = () => {
  const token = Cookies.get(AUTH_TOKEN_KEY);

  const instance = axios.create({
    baseURL: API_BASE_URL,
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

// Get all investments for the current user
export const fetchUserInvestments = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/investments/investments/`,
      {
        headers: {
          ...getAuthHeader(),
        },
      }
    );

    console.log("Investments data:", response.data);

    // Map response data to include additional fields
    // like has_insurance that might be needed by the insurance module
    return response.data.map((investment) => ({
      ...investment,
      // This is a placeholder until the backend adds this field
      has_insurance: investment.insurance_claimed ?? false,
    }));
  } catch (error) {
    console.error("Error fetching investments:", error);
    throw error;
  }
};

// Get active investments for the current user
export const fetchActiveInvestments = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/investments/investments/active/`,
      {
        headers: {
          ...getAuthHeader(),
        },
      }
    );

    console.log("Active investments data:", response.data);

    return response.data.map((investment) => ({
      ...investment,
      has_insurance: investment.insurance_claimed ?? false,
    }));
  } catch (error) {
    console.error("Error fetching active investments:", error);
    throw error;
  }
};

// Create a new investment
export const createInvestment = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/investments/investments/`,
      data,
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating investment:", error);
    throw error;
  }
};

// Get a specific investment by ID
export const fetchInvestment = async (id) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/investments/investments/${id}/`,
      {
        headers: {
          ...getAuthHeader(),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching investment with ID ${id}:`, error);
    throw error;
  }
};

// Update an investment
export const updateInvestment = async (id, data) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/investments/investments/${id}/`,
      data,
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating investment with ID ${id}:`, error);
    throw error;
  }
};

// Sell/close an investment
export const sellInvestment = async (id) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/investments/investments/${id}/sell/`,
      {},
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error selling investment with ID ${id}:`, error);
    throw error;
  }
};

// Get executed investments for the current user
export const fetchExecutedInvestments = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/investments/investments/executed/`,
      {
        headers: {
          ...getAuthHeader(),
        },
      }
    );

    console.log("Executed investments data:", response.data);

    return response.data.map((investment) => ({
      ...investment,
      has_insurance: investment.insurance_claimed ?? false,
    }));
  } catch (error) {
    console.error("Error fetching executed investments:", error);
    throw error;
  }
};

const investmentsService = {
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

/**
 * Perform an emergency withdrawal of an investment
 * @param {number} investmentId - The ID of the investment to withdraw
 * @returns {Promise<Object>} - The response data
 */
export const emergencyWithdraw = async (investmentId) => {
  try {
    console.log(
      `Attempting emergency withdrawal for investment ID: ${investmentId}`
    );

    const response = await axios.post(
      `${API_BASE_URL}/investments/investments/${investmentId}/emergency_withdraw/`,
      {},
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Emergency withdrawal successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error processing emergency withdrawal:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

/**
 * Take insurance on an investment to receive the original investment amount as credits
 * @param {number} investmentId - The ID of the investment to take insurance on
 * @returns {Promise<Object>} - The response data
 */
export const takeInsurance = async (investmentId) => {
  try {
    console.log(`Taking insurance for investment ID: ${investmentId}`);

    const response = await axios.post(
      `${API_BASE_URL}/investments/investments/${investmentId}/take_insurance/`,
      {},
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Insurance taken successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error taking insurance:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

export default investmentsService;
