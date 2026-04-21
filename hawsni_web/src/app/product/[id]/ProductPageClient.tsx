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

    // Use initialProduct from Server Component - No more double fetching!
    const [product, setProduct] = useState<Product>(initialProduct);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false); // No more loading spinner needed for main data
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
    const [showGallerySwipeHint, setShowGallerySwipeHint] = useState(false);
    
    const relatedSectionRef = useRef<HTMLDivElement>(null);
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
            
            // Track ViewContent using initial data
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
                    <div className="relative aspect-[4/4] bg-[#F4F4F4] overflow-hidden lg:rounded-b-[4rem] group">
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

                    <div className={`p-6 md:p-10 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="flex flex-col gap-6 mb-10">
                            <h1 className="text-2xl font-black text-gray-900 font-cairo leading-tight tracking-tight mb-2.5">{product.name}</h1>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-col">
                                    {product.discount ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-400 line-through font-bold">{product.price.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">-{product.discount}%</span>
                                        </div>
                                    ) : null}
                                    <div className={`flex items-baseline gap-1 font-black text-2xl ${product.discount ? 'text-red-500' : 'text-gray-900'}`}>
                                        <span>{Math.round(getBasePrice()).toLocaleString()}</span>
                                        <span className="text-xs uppercase font-bold text-gray-400">{isRTL ? 'ج.م' : 'EGP'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <FreeDeliveryBanner isRTL={isRTL} />

                        <div className="mt-8 space-y-6">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 mb-4">{isRTL ? 'اختر المقاس' : 'Select Size'}</h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.sizes?.map(size => (
                                        <button key={size} onClick={() => setSelectedSize(size)} className={`h-12 px-6 rounded-xl font-black text-sm transition-all ${selectedSize === size ? 'bg-[#0E4435] text-white' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'}`}>{size}</button>
                                    ))}
                                </div>
                            </div>
                            
                            <button onClick={handleAddToCart} className="w-full h-14 bg-[#0E4435] text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-[#0E4435]/20 active:scale-95 transition-all">
                                <ShoppingBag size={20} />
                                {isRTL ? 'إضافة إلى السلة' : 'Add to Cart'}
                            </button>
                        </div>

                        <FAQAccordion isRTL={isRTL} />
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {isUpsellOpen && (
                    <AccessoryUpsellModal 
                        isOpen={isUpsellOpen} 
                        onClose={() => performAddToCart([])} 
                        onConfirm={performAddToCart}
                        accessories={product.accessories || []}
                        isRTL={isRTL}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
