'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cartApi, CartItem } from '@/lib/api';
import {
    Minus, Plus, Trash2, ShoppingBag,
    ChevronLeft, ArrowRight
} from 'lucide-react';

export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await cartApi.get();
            if (Array.isArray(res.data)) {
                setItems(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
            // If failed (e.g. 401), we just show empty cart
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (id: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            await cartApi.update(id, newQuantity);
            setItems(items.map(item =>
                item.id === id ? { ...item, quantity: newQuantity } : item
            ));
        } catch (error) {
            console.error('Failed to update quantity:', error);
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await cartApi.remove(id);
            setItems(items.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to remove item:', error);
        }
    };

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = items.length > 0 ? 30 : 0; // Fixed shipping
    const total = subtotal + shipping;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-[var(--primary)] mb-2 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Continue Shopping
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                </div>
                <div className="text-gray-500">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                </div>
            </div>

            {items.length === 0 ? (
                /* Empty Cart */
                <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-12 h-12 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                    <p className="text-gray-500 mb-8">Looks like you haven&apos;t added anything yet.</p>
                    <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                        Start Shopping
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4"
                            >
                                {/* Image */}
                                <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.name}
                                        fill
                                        sizes="96px"
                                        className="object-cover"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                                            <div className="flex gap-3 mt-1 text-sm text-gray-500">
                                                {item.size && <span>Size: {item.size}</span>}
                                                {item.color && (
                                                    <span className="flex items-center gap-1">
                                                        Color:
                                                        <span
                                                            className="w-4 h-4 rounded-full border border-gray-200"
                                                            style={{ backgroundColor: item.color }}
                                                        />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4">
                                        {/* Quantity */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[var(--primary)] transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[var(--primary)] transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right">
                                            <p className="font-bold text-[var(--primary)]">
                                                {Math.floor(item.price * item.quantity)} ر.س
                                            </p>
                                            {item.quantity > 1 && (
                                                <p className="text-sm text-gray-500">
                                                    {Math.floor(item.price)} ر.س each
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                            <h2 className="font-bold text-lg mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{Math.floor(subtotal)} ر.س</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>{shipping} ر.س</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-[var(--primary)]">{Math.floor(total)} ر.س</span>
                                </div>
                            </div>

                            <Link
                                href="/checkout"
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                Proceed to Checkout
                                <ArrowRight className="w-5 h-5" />
                            </Link>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                Shipping calculated at checkout
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
