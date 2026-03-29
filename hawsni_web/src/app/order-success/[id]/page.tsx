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
    ExternalLink
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
            // Send client-side Purchase event to Meta Pixel (de-duplicated by event_id on backend CAPI)
            trackEvent('Purchase', {
                value: order.total_amount || order.total,
                currency: 'EGP',
                content_ids: order.order_items ? order.order_items.map((item: any) => item.product_id) : [],
                content_type: 'product',
                num_items: order.order_items ? order.order_items.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0
            }, { eventID: `order_${order.id}` }); // This eventID matches the one sent by the CAPI server

            // Send Purchase event to GA4
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
                <h1 className="text-2xl font-black mb-4">{isRTL ? 'الطلب غير موجود' : 'Order Not Found'}</h1>
                <button onClick={() => router.push('/')} className="px-8 py-3 bg-black text-white rounded-2xl font-bold">
                    {isRTL ? 'العودة للرئيسية' : 'Return Home'}
                </button>
            </div>
        );
    }

    // Determine delivery days
    const gov = typeof order.shipping_address === 'object' ? order.shipping_address.state : '';
    const govSettings = shippingSettings?.governorate_settings?.[gov];
    const minDays = govSettings?.days_min || shippingSettings?.default_days_min || 3;
    const maxDays = govSettings?.days_max || shippingSettings?.default_days_max || 5;

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-20 font-cairo" dir="ltr">
            <main className="max-w-2xl mx-auto px-6 pt-12">

                {/* Header Section */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle2 className="w-12 h-12 text-[#0E4435]" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-black text-gray-900 mb-3"
                    >
                        {isRTL ? 'شكراً لطلبك!' : 'Thank you for your order!'}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 font-bold"
                    >
                        {isRTL
                            ? `تم استلام طلبك رقم #${order.id?.toUpperCase().substring(0, 8)} بنجاح. سنرسل لك إشعاراً بمجرد شحنه.`
                            : `Order #${order.id?.toUpperCase().substring(0, 8)} received successfully. We'll notify you once it's shipped.`}
                    </motion.p>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4 shadow-sm"
                    >
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#0E4435]">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">
                                {isRTL ? 'التوصيل المتوقع' : 'Estimated Delivery'}
                            </p>
                            <p className="text-sm font-black text-gray-900 leading-none">
                                {isRTL ? `${minDays} - ${maxDays} أيام عمل` : `${minDays} - ${maxDays} Working Days`}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4 shadow-sm"
                    >
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">
                                {isRTL ? 'حالة الطلب' : 'Order Status'}
                            </p>
                            <p className="text-sm font-black text-gray-900 leading-none">
                                {isRTL ? 'قيد المعالجة' : 'Processing'}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* 12-hour Contact Notice */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 mb-6 flex gap-4 items-start"
                    dir="rtl"
                >
                    <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xl">📞</span>
                    </div>
                    <div>
                        <p className="text-sm font-black text-amber-800 mb-1">
                            {isRTL ? 'ملاحظة هامة' : 'Important Note'}
                        </p>
                        <p className="text-xs text-amber-700 font-bold leading-relaxed">
                            {isRTL
                                ? 'قد يتواصل معكم أحد أفراد فريقنا خلال 12 ساعة للتأكد من بعض تفاصيل الطلب. نرجو الرد على أي اتصال أو رسالة لضمان وصول طلبكم في أسرع وقت ممكن.'
                                : 'Our team may contact you within 12 hours to confirm some order details. Please respond to any call or message to ensure the fastest possible delivery.'}
                        </p>
                    </div>
                </motion.div>

                {/* Items Summary */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-[2.5rem] p-8 border border-gray-100 mb-8 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <ShoppingBag className="w-6 h-6 text-[#0E4435]" />
                            <h2 className="text-lg font-black text-gray-900">{isRTL ? 'ملخص المنتجات' : 'Items Summary'}</h2>
                        </div>
                        <span className="bg-gray-50 px-4 py-1.5 rounded-full text-xs font-black text-gray-400">
                            {order.order_items?.length} {isRTL ? 'منتجات' : 'Items'}
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {order.order_items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-4 items-center">
                                <div className="w-20 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 p-2">
                                    <img
                                        src={formatImageUrl(item.products?.images?.[0] || item.image_url)}
                                        alt={item.name}
                                        className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-gray-900 text-sm mb-1 leading-snug">{item.name}</h4>
                                    <p className="text-[11px] text-gray-400 font-bold">
                                        {isRTL ? 'الكمية:' : 'Qty:'} {item.quantity} | {item.size || (isRTL ? 'بدون مقاس' : 'No Size')}
                                    </p>
                                    <p className="text-sm font-black text-[#0E4435] mt-1">
                                        {item.price.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-gray-400 font-bold">{isRTL ? 'إجمالي المبلغ' : 'Total Amount'}</span>
                        <div className="text-right">
                            <span className="text-2xl font-black text-[#0E4435]">
                                {order.total_amount?.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-[#0E4435] ml-1">{isRTL ? 'ج.م' : 'EGP'}</span>
                        </div>
                    </div>
                </motion.section>

                {/* Actions */}
                <div className="space-y-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(`/track-order?id=${order.id}`)}
                        className="w-full py-5 bg-[#0E4435] text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/20"
                    >
                        <span>{isRTL ? 'تتبع طلبك الآن' : 'Track Your Order Now'}</span>
                        <ExternalLink className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/')}
                        className="w-full py-5 bg-white text-gray-900 border border-gray-100 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-sm"
                    >
                        <Home className="w-5 h-5" />
                        <span>{isRTL ? 'العودة للتسوق' : 'Continue Shopping'}</span>
                    </motion.button>
                </div>

                <p className="mt-12 text-center text-xs text-gray-400 font-bold leading-relaxed px-10">
                    {isRTL
                        ? 'سيصلك بريد إلكتروني يحتوي على تفاصيل الطلب وكود التتبع بمجرد تجهيز الشحنة.'
                        : 'You will receive an email with order details and tracking code once the shipment is prepared.'}
                </p>

            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #eee;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
