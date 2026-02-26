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
    const images = product.images ?? [];
    const colors = product.colors ?? [];
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
    const imageUrl = safeImages.length > 0 ? formatImageUrl(safeImages[0]) : '';
    const [selectedImage, setSelectedImage] = useState(imageUrl);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);

    return (
        <div className="group flex flex-col cursor-pointer" onClick={() => window.location.href = `/product/${_id}`}>
            {/* Image Container */}
            <div className="relative aspect-square bg-[#F5F5F5] rounded-2xl overflow-hidden mb-2">
                <AnimatePresence mode="wait">
                    {selectedImage ? (
                        <motion.div
                            key={selectedImage}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="relative w-full h-full"
                        >
                            <Image
                                src={selectedImage || '/logo.png'}
                                alt={name || 'Product'}
                                fill
                                loading="lazy"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        </motion.div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            <span className="text-xs">No Image</span>
                        </div>
                    )}
                </AnimatePresence>

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
                                            setSelectedImage(formatImageUrl(c.image));
                                        } else if (c.imageIndex !== undefined && images[c.imageIndex]) {
                                            setSelectedImage(formatImageUrl(images[c.imageIndex]));
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
                <div className="flex items-end gap-1">
                    <span className="text-[15px] font-bold text-[var(--color-brand-primary)] leading-none">
                        {price.toLocaleString('en-US')}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--color-brand-primary)] leading-none mb-[2px]">
                        EGP
                    </span>
                </div>
            </div>
        </div>
    );
}
