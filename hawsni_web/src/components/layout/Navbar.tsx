'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Bell, Search, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from '@/components/cart/CartDrawer';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
    const pathname = usePathname();
    const { t, language, isRTL } = useLanguage();
    const itemCount = useCartStore((state) => state.getItemCount());
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Hide Navbar on product detail, checkout, and cart pages to match Flutter app behavior
    if (pathname.includes('/product/') || pathname.includes('/checkout') || pathname.includes('/cart')) return null;

    return (
        <>
            <nav className="fixed top-0 w-full bg-white z-50 border-b border-gray-100" dir="ltr">
                <div className="max-w-7xl mx-auto px-4 py-3">

                    {/* --- MOBILE NAVBAR (Matches _buildAppBar from Flutter) --- */}
                    <div className="flex md:hidden items-center justify-between">
                        {/* Logo */}
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Link href="/">
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <img src="/logo.png" alt="Hwasi Logo" className="w-full h-full object-contain" />
                                </div>
                            </Link>
                        </div>

                        {/* Centered Title */}
                        <Link href="/" className={`${language === 'ar' ? 'font-arabic' : 'font-black'} text-[26px] font-black text-[var(--color-brand-primary)] tracking-[1.2px]`}>
                            Hwasi
                        </Link>

                        {/* Notification Icon */}
                        <div className="relative">
                            <Link href="/notifications" className="p-2 text-gray-800 rounded-full block">
                                <Bell size={26} />
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            </Link>
                        </div>
                    </div>

                    {/* --- DESKTOP NAVBAR (Matches _buildDesktopHeader from Flutter) --- */}
                    <div className="hidden md:flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/">
                            <div className="w-12 h-12 flex items-center justify-center">
                                <img src="/logo.png" alt="Hwasi Logo" className="w-full h-full object-contain" />
                            </div>
                        </Link>

                        {/* Nav Items centered */}
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-[var(--color-brand-primary)] transition-colors">
                                <span className="font-bold text-[16px]">{t.common.home}</span>
                            </Link>

                            {/* Will implement wishlist later */}
                            <Link href="/wishlist" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-[var(--color-brand-primary)] transition-colors">
                                <span className="font-normal text-[16px]">{t.common.wishlist}</span>
                            </Link>

                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-[var(--color-brand-primary)] transition-colors relative"
                            >
                                <span className="font-normal text-[16px]">{t.common.cart}</span>
                                {isMounted && itemCount > 0 && (
                                    <span className="mx-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                        {itemCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Profile Icon */}
                        <Link href="/profile" className="p-2 rounded-full text-gray-600 hover:text-[var(--color-brand-primary)] transition-colors">
                            <User size={28} />
                        </Link>
                    </div>

                </div>
            </nav>

            {/* Cart Drawer Component */}
            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
            />
        </>
    );
}
