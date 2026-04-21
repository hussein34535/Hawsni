import { Suspense } from 'react';
import TrackOrderContent from './TrackOrderContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'تتبع الطلب | هوسي',
    description: 'تابع حالة طلبك من هوسي للأزياء لحظة بلحظة.',
};

export default function TrackOrderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] font-cairo">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#0E4435]/20 border-t-[#0E4435] rounded-full animate-spin" />
                    <p className="text-gray-400 font-bold">جاري تحميل صفحة التتبع...</p>
                </div>
            </div>
        }>
            <TrackOrderContent />
        </Suspense>
    );
}

