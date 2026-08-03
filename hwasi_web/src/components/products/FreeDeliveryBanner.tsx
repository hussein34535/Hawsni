'use client';

import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import apiClient from '@/lib/axios';

interface Props {
    isRTL?: boolean;
}

function timeUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

export function FreeDeliveryBanner({ isRTL = false }: Props) {
    const [seconds, setSeconds] = useState<number>(timeUntilMidnight());
    const [enabled, setEnabled] = useState<boolean | null>(null); // null = loading

    // Fetch setting from backend
    useEffect(() => {
        apiClient.get('/settings/public')
            .then(res => {
                const val = res.data?.data?.free_delivery_enabled;
                setEnabled(!!val);
            })
            .catch(() => setEnabled(false));
    }, []);

    // Countdown tick
    useEffect(() => {
        if (!enabled) return;
        const id = setInterval(() => setSeconds(timeUntilMidnight()), 1000);
        return () => clearInterval(id);
    }, [enabled]);

    if (!enabled) return null; // Hidden when off or loading

    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');

    return (
        <div
            className={`mb-6 px-4 py-3 rounded-2xl flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
            style={{
                background: 'linear-gradient(135deg, #1DBF73 0%, #0AA65B 100%)',
                boxShadow: '0 6px 20px rgba(29,191,115,0.30)',
            }}
        >
            <div className="flex-shrink-0 animate-bounce">
                <Truck size={24} className="text-white" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-white font-black text-sm font-cairo leading-tight">
                    🎉 {isRTL ? 'توصيل مجاني لمدة 24 ساعة!' : 'Free Delivery for 24 Hours!'}
                </p>
                <p className="text-white/70 text-[11px] font-cairo">
                    {isRTL ? 'العرض ينتهي في منتصف الليل' : 'Offer ends at midnight'}
                </p>
            </div>
            <div
                className="flex-shrink-0 px-3 py-1.5 rounded-xl font-black text-white text-sm tracking-widest font-cairo"
                style={{ background: 'rgba(255,255,255,0.20)' }}
                dir="ltr"
            >
                {h}:{m}:{s}
            </div>
        </div>
    );
}
