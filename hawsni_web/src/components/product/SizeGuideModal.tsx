'use client';

import { X, Ruler, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    sizeGuide?: string;
}

export default function SizeGuideModal({ isOpen, onClose, sizeGuide }: SizeGuideModalProps) {
    const { t, isRTL } = useLanguage();

    // Default guide if none provided
    const guideContent = sizeGuide || (isRTL
        ? "S = الصدر 50 سم، الطول 70 سم\nM = الصدر 52 سم، الطول 72 سم\nL = الصدر 54 سم، الطول 74 سم\nXL = الصدر 56 سم، الطول 76 سم"
        : "S = Chest 50cm, Length 70cm\nM = Chest 52cm, Length 72cm\nL = Chest 54cm, Length 74cm\nXL = Chest 56cm, Length 76cm");

    const items = guideContent
        .split(/[,،\n]/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[101] max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
                        </div>

                        {/* Title Bar */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[var(--color-brand-primary)]/10 rounded-xl flex items-center justify-center">
                                    <Ruler size={20} className="text-[var(--color-brand-primary)]" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 font-cairo">
                                    {t.product?.size_guide || (isRTL ? 'دليل المقاسات' : 'Size Guide')}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {items.map((item, idx) => {
                                const parts = item.split('=');
                                const hasKeyVal = parts.length > 1;
                                const key = hasKeyVal ? parts[0].trim() : '';
                                const val = hasKeyVal ? parts.slice(1).join('=').trim() : item;

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className="bg-white border border-gray-100 p-5 rounded-[20px] shadow-sm flex items-center justify-between"
                                    >
                                        {hasKeyVal ? (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-50 text-[var(--color-brand-primary)] rounded-lg flex items-center justify-center font-black text-lg">
                                                        {key}
                                                    </div>
                                                    <div className={`h-px w-10 bg-gray-100 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                                                </div>
                                                <span className="font-bold text-gray-700 font-cairo text-[16px]">
                                                    {val}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="font-medium text-gray-600 font-cairo text-sm leading-relaxed">
                                                {item}
                                            </span>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Footer Action */}
                        <div className="p-6 pt-2">
                            <button
                                onClick={onClose}
                                className="w-full h-14 bg-gray-950 text-white rounded-2xl font-black text-lg shadow-xl shadow-black/10 hover:bg-gray-800 transition-all font-cairo active:scale-95"
                            >
                                {isRTL ? 'فهمت' : 'Got it'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Add polyfill for where just in case, or just map/filter
// Re-writing to use filter
function getItems(content: string) {
    return content
        .split(/[,،\n]/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);
}
