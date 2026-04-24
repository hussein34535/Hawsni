'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    ArrowLeft,
    CheckCircle2,
    Trash2,
    ShoppingBag,
    Tag,
    Info,
    ArrowRight,
    Sparkles,
    CircleCheck,
    BellOff,
    Settings,
    ChevronLeft,
    ChevronRight,
    Volume2
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
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingBag size={22} />;
            case 'promo': return <Sparkles size={22} />;
            default: return <Info size={22} />;
        }
    };

    const getTypeColors = (type: string) => {
        switch (type) {
            case 'order': return 'bg-emerald-500 text-white shadow-emerald-500/20';
            case 'promo': return 'bg-amber-500 text-white shadow-amber-500/20';
            default: return 'bg-[#0E4435] text-white shadow-[#0E4435]/20';
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-cairo" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header - Glassmorphism */}
            <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-20 md:h-24">
                    <button 
                        onClick={() => router.back()} 
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 active:scale-90 transition-all shadow-sm"
                    >
                        {isRTL ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
                    </button>
                    
                    <div className="flex flex-col items-center">
                        <h1 className="text-xl md:text-2xl font-black text-gray-900">
                            {isRTL ? 'التنبيهات' : 'Notifications'}
                        </h1>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-1.5 h-1.5 bg-[#0E4435] rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-[#0E4435] uppercase tracking-widest">
                                {notifications.length} {isRTL ? 'تنبيه جديد' : 'New Alerts'}
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={markAllAsRead} 
                        className="w-12 h-12 rounded-2xl bg-[#0E4435] flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-[#0E4435]/10"
                    >
                        <CheckCircle2 size={22} strokeWidth={2.5} />
                    </button>
                </div>
            </header>

            <main className="pt-28 md:pt-36 pb-24 px-4 max-w-4xl mx-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-20 md:pt-32 text-center">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative mb-10"
                        >
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl shadow-gray-200 relative z-10">
                                <BellOff size={60} className="text-gray-200" strokeWidth={1} />
                            </div>
                            {/* Decorative Rings */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-gray-100 rounded-full animate-[ping_3s_infinite]" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-gray-50 rounded-full animate-[ping_4s_infinite]" />
                        </motion.div>

                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
                            {isRTL ? 'هدوء تام هنا...' : 'Absolute silence...'}
                        </h2>
                        <p className="text-gray-400 font-bold max-w-[320px] text-base leading-relaxed">
                            {isRTL 
                                ? 'لا توجد تنبيهات حالياً. سنقوم بإبلاغك فور حدوث أي تحديث لطلبك أو عروض حصرية.' 
                                : 'No notifications yet. We will ping you when your order updates or for exclusive offers.'}
                        </p>
                        
                        <button 
                            onClick={() => router.push('/')}
                            className="mt-10 px-8 py-4 bg-[#0E4435] text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl shadow-[#0E4435]/10 flex items-center gap-2"
                        >
                            <ShoppingBag size={18} />
                            <span>{isRTL ? 'اكتشف جديدنا' : 'Explore What\'s New'}</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {notifications.map((n, idx) => (
                                <motion.div
                                    key={n.id}
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`
                                        group relative p-6 rounded-[2.5rem] border-2 transition-all duration-500
                                        ${n.isRead 
                                            ? 'bg-white/50 border-gray-50 hover:border-gray-100' 
                                            : 'bg-white border-[#0E4435]/10 shadow-2xl shadow-[#0E4435]/5 hover:shadow-[#0E4435]/10'
                                        }
                                    `}
                                >
                                    <div className="flex gap-6 items-start">
                                        <div className={`
                                            w-14 h-14 md:w-16 md:h-16 rounded-3xl flex-shrink-0 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110
                                            ${getTypeColors(n.type)}
                                        `}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={`font-black text-gray-900 leading-tight ${n.isRead ? 'text-lg' : 'text-xl md:text-2xl'}`}>
                                                    {n.title}
                                                </h3>
                                                <button
                                                    onClick={() => deleteNotification(n.id)}
                                                    className="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            
                                            <p className="text-gray-500 font-bold text-sm md:text-base leading-relaxed mb-4">
                                                {n.message}
                                            </p>
                                            
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Volume2 size={12} />
                                                    {n.time}
                                                </span>
                                                
                                                {!n.isRead && (
                                                    <motion.div 
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="px-3 py-1 bg-[#0E4435]/10 text-[#0E4435] rounded-full text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        {isRTL ? 'جديد' : 'New'}
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {!n.isRead && (
                                        <div className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} w-3 h-3 bg-[#0E4435] rounded-full ring-4 ring-[#0E4435]/10 animate-pulse`} />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {/* Summary Footer */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-10 text-center"
                        >
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                                {isRTL ? 'نهاية التنبيهات' : 'End of updates'}
                            </p>
                        </motion.div>
                    </div>
                )}
            </main>

            {/* Clear All Floating Action */}
            {notifications.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-full px-6 max-w-md">
                    <button
                        onClick={() => setNotifications([])}
                        className="w-full bg-gray-900 text-white h-16 rounded-3xl font-black shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <Trash2 size={20} className="relative z-10" />
                        <span className="relative z-10 uppercase tracking-widest text-sm">
                            {isRTL ? 'حذف كافة التنبيهات' : 'Clear All Notifications'}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
