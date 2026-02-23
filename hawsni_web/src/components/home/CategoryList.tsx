import { motion } from 'framer-motion';
import { Category } from '@/types';

interface CategoryListProps {
    categories: Category[];
    isLoading?: boolean;
}

export default function CategoryList({ categories, isLoading }: CategoryListProps) {
    if (isLoading) {
        return (
            <section className="py-8">
                <div className="flex gap-6 overflow-x-auto px-4 pb-4 no-scrollbar">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-3 min-w-[80px] animate-pulse">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-full" />
                            <div className="w-12 h-3 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="py-8">
            <div className="flex items-center gap-3 px-4 mb-6">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Shop by Category</h3>
                <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-500 text-xs">✨</span>
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto px-4 pb-4 no-scrollbar">
                {categories.map((cat) => (
                    <motion.div
                        key={cat._id}
                        whileHover={{ y: -5 }}
                        className="flex flex-col items-center gap-3 min-w-[80px]"
                    >
                        <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-[var(--color-brand-primary)] to-[var(--color-brand-accent)] shadow-lg shadow-emerald-900/10 transition-transform active:scale-95 cursor-pointer">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center overflow-hidden p-3 underline-offset-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <span className="text-xs md:text-sm font-semibold text-gray-700">{cat.name}</span>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
