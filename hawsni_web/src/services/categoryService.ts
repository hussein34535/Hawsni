import apiClient from '@/lib/axios';
import { Category } from '@/types';

const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    // Base domain logic
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

export const categoryService = {
    getCategories: async (): Promise<{ success: boolean; categories: Category[] }> => {
        try {
            const response = await apiClient.get('/categories');
            const cats = response.data?.categories || [];
            if (response.data?.success && Array.isArray(cats)) {
                return {
                    ...response.data,
                    categories: cats.map((cat: any) => ({
                        ...cat,
                        image: formatImageUrl(cat.image)
                    }))
                };
            }
            return { success: false, categories: [] };
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load categories';
        }
    }
};
