import apiClient from '@/lib/axios';

export interface Address {
    _id: string;
    type: 'home' | 'office' | 'other';
    street: string;
    city: string;
    state?: string;
    country: string;
    isDefault: boolean;
}

export const addressService = {
    getAddresses: async (): Promise<{ success: boolean; addresses: Address[] }> => {
        try {
            const response = await apiClient.get('/users/addresses');
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load addresses';
        }
    },

    addAddress: async (addressData: Omit<Address, '_id'>): Promise<{ success: boolean; address: Address }> => {
        try {
            const response = await apiClient.post('/users/addresses', addressData);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to add address';
        }
    },

    updateAddress: async (id: string, addressData: Partial<Address>): Promise<{ success: boolean; address: Address }> => {
        try {
            const response = await apiClient.put(`/users/addresses/${id}`, addressData);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to update address';
        }
    },

    deleteAddress: async (id: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await apiClient.delete(`/users/addresses/${id}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to delete address';
        }
    }
};
