'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import Image from 'next/image';

import { Product } from '@/types';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const _id = product._id || (product as any).id;
    const { name, price } = product;
    const discount = product.discount || 0;
    const finalPrice = discount > 0 ? price - (price * discount / 100) : price;
    const images = product.images ?? [];
    const colors = product.colors ?? [];
    const isVideoUrl = (url: string) => {
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return /\.(mp4|webm|mov)(\?.*)?$/i.test(lowerUrl) || lowerUrl.includes('/video/upload/');
    };

    const formatImageUrl = (url: string) => {
        if (!url) return '';
        let fullUrl = url;
        if (!url.startsWith('http')) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api';
            const baseUrl = apiUrl.replace(/\/api$/, '');
            fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
        }

        // If it's a Cloudinary video URL, we can get a thumbnail by changing the extension to .jpg
        if (isVideoUrl(fullUrl) && fullUrl.includes('res.cloudinary.com')) {
            if (/\.(mp4|webm|mov)(?=\?|$)/i.test(fullUrl)) {
                return fullUrl.replace(/\.(mp4|webm|mov)(?=\?|$)/i, '.jpg');
            } else {
                return `${fullUrl}.jpg`;
            }
        }
        return fullUrl;
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
                    const cleaned = c.trim();
                    if (cleaned.startsWith('{')) return JSON.parse(cleaned);
                    return { color: cleaned };
                } catch (e) {
                    return { color: c };
                }
            }
            return c;
        });
    };

    const safeImages = Array.isArray(images) ? images : [];
    // The starting visual is either the featured image or the first image in the array
    const baseImageUrl = product.image ? product.image : (safeImages.length > 0 ? safeImages[0] : '');

    // We store the RAW url in state so we know if it's a video or not
    const [rawSelectedMedia, setRawSelectedMedia] = useState(baseImageUrl);

    // The formatImageUrl handles converting Cloudinary videos to .jpg thumbnails
    const displayThumbnailUrl = formatImageUrl(rawSelectedMedia);
    const isCurrentlyVideo = isVideoUrl(rawSelectedMedia);

    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);

    return (
        <div className="group flex flex-col cursor-pointer" onClick={() => window.location.href = `/product/${_id}`}>
            {/* Image Container */}
            <div className="relative aspect-square bg-[#F5F5F5] rounded-2xl overflow-hidden mb-2">
                <AnimatePresence mode="wait">
                    {displayThumbnailUrl ? (
                        <motion.div
                            key={displayThumbnailUrl}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="relative w-full h-full"
                        >
                            <Image
                                src={displayThumbnailUrl || '/logo.png'}
                                alt={name || 'Product'}
                                fill
                                loading="lazy"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Video Play Icon Overlay */}
                            {isCurrentlyVideo && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white ml-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            <span className="text-xs">No Image</span>
                        </div>
                    )}
                </AnimatePresence>
                {/* Sold Out Badge OVERLAY */}
                {(product.stock !== undefined && product.stock <= 0) || (product.countInStock !== undefined && product.countInStock <= 0) ? (
                    <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                        نفدت الكمية
                    </div>
                ) : null}

                {/* Discount Badge */}
                {discount > 0 && (
                    <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[11px] font-black px-2 py-1 rounded-lg shadow-sm font-cairo" dir="ltr">
                        -{discount}%
                    </div>
                )}

                {/* Favorite Button removed from Product Card as requested */}

            </div>

            {/* Details Section */}
            <div className="flex flex-col px-2 pb-2">
                {/* 1. Product Name */}
                <h4 className="text-[14px] font-bold text-[#1A1A1A] truncate leading-[1.2] mb-1">
                    {name}
                </h4>

                {/* 2. Interactive Colors */}
                {colors.length > 0 && (
                    <div className="flex mb-1">
                        {parseColors(colors).slice(0, 5).map((c, i) => {
                            const isSelected = selectedColor === c.color;
                            return (
                                <button
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedColor(c.color);
                                        if (c.image) {
                                            setRawSelectedMedia(c.image);
                                        } else if (c.imageIndex !== undefined && images[c.imageIndex]) {
                                            setRawSelectedMedia(images[c.imageIndex]);
                                        }
                                    }}
                                    style={{ backgroundColor: formatColor(c.color) }}
                                    className={`w-5 h-5 rounded-full mr-1.5 transition-all border ${isSelected
                                        ? 'border-[var(--color-brand-primary)] border-[1.5px] shadow-[0_0_4px_rgba(27,77,62,0.3)]'
                                        : 'border-gray-300 border-[0.5px]'
                                        }`}
                                />
                            );
                        })}
                    </div>
                )}

                {/* 3. Price */}
                <div className="flex flex-col gap-0.5">
                    {discount > 0 && (
                        <div className="text-[11px] text-gray-400 line-through font-semibold leading-none">
                            {price.toLocaleString('en-US')} EGP
                        </div>
                    )}
                    <div className="flex items-end gap-1">
                        <span className={`text-[15px] font-bold leading-none ${discount > 0 ? 'text-red-500' : 'text-[var(--color-brand-primary)]'}`}>
                            {finalPrice.toLocaleString('en-US')}
                        </span>
                        <span className={`text-[10px] font-semibold leading-none mb-[2px] ${discount > 0 ? 'text-red-500' : 'text-[var(--color-brand-primary)]'}`}>
                            EGP
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
