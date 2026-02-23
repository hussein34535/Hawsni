import apiClient from '@/lib/axios';
import { Category } from '@/types';

const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    // Base domain logic from Flutter code
    const baseUrl = 'https://hwasibackend.vercel.app';
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

export const categoryService = {
    getCategories: async (): Promise<{ success: boolean; categories: Category[] }> => {
        try {
            const response = await apiClient.get('/categories');
            if (response.data.success) {
                return {
                    ...response.data,
                    categories: response.data.categories.map((cat: any) => ({
                        ...cat,
                        image: formatImageUrl(cat.image)
                    }))
                };
            }
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to load categories';
        }
    }
};
