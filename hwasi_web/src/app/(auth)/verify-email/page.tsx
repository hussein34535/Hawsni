'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ArrowRight, XCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setUser, user } = useAuthStore();

    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const email = searchParams.get('email') || user?.email || '';

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) return;

        setIsLoading(true);
        setError('');

        try {
            const data = await authService.verifyOtp(email, code);
            if (data.success) {
                setIsSuccess(true);
                setUser(data.user, data.token);
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } else {
                setError(data.message || 'كود غير صحيح');
            }
        } catch (err: any) {
            setError(typeof err === 'string' ? err : (err.message || 'فشل التحقق من الكود'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[420px]" dir="rtl">
            <div className="text-center mb-10">
                <div className="w-12 h-12 bg-gray-900 rounded-xl mx-auto flex items-center justify-center mb-6 shadow-xl">
                    <KeyRound className="text-white w-6 h-6" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 font-cairo">تأكيد الحساب</h1>
                <p className="text-gray-500 text-sm font-bold font-cairo">
                    أدخل الكود المرسل إلى <span className="text-gray-900" dir="ltr">{email}</span>
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 rounded-2xl flex items-center text-red-600 border border-red-100">
                    <XCircle className="w-5 h-5 ml-3 flex-shrink-0" />
                    <span className="text-xs font-bold font-cairo">{error}</span>
                </div>
            )}

            {isSuccess ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4 p-8 bg-emerald-50 rounded-3xl border border-emerald-100"
                >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-gray-900 font-cairo">تم التأكيد!</h2>
                        <p className="text-sm font-bold text-emerald-600 font-cairo">جاري تحويلك للرئيسية...</p>
                    </div>
                </motion.div>
            ) : (
                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="space-y-2 text-center">
                        <label className="text-[13px] font-black text-gray-400 font-cairo block">كود التحقق</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                            required
                            maxLength={6}
                            className="w-full py-5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all text-center text-3xl font-black tracking-[0.2em] placeholder:text-gray-200"
                            placeholder="000000"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || code.length !== 6}
                        className="w-full py-4 px-6 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] font-cairo"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>تأكيد الحساب</span>
                                <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                            </>
                        )}
                    </button>
                </form>
            )}

            <div className="mt-8 text-center space-y-6">
                <p className="text-sm font-bold text-gray-500 font-cairo">
                    لم يصلك الكود؟{' '}
                    <button className="text-gray-900 hover:underline">إعادة إرسال</button>
                </p>
                <Link href="/register" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-gray-900 transition-colors font-cairo">
                    <ArrowLeft size={14} className="rotate-180" />
                    <span>العودة لإنشاء حساب آخر</span>
                </Link>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Simple Top Navigation */}
            <div className="p-4 md:p-8">
                <button 
                    onClick={() => router.push('/login')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
                >
                    <ArrowLeft size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold font-cairo">العودة لتسجيل الدخول</span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <Suspense fallback={<div className="h-10 w-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />}>
                    <VerifyEmailForm />
                </Suspense>
            </div>
        </div>
    );
}
