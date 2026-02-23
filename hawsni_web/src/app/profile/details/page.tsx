'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Camera, Save } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import axios from '@/lib/axios';
import { motion } from 'framer-motion';

export default function ProfileDetailsPage() {
    const { t, isRTL, language } = useLanguage();
    const router = useRouter();
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
                const { data } = await axios.get('/auth/me');
                setUserData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    avatar_url: data.avatar_url || ''
                });
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.put('/auth/update-profile', userData);
            // Show success message or redirect
            router.back();
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-16 gap-3">
                <button onClick={() => router.back()} className={`p-2 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{t.profile.items.profile_details}</h1>
            </header>

            <main className="p-4 sm:p-6 max-w-2xl mx-auto">
                <div className="flex flex-col items-center mb-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            {userData.avatar_url ? (
                                <img src={userData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-gray-300" />
                            )}
                        </div>
                        <button className="absolute bottom-1 right-1 w-10 h-10 bg-[var(--color-brand-primary)] text-white rounded-full flex items-center justify-center border-4 border-white shadow-md">
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <label className={`block text-sm font-bold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
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
                                className={`w-full h-14 bg-white border border-gray-100 rounded-[18px] ${isRTL ? 'pr-12 text-right' : 'pl-12 text-left'} font-medium focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all shadow-sm`}
                                placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={`block text-sm font-bold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
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
                        <label className={`block text-sm font-bold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
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
                                className={`w-full h-14 bg-white border border-gray-100 rounded-[18px] ${isRTL ? 'pr-12 text-right' : 'pl-12 text-left'} font-medium focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all shadow-sm`}
                                placeholder={language === 'ar' ? '01xxxxxxxxx' : '01xxxxxxxxx'}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full h-14 bg-[var(--color-brand-primary)] text-white rounded-full flex items-center justify-center gap-2 font-bold text-[16px] shadow-lg shadow-emerald-900/10 hover:bg-[#153D31] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-10"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                {t.common.save}
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}
