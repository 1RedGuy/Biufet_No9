import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AUTH_TOKEN_KEY = "token";

// Get the auth token from cookies
const getAuthHeader = () => {
  const token = Cookies.get(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all insurance policies for the current user
export const fetchUserPolicies = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/insurance/policies/`, {
      headers: {
        ...getAuthHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching insurance policies:", error);
    throw error;
  }
};

// Get eligible policies for claims
export const fetchEligiblePolicies = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/insurance/policies/eligible/`,
      {
        headers: {
          ...getAuthHeader(),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching eligible policies:", error);
    throw error;
  }
};

// Purchase insurance for an investment
export const purchaseInsurance = async (investmentId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/insurance/policies/`,
      { investment: investmentId },
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error purchasing insurance:", error);
    throw error;
  }
};

// File an insurance claim
export const fileClaim = async (policyId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/insurance/policies/${policyId}/claim/`,
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
    console.error("Error filing claim:", error);
    throw error;
  }
};

// Get all claims for the current user
export const fetchUserClaims = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/insurance/claims/`, {
      headers: {
        ...getAuthHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching claims:", error);
    throw error;
  }
};

/**
 * Claim insurance for an investment that has lost significant value
 * Returns the amount credited to the user account
 * @param {number} investmentId - The ID of the investment to claim insurance for
 * @returns {Promise<Object>} - The response data
 */
export const claimInsurance = async (investmentId) => {
  try {
    console.log(
      `Attempting to claim insurance for investment ID: ${investmentId}`
    );

    const response = await axios.post(
      `${API_BASE_URL}/investments/investments/${investmentId}/claim_insurance/`,
      {},
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Insurance claim successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error claiming insurance:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};
