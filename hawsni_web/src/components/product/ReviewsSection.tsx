'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, ThumbsUp, MessageSquare, ImagePlus, X, User, CheckCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reviewService, Review } from '@/services/reviewService';
import { useLanguage } from '@/context/LanguageContext';
import apiClient from '@/lib/axios';
import dynamic from 'next/dynamic';

const ImageLightbox = dynamic(() => import('@/components/common/ImageLightbox'), { ssr: false });

const CLOUD_NAME = 'djxkwged9';
const UPLOAD_PRESET = 'hawsni_reviews';

async function uploadToCloudinary(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST', body: fd
    });
    const data = await res.json();
    return data.secure_url as string;
}

export default function ReviewsSection({ productId }: { productId: string }) {
    const { t, isRTL } = useLanguage();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Images state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Expandable images
    const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
    const [editingReview, setEditingReview] = useState<string | null>(null);
    const [editRating, setEditRating] = useState(5);
    const [editComment, setEditComment] = useState('');

    const toggleExpandReview = (reviewId: string) => {
        setExpandedReviews(prev =>
            prev.includes(reviewId) ? prev.filter(id => id !== reviewId) : [...prev, reviewId]
        );
    };

    // Lightbox
    const [lightbox, setLightbox] = useState<{ images: string[], index: number } | null>(null);
    const [hasSeenSwipeHint, setHasSeenSwipeHint] = useState(false);

    const loggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token');
    const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    const fetchReviews = async () => {
        try {
            const data = await reviewService.getProductReviews(productId);
            if (data.success) setReviews(data.reviews);
        } catch { }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchReviews(); }, [productId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).slice(0, 5 - selectedFiles.length);
        setSelectedFiles(prev => [...prev, ...files].slice(0, 5));
        files.forEach(f => {
            const reader = new FileReader();
            reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string].slice(0, 5));
            reader.readAsDataURL(f);
        });
        e.target.value = '';
    };

    const removeFile = (idx: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        let imageUrls: string[] = [];
        if (selectedFiles.length > 0) {
            setIsUploading(true);
            try {
                imageUrls = await Promise.all(selectedFiles.map(uploadToCloudinary));
            } catch { }
            setIsUploading(false);
        }

        try {
            const res = await reviewService.createReview(productId, rating, comment.trim(), imageUrls);
            if (res.success) {
                setSuccess(true);
                setComment('');
                setRating(5);
                setSelectedFiles([]);
                setPreviews([]);
                fetchReviews();
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err: any) {
            setError(err.toString());
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا التقييم؟' : 'Are you sure you want to delete this review?')) return;
        try {
            const res = await reviewService.deleteReview(reviewId);
            if (res.success) {
                setReviews(prev => prev.filter(r => r._id !== reviewId));
            }
        } catch (err: any) {
            alert(err.toString());
        }
    };

    const startEdit = (review: Review) => {
        setEditingReview(review._id);
        setEditRating(review.rating);
        setEditComment(review.comment || '');
    };

    const handleEditSubmit = async (reviewId: string) => {
        try {
            const res = await reviewService.updateReview(reviewId, editRating, editComment.trim());
            if (res.success) {
                setEditingReview(null);
                fetchReviews();
            }
        } catch (err: any) {
            alert(err.toString());
        }
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    if (isLoading) return (
        <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <section className="mt-8">
            {/* Lightbox */}
            <ImageLightbox
                images={lightbox?.images || []}
                currentIndex={lightbox?.index || 0}
                isOpen={!!lightbox}
                onClose={() => setLightbox(null)}
                onNavigate={(index) => setLightbox(prev => prev ? { ...prev, index } : null)}
            />

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

            <div className="mt-8 sm:mt-12 border-t border-gray-100 pt-8" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Header & Stats... */}

                {/* Review Form */}
                {loggedIn && !success && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-10 bg-gray-50 rounded-[24px] p-6 border border-gray-100"
                    >
                        <h4 className="font-black text-gray-900 font-cairo text-sm mb-4">
                            {isRTL ? 'أضف تقييمك للمنتج' : 'Write a review'}
                        </h4>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Stars */}
                            <div className="flex items-center gap-2 text-amber-400 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} type="button" onClick={() => setRating(star)}
                                        className="transition-transform active:scale-90">
                                        <Star size={24} fill={star <= rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={comment} onChange={(e) => setComment(e.target.value)}
                                placeholder={isRTL ? 'اكتب رأيك هنا بكل صراحة...' : 'Describe your experience...'}
                                className="w-full bg-white rounded-2xl p-4 text-sm font-cairo border border-gray-100 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none min-h-[100px] transition-shadow resize-none"
                            />

                            {/* Image picker */}
                            <div className="flex gap-3 flex-wrap mt-1">
                                {previews.map((p, i) => (
                                    <div key={i} className="relative w-20 h-20">
                                        <img src={p} className="w-20 h-20 rounded-xl object-cover" />
                                        <button type="button" onClick={() => removeFile(i)}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                            <X size={10} className="text-white" />
                                        </button>
                                    </div>
                                ))}
                                {selectedFiles.length < 5 && (
                                    <button type="button" onClick={() => fileRef.current?.click()}
                                        className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-[var(--color-brand-primary)] transition-colors text-gray-400 hover:text-[var(--color-brand-primary)]">
                                        <ImagePlus size={22} />
                                        <span className="text-[10px] font-bold font-cairo">
                                            {isRTL ? 'صورة' : 'Photo'}
                                        </span>
                                    </button>
                                )}
                                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
                            </div>

                            {error && <p className="text-red-500 text-xs font-bold font-cairo">{error}</p>}

                            <button disabled={isSubmitting || isUploading} type="submit"
                                className="w-full h-12 bg-gray-950 text-white rounded-xl font-black text-sm font-cairo shadow-lg active:scale-[0.98] transition-all disabled:opacity-50">
                                {isUploading
                                    ? (isRTL ? '⬆️ جاري رفع الصور...' : '⬆️ Uploading images...')
                                    : isSubmitting
                                        ? (isRTL ? 'جاري الإرسال...' : 'Submitting...')
                                        : (isRTL ? 'إرسال التقييم' : 'Post Review')}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* List */}
                {success && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="mb-10 bg-emerald-50 text-emerald-700 rounded-[24px] p-6 text-center font-black font-cairo border border-emerald-100">
                        {isRTL ? 'تم إرسال تقييمك بنجاح! شكراً لك' : 'Review posted successfully! Thank you.'}
                    </motion.div>
                )}

                {!loggedIn && (
                    <div className="mb-6 p-6 bg-gray-900 text-white rounded-[24px] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                <User size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="font-black text-xs font-cairo">{isRTL ? 'عجبك المنتج؟' : 'Love this product?'}</p>
                                <p className="text-[10px] opacity-70 font-cairo">{isRTL ? 'سجل دخولك وقولنا رأيك' : 'Sign in to share your thoughts'}</p>
                            </div>
                        </div>
                        <button onClick={() => window.location.href = '/login'}
                            className="px-4 py-2 bg-white text-gray-950 rounded-xl font-black text-[10px] font-cairo shadow-xl active:scale-95 transition-transform">
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
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review, idx) => {
                            const isExpanded = expandedReviews.includes(review._id || idx.toString());
                            const visibleImages = isExpanded ? review.images : review.images?.slice(0, 2);
                            const hasMoreImages = !isExpanded && review.images && review.images.length > 2;
                            const isOwner = currentUser?._id === review.user._id;
                            const isEditing = editingReview === review._id;

                            return (
                                <motion.div key={review._id || idx}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white border border-gray-50 p-6 rounded-[24px] shadow-sm relative overflow-hidden">

                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-amber-400 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button key={star} type="button" onClick={() => setEditRating(star)}
                                                        className="transition-transform active:scale-90">
                                                        <Star size={20} fill={star <= editRating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={editComment} onChange={(e) => setEditComment(e.target.value)}
                                                placeholder={isRTL ? 'تعديل تعليقك...' : 'Edit your comment...'}
                                                className="w-full bg-gray-50 rounded-xl p-3 text-sm font-cairo border border-gray-100 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none min-h-[80px] transition-shadow resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEditSubmit(review._id)} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold font-cairo hover:bg-black transition-colors">
                                                    {isRTL ? 'حفظ' : 'Save'}
                                                </button>
                                                <button onClick={() => setEditingReview(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold font-cairo hover:bg-gray-200 transition-colors">
                                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-50 shadow-sm flex-shrink-0">
                                                {review.user?.avatar_url ? (
                                                    <img src={review.user.avatar_url} alt={review.user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-indigo-500">
                                                        <User size={18} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 mt-1">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <h4 className="font-black text-gray-900 font-cairo text-sm">{review.user?.name || 'Anonymous'}</h4>
                                                    <div className="flex gap-0.5 text-amber-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={10} fill={i < review.rating ? 'currentColor' : 'none'} strokeWidth={2} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-[10px] text-gray-400 font-bold font-cairo opacity-60">
                                                        {new Date(review.created_at || review.createdAt || '').toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                                                            year: 'numeric', month: 'long', day: 'numeric'
                                                        })}
                                                    </span>
                                                    {isOwner && !isEditing && (
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => startEdit(review)} className="text-gray-400 hover:text-blue-500 transition-colors text-[10px] font-cairo font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-100 hover:bg-white hover:shadow-sm">
                                                                {isRTL ? 'تعديل' : 'Edit'}
                                                            </button>
                                                            <button onClick={() => handleDelete(review._id)} className="text-gray-400 hover:text-red-500 transition-colors text-[10px] font-cairo font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-100 hover:bg-white hover:shadow-sm">
                                                                {isRTL ? 'حذف' : 'Delete'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {review.comment && (
                                                    <p className="text-[13px] text-gray-600 leading-relaxed font-bold font-cairo break-words whitespace-pre-line">
                                                        {review.comment}
                                                    </p>
                                                )}

                                                {/* Review images slider */}
                                                {review.images && review.images.length > 0 && (
                                                    <div className="relative mt-4">
                                                        <div className={`flex gap-3 overflow-x-auto pb-4 px-1 hide-scrollbar scroll-smooth ${isRTL ? 'flex-row-reverse' : 'flex-row'}`} style={{ scrollSnapType: 'x mandatory' }}>
                                                            {review.images.map((img: string, i: number) => (
                                                                <div 
                                                                    key={i} 
                                                                    className="relative flex-shrink-0 cursor-zoom-in group" 
                                                                    style={{ scrollSnapAlign: isRTL ? 'end' : 'start' }}
                                                                    onClick={() => setLightbox({ images: review.images!, index: i })}
                                                                >
                                                                    <img
                                                                        src={img}
                                                                        alt=""
                                                                        className="w-[110px] h-[140px] sm:w-[130px] sm:h-[170px] rounded-2xl object-cover hover:opacity-95 transition-all border border-gray-100 shadow-sm"
                                                                    />
                                                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {/* Subtle fade edges for overflow indication */}
                                                        <div className={`absolute top-0 bottom-4 w-12 pointer-events-none z-10 bg-gradient-to-r from-white to-transparent ${isRTL ? 'right-0' : 'left-0'}`} />
                                                        <div className={`absolute top-0 bottom-4 w-12 pointer-events-none z-10 bg-gradient-to-l from-white to-transparent ${isRTL ? 'left-0' : 'right-0'}`} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
