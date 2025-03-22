import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AUTH_TOKEN_KEY = 'token';

export const fetchUserProfile = async () => {
    try {
        const token = Cookies.get(AUTH_TOKEN_KEY);
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_BASE_URL}/accounts/profile/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Raw profile response:', response);
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
        }
        throw error;
    }
};

// Note: Withdraw functionality will be implemented later when backend is ready

export const fetchWithdrawableInvestments = async () => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/investments/withdrawable/`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching withdrawable investments:', error);
        throw error;
    }
};
