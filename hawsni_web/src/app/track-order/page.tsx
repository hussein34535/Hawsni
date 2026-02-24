'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Receipt, Package, Truck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function TrackOrderPage() {
    const { isRTL, t } = useLanguage();
    const router = useRouter();
    const [orderId, setOrderId] = useState('');
    const [isTracking, setIsTracking] = useState(false);

    const handleTrack = () => {
        if (!orderId) return;
        setIsTracking(true);
        // Realistic simulation: In a real app, you'd fetch order status here
        setTimeout(() => {
            // Redirect to a specific order status page if found
            // For now, we'll keep it simple or show a message
            alert(isRTL ? 'جاري البحث عن الطلب...' : 'Finding your order...');
            setIsTracking(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-cairo" dir={isRTL ? 'rtl' : 'ltr'}>
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

            <main className="max-w-xl mx-auto p-6 flex flex-col items-center justify-center mt-10">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-[#0E4435] mb-8">
                    <Package size={40} />
                </div>

                <div className="text-center mb-10 text-right">
                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                        {isRTL ? 'أدخل رقم الطلب' : 'Enter Order ID'}
                    </h2>
                    <p className="text-gray-500 font-bold opacity-60">
                        {isRTL ? 'ستجده في رسالة تأكيد الطلب التي وصلت إليك' : 'You can find it in your order confirmation message'}
                    </p>
                </div>

                <div className="w-full space-y-4">
                    <div className="relative">
                        <div className={`absolute inset-y-0 ${isRTL ? 'right-4' : 'left-4'} flex items-center pointer-events-none`}>
                            <Receipt className="w-5 h-5 text-gray-300" />
                        </div>
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder={isRTL ? 'رقم الطلب (مثلاً: #12345)' : 'Order ID (e.g. #12345)'}
                            className={`w-full ${isRTL ? 'pr-12' : 'pl-12'} py-4 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-[#0E4435] outline-none font-black text-lg text-center`}
                        />
                    </div>

                    <button
                        onClick={handleTrack}
                        disabled={!orderId || isTracking}
                        className={`w-full py-4 bg-[#0E4435] text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-950/10 transition-all ${(!orderId || isTracking) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:bg-[#0b352a]'}`}
                    >
                        {isTracking ? <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : (isRTL ? 'تتبع الآن' : 'Track Now')}
                    </button>
                </div>

                <div className="mt-16 w-full space-y-6">
                    {/* Steps simulation (Visual only) */}
                    <div className="flex items-center gap-4 opacity-30 grayscale pointer-events-none">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[#0E4435]">
                            <Package size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-gray-900 text-sm">{isRTL ? 'تم تأكيد الطلب' : 'Order Confirmed'}</p>
                        </div>
                        <CheckCircle2 size={18} className="text-[#0E4435]" />
                    </div>
                    <div className="flex items-center gap-4 opacity-30 grayscale pointer-events-none">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <Package size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-gray-900 text-sm">{isRTL ? 'جاري التجهيز' : 'Processing'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-30 grayscale pointer-events-none">
                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                            <Truck size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-gray-900 text-sm">{isRTL ? 'في الطريق إليك' : 'Out for Delivery'}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
