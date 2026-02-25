'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
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
    Ruler,
    X,
    Camera,
    Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { productService } from '@/services/productService';
import { useLanguage } from '@/context/LanguageContext';
import { Product } from '@/types';
import dynamic from 'next/dynamic';

const ReviewsSection = dynamic(() => import('@/components/product/ReviewsSection'), { ssr: false });
const SizeGuideModal = dynamic(() => import('@/components/product/SizeGuideModal'), { ssr: false });
const VirtualTryOnModal = dynamic(() => import('@/components/product/VirtualTryOnModal'), { ssr: false });

const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

const COLOR_MAP: Record<string, string> = {
    // English
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#008000',
    'black': '#000000',
    'white': '#FFFFFF',
    'grey': '#808080',
    'gray': '#808080',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'teal': '#008080',
    'navy': '#000080',
    'maroon': '#800000',
    'beige': '#F5F5DC',
    // Arabic
    'أحمر': '#FF0000',
    'أزرق': '#0000FF',
    'أخضر': '#008000',
    'أسود': '#000000',
    'أبيض': '#FFFFFF',
    'رمادي': '#808080',
    'أصفر': '#FFFF00',
    'برتقالي': '#FFA500',
    'بنفسجي': '#800080',
    'وردي': '#FFC0CB',
    'بني': '#A52A2A',
    'تركواز': '#008080',
    'كحلي': '#000080',
    'نبيتي': '#800000',
    'بيج': '#F5F5DC',
    'سماوي': '#87CEEB',
    'رصاصي': '#D3D3D3',
    'زيتي': '#556B2F'
};

