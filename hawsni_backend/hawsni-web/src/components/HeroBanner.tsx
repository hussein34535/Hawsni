'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, Play, Pause, Maximize, Loader2 } from 'lucide-react';
import { bannersApi, Banner } from '@/lib/api';

export default function HeroBanner() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [loading, setLoading] = useState(true);
    const [playingStates, setPlayingStates] = useState<{ [key: string]: boolean }>({});
    const [videoLoadingStates, setVideoLoadingStates] = useState<{ [key: string]: boolean }>({});
    const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

    // Utility to optimize Cloudinary URLs on the fly
    const optimizeVideoUrl = (url: string) => {
        if (!url || !url.includes('cloudinary.com')) return url;
        // Inject optimization parameters: q_auto:eco (economy quality), f_auto (best format), br_1000k (limit bitrate)
        // This significantly reduces file size for faster mobile loading
        if (url.includes('/video/upload/')) {
            return url.replace('/video/upload/', '/video/upload/q_auto:eco,f_auto,br_1000k,vc_h264/');
        }
        return url;
    };

    const fetchBanners = async () => {
        try {
            const res = await bannersApi.getAll();
            if (res.data) {
                setBanners(res.data.filter(b => b.is_active));
            }
        } catch (error) {
            console.error('Failed to fetch banners:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const nextSlide = useCallback(() => {
        if (banners.length === 0) return;
        setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, [banners.length]);

    const prevSlide = () => {
        if (banners.length === 0) return;
        setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 15000);
    };

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return;
        const interval = setInterval(nextSlide, 8000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide, banners.length]);

    // Handle video play/pause strictly
    useEffect(() => {
        banners.forEach((banner, index) => {
            const video = videoRefs.current[banner.id];
            if (video) {
                if (index === currentSlide) {
                    // Start active video muted for autoplay friendliness
                    video.muted = true;
                    // Pre-emptively set loading state if not ready
                    if (video.readyState < 3) {
                        setVideoLoadingStates(prev => ({ ...prev, [banner.id]: true }));
                    }
                    video.play().catch(() => {
                        // Autoplay might be blocked until user interaction
                        setVideoLoadingStates(prev => ({ ...prev, [banner.id]: false }));
                    });
                } else {
                    // Forcefully pause and mute non-active videos to stop audio immediately
                    video.pause();
                    video.muted = true;
                    video.currentTime = 0;
                    setPlayingStates(prev => ({ ...prev, [banner.id]: false }));
                    // Clear loading state when moving away
                    setVideoLoadingStates(prev => ({ ...prev, [banner.id]: false }));
                }
            }
        });
    }, [currentSlide, banners]);

    const togglePlay = (e: React.MouseEvent, bannerId: string) => {
        e.stopPropagation();
        const video = videoRefs.current[bannerId];
        if (video) {
            if (video.paused) {
                video.muted = false; // Unmute when user clicks play manually
                setVideoLoadingStates(prev => ({ ...prev, [bannerId]: true }));
                video.play().then(() => {
                    setPlayingStates(prev => ({ ...prev, [bannerId]: true }));
                    setIsAutoPlaying(false);
                }).catch(() => {
                    setVideoLoadingStates(prev => ({ ...prev, [bannerId]: false }));
                });
            } else {
                video.pause();
                setPlayingStates(prev => ({ ...prev, [bannerId]: false }));
            }
        }
    };

    const handleFullscreen = (e: React.MouseEvent, bannerId: string) => {
        e.stopPropagation();
        const video = videoRefs.current[bannerId];
        if (video) {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if ((video as any).webkitRequestFullscreen) {
                (video as any).webkitRequestFullscreen();
            } else if ((video as any).webkitEnterFullscreen) {
                (video as any).webkitEnterFullscreen();
            } else if ((video as any).msRequestFullscreen) {
                (video as any).msRequestFullscreen();
            }
        }
    };

    if (loading || banners.length === 0) {
        return <div className="h-[70vh] bg-gray-100 animate-pulse rounded-2xl mx-4 my-2" />;
    }

    return (
        <section className="relative h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden sm:mx-4 sm:my-2 sm:rounded-3xl shadow-xl group/banner">
            {/* Slides */}
            <div className="relative w-full h-full bg-neutral-900">
                {banners.map((banner, index) => {
                    const isVideo = banner.image_url?.match(/\.(mp4|webm|mov|ogg)($|\?)/i) || banner.image_url?.includes('video/upload');
                    const isActive = index === currentSlide;
                    const isVideoLoading = videoLoadingStates[banner.id];
                    
                    return (
                        <div
                            key={banner.id}
                            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isActive
                                ? 'opacity-100 scale-100 z-10'
                                : 'opacity-0 scale-110 z-0'
                                }`}
                        >
                            {/* Background Media */}
                            {isVideo ? (
                                <div className="relative w-full h-full">
                                    <video
                                        ref={(el) => { videoRefs.current[banner.id] = el; }}
                                        src={optimizeVideoUrl(banner.image_url)}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        playsInline
                                        preload="auto"
                                        crossOrigin="anonymous"
                                        onLoadStart={() => setVideoLoadingStates(prev => ({ ...prev, [banner.id]: true }))}
                                        onWaiting={() => setVideoLoadingStates(prev => ({ ...prev, [banner.id]: true }))}
                                        onSeeking={() => setVideoLoadingStates(prev => ({ ...prev, [banner.id]: true }))}
                                        onStalled={() => setVideoLoadingStates(prev => ({ ...prev, [banner.id]: true }))}
                                        onPlaying={() => setVideoLoadingStates(prev => ({ ...prev, [banner.id]: false }))}
                                        onCanPlay={() => setVideoLoadingStates(prev => ({ ...prev, [banner.id]: false }))}
                                        onCanPlayThrough={() => setVideoLoadingStates(prev => ({ ...prev, [banner.id]: false }))}
                                        onPlay={() => setPlayingStates(prev => ({ ...prev, [banner.id]: true }))}
                                        onPause={() => setPlayingStates(prev => ({ ...prev, [banner.id]: false }))}
                                        onError={() => setVideoLoadingStates(prev => ({ ...prev, [banner.id]: false }))}
                                        poster={banner.image_url.replace(/\/video\/upload\//, '/video/upload/so_0/')}
                                    />
                                    
                                    {/* Video Loading Indicator */}
                                    {isActive && isVideoLoading && (
                                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative">
                                                    <Loader2 className="w-16 h-16 text-white animate-spin opacity-20" />
                                                    <Loader2 className="w-16 h-16 text-white animate-spin absolute inset-0 [animation-duration:1.5s]" style={{ clipPath: 'inset(0 0 50% 0)' }} />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-white text-base font-bold tracking-[0.2em] uppercase">Loading</span>
                                                    <span className="text-white/60 text-[10px] font-medium tracking-[0.3em] uppercase mt-1">Experience Ready Soon</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Video Controls Overlay - Only when active */}
                                    {isActive && (
                                        <div className="absolute right-6 bottom-32 z-40 flex flex-col gap-3">
                                            <button 
                                                onClick={(e) => togglePlay(e, banner.id)}
                                                className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all active:scale-90"
                                                title={playingStates[banner.id] ? "Pause" : "Play"}
                                            >
                                                {playingStates[banner.id] ? <Pause size={20} /> : <Play size={20} />}
                                            </button>
                                            <button 
                                                onClick={(e) => handleFullscreen(e, banner.id)}
                                                className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all active:scale-90"
                                                title="Fullscreen"
                                            >
                                                <Maximize size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Image
                                    src={banner.image_url}
                                    alt={banner.title || ''}
                                    fill
                                    className="object-cover"
                                    priority={index === 0}
                                    loading={index === 0 ? "eager" : "lazy"}
                                    sizes="100vw"
                                />
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Content */}
                            <div className="relative z-20 h-full max-w-7xl mx-auto px-6 sm:px-12 flex items-center">
                                <div
                                    className={`max-w-2xl transition-all duration-1000 delay-300 ${isActive
                                        ? 'translate-y-0 opacity-100'
                                        : 'translate-y-10 opacity-0'
                                        }`}
                                >
                                    {/* Interactive Badge */}
                                    {banner.title && (
                                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5 mb-6">
                                            <Sparkles className="w-4 h-4 text-yellow-400" />
                                            <span className="text-white text-xs font-bold uppercase tracking-wider">{banner.title}</span>
                                        </div>
                                    )}

                                    {/* Title */}
                                    <h2 className="text-4xl md:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-2xl">
                                        {banner.heading_text}
                                    </h2>

                                    {/* Subtitle */}
                                    <p className="mt-6 text-lg md:text-2xl text-white/90 font-medium max-w-lg drop-shadow-lg line-clamp-2">
                                        {banner.subheading_text}
                                    </p>

                                    {/* CTA Button */}
                                    {banner.button_text && (
                                        <Link
                                            href={banner.button_link || '#'}
                                            className="mt-10 inline-flex items-center gap-4 px-10 py-5 rounded-2xl font-black text-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] bg-white text-black active:scale-95 shadow-2xl"
                                            style={{ 
                                                backgroundColor: banner.button_color || 'white',
                                                borderRadius: banner.button_style === 'pill' ? '9999px' : banner.button_style === 'square' ? '0px' : '20px'
                                            }}
                                        >
                                            {banner.button_text}
                                            <ChevronRight className="w-6 h-6" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-110 active:scale-90 border border-white/20 shadow-2xl"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-110 active:scale-90 border border-white/20 shadow-2xl"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {banners.length > 1 && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-4 bg-black/20 backdrop-blur-md px-6 py-3 rounded-3xl border border-white/10 shadow-2xl">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2.5 rounded-full transition-all duration-500 shadow-inner ${index === currentSlide
                                ? 'w-10 bg-white'
                                : 'w-2.5 bg-white/30 hover:bg-white/60'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Premium Detail - Bottom Progress */}
            {banners.length > 1 && isAutoPlaying && (
                <div className="absolute bottom-0 left-0 right-0 z-40 h-1.5 bg-white/10">
                    <div
                        key={currentSlide} // Reset animation on slide change
                        className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                        style={{ 
                            animation: 'bannerProgress 8s linear forwards'
                        }}
                    />
                </div>
            )}

            <style jsx>{`
                @keyframes bannerProgress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </section>
    );
}
