'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, User, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reviewService, Review } from '@/services/reviewService';
import { useLanguage } from '@/context/LanguageContext';

export default function ReviewsSection({ productId }: { productId: string }) {
    const { t, isRTL } = useLanguage();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await reviewService.getProductReviews(productId);
                if (data.success) {
                    setReviews(data.reviews);
                }
            } catch (error) {
                console.error('Failed to load reviews:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, [productId]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 font-cairo">
                    {t.product?.reviews || (isRTL ? 'الآراء والتقييمات' : 'Reviews & Ratings')}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-gray-900">4.8</span>
                    <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < 4 ? 'currentColor' : 'none'} />
                        ))}
                    </div>
                </div>
            </div>

            {reviews.length === 0 ? (
                <div className="bg-gray-50 rounded-[24px] p-8 flex flex-col items-center text-center opacity-60">
                    <MessageSquare size={40} className="text-gray-300 mb-3" />
                    <p className="font-bold text-gray-500 font-cairo text-sm">
                        {isRTL ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 font-cairo">
                        {isRTL ? 'كن أول من يعبر عن رأيه!' : 'Be the first to share your thoughts!'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={review._id}
                            className="bg-white border border-gray-100 p-5 rounded-[20px] shadow-sm relative group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
                                    {review.user.avatar_url ? (
                                        <img src={review.user.avatar_url} alt={review.user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} className="text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-gray-900 font-cairo text-sm">{review.user.name}</h4>
                                        <div className="flex gap-0.5 text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={10} fill={i < review.rating ? 'currentColor' : 'none'} />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium font-cairo mb-2 block">
                                        {new Date(review.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    <p className="text-[13px] text-gray-600 leading-relaxed font-medium font-cairo">
                                        {review.comment}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>
    );
}
