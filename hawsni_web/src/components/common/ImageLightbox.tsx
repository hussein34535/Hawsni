'use client';

import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MoreVertical, Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useCallback, useState, useRef } from 'react';

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

    const resetZoom = useCallback(() => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
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

    const handleDownload = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            // Extract filename from URL or use a default
            const filename = url.split('/').pop()?.split('?')[0] || 'hwasi-image.jpg';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            setShowMenu(false);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback for CORS issues: open in new tab
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
                    {/* Top right buttons */}
                    <div className="absolute top-6 right-6 z-[120] flex items-center gap-3">
                        {/* Zoom Controls */}
                        <div className="hidden lg:flex items-center gap-2 mr-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); setZoom(Math.max(1, zoom - 0.5)); }}
                                className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white/90 transition-all backdrop-blur-md"
                            >
                                <ZoomOut size={20} />
                            </button>
                            <span className="text-white/80 text-xs font-bold w-10 text-center">{Math.round(zoom * 100)}%</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setZoom(Math.min(5, zoom + 0.5)); }}
                                className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white/90 transition-all backdrop-blur-md"
                            >
                                <ZoomIn size={20} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); resetZoom(); }}
                                className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white/90 transition-all backdrop-blur-md"
                                title="Reset Zoom"
                            >
                                <Maximize size={18} />
                            </button>
                        </div>

                        <div className="relative">
                            <motion.button
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-all backdrop-blur-md shadow-lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                            >
                                <MoreVertical size={20} strokeWidth={2.5} />
                            </motion.button>
                            
                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute top-12 right-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden min-w-[140px]"
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(images[currentIndex]);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors text-sm font-bold font-cairo"
                                        >
                                            <Download size={16} />
                                            تنزيل الصورة
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-all backdrop-blur-md shadow-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                        >
                            <X size={20} strokeWidth={2.5} />
                        </motion.button>
                    </div>

                    {images.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 lg:left-8 z-[110] w-12 h-12 bg-black/40 hover:bg-black/60 active:scale-90 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-all shadow-lg backdrop-blur-md"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate((currentIndex - 1 + images.length) % images.length);
                                }}
                            >
                                <ChevronLeft size={24} strokeWidth={2.5} />
                            </button>
                            <button
                                className="absolute right-4 lg:right-8 z-[110] w-12 h-12 bg-black/40 hover:bg-black/60 active:scale-90 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-all shadow-lg backdrop-blur-md"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate((currentIndex + 1) % images.length);
                                }}
                            >
                                <ChevronRight size={24} strokeWidth={2.5} />
                            </button>
                        </>
                    )}

                    <motion.div
                        ref={imageRef}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={`relative w-full h-full max-h-screen max-w-7xl mx-auto flex items-center justify-center p-2 lg:p-10 ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
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
                        onTouchStart={(e) => {
                            if (e.touches.length === 2) return; // Handle pinch separately if needed
                            if (zoom <= 1) return;
                            setIsDragging(true);
                            dragStart.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
                        }}
                        onTouchMove={(e) => {
                            if (!isDragging || zoom <= 1 || e.touches.length === 2) return;
                            setPosition({
                                x: e.touches[0].clientX - dragStart.current.x,
                                y: e.touches[0].clientY - dragStart.current.y
                            });
                        }}
                        onTouchEnd={() => setIsDragging(false)}
                        style={{ touchAction: 'none' }}
                    >
                        {(() => {
                            const currentSrc = images[currentIndex];
                            const lowerSrc = currentSrc.toLowerCase();
                            const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(lowerSrc) || lowerSrc.includes('/video/upload/');

                            if (isVideo) {
                                return (
                                    <video
                                        src={currentSrc}
                                        className="w-full h-full object-contain"
                                        controls
                                        playsInline
                                        controlsList="nodownload"
                                    />
                                );
                            }

                            return (
                                <motion.div
                                    animate={{ 
                                        scale: zoom,
                                        x: position.x,
                                        y: position.y
                                    }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                                    className="relative w-full h-full"
                                >
                                    <Image
                                        src={currentSrc}
                                        alt={`Fullscreen view ${currentIndex + 1}`}
                                        fill
                                        className={`object-contain transition-transform duration-200 ${isDragging ? 'scale-[1.002]' : ''}`}
                                        priority
                                        sizes="100vw"
                                        draggable={false}
                                    />
                                </motion.div>
                            );
                        })()}
                    </motion.div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 font-medium tracking-widest text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
