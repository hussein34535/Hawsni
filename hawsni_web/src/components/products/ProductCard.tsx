'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star } from 'lucide-react';

interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    colors?: { color: string; image?: string }[];
    rating?: number;
}

export default function ProductCard({ id, name, price, imageUrl, colors = [], rating = 4.8 }: ProductCardProps) {
    const [selectedImage, setSelectedImage] = useState(imageUrl);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);

    return (
        <div className="group flex flex-col gap-3">
            {/* Image Container */}
            <div className="relative aspect-square bg-[#F5F5F5] rounded-3xl overflow-hidden cursor-pointer">
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

                {/* Favorite Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
                    className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-black/5 hover:bg-white transition-colors"
                >
                    <Heart
                        size={18}
                        className={`transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                    />
                </button>

                {/* Badges Placeholder */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {rating > 4.5 && (
                        <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1 shadow-sm">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span className="text-[10px] font-bold text-gray-800">{rating}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="flex flex-col gap-1.5 px-1 pb-4">
                <h4 className="text-[15px] font-bold text-gray-900 truncate tracking-tight">{name}</h4>

                {/* Colors Row */}
                {colors.length > 0 && (
                    <div className="flex gap-2.5 my-1">
                        {colors.map((c, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setSelectedColor(c.color);
                                    if (c.image) setSelectedImage(c.image);
                                }}
                                style={{ backgroundColor: c.color }}
                                className={`w-4 h-4 rounded-full border-2 transition-all ${selectedColor === c.color ? 'border-[var(--color-brand-primary)] scale-125' : 'border-white shadow-sm'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-[var(--color-brand-primary)]">
                        {price.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-[var(--color-brand-primary)] opacity-60">EGP</span>
                </div>
            </div>
        </div>
    );
}
