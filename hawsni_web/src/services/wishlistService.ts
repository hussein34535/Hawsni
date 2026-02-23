import apiClient from '@/lib/axios';
import { Product } from '@/types';

export const wishlistService = {
    getWishlist: async (): Promise<{ success: boolean; wishlist: any[] }> => {
        try {
            const response = await apiClient.get('/wishlist');
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load wishlist';
        }
    },

    addToWishlist: async (productId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await apiClient.post(`/wishlist/products/${productId}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to add to wishlist';
        }
    },

    removeFromWishlist: async (productId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await apiClient.delete(`/wishlist/products/${productId}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to remove from wishlist';
        }
    }
};
