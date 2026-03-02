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
            className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3 relative"
        >
            {/* Image (Right in RTL, Left in LTR) */}
            <div className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 ${isRTL ? 'order-2' : 'order-1'}`}>
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>

            {/* Details */}
            <div className={`flex-1 flex flex-col gap-0.5 ${isRTL ? 'order-1 text-right' : 'order-2 text-left'}`}>
                <div className="flex justify-between items-start gap-2">
                    <h4 className="text-base font-black text-gray-900 leading-tight flex-1">{item.name}</h4>
                    <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                        title={isRTL ? 'حذف' : 'Remove'}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">
                    {item.color && <span>{isRTL ? 'اللون' : 'Color'}: {item.color}</span>}
                    {item.size && <span>•</span>}
                    {item.size && <span>{isRTL ? 'المقاس' : 'Size'}: {item.size}</span>}
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-base font-black text-[#0E4435]">
                        {item.price.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-900 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <Minus size={12} />
                        </button>
                        <span className="w-4 text-center text-xs font-black text-gray-900">
                            {item.quantity}
                        </span>
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-900 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Subtle semicircular cutouts on the sides could be done with CSS, but let's stick to clean look */}
        </motion.div>
    );
}
