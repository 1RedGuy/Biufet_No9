import axios from "axios";
import Cookies from "js-cookie";

// API URL and token key using hardcoded values
const API_URL = "http://localhost:8000/";
const AUTH_TOKEN_KEY = "token";
const AUTH_REFRESH_KEY = "refresh";
const AUTH_USER_KEY = "user";
const COOKIE_OPTIONS = { expires: 7, path: '/' };

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

const authService = {
  async register(userData) {
    try {
      console.log("Registering with data:", userData);
      const api = createApiInstance();
      const response = await api.post(`accounts/signup/`, userData);

      if (response.data && response.data.token) {
        console.log("Registration successful, setting token");
        Cookies.set(AUTH_TOKEN_KEY, response.data.token, { expires: 7 });

        // Store user data if available
        if (response.data.user) {
          Cookies.set("user", JSON.stringify(response.data.user), {
            expires: 7,
          });
        }

        // Setup axios interceptors after successful authentication
        setupAxiosInterceptors();
      }

      return response.data;
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  async login(username, password) {
    try {
      const api = createApiInstance();
      const response = await api.post("accounts/login/", {
        username,
        password,
      });

      if (!response.data || !response.data.access) {
        throw new Error("Invalid response from server");
      }

      // Store access token
      Cookies.set(AUTH_TOKEN_KEY, response.data.access, COOKIE_OPTIONS);
      
      // Store refresh token if available
      if (response.data.refresh) {
        Cookies.set(AUTH_REFRESH_KEY, response.data.refresh, COOKIE_OPTIONS);
      }

      // Store user data if available
      if (response.data.user) {
        Cookies.set(AUTH_USER_KEY, JSON.stringify(response.data.user), COOKIE_OPTIONS);
      }

      return {
        ...response.data,
        token: response.data.access // Add token property for compatibility
      };
    } catch (error) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error("Invalid username or password");
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || "Invalid login data");
      }
      throw new Error("Login failed. Please try again.");
    }
  },

  logout() {
    console.log("Logging out, removing auth tokens");
    // Remove auth tokens
    Cookies.remove(AUTH_TOKEN_KEY);
    Cookies.remove("user");

    // Redirect to login page
    window.location.href = "/login";
  },

  getCurrentUser() {
    try {
      const userString = Cookies.get("user");
      if (!userString) return null;
      return JSON.parse(userString);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  },

  getToken() {
    // Get the authentication token from cookies
    const token = Cookies.get(AUTH_TOKEN_KEY);
    console.log("Retrieved token:", token ? "Token exists" : "No token found");
    return token;
  },

  isAuthenticated() {
    // Check if the user has a valid token
    return !!this.getToken();
  },

  async refreshToken() {
    try {
      const refreshToken = Cookies.get("refresh");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const api = createApiInstance();
      const response = await api.post("accounts/token/refresh/", {
        refresh: refreshToken,
      });

      if (response.data && response.data.access) {
        Cookies.set(AUTH_TOKEN_KEY, response.data.access, { expires: 7 });
        return response.data.access;
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      this.logout();
      throw error;
    }
  },
};

// Setup interceptors when the module is imported
const setupAxiosInterceptors = () => {
  const token = Cookies.get(AUTH_TOKEN_KEY);

  if (token) {
    console.log("Found token, setting up axios interceptors on load");

    // Remove any existing interceptors first
    axios.interceptors.request.eject(axios.interceptors.request.handlers?.[0]);
    axios.interceptors.response.eject(
      axios.interceptors.response.handlers?.[0]
    );

    // Add authorization header to all requests
    axios.interceptors.request.use(
      (config) => {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle 401 responses (unauthorized)
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            await authService.refreshToken();

            // Update the token in the request and retry
            const newToken = Cookies.get(AUTH_TOKEN_KEY);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // If refresh fails, logout and reject
            console.log("Token refresh failed, logging out");
            Cookies.remove(AUTH_TOKEN_KEY);
            Cookies.remove("user");
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }
};

// Run setup on initial load
setupAxiosInterceptors();

export default authService;
