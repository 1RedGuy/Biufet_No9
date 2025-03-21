import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AUTH_TOKEN_KEY = 'token';

export const depositMoney = async (amount) => {
  try {
    const token = Cookies.get(AUTH_TOKEN_KEY);
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/accounts/users/add_credits/`,
      { amount },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to deposit money' };
  }
};

export const getUserCredits = async () => {
  try {
    const token = Cookies.get(AUTH_TOKEN_KEY);
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(
      `${API_BASE_URL}/accounts/users/credits/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get user credits' };
  }
};
