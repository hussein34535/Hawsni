import apiClient from '@/lib/axios';

export interface OrderItem {
    product: string; // matches backend expectation
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    size?: string;
    color?: string;
    accessories?: any[];
}

export interface OrderData {
    items: OrderItem[];
    shippingAddress: any;
    paymentMethod: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    totalAmount: number;
    couponCode?: string;
    guestName?: string;
    guestPhone?: string;
    guestAlternativePhone?: string;
    guestEmail?: string;
    notes?: string;
    conversionEventId?: string; // For Meta CAPI deduplication
}

export const checkoutService = {
    getShippingSettings: async (): Promise<{ success: boolean; settings: any }> => {
        try {
            const response = await apiClient.get('/shipping/settings');
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load shipping settings';
        }
    },

    getCities: async (): Promise<{ success: boolean; cities: any[] }> => {
        try {
            const response = await apiClient.get('/shipping/cities');
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load cities';
        }
    },

    getDistricts: async (cityId: string): Promise<{ success: boolean; districts: any[] }> => {
        try {
            const response = await apiClient.get(`/shipping/districts/${cityId}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load districts';
        }
    },

    placeOrder: async (orderData: OrderData): Promise<{ success: boolean; order: any }> => {
        try {
            const response = await apiClient.post('/orders', orderData);
            return response.data;
        } catch (error: any) {
            const serverError = error.response?.data;
            if (serverError?.errors && Array.isArray(serverError.errors)) {
                // Join express-validator errors into a single string
                throw serverError.errors.map((e: any) => e.msg).join(' - ');
            }
            throw serverError?.message || 'Failed to place order';
        }
    },

    getOrder: async (id: string): Promise<{ success: boolean; order: any }> => {
        try {
            const response = await apiClient.get(`/orders/${id}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load order';
        }
    },

    updateOrder: async (id: string, orderData: any): Promise<{ success: boolean; order: any }> => {
        try {
            const response = await apiClient.put(`/orders/${id}`, orderData);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to update order';
        }
    }
};
