'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Package,
    Truck,
    ArrowRight,
    Home,
    ShoppingBag,
    Clock,
    MapPin,
    ExternalLink,
    Receipt,
    ChevronLeft,
    Check
} from 'lucide-react';
import { checkoutService } from '@/services/checkoutService';
import { useLanguage } from '@/context/LanguageContext';
import { trackEvent } from '@/components/analytics/FacebookPixel';
import { trackGAEvent } from '@/components/analytics/GoogleAnalytics';

export default function OrderSuccessPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isRTL } = useLanguage();
    const [order, setOrder] = useState<any>(null);
    const [shippingSettings, setShippingSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orderRes, settingsRes] = await Promise.all([
                    checkoutService.getOrder(id as string),
                    checkoutService.getShippingSettings()
                ]);
                if (orderRes.success) setOrder(orderRes.order);
                if (settingsRes.success) setShippingSettings(settingsRes.settings);
            } catch (error) {
                console.error('Failed to fetch order data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (order && !loading) {
            trackEvent('Purchase', {
                value: order.total_amount || order.total,
                currency: 'EGP',
                content_ids: order.order_items ? order.order_items.map((item: any) => item.product_id) : [],
                content_type: 'product',
                num_items: order.order_items ? order.order_items.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0
            }, { eventID: `order_${order.id}` });

            trackGAEvent('purchase', {
                transaction_id: order.id,
                value: order.total_amount || order.total,
                currency: 'EGP',
                items: order.order_items ? order.order_items.map((item: any) => ({
                    item_id: item.product_id,
                    item_name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })) : []
            });
        }
    }, [order, loading]);

    const formatImageUrl = (url: string) => {
        if (!url || typeof url !== 'string') return '/placeholder.png';
        if (url.startsWith('http')) return url;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hwasi.com/api';
        return `${baseUrl.replace('/api', '')}/uploads/${url.split('/').pop()}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
                <div className="w-12 h-12 border-4 border-[#0E4435] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-6 text-center">
                <h1 className="text-2xl font-black mb-4 font-cairo">{isRTL ? 'الطلب غير موجود' : 'Order Not Found'}</h1>
                <button onClick={() => router.push('/')} className="px-8 py-3 bg-black text-white rounded-2xl font-bold font-cairo">
                    {isRTL ? 'العودة للرئيسية' : 'Return Home'}
                </button>
            </div>
        );
    }

    const gov = typeof order.shipping_address === 'object' ? order.shipping_address.state : '';
    const govSettings = shippingSettings?.governorate_settings?.[gov];
    const minDays = govSettings?.days_min || shippingSettings?.default_days_min || 3;
    const maxDays = govSettings?.days_max || shippingSettings?.default_days_max || 5;

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-24 font-cairo" dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* Header / Nav */}
            <nav className="h-20 bg-white/50 backdrop-blur-md border-b border-gray-100 flex items-center px-6 sticky top-0 z-50">
                <button 
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors font-black text-xs uppercase tracking-widest"
                >
                    {isRTL ? <ChevronLeft className="rotate-180" /> : <ChevronLeft />}
                    {isRTL ? 'العودة للتسوق' : 'Back to Shopping'}
                </button>
            </nav>

            <main className="max-w-4xl mx-auto px-6 pt-12 md:pt-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left Side: Success Message */}
                    <div className="lg:col-span-7 space-y-10">
                        <section className="space-y-6">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", damping: 15 }}
                                className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30"
                            >
                                <Check size={40} strokeWidth={4} />
                            </motion.div>
                            
                            <div className="space-y-4">
                                <motion.h1 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl md:text-6xl font-black text-gray-900 leading-tight"
                                >
                                    {isRTL ? 'تم تأكيد طلبك بنجاح!' : 'Order confirmed successfully!'}
                                </motion.h1>
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-gray-400 font-bold text-lg md:text-xl leading-relaxed"
                                >
                                    {isRTL 
                                        ? `رقم الطلب #${order.id?.toUpperCase().substring(0, 8)}. نحن الآن نجهز طلبك بكل حب لنرسله إليك في أسرع وقت.` 
                                        : `Order #${order.id?.toUpperCase().substring(0, 8)}. We are preparing your items with love to ship them as soon as possible.`}
                                </motion.p>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="p-8 bg-white rounded-[2rem] border border-gray-100 flex flex-col gap-4 shadow-sm"
                            >
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#0E4435]">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">
                                        {isRTL ? 'التوصيل المتوقع' : 'Delivery Estimate'}
                                    </h4>
                                    <p className="text-lg font-black text-gray-900">
                                        {isRTL ? `${minDays} - ${maxDays} أيام عمل` : `${minDays} - ${maxDays} Working Days`}
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="p-8 bg-white rounded-[2rem] border border-gray-100 flex flex-col gap-4 shadow-sm"
                            >
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">
                                        {isRTL ? 'عنوان الشحن' : 'Shipping To'}
                                    </h4>
                                    <p className="text-lg font-black text-gray-900 line-clamp-1">
                                        {order.shipping_address?.street || order.shipping_address?.city || order.shipping_address?.state || 'Address Saved'}
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        <div className="pt-6">
                            <button 
                                onClick={() => router.push(`/track-order?id=${order.id}`)}
                                className="w-full md:w-auto px-10 py-5 bg-[#0E4435] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/10 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <span>{isRTL ? 'تتبع الطلب الآن' : 'Track Order Now'}</span>
                                <ExternalLink size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Order Receipt Style */}
                    <div className="lg:col-span-5">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/[0.02] border border-gray-100 overflow-hidden relative"
                        >
                            {/* Receipt Cut Effect */}
                            <div className="absolute top-0 left-0 w-full flex justify-center gap-1 -translate-y-1/2">
                                {[...Array(15)].map((_, i) => (
                                    <div key={i} className="w-4 h-4 rounded-full bg-[#FAFAFA]" />
                                ))}
                            </div>

                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-5">
                                    <Receipt className="text-gray-300" />
                                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                                        {isRTL ? 'تفاصيل الطلب' : 'Order Summary'}
                                    </h2>
                                </div>

                                <div className="space-y-6">
                                    {order.order_items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="w-16 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 p-1">
                                                <img 
                                                    src={formatImageUrl(item.products?.images?.[0] || item.image_url)}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain mix-blend-multiply"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-gray-900 text-sm truncate">{item.name}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                    {isRTL ? 'الكمية:' : 'Qty:'} {item.quantity} | {item.size || 'Standard'}
                                                </p>
                                                <p className="text-sm font-black text-[#0E4435] mt-1">
                                                    {item.price?.toLocaleString()} EGP
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-6 mt-6 border-t-2 border-dashed border-gray-100 space-y-3">
                                        <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                                            <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                            <span className="text-gray-900">{(order.subtotal || 0).toLocaleString()} EGP</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                                            <span>{isRTL ? 'الشحن' : 'Shipping'}</span>
                                            <span className="text-gray-900">{(order.shipping_fee || 0).toLocaleString()} EGP</span>
                                        </div>
                                        {order.discount > 0 && (
                                            <div className="flex justify-between items-center text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                                                <span>{isRTL ? 'خصم مطبق' : 'Discount Applied'}</span>
                                                <span>-{(order.discount || 0).toLocaleString()} EGP</span>
                                            </div>
                                        )}
                                        <div className="pt-4 flex justify-between items-end">
                                            <div>
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">
                                                    {isRTL ? 'القيمة الإجمالية' : 'Total Amount'}
                                                </span>
                                                <span className="text-xs font-black text-[#0E4435] bg-emerald-50 px-2 py-0.5 rounded-md">
                                                    {isRTL ? 'الدفع عند الاستلام' : 'Paid by COD'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-3xl font-black text-[#0E4435] leading-none">
                                                    {(order.total_amount || order.total)?.toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-black text-[#0E4435] block uppercase">EGP</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Serrated edge bottom */}
                            <div className="h-4 w-full bg-[#FAFAFA] flex items-end">
                                <div className="w-full h-2 bg-white flex justify-around" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-20 text-center space-y-4"
                >
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest leading-loose max-w-md mx-auto">
                        {isRTL 
                            ? 'لقد تم إرسال تفاصيل الطلب كاملة إلى بريدك الإلكتروني. شكراً لثقتك في هوسني.' 
                            : 'Full order details have been sent to your email. Thank you for trusting Hawsni.'}
                    </p>
                    <div className="flex justify-center items-center gap-6 opacity-30 grayscale pt-4">
                        <ShoppingBag size={20} />
                        <Package size={20} />
                        <CheckCircle2 size={20} />
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
