'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';
import HeroCarousel from '@/components/home/HeroCarousel';

import CategoryList from '@/components/home/CategoryList';
import ProductCard from '@/components/products/ProductCard';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { Category, Product, Banner } from '@/types';
import apiClient from '@/lib/axios';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, prodData, bannerData] = await Promise.all([
          categoryService.getCategories(),
          productService.getFeaturedProducts(),
          apiClient.get('/banners')
        ]);

        setCategories(catData.categories || []);
        setProducts(prodData.products || []);
        setBanners(Array.isArray(bannerData.data) ? bannerData.data : (bannerData.data.banners || []));
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
                <span className="ml-3 text-[15px] text-gray-500 font-medium">Search Products</span>
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


        {/* Products Grid */}
        <section className="pt-4 pb-[100px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">New Arrivals</h2>
            <button className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">View All</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="aspect-[0.68] bg-gray-200 rounded-3xl animate-pulse" />
              ))
            ) : (
              products.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.images[0]}
                  colors={product.colors}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
