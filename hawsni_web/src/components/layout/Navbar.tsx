'use client';

import { ShoppingBag, Bell, Search, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function Navbar() {
    const itemCount = useCartStore((state) => state.getItemCount());

    return (
        <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Left: Logo */}
                <div className="flex-1 flex justify-start">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-[var(--color-brand-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10 transition-transform active:scale-95">
                            <span className="text-white font-bold text-xl">H</span>
                        </div>
                    </Link>
                </div>

                {/* Center: Brand Name (Responsive) */}
                <div className="flex-1 flex justify-center">
                    <span className="text-xl sm:text-2xl font-black text-[var(--color-brand-primary)] tracking-widest uppercase truncate px-2">
                        Hawsni
                    </span>
                </div>

                {/* Right: Action Icons */}
                <div className="flex-1 flex justify-end items-center gap-1 sm:gap-2">
                    <Link href="/cart" className="p-2.5 text-gray-700 hover:bg-gray-100 rounded-full transition-colors relative group">
                        <ShoppingBag size={22} className="group-hover:text-[var(--color-brand-primary)]" />
                        {itemCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-[var(--color-brand-primary)] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white translate-x-1 -translate-y-1">
                                {itemCount}
                            </span>
                        )}
                    </Link>

                    <button className="p-2.5 text-gray-700 hover:bg-gray-100 rounded-full transition-colors relative group flex">
                        <Bell size={22} className="group-hover:text-[var(--color-brand-primary)]" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    <Link href="/login" className="p-2.5 text-gray-700 hover:bg-gray-100 rounded-full transition-colors group">
                        <User size={22} className="group-hover:text-[var(--color-brand-primary)]" />
                    </Link>

                    <button className="p-2.5 text-gray-700 hover:bg-gray-100 rounded-full transition-colors sm:hidden">
                        <Menu size={22} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
