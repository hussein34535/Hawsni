import apiClient from '@/lib/axios';

export const vtoService = {
    startTryOn: async (humanImageUrl: string, garmentImageUrl: string): Promise<{ id: string }> => {
        try {
            const response = await apiClient.post('/vto/try-on', {
                human_image: humanImageUrl,
                garment_image: garmentImageUrl
            });
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to start AI Try-On';
        }
    },

    checkStatus: async (id: string): Promise<{ status: 'idle' | 'processing' | 'succeeded' | 'failed' | 'canceled'; output?: string }> => {
        try {
            const response = await apiClient.get(`/vto/status/${id}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data?.message || 'Failed to check AI status';
        }
    }
};
