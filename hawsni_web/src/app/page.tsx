'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import HeroCarousel from '@/components/home/HeroCarousel';

import dynamic from 'next/dynamic';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { Category, Product, Banner } from '@/types';
import apiClient from '@/lib/axios';
import { useLanguage } from '@/context/LanguageContext';

const CategoryList = dynamic(() => import('@/components/home/CategoryList'), {
  loading: () => <div className="h-24 bg-gray-100 animate-pulse rounded-xl my-4"></div>,
  ssr: true
});

const ProductCard = dynamic(() => import('@/components/products/ProductCard'), {
  loading: () => <div className="aspect-[0.68] bg-gray-200 rounded-3xl animate-pulse"></div>,
  ssr: true
});

export default function HomePage() {
  const { t, language, isRTL } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, prodData, featData, bannerData] = await Promise.allSettled([
          categoryService.getCategories(),
          productService.getProducts(),
          productService.getFeaturedProducts(),
          apiClient.get('/banners')
        ]);

        if (catData.status === 'fulfilled') {
          setCategories(catData.value?.categories || []);
        }
        if (prodData.status === 'fulfilled') {
          setProducts(prodData.value?.products || []);
        }
        if (featData.status === 'fulfilled') {
          setFeaturedProducts(featData.value?.products || []);
        }
        if (bannerData.status === 'fulfilled') {
          const bd = bannerData.value?.data;
          setBanners(Array.isArray(bd) ? bd : (bd?.banners || []));
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full">
      <div className="px-4 sm:px-6">
        {/* Search Bar matching Flutter */}
        <section className="mb-6">
          <div className="flex gap-3">
            <Link href="/search" className="flex-1">
              <div className="h-[52px] bg-[#F5F5F5] rounded-[14px] flex items-center px-4">
                <Search size={22} className="text-gray-500" />
                <span className={`${isRTL ? 'mr-3' : 'ml-3'} text-[15px] text-gray-500 font-medium`}>
                  {t.common.search}
                </span>
              </div>
            </Link>

            <button className="w-[52px] h-[52px] bg-[var(--color-brand-primary)] rounded-[14px] flex items-center justify-center shadow-[var(--shadow-soft)] hover:bg-[#153D31] active:scale-95 transition-all">
              <SlidersHorizontal size={22} className="text-white" />
            </button>
          </div>
        </section>

        {/* Hero Section */}
        <section className="mb-8">
          <HeroCarousel banners={banners} isLoading={isLoading} />
        </section>

        {/* Categories */}
        <CategoryList categories={categories} isLoading={isLoading} />

        {/* Featured Products */}
        {(!isLoading && featuredProducts.length > 0) && (
          <section className="pt-8 pb-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500 fill-amber-500/20" />
                {isRTL ? 'المنتجات المميزة' : 'Featured Products'}
              </h2>
              <Link href="/search?featured=true" className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">{t.common.view_all}</Link>
            </div>
            {/* Horizontal Scroll for Featured */}
            <div className={`flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              {featuredProducts.map((product) => (
                <div key={product._id || (product as any).id} className="min-w-[160px] max-w-[160px] sm:min-w-[200px] sm:max-w-[200px] snap-start flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Products Grid (New Arrivals) */}
        <section className="pt-8 pb-[100px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{t.home.new_arrivals}</h2>
            <Link href="/search?sort=newest" className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">{t.common.view_all}</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="aspect-[0.68] bg-gray-200 rounded-3xl animate-pulse" />
              ))
            ) : (
              products.map((product) => (
                <ProductCard
                  key={product._id || (product as any).id}
                  product={product}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
