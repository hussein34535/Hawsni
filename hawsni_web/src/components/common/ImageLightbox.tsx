'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useCallback } from 'react';

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
                    onClick={onClose}
                >
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-6 right-6 z-[110] w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        <X size={24} />
                    </motion.button>

                    {images.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 lg:left-8 z-[110] w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate((currentIndex - 1 + images.length) % images.length);
                                }}
                            >
                                <ChevronLeft size={32} />
                            </button>
                            <button
                                className="absolute right-4 lg:right-8 z-[110] w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate((currentIndex + 1) % images.length);
                                }}
                            >
                                <ChevronRight size={32} />
                            </button>
                        </>
                    )}

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full h-[80vh] max-w-5xl mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={images[currentIndex]}
                            alt={`Fullscreen view ${currentIndex + 1}`}
                            fill
                            className="object-contain"
                            priority
                            sizes="100vw"
                        />
                    </motion.div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 font-medium tracking-widest text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
