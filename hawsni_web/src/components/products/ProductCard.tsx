'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star } from 'lucide-react';

import { Product } from '@/types';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const _id = product._id || (product as any).id;
    const { name, price, images, colors = [] } = product;
    const imageUrl = images[0];
    const [selectedImage, setSelectedImage] = useState(imageUrl);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);

    return (
        <div className="group flex flex-col cursor-pointer" onClick={() => window.location.href = `/product/${_id}`}>
            {/* Image Container */}
            <div className="relative aspect-square bg-[#F5F5F5] rounded-2xl overflow-hidden mb-2">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={selectedImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        src={selectedImage}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                </AnimatePresence>

                {/* Favorite Button Overlay (Like Flutter) */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
                    className="absolute top-2 right-2 w-[28px] h-[28px] bg-white/90 rounded-full flex items-center justify-center shadow-[0_0_4px_rgba(0,0,0,0.1)] hover:scale-110 transition-transform"
                >
                    <Heart
                        size={16}
                        className={isFavorite ? 'fill-[var(--color-brand-primary)] text-[var(--color-brand-primary)]' : 'text-gray-400'}
                    />
                </button>

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
                        {colors.slice(0, 5).map((c, i) => {
                            const isSelected = selectedColor === c.color;
                            return (
                                <button
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedColor(c.color);
                                        if (c.image) setSelectedImage(c.image);
                                    }}
                                    style={{ backgroundColor: c.color }}
                                    className={`w-[14px] h-[14px] rounded-full mr-[6px] transition-all border ${isSelected
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
                        {price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--color-brand-primary)] leading-none mb-[2px]">
                        EGP
                    </span>
                </div>
            </div>
        </div>
    );
}
