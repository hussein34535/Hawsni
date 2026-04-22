'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Share2, Heart, ArrowRight, ArrowLeft, ShoppingBag, Star, Play, Pause, Maximize,
    Hand, Flame, Check, Ruler, Info, Copy, CheckCircle2, Minus, Plus, ChevronRight,
    X, ChevronDown
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
    const [showControls, setShowControls] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const togglePlay = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
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

    const toggleFullscreen = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            } else if ((videoRef.current as any).webkitRequestFullscreen) {
                (videoRef.current as any).webkitRequestFullscreen();
            }
        }
    };

    const handleVideoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isPlaying) {
            togglePlay();
            setShowControls(true);
            startControlsTimer();
        } else {
            setShowControls(prev => !prev);
            if (!showControls) {
                startControlsTimer();
            } else {
                if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            }
        }
    };

    const startControlsTimer = () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    return (
        <div 
            className="w-full h-full flex items-center justify-center cursor-pointer group overflow-hidden relative"
            onClick={handleVideoClick}
            onMouseMove={isPlaying ? startControlsTimer : undefined}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                playsInline
                controls={false}
                controlsList="nodownload"
                loop
                onPlay={() => {
                    setIsPlaying(true);
                    startControlsTimer();
                }}
                onPause={() => {
                    setIsPlaying(false);
                    setShowControls(true);
                }}
                onEnded={() => {
                    setIsPlaying(false);
                    setShowControls(true);
                }}
            />
            
            <AnimatePresence>
                {!isPlaying && !showControls && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/10"
                    >
                        <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/40 transform transition-transform hover:scale-110 active:scale-95">
                            <Play className="w-8 h-8 text-white ml-1 drop-shadow-md" fill="currentColor" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(showControls || !isPlaying) && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-4 left-4 right-4 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center px-3 justify-between border border-white/10 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={togglePlay}
                            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors focus:outline-none"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 text-white" fill="currentColor" />
                            ) : (
                                <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                            )}
                        </button>
                        
                        <button 
                            onClick={toggleFullscreen}
                            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors focus:outline-none"
                        >
                            <Maximize className="w-4 h-4 text-white" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ReviewsSection = dynamic(() => import('@/components/product/ReviewsSection'), { ssr: false });
const SizeGuideModal = dynamic(() => import('@/components/product/SizeGuideModal'), { ssr: false });
const VirtualTryOnModal = dynamic(() => import('@/components/product/VirtualTryOnModal'), { ssr: false });
const AccessoryUpsellModal = dynamic(() => import('@/components/product/AccessoryUpsellModal'), { ssr: false });
import { FreeDeliveryBanner } from '@/components/products/FreeDeliveryBanner';
const ImageLightbox = dynamic(() => import('@/components/common/ImageLightbox'), { ssr: false });
import ProductCard from '@/components/products/ProductCard';

const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

