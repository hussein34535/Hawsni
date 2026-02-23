import { motion } from 'framer-motion';
import { Category } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface CategoryListProps {
    categories: Category[];
    isLoading?: boolean;
}

export default function CategoryList({ categories, isLoading }: CategoryListProps) {
    const { language, isRTL } = useLanguage();

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
        <div className="h-[120px] w-full mt-4 mb-4">
            <div className="flex overflow-x-auto h-full scrollbar-none items-center">
                {categories.map((cat, index) => (
                    <motion.div
                        key={cat._id}
                        whileHover={{ y: -2 }}
                        className={`w-[100px] bg-white rounded-xl flex flex-col items-center justify-center cursor-pointer flex-shrink-0 h-[100px] shadow-[0_2px_8px_rgba(156,163,175,0.1)] ${isRTL
                            ? (index === 0 ? 'mr-4 ml-3' : 'ml-3')
                            : (index === 0 ? 'ml-4 mr-3' : 'mr-3')
                            }`}
                    >
                        {/* Image Container */}
                        <div className="p-3 bg-blue-50 rounded-full mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={cat.image} alt={cat.name} className="w-10 h-10 object-cover rounded-full" />
                        </div>

                        {/* Category Name */}
                        <span className="text-[14px] font-medium text-gray-900 text-center px-1 truncate w-full">
                            {getTranslatedName(cat)}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
