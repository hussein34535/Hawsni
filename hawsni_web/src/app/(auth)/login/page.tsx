'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { cartService } from '@/services/cartService';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const { setUser } = useAuthStore();
    const { items, setItems } = useCartStore();
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

                // Sync Cart Data
                try {
                    const syncData = await cartService.syncCart(items);
                    if (syncData.success && syncData.cart && syncData.cart.items) {
                        // The backend might return items in a different format, we need to map them back
                        // if the backend structure differs, but assuming backend returns valid CartItems
                        // Wait, backend returns { productId, quantity, size, color, accessories, id, price, ... }
                        // For safety, we just overwrite the local state with the server state if it's formatted.
                        // Assuming the backend returns items mapped to the frontend's CartItem interface
                        setItems(syncData.cart.items as any[]);
                    }
                } catch (syncErr) {
                    console.error('Failed to sync cart after login:', syncErr);
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
            <div className="p-4 md:p-6">
                <button 
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
                >
                    <ArrowLeft size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold font-cairo">العودة للرئيسية</span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[400px]">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-[#0E4435] rounded-xl mx-auto flex items-center justify-center mb-4 shadow-xl">
                            <span className="text-white text-xl font-black">H</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1 font-cairo">تسجيل الدخول</h1>
                        <p className="text-gray-500 text-sm font-bold font-cairo">أهلاً بك مجدداً في هوسي</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 rounded-xl flex items-center text-red-600 border border-red-100">
                            <XCircle className="w-5 h-5 ml-2 flex-shrink-0" />
                            <span className="text-xs font-bold font-cairo">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 mr-1 font-cairo">البريد الإلكتروني</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-300 group-focus-within:text-[#0E4435] transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#0E4435]/20 focus:ring-4 focus:ring-[#0E4435]/5 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                    placeholder="example@hwasi.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between mr-1">
                                <label className="text-xs font-black text-gray-400 font-cairo">كلمة المرور</label>
                                <Link href="/forgot-password" title="forgot-password">
                                    <span className="text-[11px] font-black text-[#0E4435] hover:opacity-70 transition-opacity font-cairo">
                                        نسيت كلمة المرور؟
                                    </span>
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-300 group-focus-within:text-[#0E4435] transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#0E4435]/20 focus:ring-4 focus:ring-[#0E4435]/5 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-6 mt-2 bg-[#0E4435] hover:bg-[#0a3126] text-white rounded-xl font-black text-sm shadow-xl shadow-[#0E4435]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] font-cairo"
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

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-xs font-bold font-cairo">
                            ليس لديك حساب؟{' '}
                            <Link href="/register" title="register">
                                <span className="text-[#0E4435] hover:underline">
                                    إنشاء حساب جديد
                                </span>
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-4">
                        <div className="h-[1px] flex-1 bg-gray-100" />
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest font-cairo">أو</span>
                        <div className="h-[1px] flex-1 bg-gray-100" />
                    </div>

                    <button
                        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback-handler` } })}
                        className="w-full py-3 px-6 bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-900 rounded-xl font-black text-sm shadow-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98] font-cairo mt-5"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        <span>تسجيل بجوجل</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
