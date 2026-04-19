'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShoppingBag, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface Accessory {
    name: string;
    price: number;
    image_url: string;
}

interface AccessoryUpsellModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSkip: () => void;
    onAdd: (accessories: Accessory[]) => void;
    accessories: Accessory[];
    productName: string;
    isRTL: boolean;
    formatImageUrl: (url: string) => string;
}

import { useState } from 'react';

export default function AccessoryUpsellModal({
    isOpen,
    onClose,
    onSkip,
    onAdd,
    accessories,
    productName,
    isRTL,
    formatImageUrl
}: AccessoryUpsellModalProps) {
    const [selected, setSelected] = useState<Accessory[]>([]);

    const toggleAccessory = (acc: Accessory) => {
        setSelected(prev => {
            if (prev.some(a => a.name === acc.name)) {
                return prev.filter(a => a.name !== acc.name);
            }
            return [...prev, acc];
        });
    };

    const handleConfirm = () => {
        if (selected.length > 0) {
            onAdd(selected);
        } else {
            onSkip();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col max-h-[90vh]"
                        dir={isRTL ? 'rtl' : 'ltr'}
                    >
                        {/* Custom Close Button */}
                        <button 
                            onClick={onClose}
                            className="absolute top-6 right-6 z-10 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>

                        {/* Top Gradient Header */}
                        <div className="h-2 bg-gradient-to-r from-[var(--color-brand-primary)] to-purple-500 w-full" />

                        {/* Content Area */}
                        <div className="p-8 flex flex-col flex-grow overflow-y-auto hide-scrollbar">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={20} className="text-[var(--color-brand-primary)]" />
                                <h3 className="font-cairo font-black text-[var(--color-brand-primary)] text-sm uppercase tracking-wider">
                                    {isRTL ? 'لمسة خاصة' : 'Personal Touch'}
                                </h3>
                            </div>
                            
                            <h2 className="text-2xl font-black text-gray-900 font-cairo mb-4 leading-tight">
                                {isRTL ? 'حابب تضيف لمستك للقطعة دي؟' : 'Add your special touch to this piece?'}
                            </h2>
                            
                            <p className="text-sm font-bold text-gray-500 font-cairo mb-8 opacity-80">
                                {isRTL 
                                    ? `لقينا إن الإضافات دي بتناسب ${productName} جداً.. إيه رأيك؟`
                                    : `We found that these accessories complement ${productName} perfectly.. what do you think?`}
                            </p>

                            {/* Accessories Grid */}
                            <div className="flex flex-col gap-4 mb-8">
                                {accessories.map((acc, i) => {
                                    const isSelected = selected.some(a => a.name === acc.name);
                                    return (
                                        <motion.div
                                            key={i}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleAccessory(acc)}
                                            className={`
                                                flex items-center gap-4 p-4 rounded-3xl border-2 transition-all cursor-pointer group
                                                ${isSelected 
                                                    ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 shadow-xl shadow-[var(--color-brand-primary)]/5' 
                                                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50'}
                                            `}
                                        >
                                            {/* Accessory Image (Circular) */}
                                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm bg-white">
                                                <Image 
                                                    src={formatImageUrl(acc.image_url)} 
                                                    alt={acc.name} 
                                                    fill 
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500" 
                                                />
                                            </div>

                                            {/* Accessory Info */}
                                            <div className="flex-grow">
                                                <h4 className="font-black text-gray-900 font-cairo text-base mb-0.5">{acc.name}</h4>
                                                <span className="text-[var(--color-brand-primary)] font-black text-sm">
                                                    + {acc.price} {isRTL ? 'ج.م' : 'EGP'}
                                                </span>
                                            </div>

                                            {/* Selection Indicator */}
                                            <div className={`
                                                w-7 h-7 rounded-xl flex items-center justify-center transition-all border
                                                ${isSelected 
                                                    ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white' 
                                                    : 'bg-white border-gray-200 text-transparent'}
                                            `}>
                                                <Check size={16} strokeWidth={4} />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-8 pt-0 flex flex-col gap-3">
                            <button
                                onClick={handleConfirm}
                                className={`
                                    w-full py-5 rounded-[1.5rem] font-black font-cairo text-base flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl
                                    ${selected.length > 0 
                                        ? 'bg-[var(--color-brand-primary)] text-white shadow-[var(--color-brand-primary)]/20' 
                                        : 'bg-gray-900 text-white shadow-black/10'}
                                `}
                            >
                                <ShoppingBag size={20} />
                                <span>
                                    {selected.length > 0 
                                        ? (isRTL ? `إضافة (${selected.length}) للسلة` : `Add (${selected.length}) to Cart`)
                                        : (isRTL ? 'إضافة بدون إضافات' : 'Add without accessories')}
                                </span>
                            </button>
                            
                            <button
                                onClick={onSkip}
                                className="w-full py-4 text-gray-400 font-bold font-cairo text-sm hover:text-gray-900 transition-colors"
                            >
                                {isRTL ? 'لا شكراً، اكتفيت بالقطعة الأصلية' : 'No thanks, just the original piece'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
