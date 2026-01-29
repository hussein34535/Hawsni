'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import HeroBanner from '@/components/HeroBanner';
import { productsApi, categoriesApi, Product, Category } from '@/lib/api';
import { Sparkles, Home, Heart, ShoppingCart, User } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productsApi.getAll(),
          categoriesApi.getAll(),
        ]);

        if (Array.isArray(productsRes.data)) {
          setProducts(productsRes.data);
        }

        if (Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // No mock fallback - pure API dependency
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAFA' }}>
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: '#FAFAFA' }}>
      {/* ============================== */}
      {/* 🎪 HERO SECTION (Flutter Match) */}
      {/* ============================== */}
      <HeroBanner />

      {/* ============================== */}
      {/* 🏷️ CATEGORIES (Flutter Match) */}
      {/* ============================== */}
      <section className="py-6">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="section-title">Categories</h2>
          <Link href="/categories" className="text-sm font-semibold text-[var(--primary)] hover:underline">
            View All
          </Link>
        </div>

        <div className="overflow-x-auto no-scrollbar pb-2 touch-pan-x">
          <div className="flex gap-2 px-4" style={{ minWidth: 'max-content' }}>
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="category-item animate-fade-in opacity-0"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
              >
                <div className="category-circle">
                  <div className="category-circle-inner relative">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] opacity-20" />
                    )}
                  </div>
                </div>
                <span className="category-name">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== */}
      {/* 🛍️ PRODUCTS GRID (Flutter Match: 2 columns) */}
      {/* ============================== */}
      <section className="px-4 pb-24">
        <div className="section-header px-0">
          <h2 className="section-title">Popular Products</h2>
          <Sparkles className="section-icon" />
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <p>No products available at the moment.</p>
          </div>
        )}
      </section>

      {/* ============================== */}
      {/* 📱 BOTTOM NAV (Flutter Match) */}
      {/* ============================== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 px-4 flex justify-around items-center z-50 shadow-lg">
        <Link href="/" className="flex flex-col items-center gap-1 py-1">
          <Home className="w-6 h-6 text-[var(--primary)]" />
          <span className="text-[10px] font-semibold text-[var(--primary)]">Home</span>
        </Link>
        <Link href="/wishlist" className="flex flex-col items-center gap-1 py-1">
          <Heart className="w-6 h-6 text-[var(--text-muted)]" />
          <span className="text-[10px] font-medium text-[var(--text-muted)]">Wishlist</span>
        </Link>
        <Link href="/cart" className="flex flex-col items-center gap-1 py-1 relative">
          <ShoppingCart className="w-6 h-6 text-[var(--text-muted)]" />
          <span className="text-[10px] font-medium text-[var(--text-muted)]">Cart</span>
        </Link>
        <Link href="/login" className="flex flex-col items-center gap-1 py-1">
          <User className="w-6 h-6 text-[var(--text-muted)]" />
          <span className="text-[10px] font-medium text-[var(--text-muted)]">Account</span>
        </Link>
      </nav>
    </div>
  );
}
