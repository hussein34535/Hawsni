'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, XCircle, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await authService.forgotPassword(email);
            setIsSuccess(true);
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 3000);
        } catch (err: any) {
            setError(typeof err === 'string' ? err : (err.message || 'فشل إرسال كود استعادة كلمة المرور'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white" dir="rtl">
            {/* Simple Top Navigation */}
            <div className="p-4 md:p-8">
                <button 
                    onClick={() => router.push('/login')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors group"
                >
                    <ArrowLeft size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold font-cairo">العودة لتسجيل الدخول</span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[420px]">
                    <div className="text-center mb-10">
                        <div className="w-12 h-12 bg-gray-900 rounded-xl mx-auto flex items-center justify-center mb-6 shadow-xl">
                            <Lock className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 font-cairo">نسيت كلمة المرور؟</h1>
                        <p className="text-gray-500 text-sm font-bold font-cairo">أدخل بريدك الإلكتروني لتلقي كود الاستعادة</p>
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
                                <h2 className="text-xl font-black text-gray-900 font-cairo">تحقق من بريدك!</h2>
                                <p className="text-sm font-bold text-emerald-600 font-cairo leading-relaxed">
                                    أرسلنا كود التحقق إلى <br />
                                    <span dir="ltr">{email}</span>
                                </p>
                            </div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-cairo pt-2">جاري التحويل...</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-black text-gray-400 mr-1 font-cairo">البريد الإلكتروني</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-gray-300 group-focus-within:text-gray-900 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pr-11 pl-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                        placeholder="example@hwasi.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 px-6 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] font-cairo"
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>إرسال كود الاستعادة</span>
                                        <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-10 text-center">
                        <Link href="/login" className="text-sm font-black text-gray-400 hover:text-gray-900 transition-colors font-cairo">
                            تذكرت كلمة المرور؟ <span className="text-gray-900 hover:underline">تسجيل الدخول</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