const formatColor = (color: string) => {
    if (!color) return 'transparent';
    const normalized = color.toLowerCase().trim();
    if (COLOR_MAP[normalized]) return COLOR_MAP[normalized];
    if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl') || /^[a-fA-F0-9]{6}$/.test(color)) {
        return color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl') ? color : `#${color}`;
    }
    return '#808080'; // Fallback to grey
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

    const items = useCartStore((state) => state.items);
    const addItem = useCartStore((state) => state.addItem);
    const getItemCount = useCartStore((state) => state.getItemCount);

    // Derived state: check if current selection is in cart
    const currentItemId = product ? `${product._id}_${selectedSize}_${selectedColor || 'default'}` : null;
    const isInCart = items.some((item) => item.id === currentItemId);

    // Stock simulation
    const [stockCount] = useState(Math.floor(Math.random() * 5) + 2);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await productService.getProductById(productId);
                if (data.success) {
                    setProduct(data.product);
                    const parsed = parseColors(data.product.colors);
                    if (parsed.length > 0) {
                        setSelectedColor(parsed[0].color);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) fetchProduct();
    }, [productId]);

    // Swipable Gallery Logic
    const dragX = useMotionValue(0);
    const onDragEnd = () => {
        const x = dragX.get();
        const imagesCount = product?.images?.length || 1;

        // Logical RTL Swipe: 
        // Swipe Left (x < 0) -> Show image on the left (Next image in sequence: v + 1)
        // Swipe Right (x > 0) -> Show image on the right (Previous image in sequence: v - 1)
        if (x <= -50 && selectedImage < imagesCount - 1) {
            setSelectedImage((v) => v + 1);
        } else if (x >= 50 && selectedImage > 0) {
            setSelectedImage((v) => v - 1);
        }

        // Reset dragX to center the image
        dragX.set(0);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        if (!product) return;
        if (!selectedSize) {
            showToast(isRTL ? 'يرجى اختيار المقاس' : 'Please select a size', 'error');
            return;
        }

        addItem({
            id: `${product._id}_${selectedSize}_${selectedColor || 'default'}`,
            productId: product._id,
            name: product.name,
            price: product.price,
            imageUrl: product.images[0],
            quantity: quantity,
            size: selectedSize,
            color: selectedColor || undefined
        });

        showToast(isRTL ? 'تمت الإضافة إلى السلة' : 'Added to cart successfully', 'success');
    };

    const handleFavoriteClick = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast(isRTL ? 'يرجى تسجيل الدخول أولاً لإضافة المنتج للمفضلة' : 'Please login first to add to wishlist', 'error');
            return;
        }
        setIsFavorite(!isFavorite);
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
        <div className={`w-full bg-[#FAFAFA] min-h-screen lg:mt-0 -mt-20 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>

            {/* Header / AppBar - Transparent Overlay (Matches Flutter exactly) */}
            <div className={`fixed top-0 left-0 right-0 z-[60] p-4 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-start bg-gradient-to-b from-black/20 to-transparent pointer-events-none h-32 pt-6`}>
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20 pointer-events-auto active:scale-95 transition-transform"
                >
                    {isRTL ? <ArrowRight size={20} className="text-white" /> : <ArrowLeft size={20} className="text-white" />}
                </button>
                <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 pointer-events-auto`}>
                    <button
                        onClick={handleFavoriteClick}
                        className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20 active:scale-95 transition-transform"
                    >
                        <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'} />
                    </button>
                    <button
                        onClick={() => router.push('/cart')}
                        className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20 active:scale-95 transition-transform relative"
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

                    {/* Left: Swipable Image Gallery (Smooth Horizontal Slider) */}
                    <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden lg:rounded-b-[4rem] group">
                        <motion.div
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            style={{ x: dragX }}
                            onDragEnd={onDragEnd}
                            animate={{
                                x: -(selectedImage * 100) + "%"
                            }}
                            transition={{
                                type: 'spring',
                                damping: 40,
                                stiffness: 400,
                                mass: 0.8
                            }}
                            className="w-full h-full flex"
                        >
                            {product.images.map((img, i) => (
                                <div key={`img-${i}`} className="min-w-full h-full relative">
                                    <Image
                                        src={formatImageUrl(img)}
                                        alt={`${product.name} - ${i + 1}`}
                                        fill
                                        priority={i === 0}
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        className="object-cover select-none pointer-events-none"
                                    />
                                </div>
                            ))}
                        </motion.div>

                        {/* Custom Dots Pagination - Smaller and more subtle */}
                        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/5`} dir="ltr">
                            <span className="text-[9px] text-white/60 font-bold mr-1.5 tracking-tighter">
                                {selectedImage + 1} / {product.images.length}
                            </span>
                            {product.images.map((_, i) => (
                                <button
                                    key={`dot-${i}`}
                                    onClick={() => setSelectedImage(i)}
                                    className={`h-1 rounded-full transition-all duration-500 ${i === selectedImage ? 'w-3 bg-white/80' : 'w-1 bg-white/20 hover:bg-white/40'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Info Section */}
                    <div className={`p-6 md:p-10 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {/* Title and Rating */}
                        <div className="flex flex-col gap-2 mb-8">
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-black text-gray-900 font-cairo leading-tight">{product.name}</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold">(120 {isRTL ? 'تقييم' : 'Reviews'})</span>
                            </div>
                            <div className="flex items-baseline gap-2 text-[var(--color-brand-primary)] font-black text-2xl mt-1">
                                <span>{product.price.toLocaleString('en-US')}</span>
                                <span className="text-xs uppercase font-bold">{isRTL ? 'ج.م' : 'EGP'}</span>
                            </div>
                        </div>

                        {/* VTO Banner (Try with AI) */}
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

                        <div className="space-y-10">
                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <h3 className="text-base font-black text-gray-900 mb-4 font-cairo">{t.product?.colors || 'Colors'}</h3>
                                    <div className={`flex gap-4 overflow-x-auto pb-4 pt-2 px-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {parseColors(product.colors).map((c, i) => (
                                            <button
                                                key={`${c.color}-${i}`}
                                                onClick={() => {
                                                    setSelectedColor(c.color);
                                                    if (c.imageIndex !== undefined && c.imageIndex !== null) {
                                                        setSelectedImage(c.imageIndex);
                                                    }
                                                }}
                                                className={`
                                                    w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 p-1 border-2 
                                                    ${selectedColor === c.color
                                                        ? 'border-[var(--color-brand-primary)] scale-110 shadow-lg shadow-[var(--color-brand-primary)]/20'
                                                        : 'border-transparent bg-gray-50 hover:bg-gray-100'}
                                                `}
                                            >
                                                <div
                                                    style={{
                                                        backgroundColor: formatColor(c.color),
                                                        backgroundImage: c.image ? `url(${formatImageUrl(c.image)})` : 'none',
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center'
                                                    }}
                                                    className="w-full h-full rounded-full flex items-center justify-center shadow-inner overflow-hidden relative"
                                                >
                                                    {selectedColor === c.color && (
                                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                                                            <Check size={18} className="text-white drop-shadow-md" />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
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
                                    <div className="flex flex-wrap gap-3">
                                        {product.sizes.map((s, i) => (
                                            <button
                                                key={`${s}-${i}`}
                                                onClick={() => setSelectedSize(s)}
                                                className={`min-w-[4rem] h-12 px-4 rounded-[16px] border-2 font-black text-base transition-all ${selectedSize === s ? 'border-[var(--color-brand-primary)] bg-white text-[var(--color-brand-primary)] shadow-md scale-105' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-100'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stock Alert */}
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

                            {/* Description */}
                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-base font-black text-gray-900 mb-4 font-cairo">{t.product?.description || 'Details'}</h3>
                                <p className="text-gray-500 leading-relaxed font-bold font-cairo text-sm opacity-70">
                                    {product.description}
                                </p>
                            </div>

                            {/* Reviews Section Integration */}
                            <div className="pt-10 border-t border-gray-100">
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
                            {(product.price * quantity).toLocaleString()}
                            <span className="text-[10px] ml-1 opacity-50">{isRTL ? 'ج.م' : 'EGP'}</span>
                        </span>
                    </div>

                    <button
                        onClick={isInCart ? () => router.push('/cart') : handleAddToCart}
                        className={`
                            flex items-center gap-2 px-8 py-4 rounded-[1.75rem] font-black text-base transition-all active:scale-95 overflow-hidden relative
                            ${!selectedSize
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : isInCart
                                    ? 'bg-[var(--color-brand-primary)] text-white shadow-lg'
                                    : 'bg-white text-gray-950 shadow-lg hover:bg-gray-100'}
                        `}
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
                                    {isInCart
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
                productImages={product.images}
                productId={productId}
            />
        </div>
    );
}
