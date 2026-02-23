'use client';

import { motion } from 'framer-motion';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCartStore, CartItem } from '@/store/cartStore';

export default function CartItemCard({ item }: { item: CartItem }) {
    const { updateQuantity, removeItem } = useCartStore();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex gap-4 items-center"
        >
            {/* Image */}
            <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col gap-1">
                <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {item.color && <span>{item.color}</span>}
                    {item.color && item.size && <span>•</span>}
                    {item.size && <span>Size {item.size}</span>}
                </div>
                <div className="mt-1 flex items-center justify-between">
                    <span className="font-black text-[var(--color-brand-primary)]">{item.price.toLocaleString()} EGP</span>

                    {/* Quantity Selector */}
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <button
                onClick={() => removeItem(item.id)}
                className="p-3 text-red-100 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
            >
                <Trash2 size={20} />
            </button>
        </motion.div>
    );
}
