'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    CheckCircle2, 
    ArrowRight, 
    ShoppingBag, 
    Truck, 
    MapPin, 
    Phone, 
    Calendar,
    ChevronLeft,
    Share2,
    Download,
    PartyPopper,
    Sparkles,
    Check
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { checkoutService } from '@/services/checkoutService';
import { useLanguage } from '@/context/LanguageContext';
import confetti from 'canvas-confetti';

export default function OrderSuccessPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isRTL } = useLanguage();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await checkoutService.getOrderById(id as string);
                if (res.success) setOrder(res.order);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();

        // Trigger Confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-16 h-16 border-4 border-[#0E4435] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-black text-[#0E4435] animate-pulse uppercase tracking-[0.3em]">Processing Your Joy...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-cairo pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
            <main className="max-w-4xl mx-auto px-4 pt-16 md:pt-24">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-24 h-24 md:w-32 md:h-32 bg-emerald-500 rounded-[2.5rem] mx-auto mb-8 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 relative"
                    >
                        <Check size={48} md:size={64} strokeWidth={4} />
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] -z-10"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter">
                            {isRTL ? 'مبروك، تم تأكيد طلبك!' : 'Yay! Order Confirmed!'}
                        </h1>
                        <p className="text-gray-400 font-bold text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
                            {isRTL 
                                ? 'طلبك الآن في طريقه للتجهيز. فريق هوسي يعمل بكل حب لتصلك القطع في أسرع وقت.' 
                                : 'Your order is being prepared. Hawsni team is working with love to deliver your pieces ASAP.'}
                        </p>
                    </motion.div>
                </div>

                {/* Order Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 overflow-hidden border border-white"
                >
                    <div className="p-8 md:p-12 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#0E4435] shadow-sm">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">{isRTL ? 'رقم الطلب' : 'Order ID'}</p>
                                <p className="text-xl font-black text-gray-900 uppercase tracking-tight">#{id?.slice(-8)}</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-black text-sm text-gray-900 hover:bg-gray-50 transition-all active:scale-95">
                                <Share2 size={16} />
                                <span>{isRTL ? 'مشاركة' : 'Share'}</span>
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 bg-[#0E4435] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#0E4435]/10 hover:scale-105 transition-all active:scale-95">
                                <Download size={16} />
                                <span>{isRTL ? 'الفاتورة' : 'Invoice'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Delivery Info */}
                        <div className="space-y-8">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <Truck size={22} className="text-emerald-500" />
                                {isRTL ? 'معلومات التوصيل' : 'Delivery Details'}
                            </h3>
                            
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">{isRTL ? 'العنوان' : 'Address'}</p>
                                        <p className="font-bold text-gray-900 leading-relaxed">
                                            {order?.shippingAddress?.street}, {order?.shippingAddress?.city}<br />
                                            {order?.shippingAddress?.state}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">{isRTL ? 'التوصيل المتوقع' : 'Est. Delivery'}</p>
                                        <p className="font-bold text-emerald-600">خلال 3 - 5 أيام عمل</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="bg-gray-50/50 rounded-[2rem] p-8 space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                                <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                <span className="text-gray-900">{order?.subtotal?.toLocaleString()} EGP</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                                <span>{isRTL ? 'الشحن' : 'Shipping'}</span>
                                <span className="text-emerald-600">{order?.shippingFee === 0 ? (isRTL ? 'مجاناً' : 'FREE') : `${order?.shippingFee?.toLocaleString()} EGP`}</span>
                            </div>
                            {order?.discount > 0 && (
                                <div className="flex justify-between items-center text-sm font-black text-red-500 uppercase tracking-tight">
                                    <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                                    <span>-{order?.discount?.toLocaleString()} EGP</span>
                                </div>
                            )}
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">{isRTL ? 'الإجمالي المدفوع' : 'Total Amount'}</p>
                                    <p className="text-xs font-black text-[#0E4435] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 inline-block">
                                        {isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-4xl font-black text-gray-900 tracking-tighter">{order?.totalAmount?.toLocaleString()}</span>
                                    <span className="text-xs font-black text-gray-400 ml-1 uppercase">EGP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Bottom Actions */}
                <div className="mt-16 flex flex-col md:flex-row gap-4 justify-center items-center">
                    <button 
                        onClick={() => router.push('/')}
                        className="w-full md:w-auto px-12 py-5 bg-[#0E4435] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-[#0E4435]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <span>{isRTL ? 'العودة للتسوق' : 'Back to Shopping'}</span>
                        <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                    
                    <button 
                        onClick={() => router.push('/profile/orders')}
                        className="w-full md:w-auto px-12 py-5 bg-white text-gray-900 rounded-[2rem] font-black text-lg border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        {isRTL ? 'تتبع طلبي' : 'Track My Order'}
                    </button>
                </div>

                <div className="mt-20 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-50 shadow-sm mb-6">
                        <Sparkles size={14} className="text-amber-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {isRTL ? 'انضم لآلاف العملاء السعداء' : 'Join thousands of happy customers'}
                        </span>
                    </div>
                </div>
            </main>
        </div>
    );
}
