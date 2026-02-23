'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { wishlistService } from '@/services/wishlistService';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/products/ProductCard';
import { Product } from '@/types';

export default function WishlistPage() {
    const { t, isRTL, language } = useLanguage();
    const router = useRouter();
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const data = await wishlistService.getWishlist();
                setWishlist(data.wishlist || []);
            } catch (error) {
                console.error('Failed to fetch wishlist:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWishlist();
    }, []);

    const handleRemoveFromWishlist = async (productId: string) => {
        try {
            await wishlistService.removeFromWishlist(productId);
            setWishlist(wishlist.filter(item => (item.product?._id || item.product?.id) !== productId));
        } catch (error) {
            console.error('Failed to remove from wishlist:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-16 gap-3">
                <button onClick={() => router.back()} className={`p-2 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{t.common.wishlist}</h1>
            </header>

            <main className="p-4 sm:p-6 max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[var(--shadow-soft)] mb-6">
                            <Heart size={40} strokeWidth={1.5} className="text-gray-300" />
                        </div>
                        <p className="font-medium text-center">{language === 'ar' ? 'قائمة المفضلة فارغة' : 'Your wishlist is empty'}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-6 text-[var(--color-brand-primary)] font-bold text-sm"
                        >
                            {language === 'ar' ? 'استكشف المنتجات' : 'Explore Products'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        <AnimatePresence>
                            {wishlist.map((item) => {
                                const prod = item.product;
                                if (!prod) return null;
                                return (
                                    <motion.div
                                        key={prod._id || prod.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="relative"
                                    >
                                        <ProductCard product={prod} />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFromWishlist(prod._id || prod.id);
                                            }}
                                            className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-red-500 hover:bg-red-500 hover:text-white transition-all z-10`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
