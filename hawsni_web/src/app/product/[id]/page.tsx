'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
    ArrowLeft,
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
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { productService } from '@/services/productService';
import { useLanguage } from '@/context/LanguageContext';
import { Product } from '@/types';
import ReviewsSection from '@/components/product/ReviewsSection';
import SizeGuideModal from '@/components/product/SizeGuideModal';
import VirtualTryOnModal from '@/components/product/VirtualTryOnModal';

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

    const addItem = useCartStore((state) => state.addItem);

    // Stock simulation
    const [stockCount] = useState(Math.floor(Math.random() * 5) + 2);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await productService.getProductById(productId);
                if (data.success) {
                    setProduct(data.product);
                    if (data.product.colors && data.product.colors.length > 0) {
                        setSelectedColor(data.product.colors[0].color);
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
        if (x <= -50 && selectedImage < (product?.images?.length || 1) - 1) {
            setSelectedImage((v) => v + 1);
        } else if (x >= 50 && selectedImage > 0) {
            setSelectedImage((v) => v - 1);
        }
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
        <div className="w-full bg-[#FAFAFA] min-h-screen lg:mt-0 -mt-20">

            {/* Header / AppBar - Transparent Overlay (Matches Flutter exactly) */}
            <div className="fixed top-0 left-0 right-0 z-[60] p-4 flex justify-between items-center bg-gradient-to-b from-black/30 to-transparent pointer-events-none h-32">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20 pointer-events-auto active:scale-90 transition-transform"
                >
                    <ArrowLeft size={24} className="text-white" />
                </button>
                <div className="flex gap-3 pointer-events-auto">
                    <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-transform"
                    >
                        <Heart size={24} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'} />
                    </button>
                    <button
                        onClick={() => router.push('/cart')}
                        className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-transform relative"
                    >
                        <ShoppingBag size={24} className="text-white" />
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto pb-40">
                <div className="grid grid-cols-1 lg:grid-cols-2">

                    {/* Left: Swipable Image Gallery */}
                    <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden lg:rounded-b-[4rem] group">
                        <motion.div
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            style={{ x: dragX }}
                            onDragEnd={onDragEnd}
                            className="w-full h-full flex"
                        >
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={selectedImage}
                                    initial={{ opacity: 0, x: dragX.get() > 0 ? -100 : 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: dragX.get() > 0 ? 100 : -100 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    src={product.images[selectedImage]}
                                    alt={product.name}
                                    className="w-full h-full object-cover select-none pointer-events-none"
                                />
                            </AnimatePresence>
                        </motion.div>

                        {/* Custom Dots Pagination */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-xl rounded-full">
                            <span className="text-[10px] text-white font-black mr-2 tracking-widest">
                                {selectedImage + 1} / {product.images.length}
                            </span>
                            {product.images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === selectedImage ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Info Section */}
                    <div className="p-6 md:p-12">
                        {/* Title and Rating */}
                        <div className="flex flex-col gap-3 mb-10">
                            <div className="flex items-center justify-between">
                                <h1 className="text-4xl font-black text-gray-900 font-cairo leading-tight">{product.name}</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                </div>
                                <span className="text-xs text-gray-400 font-bold">(120 {isRTL ? 'تقييم' : 'Reviews'})</span>
                            </div>
                            <div className="flex items-baseline gap-2 text-[var(--color-brand-primary)] font-black text-3xl mt-2">
                                <span>{product.price.toLocaleString('en-US')}</span>
                                <span className="text-sm uppercase font-bold">{isRTL ? 'ج.م' : 'EGP'}</span>
                            </div>
                        </div>

                        {/* VTO Banner (Try with AI) */}
                        <motion.div
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsVTOOpen(true)}
                            className="mb-10 p-5 rounded-[32px] bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-100 flex items-center justify-between cursor-pointer group overflow-hidden relative"
                        >
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/10 border border-purple-50">
                                    <Flame size={28} className="text-purple-600 animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 font-cairo text-lg">{t.product?.vto_banner || (isRTL ? 'جرب القطعة دي دلوقتي' : 'Try this piece now')}</h4>
                                    <p className="text-[12px] text-gray-500 font-bold font-cairo">{t.product?.vto_desc || (isRTL ? 'شوف شكلها عليك بالذكاء الاصطناعي' : 'See how it looks on you with AI')}</p>
                                </div>
                            </div>
                            <ChevronRight size={24} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
                        </motion.div>

                        <div className="space-y-12">
                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 mb-5 font-cairo">{t.product?.colors || 'Colors'}</h3>
                                    <div className="flex gap-5">
                                        {product.colors.map((c) => (
                                            <button
                                                key={c.color}
                                                onClick={() => setSelectedColor(c.color)}
                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all p-1.5 border-2 ${selectedColor === c.color ? 'border-[var(--color-brand-primary)] scale-110 shadow-xl' : 'border-transparent bg-gray-50'}`}
                                            >
                                                <div
                                                    style={{ backgroundColor: c.color }}
                                                    className="w-full h-full rounded-xl flex items-center justify-center shadow-inner"
                                                >
                                                    {selectedColor === c.color && <Check size={20} className="text-white mix-blend-difference" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size Selection */}
                            {product.sizes && product.sizes.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-5">
                                        <h3 className="text-lg font-black text-gray-900 font-cairo">{t.product?.sizes || 'Sizes'}</h3>
                                        <button
                                            onClick={() => setIsSizeGuideOpen(true)}
                                            className="text-sm font-black text-[var(--color-brand-primary)] flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-brand-primary)]/5 hover:bg-[var(--color-brand-primary)]/10 transition-colors"
                                        >
                                            <Ruler size={16} />
                                            <span>{t.product?.size_guide || (isRTL ? 'دليل المقاسات' : 'Size Guide')}</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {product.sizes.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setSelectedSize(s)}
                                                className={`min-w-[4.5rem] h-16 px-5 rounded-[20px] border-2 font-black text-lg transition-all ${selectedSize === s ? 'border-[var(--color-brand-primary)] bg-white text-[var(--color-brand-primary)] shadow-xl scale-105' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stock Alert */}
                            <div className="p-5 rounded-[24px] bg-amber-50 border border-amber-100/50 flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <Flame size={20} className="text-amber-500 fill-amber-500" />
                                    </motion.div>
                                </div>
                                <span className="text-sm font-black text-amber-900 font-cairo">
                                    {t.product?.low_stock?.replace('{count}', stockCount.toString()) || (isRTL ? `الكمية محدودة! باق ${stockCount} قطع فقط` : `Limited Stock! Only ${stockCount} left`)}
                                </span>
                            </div>

                            {/* Quantity & Actions */}
                            <div className="flex flex-col gap-6">
                                <h3 className="text-lg font-black text-gray-900 font-cairo">{t.product?.quantity || 'Quantity'}</h3>
                                <div className="flex items-center bg-gray-50 rounded-[20px] p-1.5 w-fit border border-gray-100">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-gray-950 transition-colors bg-white rounded-xl shadow-sm"
                                    >
                                        <Minus size={20} strokeWidth={3} />
                                    </button>
                                    <span className="w-14 text-center font-black text-xl text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-gray-950 transition-colors bg-white rounded-xl shadow-sm"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="pt-10 border-t border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-5 font-cairo">{t.product?.description || 'Details'}</h3>
                                <p className="text-gray-500 leading-relaxed font-bold font-cairo text-base opacity-80">
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
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[94%] max-w-xl z-50">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gray-950 p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between border border-white/10"
                >
                    <div className="px-8">
                        <span className="text-2xl font-black text-white font-cairo">
                            {product.price.toLocaleString()}
                            <span className="text-xs ml-1 opacity-60">{isRTL ? 'ج.م' : 'EGP'}</span>
                        </span>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        className={`
                            flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-lg transition-all active:scale-95
                            ${!selectedSize
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-white text-gray-950 shadow-xl hover:bg-gray-100'}
                        `}
                    >
                        <ShoppingBag size={22} />
                        <span className="font-cairo">{t.product?.add_to_cart || 'Add to Cart'}</span>
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
                productImageUrl={product.images[0]}
                productId={productId}
            />
        </div>
    );
}
