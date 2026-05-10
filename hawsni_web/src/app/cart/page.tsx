'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, ArrowRight, Check, Flower2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import CartItemCard from '@/components/cart/CartItemCard';
import { useLanguage } from '@/context/LanguageContext';

export default function CartPage() {
    const router = useRouter();
    const { items, getTotal } = useCartStore();
    const { isRTL, t } = useLanguage();
    const total = getTotal();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div className="w-full min-h-screen bg-[#FAFAFA]">
            {/* Header */}
            <div dir={isRTL ? 'rtl' : 'ltr'} className="sticky top-0 z-30 bg-white border-b border-gray-50 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 active:scale-95 transition-all"
                >
                    {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                </button>
                <h1 className="text-lg font-black text-gray-900 font-cairo">
                    {isRTL ? 'حقيبة التسوق' : 'Shopping Bag'}
                </h1>
                <div className="w-10" />
            </div>

            <div className="px-4 pb-[160px] text-right" dir="ltr">
                <div className="max-w-2xl mx-auto flex flex-col gap-3">
                    <AnimatePresence mode="popLayout">
                        {items.length > 0 ? (
                            items.map((item) => <CartItemCard key={item.id} item={item} />)
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-20 flex flex-col items-center text-center"
                            >
                                <div className="w-32 h-32 flex items-center justify-center mb-8">
                                    <Flower2 size={80} className="text-[#0E4435]" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2 font-cairo">
                                    {isRTL ? 'حقيبتك فارغة' : 'Your bag is empty'}
                                </h2>
                                <p className="text-gray-500 mb-10 max-w-xs font-bold opacity-60">
                                    {isRTL ? 'يبدو أنك لم تضف أي قطعة لمجموعتك بعد' : 'Looks like you haven\'t added any style to your bag yet.'}
                                </p>
                                <Link
                                    href="/"
                                    className="px-10 py-5 bg-[#0E4435] text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-950/20 active:scale-95 transition-all"
                                >
                                    {isRTL ? 'استكشف الآن' : 'Start Exploring'}
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Fixed Summary (Image 1) */}
            {items.length > 0 && (
                <div className="fixed bottom-16 md:bottom-0 left-0 w-full bg-white rounded-t-[2rem] p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-400 font-bold text-base">{isRTL ? 'المجموع' : 'Subtotal'}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-gray-900">{total.toLocaleString()}</span>
                                <span className="text-xs font-bold text-gray-400 uppercase">{isRTL ? 'ج.م' : 'EGP'}</span>
                            </div>
                        </div>

                        <Link href="/checkout">
                            <button className="w-full py-4 bg-[#0E4435] text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/10 active:scale-[0.98] transition-all flex items-center justify-center">
                                <span>{isRTL ? 'إتمام الشراء' : 'Checkout'}</span>
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
