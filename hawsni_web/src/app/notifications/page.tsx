'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    ArrowLeft,
    MoreVertical,
    CheckCircle2,
    Trash2,
    ShoppingBag,
    Tag,
    Info
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    isRead: boolean;
    type: 'order' | 'promo' | 'info';
}

export default function NotificationsPage() {
    const { t, isRTL } = useLanguage();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            title: '🎉 Welcome to Hawsni!',
            message: 'Discover our new winter collection. Exclusive discounts inside!',
            time: '2 mins ago',
            isRead: false,
            type: 'promo'
        },
        {
            id: '2',
            title: 'Order Confirmed',
            message: 'Your order #HW12345 has been confirmed and is being prepared.',
            time: '1 hour ago',
            isRead: false,
            type: 'order'
        },
        {
            id: '3',
            title: 'Special Offer',
            message: 'Get 20% off on your next purchase with code: HWASI20',
            time: '5 hours ago',
            isRead: true,
            type: 'promo'
        }
    ]);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingBag size={20} className="text-emerald-500" />;
            case 'promo': return <Tag size={20} className="text-amber-500" />;
            default: return <Info size={20} className="text-blue-500" />;
        }
    };

    const getTypeBg = (type: string) => {
        switch (type) {
            case 'order': return 'bg-emerald-50';
            case 'promo': return 'bg-amber-50';
            default: return 'bg-blue-50';
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-20">
            {/* Header */}
            <header className="fixed top-0 w-full max-w-7xl mx-auto bg-[#FAFAFA] z-40 border-b border-gray-100">
                <div className="flex items-center justify-between px-4 h-16">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                    <h1 className="text-xl font-bold flex-1 text-center">
                        {t.notifications?.title || 'Notifications'}
                    </h1>
                    <button onClick={markAllAsRead} className="p-1">
                        <CheckCircle2 size={22} className="text-[var(--color-brand-primary)]" />
                    </button>
                </div>
            </header>

            <main className="pt-20 px-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-32 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                            <Bell size={40} className="text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t.notifications?.empty || 'No notifications yet'}
                        </h2>
                        <p className="text-gray-500 max-w-[260px]">
                            {t.notifications?.empty_desc || 'Updates about your orders and special offers will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {notifications.map((n) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className={`relative p-4 rounded-2xl border transition-all ${n.isRead ? 'bg-white border-gray-100' : 'bg-[#1B4D3E]/5 border-[#1B4D3E]/10'
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${getTypeBg(n.type)}`}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`font-bold text-gray-900 ${n.isRead ? 'text-base' : 'text-lg'}`}>
                                                    {n.title}
                                                </h3>
                                                <button
                                                    onClick={() => deleteNotification(n.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed mb-2">
                                                {n.message}
                                            </p>
                                            <span className="text-xs font-medium text-gray-400 uppercase tracking-tight">
                                                {n.time}
                                            </span>
                                        </div>
                                    </div>
                                    {!n.isRead && (
                                        <div className="absolute top-4 right-4 w-2 h-2 bg-[#1B4D3E] rounded-full shadow-[0_0_10px_rgba(27,77,62,0.4)]" />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Clear All Floating Button */}
            {notifications.length > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2">
                    <button
                        onClick={() => setNotifications([])}
                        className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:bg-black transition-all active:scale-95"
                    >
                        <Trash2 size={18} />
                        <span>{t.notifications?.clear_all || 'Clear All'}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
