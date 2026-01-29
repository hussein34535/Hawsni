'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { productsApi, categoriesApi, Product, Category } from '@/lib/api';
import { Filter, Grid, List } from 'lucide-react';

export default function ProductsPage() {
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('category');

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryId);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    selectedCategory
                        ? productsApi.getByCategory(selectedCategory)
                        : productsApi.getAll(),
                    categoriesApi.getAll(),
                ]);

                // Safely handle array responses
                if (Array.isArray(productsRes.data)) setProducts(productsRes.data);
                if (Array.isArray(categoriesRes.data)) setCategories(categoriesRes.data);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [selectedCategory]);

    const currentCategoryName = selectedCategory
        ? categories.find(c => c.id === selectedCategory)?.name
        : 'All Products';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {currentCategoryName}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {products.length} products found
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                ? 'bg-white shadow-sm text-[var(--primary)]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                ? 'bg-white shadow-sm text-[var(--primary)]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filter Button */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </div>

            <div className="flex gap-8">
                {/* Sidebar - Categories */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24 bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="font-bold text-lg mb-4">Categories</h3>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${!selectedCategory
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    All Products
                                </button>
                            </li>
                            {categories.map((category) => (
                                <li key={category.id}>
                                    <button
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === category.id
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {category.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Products Grid */}
                <div className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-500 text-lg">No products found</p>
                        </div>
                    ) : (
                        <div className={
                            viewMode === 'grid'
                                ? 'grid grid-cols-2 md:grid-cols-3 gap-6'
                                : 'flex flex-col gap-4'
                        }>
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
