'use client';

import { motion } from 'framer-motion';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCartStore, CartItem } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';

export default function CartItemCard({ item }: { item: CartItem }) {
    const { updateQuantity, removeItem } = useCartStore();
    const { isRTL } = useLanguage();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex items-center gap-4 relative"
        >
            {/* Image (Right in RTL, Left in LTR) */}
            <div className={`w-24 h-24 rounded-[1.5rem] overflow-hidden flex-shrink-0 bg-gray-50 ${isRTL ? 'order-2' : 'order-1'}`}>
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>

            {/* Details */}
            <div className={`flex-1 flex flex-col gap-1 ${isRTL ? 'order-1 text-right' : 'order-2 text-left'}`}>
                <h4 className="text-lg font-black text-gray-900 mb-1">{item.name}</h4>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {item.color && <span>{isRTL ? 'اللون' : 'Color'}: {item.color}</span>}
                    {item.size && <span>•</span>}
                    {item.size && <span>{isRTL ? 'المقاس' : 'Size'}: {item.size}</span>}
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-black text-[var(--color-brand-primary)]">
                        {item.price.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-900 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <Plus size={16} />
                        </button>
                        <span className="w-6 text-center text-base font-black text-gray-900">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-900 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <Minus size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Subtle semicircular cutouts on the sides could be done with CSS, but let's stick to clean look */}
        </motion.div>
    );
}
