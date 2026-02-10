'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { productsApi, cartApi, Product } from '@/lib/api';
import {
    Heart, ShoppingBag, Star, Minus, Plus,
    ChevronLeft, Sparkles, Share2, Check
} from 'lucide-react';

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        async function fetchProduct() {
            setLoading(true);
            try {
                const res = await productsApi.getById(productId);
                if (res.data) {
                    setProduct(res.data);
                    initializeSelections(res.data);
                } else {
                    setProduct(null);
                }
            } catch (error) {
                console.error('Failed to fetch product:', error);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        }

        function initializeSelections(prod: Product) {
            if (prod.sizes?.[0]) setSelectedSize(prod.sizes[0]);
            if (prod.colors?.[0]) {
                const firstColor = prod.colors[0];
                setSelectedColor(typeof firstColor === 'string' ? firstColor : firstColor.color);
            }
        }

        fetchProduct();
    }, [productId]);

    const handleAddToCart = async () => {
        if (!product) return;

        try {
            await cartApi.add({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity,
                imageUrl: product.imageUrl,
                size: selectedSize || undefined,
                color: selectedColor || undefined,
            });
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 2000);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-gray-500 text-lg">Product not found</p>
                <Link href="/products" className="btn-primary">
                    Back to Products
                </Link>
            </div>
        );
    }

    const images = product.images?.length ? product.images : [product.imageUrl];
    const formattedPrice = Math.floor(product.price);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <Link
                href="/products"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-[var(--primary)] mb-6 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to Products
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Gallery */}
                <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                        <Image
                            src={images[selectedImage]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            priority
                        />

                        {/* Share Button */}
                        <button className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                            <Share2 className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all ${selectedImage === index
                                        ? 'ring-2 ring-[var(--primary)] ring-offset-2'
                                        : 'opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <Image src={img} alt="" fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    {/* Title & Rating */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                        <div className="flex items-center gap-3 mt-3">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-5 h-5 ${i < Math.floor(product.rating)
                                            ? 'text-[var(--primary)] fill-[var(--primary)]'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-gray-500">
                                ({product.reviewCount} reviews)
                            </span>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-[var(--primary)]">
                            {formattedPrice}
                        </span>
                        <span className="text-xl font-medium text-[var(--primary)]">
                            ر.س
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 leading-relaxed">
                        {product.description}
                    </p>

                    {/* Size Selector */}
                    {product.sizes && product.sizes.length > 0 && (
                        <div>
                            <h3 className="font-medium text-gray-900 mb-3">Size</h3>
                            <div className="flex flex-wrap gap-2">
                                {product.sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${selectedSize === size
                                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Color Selector */}
                    {product.colors && product.colors.length > 0 && (
                        <div>
                            <h3 className="font-medium text-gray-900 mb-3">Color</h3>
                            <div className="flex flex-wrap gap-3">
                                {product.colors.map((colorObj, index) => {
                                    const colorValue = typeof colorObj === 'string' ? colorObj : colorObj.color;
                                    const colorName = typeof colorObj === 'object' ? colorObj.name : colorValue;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedColor(colorValue)}
                                            className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === colorValue
                                                ? 'ring-2 ring-[var(--primary)] ring-offset-2 border-transparent'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            style={{ backgroundColor: colorValue }}
                                            title={colorName}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div>
                        <h3 className="font-medium text-gray-900 mb-3">Quantity</h3>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-[var(--primary)] transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-xl font-medium w-12 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-[var(--primary)] transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        {/* VTO Button */}
                        <button
                            onClick={() => {
                                const token = localStorage.getItem('hwasi_token');
                                if (!token) {
                                    const currentPath = window.location.pathname + window.location.search;
                                    router.push(`/login?redirect=${encodeURIComponent(`/vto?product=${product.id}`)}`);
                                    return;
                                }
                                router.push(`/vto?product=${product.id}`);
                            }}
                            className="flex-1 vto-gradient text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <Sparkles className="w-5 h-5" />
                            Try On AI
                        </button>

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={addedToCart}
                            className={`flex-1 py-4 rounded-full font-semibold flex items-center justify-center gap-2 transition-all ${addedToCart
                                ? 'bg-green-500 text-white'
                                : 'bg-black text-white hover:bg-gray-800'
                                }`}
                        >
                            {addedToCart ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    Added!
                                </>
                            ) : (
                                <>
                                    <ShoppingBag className="w-5 h-5" />
                                    Add to Cart
                                </>
                            )}
                        </button>

                        {/* Wishlist Button */}
                        <button className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                            <Heart className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
