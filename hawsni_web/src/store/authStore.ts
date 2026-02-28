import { create } from 'zustand';

interface User {
    _id: string;
    email: string;
    name: string;
    phone?: string;
    role?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    setUser: (user: User | null, token?: string | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isLoading: true,
    setUser: (user, token) => {
        if (token) localStorage.setItem('token', token);
        else if (token === null) localStorage.removeItem('token');

        if (user) localStorage.setItem('user', JSON.stringify(user));
        else if (user === null) localStorage.removeItem('user');

        set({ user, token: token ?? null, isLoading: false });
    },
    setLoading: (isLoading) => set({ isLoading }),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
    },
}));
