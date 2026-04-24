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
        <div className="min-h-screen flex flex-col bg-white" dir="rtl">
            {/* Simple Top Navigation */}
            <div className="p-4 md:p-8">
                <button 
                    onClick={() => router.push('/login')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors group"
                >
                    <ArrowLeft size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold font-cairo text-gray-400">العودة لتسجيل الدخول</span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[420px]">
                    <div className="text-center mb-10">
                        <div className="w-12 h-12 bg-gray-900 rounded-xl mx-auto flex items-center justify-center mb-6 shadow-xl">
                            <span className="text-white text-xl font-black">H</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 font-cairo">إنشاء حساب</h1>
                        <p className="text-gray-500 text-sm font-bold font-cairo">انضم إلى مجتمع هوسي الراقي</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-2xl flex items-center text-red-600 border border-red-100">
                            <XCircle className="w-5 h-5 ml-3 flex-shrink-0" />
                            <span className="text-xs font-bold font-cairo">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-black text-gray-400 mr-1 font-cairo">الاسم بالكامل</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <UserIcon className="h-4 w-4 text-gray-300 group-focus-within:text-gray-900 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pr-11 pl-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                    placeholder="الاسم الأول والأخير"
                                />
                            </div>
                        </div>

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
                            <label className="text-[13px] font-black text-gray-400 mr-1 font-cairo">رقم الهاتف</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-gray-300 group-focus-within:text-gray-900 transition-colors" />
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="w-full pr-11 pl-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-900/5 outline-none transition-all text-right text-sm font-bold placeholder:text-gray-300"
                                    placeholder="010 123 456 78"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-black text-gray-400 mr-1 font-cairo">كلمة المرور</label>
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 px-6 mt-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] font-cairo"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>إنشاء الحساب</span>
                                    <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm font-bold font-cairo">
                            لديك حساب بالفعل؟{' '}
                            <Link href="/login" title="login">
                                <span className="text-gray-900 hover:underline">
                                    تسجيل الدخول
                                </span>
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
