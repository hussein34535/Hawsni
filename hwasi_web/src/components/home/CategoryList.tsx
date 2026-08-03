'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Category } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface CategoryListProps {
    categories: Category[];
    isLoading?: boolean;
}

export default function CategoryList({ categories, isLoading }: CategoryListProps) {
    const { language, isRTL } = useLanguage();
    const router = useRouter();

    const getTranslatedName = (cat: Category) => {
        if (language === 'ar') {
            if (cat.name_ar) return cat.name_ar;
            const mapping: Record<string, string> = {
                'Men': 'رجالي',
                'Women': 'حريمي',
                'Kids': 'أطفال',
                'Home': 'منزل',
                'Electronics': 'إلكترونيات',
                'Accessories': 'إكسسوارات'
            };
            return mapping[cat.name] || cat.name;
        }
        return cat.name;
    };

    if (isLoading) {
        return (
            <div className="h-[120px] w-full flex items-center justify-center">
                <div className="h-8 w-8 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[130px] w-full mt-4 mb-4">
            <div className="flex overflow-x-auto h-full scrollbar-none items-center">
                {categories.map((cat, index) => (
                    <motion.div
                        key={cat._id || (cat as any).id}
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push(`/search?category=${encodeURIComponent(cat._id || (cat as any).id)}`)}
                        className={`w-[90px] bg-white rounded-2xl flex flex-col items-center justify-center cursor-pointer flex-shrink-0 h-[105px] border border-gray-100 shadow-sm hover:shadow-md transition-all ${isRTL
                            ? (index === 0 ? 'mr-4 ml-3' : 'ml-3')
                            : (index === 0 ? 'ml-4 mr-3' : 'mr-3')
                            }`}
                    >
                        {/* Image Container */}
                        <div className="w-14 h-14 bg-gray-50 rounded-full mb-3 overflow-hidden border border-gray-100 p-1 flex mt-2">
                            {cat.image ? (
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-gray-400">?</span>
                                </div>
                            )}
                        </div>

                        {/* Category Name */}
                        <span className="text-[12px] font-bold text-gray-800 text-center px-1 truncate w-full mb-1">
                            {getTranslatedName(cat)}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
