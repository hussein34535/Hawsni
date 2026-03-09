import apiClient from '@/lib/axios';

export interface Review {
    _id: string;
    productId: string;
    user: {
        _id: string;
        name: string;
        avatar_url?: string;
    };
    rating: number;
    comment: string;
    images?: string[];
    created_at?: string;  // Supabase returns snake_case
    createdAt?: string;   // kept for compatibility
}

export const reviewService = {
    getProductReviews: async (productId: string): Promise<{ success: boolean; reviews: Review[] }> => {
        try {
            const response = await apiClient.get(`/reviews/product/${productId}`);
            return response.data;
        } catch (error: any) {
            console.error('Failed to fetch reviews:', error);
            return { success: false, reviews: [] };
        }
    },

    createReview: async (productId: string, rating: number, comment: string, images: string[] = []): Promise<{ success: boolean; review?: Review; message?: string }> => {
        try {
            const response = await apiClient.post('/reviews', { productId, rating, comment, images });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to submit review';
        }
    }
};
