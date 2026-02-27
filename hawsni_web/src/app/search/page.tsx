'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, X, SlidersHorizontal, History, SearchX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/products/ProductCard';
import axios from '@/lib/axios';
import { Category, Product } from '@/types';

import { useLanguage } from '@/context/LanguageContext';

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
                <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}

function SearchContent() {
    const router = useRouter();
    const { t, language, isRTL } = useLanguage();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const initialCategory = searchParams.get('category') || null;

    const [query, setQuery] = useState(initialQuery);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(5000);
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        loadSearchHistory();
        loadCategories();
        if (initialQuery || initialCategory) {
            handleSearch(initialQuery, initialCategory);
        }
    }, []);

    const loadSearchHistory = () => {
        const history = localStorage.getItem('search_history');
        if (history) {
            setSearchHistory(JSON.parse(history));
        }
    };

    const saveSearchToHistory = (term: string) => {
        if (!term.trim()) return;
        const history = [...searchHistory];
        const index = history.indexOf(term);
        if (index !== -1) {
            history.splice(index, 1);
        }
        history.unshift(term);
        const limitedHistory = history.slice(0, 10);
        setSearchHistory(limitedHistory);
        localStorage.setItem('search_history', JSON.stringify(limitedHistory));
    };

    const removeHistoryItem = (e: React.MouseEvent, term: string) => {
        e.stopPropagation();
        const history = searchHistory.filter(item => item !== term);
        setSearchHistory(history);
        localStorage.setItem('search_history', JSON.stringify(history));
    };

    const loadCategories = async () => {
        try {
            const { data } = await axios.get('/categories');
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleSearch = async (term: string = query, catId: string | null = selectedCategory) => {
        if (!term.trim() && !catId) return;

        setIsLoading(true);
        setSuggestions([]);
        if (term) saveSearchToHistory(term);

        try {
            const params: any = {
                search: term,
                minPrice,
                maxPrice,
                sortBy
            };
            if (catId) params.category = catId;

            const { data } = await axios.get('/products/search', { params });
            setSearchResults(data.products || []);
        } catch (error) {
            console.error('Error searching products:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearFilters = () => {
        setSelectedCategory(null);
        setMinPrice(0);
        setMaxPrice(5000);
        setSortBy('newest');
        setQuery('');
        setSearchResults([]);
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)]">
            {/* Header (AppBar equivalent) */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-16 gap-3">
                <button onClick={() => router.back()} className={`p-2 ${isRTL ? '-mr-2' : '-ml-2'} text-gray-900 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={24} />
                </button>

                <div className="flex-1 h-10 bg-gray-100 rounded-full flex-row flex items-center px-4 relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={t.search.placeholder}
                        className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-gray-900"
                        autoFocus
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className={`${isRTL ? 'mr-2' : 'ml-2'} text-gray-500`}>
                            <X size={18} />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-full transition-colors ${showFilters ? 'text-[var(--color-brand-primary)]' : 'text-gray-900'}`}
                >
                    <SlidersHorizontal size={24} />
                </button>
            </header>

            <main className="max-w-7xl mx-auto">
                {/* Filters Overlay */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white border-b border-gray-100 overflow-hidden"
                        >
                            <div className="p-4 space-y-6">
                                <div className="flex justify-between items-center text-left rtl:text-right">
                                    <h3 className="text-lg font-bold">{t.search.filters}</h3>
                                    <button onClick={clearFilters} className="text-[var(--color-brand-primary)] font-bold text-sm">
                                        {t.common.clear}
                                    </button>
                                </div>

                                {/* Category Filter */}
                                <div>
                                    <p className="font-semibold mb-3">{t.search.category}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <FilterChip
                                            label={language === 'ar' ? 'الكل' : 'All'}
                                            isSelected={selectedCategory === null}
                                            onClick={() => setSelectedCategory(null)}
                                        />
                                        {categories.map((cat) => (
                                            <FilterChip
                                                key={cat._id}
                                                label={cat.name}
                                                isSelected={selectedCategory === cat._id}
                                                onClick={() => setSelectedCategory(cat._id)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Price Filter */}
                                <div>
                                    <p className="font-semibold mb-3">{t.search.price_range}</p>
                                    <div className="space-y-4 px-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="5000"
                                            step="50"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                                            className="w-full accent-[var(--color-brand-primary)]"
                                        />
                                        <div className="flex justify-between text-xs font-bold text-gray-500">
                                            <span>0 {language === 'ar' ? 'ج.م' : 'EGP'}</span>
                                            <span>{maxPrice} {language === 'ar' ? 'ج.م' : 'EGP'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sort Filter */}
                                <div>
                                    <p className="font-semibold mb-3">{t.search.sort_by}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'newest', label: t.search.sort_newest },
                                            { id: 'price_asc', label: t.search.sort_price_asc },
                                            { id: 'price_desc', label: t.search.sort_price_desc },
                                            { id: 'rating', label: t.search.sort_rating }
                                        ].map((item) => (
                                            <FilterChip
                                                key={item.id}
                                                label={item.label}
                                                isSelected={sortBy === item.id}
                                                onClick={() => setSortBy(item.id)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        handleSearch();
                                        setShowFilters(false);
                                    }}
                                    className="w-full py-3 bg-[var(--color-brand-primary)] text-white rounded-full font-bold shadow-lg shadow-emerald-900/10"
                                >
                                    {t.common.apply}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Area */}
                <div className="p-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6">
                            {searchResults.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                />
                            ))}
                        </div>
                    ) : query === '' && !showFilters ? (
                        /* Search History */
                        <div className="">
                            {searchHistory.length > 0 ? (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-500 text-sm text-left rtl:text-right">{t.search.history}</h4>
                                    <div className="flex flex-col">
                                        {searchHistory.map((item, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setQuery(item);
                                                    handleSearch(item);
                                                }}
                                                className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <History size={18} className="text-gray-400" />
                                                    <span className="text-gray-900 font-medium">{item}</span>
                                                </div>
                                                <button onClick={(e) => removeHistoryItem(e, item)} className={`p-1 text-gray-400 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <Search size={64} strokeWidth={1} className="mb-4" />
                                    <p className="font-medium text-center">{t.search.placeholder}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <SearchX size={64} strokeWidth={1} className="mb-4" />
                            <p className="font-medium text-center">{t.search.no_results} "{query}"</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}



function FilterChip({ label, isSelected, onClick }: { label: string, isSelected: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected
                ? 'bg-[var(--color-brand-primary)] text-white'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
        >
            {label}
        </button>
    );
}
