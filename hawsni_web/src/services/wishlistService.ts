import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

const GUEST_WISHLIST_KEY = 'guest_wishlist';

export const wishlistService = {
    getWishlist: async (): Promise<{ success: boolean; wishlist: any[] }> => {
        const token = typeof window !== 'undefined' ? useAuthStore.getState().token : null;
        
        if (!token) {
            const guestList = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || '[]') : [];
            return { 
                success: true, 
                wishlist: guestList.map((product: any) => ({ product })) 
            };
        }

        try {
            const response = await apiClient.get('/wishlist');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                const guestList = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || '[]') : [];
                return { 
                    success: true, 
                    wishlist: guestList.map((product: any) => ({ product })) 
                };
            }
            throw error.response?.data?.message || 'Failed to load wishlist';
        }
    },

    addToWishlist: async (product: any): Promise<{ success: boolean; message: string }> => {
        const token = typeof window !== 'undefined' ? useAuthStore.getState().token : null;
        const productId = product._id || product.id;

        if (!token) {
            const guestList = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || '[]');
            if (!guestList.some((p: any) => (p._id || p.id) === productId)) {
                guestList.push(product);
                localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(guestList));
            }
            return { success: true, message: 'Added to favorites' };
        }

        try {
            const response = await apiClient.post(`/wishlist/products/${productId}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to add to wishlist';
        }
    },

    removeFromWishlist: async (productId: string): Promise<{ success: boolean; message: string }> => {
        const token = typeof window !== 'undefined' ? useAuthStore.getState().token : null;

        if (!token) {
            const guestList = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || '[]');
            const newList = guestList.filter((p: any) => (p._id || p.id) !== productId);
            localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(newList));
            return { success: true, message: 'Removed from favorites' };
        }

        try {
            const response = await apiClient.delete(`/wishlist/products/${productId}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to remove from wishlist';
        }
    }
};
