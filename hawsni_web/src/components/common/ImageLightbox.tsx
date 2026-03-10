'use client';

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useCallback, useState, useRef } from 'react';
import { useToastStore } from '@/store/toastStore';

interface ImageLightboxProps {
    images: string[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

interface LightboxImageProps {
    img: string;
    idx: number;
    currentIndex: number;
    scrollX: any;
    windowWidth: number;
    zoom: number;
    springX: any;
    springY: any;
    isDragging: boolean;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    onDragStateChange: (state: boolean) => void;
    dragStart: React.MutableRefObject<{ x: number; y: number }>;
    translateX: any;
    translateY: any;
}



function LightboxImage({
    img,
    idx,
    currentIndex,
    scrollX,
    windowWidth,
    zoom,
    springX,
    springY,
    isDragging,
    handleTouchStart,
    handleTouchMove,
    onDragStateChange,
    dragStart,
    translateX,
    translateY
}: LightboxImageProps) {
    const lowerSrc = img.toLowerCase();
    const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(lowerSrc) || lowerSrc.includes('/video/upload/');

    return (
        <motion.div
            key={idx}
            className="relative h-full w-[100vw] flex-shrink-0 flex items-center justify-center pointer-events-auto px-2 snap-center snap-always"
            style={{ 
                x: idx === currentIndex && zoom > 1 ? springX : 0,
                y: idx === currentIndex && zoom > 1 ? springY : 0,
                scale: idx === currentIndex && zoom > 1 ? zoom : 1,
                opacity: zoom > 1 ? (idx === currentIndex ? 1 : 0) : 1,
                zIndex: idx === currentIndex ? 10 : 1,
                cursor: idx === currentIndex && zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'auto'
            }}
            onTouchStart={idx === currentIndex ? handleTouchStart : undefined}
            onTouchMove={idx === currentIndex ? handleTouchMove : undefined}
            onTouchEnd={() => {
                onDragStateChange(false);
            }}
            onMouseDown={(e) => {
                if (idx !== currentIndex || zoom <= 1) return;
                onDragStateChange(true);
                dragStart.current = { x: e.clientX - translateX.get(), y: e.clientY - translateY.get() };
            }}
            onMouseMove={(e) => {
                if (idx !== currentIndex || !isDragging || zoom <= 1) return;
                translateX.set(e.clientX - dragStart.current.x);
                translateY.set(e.clientY - dragStart.current.y);
            }}
            onMouseUp={() => onDragStateChange(false)}
            onMouseLeave={() => onDragStateChange(false)}
        >
            {isVideo ? (
                <video
                    src={img}
                    className="w-full h-full max-h-[80vh] object-contain rounded-xl"
                    controls
                    playsInline
                    controlsList="nodownload"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                />
            ) : (
                <div className="relative w-full h-full pointer-events-none p-4 lg:p-12">
                    <Image
                        src={img}
                        alt={`Fullscreen view ${idx + 1}`}
                        fill
                        className="object-contain select-none"
                        priority={idx === currentIndex}
                        quality={100}
                        sizes="100vw"
                        draggable={false}
                    />
                </div>
            )}
        </motion.div>
    );
}

export default function ImageLightbox({
    images,
    currentIndex,
    isOpen,
    onClose,
    onNavigate
}: ImageLightboxProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const thumbContainerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToastStore();
    const [windowWidth, setWindowWidth] = useState(0);

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Scroll state for animations
    const { scrollX } = useScroll({ container: scrollContainerRef });

    // MotionValues for zoomed image dragging
    const translateX = useMotionValue(0);
    const translateY = useMotionValue(0);
    const springX = useSpring(translateX, { stiffness: 300, damping: 30 });
    const springY = useSpring(translateY, { stiffness: 300, damping: 30 });

    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

    const resetZoom = useCallback(() => {
        setZoom(1);
        translateX.set(0);
        translateY.set(0);
        setLastTouchDistance(null);
    }, [translateX, translateY]);

    // Handle manual navigation (arrows/thumbs)
    const handleNavigate = useCallback((index: number) => {
        resetZoom();
        onNavigate(index);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                left: index * windowWidth,
                behavior: 'smooth'
            });
        }
    }, [onNavigate, resetZoom, windowWidth]);

    // Update index based on scroll position
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || isDragging) return;
        const index = Math.round(scrollContainerRef.current.scrollLeft / windowWidth);
        if (index !== currentIndex && index >= 0 && index < images.length) {
            onNavigate(index);
        }
    }, [currentIndex, images.length, onNavigate, windowWidth, isDragging]);

    const toggleZoom = () => {
        if (zoom > 1) resetZoom();
        else setZoom(2.5);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            setLastTouchDistance(distance);
        } else if (zoom > 1) {
            setIsDragging(true);
            dragStart.current = { 
                x: e.touches[0].clientX - translateX.get(), 
                y: e.touches[0].clientY - translateY.get() 
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistance !== null) {
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const delta = (distance - lastTouchDistance) * 0.01;
            setZoom(prev => Math.min(5, Math.max(1, prev + delta)));
            setLastTouchDistance(distance);
        } else if (isDragging && zoom > 1 && e.touches.length === 1) {
            translateX.set(e.touches[0].clientX - dragStart.current.x);
            translateY.set(e.touches[0].clientY - dragStart.current.y);
        }
    };

    const handleDownload = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            
            const urlParts = url.split('/');
            let filename = urlParts[urlParts.length - 1].split('?')[0] || 'hwasi-image.jpg';
            if (!filename.includes('.')) filename += '.jpg';

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            showToast('تم تحميل الصورة بنجاح وتجدها في معرض الصور الخاص بك', 'success');
            setShowMenu(false);
        } catch (error) {
            showToast('عذراً، فشل تحميل الصورة. يرجى المحاولة مرة أخرى', 'error');
            window.open(url, '_blank');
        }
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') handleNavigate(Math.min(currentIndex + 1, images.length - 1));
        if (e.key === 'ArrowLeft') handleNavigate(Math.max(currentIndex - 1, 0));
    }, [isOpen, currentIndex, images.length, onClose, handleNavigate]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Initial scroll to current index
            if (scrollContainerRef.current && windowWidth > 0) {
                scrollContainerRef.current.scrollLeft = currentIndex * windowWidth;
            }
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleKeyDown, currentIndex]);

    useEffect(() => {
        if (isOpen && thumbContainerRef.current) {
            const activeThumb = thumbContainerRef.current.children[currentIndex] as HTMLElement;
            if (activeThumb) {
                activeThumb.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [currentIndex, isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-md touch-none"
                    onClick={() => {
                        if (showMenu) setShowMenu(false);
                        else onClose();
                    }}
                >
                    {/* Top Controls Overlay */}
                    <div className="absolute top-0 left-0 right-0 z-[120] p-6 flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-3 pointer-events-auto">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all backdrop-blur-xl border border-white/10 shadow-2xl"
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                            >
                                <X size={24} strokeWidth={2.5} />
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all backdrop-blur-xl border border-white/10 shadow-2xl"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(images[currentIndex]);
                                }}
                            >
                                <Download size={22} strokeWidth={2.5} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Navigation Arrows (Desktop Only) */}
                    {images.length > 1 && (
                        <>
                            <button
                                className={`hidden lg:flex absolute left-8 z-[110] w-14 h-14 bg-white/5 hover:bg-white/10 active:scale-90 rounded-full items-center justify-center text-white transition-all shadow-2xl backdrop-blur-xl border border-white/5 ${currentIndex === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (currentIndex > 0) handleNavigate(currentIndex - 1);
                                }}
                            >
                                <ChevronLeft size={32} strokeWidth={2.5} />
                            </button>
                            <button
                                className={`hidden lg:flex absolute right-8 z-[110] w-14 h-14 bg-white/5 hover:bg-white/10 active:scale-90 rounded-full items-center justify-center text-white transition-all shadow-2xl backdrop-blur-xl border border-white/5 ${currentIndex === images.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (currentIndex < images.length - 1) handleNavigate(currentIndex + 1);
                                }}
                            >
                                <ChevronRight size={32} strokeWidth={2.5} />
                            </button>
                        </>
                    )}



                    {/* Main Filmstrip View (Natural Scroll) */}
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden z-10">
                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className={`flex h-full w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar ${zoom > 1 ? 'overflow-hidden pointer-events-none' : 'pointer-events-auto'}`}
                            style={{ 
                                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'auto'
                            }}
                        >
                            {windowWidth > 0 && images.map((img: string, idx: number) => (
                                <LightboxImage
                                    key={idx}
                                    img={img}
                                    idx={idx}
                                    currentIndex={currentIndex}
                                    scrollX={scrollX}
                                    windowWidth={windowWidth}
                                    zoom={zoom}
                                    springX={springX}
                                    springY={springY}
                                    isDragging={isDragging}
                                    handleTouchStart={handleTouchStart}
                                    handleTouchMove={handleTouchMove}
                                    onDragStateChange={setIsDragging}
                                    dragStart={dragStart}
                                    translateX={translateX}
                                    translateY={translateY}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Bottom: Thumbnail Row and Counter */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 flex flex-col items-center gap-3 sm:gap-4 z-[130] bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                        {images.length > 1 && (
                            <div 
                                ref={thumbContainerRef}
                                className="flex items-center gap-2 sm:gap-3 overflow-x-auto w-full max-w-[100vw] sm:max-w-[90vw] px-4 sm:px-10 py-2 sm:py-4 hide-scrollbar pointer-events-auto scroll-smooth"
                                style={{ 
                                    justifyContent: (images.length * (windowWidth < 640 ? 56 : 72)) < windowWidth * 0.9 ? 'center' : 'start' 
                                }}
                            >
                                {images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleNavigate(idx); 
                                        }}
                                        className={`
                                            relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-300
                                            ${currentIndex === idx 
                                                ? 'border-white scale-110 ring-4 ring-white/10 z-10' 
                                                : 'border-white/5 opacity-40 hover:opacity-80 hover:border-white/20'}
                                        `}
                                    >
                                        <Image
                                            src={img}
                                            alt={`Thumb ${idx}`}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="text-white/60 font-black tracking-[0.2em] text-[10px] uppercase bg-white/10 py-2 px-5 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto shadow-2xl">
                            {currentIndex + 1} <span className="mx-2 opacity-30">/</span> {images.length}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
