'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    ArrowRight,
    Receipt,
    Package,
    Truck,
    CheckCircle2,
    Calendar,
    MapPin,
    AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { checkoutService } from '@/services/checkoutService';
import { motion, AnimatePresence } from 'framer-motion';

function TrackOrderContent() {
    const { isRTL } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState(searchParams.get('id') || searchParams.get('order_number') || '');
    const [isTracking, setIsTracking] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [error, setError] = useState('');

    const handleTrack = useCallback(async (idToTrack?: string) => {
        const id = idToTrack || orderId;
        if (!id) return;

        setIsTracking(true);
        setError('');
        setOrder(null);

        try {
            // id could be a UUID or an order_number. The backend getOrderById handles both.
            const res = await checkoutService.getOrder(id.replace('#', ''));
            if (res.success) {
                setOrder(res.order);
            } else {
                setError(isRTL ? 'الطلب غير موجود' : 'Order not found');
            }
        } catch (err: any) {
            setError(isRTL ? 'حدث خطأ في البحث' : 'Failed to track order');
        } finally {
            setIsTracking(false);
        }
    }, [orderId, isRTL]);

    useEffect(() => {
        const id = searchParams.get('id') || searchParams.get('order_number');
        if (id) {
            handleTrack(id);
        }
    }, [searchParams, handleTrack]);

    const getStatusIndex = (status: string) => {
        const statuses = ['Processing', 'Shipped', 'Delivered'];
        return statuses.indexOf(status);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-cairo" dir="ltr">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
                    >
                        {isRTL ? <ArrowRight className="w-5 h-5 text-gray-900" /> : <ArrowLeft className="w-5 h-5 text-gray-900" />}
                    </button>
                    <h1 className="text-lg font-black text-gray-900">
                        {isRTL ? 'تتبع طلبك' : 'Track Your Order'}
                    </h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-6 mt-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-[#0E4435] mb-6">
                        <Package size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                        {isRTL ? 'أين شحنتك؟' : 'Where is your package?'}
                    </h2>
                    <p className="text-gray-500 font-bold opacity-60 text-center">
                        {isRTL ? 'أدخل رقم الطلب لمتابعة حالة التوصيل الحالية' : 'Enter your order ID to see current delivery status'}
                    </p>
                </div>

                <div className="w-full space-y-4 mb-12">
                    <div className="relative">
                        <div className={`absolute inset-y-0 ${isRTL ? 'right-4' : 'left-4'} flex items-center pointer-events-none`}>
                            <Receipt className="w-5 h-5 text-gray-300" />
                        </div>
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder={isRTL ? 'رقم الطلب (مثلاً: #12345)' : 'Order ID (e.g. #12345)'}
                            className={`w-full ${isRTL ? 'pr-12' : 'pl-12'} py-5 bg-white rounded-[1.5rem] border-none shadow-sm focus:ring-2 focus:ring-[#0E4435] outline-none font-black text-lg text-center`}
                        />
                    </div>

                    <button
                        onClick={() => handleTrack()}
                        disabled={!orderId || isTracking}
                        className={`w-full py-5 bg-[#0E4435] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-emerald-950/20 transition-all ${(!orderId || isTracking) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:bg-[#0b352a]'}`}
                    >
                        {isTracking ? <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : (isRTL ? 'تتبع الآن' : 'Track Now')}
                    </button>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
                        >
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}
                </div>

                {/* Tracking Results */}
                <AnimatePresence>
                    {order && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-black/[0.02]"
                        >
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50 text-right">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-400 font-bold">#{order.id?.toUpperCase().substring(0, 8)}</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(order.id)}
                                            title="نسخ المعرف الكامل"
                                            className="text-gray-300 hover:text-[#0E4435] transition-colors"
                                        >
                                            <Receipt size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 font-bold mt-1">
                                        {isRTL ? 'تم الطلب في:' : 'Ordered on:'} {new Date(order.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                                    </p>
                                </div>
                                <div className="bg-emerald-50 px-4 py-2 rounded-2xl">
                                    <span className="text-[#0E4435] font-black text-xs">{isRTL ? 'نشط' : 'Active'}</span>
                                </div>
                            </div>

                            <div className="space-y-10 relative">
                                {/* Journey Line */}
                                <div className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-2 bottom-2 w-0.5 bg-gray-100 z-0`}></div>

                                {[
                                    { key: 'Processing', label: isRTL ? 'تم استقبال الطلب' : 'Order Received', desc: isRTL ? 'جاري تجهيز طلبك في مستودعاتنا' : 'We are preparing your order in our warehouse', icon: Package, color: 'emerald' },
                                    { key: 'Shipped', label: isRTL ? 'في الطريق' : 'In Transit', desc: isRTL ? 'طلبك مع مندوب الشحن الآن' : 'Your order is on the way with delivery partner', icon: Truck, color: 'blue' },
                                    { key: 'Delivered', label: isRTL ? 'تم التوصيل' : 'Delivered', desc: isRTL ? 'تم تسليم الشحنة بنجاح' : 'Package has been delivered successfully', icon: CheckCircle2, color: 'emerald' }
                                ].map((step, idx) => {
                                    const currentIndex = getStatusIndex(order.status);
                                    const isCompleted = idx <= currentIndex;
                                    const isActive = idx === currentIndex;

                                    return (
                                        <div key={idx} className={`relative z-10 flex gap-6 ${isCompleted ? 'opacity-100' : 'opacity-30'}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${isCompleted ? 'bg-[#0E4435] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <step.icon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`font-black text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</h4>
                                                    {isActive && (
                                                        <span className="text-[10px] bg-emerald-100 text-[#0E4435] px-2 py-0.5 rounded-full font-black animate-pulse">
                                                            {isRTL ? 'الحالة الحالية' : 'Current Status'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-400 font-bold mt-1 leading-relaxed">
                                                    {step.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Package Contents (NEW) */}
                            <div className="mt-12 pt-8 border-t border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Package size={20} className="text-[#0E4435]" />
                                    {isRTL ? 'محتويات الشحنة' : 'Package Contents'}
                                </h3>
                                <div className="space-y-4">
                                    {(order.order_items || order.items || []).map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 bg-white">
                                                <img 
                                                    src={item.image_url || item.products?.images?.[0] || '/placeholder.png'} 
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-gray-900 text-sm leading-tight mb-1">{item.name || item.products?.name}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.size && (
                                                        <span className="text-[10px] font-bold text-gray-400">
                                                            {isRTL ? 'مقاس:' : 'Size:'} {item.size}
                                                        </span>
                                                    )}
                                                    {item.color && (
                                                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                            {isRTL ? 'لون:' : 'Color:'}
                                                            {item.color.startsWith('#') && (
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                            )}
                                                            {item.color}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-black text-[#0E4435]">x{item.quantity}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-gray-900 text-sm">{(item.price * item.quantity).toLocaleString()} ج.م</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                                    <span className="font-bold text-gray-500 text-sm">{isRTL ? 'إجمالي الطلب' : 'Order Total'}</span>
                                    <span className="font-black text-gray-900 text-lg">{order.total?.toLocaleString()} ج.م</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

export default function TrackOrderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-[#0E4435] border-t-transparent rounded-full animate-spin"></div></div>}>
            <TrackOrderContent />
        </Suspense>
    );
}
