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
    let token = null;

    // Check if we are in the browser environment
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('hwasi_token');
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const json = await response.json();

        if (!response.ok) {
            return {
                error: json.message || 'Something went wrong',
                status: response.status,
            };
        }

        // Extract the actual data. Cart response returns { cart: { items: [...] } }
        let data = json.products || json.product || json.data || json;
        if (json.cart && Array.isArray(json.cart.items)) {
            data = json.cart.items;
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
    category_id?: string;
    rating: number;
    reviewCount: number;
    sizes?: string[];
    colors?: Array<{ color: string; name?: string }>;
    stock?: number;
    discount?: number;
}

// Map backend product to frontend format
function mapProduct(p: Record<string, unknown>): Product {
    const images = (p.images as string[] | null) || [];
    return {
        ...p,
        id: p.id as string,
        name: p.name as string || '',
        description: p.description as string || '',
        price: p.price as number || 0,
        imageUrl: images[0] || '',
        images: images,
        rating: (p.rating as number) || 0,
        reviewCount: (p.reviewCount as number) || (p.review_count as number) || 0,
        sizes: (p.sizes as string[]) || [],
        colors: (p.colors as Array<{ color: string; name?: string }>) || [],
        stock: (p.stock as number) || 0,
        discount: (p.discount as number) || 0,
    } as Product;
}

export const productsApi = {
    getAll: async () => {
        const res = await fetchApi<Record<string, unknown>[]>('/products');
        if (res.data && Array.isArray(res.data)) {
            return { ...res, data: res.data.map(mapProduct) };
        }
        return { ...res, data: [] as Product[] };
    },
    getById: async (id: string) => {
        const res = await fetchApi<Record<string, unknown>>(`/products/${id}`);
        if (res.data) {
            return { ...res, data: mapProduct(res.data) };
        }
        return res as unknown as ApiResponse<Product>;
    },
    getByCategory: async (categoryId: string) => {
        const res = await fetchApi<Record<string, unknown>[]>(`/products?category=${categoryId}`);
        if (res.data && Array.isArray(res.data)) {
            return { ...res, data: res.data.map(mapProduct) };
        }
        return { ...res, data: [] as Product[] };
    },
    search: async (query: string) => {
        const res = await fetchApi<Record<string, unknown>[]>(`/products/search?q=${encodeURIComponent(query)}`);
        if (res.data && Array.isArray(res.data)) {
            return { ...res, data: res.data.map(mapProduct) };
        }
        return { ...res, data: [] as Product[] };
    },
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

// ==================== ORDERS API ====================
export interface OrderData {
    items: Array<{
        product: string;
        name: string;
        imageUrl?: string;
        quantity: number;
        price: number;
    }>;
    shippingAddress: {
        name: string;
        phone: string;
        state: string;
        city: string;
        street: string;
        address: string;
    };
    paymentMethod: string;
    subtotal: number;
    shippingFee: number;
    total: number;
    guestName?: string;
    guestPhone?: string;
    guestEmail?: string;
}

export const ordersApi = {
    placeOrder: (order: OrderData) =>
        fetchApi<any>('/orders', {
            method: 'POST',
            body: JSON.stringify(order),
        }),
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

// ==================== BANNERS API ====================
export interface Banner {
    id: string;
    title: string;
    image_url: string;
    link?: string;
    sort_order: number;
    is_active: boolean;
    heading_text?: string;
    subheading_text?: string;
    button_text?: string;
    button_color?: string;
    button_style?: string;
    button_size?: string;
    button_position?: string;
    button_link?: string;
}

export const bannersApi = {
    getAll: () => fetchApi<Banner[]>('/banners'),
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
    orders: ordersApi,
    auth: authApi,
    vto: vtoApi,
    wishlist: wishlistApi,
    reviews: reviewsApi,
    banners: bannersApi,
};
