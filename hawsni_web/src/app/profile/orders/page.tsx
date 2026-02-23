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

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await axios.get('/orders/my-orders');
                setOrders(data || []);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
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
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            {/* AppBar */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-16 gap-3">
                <button onClick={() => router.back()} className={`p-2 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{t.orders.title}</h1>
            </header>

            <main className="p-4 sm:p-6 max-w-2xl mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[var(--shadow-soft)] mb-6">
                            <ShoppingBag size={40} strokeWidth={1.5} />
                        </div>
                        <p className="font-medium text-center">{t.orders.empty}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[24px] p-5 shadow-[var(--shadow-soft)] border border-gray-50 group hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer"
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
