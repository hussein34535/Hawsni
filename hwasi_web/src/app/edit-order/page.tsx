'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    ArrowLeft, 
    ArrowRight, 
    ShieldCheck, 
    User, 
    Loader2, 
    CheckCircle2, 
    MapPin,
    AlertCircle,
    Edit3
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToastStore } from '@/store/toastStore';
import { checkoutService } from '@/services/checkoutService';
import MeshBackground from '@/components/checkout/MeshBackground';

const PREMIUM_INPUT_CLASS = "w-full h-[52px] px-4 bg-[#F9FAFB] border border-gray-200 text-gray-900 text-[15px] font-bold rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E4435]/15 focus:border-[#0E4435] transition-all placeholder:text-gray-400 placeholder:font-medium appearance-none shadow-sm";
const PREMIUM_LABEL_CLASS = "block text-[13px] font-black text-gray-600 mb-1.5 px-1 tracking-wide";

function EditOrderContent() {
    const { isRTL } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToastStore();

    const orderNumberParam = searchParams.get('order_number') || searchParams.get('id') || '';
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [error, setError] = useState('');

    // Bosta API States for the form
    const [cities, setCities] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [selectedCityId, setSelectedCityId] = useState('');
    const [isLoadingCities, setIsLoadingCities] = useState(true);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    
    // Searchable District States
    const [districtSearch, setDistrictSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!orderNumberParam) {
            setError(isRTL ? 'رقم الطلب غير موجود' : 'Order number not found');
            setIsLoading(false);
            return;
        }

        try {
            const res = await checkoutService.getOrder(orderNumberParam);
            if (res.success) {
                if (res.order.status !== 'Processing') {
                    setError(isRTL ? 'لا يمكن تعديل الطلب بعد شحنه' : 'Order cannot be edited after shipping');
                } else {
                    setOrder(res.order);
                    // Initialize city/district if available
                    if (res.order.shipping_address) {
                        setDistrictSearch(res.order.shipping_address.city || '');
                    }
                }
            } else {
                setError(isRTL ? 'الطلب غير موجود' : 'Order not found');
            }
        } catch (err) {
            setError(isRTL ? 'حدث خطأ في تحميل الطلب' : 'Failed to load order');
        } finally {
            setIsLoading(false);
        }
    }, [orderNumberParam, isRTL]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const res = await checkoutService.getCities();
                if (res.success) {
                    setCities(res.cities);
                    // Try to match current order's state to city ID
                    if (order?.shipping_address?.state) {
                        const matchedCity = res.cities.find((c: any) => 
                            c.arabicName === order.shipping_address.state || c.name === order.shipping_address.state
                        );
                        if (matchedCity) setSelectedCityId(matchedCity.id);
                    }
                }
            } catch (err) {
                console.error("Failed to load cities");
            } finally {
                setIsLoadingCities(false);
            }
        };
        if (order) fetchCities();
    }, [order]);

    useEffect(() => {
        const fetchDistricts = async () => {
            if (!selectedCityId) {
                setDistricts([]);
                return;
            }
            setIsLoadingDistricts(true);
            try {
                const res = await checkoutService.getDistricts(selectedCityId);
                if (res.success) {
                    setDistricts(res.districts);
                }
            } catch (err) {
                console.error("Failed to load districts");
            } finally {
                setIsLoadingDistricts(false);
            }
        };
        fetchDistricts();
    }, [selectedCityId]);

    const filteredDistricts = districts.filter(d => 
        (isRTL ? d.arabicName : d.name).toLowerCase().includes(districtSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const formData = new FormData(e.currentTarget);
        const citySelect = e.currentTarget.elements.namedItem('governorate') as HTMLSelectElement;
        const governorateName = citySelect?.options[citySelect.selectedIndex]?.text || '';
        const cityName = districtSearch;
        const street = formData.get('street') as string;
        const notes = formData.get('notes') as string;

        if (!governorateName || !cityName || !street) {
            showToast(isRTL ? 'يرجى إكمال جميع البيانات' : 'Please complete all details', 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            const updateData = {
                shippingAddress: {
                    ...order.shipping_address,
                    street: street,
                    city: cityName,
                    state: governorateName,
                },
                notes: notes
            };

            const res = await checkoutService.updateOrder(order.id, updateData);
            if (res.success) {
                showToast(isRTL ? 'تم تحديث الطلب بنجاح' : 'Order updated successfully', 'success');
                router.push(`/track-order?order_number=${order.order_number}`);
            } else {
                showToast(isRTL ? 'حدث خطأ أثناء التحديث' : 'Failed to update order', 'error');
            }
        } catch (err: any) {
            showToast(err || 'System error', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 text-[#0E4435] animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAFAFA]" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">{error}</h2>
                <button 
                    onClick={() => router.push('/')}
                    className="mt-6 px-8 py-3 bg-[#0E4435] text-white rounded-xl font-bold"
                >
                    {isRTL ? 'العودة للمتجر' : 'Back to Store'}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-cairo pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
            <MeshBackground />
            
            <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
                    >
                        {isRTL ? <ArrowRight className="w-5 h-5 text-gray-900" /> : <ArrowLeft className="w-5 h-5 text-gray-900" />}
                    </button>
                    <h1 className="text-xl font-black text-gray-900">
                        {isRTL ? 'تعديل الطلب' : 'Edit Order'}
                    </h1>
                    <div className="w-12"></div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-10">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-emerald-50 text-[#0E4435] rounded-2xl flex items-center justify-center">
                            <Edit3 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRTL ? 'رقم الطلب' : 'Order Number'}</p>
                            <h2 className="text-lg font-black text-gray-900">#{order.order_number}</h2>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Delivery Address Section */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'المحافظة' : 'Governorate'}</label>
                                    <select
                                        name="governorate"
                                        required
                                        value={selectedCityId}
                                        onChange={(e) => setSelectedCityId(e.target.value)}
                                        className={`${PREMIUM_INPUT_CLASS} cursor-pointer pr-10`}
                                        disabled={isLoadingCities}
                                    >
                                        <option value="" disabled>{isLoadingCities ? (isRTL ? 'جاري التحميل...' : 'Loading...') : (isRTL ? 'اختر المحافظة' : 'Select Governorate')}</option>
                                        {cities.map(gov => (
                                            <option key={gov.id} value={gov.id}>{isRTL ? gov.arabicName : gov.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="relative">
                                    <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'المدينة / المنطقة' : 'City / Area'}</label>
                                    <input
                                        type="text"
                                        value={districtSearch}
                                        onChange={(e) => {
                                            setDistrictSearch(e.target.value);
                                            setIsDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        onBlur={() => {
                                            setTimeout(() => setIsDropdownOpen(false), 200);
                                        }}
                                        className={PREMIUM_INPUT_CLASS}
                                        placeholder={isRTL ? 'ابحث عن منطقتك...' : 'Search area...'}
                                        autoComplete="off"
                                    />
                                    
                                    {isDropdownOpen && filteredDistricts.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                                            {filteredDistricts.map(dist => (
                                                <button
                                                    key={dist.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setDistrictSearch(isRTL ? dist.arabicName : dist.name);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-right hover:bg-gray-50 transition-colors flex flex-col"
                                                >
                                                    <span className="text-[14px] font-bold text-gray-900">{isRTL ? dist.arabicName : dist.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'العنوان بالتفصيل' : 'Detailed Address'}</label>
                                <input
                                    type="text"
                                    name="street"
                                    required
                                    defaultValue={order.shipping_address?.street || ""}
                                    className={PREMIUM_INPUT_CLASS}
                                    placeholder={isRTL ? 'اسم الشارع، رقم العمارة، رقم الشقة...' : 'Street name, building no...'}
                                />
                            </div>

                            <div>
                                <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'ملاحظات إضافية' : 'Order Notes'}</label>
                                <textarea
                                    name="notes"
                                    defaultValue={order.notes || ""}
                                    className={`${PREMIUM_INPUT_CLASS} h-auto py-3 resize-none`}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-14 bg-[#0E4435] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/20 disabled:opacity-60 active:scale-95 transition-all hover:bg-[#0a3126]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{isRTL ? 'جاري الحفظ...' : 'Saving Changes...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} />
                                        <span>{isRTL ? 'حفظ التعديلات' : 'Save Changes'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-bold text-amber-800 leading-relaxed">
                        {isRTL 
                            ? 'يمكنك تعديل العنوان والملاحظات فقط طالما أن الطلب لم يتم شحنه بعد. لتغيير المنتجات يرجى التواصل مع الدعم.' 
                            : 'You can only edit the address and notes as long as the order hasn\'t been shipped yet. To change items, please contact support.'}
                    </p>
                </div>
            </main>
        </div>
    );
}

export default function EditOrderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 text-[#0E4435] animate-spin" />
            </div>
        }>
            <EditOrderContent />
        </Suspense>
    );
}
