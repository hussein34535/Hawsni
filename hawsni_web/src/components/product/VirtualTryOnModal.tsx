'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Camera, Image as ImageIcon, Sparkles, RefreshCw, Share2, AlertCircle, Check, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { vtoService } from '@/services/vtoService';

const GUEST_DAILY_LIMIT = 1;
const USER_DAILY_LIMIT = 10;

const getVtoUsageKey = () => {
    const today = new Date().toISOString().split('T')[0];
    return `vto_usage_${today}`;
};

const getUsageCount = (): number => {
    try {
        return parseInt(localStorage.getItem(getVtoUsageKey()) || '0', 10);
    } catch { return 0; }
};

const incrementUsage = () => {
    try {
        const key = getVtoUsageKey();
        const current = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, String(current + 1));
    } catch { }
};

const isLoggedIn = (): boolean => {
    try { return !!localStorage.getItem('token'); }
    catch { return false; }
};

interface VirtualTryOnModalProps {
    isOpen: boolean;
    onClose: () => void;
    productImages: string[];
    productId: string;
}

type VtoStatus = 'idle' | 'uploading' | 'processing' | 'succeeded' | 'failed';

export default function VirtualTryOnModal({ isOpen, onClose, productImages, productId }: VirtualTryOnModalProps) {
    const { t, isRTL } = useLanguage();
    const [status, setStatus] = useState<VtoStatus>('idle');
    const [userImage, setUserImage] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedGarment, setSelectedGarment] = useState(0);
    const [showLimitReached, setShowLimitReached] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        };
    }, []);

    const compressImage = (file: File, maxDimension = 1024, quality = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    const ratio = Math.min(maxDimension / width, maxDimension / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject('Canvas not supported'); return; }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject('Failed to load image');
            img.src = url;
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setErrorMessage(isRTL ? 'الصورة كبيرة جداً، يرجى اختيار صورة أقل من 10 ميجا' : 'Image too large, please select under 10MB');
                return;
            }
            try {
                const compressed = await compressImage(file);
                setUserImage(compressed);
                setStatus('idle');
                setResultImageUrl(null);
                setErrorMessage('');
            } catch {
                setErrorMessage(isRTL ? 'فشل تحميل الصورة' : 'Failed to load image');
            }
        }
    };

    const startTryOnFlow = async () => {
        if (!userImage) return;

        // Check daily limit
        const usage = getUsageCount();
        const logged = isLoggedIn();
        const limit = logged ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT;

        if (usage >= limit) {
            setShowLimitReached(true);
            return;
        }

        setStatus('uploading');
        setErrorMessage('');

        try {
            const garmentUrl = productImages[selectedGarment];
            console.log('🚀 Starting VTO:', { garmentUrl, userImageSize: userImage.length });
            const response = await vtoService.startTryOn(userImage, garmentUrl);
            const predictionId = response.id;
            console.log('✅ VTO Started, Prediction ID:', predictionId);

            incrementUsage();
            setStatus('processing');
            pollStatus(predictionId);
        } catch (error: any) {
            console.error('❌ VTO Start Error:', error);
            setStatus('failed');
            setErrorMessage(error.toString() || (isRTL ? 'فشل بدء الخدمة الذكية' : 'Failed to start AI service'));
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
                        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white rounded-[24px] z-[101] overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
                            <h3 className="text-base font-black text-gray-900 font-cairo">
                                {t.product?.vto_title || 'تجربة افتراضية'}
                            </h3>
                            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center min-h-[350px]">
                            {showLimitReached ? (
                                <div className="text-center space-y-4 w-full max-w-[280px]">
                                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                                        <AlertCircle size={28} className="text-amber-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-base font-black text-gray-900 font-cairo">
                                            {isRTL ? 'وصلت للحد اليومي' : 'Daily limit reached'}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-cairo leading-relaxed">
                                            {!isLoggedIn()
                                                ? (isRTL ? 'الزوار مسموح لهم بتجربة واحدة. سجل حساب لـ 10 تجارب يومياً!' : 'Guests get 1 free try. Sign up for 10 daily tries!')
                                                : (isRTL ? 'وصلت لـ 10 تجارب اليوم. عُد غداً!' : "You've used all 10 tries. Come back tomorrow!")
                                            }
                                        </p>
                                    </div>
                                    {!isLoggedIn() ? (
                                        <button
                                            onClick={() => { onClose(); window.location.href = '/auth'; }}
                                            className="w-full h-11 bg-[var(--color-brand-primary)] text-white rounded-xl font-black text-sm shadow-lg font-cairo flex items-center justify-center gap-2"
                                        >
                                            <UserPlus size={18} />
                                            {isRTL ? 'إنشاء حساب مجاني' : 'Create free account'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={onClose}
                                            className="w-full h-11 bg-gray-200 text-gray-700 rounded-xl font-black text-sm font-cairo"
                                        >
                                            {isRTL ? 'حسناً' : 'OK'}
                                        </button>
                                    )}
                                </div>
                            ) : status === 'idle' && !userImage ? (
                                <div className="text-center space-y-5 w-full">
                                    {/* Steps */}
                                    <div className="grid grid-cols-3 gap-3 mb-2">
                                        <div className="flex flex-col items-center gap-1.5 text-center">
                                            <div className="w-10 h-10 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-center text-[#0E4435]">
                                                <Camera size={18} className="opacity-80" />
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400 font-cairo">
                                                {isRTL ? 'اختر اللون' : 'Pick color'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1.5 text-center">
                                            <div className="w-10 h-10 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center text-blue-600">
                                                <Sparkles size={18} className="opacity-80" />
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400 font-cairo">
                                                {isRTL ? 'ارفع صورتك' : 'Upload photo'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1.5 text-center">
                                            <div className="w-10 h-10 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-center text-purple-600">
                                                <ImageIcon size={18} className="opacity-80" />
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400 font-cairo">
                                                {isRTL ? 'شاهد النتيجة' : 'See results'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Garment Image Selector */}
                                    {productImages.length > 1 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold text-gray-400 font-cairo">
                                                {isRTL ? 'اختر اللون للمعاينة:' : 'Pick color for try-on:'}
                                            </p>
                                            <div className="flex gap-2 justify-center flex-wrap">
                                                {productImages.map((img, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedGarment(idx)}
                                                        className={`relative w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedGarment === idx
                                                            ? 'border-[var(--color-brand-primary)] shadow-md scale-105'
                                                            : 'border-gray-100 opacity-60 hover:opacity-100'
                                                            }`}
                                                    >
                                                        <img src={img} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                                                        {selectedGarment === idx && (
                                                            <div className="absolute inset-0 bg-[var(--color-brand-primary)]/10 flex items-center justify-center">
                                                                <div className="w-4 h-4 bg-[var(--color-brand-primary)] rounded-full flex items-center justify-center">
                                                                    <Check size={10} className="text-white" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full aspect-[4/5] max-w-[200px] bg-gray-50 rounded-[20px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-[var(--color-brand-primary)] transition-colors group mx-auto"
                                    >
                                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[var(--color-brand-primary)]">
                                            <Camera size={20} />
                                        </div>
                                        <p className="font-black text-gray-400 font-cairo text-sm">{t.product?.vto_upload || (isRTL ? 'ارفع صورتك' : 'Upload your photo')}</p>
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full flex flex-col items-center gap-3">
                                    {/* Selected garment preview (small) */}
                                    {!resultImageUrl && (
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5 w-full max-w-[240px]">
                                            <img src={productImages[selectedGarment]} alt="Garment" className="w-10 h-12 rounded-lg object-cover border border-gray-100" />
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-gray-400 font-cairo">{isRTL ? 'المنتج المختار' : 'Selected garment'}</p>
                                                {productImages.length > 1 && (
                                                    <button
                                                        onClick={() => { reset(); }}
                                                        className="text-[9px] text-[var(--color-brand-primary)] font-bold font-cairo"
                                                    >
                                                        {isRTL ? 'تغيير' : 'Change'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* User/Result Image */}
                                    <div className="relative w-full aspect-[3/4] max-w-[240px] bg-gray-100 rounded-[20px] overflow-hidden shadow-lg border border-gray-50">
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
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
                                                <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mb-3" />
                                                <Sparkles className="text-purple-400 mb-1.5 animate-pulse size-4" />
                                                <p className="font-black text-sm font-cairo">{t.product?.vto_processing || (isRTL ? 'جاري المعالجة...' : 'Processing...')}</p>
                                            </div>
                                        )}

                                        {status === 'failed' && (
                                            <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm flex flex-col items-center justify-center text-red-600 p-4 text-center">
                                                <AlertCircle size={40} className="mb-3" />
                                                <p className="font-black font-cairo text-sm">{errorMessage}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-5 bg-gray-50 border-t border-gray-100">
                            {status === 'succeeded' ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={reset}
                                        className="flex-1 h-11 bg-white border border-gray-200 rounded-xl font-black font-cairo text-gray-900 flex items-center justify-center gap-2 text-xs"
                                    >
                                        <RefreshCw size={16} />
                                        {t.product?.vto_try_another || (isRTL ? 'جرب مرة ثانية' : 'Try another')}
                                    </button>
                                    <button
                                        className="h-11 w-11 bg-[var(--color-brand-primary)] text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                                    >
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    disabled={!userImage || status === 'processing' || status === 'uploading'}
                                    onClick={status === 'failed' ? reset : (userImage ? startTryOnFlow : () => fileInputRef.current?.click())}
                                    className="w-full h-11 bg-gray-950 text-white rounded-xl font-black text-sm shadow-lg font-cairo disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                                >
                                    {status === 'failed' ? (isRTL ? 'إعادة المحاولة' : 'Retry') : (userImage ? (t.product?.vto_button || (isRTL ? 'ابدأ التجربة' : 'Start Try-On')) : (t.product?.vto_upload || (isRTL ? 'ارفع صورتك' : 'Upload photo')))}
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
