'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function BottomNav() {
    const pathname = usePathname();
    const itemCount = useCartStore((state) => state.getItemCount());

    const navItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/wishlist', icon: Heart, label: 'Wishlist' },
        { href: '/cart', icon: ShoppingBag, label: 'Cart' },
        { href: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 w-full bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-gray-100 z-50">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center w-full h-full relative"
                        >
                            <Icon
                                size={24}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={isActive ? 'text-[var(--color-brand-primary)]' : 'text-gray-400'}
                            />
                            {isActive && (
                                <span className="text-[10px] font-bold text-[var(--color-brand-primary)] mt-1">
                                    {item.label}
                                </span>
                            )}

                            {/* Cart Badge */}
                            {item.label === 'Cart' && itemCount > 0 && (
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
