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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Review Form State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const loggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token');

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

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) {
            setError(isRTL ? 'يرجى كتابة تعليق' : 'Please write a comment');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const res = await reviewService.createReview(productId, rating, comment);
            if (res.success) {
                setSuccess(true);
                setComment('');
                setRating(5);
                fetchReviews();
                // Reset success message after 3s
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err: any) {
            setError(err.toString());
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate stats
    const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <section className="mt-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-900 font-cairo">
                        {t.product?.reviews || (isRTL ? 'الآراء والتقييمات' : 'Reviews & Ratings')}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold font-cairo mt-0.5">
                        {reviews.length} {isRTL ? 'تقييم حقيقي من عملائنا' : 'Verified customer reviews'}
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-gray-900">{avgRating}</span>
                        <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={16} fill={i < Math.round(Number(avgRating)) ? 'currentColor' : 'none'} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Form - Only for logged in users */}
            {loggedIn && !success && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 bg-gray-50 rounded-[24px] p-6 border border-gray-100"
                >
                    <h4 className="font-black text-gray-900 font-cairo text-sm mb-4">
                        {isRTL ? 'أضف تقييمك للمنتج' : 'Write a review'}
                    </h4>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Rating Picker */}
                        <div className="flex items-center gap-2 text-amber-400 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="transition-transform active:scale-90"
                                >
                                    <Star size={24} fill={star <= rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={isRTL ? 'اكتب رأيك هنا بكل صراحة...' : 'Describe your experience...'}
                            className="w-full bg-white rounded-2xl p-4 text-sm font-cairo border border-gray-100 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none min-h-[100px] transition-shadow resize-none"
                        />

                        {error && <p className="text-red-500 text-xs font-bold font-cairo">{error}</p>}

                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="w-full h-12 bg-gray-950 text-white rounded-xl font-black text-sm font-cairo shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (isRTL ? 'جاري الإرسال...' : 'Submitting...') : (isRTL ? 'إرسال التقييم' : 'Post Review')}
                        </button>
                    </form>
                </motion.div>
            )}

            {success && (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-10 bg-emerald-50 text-emerald-700 rounded-[24px] p-6 text-center font-black font-cairo border border-emerald-100"
                >
                    {isRTL ? 'تم إرسال تقييمك بنجاح! شكراً لك' : 'Review posted successfully! Thank you.'}
                </motion.div>
            )}

            {!loggedIn && (
                <div className="mb-10 p-6 bg-gray-900 text-white rounded-[24px] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <User size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="font-black text-xs font-cairo">{isRTL ? 'عجبك المنتج؟' : 'Love this product?'}</p>
                            <p className="text-[10px] opacity-70 font-cairo">{isRTL ? 'سجل دخولك وقولنا رأيك' : 'Sign in to share your thoughts'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="px-4 py-2 bg-white text-gray-950 rounded-xl font-black text-[10px] font-cairo shadow-xl active:scale-95 transition-transform"
                    >
                        {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                    </button>
                </div>
            )}

            {reviews.length === 0 ? (
                <div className="bg-gray-50 rounded-[24px] p-12 flex flex-col items-center text-center opacity-60 mt-4 border border-dashed border-gray-200">
                    <MessageSquare size={48} className="text-gray-300 mb-4" />
                    <p className="font-bold text-gray-600 font-cairo text-base">
                        {isRTL ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 font-cairo">
                        {isRTL ? 'كن أول من يعبر عن رأيه!' : 'Be the first to share your thoughts!'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review, idx) => (
                        <motion.div
                            key={review._id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white border border-gray-50 p-6 rounded-[24px] shadow-sm relative group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-50 shadow-sm flex-shrink-0">
                                    {review.user.avatar_url ? (
                                        <img src={review.user.avatar_url} alt={review.user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-indigo-500">
                                            <User size={18} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-black text-gray-900 font-cairo text-sm">{review.user.name}</h4>
                                        <div className="flex gap-0.5 text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={10} fill={i < review.rating ? 'currentColor' : 'none'} strokeWidth={2} />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold font-cairo mb-3 block opacity-60">
                                        {new Date(review.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    <p className="text-[13px] text-gray-600 leading-relaxed font-bold font-cairo">
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
