'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

const ReviewsSection = dynamic(() => import('@/components/product/ReviewsSection'), { ssr: false });
const SizeGuideModal = dynamic(() => import('@/components/product/SizeGuideModal'), { ssr: false });
const VirtualTryOnModal = dynamic(() => import('@/components/product/VirtualTryOnModal'), { ssr: false });
const ImageLightbox = dynamic(() => import('@/components/common/ImageLightbox'), { ssr: false });
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
    const { isRTL } = useLanguage();
    const { showToast } = useToastStore();

    const [product, setProduct] = useState<Product>(initialProduct);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);

    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        if (productId) {
            productService.getRelatedProducts(productId).then(res => {
                if (res.success) setRelatedProducts(res.products);
            });
        }
    }, [productId]);

    const handleAddToCart = () => {
        if (!selectedSize) {
            showToast(isRTL ? 'يرجى اختيار المقاس' : 'Please select a size', 'error');
            return;
        }
        addItem({
            id: `${product.id}_${selectedSize || 'default'}`,
            productId: product.id,
            name: product.name,
            price: product.discount ? product.price - (product.price * product.discount / 100) : product.price,
            imageUrl: formatImageUrl(product.images?.[0] || ''),
            quantity: quantity,
            size: selectedSize || ''
        });
        showToast(isRTL ? 'تمت الإضافة للسلة' : 'Added to cart', 'success');
    };

    return (
        <div className="p-6 font-cairo" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Image Gallery */}
                    <div className="aspect-square relative rounded-3xl overflow-hidden bg-gray-100">
                        <Image 
                            src={formatImageUrl(product.images[selectedImage])} 
                            alt={product.name} 
                            fill 
                            className="object-cover"
                        />
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col gap-4">
                        <h1 className="text-3xl font-black text-gray-900">{product.name}</h1>
                        <div className="text-2xl font-bold text-[#0E4435]">
                            {product.price} ج.م
                        </div>
                        <p className="text-gray-500">{product.description}</p>
                        
                        <div className="mt-6">
                            <h3 className="font-bold mb-3">المقاس:</h3>
                            <div className="flex gap-2">
                                {product.sizes?.map(size => (
                                    <button 
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-4 py-2 rounded-xl border ${selectedSize === size ? 'bg-[#0E4435] text-white' : 'bg-white'}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleAddToCart}
                            className="mt-8 w-full py-4 bg-[#0E4435] text-white rounded-2xl font-bold text-lg"
                        >
                            إضافة إلى السلة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
