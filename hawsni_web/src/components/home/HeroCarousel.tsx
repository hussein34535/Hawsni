import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Banner } from '@/types';

interface HeroCarouselProps {
    banners: Banner[];
    isLoading?: boolean;
}

export default function HeroCarousel({ banners, isLoading }: HeroCarouselProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (banners.length === 0) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    if (isLoading || banners.length === 0) {
        return (
            <div className="relative w-full aspect-[21/9] min-h-[300px] md:min-h-[450px] overflow-hidden rounded-[2rem] bg-gray-200 animate-pulse" />
        );
    }


    const banner = banners[index];
    const bannerImage = banner.imageUrl || banner.image;
    const bannerHeading = banner.heading || banner.title || 'New Arrival';
    const bannerSubheading = banner.subheading || banner.description || 'Check out our latest collection';
    const bannerBtnText = banner.buttonText || 'Shop Now';

    return (
        <div className="relative w-full aspect-[21/9] min-h-[300px] md:min-h-[450px] overflow-hidden rounded-[2rem] shadow-2xl shadow-black/5 bg-gray-100">
            <AnimatePresence mode="wait">
                <motion.div
                    key={banner.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={bannerImage}
                        alt={bannerSubheading}
                        className="w-full h-full object-cover"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end items-start text-white">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-4 text-white/80"
                        >
                            {bannerHeading}
                        </motion.span>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-3xl md:text-6xl font-black mb-8 max-w-2xl leading-[1.1]"
                        >
                            {bannerSubheading}
                        </motion.h2>

                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-[var(--color-brand-primary)] text-white rounded-full font-bold flex items-center gap-3 shadow-xl shadow-emerald-950/20"
                        >
                            <span>{bannerBtnText}</span>
                            <ArrowRight size={20} />
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Indicators */}
            <div className="absolute bottom-8 left-8 md:left-16 flex gap-3">
                {banners.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 transition-all duration-500 rounded-full ${i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/40'}`}
                    />
                ))}
            </div>
        </div>
    );
}
