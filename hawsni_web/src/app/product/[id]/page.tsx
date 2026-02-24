'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ShoppingBag,
    Heart,
    Share2,
    Star,
    Minus,
    Plus,
    Check,
    ChevronRight,
    Flame, // Changed Sparkles to Flame
    Info,
    Ruler
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { X, CheckCircle2, AlertCircle, Info as LucideInfo, Check as LucideCheck } from 'lucide-react';
import { productService } from '@/services/productService';
import { useLanguage } from '@/context/LanguageContext';
import { Product } from '@/types';

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

    // For the flying animation
    const [flyIcon, setFlyIcon] = useState<{ x: number, y: number } | null>(null);

    const handleAddToCart = (e: React.MouseEvent) => {
        if (!product) return;
        if (!selectedSize) {
            showToast(isRTL ? 'يرجى اختيار المقاس' : 'Please select a size', 'error');
            return;
        }

        // Save the click position for animation
        setFlyIcon({ x: e.clientX, y: e.clientY });

        // Dispatch to Zustand Cart Store
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

        // Show toast
        showToast(isRTL ? 'تمت الإضافة إلى السلة' : 'Added to cart successfully', 'success');

        // Reset fly icon after animation
        setTimeout(() => setFlyIcon(null), 1000);
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
        <div className="w-full bg-[#FAFAFA] min-h-screen">

            {/* Header / AppBar - Transparent to Overlay on Image */}
            <div className="fixed top-0 left-0 right-0 z-[60] p-4 flex justify-between items-center bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-white/30 pointer-events-auto"
                >
                    <ArrowLeft size={20} className="text-white" />
                </button>
                <div className="flex gap-2 pointer-events-auto">
                    <button className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-white/30">
                        <Share2 size={20} className="text-white" />
                    </button>
                    <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-white/30"
                    >
                        <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'} />
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto pb-40">
                <div className="grid grid-cols-1 lg:grid-cols-2">

                    {/* Left: Image Gallery (Sliver) */}
                    <div className="relative aspect-[4/5] bg-gray-200 overflow-hidden lg:rounded-b-[3rem]">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={selectedImage}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6 }}
                                src={product.images[selectedImage]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </AnimatePresence>

                        {/* Custom Dots Pagination */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full">
                            <span className="text-[10px] text-white font-bold mr-1">
                                {selectedImage + 1}/{product.images.length}
                            </span>
                            {product.images.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === selectedImage ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Right: Info Section */}
                    <div className="p-6 md:p-10">
                        {/* Title and Rating */}
                        <div className="flex flex-col gap-2 mb-8">
                            <div className="flex items-center justify-between">
                                <h1 className="text-3xl font-black text-gray-900">{product.name}</h1>
                            </div>
                            <div className="flex items-center gap-1 text-[var(--color-brand-primary)] font-bold text-xl">
                                <span>{product.price.toLocaleString('en-US')}</span>
                                <span className="text-sm uppercase">{isRTL ? 'ج.م' : 'EGP'}</span>
                            </div>
                        </div>

                        {/* VTO Banner (Try with AI) */}
                        <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="mb-8 p-4 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-between cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                    <Flame size={24} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{t.product?.vto_banner || 'Try this piece now'}</h4>
                                    <p className="text-[11px] text-gray-500">{t.product?.vto_desc || 'See how it looks on you with AI'}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-purple-300 group-hover:translate-x-1 transition-transform" />
                        </motion.div>

                        <div className="space-y-10">
                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-4">{t.product?.colors || 'Colors'}</h3>
                                    <div className="flex gap-4">
                                        {product.colors.map((c) => (
                                            <button
                                                key={c.color}
                                                onClick={() => setSelectedColor(c.color)}
                                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all p-1 border-2 ${selectedColor === c.color ? 'border-[var(--color-brand-primary)] scale-110 shadow-lg' : 'border-transparent bg-gray-100'}`}
                                            >
                                                <div
                                                    style={{ backgroundColor: c.color }}
                                                    className="w-full h-full rounded-full flex items-center justify-center"
                                                >
                                                    {selectedColor === c.color && <Check size={18} className="text-white mix-blend-difference" />}
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
                                        <h3 className="text-base font-bold text-gray-900">{t.product?.sizes || 'Sizes'}</h3>
                                        <button className="text-sm font-bold text-[var(--color-brand-primary)] flex items-center gap-1.5 opacity-80 decoration-2 underline-offset-4 hover:underline">
                                            <Ruler size={16} />
                                            <span>{t.product?.size_guide || 'Size Guide'}</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {product.sizes.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setSelectedSize(s)}
                                                className={`min-w-[4rem] h-14 px-4 rounded-2xl border-2 font-black transition-all ${selectedSize === s ? 'border-[var(--color-brand-primary)] bg-white text-[var(--color-brand-primary)] shadow-md' : 'border-gray-100 bg-white text-gray-400'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stock Alert */}
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                                <div className="text-amber-500">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <Flame size={20} className="fill-amber-500" /> {/* Changed Sparkles to Flame */}
                                    </motion.div>
                                </div>
                                <span className="text-sm font-bold text-amber-900">
                                    {isRTL ? `الكمية محدودة! باق ${stockCount} قطع فقط` : `Limited Stock! Only ${stockCount} left`}
                                </span>
                            </div>

                            {/* Quantity */}
                            <div className="flex items-center gap-6">
                                <h3 className="text-base font-bold text-gray-900">{t.product?.quantity || 'Quantity'}</h3>
                                <div className="flex items-center bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        <Minus size={20} strokeWidth={3} />
                                    </button>
                                    <span className="w-12 text-center font-black text-lg text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-base font-bold text-gray-900 mb-4">{t.product?.description || 'Details'}</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">
                                    {product.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* FLOATING CAPSULE FOOTER (Black Bar) */}
            {/* FLOATING CAPSULE FOOTER (Black Bar) - REFINED */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-50">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gray-950/95 backdrop-blur-xl p-2.5 rounded-[2rem] shadow-2xl flex items-center justify-between border border-white/5"
                >
                    {/* Price Side */}
                    <div className="px-6">
                        <span className="text-xl font-black text-white">{product.price.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                    </div>

                    {/* Add to Cart Button (White Capsule) */}
                    <button
                        onClick={handleAddToCart}
                        disabled={!selectedSize}
                        className={`
                            flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black transition-all active:scale-95
                            ${!selectedSize
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-white text-gray-950 shadow-xl shadow-black/20 hover:bg-gray-100'}
                        `}
                    >
                        <ShoppingBag size={20} />
                        <span>{t.product?.add_to_cart || 'Add to Cart'}</span>
                    </button>
                </motion.div>
            </div>

            {/* Parabolic Fly to Cart Animation Overlay */}
            <AnimatePresence>
                {flyIcon && (
                    <motion.div
                        initial={{
                            left: flyIcon.x - 20,
                            top: flyIcon.y - 20,
                            scale: 1,
                            opacity: 1
                        }}
                        animate={{
                            left: typeof window !== 'undefined' ? window.innerWidth - 80 : 0,
                            top: [flyIcon.y - 20, flyIcon.y - 200, 40], // Parabolic arc
                            scale: 0.2,
                            opacity: [1, 1, 0]
                        }}
                        transition={{ duration: 0.8, times: [0, 0.4, 1], ease: "easeInOut" }}
                        className="fixed z-[100] w-12 h-12 bg-[var(--color-brand-primary)] rounded-full border-4 border-white shadow-2xl flex items-center justify-center pointer-events-none"
                    >
                        <ShoppingBag size={20} className="text-white" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
