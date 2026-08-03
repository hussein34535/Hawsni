'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
    const total = getTotal();
    const itemCount = getItemCount();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-[var(--color-brand-primary)] rounded-xl flex items-center justify-center">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 uppercase">Your Bag</h2>
                                    <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                                        {itemCount} Items
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length > 0 ? (
                                items.map((item) => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="w-24 h-28 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">
                                                    {item.size && <span>Size {item.size}</span>}
                                                    {item.size && item.color && <span>•</span>}
                                                    {item.color && <span>{item.color}</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="font-black text-[var(--color-brand-primary)]">
                                                    {item.price.toLocaleString()} EGP
                                                </span>

                                                <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-bold text-gray-900">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Your Bag is Empty</h3>
                                    <p className="text-gray-500 text-sm mb-8">
                                        Looks like you haven't added anything to your bag yet.
                                    </p>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                                    >
                                        Start Shopping
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-gray-500 font-medium">
                                        <span>Subtotal</span>
                                        <span>{total.toLocaleString()} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-900 font-black text-xl">
                                        <span>Total</span>
                                        <span className="text-[var(--color-brand-primary)]">
                                            {total.toLocaleString()} EGP
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-2">
                                        Shipping & taxes calculated at checkout
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <Link
                                        href="/checkout"
                                        onClick={onClose}
                                        className="w-full py-5 bg-[var(--color-brand-primary)] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/20 hover:bg-[var(--color-brand-secondary)] transition-all hover:scale-[1.02] active:scale-98"
                                    >
                                        <span>Proceed to Checkout</span>
                                        <ArrowRight size={20} />
                                    </Link>
                                    <Link
                                        href="/cart"
                                        onClick={onClose}
                                        className="w-full py-4 border-2 border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-200 rounded-2xl font-bold flex items-center justify-center transition-colors"
                                    >
                                        View Full Bag
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
