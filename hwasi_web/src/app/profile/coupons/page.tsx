'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Ticket, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { couponService, Coupon } from '@/services/couponService';

export default function CouponsPage() {
    const { t, isRTL, language } = useLanguage();
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const data = await couponService.getCoupons();
                setCoupons(data.coupons || []);
            } catch (error) {
                console.error('Failed to fetch coupons:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCoupons();
    }, []);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-16 gap-3">
                <button onClick={() => router.back()} className={`p-2 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{t.coupons.title}</h1>
            </header>

            <main className="p-4 sm:p-6 max-w-2xl mx-auto">
                <div className="space-y-4">
                    {coupons.map((coupon) => (
                        <motion.div
                            key={coupon._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[24px] overflow-hidden shadow-[var(--shadow-soft)] border border-gray-50 flex"
                        >
                            {/* Left Side (Discount) */}
                            <div className="w-24 bg-emerald-50 flex flex-col items-center justify-center border-r border-dashed border-emerald-200">
                                <span className="text-[20px] font-black text-[var(--color-brand-primary)]">
                                    {coupon.discountAmount}{coupon.discountType === 'percentage' ? '%' : ''}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                                    {coupon.discountType === 'percentage' ? 'OFF' : 'EGP'}
                                </span>
                            </div>

                            {/* Right Side (Details) */}
                            <div className="flex-1 p-5 relative">
                                <h3 className="text-[16px] font-bold text-gray-900 mb-1">{coupon.code}</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    {language === 'ar' ? 'خصم خاص لك' : 'Special discount for you'}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                                        <span>{t.coupons.expiry}:</span>
                                        <span>{coupon.expiryDate}</span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(coupon.code)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-bold ${copiedCode === coupon.code
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-emerald-50 text-[var(--color-brand-primary)] hover:bg-emerald-100'
                                            }`}
                                    >
                                        {copiedCode === coupon.code ? (
                                            <>
                                                <CheckCircle2 size={14} />
                                                {language === 'ar' ? 'تم النسخ' : 'Copied'}
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} />
                                                {t.coupons.copy}
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Punch Holes (Visual) */}
                                <div className="absolute top-1/2 -left-2 w-4 h-4 bg-[var(--color-bg-secondary)] rounded-full -translate-y-1/2" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
