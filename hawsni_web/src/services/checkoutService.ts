import apiClient from '@/lib/axios';

export interface OrderItem {
    product: string; // matches backend expectation
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
}

export interface OrderData {
    items: OrderItem[];
    shippingAddress: string;
    paymentMethod: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    totalAmount: number;
    couponCode?: string;
    guestName?: string;
    guestPhone?: string;
    guestEmail?: string;
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

    placeOrder: async (orderData: OrderData): Promise<{ success: boolean; order: any }> => {
        try {
            const response = await apiClient.post('/orders', orderData);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to place order';
        }
    }
};
