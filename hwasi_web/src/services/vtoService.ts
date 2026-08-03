import apiClient from '@/lib/axios';

export const vtoService = {
    startTryOn: async (humanImageUrl: string, garmentImageUrl: string, description?: string): Promise<{ id: string }> => {
        try {
            const response = await apiClient.post('/vto/try-on', {
                human_image: humanImageUrl,
                garment_image: garmentImageUrl,
                description: description
            });
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.details || error.response?.data?.error || error.message;
            throw typeof detail === 'object' ? JSON.stringify(detail) : detail;
        }
    },

    checkStatus: async (id: string): Promise<{ status: 'idle' | 'processing' | 'succeeded' | 'failed' | 'canceled'; output?: string }> => {
        try {
            const response = await apiClient.get(`/vto/status/${id}`);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.details || error.response?.data?.error || error.message;
            throw typeof detail === 'object' ? JSON.stringify(detail) : detail;
        }
    }
};
