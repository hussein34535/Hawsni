'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { authService } from '@/services/authService';
import { useToastStore } from '@/store/toastStore';

export default function ChangePasswordPage() {
    const { t, isRTL } = useLanguage();
    const router = useRouter();
    const { showToast } = useToastStore();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            showToast(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'error');
            return;
        }

        if (passwords.newPassword.length < 6) {
            showToast(isRTL ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const res = await authService.changePassword(passwords.oldPassword, passwords.newPassword);
            if (res.success) {
                setSuccess(true);
                showToast(isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully', 'success');
                setTimeout(() => router.back(), 2000);
            }
        } catch (error: any) {
            showToast(error || 'Failed to change password', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <CheckCircle2 size={80} className="text-emerald-500 mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {isRTL ? 'تم بنجاح!' : 'Success!'}
                </h1>
                <p className="text-gray-500 mb-8">
                    {isRTL ? 'تمت عملية تغيير كلمة المرور' : 'Your password has been changed.'}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-16 gap-3">
                <button onClick={() => router.back()} className={`p-2 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{isRTL ? 'تغيير كلمة المرور' : 'Change Password'}</h1>
            </header>

            <main className="p-6 max-w-md mx-auto mt-8">
                <div className="bg-white rounded-[32px] p-8 shadow-[var(--shadow-soft)] border border-gray-50">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-[var(--color-brand-primary)] mb-8 mx-auto">
                        <Lock size={32} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
                                {isRTL ? 'كلمة المرور القديمة' : 'Old Password'}
                            </label>
                            <input
                                type="password"
                                required
                                value={passwords.oldPassword}
                                onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                className="w-full h-14 bg-gray-50 border-none rounded-2xl px-5 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none font-bold"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
                                {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                            </label>
                            <input
                                type="password"
                                required
                                value={passwords.newPassword}
                                onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                className="w-full h-14 bg-gray-50 border-none rounded-2xl px-5 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none font-bold"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
                                {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                            </label>
                            <input
                                type="password"
                                required
                                value={passwords.confirmPassword}
                                onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                className="w-full h-14 bg-gray-50 border-none rounded-2xl px-5 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none font-bold"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-14 bg-[var(--color-brand-primary)] text-white rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-900/10 active:scale-[0.98] transition-all ${isLoading ? 'opacity-70' : ''}`}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
