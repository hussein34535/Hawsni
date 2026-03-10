'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function NotificationsPage() {
    const { t, isRTL } = useLanguage();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-16 gap-3">
                <button onClick={() => router.back()} className={`p-2 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{isRTL ? 'الإشعارات' : 'Notifications'}</h1>
            </header>

            <main className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[var(--shadow-soft)] mb-8 animate-pulse">
                    <BellOff size={40} className="text-gray-300" />
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {isRTL ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
                </h2>
                <p className="text-gray-500 max-w-[280px]">
                    {isRTL ? 'سنقوم بإخطارك عندما تكون هناك تحديثات بخصوص طلباتك أو عروضنا الجديدة' : 'We will notify you when there are updates about your orders or our new offers.'}
                </p>

                <button 
                    onClick={() => router.push('/')}
                    className="mt-10 px-8 py-3 bg-[var(--color-brand-primary)] text-white rounded-full font-bold shadow-lg shadow-emerald-950/10 active:scale-95 transition-all"
                >
                    {isRTL ? 'العودة للتسوق' : 'Back to Shopping'}
                </button>
            </main>
        </div>
    );
}
