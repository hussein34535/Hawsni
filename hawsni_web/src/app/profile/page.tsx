'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    Settings,
    ChevronRight,
    LogOut,
    ShoppingBag,
    Heart,
    MapPin,
    Ticket,
    Lock,
    Bell,
    Languages,
    DollarSign,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { addressService, Address } from '@/services/addressService';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/toastStore';
import { authService } from '@/services/authService';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';

// Standardized Auth Hook
const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [isGuest, setIsGuest] = useState(true);
    const [loading, setLoading] = useState(true);
    const storeUser = useAuthStore((s) => s.user);
    const storeToken = useAuthStore((s) => s.token);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (storeToken) {
                    const data = await authService.getProfile();
                    if (data.success) {
                        setUser(data.user);
                        setIsGuest(false);
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsGuest(true);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [storeToken]);

    return { user, isGuest, loading };
};

export default function ProfilePage() {
    const { user, isGuest, loading } = useAuth();
    const { t, language, setLanguage, isRTL } = useLanguage();
    const router = useRouter();
    const { showToast } = useToastStore();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
                <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
    };

    if (isGuest) {
        return <GuestProfileView t={t} toggleLanguage={toggleLanguage} language={language} isRTL={isRTL} />;
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            {/* Header with Curve */}
            <div className="relative">
                <div className="bg-[var(--color-brand-primary)] h-[220px] rounded-b-[40px] pt-10 px-6 relative overflow-hidden">
                    {/* Background Logo Pattern */}
                    <img
                        src="/logo.png"
                        alt=""
                        className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 rotate-12 pointer-events-none"
                    />

                    <div className="flex justify-between items-center text-white relative z-10">
                        <h1 className="text-2xl font-black font-cairo tracking-tight">{t.profile.title}</h1>
                        <button className="w-10 h-10 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* Floating Profile Card */}
                <div className="absolute top-[100px] left-6 right-6">
                    <div className="bg-white rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex items-center gap-4">
                        <div className="w-[60px] h-[60px] rounded-full border-2 border-[var(--color-brand-primary)] p-0.5">
                            <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={32} className="text-gray-400" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-[18px] font-bold text-gray-900">{user?.name || 'User Name'}</h2>
                            <p className="text-sm text-gray-500">{user?.email || 'user@email.com'}</p>
                            <div className="mt-2 inline-flex items-center px-3 py-1 bg-emerald-50 rounded-full">
                                <span className="text-[10px] font-bold text-[var(--color-brand-primary)] uppercase tracking-wider">Premium Member</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Spacing */}
            <div className="h-28" />

            {/* Menu Items */}
            <div className="px-6 space-y-6">
                <MenuSection title={t.profile.sections.account} isRTL={isRTL}>
                    <MenuItem icon={User} title={t.profile.items.profile_details} href="/profile/details" />
                    <MenuItem icon={Lock} title={t.profile.items.change_password} href="/profile/change-password" />
                    <MenuItem icon={Bell} title={t.profile.items.notifications} href="/profile/notifications" />
                </MenuSection>

                <MenuSection title={t.profile.sections.app_settings} isRTL={isRTL}>
                    <MenuItem
                        icon={Languages}
                        title={t.profile.items.language}
                        subtitle={language === 'en' ? 'English' : 'العربية'}
                        onClick={toggleLanguage}
                    />
                    <MenuItem 
                        icon={DollarSign} 
                        title={t.profile.items.currency} 
                        subtitle={language === 'ar' ? 'ج.م' : 'EGP'} 
                        onClick={() => showToast(isRTL ? 'الجنيه المصري هو العملة الوحيدة المتاحة حالياً' : 'EGP is currently the only supported currency', 'info')}
                    />
                </MenuSection>

                <MenuSection title={t.profile.sections.activity} isRTL={isRTL}>
                    <MenuItem icon={ShoppingBag} title={t.profile.items.my_orders} href="/profile/orders" />
                    <MenuItem icon={MapPin} title={isRTL ? 'تتبع الطلب' : 'Track Order'} href="/track-order" />
                    <MenuItem icon={Heart} title={t.profile.items.wishlist} href="/wishlist" />
                    <MenuItem icon={MapPin} title={t.profile.items.addresses} href="/profile/addresses" />
                    <MenuItem icon={Ticket} title={t.profile.items.coupons} href="/profile/coupons" />
                </MenuSection>

                <MenuSection isRTL={isRTL}>
                    <button
                        onClick={() => authService.logout()}
                        className="w-full flex items-center gap-4 p-4 text-red-500 font-bold group hover:bg-red-50 transition-colors"
                    >
                        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <LogOut size={20} />
                        </div>
                        <span className="font-cairo">{t.profile.items.logout}</span>
                    </button>
                </MenuSection>
            </div>
        </div>
    );
}

