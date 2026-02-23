'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import CartItemCard from '@/components/cart/CartItemCard';

export default function CartPage() {
    const router = useRouter();
    const { items, getTotal } = useCartStore();
    const total = getTotal();

    return (
        <div className="w-full">
            <div className="px-4 sm:px-6 lg:px-8 pb-32">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-black text-gray-900 uppercase">Shopping Bag</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cart Items List */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                            {items.length > 0 ? (
                                items.map((item) => <CartItemCard key={item.id} item={item} />)
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[2.5rem] p-12 flex flex-col items-center text-center shadow-sm"
                                >
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-[var(--color-brand-primary)]">
                                        <ShoppingBag size={48} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your bag is empty</h2>
                                    <p className="text-gray-500 mb-8 max-w-xs">Looks like you haven&apos;t added any style to your bag yet.</p>
                                    <Link
                                        href="/"
                                        className="px-8 py-4 bg-[var(--color-brand-primary)] text-white rounded-full font-bold shadow-xl shadow-emerald-950/20"
                                    >
                                        Start Exploring
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Summary Card */}
                    {items.length > 0 && (
                        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/5 flex flex-col gap-6"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-gray-500 font-medium">
                                        <span>Subtotal</span>
                                        <span>{total.toLocaleString()} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500 font-medium">
                                        <span>Shipping</span>
                                        <span className="text-emerald-500 font-bold uppercase text-xs">Free</span>
                                    </div>
                                    <div className="h-px bg-gray-100 my-2" />
                                    <div className="flex justify-between items-center text-gray-900 font-black text-xl">
                                        <span>Total</span>
                                        <span className="text-[var(--color-brand-primary)]">{total.toLocaleString()} EGP</span>
                                    </div>
                                </div>

                                <Link href="/checkout">
                                    <button className="w-full py-5 bg-[var(--color-brand-primary)] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/20 hover:bg-[var(--color-brand-secondary)] transition-colors mt-2">
                                        <span>Checkout</span>
                                        <ArrowRight size={20} />
                                    </button>
                                </Link>

                                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <Check size={12} className="text-emerald-500" />
                                    <span>Secure SSL Checkout</span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
