'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Share2, Heart, ArrowRight, ArrowLeft, ShoppingBag, Star, 
    Check, Ruler, Info, CheckCircle2, Minus, Plus, ChevronRight,
    X, ChevronDown, Shield, Truck, RefreshCw, CreditCard, Sparkles,
    Eye, ShoppingCart
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
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamic Imports for performance
const ReviewsSection = dynamic(() => import('@/components/product/ReviewsSection'), { ssr: false });
const SizeGuideModal = dynamic(() => import('@/components/product/SizeGuideModal'), { ssr: false });
const VirtualTryOnModal = dynamic(() => import('@/components/product/VirtualTryOnModal'), { ssr: false });
const ImageLightbox = dynamic(() => import('@/components/common/ImageLightbox'), { ssr: false });
const AccessoryUpsellModal = dynamic(() => import('@/components/product/AccessoryUpsellModal'), { ssr: false });
import ProductCard from '@/components/products/ProductCard';

const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

export default function ProductPageClient({ initialProduct }: { initialProduct: Product }) {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;
    const { isRTL, language } = useLanguage();
    const { showToast } = useToastStore();
    const addItem = useCartStore((state) => state.addItem);

    // State
    const [product, setProduct] = useState<Product>(initialProduct);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');
    
    // Modals state
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
    const [isVTOOpen, setIsVTOOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isUpsellOpen, setIsUpsellOpen] = useState(false);

    // Calculations
    const discountedPrice = useMemo(() => {
        if (!product.discount) return product.price;
        return product.price - (product.price * product.discount / 100);
    }, [product]);

    useEffect(() => {
        if (productId) {
            // Track ViewContent
            trackEvent('ViewContent', {
                content_ids: [productId],
                content_name: product.name,
                content_type: 'product',
                value: discountedPrice,
                currency: 'EGP'
            });

            // Fetch related products
            productService.getRelatedProducts(productId).then(res => {
                if (res.success) setRelatedProducts(res.products);
            });

            // Check if in wishlist
            const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            setIsFavorite(wishlist.some((item: any) => item.id === productId));
        }
    }, [productId, product.name, discountedPrice]);

    const handleAddToCart = () => {
        if (!selectedSize && product.sizes && product.sizes.length > 0) {
            showToast(isRTL ? 'يرجى اختيار المقاس أولاً' : 'Please select a size first', 'error');
            return;
        }

        addItem({
            id: `${product.id}_${selectedSize || 'default'}`,
            productId: product.id || '',
            name: product.name,
            price: discountedPrice,
            imageUrl: formatImageUrl(product.images?.[0] || ''),
            quantity: quantity,
            size: selectedSize || ''
        });

        trackEvent('AddToCart', {
            content_ids: [productId],
            content_name: product.name,
            value: discountedPrice * quantity,
            currency: 'EGP'
        });

        showToast(isRTL ? 'تمت الإضافة للسلة بنجاح' : 'Added to cart successfully', 'success');
        
        // Show upsell modal after a short delay
        if (product.accessories && product.accessories.length > 0) {
            setTimeout(() => setIsUpsellOpen(true), 500);
        }
    };

    const toggleFavorite = () => {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        let newWishlist;
        if (isFavorite) {
            newWishlist = wishlist.filter((item: any) => item.id !== productId);
        } else {
            newWishlist = [...wishlist, { id: productId, name: product.name, price: discountedPrice, image: product.images[0] }];
        }
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        setIsFavorite(!isFavorite);
        showToast(
            isRTL 
                ? (isFavorite ? 'تم الحذف من المفضلة' : 'تمت الإضافة للمفضلة') 
                : (isFavorite ? 'Removed from wishlist' : 'Added to wishlist'),
            'success'
        );
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.name,
                    text: product.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast(isRTL ? 'تم نسخ الرابط' : 'Link copied to clipboard', 'success');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 font-cairo pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
                {/* Breadcrumbs / Back button */}
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#0E4435] transition-colors mb-6 group"
                >
                    {isRTL ? <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> : <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />}
                    <span>{isRTL ? 'العودة' : 'Back'}</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Gallery (Lg: 7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-white shadow-2xl shadow-gray-200/50 group cursor-zoom-in"
                             onClick={() => setIsLightboxOpen(true)}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedImage}
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4 }}
                                    className="relative w-full h-full"
                                >
                                    <Image 
                                        src={formatImageUrl(product.images[selectedImage])} 
                                        alt={product.name} 
                                        fill 
                                        className="object-cover"
                                        priority
                                    />
                                </motion.div>
                            </AnimatePresence>
                            
                            {/* Overlay Badges */}
                            <div className="absolute top-6 left-6 flex flex-col gap-3">
                                {product.discount && (
                                    <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                                        <Sparkles size={14} />
                                        {isRTL ? `خصم ${product.discount}%` : `-${product.discount}% OFF`}
                                    </span>
                                )}
                                {product.isFeatured && (
                                    <span className="bg-[#0E4435] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                                        <Star size={14} fill="currentColor" />
                                        {isRTL ? 'مميز' : 'Featured'}
                                    </span>
                                )}
                            </div>

                            {/* Share & Heart Floating */}
                            <div className="absolute top-6 right-6 flex flex-col gap-3">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-900 hover:bg-white'}`}
                                >
                                    <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleShare(); }}
                                    className="w-12 h-12 bg-white/80 backdrop-blur-md text-gray-900 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-xl"
                                >
                                    <Share2 size={24} />
                                </button>
                            </div>

                            {/* VTO Trigger */}
                            {product.is_vto_enabled && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsVTOOpen(true); }}
                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20 hover:scale-105 transition-transform"
                                >
                                    <Eye size={20} className="text-[#0E4435]" />
                                    <span className="font-bold text-gray-900">{isRTL ? 'تجربة افتراضية' : 'Virtual Try-On'}</span>
                                </button>
                            )}
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`relative flex-shrink-0 w-24 aspect-[4/5] rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-[#0E4435] scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <Image src={formatImageUrl(img)} alt={`${product.name} ${idx}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Info (Lg: 5 cols) */}
                    <div className="lg:col-span-5 flex flex-col">
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-gray-200/30 border border-gray-100 flex-grow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[#0E4435] font-bold text-sm tracking-widest uppercase mb-2 block">
                                        {typeof product.category === 'string' ? product.category : product.category?.name}
                                    </span>
                                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                                        {product.name}
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-700 px-3 py-1 rounded-full">
                                    <Star size={16} fill="currentColor" />
                                    <span className="font-bold">{product.rating || '5.0'}</span>
                                </div>
                                <span className="text-gray-400 text-sm">
                                    ({product.num_reviews || 0} {isRTL ? 'تقييم' : 'reviews'})
                                </span>
                            </div>

                            {/* Price Section */}
                            <div className="mb-10 p-6 rounded-3xl bg-gray-50 border border-gray-100">
                                <div className="flex items-end gap-4">
                                    <span className="text-4xl font-black text-[#0E4435]">
                                        {discountedPrice.toLocaleString()} <span className="text-lg font-bold">{isRTL ? 'ج.م' : 'EGP'}</span>
                                    </span>
                                    {product.discount && (
                                        <span className="text-xl text-gray-400 line-through mb-1">
                                            {product.price.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {isRTL ? 'السعر شامل ضريبة القيمة المضافة' : 'Price includes VAT'}
                                </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-8 mb-10">
                                {/* Size Selection */}
                                {product.sizes && product.sizes.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="font-black text-gray-900 text-lg flex items-center gap-2">
                                                <Ruler size={20} className="text-[#0E4435]" />
                                                {isRTL ? 'اختر المقاس' : 'Select Size'}
                                            </label>
                                            <button 
                                                onClick={() => setIsSizeGuideOpen(true)}
                                                className="text-[#0E4435] text-sm font-bold underline hover:no-underline"
                                            >
                                                {isRTL ? 'دليل المقاسات' : 'Size Guide'}
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {product.sizes.map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`min-w-[4rem] h-14 flex items-center justify-center rounded-2xl font-bold transition-all border-2 ${selectedSize === size ? 'bg-[#0E4435] border-[#0E4435] text-white shadow-xl scale-105' : 'bg-white border-gray-100 text-gray-600 hover:border-[#0E4435]/30'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity */}
                                <div className="space-y-4">
                                    <label className="font-black text-gray-900 text-lg">
                                        {isRTL ? 'الكمية' : 'Quantity'}
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                                            <button 
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white transition-colors text-gray-500"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <span className="w-12 text-center font-black text-xl">{quantity}</span>
                                            <button 
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white transition-colors text-gray-900"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <span className="text-sm text-gray-400">
                                            {isRTL ? `متبقي ${product.stock || 5} قطع فقط!` : `Only ${product.stock || 5} left!`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button 
                                    onClick={handleAddToCart}
                                    className="flex items-center justify-center gap-3 bg-[#0E4435] text-white h-16 rounded-2xl font-black text-lg shadow-xl shadow-[#0E4435]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <ShoppingCart size={22} />
                                    {isRTL ? 'إضافة للسلة' : 'Add to Cart'}
                                </button>
                                <button 
                                    className="flex items-center justify-center gap-3 bg-white text-[#0E4435] border-2 border-[#0E4435] h-16 rounded-2xl font-black text-lg hover:bg-[#0E4435]/5 transition-all"
                                    onClick={() => { handleAddToCart(); router.push('/cart'); }}
                                >
                                    {isRTL ? 'اشتري الآن' : 'Buy Now'}
                                </button>
                            </div>
                        </div>

                        {/* Quick Trust Badges */}
                        <div className="mt-6 grid grid-cols-3 gap-4">
                            <div className="bg-white/50 p-4 rounded-3xl flex flex-col items-center text-center border border-white/50">
                                <Truck size={24} className="text-[#0E4435] mb-2" />
                                <span className="text-[10px] md:text-xs font-bold text-gray-600">{isRTL ? 'شحن سريع' : 'Fast Shipping'}</span>
                            </div>
                            <div className="bg-white/50 p-4 rounded-3xl flex flex-col items-center text-center border border-white/50">
                                <RefreshCw size={24} className="text-[#0E4435] mb-2" />
                                <span className="text-[10px] md:text-xs font-bold text-gray-600">{isRTL ? 'إرجاع 14 يوم' : '14 Days Return'}</span>
                            </div>
                            <div className="bg-white/50 p-4 rounded-3xl flex flex-col items-center text-center border border-white/50">
                                <Shield size={24} className="text-[#0E4435] mb-2" />
                                <span className="text-[10px] md:text-xs font-bold text-gray-600">{isRTL ? 'دفع آمن' : 'Secure Payment'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="mt-20">
                    <div className="flex border-b border-gray-200 gap-10">
                        {['description', 'reviews', 'shipping'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-4 text-lg font-black relative transition-colors ${activeTab === tab ? 'text-[#0E4435]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {tab === 'description' && (isRTL ? 'الوصف' : 'Description')}
                                {tab === 'reviews' && (isRTL ? 'المراجعات' : 'Reviews')}
                                {tab === 'shipping' && (isRTL ? 'الشحن والاسترجاع' : 'Shipping')}
                                {activeTab === tab && (
                                    <motion.div 
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-[#0E4435] rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="py-10">
                        <AnimatePresence mode="wait">
                            {activeTab === 'description' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="prose prose-lg max-w-none text-gray-600 leading-relaxed"
                                >
                                    <p>{product.description}</p>
                                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                                            <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                                                <Info size={20} className="text-[#0E4435]" />
                                                {isRTL ? 'المميزات الرئيسية' : 'Key Features'}
                                            </h4>
                                            <ul className="space-y-3">
                                                <li className="flex items-start gap-3">
                                                    <CheckCircle2 size={18} className="text-green-500 mt-1" />
                                                    <span>خامة عالية الجودة ومريحة للارتداء اليومي.</span>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <CheckCircle2 size={18} className="text-green-500 mt-1" />
                                                    <span>تصميم عصري يناسب مختلف الإطلالات.</span>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <CheckCircle2 size={18} className="text-green-500 mt-1" />
                                                    <span>ألوان ثابتة لا تتغير مع الغسيل المتكرر.</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'reviews' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <ReviewsSection productId={productId} />
                                </motion.div>
                            )}

                            {activeTab === 'shipping' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="prose prose-lg max-w-none text-gray-600"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="flex flex-col gap-3">
                                            <Truck className="text-[#0E4435]" size={32} />
                                            <h4 className="font-black text-gray-900 m-0">{isRTL ? 'وقت التوصيل' : 'Delivery Time'}</h4>
                                            <p className="m-0">القاهرة والجيزة: 2-3 أيام عمل. باقي المحافظات: 3-5 أيام عمل.</p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <CreditCard className="text-[#0E4435]" size={32} />
                                            <h4 className="font-black text-gray-900 m-0">{isRTL ? 'طرق الدفع' : 'Payment Methods'}</h4>
                                            <p className="m-0">الدفع عند الاستلام، فيزا، أو ماستركارد من خلال بوابات دفع آمنة.</p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <RefreshCw className="text-[#0E4435]" size={32} />
                                            <h4 className="font-black text-gray-900 m-0">{isRTL ? 'سياسة الإرجاع' : 'Return Policy'}</h4>
                                            <p className="m-0">يمكنك إرجاع أو استبدال المنتج خلال 14 يوماً من تاريخ الاستلام بشرط حالته الأصلية.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20">
                        <h2 className="text-3xl font-black text-gray-900 mb-10 flex items-center gap-4">
                            <span className="w-2 h-10 bg-[#0E4435] rounded-full"></span>
                            {isRTL ? 'منتجات قد تعجبك' : 'Related Products'}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.slice(0, 4).map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Modals */}
                {isSizeGuideOpen && (
                    <SizeGuideModal 
                        isOpen={isSizeGuideOpen} 
                        onClose={() => setIsSizeGuideOpen(false)} 
                        sizeGuide={product.size_guide} 
                    />
                )}
                {isVTOOpen && (
                    <VirtualTryOnModal 
                        isOpen={isVTOOpen} 
                        onClose={() => setIsVTOOpen(false)} 
                        productId={product.id || ''} 
                        productImages={product.images.map(formatImageUrl)}
                        productName={product.name}
                    />
                )}
                {isLightboxOpen && (
                    <ImageLightbox 
                        isOpen={isLightboxOpen} 
                        onClose={() => setIsLightboxOpen(false)} 
                        images={product.images.map(formatImageUrl)} 
                        currentIndex={selectedImage}
                        onNavigate={(idx) => setSelectedImage(idx)}
                    />
                )}
                {isUpsellOpen && (
                    <AccessoryUpsellModal 
                        isOpen={isUpsellOpen} 
                        onClose={() => setIsUpsellOpen(false)} 
                        onSkip={() => setIsUpsellOpen(false)}
                        onAdd={(accs) => {
                            accs.forEach(acc => {
                                addItem({
                                    id: `${product.id}_acc_${acc.name}`,
                                    productId: product.id || '',
                                    name: acc.name,
                                    price: acc.price,
                                    imageUrl: formatImageUrl(acc.image_url),
                                    quantity: 1,
                                    size: ''
                                });
                            });
                            setIsUpsellOpen(false);
                            showToast(isRTL ? 'تمت إضافة الإكسسوارات للسلة' : 'Accessories added to cart', 'success');
                        }}
                        accessories={product.accessories || []} 
                        productName={product.name}
                        isRTL={isRTL}
                        formatImageUrl={formatImageUrl}
                    />
                )}
            </div>
        </div>
    );
}
