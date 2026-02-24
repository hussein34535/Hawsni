'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, ChevronRight, Package, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import axios from '@/lib/axios';
import { motion } from 'framer-motion';

interface Order {
    _id: string;
    orderId: string;
    createdAt: string;
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    items: any[];
}

export default function OrdersPage() {
    const { t, isRTL, language } = useLanguage();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsGuest(true);
                setIsLoading(false);
                return;
            }

            try {
                const { data } = await axios.get('/orders/my-orders');
                setOrders(data || []);
            } catch (err: any) {
                console.error('Failed to fetch orders:', err);
                if (err.response?.status === 401) {
                    setIsGuest(true);
                } else {
                    setError('Failed to load orders. Please try again later.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={18} className="text-amber-500" />;
            case 'processing': return <Package size={18} className="text-blue-500" />;
            case 'shipped': return <Package size={18} className="text-indigo-500" />;
            case 'delivered': return <CheckCircle2 size={18} className="text-emerald-500" />;
            case 'cancelled': return <XCircle size={18} className="text-red-500" />;
            default: return <Clock size={18} className="text-gray-500" />;
        }
    };

    const getStatusText = (status: string) => {
        const statuses: any = {
            'pending': language === 'ar' ? 'قيد الانتظار' : 'Pending',
            'processing': language === 'ar' ? 'جاري التنفيذ' : 'Processing',
            'shipped': language === 'ar' ? 'تم الشحن' : 'Shipped',
            'delivered': language === 'ar' ? 'تم التوصيل' : 'Delivered',
            'cancelled': language === 'ar' ? 'ملغي' : 'Cancelled',
        };
        return statuses[status] || status;
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24 text-right font-cairo" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* AppBar */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-14 gap-3">
                <button onClick={() => router.back()} className={`p-2 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={22} />
                </button>
                <h1 className="text-base font-bold text-gray-900">{t.orders.title}</h1>
            </header>

            <main className="p-3 sm:p-4 max-w-2xl mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-8 h-8 border-3 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : isGuest ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[var(--shadow-soft)] mb-4">
                            <ShoppingBag size={32} strokeWidth={1.5} />
                        </div>
                        <p className="font-bold text-gray-900 mb-1 text-base">
                            {language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please Login'}
                        </p>
                        <p className="font-medium text-xs max-w-[200px] mb-6">
                            {language === 'ar' ? 'يجب تسجيل الدخول لمشاهدة طلباتك السابقة' : 'You need to login to see your order history'}
                        </p>
                        <button
                            onClick={() => router.push('/profile')}
                            className="bg-[var(--color-brand-primary)] text-white px-6 py-2.5 rounded-full font-bold shadow-md text-sm"
                        >
                            {language === 'ar' ? 'تسجيل الدخول' : 'Login Now'}
                        </button>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-10 text-red-500 text-center">
                        <XCircle size={32} strokeWidth={1.5} className="mb-3" />
                        <p className="font-bold mb-4 text-sm">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-[var(--color-brand-primary)] font-bold text-sm"
                        >
                            {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[var(--shadow-soft)] mb-4">
                            <ShoppingBag size={32} strokeWidth={1.5} />
                        </div>
                        <p className="font-medium text-center text-sm">{t.orders.empty}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-3xl p-4 shadow-sm border border-gray-50 group hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer"
                                onClick={() => router.push(`/profile/orders/${order._id}`)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            {t.orders.order_id}: #{order.orderId || order._id.slice(-8).toUpperCase()}
                                        </p>
                                        <p className="text-sm font-medium text-gray-400">
                                            {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-tight ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                                        order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                        {getStatusIcon(order.status)}
                                        {getStatusText(order.status)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">{t.orders.total}</p>
                                        <p className="text-lg font-black text-gray-900">
                                            {order.totalAmount} {language === 'ar' ? 'ج.م' : 'EGP'}
                                        </p>
                                    </div>
                                    <div className={`p-2 group-hover:bg-emerald-50 rounded-full transition-colors ${isRTL ? 'rotate-180' : ''}`}>
                                        <ChevronRight size={20} className="text-gray-300 group-hover:text-[var(--color-brand-primary)]" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
