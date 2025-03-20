import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Cookie configuration
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/'
};

const authService = {
  async register(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
      });
      
      if (response.data.token) {
        // Store token in cookie
        Cookies.set('token', response.data.token, COOKIE_OPTIONS);
        // Store user data in cookie
        Cookies.set('user', JSON.stringify(response.data.user), COOKIE_OPTIONS);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      
      if (response.data.token) {
        // Store token in cookie
        Cookies.set('token', response.data.token, COOKIE_OPTIONS);
        // Store user data in cookie
        Cookies.set('user', JSON.stringify(response.data.user), COOKIE_OPTIONS);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  logout() {
    // Remove cookies
    Cookies.remove('token', COOKIE_OPTIONS);
    Cookies.remove('user', COOKIE_OPTIONS);
  },

  getCurrentUser() {
    const user = Cookies.get('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return Cookies.get('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Add axios interceptor to include token in all requests
  setupAxiosInterceptors() {
    axios.interceptors.request.use(
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

    // Handle token expiration
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
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