'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Camera, Save } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { authService } from '@/services/authService';
import { useToastStore } from '@/store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileDetailsPage() {
    const { t, isRTL, language } = useLanguage();
    const router = useRouter();
    const { showToast } = useToastStore();

    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar_url: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await authService.getProfile();
                if (data.success) {
                    setUserData({
                        name: data.user.name || '',
                        email: data.user.email || '',
                        phone: data.user.phone || '',
                        avatar_url: data.user.avatar_url || ''
                    });
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                showToast(isRTL ? 'فشل تحميل البيانات' : 'Failed to load profile details', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [isRTL, showToast]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const result = await authService.updateProfile(userData);
            if (result.success) {
                showToast(isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully', 'success');
                setTimeout(() => router.back(), 1500);
            }
        } catch (error: any) {
            console.error('Update failed:', error);
            showToast(error || (isRTL ? 'فشل التحديث' : 'Update failed'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
                <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-16 gap-3">
                <button onClick={() => router.back()} className={`p-2 transition-transform active:scale-90 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900 font-cairo">
                    {t.profile.items.profile_details || (isRTL ? 'تفاصيل الحساب' : 'Profile Details')}
                </h1>
            </header>

            <main className="p-4 sm:p-6 max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center mb-10"
                >
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 flex items-center justify-center transition-transform group-hover:scale-105">
                            {userData.avatar_url ? (
                                <img src={userData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-gray-300" />
                            )}
                        </div>
                        <button className="absolute bottom-1 right-1 w-10 h-10 bg-[var(--color-brand-primary)] text-white rounded-full flex items-center justify-center border-4 border-white shadow-md hover:scale-110 active:scale-90 transition-transform">
                            <Camera size={18} />
                        </button>
                    </div>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSave}
                    className="space-y-6"
                >
                    <div className="space-y-2">
                        <label className={`block text-sm font-bold text-gray-700 font-cairo ${isRTL ? 'text-right' : 'text-left'}`}>
                            {language === 'ar' ? 'الاسم بالكامل' : 'Full Name'}
                        </label>
                        <div className="relative">
                            <div className={`absolute inset-y-0 ${isRTL ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-gray-400`}>
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                value={userData.name}
                                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                className={`w-full h-14 bg-white border border-gray-100 rounded-[18px] ${isRTL ? 'pr-12 text-right' : 'pl-12 text-left'} font-medium focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/10 outline-none transition-all shadow-sm`}
                                placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={`block text-sm font-bold text-gray-700 font-cairo ${isRTL ? 'text-right' : 'text-left'}`}>
                            {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                        </label>
                        <div className="relative">
                            <div className={`absolute inset-y-0 ${isRTL ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-gray-400`}>
                                <Mail size={20} />
                            </div>
                            <input
                                type="email"
                                value={userData.email}
                                readOnly
                                className={`w-full h-14 bg-gray-50 border border-gray-100 rounded-[18px] ${isRTL ? 'pr-12 text-right' : 'pl-12 text-left'} font-medium text-gray-400 outline-none shadow-sm cursor-not-allowed`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={`block text-sm font-bold text-gray-700 font-cairo ${isRTL ? 'text-right' : 'text-left'}`}>
                            {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                        </label>
                        <div className="relative">
                            <div className={`absolute inset-y-0 ${isRTL ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-gray-400`}>
                                <Phone size={20} />
                            </div>
                            <input
                                type="tel"
                                value={userData.phone}
                                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                className={`w-full h-14 bg-white border border-gray-100 rounded-[18px] ${isRTL ? 'pr-12 text-right' : 'pl-12 text-left'} font-medium focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/10 outline-none transition-all shadow-sm`}
                                placeholder={language === 'ar' ? '01xxxxxxxxx' : '01xxxxxxxxx'}
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSaving}
                        className="w-full h-14 bg-[var(--color-brand-primary)] text-white rounded-full flex items-center justify-center gap-2 font-black text-[16px] shadow-lg shadow-emerald-950/20 hover:bg-[#153D31] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-10"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                <span className="font-cairo">{t.common.save || (isRTL ? 'حفظ' : 'Save')}</span>
                            </>
                        )}
                    </motion.button>
                </motion.form>
            </main>
        </div>
    );
}
