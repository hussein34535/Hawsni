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

            // Paths that are allowed to handle 401 gracefully (e.g., guest wishlist)
            const guestAllowedPaths = ['/wishlist'];
            const currentPath = window.location.pathname;
            const isGuestAllowed = guestAllowedPaths.some(path => currentPath.startsWith(path));

            if (!window.location.pathname.includes('/login') && !isGuestAllowed) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
