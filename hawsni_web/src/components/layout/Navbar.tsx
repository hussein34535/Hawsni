'use client';

import { useState } from 'react';
import { ShoppingBag, Bell, Search, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from '@/components/cart/CartDrawer';

export default function Navbar() {
    const itemCount = useCartStore((state) => state.getItemCount());
    const [isCartOpen, setIsCartOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-0 w-full bg-white z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-3">

                    {/* --- MOBILE NAVBAR (Matches _buildAppBar from Flutter) --- */}
                    <div className="flex md:hidden items-center justify-between">
                        {/* Logo */}
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Link href="/">
                                <div className="w-10 h-10 bg-[var(--color-brand-primary)] rounded-xl flex items-center justify-center shadow-[var(--shadow-soft)]">
                                    <span className="text-white font-bold text-xl">H</span>
                                </div>
                            </Link>
                        </div>

                        {/* Centered Title */}
                        <Link href="/" className="text-[26px] font-black text-[var(--color-brand-primary)] tracking-[1.2px]">
                            Hawsni
                        </Link>

                        {/* Notification Icon */}
                        <div className="relative">
                            <button className="p-2 text-gray-800 rounded-full">
                                <Bell size={26} />
                            </button>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </div>
                    </div>

                    {/* --- DESKTOP NAVBAR (Matches _buildDesktopHeader from Flutter) --- */}
                    <div className="hidden md:flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/">
                            <div className="w-12 h-12 bg-[var(--color-brand-primary)] rounded-xl flex items-center justify-center shadow-[var(--shadow-soft)]">
                                <span className="text-white font-bold text-2xl">H</span>
                            </div>
                        </Link>

                        {/* Nav Items centered */}
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-[var(--color-brand-primary)] transition-colors">
                                <span className="font-bold text-[16px]">Home</span>
                            </Link>

                            {/* Will implement wishlist later */}
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-[var(--color-brand-primary)] transition-colors">
                                <span className="font-normal text-[16px]">Wishlist</span>
                            </button>

                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-[var(--color-brand-primary)] transition-colors relative"
                            >
                                <span className="font-normal text-[16px]">Cart</span>
                                {itemCount > 0 && (
                                    <span className="ml-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
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
