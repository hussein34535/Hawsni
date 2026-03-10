import apiClient from '@/lib/axios';

export const authService = {
    login: async (email: string, password: string): Promise<any> => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Login failed';
        }
    },

    register: async (userData: any): Promise<any> => {
        try {
            const response = await apiClient.post('/auth/register', userData);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Registration failed';
        }
    },

    verifyOtp: async (email: string, code: string): Promise<any> => {
        try {
            const response = await apiClient.post('/auth/verify-otp', { email, code });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'OTP verification failed';
        }
    },

    forgotPassword: async (email: string): Promise<any> => {
        try {
            const response = await apiClient.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to send reset email';
        }
    },

    resetPassword: async (code: string, password: string): Promise<any> => {
        try {
            const response = await apiClient.post('/auth/reset-password', { code, password });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to reset password';
        }
    },

    getProfile: async (): Promise<any> => {
        try {
            const response = await apiClient.get('/users/profile');
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to fetch profile';
        }
    },

    updateProfile: async (userData: any): Promise<any> => {
        try {
            const response = await apiClient.put('/users/profile', userData);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to update profile';
        }
    },

    uploadAvatar: async (file: File): Promise<any> => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await apiClient.post('/users/profile/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to upload avatar';
        }
    },

    changePassword: async (oldPassword: string, newPassword: string): Promise<any> => {
        try {
            const response = await apiClient.post('/auth/change-password', { oldPassword, newPassword });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to change password';
        }
    },

    logout: async (): Promise<void> => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
};
