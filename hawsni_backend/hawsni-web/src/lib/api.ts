// API Configuration for hwasi Backend
const API_BASE_URL = 'https://hwasibackend.vercel.app/api';

interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}

// Generic fetch wrapper with auth support
async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hwasi_token') : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.message || 'Something went wrong',
                status: response.status,
            };
        }

        return { data, status: response.status };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Network error',
            status: 500,
        };
    }
}

// ==================== PRODUCTS API ====================
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    images?: string[];
    category?: string;
    rating: number;
    reviewCount: number;
    sizes?: string[];
    colors?: Array<{ color: string; name?: string }>;
    stock?: number;
}

export const productsApi = {
    getAll: () => fetchApi<Product[]>('/products'),
    getById: (id: string) => fetchApi<Product>(`/products/${id}`),
    getByCategory: (categoryId: string) =>
        fetchApi<Product[]>(`/products?category=${categoryId}`),
    search: (query: string) =>
        fetchApi<Product[]>(`/products/search?q=${encodeURIComponent(query)}`),
};

// ==================== CATEGORIES API ====================
export interface Category {
    id: string;
    name: string;
    imageUrl?: string;
}

export const categoriesApi = {
    getAll: () => fetchApi<Category[]>('/categories'),
};

// ==================== CART API ====================
export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    size?: string;
    color?: string;
}

export const cartApi = {
    get: () => fetchApi<CartItem[]>('/cart'),
    add: (item: Omit<CartItem, 'id'>) =>
        fetchApi<CartItem>('/cart', {
            method: 'POST',
            body: JSON.stringify(item),
        }),
    update: (id: string, quantity: number) =>
        fetchApi<CartItem>(`/cart/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity }),
        }),
    remove: (id: string) =>
        fetchApi<void>(`/cart/${id}`, { method: 'DELETE' }),
    clear: () => fetchApi<void>('/cart', { method: 'DELETE' }),
};

// ==================== AUTH API ====================
export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatar?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export const authApi = {
    login: (email: string, password: string) =>
        fetchApi<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),
    register: (data: { name: string; email: string; password: string; phone?: string }) =>
        fetchApi<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    getProfile: () => fetchApi<User>('/auth/profile'),
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('hwasi_token');
        }
    },
};

// ==================== VTO (Virtual Try-On) API ====================
export interface VtoRequest {
    userImageUrl: string;
    productImageUrl: string;
}

export interface VtoResponse {
    predictionId: string;
    status: 'starting' | 'processing' | 'succeeded' | 'failed';
    output?: string;
}

export const vtoApi = {
    generate: (data: VtoRequest) =>
        fetchApi<VtoResponse>('/vto/generate', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    checkStatus: (predictionId: string) =>
        fetchApi<VtoResponse>(`/vto/status/${predictionId}`),
};

// ==================== WISHLIST API ====================
export const wishlistApi = {
    get: () => fetchApi<Product[]>('/wishlist'),
    add: (productId: string) =>
        fetchApi<void>('/wishlist', {
            method: 'POST',
            body: JSON.stringify({ productId }),
        }),
    remove: (productId: string) =>
        fetchApi<void>(`/wishlist/${productId}`, { method: 'DELETE' }),
};

// ==================== REVIEWS API ====================
export interface Review {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export const reviewsApi = {
    getByProduct: (productId: string) =>
        fetchApi<Review[]>(`/products/${productId}/reviews`),
    add: (productId: string, data: { rating: number; comment: string }) =>
        fetchApi<Review>(`/products/${productId}/reviews`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    delete: (productId: string, reviewId: string) =>
        fetchApi<void>(`/products/${productId}/reviews/${reviewId}`, {
            method: 'DELETE',
        }),
};

export default {
    products: productsApi,
    categories: categoriesApi,
    cart: cartApi,
    auth: authApi,
    vto: vtoApi,
    wishlist: wishlistApi,
    reviews: reviewsApi,
};
