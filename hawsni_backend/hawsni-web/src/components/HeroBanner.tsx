'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface BannerSlide {
    id: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    imageUrl: string;
    gradient: string;
}

const bannerSlides: BannerSlide[] = [
    {
        id: '1',
        title: 'New Collection 2025',
        subtitle: 'Discover the latest trends in fashion',
        buttonText: 'Shop Now',
        buttonLink: '/products',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
        gradient: 'from-emerald-900/90 via-emerald-800/70 to-transparent',
    },
    {
        id: '2',
        title: 'Virtual Try-On',
        subtitle: 'Try clothes on yourself with AI magic',
        buttonText: 'Try Now',
        buttonLink: '/vto',
        imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80',
        gradient: 'from-purple-900/90 via-purple-800/70 to-transparent',
    },
    {
        id: '3',
        title: 'Summer Sale',
        subtitle: 'Up to 50% off on selected items',
        buttonText: 'View Deals',
        buttonLink: '/products',
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
        gradient: 'from-rose-900/90 via-rose-800/70 to-transparent',
    },
];

export default function HeroBanner() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, []);

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 5000);
    };

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide]);

    return (
        <section className="relative h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden">
            {/* Slides */}
            <div className="relative w-full h-full">
                {bannerSlides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentSlide
                            ? 'opacity-100 scale-100 z-10'
                            : 'opacity-0 scale-105 z-0'
                            }`}
                    >
                        {/* Background Image */}
                        <Image
                            src={slide.imageUrl}
                            alt={slide.title}
                            fill
                            className="object-cover"
                            priority={index === 0}
                            loading="eager"
                        />

                        {/* Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />

                        {/* Dark overlay for text readability */}
                        <div className="absolute inset-0 bg-black/30" />

                        {/* Content */}
                        <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                            <div
                                className={`max-w-xl transition-all duration-700 delay-200 ${index === currentSlide
                                    ? 'translate-x-0 opacity-100'
                                    : '-translate-x-10 opacity-0'
                                    }`}
                            >
                                {/* Badge */}
                                {slide.id === '2' && (
                                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 mb-6">
                                        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                                        <span className="text-white text-sm font-medium">AI-Powered</span>
                                    </div>
                                )}

                                {/* Title */}
                                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                                    {slide.title}
                                </h2>

                                {/* Subtitle */}
                                <p className="mt-4 text-lg md:text-xl text-white/80 max-w-md">
                                    {slide.subtitle}
                                </p>

                                {/* CTA Button */}
                                <Link
                                    href={slide.buttonLink}
                                    className={`mt-8 inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl ${slide.id === '2'
                                        ? 'btn-vto'
                                        : 'btn-primary'
                                        }`}
                                >
                                    {slide.id === '2' && <Sparkles className="w-5 h-5" />}
                                    {slide.buttonText}
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 glass rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-110"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 glass rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-110"
                aria-label="Next slide"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
                {bannerSlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                            ? 'w-8 bg-white'
                            : 'w-2 bg-white/50 hover:bg-white/70'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/20">
                <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${((currentSlide + 1) / bannerSlides.length) * 100}%` }}
                />
            </div>
        </section>
    );
}
