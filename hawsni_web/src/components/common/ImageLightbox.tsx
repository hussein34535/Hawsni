'use client';

import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
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
    const { showToast } = useToastStore();

    // Use MotionValues for high-performance dragging (no re-renders)
    const translateX = useMotionValue(0);
    const translateY = useMotionValue(0);
    
    // Spring for smooth zoom-drag reset
    const springX = useSpring(translateX, { stiffness: 300, damping: 30 });
    const springY = useSpring(translateY, { stiffness: 300, damping: 30 });

    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
    const [direction, setDirection] = useState(0);

    const resetZoom = useCallback(() => {
        setZoom(1);
        translateX.set(0);
        translateY.set(0);
        setLastTouchDistance(null);
    }, [translateX, translateY]);

    // Handle navigation with extreme smoothness
    const handleNavigate = (index: number) => {
        const newDirection = index > currentIndex ? 1 : -1;
        setDirection(newDirection);
        resetZoom();
        onNavigate(index);
    };

    const toggleZoom = () => {
        if (zoom > 1) resetZoom();
        else setZoom(2.5);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : direction > 0 ? '-100%' : 0,
            opacity: 0,
            scale: 0.95,
        })
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
            if (!filename.includes('.')) {
                filename += '.jpg';
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            showToast('تم تحميل الصورة بنجاح وتجدها في معرض الصور الخاص بك', 'success');
            setShowMenu(false);
        } catch (error) {
            console.error('Download failed:', error);
            showToast('عذراً، فشل تحميل الصورة. يرجى المحاولة مرة أخرى', 'error');
            window.open(url, '_blank');
        }
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') handleNavigate((currentIndex + 1) % images.length);
        if (e.key === 'ArrowLeft') handleNavigate((currentIndex - 1 + images.length) % images.length);
    }, [isOpen, currentIndex, images.length, onClose, handleNavigate]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
            document.body.style.touchAction = 'auto';
        };
    }, [isOpen, handleKeyDown]);

    // Auto-scroll active thumbnail into view
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
    }, [currentIndex, isOpen, images.length]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm touch-none"
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
                                className="hidden lg:flex absolute left-8 z-[110] w-14 h-14 bg-white/5 hover:bg-white/10 active:scale-90 rounded-full items-center justify-center text-white transition-all shadow-2xl backdrop-blur-xl border border-white/5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate((currentIndex - 1 + images.length) % images.length);
                                }}
                            >
                                <ChevronLeft size={32} strokeWidth={2.5} />
                            </button>
                            <button
                                className="hidden lg:flex absolute right-8 z-[110] w-14 h-14 bg-white/5 hover:bg-white/10 active:scale-90 rounded-full items-center justify-center text-white transition-all shadow-2xl backdrop-blur-xl border border-white/5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate((currentIndex + 1) % images.length);
                                }}
                            >
                                <ChevronRight size={32} strokeWidth={2.5} />
                            </button>
                        </>
                    )}

                    {/* Main Image View with Swipe Support */}
                    <div className="relative w-full h-full max-h-screen max-w-7xl mx-auto flex items-center justify-center overflow-hidden">
                        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 },
                                    opacity: { duration: 0.2 },
                                    scale: { duration: 0.2 }
                                }}
                                drag={zoom <= 1 ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                onDragEnd={(_, info) => {
                                    if (zoom > 1) return;
                                    const swipe = info.offset.x;
                                    const threshold = 50;
                                    if (swipe < -threshold) {
                                        handleNavigate((currentIndex + 1) % images.length);
                                    } else if (swipe > threshold) {
                                        handleNavigate((currentIndex - 1 + images.length) % images.length);
                                    }
                                }}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={() => {
                                    setIsDragging(false);
                                    setLastTouchDistance(null);
                                }}
                                className="absolute inset-0 flex items-center justify-center p-4 lg:p-20 pointer-events-auto"
                                style={{ 
                                    x: zoom > 1 ? springX : 0,
                                    y: zoom > 1 ? springY : 0,
                                    scale: zoom,
                                    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'auto'
                                }}
                                onMouseDown={(e) => {
                                    if (zoom <= 1) return;
                                    setIsDragging(true);
                                    dragStart.current = { x: e.clientX - translateX.get(), y: e.clientY - translateY.get() };
                                }}
                                onMouseMove={(e) => {
                                    if (!isDragging || zoom <= 1) return;
                                    translateX.set(e.clientX - dragStart.current.x);
                                    translateY.set(e.clientY - dragStart.current.y);
                                }}
                                onMouseUp={() => setIsDragging(false)}
                                onMouseLeave={() => setIsDragging(false)}
                            >
                                {(() => {
                                    const currentSrc = images[currentIndex];
                                    const lowerSrc = currentSrc.toLowerCase();
                                    const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(lowerSrc) || lowerSrc.includes('/video/upload/');

                                    if (isVideo) {
                                        return (
                                            <video
                                                src={currentSrc}
                                                className="w-full h-full max-h-[80vh] object-contain rounded-xl"
                                                controls
                                                playsInline
                                                controlsList="nodownload"
                                            />
                                        );
                                    }

                                    return (
                                        <div className="relative w-full h-full pointer-events-none">
                                            <Image
                                                src={currentSrc}
                                                alt={`Fullscreen view ${currentIndex + 1}`}
                                                fill
                                                className="object-contain select-none"
                                                priority
                                                sizes="100vw"
                                                draggable={false}
                                            />
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Bottom: Thumbnail Row and Counter */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center gap-4 z-[130] bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                        {images.length > 1 && (
                            <div 
                                ref={thumbContainerRef}
                                className="flex items-center gap-3 overflow-x-auto max-w-full sm:max-w-[90vw] px-10 py-4 hide-scrollbar pointer-events-auto scroll-smooth"
                                style={{ 
                                    justifyContent: images.length * 80 < (typeof window !== 'undefined' ? window.innerWidth : 1000) * 0.9 ? 'center' : 'start' 
                                }}
                            >
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleNavigate(idx); 
                                        }}
                                        className={`
                                            relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all
                                            ${currentIndex === idx 
                                                ? 'border-amber-400 scale-110 shadow-[0_0_20px_rgba(251,191,36,0.6)] ring-2 ring-amber-400/20' 
                                                : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'}
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
