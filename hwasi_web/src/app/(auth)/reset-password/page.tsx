'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Lock, ArrowRight, XCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const email = searchParams.get('email') || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            setIsLoading(false);
            return;
        }

        try {
            await authService.resetPassword(code, password);
            setIsSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(typeof err === 'string' ? err : (err.message || 'فشل إعادة تعيين كلمة المرور'));
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
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 font-cairo">كلمة مرور جديدة</h1>
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
                        <h2 className="text-xl font-black text-gray-900 font-cairo">تم التغيير!</h2>
                        <p className="text-sm font-bold text-emerald-600 font-cairo">جاري تحويلك لصفحة الدخول...</p>
                    </div>
                </motion.div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-black text-gray-400 mr-1 font-cairo">كود التحقق</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                            required
                            maxLength={6}
                            className="w-full py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all text-center text-2xl font-black tracking-[0.2em] placeholder:text-gray-200"
                            placeholder="000000"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[13px] font-black text-gray-400 mr-1 font-cairo">كلمة المرور الجديدة</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-gray-300 group-focus-within:text-gray-900 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pr-11 pl-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[13px] font-black text-gray-400 mr-1 font-cairo">تأكيد كلمة المرور</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-gray-300 group-focus-within:text-gray-900 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full pr-11 pl-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-6 mt-2 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] font-cairo"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>تحديث كلمة المرور</span>
                                <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                            </>
                        )}
                    </button>
                </form>
            )}

            <div className="mt-8 text-center">
                <Link href="/login" className="text-sm font-black text-gray-400 hover:text-gray-900 transition-colors font-cairo border-b-2 border-transparent hover:border-gray-900/10 pb-1">
                    العودة لتسجيل الدخول
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
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
                    <span className="text-sm font-bold font-cairo">إلغاء العملية</span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <Suspense fallback={<div className="h-10 w-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
