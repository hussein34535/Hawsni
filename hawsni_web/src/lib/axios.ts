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
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
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
                        error.config.headers.Authorization = `Bearer ${res.data.token}`;
                        isRefreshing = false;
                        return apiClient(error.config);
                    }
                } catch {
                    // Refresh failed
                }
                isRefreshing = false;
            }

            // No refresh token or refresh failed — logout
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');

            // We only clear local storage on 401 to ensure the user is logged out system-wide.
            // We DO NOT force a window.location redirect here, as it breaks the UX for guests
            // on pages that might make background auth-checks (like product pages).
            // Protected routes should handle redirects individually based on auth state.
        }
        return Promise.reject(error);
    }
);

export default apiClient;
