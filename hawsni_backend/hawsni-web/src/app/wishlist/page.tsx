'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/api';
import { ChevronLeft, ShoppingBag, Heart, Trash2 } from 'lucide-react';

export default function WishlistPage() {
    const [items, setItems] = useState<Product[]>([]);

    const handleRemove = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-[var(--primary)] mb-2 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back to Home
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                </div>
                <div className="text-gray-500">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                </div>
            </div>

            {items.length === 0 ? (
                /* Empty Wishlist */
                <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-12 h-12 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
                    <p className="text-gray-500 mb-8">Save items you love to view them later.</p>
                    <Link href="/" className="btn-primary inline-flex items-center gap-2">
                        Start Shopping
                        <ShoppingBag className="w-5 h-5" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((product) => (
                        <div key={product.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                            {/* Image */}
                            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <button
                                    onClick={() => handleRemove(product.id)}
                                    className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-white transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-[var(--primary)]">
                                        {Math.floor(product.price)} ر.س
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-yahoo-500">
                                        <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] text-white">⭐</div>
                                        {product.rating}
                                    </div>
                                </div>
                                <Link
                                    href={`/products/${product.id}`}
                                    className="block w-full mt-4 py-2 border border-[var(--primary)] text-[var(--primary)] text-center rounded-xl font-medium hover:bg-[var(--primary)] hover:text-white transition-all"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
