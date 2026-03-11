'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    ShoppingBag,
    Heart,
    Star,
    Minus,
    Plus,
    Check,
    ChevronRight,
    Flame,
    Info,
    Play,
    Ruler,
    X,
    Camera,
    Image as ImageIcon,
    ChevronDown,
    Hand
} from 'lucide-react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { productService } from '@/services/productService';
import { useLanguage } from '@/context/LanguageContext';
import { trackEvent } from '@/components/analytics/FacebookPixel';
import { trackGAEvent } from '@/components/analytics/GoogleAnalytics';
import { Product } from '@/types';
import { wishlistService } from '@/services/wishlistService';
import dynamic from 'next/dynamic';

const ProductVideoItem = ({ src }: { src: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    return (
        <div 
            className="w-full h-full flex items-center justify-center cursor-pointer group"
            onClick={(e) => {
                e.stopPropagation();
                togglePlay();
            }}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                playsInline
                controls={false}
                controlsList="nodownload"
                loop
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
            />
            
            {/* Modern Play/Pause Overlay */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPlaying ? 'opacity-0 scale-110' : 'opacity-100 scale-100 bg-black/10'}`}>
                {!isPlaying && (
                    <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/40 transform transition-transform group-hover:scale-110 group-active:scale-95">
                        <Play className="w-8 h-8 text-white ml-1 drop-shadow-md" fill="currentColor" />
                    </div>
                )}
            </div>
        </div>
    );
};

const ReviewsSection = dynamic(() => import('@/components/product/ReviewsSection'), { ssr: false });
const SizeGuideModal = dynamic(() => import('@/components/product/SizeGuideModal'), { ssr: false });
const VirtualTryOnModal = dynamic(() => import('@/components/product/VirtualTryOnModal'), { ssr: false });
import { FreeDeliveryBanner } from '@/components/products/FreeDeliveryBanner';
const ImageLightbox = dynamic(() => import('@/components/common/ImageLightbox'), { ssr: false });

const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

const getThumbnailUrl = (url: string | null) => {
    if (!url) return null;
    if (url.includes('cloudinary.com')) {
        // Insert Cloudinary transformations: fill 100x100, auto quality, auto format
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            return `${parts[0]}/upload/c_fill,w_100,h_100,q_auto,f_auto/${parts[1]}`;
        }
    }
    return url;
};

const parseColors = (colors: any[] | undefined) => {
    if (!colors) return [];
    return colors.map(c => {
        if (typeof c === 'string') {
            try {
                // Remove any leading/trailing potential quotes or braces that might survive a dirty API response
                const cleaned = c.trim();
                if (cleaned.startsWith('{')) {
                    return JSON.parse(cleaned);
                }
                return { color: cleaned };
            } catch (e) {
                return { color: c };
            }
        }
        return c;
    });
};

const FAQAccordion = ({ isRTL }: { isRTL: boolean }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: isRTL ? 'متى يصل طلبي؟' : 'When will my order arrive?',
            answer: isRTL ? 'يصل طلبك خلال 2 إلى 5 أيام عمل تقريباً حسب موقعك.' : 'Your order will arrive within 2 to 5 business days depending on your location.'
        },
        {
            question: isRTL ? 'هل يمكنني إرجاع أو استبدال المنتج؟' : 'Can I return or exchange the product?',
            answer: isRTL ? 'نعم، نوفر خدمة الاسترجاع والاستبدال خلال 14 يوماً من استلام الطلب بشرط بقاء المنتج في حالته الأصلية.' : 'Yes, we offer returns and exchanges within 14 days of receiving the order, provided the product is in its original condition.'
        },
        {
            question: isRTL ? 'هل يوجد معاينة قبل الاستلام؟' : 'Can I inspect the order upon delivery?',
            answer: isRTL ? 'نعم، متاح معاينة للمنتج للتأكد من جودته ومطابقته لطلبك. إذا كان هناك أي خطأ أو عيب، لا تتحملين أي رسوم. أما لأي سبب آخر، يتم دفع 50 جنيهاً مصاريف شحن لشركة التوصيل.' : 'Yes, you can inspect the product upon delivery. If there are any defects or errors, you pay nothing. For any other reason, a 50 EGP shipping fee applies.'
        }
    ];

    return (
        <div className="mt-10 pt-8 border-t border-gray-100">
            <h4 className="text-base font-black text-gray-900 mb-6 font-cairo flex items-center gap-2">
                <Info size={18} className="text-[var(--color-brand-primary)]" />
                {isRTL ? 'معلومات تهمك' : 'Important Information'}
            </h4>
            <div className="flex flex-col gap-4">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <div 
                            key={index} 
                            className={`
                                rounded-2xl border transition-all duration-300 group
                                ${isOpen 
                                    ? 'bg-white border-[var(--color-brand-primary)]/30 shadow-xl shadow-[var(--color-brand-primary)]/5' 
                                    : 'bg-gray-50/40 border-gray-100 hover:border-gray-200 hover:bg-gray-50/80'}
                            `}
                        >
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                className={`w-full flex items-center justify-between p-5 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                <span className={`font-black text-sm font-cairo transition-colors ${isOpen ? 'text-[var(--color-brand-primary)]' : 'text-gray-700'}`}>
                                    {faq.question}
                                </span>
                                <div className={`
                                    w-8 h-8 rounded-xl flex items-center justify-center transition-all
                                    ${isOpen ? 'bg-[var(--color-brand-primary)] text-white rotate-180' : 'bg-white text-gray-400 group-hover:text-gray-600'}
                                `}>
                                    <ChevronDown size={16} strokeWidth={3} />
                                </div>
                            </button>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                    >
                                        <div className={`px-5 pb-5 text-sm font-bold text-gray-500 font-cairo leading-relaxed opacity-90 ${isRTL ? 'text-right' : 'text-left'}`}>
                                            <div className="pt-3 border-t border-gray-50">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function ProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;
    const { t, isRTL } = useLanguage();
    const { showToast } = useToastStore();

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
    const [isVTOOpen, setIsVTOOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [showGallerySwipeHint, setShowGallerySwipeHint] = useState(false);
    const reviewsRef = useRef<HTMLDivElement>(null);

    const items = useCartStore((state) => state.items);
    const addItem = useCartStore((state) => state.addItem);
    const getItemCount = useCartStore((state) => state.getItemCount);

    // Derived state: check if current selection is in cart
    const currentItemId = product ? `${product.id || product._id}_${selectedSize}_${selectedColor || 'default'}` : null;
    const isInCart = items.some((item) => item.id === currentItemId);

    // Determine real stock
    const stockCount = product?.stock ?? (product as any)?.countInStock ?? 0;

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await productService.getProductById(productId);
                if (data.success) {
                    setProduct(data.product);
                    // Auto-select size if only one
                    const sizes = data.product.sizes ?? [];
                    if (sizes.length === 1) {
                        setSelectedSize(sizes[0]);
                    }

                    // Track ViewContent
                    const discount = data.product.discount || 0;
                    const finalPrice = discount > 0 ? data.product.price - (data.product.price * discount / 100) : data.product.price;
                    trackEvent('ViewContent', {
                        content_name: data.product.name,
                        content_ids: [data.product.id || data.product._id],
                        content_type: 'product',
                        value: finalPrice,
                        currency: 'EGP'
                    });
                    trackGAEvent('view_item', {
                        currency: 'EGP',
                        value: finalPrice,
                        items: [{
                            item_id: data.product.id || data.product._id,
                            item_name: data.product.name,
                            price: finalPrice
                        }]
                    });
                }
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) fetchProduct();

        const checkWishlist = async () => {
            try {
                const data = await wishlistService.getWishlist();
                const isItemInWishlist = data.wishlist.some(item => (item.product?._id || item.product?.id) === productId);
                setIsFavorite(isItemInWishlist);
            } catch (error) {
                console.error('Failed to check wishlist:', error);
            }
        };
        checkWishlist();
    }, [productId]);

    // Safe images array (null-safe)
    const safeImages = Array.isArray(product?.images) ? product.images : [];

    // Show swipe hint on first visit (only once ever, persisted in localStorage)
    useEffect(() => {
        if (safeImages.length > 1 && typeof window !== 'undefined') {
            const seen = localStorage.getItem('hwasi_seen_gallery_swipe');
            if (!seen) {
                // Small delay so the page loads first
                const showTimer = setTimeout(() => {
                    setShowGallerySwipeHint(true);
                    localStorage.setItem('hwasi_seen_gallery_swipe', '1');
                    // Auto-dismiss after 3 seconds
                    setTimeout(() => setShowGallerySwipeHint(false), 3000);
                }, 800);
                return () => clearTimeout(showTimer);
            }
        }
    }, [safeImages.length]);

    // Native CSS scroll snap - no manual touch handling needed
    const galleryRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const handleGalleryScroll = useCallback(() => {
        if (!sliderRef.current) return;
        const scrollLeft = sliderRef.current.scrollLeft;
        const width = sliderRef.current.offsetWidth;
        const newIndex = Math.round(scrollLeft / width);
        if (newIndex !== selectedImage && newIndex >= 0 && newIndex < safeImages.length) {
            setSelectedImage(newIndex);
        }
    }, [selectedImage, safeImages.length]);

    const scrollToImage = useCallback((index: number) => {
        if (!sliderRef.current) return;
        sliderRef.current.scrollTo({
            left: index * sliderRef.current.offsetWidth,
            behavior: 'smooth'
        });
        setSelectedImage(index);
    }, []);

    const handleAddToCart = (e: React.MouseEvent) => {
        if (!product) return;
        if (!selectedSize) {
            showToast(isRTL ? 'يرجى اختيار المقاس' : 'Please select a size', 'error');
            return;
        }

        if (product.colors && product.colors.length > 0 && !selectedColor) {
            showToast(isRTL ? 'يرجى اختيار اللون' : 'Please select a color', 'error');
            return;
        }

        // Find the image for the selected color
        let selectedColorImage = safeImages[0] || '';
        if (selectedColor && product.colors) {
            const parsedColors = parseColors(product.colors);
            const colorData = parsedColors.find(c => c.color === selectedColor);
            if (colorData) {
                if (colorData.image) {
                    selectedColorImage = colorData.image;
                } else if (colorData.imageIndex !== undefined && safeImages[colorData.imageIndex]) {
                    selectedColorImage = safeImages[colorData.imageIndex];
                }
            }
        }

        const prodId = product.id || product._id;
        const discount = product.discount || 0;
        const finalPrice = discount > 0 ? product.price - (product.price * discount / 100) : product.price;

        addItem({
            id: `${prodId}_${selectedSize}_${selectedColor || 'default'}`,
            productId: prodId,
            name: product.name,
            price: finalPrice,
            imageUrl: formatImageUrl(selectedColorImage),
            quantity: quantity,
            size: selectedSize,
            color: selectedColor || undefined
        });

        // Track AddToCart
        trackEvent('AddToCart', {
            content_name: product.name,
            content_ids: [prodId],
            content_type: 'product',
            value: finalPrice,
            currency: 'EGP',
            num_items: quantity
        });
        trackGAEvent('add_to_cart', {
            currency: 'EGP',
            value: finalPrice * quantity,
            items: [{
                item_id: prodId,
                item_name: product.name,
                price: finalPrice,
                quantity: quantity
            }]
        });

        showToast(isRTL ? 'تمت الإضافة إلى السلة' : 'Added to cart successfully', 'success');
    };

    const handleFavoriteClick = async () => {
        if (!product) return;
        
        try {
            if (isFavorite) {
                await wishlistService.removeFromWishlist(product.id || product._id);
                setIsFavorite(false);
                showToast(isRTL ? 'تم الإزالة من المفضلة' : 'Removed from favorites', 'success');
            } else {
                await wishlistService.addToWishlist(product);
                setIsFavorite(true);
                showToast(isRTL ? 'تم الإضافة للمفضلة' : 'Added to favorites', 'success');
            }
        } catch (error) {
            console.error('Wishlist operation failed:', error);
            showToast(isRTL ? 'فشلت العملية' : 'Operation failed', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="w-full bg-[#FAFAFA] min-h-screen flex justify-center items-center">
                <div className="h-12 w-12 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="w-full bg-[#FAFAFA] min-h-screen flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold mb-4">{t.search.no_results}</h2>
                <button onClick={() => router.back()} className="text-[var(--color-brand-primary)] font-bold">{t.common.cancel}</button>
            </div>
        );
    }

    return (
        <div className={`w-full bg-[#FAFAFA] min-h-screen lg:mt-0 -mt-20 ${isRTL ? 'text-right' : 'text-left'}`} dir="ltr">

            {/* Header / AppBar - Transparent Overlay (Matches Flutter exactly) */}
            <div className={`fixed top-0 left-0 right-0 z-[60] p-4 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-start bg-gradient-to-b from-black/10 to-transparent pointer-events-none h-24 pt-2`}>
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-black/30 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/10 pointer-events-auto active:scale-95 transition-transform"
                >
                    {isRTL ? <ArrowRight size={20} className="text-white" /> : <ArrowLeft size={20} className="text-white" />}
                </button>
                <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 pointer-events-auto`}>
                    <button
                        onClick={handleFavoriteClick}
                        className="w-10 h-10 bg-black/30 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/10 active:scale-95 transition-transform"
                    >
                        <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'} />
                    </button>
                    <button
                        onClick={() => router.push('/cart')}
                        className="w-10 h-10 bg-black/30 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/10 active:scale-95 transition-transform relative"
                    >
                        <ShoppingBag size={20} className="text-white" />
                        {getItemCount() > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[var(--color-brand-primary)] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black/10 shadow-lg">
                                {getItemCount()}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto pb-40">
                <div className="grid grid-cols-1 lg:grid-cols-2">

                    <div
                        ref={galleryRef}
                        className="relative aspect-[4/4] bg-[#F4F4F4] overflow-hidden lg:rounded-b-[4rem] group"
                    >
                        <div
                            ref={sliderRef}
                            onScroll={handleGalleryScroll}
                            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
                        >
                            {safeImages.map((img: string, i: number) => {
                                const lowerImg = img.toLowerCase();
                                const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(lowerImg) || lowerImg.includes('/video/upload/');
                                return (
                                    <div
                                        key={`img-${i}`}
                                        className="min-w-full h-full relative flex-shrink-0 cursor-zoom-in overflow-hidden snap-center snap-always"
                                        onClick={() => setIsLightboxOpen(true)}
                                    >
                                        {/* Cinematic Blurred Background Layer - Optimized to only render on active slide */}
                                        <div className={`absolute inset-0 pointer-events-none z-0 flex items-center justify-center bg-white ${selectedImage !== i ? 'hidden' : 'opacity-100 transition-opacity duration-300'}`}>
                                            {isVideo ? (
                                                <video
                                                    src={formatImageUrl(img)}
                                                    className="w-full h-full object-cover blur-2xl opacity-40 scale-[1.15]"
                                                    muted playsInline autoPlay loop
                                                />
                                            ) : (
                                                <Image
                                                    src={formatImageUrl(img)}
                                                    alt=""
                                                    fill
                                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                                    className="object-cover blur-2xl opacity-40 scale-[1.15]"
                                                />
                                            )}
                                        </div>

                                        {/* Foreground Focused Layer */}
                                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                                            {isVideo ? (
                                                <ProductVideoItem src={formatImageUrl(img)} />
                                            ) : (
                                                <Image
                                                    src={formatImageUrl(img)}
                                                    alt={`${product.name} - ${i + 1}`}
                                                    fill
                                                    priority={i === 0}
                                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                                    className="object-cover select-none"
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Arrow buttons for desktop */}
                        {safeImages.length > 1 && selectedImage > 0 && (
                            <button
                                onClick={() => scrollToImage(selectedImage - 1)}
                                className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/70 backdrop-blur-md rounded-full items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        {safeImages.length > 1 && selectedImage < safeImages.length - 1 && (
                            <button
                                onClick={() => scrollToImage(selectedImage + 1)}
                                className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/70 backdrop-blur-md rounded-full items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
                            >
                                <ArrowRight size={18} />
                            </button>
                        )}

                        {/* Swipe Hint Overlay for Product Gallery */}
                        <AnimatePresence>
                            {showGallerySwipeHint && safeImages.length > 1 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                                >
                                    <div className="bg-black/50 text-white px-6 py-4 rounded-full backdrop-blur-md flex items-center gap-3 shadow-lg">
                                        <motion.div
                                            animate={{ x: [15, -15, 15] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                        >
                                            <Hand size={28} />
                                        </motion.div>
                                        <span className="font-cairo font-bold text-sm">{isRTL ? 'اسحب لليسار لعرض المزيد' : 'Swipe left for more'}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Info Section */}
                    <div className={`p-6 md:p-10 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {/* Title and Header Layout Refined */}
                        <div className="flex flex-col gap-6 mb-10">
                            <h1 className="text-2xl font-black text-gray-900 font-cairo leading-tight tracking-tight mb-2.5">{product.name}</h1>
                            
                            <div className="flex items-start justify-between gap-4">
                                {/* Price - Naturally on the right in RTL, left in LTR due to flex-row and dir="rtl" */}
                                <div className="flex flex-col">
                                    {product.discount ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-400 line-through font-bold">
                                                {product.price.toLocaleString('en-US')} {isRTL ? 'ج.م' : 'EGP'}
                                            </span>
                                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md" dir="ltr">
                                                -{product.discount}%
                                            </span>
                                        </div>
                                    ) : null}
                                    <div className={`flex items-baseline gap-1 font-black text-2xl ${product.discount ? 'text-red-500' : 'text-gray-900'}`}>
                                        <span>{((product.discount || 0) > 0 ? product.price - (product.price * product.discount! / 100) : product.price).toLocaleString('en-US')}</span>
                                        <span className="text-xs uppercase font-bold text-gray-400">{isRTL ? 'ج.م' : 'EGP'}</span>
                                    </div>
                                </div>

                                {/* Rating and Reviews - Redesigned per user request */}
                                <div 
                                    className={`flex flex-col gap-1 cursor-pointer group ${isRTL ? 'items-start' : 'items-end'}`}
                                    onClick={() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                >
                                    <div className="flex items-center gap-2" dir="ltr">
                                        <div className="flex gap-0.5 text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill={i < Math.round(product.rating || 0) ? 'currentColor' : 'none'} strokeWidth={2} />
                                            ))}
                                        </div>
                                        <span className="text-sm font-black text-gray-900">
                                            {product.rating?.toFixed(1) || '0.0'}
                                        </span>
                                    </div>
                                    <span className={`text-[11px] font-bold text-gray-400 group-hover:text-[var(--color-brand-primary)] transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                                        {isRTL ? `(${product.num_reviews || 0}) عرض التقييمات` : `View Reviews (${product.num_reviews || 0})`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Free Delivery Countdown Banner */}
                        <FreeDeliveryBanner isRTL={isRTL} />

                        {/* VTO Banner (Try with AI) */}
                        {product.is_vto_enabled !== false && (
                            <motion.div
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsVTOOpen(true)}
                                className={`mb-8 p-4 rounded-3xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-100 flex items-center justify-between cursor-pointer group overflow-hidden relative ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
                                <div className={`flex items-center gap-4 relative z-10 ${isRTL ? 'flex-row-reverse' : 'flex-row text-right'}`}>
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/5 border border-purple-50">
                                        <Flame size={24} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 font-cairo text-base">{t.product?.vto_banner || (isRTL ? 'جرب القطعة دي دلوقتي' : 'Try this piece now')}</h4>
                                        <p className="text-[11px] text-gray-400 font-bold font-cairo">{t.product?.vto_desc || (isRTL ? 'شوف شكلها عليك بالذكاء الاصطناعي' : 'See how it looks on you with AI')}</p>
                                    </div>
                                </div>
                                <div className={isRTL ? 'rotate-180' : ''}>
                                    <ChevronRight size={20} className="text-purple-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        )}

                        <div className="space-y-10">
                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <h3 className="text-base font-black text-gray-900 mb-4 font-cairo">{t.product?.colors || 'Colors'}</h3>
                                    <div className={`flex flex-wrap gap-2 pb-4 pt-2 px-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {parseColors(product.colors).map((c, i) => {
                                            const rawImage = c.image
                                                ? formatImageUrl(c.image)
                                                : (c.imageIndex !== undefined && product.images?.[c.imageIndex]
                                                    ? formatImageUrl(product.images[c.imageIndex])
                                                    : null);

                                            const thumbImage = getThumbnailUrl(rawImage);

                                            return (
                                                <button
                                                    key={`${c.color}-${i}`}
                                                    onClick={() => {
                                                        setSelectedColor(c.color);
                                                        if (c.imageIndex !== undefined && c.imageIndex !== null) {
                                                            setSelectedImage(c.imageIndex);
                                                            // Scroll to gallery
                                                            galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                    }}
                                                    className={`
                                                        w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 p-[3px] border-2 group relative
                                                        ${selectedColor === c.color
                                                            ? 'border-[var(--color-brand-primary)] shadow-md shadow-[var(--color-brand-primary)]/20 scale-110'
                                                            : 'border-transparent bg-gray-50 hover:border-gray-300 hover:scale-105'}
                                                    `}
                                                    title={c.color}
                                                >
                                                    <div className="w-full h-full rounded-full overflow-hidden relative bg-white flex items-center justify-center shadow-inner">
                                                        {thumbImage ? (
                                                            <Image
                                                                src={thumbImage}
                                                                alt={c.color}
                                                                fill
                                                                className="object-cover"
                                                                sizes="56px"
                                                            />
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400 font-bold px-1 text-center font-cairo leading-tight">{c.color}</span>
                                                        )}
                                                        {selectedColor === c.color && (
                                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                                                                <Check size={18} className="text-white drop-shadow-md" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Size Selection */}
                            {product.sizes && product.sizes.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-base font-black text-gray-900 font-cairo">{t.product?.sizes || 'Sizes'}</h3>
                                        <button
                                            onClick={() => setIsSizeGuideOpen(true)}
                                            className="text-[11px] font-black text-[var(--color-brand-primary)] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand-primary)]/5 hover:bg-[var(--color-brand-primary)]/10 transition-colors"
                                        >
                                            <Ruler size={14} />
                                            <span>{t.product?.size_guide || (isRTL ? 'دليل المقاسات' : 'Size Guide')}</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {product.sizes.map((s: string, i: number) => (
                                            <button
                                                key={`${s}-${i}`}
                                                onClick={() => setSelectedSize(s)}
                                                className={`min-w-[3.5rem] h-10 px-3 rounded-xl border-2 font-black text-sm transition-all ${selectedSize === s ? 'border-[var(--color-brand-primary)] bg-white text-[var(--color-brand-primary)] shadow-md scale-105' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-100'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stock Alert */}
                            {stockCount > 0 && stockCount < 50 ? (
                                <div className="p-4 rounded-[20px] bg-amber-50 border border-amber-100/50 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <Flame size={16} className="text-amber-500 fill-amber-500" />
                                        </motion.div>
                                    </div>
                                    <span className="text-xs font-black text-amber-900 font-cairo">
                                        {t.product?.low_stock?.replace('{count}', stockCount.toString()) || (isRTL ? `الكمية محدودة! باق ${stockCount} قطع فقط` : `Limited Stock! Only ${stockCount} left`)}
                                    </span>
                                </div>
                            ) : stockCount <= 0 ? (
                                <div className="p-4 rounded-[20px] bg-red-50 border border-red-100/50 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <ShoppingBag size={16} className="text-red-500" />
                                    </div>
                                    <span className="text-xs font-black text-red-900 font-cairo">
                                        نفدت الكمية
                                    </span>
                                </div>
                            ) : null}

                            {/* Quantity & Actions - Visible on all screens now */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-base font-black text-gray-900 font-cairo">{t.product?.quantity || 'Quantity'}</h3>
                                <div className="flex items-center bg-white rounded-[16px] p-1 w-fit border border-gray-100 shadow-sm">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-950 transition-colors bg-gray-50 rounded-xl"
                                    >
                                        <Minus size={16} strokeWidth={3} />
                                    </button>
                                    <span className="w-12 text-center font-black text-lg text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-950 transition-colors bg-gray-50 rounded-xl"
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {/* Description & FAQs */}
                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-base font-black text-gray-900 mb-4 font-cairo">{t.product?.description || 'Details'}</h3>
                                <p className="text-gray-500 leading-relaxed font-bold font-cairo text-sm opacity-70">
                                    {product.description}
                                </p>
                                <FAQAccordion isRTL={isRTL} />
                            </div>

                            {/* Reviews Section Integration */}
                            <div ref={reviewsRef} className="pt-10 border-t border-gray-100">
                                <ReviewsSection productId={productId} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* FLOATING CAPSULE FOOTER (Matches Flutter _buildGlassActionPill) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-50">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gray-950 p-1.5 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.3)] flex items-center justify-between border border-white/10"
                >
                    <div className="flex flex-col px-6">
                        {quantity > 1 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center gap-2 mb-0.5"
                            >
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="text-white/40 hover:text-white"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="text-white font-black text-sm w-4 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="text-white/40 hover:text-white"
                                >
                                    <Plus size={14} />
                                </button>
                            </motion.div>
                        )}
                        <span className="text-lg font-black text-white font-cairo">
                            {(((product.discount || 0) > 0 ? product.price - (product.price * product.discount! / 100) : product.price) * quantity).toLocaleString()}
                            <span className="text-[10px] ml-1 opacity-50">{isRTL ? 'ج.م' : 'EGP'}</span>
                        </span>
                    </div>

                    <button
                        onClick={stockCount <= 0 ? undefined : (isInCart ? () => router.push('/cart') : handleAddToCart)}
                        className={`
                            flex items-center gap-2 px-8 py-4 rounded-[1.75rem] font-black text-base transition-all active:scale-95 overflow-hidden relative
                            ${stockCount <= 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : (!selectedSize || (product.colors && product.colors.length > 0 && !selectedColor))
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : isInCart
                                        ? 'bg-[var(--color-brand-primary)] text-white shadow-lg'
                                        : 'bg-white text-gray-950 shadow-lg hover:bg-gray-100'}
                        `}
                        disabled={stockCount <= 0}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isInCart ? 'go_to_cart' : 'add_to_cart'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2"
                            >
                                <ShoppingBag size={18} />
                                <span className="font-cairo">
                                    {stockCount <= 0
                                        ? 'نفدت الكمية'
                                        : isInCart
                                            ? (isRTL ? 'ذهاب للحقيبة' : 'Go to Cart')
                                            : (t.product?.add_to_cart || 'Add to Cart')}
                                </span>
                            </motion.div>
                        </AnimatePresence>
                    </button>
                </motion.div>
            </div>

            {/* Size Guide Bottom Sheet Modal */}
            <SizeGuideModal
                isOpen={isSizeGuideOpen}
                onClose={() => setIsSizeGuideOpen(false)}
                sizeGuide={product.size_guide}
            />

            {/* AI Virtual Try-On Modal */}
            <VirtualTryOnModal
                isOpen={isVTOOpen}
                onClose={() => setIsVTOOpen(false)}
                productImages={parseColors(product.colors).length > 0
                    ? parseColors(product.colors).map(c =>
                        (c.imageIndex !== undefined && c.imageIndex !== null && safeImages[c.imageIndex])
                            ? safeImages[c.imageIndex]
                            : safeImages[0]
                    ).filter((img): img is string => !!img)
                    : safeImages}
                productId={productId}
                productName={product.name}
            />

            {/* Lightbox for full screen images */}
            <ImageLightbox
                images={safeImages.map(img => formatImageUrl(img))}
                currentIndex={selectedImage}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                onNavigate={(index) => setSelectedImage(index)}
            />
        </div>
    );
}
