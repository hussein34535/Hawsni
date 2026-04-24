import apiClient from '@/lib/axios';

export interface Address {
    _id: string;
    type: 'home' | 'office' | 'other';
    street: string;
    city: string;
    state?: string;
    country: string;
    isDefault: boolean;
    is_default?: boolean; // backend uses snake_case
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
            const data = { ...addressData };
            if ((data as any).isDefault !== undefined) {
                (data as any).is_default = (data as any).isDefault;
                delete (data as any).isDefault;
            }
            const response = await apiClient.post('/users/addresses', data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to add address';
        }
    },

    updateAddress: async (id: string, addressData: Partial<Address>): Promise<{ success: boolean; address: Address }> => {
        try {
            // Map camelCase to snake_case for backend
            const data = { ...addressData };
            if (data.isDefault !== undefined) {
                (data as any).is_default = data.isDefault;
                delete data.isDefault;
            }
            const response = await apiClient.put(`/users/addresses/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to update address';
        }
    },

    setDefaultAddress: async (id: string): Promise<any> => {
        try {
            const response = await apiClient.put(`/users/addresses/${id}`, { is_default: true });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to set default address';
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
