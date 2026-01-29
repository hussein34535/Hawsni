'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Product } from '@/lib/api';

interface ProductCardProps {
    product: Product;
    isWishlisted?: boolean;
    onWishlistToggle?: (productId: string) => void;
    index?: number;
}

export default function ProductCard({
    product,
    index = 0
}: ProductCardProps) {
    const formattedPrice = Math.floor(product.price);

    return (
        <Link
            href={`/products/${product.id}`}
            className="product-card animate-fade-in opacity-0"
            style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
        >
            {/* Image */}
            <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="product-image object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                />
            </div>

            {/* Details */}
            <div className="p-3">
                {/* Name */}
                <h3 className="product-name line-clamp-1">
                    {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-3 h-3 ${i < Math.floor(product.rating)
                                        ? 'star-filled'
                                        : 'star-empty'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                        ({product.reviewCount})
                    </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline mt-2">
                    <span className="product-price">{formattedPrice}</span>
                    <span className="product-currency">ر.س</span>
                </div>

                {/* Colors */}
                {product.colors && product.colors.length > 0 && (
                    <div className="flex gap-1.5 mt-3">
                        {product.colors.slice(0, 4).map((colorObj, idx) => {
                            const colorValue = typeof colorObj === 'string' ? colorObj : colorObj.color;
                            return (
                                <div
                                    key={idx}
                                    className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                                    style={{ backgroundColor: colorValue }}
                                />
                            );
                        })}
                        {product.colors.length > 4 && (
                            <span className="text-xs text-[var(--text-muted)]">
                                +{product.colors.length - 4}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}
