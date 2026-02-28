'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
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
                // Update user state to reflect verified status
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
        <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative z-10" dir="rtl">
            <div className="text-center mb-10">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-16 h-16 bg-[var(--color-brand-primary)] rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20"
                >
                    <KeyRound className="text-white w-8 h-8" />
                </motion.div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">تأكيد الحساب</h1>
                <p className="text-[var(--color-text-secondary)]">
                    أدخل الكود المكون من 6 أرقام المرسل إلى <br />
                    <span className="text-[var(--color-brand-primary)] font-medium" dir="ltr">{email}</span>
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 p-4 bg-red-50 rounded-xl flex items-center text-red-600 border border-red-100"
                >
                    <XCircle className="w-5 h-5 ml-3 flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </motion.div>
            )}

            {isSuccess ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                >
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">تم التأكيد بنجاح!</h2>
                    <p className="text-[var(--color-text-secondary)]">سجلنا دخولك وجاري تحويلك للصفحة الرئيسية...</p>
                </motion.div>
            ) : (
                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-[var(--color-text-secondary)] mr-1 text-center block">كود التحقق</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                            required
                            maxLength={6}
                            className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] outline-none transition-all text-center text-3xl font-bold tracking-[0.3em] placeholder:text-gray-300"
                            placeholder="000000"
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isLoading || code.length !== 6}
                        className="w-full py-4 px-6 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-secondary)] text-white rounded-xl font-semibold shadow-lg shadow-[var(--color-brand-primary)]/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>تأكيد الحساب</span>
                                <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                            </>
                        )}
                    </motion.button>
                </form>
            )}

            <div className="mt-8 text-center space-y-4">
                <p className="text-sm text-[var(--color-text-secondary)]">
                    لم يصلك الكود؟{' '}
                    <button className="text-[var(--color-brand-primary)] font-semibold hover:underline">إعادة إرسال</button>
                </p>
                <Link href="/register" className="text-sm font-semibold text-gray-500 hover:text-gray-700 block transition-colors">
                    العودة لإنشاء حساب آخر
                </Link>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)] relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-brand-primary)] opacity-10 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] right-[-10%] w-[30%] h-[30%] bg-[var(--color-brand-accent)] opacity-10 blur-[100px] rounded-full" />

            <Suspense fallback={<div className="h-20 w-20 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />}>
                <VerifyEmailForm />
            </Suspense>
        </div>
    );
}
