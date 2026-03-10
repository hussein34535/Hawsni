'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MoreVertical, Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
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
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const imageRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToastStore();

    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

    const resetZoom = useCallback(() => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setLastTouchDistance(null);
    }, []);

    // Handle navigation with zoom reset
    const handleNavigate = (index: number) => {
        resetZoom();
        onNavigate(index);
    };

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
                x: e.touches[0].clientX - position.x, 
                y: e.touches[0].clientY - position.y 
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
            setPosition({
                x: e.touches[0].clientX - dragStart.current.x,
                y: e.touches[0].clientY - dragStart.current.y
            });
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
        if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % images.length);
        if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + images.length) % images.length);
    }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

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
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={() => {
                        if (showMenu) setShowMenu(false);
                        else onClose();
                    }}
                >
                    {/* Top Controls Overlay */}
                    <div className="absolute top-0 left-0 right-0 z-[120] p-6 flex items-center justify-between pointer-events-none">
                        {/* Top Left: Close and Download Only */}
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
                    <motion.div
                        ref={imageRef}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={`relative w-full h-full max-h-screen max-w-7xl mx-auto flex items-center justify-center p-4 lg:p-20 overflow-hidden ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            toggleZoom();
                        }}
                        onMouseDown={(e) => {
                            if (zoom <= 1) return;
                            setIsDragging(true);
                            dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
                        }}
                        onMouseMove={(e) => {
                            if (!isDragging || zoom <= 1) return;
                            setPosition({
                                x: e.clientX - dragStart.current.x,
                                y: e.clientY - dragStart.current.y
                            });
                        }}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={() => {
                            setIsDragging(false);
                            setLastTouchDistance(null);
                        }}
                    >
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 300 }}
                                animate={{ 
                                    opacity: 1, 
                                    x: zoom > 1 ? position.x : 0,
                                    y: zoom > 1 ? position.y : 0,
                                    scale: zoom
                                }}
                                exit={{ opacity: 0, x: -300 }}
                                transition={{ 
                                    type: 'spring', 
                                    stiffness: 260, 
                                    damping: 26,
                                    mass: 1
                                }}
                                drag={zoom <= 1 ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                onDragEnd={(_, info) => {
                                    if (zoom > 1) return;
                                    const threshold = 50;
                                    if (info.offset.x < -threshold) {
                                        handleNavigate((currentIndex + 1) % images.length);
                                    } else if (info.offset.x > threshold) {
                                        handleNavigate((currentIndex - 1 + images.length) % images.length);
                                    }
                                }}
                                className="relative w-full h-full flex items-center justify-center p-4"
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
                                        <Image
                                            src={currentSrc}
                                            alt={`Fullscreen view ${currentIndex + 1}`}
                                            fill
                                            className="object-contain select-none"
                                            priority
                                            sizes="100vw"
                                            draggable={false}
                                        />
                                    );
                                })()}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                    {/* Bottom: Thumbnail Row and Counter */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center gap-4 z-[130] bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                        {images.length > 1 && (
                            <div className="flex items-center justify-center gap-3 overflow-x-auto max-w-[90vw] px-4 py-4 hide-scrollbar pointer-events-auto">
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