const parseColors = (colors: any[] | undefined) => {
    if (!colors) return [];
    return colors.map(c => {
        if (typeof c === 'string') {
            try {
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
                        <div key={index} className={`rounded-2xl border transition-all duration-300 group ${isOpen ? 'bg-white border-[var(--color-brand-primary)]/30 shadow-xl shadow-[var(--color-brand-primary)]/5' : 'bg-gray-50/40 border-gray-100 hover:border-gray-200 hover:bg-gray-50/80'}`}>
                            <button onClick={() => setOpenIndex(isOpen ? null : index)} className={`w-full flex items-center justify-between p-5 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className={`font-black text-sm font-cairo transition-colors ${isOpen ? 'text-[var(--color-brand-primary)]' : 'text-gray-700'}`}>{faq.question}</span>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-[var(--color-brand-primary)] text-white rotate-180' : 'bg-white text-gray-400 group-hover:text-gray-600'}`}>
                                    <ChevronDown size={16} strokeWidth={3} />
                                </div>
                            </button>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}>
                                        <div className={`px-5 pb-5 text-sm font-bold text-gray-500 font-cairo leading-relaxed opacity-90 ${isRTL ? 'text-right' : 'text-left'}`}>
                                            <div className="pt-3 border-t border-gray-50">{faq.answer}</div>
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

interface ProductPageClientProps {
    initialProduct: Product;
}

export default function ProductPageClient({ initialProduct }: ProductPageClientProps) {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;
    const { t, isRTL } = useLanguage();
    const { showToast } = useToastStore();

    const [product, setProduct] = useState<Product>(initialProduct);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedAccessories, setSelectedAccessories] = useState<{name: string, price: number, image_url: string}[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
    const [isVTOOpen, setIsVTOOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isUpsellOpen, setIsUpsellOpen] = useState(false);
    const [hasShownUpsell, setHasShownUpsell] = useState(false);
    
    const sliderRef = useRef<HTMLDivElement>(null);
    const reviewsRef = useRef<HTMLDivElement>(null);
    const items = useCartStore((state) => state.items);
    const addItem = useCartStore((state) => state.addItem);
    const getItemCount = useCartStore((state) => state.getItemCount);

    const isInCart = product ? items.some((item) => item.id.startsWith(product.id || (product as any)._id)) : false;

    const getBasePrice = () => {
        if (!product) return 0;
        const discount = product.discount || 0;
        return discount > 0 ? product.price - (product.price * discount / 100) : product.price;
    };

    const finalUnitPrice = getBasePrice() + selectedAccessories.reduce((total, acc) => total + acc.price, 0);
    const totalPrice = finalUnitPrice * quantity;

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                const res = await productService.getRelatedProducts(productId);
                if (res.success) setRelatedProducts(res.products);
            } catch (error) {
                console.error('Failed to fetch related products:', error);
            }
        };

        const checkWishlist = async () => {
            try {
                const data = await wishlistService.getWishlist();
                const isItemInWishlist = data.wishlist.some(item => (item.product?._id || item.product?.id) === productId);
                setIsFavorite(isItemInWishlist);
            } catch (error) {
                console.error('Failed to check wishlist:', error);
            }
        };

        if (productId) {
            fetchRelated();
            checkWishlist();
            
            const discount = initialProduct.discount || 0;
            const finalPrice = discount > 0 ? initialProduct.price - (initialProduct.price * discount / 100) : initialProduct.price;
            trackEvent('ViewContent', {
                content_name: initialProduct.name,
                content_ids: [initialProduct.id || (initialProduct as any)._id],
                content_type: 'product',
                value: finalPrice,
                currency: 'EGP'
            });
            trackGAEvent('view_item', {
                currency: 'EGP',
                value: finalPrice,
                items: [{
                    item_id: initialProduct.id || (initialProduct as any)._id,
                    item_name: initialProduct.name,
                    price: finalPrice
                }]
            });
        }
    }, [productId, initialProduct]);

    const safeImages = Array.isArray(product?.images) ? product.images : [];

    const handleGalleryScroll = useCallback(() => {
        if (!sliderRef.current) return;
        const scrollLeft = sliderRef.current.scrollLeft;
        const width = sliderRef.current.offsetWidth;
        const newIndex = Math.round(scrollLeft / width);
        if (newIndex !== selectedImage && newIndex >= 0 && newIndex < safeImages.length) {
            setSelectedImage(newIndex);
        }
    }, [selectedImage, safeImages.length]);

    const performAddToCart = (selectedAccs: any[]) => {
        if (!product) return;
        let selectedColorImage = safeImages[0] || '';
        const prodId = product.id || (product as any)._id;
        const activeAccStr = selectedAccs.map(a => a.name).join('_');

        addItem({
            id: `${prodId}_${selectedSize}_${selectedColor || 'default'}_${activeAccStr}`,
            productId: prodId,
            name: product.name,
            price: getBasePrice(),
            imageUrl: formatImageUrl(selectedColorImage),
            quantity: quantity,
            size: selectedSize || undefined,
            color: selectedColor || undefined,
            accessories: selectedAccs
        });

        trackEvent('AddToCart', {
            content_name: product.name,
            content_ids: [prodId],
            content_type: 'product',
            value: finalUnitPrice,
            currency: 'EGP',
            num_items: quantity
        });

        showToast(isRTL ? 'تمت الإضافة إلى السلة' : 'Added to cart successfully', 'success');
        setIsUpsellOpen(false);
        setHasShownUpsell(true);
    };

    const handleAddToCart = () => {
        if (!selectedSize) {
            showToast(isRTL ? 'يرجى اختيار المقاس' : 'Please select a size', 'error');
            return;
        }
        if (product?.accessories && product.accessories.length > 0 && selectedAccessories.length === 0 && !hasShownUpsell) {
            setIsUpsellOpen(true);
            return;
        }
        performAddToCart(selectedAccessories);
    };

    const currentStockOut = (product.stock_count || 0) <= 0;
    const stockCount = product.stock_count || 0;

    return (
        <div className={`w-full bg-[#FAFAFA] min-h-screen lg:mt-0 -mt-20 ${isRTL ? 'text-right' : 'text-left'}`} dir="ltr">
            <div className={`fixed top-0 left-0 right-0 z-[60] p-4 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-start bg-gradient-to-b from-black/10 to-transparent pointer-events-none h-24 pt-2`}>
                <button onClick={() => router.back()} className="w-10 h-10 bg-black/30 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/10 pointer-events-auto active:scale-95 transition-transform">
                    {isRTL ? <ArrowRight size={20} className="text-white" /> : <ArrowLeft size={20} className="text-white" />}
                </button>
                <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 pointer-events-auto`}>
                    <button onClick={async () => {
                        if (isFavorite) {
                            await wishlistService.removeFromWishlist(product.id || (product as any)._id);
                            setIsFavorite(false);
                        } else {
                            await wishlistService.addToWishlist(product);
                            setIsFavorite(true);
                        }
                    }} className="w-10 h-10 bg-black/30 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/10 active:scale-95 transition-transform">
                        <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'} />
                    </button>
                    <button onClick={() => router.push('/cart')} className="w-10 h-10 bg-black/30 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/10 active:scale-95 transition-transform relative">
                        <ShoppingBag size={20} className="text-white" />
                        {getItemCount() > 0 && <span className="absolute -top-1 -right-1 bg-[var(--color-brand-primary)] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black/10 shadow-lg">{getItemCount()}</span>}
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto pb-40">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative aspect-[4/3.2] bg-[#F4F4F4] overflow-hidden lg:rounded-b-[4rem] group">
                        <div ref={sliderRef} onScroll={handleGalleryScroll} className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
                            {safeImages.map((img: string, i: number) => {
                                const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(img) || img.includes('/video/upload/');
                                return (
                                    <div key={i} className="min-w-full h-full relative flex-shrink-0 cursor-zoom-in overflow-hidden snap-center snap-always" onClick={() => setIsLightboxOpen(true)}>
                                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                                            {isVideo ? <ProductVideoItem src={formatImageUrl(img)} /> : <Image src={formatImageUrl(img)} alt={product.name} fill priority={i === 0} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover select-none" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`px-5 pt-5 pb-4 md:px-10 md:pt-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="flex flex-col gap-2.5 mb-5">
                            <h1 className="text-xl font-black text-gray-900 font-cairo leading-tight tracking-tight">{product.name}</h1>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-col">
                                    {product.discount ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-400 line-through font-bold">{product.price.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">-{product.discount}%</span>
                                        </div>
                                    ) : null}
                                    <div className={`flex items-baseline gap-1 font-black text-[1.6rem] ${product.discount ? 'text-red-500' : 'text-gray-900'}`}>
                                        <span>{Math.round(getBasePrice()).toLocaleString()}</span>
                                        <span className="text-[11px] uppercase font-bold text-gray-400">{isRTL ? 'ج.م' : 'EGP'}</span>
                                    </div>
                                </div>
                                <button onClick={() => {
                                    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }} className="flex flex-col items-end gap-1 hover:opacity-80 transition-opacity">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} size={14} className="text-yellow-400" />
                                        ))}
                                        <span className="font-black text-gray-900 ml-1 text-sm">0.0</span>
                                    </div>
                                    <span className="text-gray-400 font-bold text-xs">
                                        ({isRTL ? 'عرض التقييمات (0)' : '0 Reviews'})
                                    </span>
                                </button>
                            </div>
                        </div>

                        <FreeDeliveryBanner isRTL={isRTL} />

                        <div className="mt-4 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-black text-gray-900 font-cairo">{isRTL ? 'المقاس' : 'Size'}</h3>
                                    <button
                                        onClick={() => setIsSizeGuideOpen(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0E4435] text-white rounded-full text-xs font-black font-cairo shadow hover:bg-[#0a3028] active:scale-95 transition-all"
                                    >
                                        <Ruler size={13} />
                                        {isRTL ? 'دليل المقاسات' : 'Size Guide'}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes?.map(size => (
                                        <button key={size} onClick={() => setSelectedSize(size)} className={`h-9 px-4 rounded-xl font-black text-xs transition-all active:scale-95 ${selectedSize === size ? 'bg-[#0E4435] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 shadow-sm'}`}>{size}</button>
                                    ))}
                                </div>
                            </div>
                            
                            {stockCount > 0 && stockCount <= 15 && (
                                <div className="w-full bg-orange-50/80 rounded-2xl p-4 flex items-center gap-3 border border-orange-100">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                                        <Flame size={16} className="text-orange-500 fill-orange-500" />
                                    </div>
                                    <p className="text-orange-900 font-black text-sm font-cairo">
                                        {isRTL ? `الكمية محدودة! باق ${stockCount} قطع فقط` : `Limited Quantity! Only ${stockCount} left`}
                                    </p>
                                </div>
                            )}
                         </div>

                        {/* Accessories Section */}
                        {product.accessories && product.accessories.length > 0 && (
                            <div className="mt-5">
                                <h3 className="text-sm font-black text-gray-900 mb-3 font-cairo">
                                    {isRTL ? 'إضافات مميزة' : 'Featured Add-ons'}
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {product.accessories.map((acc: any, idx: number) => {
                                        const accName = typeof acc === 'string' ? acc : acc.name;
                                        const accPrice = typeof acc === 'string' ? 0 : acc.price;
                                        const accImage = typeof acc === 'string' ? '' : acc.image_url;
                                        const isSelected = selectedAccessories.some(a => a.name === accName);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedAccessories(prev => prev.filter(a => a.name !== accName));
                                                    } else {
                                                        setSelectedAccessories(prev => [...prev, { name: accName, price: accPrice, image_url: accImage }]);
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-95 ${isSelected ? 'bg-[#0E4435]/5 border-[#0E4435]/30' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-[#0E4435] border-[#0E4435]' : 'border-gray-300'}`}>
                                                        {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                    {accImage ? (
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                                                            <img src={formatImageUrl(accImage)} alt={accName} className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : null}
                                                    <div className={`text-right ${isRTL ? '' : 'text-left'}`}>
                                                        <p className="font-black text-gray-900 text-sm font-cairo">{accName}</p>
                                                        {accPrice > 0 && <p className="text-[#0E4435] font-black text-xs">+{accPrice} {isRTL ? 'ج.م' : 'EGP'}</p>}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quantity Section */}
                        <div className="mt-5">
                            <h3 className="text-sm font-black text-gray-900 mb-3 font-cairo">
                                {isRTL ? 'الكمية' : 'Quantity'}
                            </h3>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-300 active:scale-95 transition-all shadow-sm"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="w-12 text-center font-black text-gray-900 text-base">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-300 active:scale-95 transition-all shadow-sm"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Product Description */}
                        {product.description && (
                            <div className="mt-5">
                                <h3 className="text-sm font-black text-gray-900 mb-3 font-cairo flex items-center gap-2">
                                    <Info size={15} className="text-[#0E4435]" />
                                    {isRTL ? 'التفاصيل' : 'Details'}
                                </h3>
                                <p className={`text-sm text-gray-500 font-bold font-cairo leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {product.description}
                                </p>
                            </div>
                        )}

                        <FAQAccordion isRTL={isRTL} />

                        <div ref={reviewsRef} className="pt-10 border-t border-gray-100">
                            <ReviewsSection productId={productId} />
                        </div>
                    </div>
                </div>
            </main>

            {/* FLOATING CAPSULE FOOTER */}
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
                            {totalPrice.toLocaleString()}
                            <span className="text-[10px] ml-1 opacity-50">{isRTL ? 'ج.م' : 'EGP'}</span>
                        </span>
                    </div>

                    <button
                        onClick={currentStockOut ? undefined : (isInCart ? () => router.push('/cart') : handleAddToCart)}
                        className={`
                            flex items-center gap-2 px-8 py-4 rounded-[1.75rem] font-black text-base transition-all active:scale-95 overflow-hidden relative
                            ${currentStockOut
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : (!selectedSize || (product.colors && product.colors.length > 0 && !selectedColor))
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : isInCart
                                        ? 'bg-[var(--color-brand-primary)] text-white shadow-lg'
                                        : 'bg-white text-gray-950 shadow-lg hover:bg-gray-100'}
                        `}
                        disabled={currentStockOut}
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

            <SizeGuideModal
                isOpen={isSizeGuideOpen}
                onClose={() => setIsSizeGuideOpen(false)}
                sizeGuide={product.size_guide}
            />

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

            <ImageLightbox
                images={safeImages.map(img => formatImageUrl(img))}
                currentIndex={selectedImage}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                onNavigate={(index) => setSelectedImage(index)}
            />

            <AnimatePresence>
                {isUpsellOpen && (
                    <AccessoryUpsellModal 
                        isOpen={isUpsellOpen} 
                        onClose={() => performAddToCart([])}
                        onSkip={() => performAddToCart([])} 
                        onAdd={performAddToCart}
                        accessories={product.accessories || []}
                        productName={product.name}
                        isRTL={isRTL}
                        formatImageUrl={formatImageUrl}
                    />
                )}
            </AnimatePresence>
            
            {/* Added Related Products Section at the end of content before the fixed footer */}
            {relatedProducts.length > 0 && (
                <div className="max-w-7xl mx-auto px-5 pb-10">
                    <h3 className="text-lg font-black text-gray-900 mb-6 font-cairo">
                        {isRTL ? 'منتجات قد تعجبك' : 'Related Products'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {relatedProducts.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
