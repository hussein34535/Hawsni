'use client';

import { motion } from 'framer-motion';
import { Receipt, Tag, Truck, Info, Scissors } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface OrderReceiptProps {
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
    couponApplied: boolean;
    deliveryEstimate: { min: number; max: number } | null;
    selectedGov: string;
}

export default function OrderReceipt({
    subtotal,
    shippingFee,
    discount,
    total,
    couponApplied,
    deliveryEstimate,
    selectedGov
}: OrderReceiptProps) {
    const { isRTL } = useLanguage();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/[0.03] border border-gray-100 overflow-hidden relative"
        >
            {/* Decorative "Receipt Cut" top border */}
            <div className="absolute top-0 left-0 w-full flex justify-center gap-1 -translate-y-1/2">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-[#FAFAFA]" />
                ))}
            </div>

            <div className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-10 border-b border-gray-50 pb-6">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#0E4435]">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 font-cairo uppercase tracking-tight">
                            {isRTL ? 'إيصال الطلب' : 'Digital Receipt'}
                        </h2>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">
                            {isRTL ? 'مراجعة الأسعار والتوصيل' : 'Review prices and delivery'}
                        </p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Items Subtotal */}
                    <div className="flex justify-between items-center group">
                        <span className="text-gray-400 font-bold text-sm md:text-base group-hover:text-gray-900 transition-colors">
                            {isRTL ? 'المجموع الفرعي' : 'Subtotal'}
                        </span>
                        <span className="text-gray-900 font-black text-base md:text-lg">
                            {subtotal.toLocaleString()} <span className="text-[10px] uppercase">{isRTL ? 'ج.م' : 'EGP'}</span>
                        </span>
                    </div>

                    {/* Discount */}
                    {discount > 0 && (
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex justify-between items-center p-3 bg-red-50 rounded-2xl text-red-600"
                        >
                            <div className="flex items-center gap-2">
                                <Tag size={16} />
                                <span className="font-black text-sm">{isRTL ? 'خصم الكوبون' : 'Coupon Discount'}</span>
                            </div>
                            <span className="font-black text-base">
                                -{discount.toLocaleString()} <span className="text-[10px] uppercase">{isRTL ? 'ج.م' : 'EGP'}</span>
                            </span>
                        </motion.div>
                    )}

                    {/* Shipping */}
                    <div className="flex justify-between items-start pt-2">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-gray-400 group cursor-help">
                                <span className="font-bold text-sm md:text-base">{isRTL ? 'مصاريف الشحن' : 'Shipping Fee'}</span>
                                <Info size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {selectedGov && deliveryEstimate && (
                                <span className="text-[10px] md:text-[11px] text-[#0E4435] font-black mt-1 flex items-center gap-1">
                                    <Truck size={12} />
                                    {isRTL 
                                        ? `توصيل خلال ${deliveryEstimate.min}-${deliveryEstimate.max} أيام عمل` 
                                        : `Delivery within ${deliveryEstimate.min}-${deliveryEstimate.max} working days`}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            {!selectedGov ? (
                                <span className="text-xs text-[#0E4435] font-black underline decoration-dotted">
                                    {isRTL ? 'بانتظار العنوان' : 'Awaiting address'}
                                </span>
                            ) : (
                                <span className={`font-black text-base md:text-lg ${shippingFee === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                                    {shippingFee === 0 
                                        ? (isRTL ? '🎉 شحن مجاني' : '🎉 FREE') 
                                        : `${shippingFee.toLocaleString()} EGP`}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div className="pt-8 mt-4 border-t-2 border-dashed border-gray-100">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-gray-400 font-black text-xs uppercase tracking-widest mb-1">
                                    {isRTL ? 'المبلغ الإجمالي' : 'Grand Total'}
                                </span>
                                <span className="text-gray-950 font-black text-sm md:text-base font-cairo">
                                    {isRTL ? 'شامل ضريبة القيمة المضافة' : 'Inc. VAT & Fees'}
                                </span>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <motion.span 
                                    key={total}
                                    initial={{ scale: 1.1, color: '#059669' }}
                                    animate={{ scale: 1, color: '#0E4435' }}
                                    className="text-3xl md:text-5xl font-black leading-none"
                                >
                                    {total.toLocaleString()}
                                </motion.span>
                                <span className="text-xs font-black text-[#0E4435] mt-1 uppercase tracking-tighter">
                                    {isRTL ? 'جنيه مصري' : 'Egyptian Pounds'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secure Badge */}
                <div className="mt-10 p-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {isRTL ? 'الدفع نقداً عند الاستلام' : 'Secure Cash on Delivery'}
                    </span>
                </div>
            </div>

            {/* Serrated edge bottom */}
            <div className="h-4 w-full bg-[#FAFAFA] flex items-end">
                 <div className="w-full h-2 bg-white flex justify-around" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
            </div>
        </motion.div>
    );
}
