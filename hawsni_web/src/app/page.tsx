'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
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
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <Navbar />

      <main className="max-w-7xl mx-auto pt-24 px-4 sm:px-6">
        {/* Hero Section */}
        <section className="mb-8">
          <HeroCarousel banners={banners} isLoading={isLoading} />
        </section>

        {/* Categories */}
        <CategoryList categories={categories} isLoading={isLoading} />


        {/* Products Grid */}
        <section className="py-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">New Arrivals</h2>
            <button className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline">View All</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-10">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="aspect-[4/5] bg-gray-200 rounded-3xl animate-pulse" />
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
      </main>

      {/* Mobile Bottom Tab Bar could go here */}
    </div>
  );
}
