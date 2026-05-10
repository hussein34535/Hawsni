'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Lock, Phone, ArrowRight, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/context/LanguageContext';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const { setUser } = useAuthStore();
    const { isRTL } = useLanguage();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await authService.register({ name, email, phone, password });
            if (data.success) {
                setUser(data.user, data.token);
                router.push(`/verify-email?email=${encodeURIComponent(email)}`);
            } else {
                setError(data.message || 'فشل إنشاء الحساب');
            }
        } catch (err: any) {
            setError(typeof err === 'string' ? err : (err.message || 'حدث خطأ أثناء التسجيل'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-white overflow-hidden" dir="rtl">
            {/* Simple Top Navigation */}
            <div className="p-3 md:p-4 shrink-0">
                <button 
                    onClick={() => router.push('/login')}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 transition-colors group w-fit"
                >
                    <ArrowLeft size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold font-cairo text-gray-400">العودة</span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-[360px] pb-4">
                    <div className="text-center mb-5">
                        <div className="w-12 h-12 bg-[#0E4435] rounded-xl mx-auto flex items-center justify-center mb-3 shadow-lg">
                            <img src="/logo.png" alt="Hawsni Logo" className="w-8 h-8 object-contain invert brightness-0" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-0.5 font-cairo">إنشاء حساب</h1>
                        <p className="text-gray-500 text-[11px] font-bold font-cairo">انضم إلى مجتمع هوسي الراقي</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-2 bg-red-50 rounded-xl flex items-center text-red-600 border border-red-100">
                            <XCircle className="w-4 h-4 ml-2 flex-shrink-0" />
                            <span className="text-[11px] font-bold font-cairo leading-tight">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-2.5">
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-gray-400 mr-1 font-cairo">الاسم بالكامل</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-4 w-4 text-gray-300 group-focus-within:text-[#0E4435] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pr-10 pl-3 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#0E4435]/20 focus:ring-2 focus:ring-[#0E4435]/10 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                    placeholder="الاسم الأول والأخير"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-gray-400 mr-1 font-cairo">البريد الإلكتروني</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-300 group-focus-within:text-[#0E4435] transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pr-10 pl-3 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#0E4435]/20 focus:ring-2 focus:ring-[#0E4435]/10 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                    placeholder="example@hwasi.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-gray-400 mr-1 font-cairo">رقم الهاتف</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-gray-300 group-focus-within:text-[#0E4435] transition-colors" />
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="w-full pr-10 pl-3 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#0E4435]/20 focus:ring-2 focus:ring-[#0E4435]/10 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                    placeholder="010 123 456 78"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-gray-400 mr-1 font-cairo">كلمة المرور</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-300 group-focus-within:text-[#0E4435] transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pr-10 pl-3 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#0E4435]/20 focus:ring-2 focus:ring-[#0E4435]/10 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 mt-3 bg-[#0E4435] hover:bg-[#0a3126] text-white rounded-xl font-black text-sm shadow-md shadow-[#0E4435]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] font-cairo"
                        >
                            {isLoading ? (
                                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>إنشاء الحساب</span>
                                    <ArrowRight className="w-3.5 h-3.5 mr-1 rotate-180" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-gray-500 text-[11px] font-bold font-cairo">
                            لديك حساب بالفعل؟{' '}
                            <Link href="/login" title="login">
                                <span className="text-[#0E4435] hover:underline">
                                    تسجيل الدخول
                                </span>
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-3">
                        <div className="h-[1px] flex-1 bg-gray-100" />
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest font-cairo">أو</span>
                        <div className="h-[1px] flex-1 bg-gray-100" />
                    </div>

                    <button
                        onClick={async () => {
                            const { supabase } = await import('@/lib/supabase');
                            supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback-handler` } })
                        }}
                        className="w-full py-2.5 px-4 bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-900 rounded-xl font-black text-[13px] shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] font-cairo mt-3"
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
