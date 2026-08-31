'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Banner } from '@/types';

interface HeroCarouselProps {
    banners: Banner[];
    isLoading?: boolean;
}

import { useLanguage } from '@/context/LanguageContext';
import dynamic from 'next/dynamic';

const ImageLightbox = dynamic(() => import('@/components/common/ImageLightbox'), { ssr: false });

export default function HeroCarousel({ banners, isLoading }: HeroCarouselProps) {
    const { language, isRTL } = useLanguage();
    const [index, setIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
    const bannerImage = banner.image_url || banner.imageUrl || banner.image || '/logo.png';
    const focalX = (banner as any).focal_x ?? 50;
    const focalY = (banner as any).focal_y ?? 50;

    // Translation logic with fallbacks
    const h = language === 'ar' ? (banner.heading_ar || banner.heading_text || 'وصل حديثاً') : (banner.heading_text || banner.heading || banner.title || 'New Arrival');
    const s = language === 'ar' ? (banner.subheading_ar || banner.description_ar || banner.subheading_text || 'تصفح أحدث تشكيلاتنا') : (banner.subheading_text || banner.subheading || banner.description || 'Check out our latest collection');
    const b = language === 'ar' ? (banner.buttonText_ar || banner.button_text || 'تسوق الآن') : (banner.button_text || banner.buttonText || 'Shop Now');

    return (
        <div className="relative w-full h-[160px] md:h-[280px] lg:h-[400px] overflow-hidden rounded-2xl bg-gray-100">
            <AnimatePresence mode="wait">
                <motion.div
                    key={banner._id || banner.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 cursor-zoom-in"
                    onClick={() => setIsLightboxOpen(true)}
                >
                    <Image
                        src={bannerImage}
                        alt={s}
                        fill
                        priority={index === 0}
                        quality={85}
                        className="object-cover"
                        style={{ objectPosition: `${focalX}% ${focalY}%` }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                    />

                    {/* The text content overlay has been removed per user request */}
                </motion.div>
            </AnimatePresence>

            {/* Full screen lightbox for banners */}
            <ImageLightbox
                images={banners.map(b => b.image_url || b.imageUrl || b.image || '/logo.png')}
                currentIndex={index}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                onNavigate={(idx) => setIndex(idx)}
            />

            {/* Page Indicator */}
            {banners.length > 1 && (
                <div className="absolute bottom-6 left-8 flex gap-2">
                    {banners.map((_, i) => (
                        <div
                            key={i}
                            className={`h-[6px] transition-all duration-300 rounded-full ${i === index ? 'w-6 bg-white' : 'w-[6px] bg-white/50'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
