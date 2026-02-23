import apiClient from '@/lib/axios';

export interface Coupon {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountAmount: number;
    minOrderAmount?: number;
    expiryDate: string;
}

export const couponService = {
    getCoupons: async (): Promise<{ success: boolean; coupons: Coupon[] }> => {
        try {
            const response = await apiClient.get('/coupons');
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load coupons';
        }
    },

    validateCoupon: async (code: string): Promise<{ success: boolean; coupon: Coupon }> => {
        try {
            const response = await apiClient.post('/coupons/validate', { code });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Invalid coupon code';
        }
    }
};
