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
    Package
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import axios from '@/lib/axios';

// Mock auth state (In real app, this would come from a store/context)
const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [isGuest, setIsGuest] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simple check for token or similar
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const { data } = await axios.get('/auth/me');
                    setUser(data);
                    setIsGuest(false);
                }
            } catch (error) {
                setIsGuest(true);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    return { user, isGuest, loading };
};

export default function ProfilePage() {
    const { user, isGuest, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
                <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isGuest) {
        return <GuestProfileView />;
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            {/* Header with Curve */}
            <div className="relative">
                <div className="bg-[var(--color-brand-primary)] h-[240px] rounded-b-[32px] pt-12 px-6">
                    <div className="flex justify-between items-center text-white">
                        <h1 className="text-2xl font-bold">My Profile</h1>
                        <button className="p-2">
                            <Settings size={22} />
                        </button>
                    </div>
                </div>

                {/* Floating Profile Card */}
                <div className="absolute top-[120px] left-6 right-6">
                    <div className="bg-white rounded-[24px] p-6 shadow-[var(--shadow-floating)] flex items-center gap-4">
                        <div className="w-[72px] h-[72px] rounded-full border-2 border-[var(--color-brand-primary)] p-0.5">
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
                <MenuSection title="Account">
                    <MenuItem icon={User} title="Profile Details" href="/profile/details" />
                    <MenuItem icon={Lock} title="Change Password" href="/profile/change-password" />
                    <MenuItem icon={Bell} title="Notifications" href="/profile/notifications" />
                </MenuSection>

                <MenuSection title="App Settings">
                    <MenuItem icon={Languages} title="Language" subtitle="English" />
                    <MenuItem icon={DollarSign} title="Currency" subtitle="USD ($)" />
                </MenuSection>

                <MenuSection title="My Activity">
                    <MenuItem icon={ShoppingBag} title="My Orders" href="/orders" />
                    <MenuItem icon={Heart} title="Wishlist" href="/wishlist" />
                    <MenuItem icon={MapPin} title="Addresses" href="/profile/addresses" />
                    <MenuItem icon={Ticket} title="My Coupons" href="/profile/coupons" />
                </MenuSection>

                <MenuSection>
                    <button className="w-full flex items-center gap-4 p-4 text-red-500 font-bold">
                        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                            <LogOut size={20} />
                        </div>
                        <span>Logout</span>
                    </button>
                </MenuSection>
            </div>
        </div>
    );
}

function GuestProfileView() {
    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center px-6">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-[var(--shadow-soft)] mb-8">
                <User size={64} className="text-[var(--color-brand-primary)]" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Guest</h1>
            <p className="text-gray-500 text-center mb-10 max-w-[280px]">
                Log in to access your profile, track orders, and manage your wishlist.
            </p>

            <Link href="/login" className="w-full h-14 bg-[var(--color-brand-primary)] text-white rounded-full flex items-center justify-center font-bold text-[16px] shadow-lg shadow-emerald-900/10 mb-4 tracking-wide">
                Login / Signup
            </Link>

            <Link href="/track-order" className="w-full h-14 border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] rounded-full flex items-center justify-center font-bold text-[16px] tracking-wide mb-12">
                Track Order
            </Link>

            <div className="w-full space-y-6">
                <p className="font-bold text-gray-900 ml-4">App Settings</p>
                <div className="bg-white rounded-[24px] shadow-[var(--shadow-soft)] overflow-hidden">
                    <MenuItem icon={Languages} title="Language" subtitle="English" showArrow={true} />
                    <MenuItem icon={DollarSign} title="Currency" subtitle="EGP (E£)" showArrow={true} isLast />
                </div>
            </div>
        </div>
    );
}

function MenuSection({ title, children }: { title?: string, children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            {title && <h3 className="text-[17px] font-bold text-gray-900 ml-1">{title}</h3>}
            <div className="bg-white rounded-[24px] shadow-[var(--shadow-soft)] overflow-hidden">
                {children}
            </div>
        </div>
    );
}

function MenuItem({ icon: Icon, title, subtitle, href, showArrow = true, isLast = false }: any) {
    const content = (
        <div className={`flex items-center justify-between p-4 ${!isLast ? 'border-b border-gray-50' : ''}`}>
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[var(--color-brand-primary)]">
                    <Icon size={20} />
                </div>
                <div>
                    <p className="font-bold text-gray-900">{title}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {showArrow && <ChevronRight size={16} className="text-gray-300" />}
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return <button className="w-full text-left">{content}</button>;
}
