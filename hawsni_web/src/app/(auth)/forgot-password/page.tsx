'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
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
            // Redirect to reset-password page after a short delay
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 3000);
        } catch (err: any) {
            setError(typeof err === 'string' ? err : (err.message || 'Failed to send reset code'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)] relative overflow-hidden">
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
                        <LockKeyhole className="text-white w-8 h-8" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Forgot Password?</h1>
                    <p className="text-[var(--color-text-secondary)]">No worries! Enter your email to receive a reset code.</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-4 bg-red-50 rounded-xl flex items-center text-red-600 border border-red-100"
                    >
                        <XCircle className="w-5 h-5 mr-3 flex-shrink-0" />
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
                        <h2 className="text-xl font-bold text-gray-900">Check Your Email</h2>
                        <p className="text-[var(--color-text-secondary)]">
                            We've sent a 6-digit verification code to <strong>{email}</strong>.
                        </p>
                        <p className="text-sm text-emerald-600 font-medium">Redirecting to reset page...</p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-[var(--color-text-secondary)] ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[var(--color-brand-primary)] transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)] outline-none transition-all"
                                    placeholder="hello@hawsni.com"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 px-6 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-secondary)] text-white rounded-xl font-semibold shadow-lg shadow-[var(--color-brand-primary)]/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Send Reset Code</span>
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </motion.button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <Link href="/login" className="text-sm font-semibold text-[var(--color-brand-primary)] hover:underline">
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

function LockKeyhole(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="16" r="1" />
            <rect x="3" y="10" width="18" height="12" rx="2" />
            <path d="M7 10V7a5 5 0 0 1 10 0v3" />
        </svg>
    );
}
