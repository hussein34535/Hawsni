'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { addressService, Address } from '@/services/addressService';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddressesPage() {
    const { t, isRTL, language } = useLanguage();
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const data = await addressService.getAddresses();
                setAddresses(data.addresses || []);
            } catch (error) {
                console.error('Failed to fetch addresses:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAddresses();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm(t.addresses.delete_confirm)) {
            try {
                await addressService.deleteAddress(id);
                setAddresses(addresses.filter(a => a._id !== id));
            } catch (error) {
                console.error('Action failed:', error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-16 gap-3">
                <button onClick={() => router.back()} className={`p-2 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{t.addresses.title}</h1>
            </header>

            <main className="p-4 sm:p-6 max-w-2xl mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {addresses.map((addr) => (
                                <motion.div
                                    key={addr._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-[24px] p-5 shadow-[var(--shadow-soft)] border border-gray-50 relative group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[var(--color-brand-primary)] shrink-0">
                                            <MapPin size={24} />
                                        </div>
                                        <div className="flex-1 text-left rtl:text-right">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 capitalize">{addr.type}</h3>
                                                {addr.isDefault && (
                                                    <span className="bg-emerald-50 text-[var(--color-brand-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        {t.addresses.default}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{addr.street}</p>
                                            <p className="text-sm text-gray-400">{addr.city}</p>
                                        </div>
                                    </div>

                                    <div className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} flex gap-1 items-center`}>
                                        <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(addr._id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <button className="w-full h-16 border-2 border-dashed border-gray-200 rounded-[24px] flex items-center justify-center gap-2 text-gray-500 font-bold hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-all">
                            <Plus size={20} />
                            <span>{t.addresses.add_new}</span>
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
