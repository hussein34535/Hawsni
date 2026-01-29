'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingBag, Heart, User, Search, Menu, X, Sparkles } from 'lucide-react';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [cartCount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all-500 ${isScrolled
                    ? 'glass shadow-lg py-3'
                    : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className={`text-2xl font-black tracking-wider transition-all-300 ${isScrolled ? 'text-[var(--primary)]' : 'text-white'
                            } group-hover:scale-105`}>
                            HAWSNI
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="/"
                            className={`font-medium transition-all-300 hover:scale-105 ${isScrolled ? 'text-gray-700 hover:text-[var(--primary)]' : 'text-white/80 hover:text-white'
                                }`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/products"
                            className={`font-medium transition-all-300 hover:scale-105 ${isScrolled ? 'text-gray-700 hover:text-[var(--primary)]' : 'text-white/80 hover:text-white'
                                }`}
                        >
                            Products
                        </Link>
                        <Link
                            href="/categories"
                            className={`font-medium transition-all-300 hover:scale-105 ${isScrolled ? 'text-gray-700 hover:text-[var(--primary)]' : 'text-white/80 hover:text-white'
                                }`}
                        >
                            Categories
                        </Link>
                        <Link
                            href="/vto"
                            className="btn-vto px-4 py-2 text-sm flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Try On AI
                        </Link>
                    </nav>

                    {/* Right Icons */}
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <button className={`p-3 rounded-full transition-all-300 hover:scale-110 ${isScrolled
                                ? 'hover:bg-gray-100 text-gray-700'
                                : 'hover:bg-white/10 text-white'
                            }`}>
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Wishlist */}
                        <Link
                            href="/wishlist"
                            className={`p-3 rounded-full transition-all-300 hover:scale-110 ${isScrolled
                                    ? 'hover:bg-gray-100 text-gray-700'
                                    : 'hover:bg-white/10 text-white'
                                }`}
                        >
                            <Heart className="w-5 h-5" />
                        </Link>

                        {/* Cart */}
                        <Link
                            href="/cart"
                            className={`relative p-3 rounded-full transition-all-300 hover:scale-110 ${isScrolled
                                    ? 'hover:bg-gray-100 text-gray-700'
                                    : 'hover:bg-white/10 text-white'
                                }`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-[var(--primary)] text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Profile */}
                        <Link
                            href="/profile"
                            className={`hidden sm:flex p-3 rounded-full transition-all-300 hover:scale-110 ${isScrolled
                                    ? 'hover:bg-gray-100 text-gray-700'
                                    : 'hover:bg-white/10 text-white'
                                }`}
                        >
                            <User className="w-5 h-5" />
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button
                            className={`md:hidden p-3 rounded-full transition-all-300 ${isScrolled
                                    ? 'hover:bg-gray-100 text-gray-700'
                                    : 'hover:bg-white/10 text-white'
                                }`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden glass mt-2 mx-4 rounded-2xl overflow-hidden animate-fade-in">
                    <nav className="flex flex-col p-4 gap-2">
                        <Link
                            href="/"
                            className="text-gray-700 hover:text-[var(--primary)] font-medium py-3 px-4 rounded-xl hover:bg-gray-50 transition-all-300"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/products"
                            className="text-gray-700 hover:text-[var(--primary)] font-medium py-3 px-4 rounded-xl hover:bg-gray-50 transition-all-300"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Products
                        </Link>
                        <Link
                            href="/categories"
                            className="text-gray-700 hover:text-[var(--primary)] font-medium py-3 px-4 rounded-xl hover:bg-gray-50 transition-all-300"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Categories
                        </Link>
                        <Link
                            href="/profile"
                            className="text-gray-700 hover:text-[var(--primary)] font-medium py-3 px-4 rounded-xl hover:bg-gray-50 transition-all-300"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Profile
                        </Link>
                        <Link
                            href="/vto"
                            className="btn-vto text-center mt-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Try On AI
                            </span>
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
