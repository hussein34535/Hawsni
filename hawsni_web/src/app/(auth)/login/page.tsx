'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const { setUser } = useAuthStore();
    const { isRTL } = useLanguage();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await authService.login(email, password);
            if (data.success) {
                setUser(data.user, data.token);
                if (data.refresh_token) {
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
                router.push('/');
            } else {
                setError(data.message || 'فشل تسجيل الدخول');
            }
        } catch (err: any) {
            setError(typeof err === 'string' ? err : (err.message || 'خطأ في الاتصال بالسيرفر'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white" dir="rtl">
            {/* Simple Top Navigation */}
            <div className="p-4 md:p-8">
                <button 
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
                >
                    <ArrowLeft size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold font-cairo">العودة للرئيسية</span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[420px]">
                    <div className="text-center mb-10">
                        <div className="w-12 h-12 bg-gray-900 rounded-xl mx-auto flex items-center justify-center mb-6 shadow-xl">
                            <span className="text-white text-xl font-black">H</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 font-cairo">تسجيل الدخول</h1>
                        <p className="text-gray-500 text-sm font-bold font-cairo">أهلاً بك مجدداً في هوسي</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-2xl flex items-center text-red-600 border border-red-100">
                            <XCircle className="w-5 h-5 ml-3 flex-shrink-0" />
                            <span className="text-xs font-bold font-cairo">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
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

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between mr-1">
                                <label className="text-[13px] font-black text-gray-400 font-cairo">كلمة المرور</label>
                                <Link href="/forgot-password" title="forgot-password">
                                    <span className="text-[12px] font-black text-gray-900 hover:opacity-70 transition-opacity font-cairo">
                                        نسيت كلمة المرور؟
                                    </span>
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-300 group-focus-within:text-gray-900 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pr-11 pl-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                    placeholder="••••••••"
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
                                    <span>دخول</span>
                                    <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm font-bold font-cairo">
                            ليس لديك حساب؟{' '}
                            <Link href="/register" title="register">
                                <span className="text-gray-900 hover:underline">
                                    إنشاء حساب جديد
                                </span>
                            </Link>
                        </p>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-4">
                        <div className="h-[1px] flex-1 bg-gray-100" />
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest font-cairo">أو</span>
                        <div className="h-[1px] flex-1 bg-gray-100" />
                    </div>

                    <div className="mt-8 flex justify-center">
                        <Link href="/?guest=true" title="guest">
                            <span className="text-sm font-black text-gray-400 hover:text-gray-900 transition-colors font-cairo border-b-2 border-transparent hover:border-gray-900/10 pb-1">
                                تصفح كضيوف
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