function GuestProfileView({ t, toggleLanguage, language, isRTL }: any) {
    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center px-6">
            <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.06)] mb-8 p-6">
                <img src="/logo.png" alt="Hwasi Logo" className="w-full h-full object-contain" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.profile.welcome_guest}</h1>
            <p className="text-gray-500 text-center mb-10 max-w-[280px]">
                {t.profile.guest_desc}
            </p>

            <Link href="/login" className="w-full h-14 bg-[var(--color-brand-primary)] text-white rounded-full flex items-center justify-center font-bold text-[16px] shadow-lg shadow-emerald-900/10 mb-4 tracking-wide">
                {t.profile.login_signup}
            </Link>

            <Link href="/track-order" className="w-full h-14 border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] rounded-full flex items-center justify-center font-bold text-[16px] tracking-wide mb-12">
                {t.profile.track_order}
            </Link>

            <div className="w-full space-y-6">
                <p className={`font-bold text-gray-900 ${isRTL ? 'mr-4' : 'ml-4'}`}>{t.profile.sections.app_settings}</p>
                <div className="bg-white rounded-[24px] shadow-[var(--shadow-soft)] overflow-hidden">
                    <MenuItem
                        icon={Languages}
                        title={t.profile.items.language}
                        subtitle={language === 'en' ? 'English' : 'العربية'}
                        showArrow={true}
                        onClick={toggleLanguage}
                    />
                    <MenuItem icon={DollarSign} title={t.profile.items.currency} subtitle={language === 'ar' ? 'ج.م' : 'EGP'} showArrow={true} isLast />
                </div>
            </div>
        </div>
    );
}

function MenuSection({ title, children, isRTL }: { title?: string, children: React.ReactNode, isRTL?: boolean }) {
    return (
        <div className="space-y-3">
            {title && <h3 className={`text-[17px] font-bold text-gray-900 ${isRTL ? 'mr-1' : 'ml-1'}`}>{title}</h3>}
            <div className="bg-white rounded-[24px] shadow-[var(--shadow-soft)] overflow-hidden">
                {children}
            </div>
        </div>
    );
}

function MenuItem({ icon: Icon, title, subtitle, href, onClick, showArrow = true, isLast = false }: any) {
    const { isRTL } = useLanguage();

    const Body = (
        <div className={`flex items-center justify-between p-3 ${!isLast ? 'border-b border-gray-50' : ''}`}>
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[var(--color-brand-primary)]">
                    <Icon size={20} />
                </div>
                <div className="text-left rtl:text-right">
                    <p className="font-bold text-gray-900">{title}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {showArrow && (
                <div className={isRTL ? 'rotate-180' : ''}>
                    <ChevronRight size={16} className="text-gray-300" />
                </div>
            )}
        </div>
    );

    if (href) {
        return <Link href={href} className="w-full block">{Body}</Link>;
    }

    return (
        <button onClick={onClick} className="w-full">
            {Body}
        </button>
    );
}
