'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { addressService, Address } from '@/services/addressService';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/toastStore';
import { Loader2 } from 'lucide-react';

export default function AddressesPage() {
    const { t, isRTL, language } = useLanguage();
    const router = useRouter();
    const { showToast } = useToastStore();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    
    const [formData, setFormData] = useState({
        street: '',
        city: '',
        state: '',
        type: 'home' as 'home' | 'office' | 'other',
        isDefault: false
    });

    const egyptGovernorates = [
        'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
        'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
        'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
        'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'سوهاج', 'الساحل الشمالي'
    ];

    const fetchAddresses = async () => {
        setIsLoading(true);
        try {
            const data = await addressService.getAddresses();
            setAddresses(data.addresses || []);
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleOpenAdd = () => {
        setEditingAddress(null);
        setFormData({ street: '', city: '', state: '', type: 'home', isDefault: false });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (addr: Address) => {
        setEditingAddress(addr);
        setFormData({
            street: addr.street,
            city: addr.city,
            state: addr.state || '',
            type: addr.type,
            isDefault: addr.isDefault
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingAddress) {
                await addressService.updateAddress(editingAddress._id, {
                    ...formData,
                    country: 'Egypt'
                });
                showToast(isRTL ? 'تم تحديث العنوان' : 'Address updated', 'success');
            } else {
                await addressService.addAddress({
                    ...formData,
                    country: 'Egypt'
                });
                showToast(isRTL ? 'تم إضافة العنوان' : 'Address added', 'success');
            }
            setIsModalOpen(false);
            fetchAddresses();
        } catch (error: any) {
            showToast(error || 'Action failed', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا العنوان؟' : 'Are you sure you want to delete this address?')) {
            try {
                await addressService.deleteAddress(id);
                setAddresses(addresses.filter(a => a._id !== id));
                showToast(isRTL ? 'تم الحذف بنجاح' : 'Deleted successfully', 'success');
            } catch (error) {
                console.error('Action failed:', error);
                showToast('Failed to delete', 'error');
            }
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await addressService.setDefaultAddress(id);
            fetchAddresses();
            showToast(isRTL ? 'تم التعيين كافتراضي' : 'Set as default', 'success');
        } catch (error) {
            showToast('Failed to set default', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] pb-24">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center px-4 h-16 gap-3">
                <button onClick={() => router.back()} className={`p-2 ${isRTL ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{isRTL ? 'عناويني' : 'My Addresses'}</h1>
            </header>

            <main className="p-4 sm:p-6 max-w-2xl mx-auto">
                <button 
                    onClick={handleOpenAdd}
                    className="w-full h-16 bg-white border-2 border-dashed border-[var(--color-brand-primary)]/30 rounded-[24px] flex items-center justify-center gap-2 text-[var(--color-brand-primary)] font-black mb-6 hover:bg-emerald-50/50 transition-all active:scale-[0.98]"
                >
                    <Plus size={22} />
                    <span>{isRTL ? 'إضافة عنوان جديد' : 'Add New Address'}</span>
                </button>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-20">
                        <MapPin size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-500 font-bold">{isRTL ? 'لا يوجد عناوين مسجلة' : 'No addresses saved'}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {addresses.map((addr) => (
                                <motion.div
                                    key={addr._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white rounded-[24px] p-5 shadow-[var(--shadow-soft)] border transition-all ${addr.isDefault ? 'border-[var(--color-brand-primary)]/50 bg-emerald-50/10' : 'border-gray-50'}`}
                                    onClick={() => handleOpenEdit(addr)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${addr.isDefault ? 'bg-[var(--color-brand-primary)] text-white shadow-lg shadow-emerald-900/10' : 'bg-gray-100 text-gray-400'}`}>
                                            <MapPin size={24} />
                                        </div>
                                        <div className="flex-1 text-left rtl:text-right">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 capitalize">{isRTL ? (addr.type === 'home' ? 'المنزل' : addr.type === 'office' ? 'المكتب' : 'آخر') : addr.type}</h3>
                                                {addr.isDefault && (
                                                    <span className="bg-emerald-50 text-[var(--color-brand-primary)] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        {isRTL ? 'افتراضي' : 'Default'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-gray-700">{addr.street}</p>
                                            <p className="text-xs text-gray-400 font-medium">{addr.city}, {addr.state}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDelete(addr._id, e)}
                                            className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    
                                    {!addr.isDefault && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleSetDefault(addr._id); }}
                                            className="mt-4 w-full py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold hover:bg-emerald-50 hover:text-[var(--color-brand-primary)] transition-all"
                                        >
                                            {isRTL ? 'تعيين كعنوان افتراضي' : 'Set as Default'}
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Address Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <h2 className="text-2xl font-black text-gray-900 mb-8 font-cairo">
                                {editingAddress ? (isRTL ? 'تعديل العنوان' : 'Edit Address') : (isRTL ? 'عنوان جديد' : 'New Address')}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">{isRTL ? 'الشارع / رقم العقار' : 'Street / Property'}</label>
                                    <input 
                                        required value={formData.street}
                                        onChange={e => setFormData({...formData, street: e.target.value})}
                                        className="w-full h-14 bg-gray-50 border-none rounded-2xl px-5 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">{isRTL ? 'المدينة' : 'City'}</label>
                                        <input 
                                            required value={formData.city}
                                            onChange={e => setFormData({...formData, city: e.target.value})}
                                            className="w-full h-14 bg-gray-50 border-none rounded-2xl px-5 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">{isRTL ? 'المحافظة' : 'Governorate'}</label>
                                        <select 
                                            required value={formData.state}
                                            onChange={e => setFormData({...formData, state: e.target.value})}
                                            className="w-full h-14 bg-gray-50 border-none rounded-2xl px-4 focus:ring-2 focus:ring-[var(--color-brand-primary)] outline-none font-bold appearance-none"
                                        >
                                            <option value="">--</option>
                                            {egyptGovernorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">{isRTL ? 'نوع العنوان' : 'Address Type'}</label>
                                    <div className="flex gap-2">
                                        {(['home', 'office', 'other'] as const).map(t_type => (
                                            <button 
                                                key={t_type} type="button"
                                                onClick={() => setFormData({...formData, type: t_type})}
                                                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${formData.type === t_type ? 'bg-[var(--color-brand-primary)] text-white shadow-lg shadow-emerald-900/10' : 'bg-gray-50 text-gray-400'}`}
                                            >
                                                {isRTL ? (t_type === 'home' ? 'منزل' : t_type === 'office' ? 'مكتب' : 'آخر') : t_type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    type="submit" disabled={isSubmitting}
                                    className={`w-full h-16 bg-black text-white rounded-2xl font-black mt-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isSubmitting ? 'opacity-70' : ''}`}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : (isRTL ? 'حفظ العنوان' : 'Save Address')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
