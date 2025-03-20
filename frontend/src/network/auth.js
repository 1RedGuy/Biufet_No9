import axios from 'axios';
import Cookies from 'js-cookie';

// API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Cookie configuration from environment variables
const COOKIE_OPTIONS = {
  expires: parseInt(process.env.NEXT_PUBLIC_COOKIE_EXPIRES) || 7,
  secure: process.env.NEXT_PUBLIC_COOKIE_SECURE === 'true',
  sameSite: process.env.NEXT_PUBLIC_COOKIE_SAME_SITE || 'strict',
  path: '/'
};

// Auth keys from environment variables
const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'token';
const AUTH_USER_KEY = process.env.NEXT_PUBLIC_AUTH_USER_KEY || 'user';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important for cookies
});

const authService = {
  async register(email, password) {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
      });
      
      if (response.data.token) {
        // Store token in cookie
        Cookies.set(AUTH_TOKEN_KEY, response.data.token, COOKIE_OPTIONS);
        // Store user data in cookie
        Cookies.set(AUTH_USER_KEY, JSON.stringify(response.data.user), COOKIE_OPTIONS);
      }
      
      return response.data;
    } catch (error) {
      // Handle specific error cases
      if (error.response?.status === 409) {
        throw { message: 'Email already exists' };
      }
      if (error.response?.status === 400) {
        throw { message: error.response.data.message || 'Invalid registration data' };
      }
      throw { message: 'Registration failed. Please try again.' };
    }
  },

  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      if (response.data.token) {
        // Store token in cookie
        Cookies.set(AUTH_TOKEN_KEY, response.data.token, COOKIE_OPTIONS);
        // Store user data in cookie
        Cookies.set(AUTH_USER_KEY, JSON.stringify(response.data.user), COOKIE_OPTIONS);
      }
      
      return response.data;
    } catch (error) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw { message: 'Invalid email or password' };
      }
      if (error.response?.status === 400) {
        throw { message: error.response.data.message || 'Invalid login data' };
      }
      throw { message: 'Login failed. Please try again.' };
    }
  },

  logout() {
    // Remove cookies
    Cookies.remove(AUTH_TOKEN_KEY, COOKIE_OPTIONS);
    Cookies.remove(AUTH_USER_KEY, COOKIE_OPTIONS);
  },

  getCurrentUser() {
    const user = Cookies.get(AUTH_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return Cookies.get(AUTH_TOKEN_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Add axios interceptor to include token in all requests
  setupAxiosInterceptors() {
    api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle token expiration and other errors
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        if (error.response?.status === 403) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
};

// Setup interceptors when the service is imported
authService.setupAxiosInterceptors();

export default authService; 