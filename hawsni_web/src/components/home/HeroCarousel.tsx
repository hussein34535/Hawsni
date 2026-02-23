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
            <div className="relative w-full h-[160px] md:h-[280px] lg:h-[400px] overflow-hidden rounded-2xl bg-gray-200 animate-pulse" />
        );
    }


    const banner = banners[index];
    const bannerImage = banner.imageUrl || banner.image;
    const bannerHeading = banner.heading || banner.title || 'New Arrival';
    const bannerSubheading = banner.subheading || banner.description || 'Check out our latest collection';
    const bannerBtnText = banner.buttonText || 'Shop Now';

    return (
        <div className="relative w-full h-[160px] md:h-[280px] lg:h-[400px] overflow-hidden rounded-2xl bg-gray-100">
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

                    {/* Subtle bottom-weighted gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

                    {/* Content - Magazine style (bottom-left) */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-white">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-[10px] md:text-[14px] font-semibold tracking-[1.5px] md:tracking-[2px] uppercase mb-2 md:mb-3 text-white"
                        >
                            {bannerHeading}
                        </motion.span>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-[28px] md:text-[42px] font-black mb-5 md:mb-8 leading-[1.1] tracking-[-0.5px] max-w-2xl"
                        >
                            {bannerSubheading}
                        </motion.h2>

                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 md:px-8 md:py-4 bg-[var(--color-brand-primary)] text-white rounded-[30px] font-bold text-[14px] tracking-[0.5px] shadow-none"
                        >
                            {bannerBtnText}
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Page Indicator */}
            <div className="absolute bottom-6 left-8 flex gap-2">
                {banners.map((_, i) => (
                    <div
                        key={i}
                        className={`h-[6px] transition-all duration-300 rounded-full ${i === index ? 'w-6 bg-white' : 'w-[6px] bg-white/50'}`}
                    />
                ))}
            </div>
        </div>
    );
}
