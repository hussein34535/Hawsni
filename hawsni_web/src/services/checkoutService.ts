import apiClient from '@/lib/axios';

export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    imageUrl?: string;
}

export interface OrderData {
    items: OrderItem[];
    shippingAddress: string; // Address ID or full address string depending on backend
    paymentMethod: 'cod' | 'card';
    totalAmount: number;
    shippingFee: number;
    couponCode?: string;
}

export const checkoutService = {
    placeOrder: async (orderData: OrderData): Promise<{ success: boolean; order: any }> => {
        try {
            const response = await apiClient.post('/orders', orderData);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to place order';
        }
    },

    getShippingMethods: async (): Promise<{ success: boolean; methods: any[] }> => {
        try {
            const response = await apiClient.get('/shipping');
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load shipping methods';
        }
    }
};
