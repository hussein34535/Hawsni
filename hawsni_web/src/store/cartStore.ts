'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // Composite ID: productId + size + color + accessories names
    productId: string;
    name: string;
    price: number;
    imageUrl: string;
    quantity: number;
    size?: string | null;
    color?: string | null;
    accessories?: { name: string; name_ar?: string; price: number; image_url: string }[];
}

interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                const items = get().items;
                const existingItem = items.find((i) => i.id === newItem.id);

                if (existingItem) {
                    set({
                        items: items.map((i) =>
                            i.id === newItem.id
                                ? { ...i, quantity: i.quantity + newItem.quantity }
                                : i
                        ),
                    });
                } else {
                    set({ items: [...items, newItem] });
                }
            },

            removeItem: (id) => {
                set({ items: get().items.filter((i) => i.id !== id) });
            },

            updateQuantity: (id, quantity) => {
                if (quantity < 1) return;
                set({
                    items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
                });
            },

            clearCart: () => set({ items: [] }),

            getTotal: () => {
                return get().items.reduce((total, item) => {
                    const accessoriesPrice = item.accessories?.reduce((accTotal, acc) => accTotal + (acc.price || 0), 0) || 0;
                    return total + (item.price + accessoriesPrice) * item.quantity;
                }, 0);
            },

            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0);
            }
        }),
        {
            name: 'hwasi-cart',
        }
    )
);
