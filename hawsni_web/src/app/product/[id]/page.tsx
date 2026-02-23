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
    Sparkles,
    Info
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { productService } from '@/services/productService';
import { Product } from '@/types';

export default function ProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const addItem = useCartStore((state) => state.addItem);

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
            alert('Please select a size');
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

        // Reset fly icon after animation
        setTimeout(() => setFlyIcon(null), 1000);
    };

    if (isLoading) {
        return (
            <div className="w-full bg-white">
                <div className="max-w-7xl mx-auto pt-32 px-4 flex justify-center items-center h-[60vh]">
                    <div className="h-12 w-12 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="w-full bg-white">
                <div className="max-w-7xl mx-auto pt-32 px-4 text-center">
                    <h2 className="text-2xl font-bold">Product not found</h2>
                    <button onClick={() => router.back()} className="mt-4 text-[var(--color-brand-primary)] font-bold">Go Back</button>
                </div>
            </div>
        );
    }


    return (
        <div className="w-full bg-white">

            {/* Mobile Back Button & Actions */}
            <div className="fixed top-0 left-0 right-0 z-[60] p-4 flex justify-between items-center md:hidden">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg"
                >
                    <ArrowLeft size={20} className="text-gray-900" />
                </button>
                <div className="flex gap-2">
                    <button className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                        <Share2 size={20} className="text-gray-900" />
                    </button>
                    <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg"
                    >
                        <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-900'} />
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto pt-20 md:pt-32 px-4 sm:px-6 lg:px-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left: Image Gallery (Sliver-like effect) */}
                    <div className="lg:col-span-7 flex flex-col md:flex-row-reverse gap-4">
                        {/* Main Image */}
                        <div className="flex-1 aspect-[4/5] bg-gray-50 rounded-[2.5rem] overflow-hidden relative group">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={selectedImage}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    src={product.images[selectedImage]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </AnimatePresence>

                            {/* Pagination Indicator Mobile */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:hidden">
                                {product.images.map((_, i) => (
                                    <div key={i} className={`h-1.5 transition-all rounded-full ${i === selectedImage ? 'w-6 bg-[var(--color-brand-primary)]' : 'w-1.5 bg-gray-300'}`} />
                                ))}
                            </div>
                        </div>

                        {/* Thumbnails (Vertical on desktop, scrollable on mobile) */}
                        <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto no-scrollbar scroll-smooth">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    className={`relative w-20 md:w-24 aspect-[4/5] rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === i ? 'border-[var(--color-brand-primary)]' : 'border-transparent'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Info Section */}
                    <div className="lg:col-span-5 flex flex-col">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-3 py-1 bg-emerald-50 text-[var(--color-brand-primary)] text-[10px] font-bold uppercase tracking-widest rounded-full">New Arrival</span>
                                <div className="flex items-center gap-1">
                                    <Star size={14} className="fill-amber-400 text-amber-400" />
                                    <span className="text-sm font-bold">{product.rating || 4.5}</span>
                                    <span className="text-gray-400 text-sm font-medium">({product.reviews || 0} Reviews)</span>
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{product.name}</h1>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl md:text-3xl font-black text-[var(--color-brand-primary)]">{product.price.toLocaleString()}</span>
                                <span className="text-sm font-bold text-gray-400">EGP</span>
                            </div>
                        </div>

                        {/* Selection Section */}
                        <div className="space-y-8">
                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Colors</h3>
                                    <div className="flex gap-4">
                                        {product.colors.map((c) => (
                                            <button
                                                key={c.color}
                                                onClick={() => setSelectedColor(c.color)}
                                                className="flex flex-col items-center gap-2 group"
                                            >
                                                <div
                                                    style={{ backgroundColor: c.color }}
                                                    className={`w-10 h-10 rounded-full border-4 transition-all flex items-center justify-center ${selectedColor === c.color ? 'border-[var(--color-brand-primary)] scale-110 shadow-lg' : 'border-white shadow-sm'}`}
                                                >
                                                    {selectedColor === c.color && <Check size={16} className="text-white mix-blend-difference" />}
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
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Size</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {product.sizes.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setSelectedSize(s)}
                                                className={`w-14 h-14 rounded-2xl border-2 font-bold transition-all flex items-center justify-center ${selectedSize === s ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white shadow-lg shadow-emerald-950/20' : 'border-gray-100 bg-gray-50 text-gray-900 hover:border-gray-200'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity & Actions */}
                            <div className="pt-4 flex flex-col gap-6">
                                <div className="flex items-center gap-6">
                                    <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">Quantity</span>
                                    <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 h-16">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleAddToCart}
                                        className="col-span-1 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-black/10 hover:bg-black transition-colors"
                                    >
                                        <ShoppingBag size={20} />
                                        <span>Add to Cart</span>
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="col-span-1 bg-[var(--color-brand-primary)] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/20 hover:bg-[var(--color-brand-secondary)] transition-colors"
                                    >
                                        <span>Buy Now</span>
                                    </motion.button>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Description</h3>
                                <p className="text-gray-500 leading-relaxed">{product.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Fly to Cart Animation Overlay */}
            <AnimatePresence>
                {flyIcon && (
                    <motion.div
                        initial={{ left: flyIcon.x - 20, top: flyIcon.y - 20, scale: 1 }}
                        animate={{
                            left: typeof window !== 'undefined' ? window.innerWidth - 80 : 0,
                            top: 40,
                            scale: 0.2,
                            opacity: 0
                        }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="fixed z-[100] w-12 h-12 bg-[var(--color-brand-primary)] rounded-full border-4 border-white shadow-2xl flex items-center justify-center pointer-events-none"
                    >
                        <ShoppingBag size={20} className="text-white" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
