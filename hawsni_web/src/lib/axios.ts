import axios from 'axios';

export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Handle 401 — try to refresh token or redirect to login
let isRefreshing = false;

apiClient.interceptors.response.use(
    (response) => {
        // Check for HTML response when expecting JSON
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
            console.error('⚠️ Received HTML response from API instead of JSON');
            return Promise.reject({
                message: 'السيرفر يواجه مشكلة حالياً، يرجى المحاولة لاحقاً.',
                isHtmlError: true,
                response
            });
        }
        return response;
    },
    async (error) => {
        const { response, config } = error;

        if (response?.status === 401 && typeof window !== 'undefined') {
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken && !isRefreshing) {
                isRefreshing = true;
                try {
                    const res = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api'}/auth/refresh`,
                        { refresh_token: refreshToken }
                    );
                    if (res.data?.token) {
                        localStorage.setItem('token', res.data.token);
                        if (res.data.refresh_token) {
                            localStorage.setItem('refresh_token', res.data.refresh_token);
                        }
                        // Retry original request
                        if (config) {
                            config.headers.Authorization = `Bearer ${res.data.token}`;
                            isRefreshing = false;
                            return apiClient(config);
                        }
                    }
                } catch (refreshErr) {
                    console.error('Token refresh failed:', refreshErr);
                }
                isRefreshing = false;
            }

            // No refresh token or refresh failed — logout
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        }

        // Handle Non-JSON (HTML) errors like Vercel Lambda timeouts or 500s
        const contentType = response?.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
            error.message = 'حدث خطأ في النظام؛ السيرفر غير قادر على معالجة الطلب حالياً.';
        }

        return Promise.reject(error);
    }
);

export default apiClient;
