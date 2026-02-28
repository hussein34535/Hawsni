'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Lock, Phone, ArrowRight, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const { setUser } = useAuthStore();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (name.trim().split(' ').length < 2) {
                throw new Error("Please enter your full name (at least two words).");
            }

            const data = await authService.register({ name, email, phone, password });
            if (data.success) {
                // Auto-login (unverified) and redirect to OTP verification
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)] relative overflow-hidden py-10" dir="rtl">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-brand-primary)] opacity-10 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[var(--color-brand-accent)] opacity-10 blur-[100px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative z-10"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="w-16 h-16 bg-[var(--color-brand-primary)] rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20"
                    >
                        <span className="text-white text-2xl font-bold tracking-wider">H</span>
                    </motion.div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">إنشاء حساب جديد</h1>
                    <p className="text-[var(--color-text-secondary)]">انضم إلى حوسني واكتشف عالم الأناقة</p>
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

                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-[var(--color-text-secondary)] mr-1">الاسم الكامل</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[var(--color-brand-primary)] transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full pr-11 pl-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] outline-none transition-all text-right"
                                placeholder="الاسم الأول والأخير"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-[var(--color-text-secondary)] mr-1">البريد الإلكتروني</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[var(--color-brand-primary)] transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pr-11 pl-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] outline-none transition-all text-right"
                                placeholder="example@hawsni.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-[var(--color-text-secondary)] mr-1">رقم الهاتف</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-[var(--color-brand-primary)] transition-colors" />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="w-full pr-11 pl-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] outline-none transition-all text-right"
                                placeholder="+20 123 456 7890"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-[var(--color-text-secondary)] mr-1">كلمة المرور</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[var(--color-brand-primary)] transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pr-11 pl-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] outline-none transition-all text-right"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-6 mt-4 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-secondary)] text-white rounded-xl font-semibold shadow-lg shadow-[var(--color-brand-primary)]/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>إنشاء الحساب</span>
                                <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                            </>
                        )}
                    </motion.button>
                </form>

                <p className="mt-8 text-center text-[var(--color-text-secondary)]">
                    لديك حساب بالفعل؟{' '}
                    <Link href="/login" className="font-semibold text-[var(--color-brand-primary)] hover:underline">
                        تسجيل الدخول
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
