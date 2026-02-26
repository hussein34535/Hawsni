import apiClient from '@/lib/axios';
import { Product } from '@/types';

export const productService = {
    getProducts: async (categoryId?: string): Promise<{ success: boolean; products: Product[] }> => {
        try {
            let endpoint = '/products';
            if (categoryId && categoryId !== 'All' && categoryId !== 'Featured') {
                endpoint += `?category=${categoryId}`;
            }
            const response = await apiClient.get(endpoint);
            return {
                success: response.data?.success || false,
                products: Array.isArray(response.data?.products) ? response.data.products : []
            };
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load products';
        }
    },

    getProductById: async (id: string): Promise<{ success: boolean; product: Product }> => {
        try {
            const response = await apiClient.get(`/products/${id}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load product detail';
        }
    },

    getFeaturedProducts: async (): Promise<{ success: boolean; products: Product[] }> => {
        try {
            const response = await apiClient.get('/products/featured');
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load featured products';
        }
    }
};
