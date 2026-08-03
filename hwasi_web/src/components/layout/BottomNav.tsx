'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, ShoppingBag, User, Bell } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/context/LanguageContext';

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const itemCount = useCartStore((state) => state.getItemCount());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { user, token } = useAuthStore();

    const navItems = [
        { href: '/', icon: Home, label: t.common.home },
        { href: '/wishlist', icon: Heart, label: t.common.wishlist },
        { href: '/cart', icon: ShoppingBag, label: t.common.cart },
        { href: '/profile', icon: User, label: t.common.profile },
    ];

    // Hide BottomNav on product detail to match Flutter app behavior
    if (pathname.includes('/product/') || pathname.includes('/checkout')) return null;

    const getProfileIcon = (isActive: boolean) => {
        if (user && token) {
            if (user.avatar_url) {
                return (
                    <img 
                        src={user.avatar_url} 
                        alt={user.name} 
                        className={`w-6 h-6 rounded-full object-cover border-2 ${isActive ? 'border-[var(--color-brand-primary)]' : 'border-gray-200'}`} 
                    />
                );
            }
            // First letter avatar with colorful background
            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];
            const colorIndex = user.name ? user.name.charCodeAt(0) % colors.length : 0;
            const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
            
            return (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black ${colors[colorIndex]} ${isActive ? 'ring-2 ring-[var(--color-brand-primary)] ring-offset-1' : ''}`}>
                    {initial}
                </div>
            );
        }
        return (
            <User
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? 'text-[var(--color-brand-primary)]' : 'text-gray-400'}
            />
        );
    };

    return (
        <div className="md:hidden fixed bottom-0 w-full bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-gray-100 z-50">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const isProfile = item.href === '/profile';

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center w-full h-full relative"
                        >
                            {isProfile ? (
                                getProfileIcon(isActive)
                            ) : (
                                <item.icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={isActive ? 'text-[var(--color-brand-primary)]' : 'text-gray-400'}
                                />
                            )}
                            
                            {isActive && (
                                <span className="text-[10px] font-bold text-[var(--color-brand-primary)] mt-1">
                                    {item.label}
                                </span>
                            )}

                            {/* Cart Badge */}
                            {item.href === '/cart' && isMounted && itemCount > 0 && (
                                <span className="absolute top-2 right-[25%] w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                    {itemCount}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
