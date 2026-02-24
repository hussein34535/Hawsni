'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Camera, Image as ImageIcon, Sparkles, RefreshCw, Share2, ZoomIn, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { vtoService } from '@/services/vtoService';

interface VirtualTryOnModalProps {
    isOpen: boolean;
    onClose: () => void;
    productImageUrl: string;
    productId: string;
}

type VtoStatus = 'idle' | 'uploading' | 'processing' | 'succeeded' | 'failed';

export default function VirtualTryOnModal({ isOpen, onClose, productImageUrl, productId }: VirtualTryOnModalProps) {
    const { t, isRTL } = useLanguage();
    const [status, setStatus] = useState<VtoStatus>('idle');
    const [userImage, setUserImage] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setErrorMessage(isRTL ? 'الصورة كبيرة جداً، يرجى اختيار صورة أقل من 10 ميجا' : 'Image too large, please select under 10MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setUserImage(event.target?.result as string);
                setStatus('idle');
                setResultImageUrl(null);
                setErrorMessage('');
            };
            reader.readAsDataURL(file);
        }
    };

    const startTryOnFlow = async () => {
        if (!userImage) return;

        setStatus('uploading');
        setErrorMessage('');

        try {
            const response = await vtoService.startTryOn(userImage, productImageUrl);
            const predictionId = response.id;

            setStatus('processing');
            pollStatus(predictionId);
        } catch (error: any) {
            setStatus('failed');
            setErrorMessage(error.toString());
        }
    };

    const pollStatus = (id: string) => {
        pollingTimerRef.current = setInterval(async () => {
            try {
                const response = await vtoService.checkStatus(id);
                if (response.status === 'succeeded' && response.output) {
                    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
                    setResultImageUrl(response.output);
                    setStatus('succeeded');
                } else if (response.status === 'failed' || response.status === 'canceled') {
                    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
                    setStatus('failed');
                    setErrorMessage(isRTL ? 'فشلت الطلب، يرجى المحاولة مرة أخرى' : 'Generation failed. Please try again.');
                }
            } catch (error: any) {
                if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
                setStatus('failed');
                setErrorMessage(error.toString());
            }
        }, 3000);
    };

    const reset = () => {
        setUserImage(null);
        setResultImageUrl(null);
        setStatus('idle');
        setErrorMessage('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl bg-white rounded-[32px] z-[101] overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                            <h3 className="text-xl font-black text-gray-900 font-cairo">
                                {t.product?.vto_title || 'AI Virtual Try-On'}
                            </h3>
                            <button onClick={onClose} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
                            {status === 'idle' && !userImage ? (
                                <div className="text-center space-y-8 w-full">
                                    {/* Steps logic like Flutter */}
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        {[1, 2, 3].map((step) => (
                                            <div key={step} className="flex flex-col items-center gap-2">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
                                                    <img src={`/images/vto_step_${step}.png`} alt={`Step ${step}`} className="w-12 h-12 object-contain" />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 font-cairo">
                                                    {(t.product as any)[`vto_step${step}`]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full aspect-[4/5] max-w-[280px] bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 hover:border-[var(--color-brand-primary)] transition-colors group mx-auto"
                                    >
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[var(--color-brand-primary)]">
                                            <Camera size={32} />
                                        </div>
                                        <p className="font-black text-gray-400 font-cairo text-lg">{t.product?.vto_upload}</p>
                                    </button>
                                </div>
                            ) : (
                                <div className="relative w-full aspect-[3/4] max-w-[320px] bg-gray-100 rounded-[32px] overflow-hidden shadow-xl">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={resultImageUrl || userImage}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            src={resultImageUrl || userImage || ''}
                                            className="w-full h-full object-cover"
                                        />
                                    </AnimatePresence>

                                    {(status === 'uploading' || status === 'processing') && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                                            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-6" />
                                            <Sparkles className="text-purple-400 mb-2 animate-pulse" />
                                            <p className="font-black text-lg font-cairo">{t.product?.vto_processing}</p>
                                        </div>
                                    )}

                                    {status === 'failed' && (
                                        <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm flex flex-col items-center justify-center text-red-600 p-6 text-center">
                                            <AlertCircle size={48} className="mb-4" />
                                            <p className="font-black font-cairo">{errorMessage}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            {status === 'succeeded' ? (
                                <div className="flex gap-4">
                                    <button
                                        onClick={reset}
                                        className="flex-1 h-14 bg-white border border-gray-200 rounded-2xl font-black font-cairo text-gray-900 flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={20} />
                                        {t.product?.vto_try_another}
                                    </button>
                                    <button
                                        className="h-14 w-14 bg-[var(--color-brand-primary)] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95"
                                    >
                                        <Share2 size={24} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    disabled={!userImage || status === 'processing' || status === 'uploading'}
                                    onClick={status === 'failed' ? reset : (userImage ? startTryOnFlow : () => fileInputRef.current?.click())}
                                    className="w-full h-14 bg-gray-950 text-white rounded-2xl font-black text-lg shadow-xl font-cairo disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {status === 'failed' ? (isRTL ? 'إعادة المحاولة' : 'Retry') : (userImage ? t.product?.vto_button : t.product?.vto_upload)}
                                </button>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
