import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoading: false,
            setUser: (user, token) => {
                set({ user, token: token ?? null, isLoading: false });
            },
            setLoading: (isLoading) => set({ isLoading }),
            logout: () => {
                set({ user: null, token: null });
            },
        }),
        {
            name: 'auth-storage', // name of item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default the 'localStorage' is used
            partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
);
