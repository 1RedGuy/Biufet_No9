import axiosInstance from './axios';

export const dashboardService = {
    // Fetch all investment groups
    getGroups: async () => {
        try {
            const response = await axiosInstance.get('/groups/');
            return response.data;
        } catch (error) {
            console.error('Error fetching groups:', error);
            throw error;
        }
    },

    // Fetch companies for a specific group/index
    getCompaniesByGroup: async (groupId) => {
        try {
            const response = await axiosInstance.get(`/groups/${groupId}/companies`);
            return response.data;
        } catch (error) {
            console.error('Error fetching companies:', error);
            throw error;
        }
    },

    // Fetch specific group details
    getGroupDetails: async (groupId) => {
        try {
            const response = await axiosInstance.get(`/groups/${groupId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching group details:', error);
            throw error;
        }
    },

    // Fetch company details
    getCompanyDetails: async (companyId) => {
        try {
            const response = await axiosInstance.get(`/companies/${companyId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching company details:', error);
            throw error;
        }
    }
};
