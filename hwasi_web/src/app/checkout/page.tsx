'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck, Tag, User, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';
import { useToastStore } from '@/store/toastStore';
import { checkoutService } from '@/services/checkoutService';
import { trackEvent } from '@/components/analytics/FacebookPixel';
import OrderReceipt from '@/components/checkout/OrderReceipt';
import MeshBackground from '@/components/checkout/MeshBackground';

import { useAuthStore } from '@/store/authStore';

// قائمة المحافظات لتسهيل وتسريع الطلب
const EGYPT_GOVS =[
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'القليوبية', 'المنيا', 'الغربية', 'الإسماعيلية', 'أسيوط', 'الفيوم', 'سوهاج', 'قنا', 'بني سويف', 'أسوان', 'البحيرة', 'كفر الشيخ', 'المنوفية', 'دمياط', 'الأقصر', 'البحر الأحمر', 'السويس', 'بورسعيد', 'مطروح', 'شمال سيناء', 'جنوب سيناء'
];

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const { isRTL } = useLanguage();
    const { showToast } = useToastStore();

    const [shippingSettings, setShippingSettings] = useState<any>(null);
    const [selectedGovName, setSelectedGovName] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState('');

    const subtotal = getTotal();

    useEffect(() => {
        checkoutService.getShippingSettings()
            .then((res) => { if (res?.success) setShippingSettings(res.settings || null); })
            .catch(() => { });
    }, []);

    // تكلفة الشحن من إعدادات لوحة التحكم (تكلفة التوصيل + overrides المحافظات + حد الشحن المجاني)
    const govOverrides = shippingSettings?.governorate_settings || {};
    const govConfig = selectedGovName ? govOverrides[selectedGovName] : null;
    const baseShippingCost = govConfig && govConfig.cost !== undefined
        ? (parseFloat(govConfig.cost) || 0)
        : (parseFloat(shippingSettings?.delivery_cost) || 0);
    const freeShippingThreshold = parseFloat(shippingSettings?.free_shipping_threshold) || 0;
    const shippingFee = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : baseShippingCost;

    const total = subtotal + shippingFee - discount;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Only redirect to cart if items are 0 AND we are NOT in the middle of a success redirect
        // Wait for component to mount first to read persisted cart properly
        if (isMounted && items.length === 0 && !isRedirecting) {
            router.push('/cart');
        }
    }, [items.length, router, isRedirecting, isMounted]);

    if (!isMounted) return null;
    if (items.length === 0 && !isRedirecting) return null;

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-cairo pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
            <MeshBackground />

            {/* Professional Success Transition Overlay */}
            {isRedirecting && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
                        </div>
                    </div>
                    <h2 className="mt-8 text-2xl font-black text-gray-900 animate-pulse">
                        {isRTL ? 'تم تأكيد طلبك بنجاح!' : 'Order Confirmed!'}
                    </h2>
                    <p className="mt-2 text-gray-400 font-bold">
                        {isRTL ? 'جاري نقلك لملخص الطلب...' : 'Redirecting to your receipt...'}
                    </p>
                </div>
            )}

            {/* الهيدر العلوي - بخلفية صلبة لمنع التعليق */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
                    >
                        {isRTL ? <ArrowRight className="w-5 h-5 text-gray-900" /> : <ArrowLeft className="w-5 h-5 text-gray-900" />}
                    </button>
                    <h1 className="text-xl font-black text-gray-900">
                        {isRTL ? 'إتمام الطلب' : 'Checkout'}
                    </h1>
                    <div className="w-12 text-center">
                        <ShieldCheck className="w-6 h-6 text-[#0E4435] mx-auto opacity-50" />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pt-6 pb-32 md:pt-10 relative">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
                    
                    <div className="w-full lg:w-3/5 order-1">
                        <CheckoutForm 
                            isRTL={isRTL} 
                            items={items}
                            user={user}
                            subtotal={subtotal}
                            shippingFee={shippingFee}
                            discount={discount}
                            total={total}
                            appliedCoupon={appliedCoupon}
                            clearCart={clearCart}
                            router={router}
                            showToast={showToast}
                            setDiscount={setDiscount}
                            setAppliedCoupon={setAppliedCoupon}
                            onGovernorateChange={setSelectedGovName}
                            isSubmitting={isSubmitting}
                            setIsSubmitting={setIsSubmitting}
                            setIsRedirecting={setIsRedirecting}
                        />
                    </div>

                    <div className="w-full lg:w-2/5 order-2">
                        <OrderReceipt 
                            subtotal={subtotal}
                            shippingFee={shippingFee}
                            discount={discount}
                            total={total}
                            couponApplied={!!appliedCoupon}
                            selectedGov={selectedGovName}
                            deliveryEstimate={{ min: 2, max: 5 }}
                        />
                    </div>

                </div>
            </main>
        </div>
    );
}

// ----------------------------------------------------------------------
// مكوّن الفورم المستقل: تم تحويله لـ Uncontrolled لمنع تهنيج الكتابة
// ----------------------------------------------------------------------

// تصميم بريميوم وأنيق للخانات (على طريقة المواقع الكبرى مثل آبل و Stripe)
const PREMIUM_INPUT_CLASS = "w-full h-[52px] px-4 bg-[#F9FAFB] border border-gray-200 text-gray-900 text-[15px] font-bold rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E4435]/15 focus:border-[#0E4435] transition-all placeholder:text-gray-400 placeholder:font-medium appearance-none shadow-sm";
const PREMIUM_LABEL_CLASS = "block text-[13px] font-black text-gray-600 mb-1.5 px-1 tracking-wide";

function CheckoutForm({ isRTL, items, user, subtotal, shippingFee, discount, total, appliedCoupon, clearCart, router, showToast, setDiscount, setAppliedCoupon, onGovernorateChange, isSubmitting, setIsSubmitting, setIsRedirecting }: any) {
    
    // Bosta API States
    const [cities, setCities] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [selectedCityId, setSelectedCityId] = useState('');
    const [isLoadingCities, setIsLoadingCities] = useState(true);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

    // Payment Method State
    const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');

    // Searchable District States
    const [districtSearch, setDistrictSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const res = await checkoutService.getCities();
                if (res.success) {
                    setCities(res.cities);
                }
            } catch (err) {
                console.error("Failed to load cities");
            } finally {
                setIsLoadingCities(false);
            }
        };
        fetchCities();
    }, []);

    useEffect(() => {
        const fetchDistricts = async () => {
            if (!selectedCityId) {
                setDistricts([]);
                setDistrictSearch('');
                return;
            }
            setIsLoadingDistricts(true);
            try {
                const res = await checkoutService.getDistricts(selectedCityId);
                if (res.success) {
                    setDistricts(res.districts);
                    setDistrictSearch(''); // Reset search when city changes
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
        
        // جلب البيانات مباشرة من الفورم
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const phone2 = formData.get('phone2') as string;
        const email = formData.get('email') as string;
        
        const citySelect = e.currentTarget.elements.namedItem('governorate') as HTMLSelectElement;
        const governorateName = citySelect?.options[citySelect.selectedIndex]?.text || '';
        
        const cityName = districtSearch;

        const street = formData.get('street') as string;
        const notes = formData.get('notes') as string;

        // التحقق من صحة البيانات (Validation)
        if (name.trim().split(/\s+/).length < 2) {
            showToast(isRTL ? 'يرجى إدخال الاسم ثنائياً على الأقل' : 'Please enter at least two names', 'error');
            setIsSubmitting(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const phoneRegex = /^01[0125][0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
            showToast(isRTL ? 'يرجى إدخال رقم هاتف مصري صحيح' : 'Please enter a valid Egyptian phone number', 'error');
            setIsSubmitting(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (phone2 && !phoneRegex.test(phone2)) {
            showToast(isRTL ? 'يرجى إدخال رقم هاتف بديل صحيح' : 'Please enter a valid alternative phone number', 'error');
            setIsSubmitting(false);
            return;
        }

        if (!governorateName || !cityName) {
            showToast(isRTL ? 'يرجى اختيار المحافظة والمدينة' : 'Please select governorate and city', 'error');
            setIsSubmitting(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            const eventId = `purchase_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

            const orderData = {
                items: items.map((i: any) => ({
                    product: i.productId,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    size: i.size,
                    color: i.color,
                    image_url: i.imageUrl,
                    accessories: i.accessories
                })),
                shippingAddress: {
                    street: street,
                    city: cityName,
                    state: governorateName,
                    country: 'Egypt'
                },
                paymentMethod: 'cash_on_delivery',
                subtotal,
                shippingFee,
                discount,
                totalAmount: total,
                couponCode: appliedCoupon || undefined,
                guestName: name,
                guestPhone: phone,
                guestAlternativePhone: phone2 || undefined,
                guestEmail: email || undefined,
                notes: notes || undefined,
                conversionEventId: eventId,
            };

            const res = await checkoutService.placeOrder(orderData);
            
            if (res.success) {
                // Fire Meta Pixel only after server confirms the order
                trackEvent('Purchase', {
                    value: total,
                    currency: 'EGP',
                    content_ids: items.map((i: any) => i.productId),
                    content_type: 'product',
                    num_items: items.reduce((acc: number, i: any) => acc + i.quantity, 0)
                }, { eventID: eventId });
                // Professional redirect flow:
                // 1. Lock the page (isRedirecting = true)
                // 2. Clear the cart (safe now because of the lock)
                // 3. Navigate
                setIsRedirecting(true);
                clearCart();
                router.push(`/order-success/${res.order.id || res.order._id}`);
            } else {
                showToast(isRTL ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'Failed to place order', 'error');
                setIsSubmitting(false);
            }
        } catch (error: any) {
            console.error(error);
            const errorMsg = typeof error === 'string' ? error : (error.message || (isRTL ? 'حدث خطأ في النظام' : 'System error'));
            showToast(errorMsg, 'error');
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* قسم البرومو كود - موقوف حالياً بناء على طلبك */}
            {/* 
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <label className="flex items-center gap-2 mb-3 text-sm font-black text-gray-900">
                    <Tag className="w-5 h-5 text-[#0E4435]" />
                    {isRTL ? 'هل لديك كود خصم؟' : 'Have a promo code?'}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder={isRTL ? 'أدخل الكود هنا' : 'Enter code here'}
                        className={`flex-1 ${INPUT_CLASS} uppercase ${isRTL ? 'text-right' : 'text-left'}`}
                    />
                    <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCode}
                        className="shrink-0 h-[58px] px-8 bg-gray-900 hover:bg-black text-white rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-gray-900/20"
                    >
                        {isApplyingPromo ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isRTL ? 'تطبيق الخصم' : 'Apply Code')}
                    </button>
                </div>
                {appliedCoupon && (
                    <p className="mt-3 text-emerald-600 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        {isRTL ? `تم تفعيل الكود بنجاح: ${appliedCoupon}` : `Code applied: ${appliedCoupon}`}
                    </p>
                )}
            </div>
            */}

            {/* 1. بيانات التواصل */}
            <div className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/50 space-y-4 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center border border-gray-100">
                        <User className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">{isRTL ? 'بيانات التواصل' : 'Contact Information'}</h2>
                </div>

                {/* 1. Name */}
                <div>
                    <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
                    <input
                        type="text"
                        name="name"
                        required
                        defaultValue={user?.name || ""}
                        className={PREMIUM_INPUT_CLASS}
                        placeholder={isRTL ? "الاسم ثنائي..." : "First and Last Name..."}
                    />
                </div>

                {/* 2 & 3. Phone and Alt Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            defaultValue={user?.phone || ""}
                            className={PREMIUM_INPUT_CLASS}
                            placeholder="010xxxxxxxx"
                            dir="ltr"
                        />
                    </div>
                    <div>
                        <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'رقم بديل (اختياري)' : 'Alt Phone (Optional)'}</label>
                        <input
                            type="tel"
                            name="phone2"
                            defaultValue=""
                            className={PREMIUM_INPUT_CLASS}
                            placeholder="010xxxxxxxx"
                            dir="ltr"
                        />
                    </div>
                </div>

                {/* 4. Email */}
                <div>
                    <label className={PREMIUM_LABEL_CLASS}>
                        {isRTL ? 'البريد الإلكتروني ' : 'Email '}
                        <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded ml-1">{isRTL ? 'ننصح به' : 'Recommended'}</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        defaultValue={user?.email || ""}
                        className={PREMIUM_INPUT_CLASS}
                        placeholder="example@email.com"
                        dir="ltr"
                    />
                </div>
            </div>

            {/* 2. عنوان التوصيل */}
            <div className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/50 space-y-4 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center border border-gray-100">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">{isRTL ? 'عنوان التوصيل' : 'Delivery Address'}</h2>
                </div>

                {/* 5 & 6. Governorate and City (Bosta) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'المحافظة' : 'Governorate'}</label>
                        <select
                            name="governorate"
                            required
                            value={selectedCityId}
                            onChange={(e) => {
                                setSelectedCityId(e.target.value);
                                const gov = cities.find((c: any) => String(c.id) === String(e.target.value));
                                if (onGovernorateChange) onGovernorateChange(gov ? (isRTL ? gov.arabicName : gov.name) : '');
                            }}
                            className={`${PREMIUM_INPUT_CLASS} cursor-pointer pr-10`}
                            disabled={isLoadingCities}
                        >
                            <option value="" disabled>{isLoadingCities ? (isRTL ? 'جاري التحميل...' : 'Loading...') : (isRTL ? 'اختر المحافظة' : 'Select Governorate')}</option>
                            {cities.map(gov => (
                                <option key={gov.id} value={gov.id}>{isRTL ? gov.arabicName : gov.name}</option>
                            ))}
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} top-7 flex items-center text-gray-400`}>
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
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
                                // Delay closing to allow clicking an option
                                setTimeout(() => setIsDropdownOpen(false), 200);
                            }}
                            disabled={!selectedCityId || isLoadingDistricts}
                            className={`${PREMIUM_INPUT_CLASS} ${isRTL ? 'text-right' : 'text-left'}`}
                            placeholder={isLoadingDistricts ? (isRTL ? 'جاري التحميل...' : 'Loading...') : (isRTL ? 'ابحث عن منطقتك...' : 'Search area...')}
                            autoComplete="off"
                        />
                        
                        {isDropdownOpen && selectedCityId && filteredDistricts.length > 0 && (
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
                                        <span className="text-[10px] text-gray-400 font-medium">{isRTL ? dist.name : dist.arabicName}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {isDropdownOpen && selectedCityId && districtSearch && filteredDistricts.length === 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center">
                                <p className="text-sm text-gray-500 font-bold">{isRTL ? 'لا يوجد نتائج، يمكنك كتابة المنطقة يدوياً' : 'No results, you can type manually'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 7. Detailed Address */}
                <div>
                    <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'العنوان بالتفصيل' : 'Detailed Address'}</label>
                    <input
                        type="text"
                        name="street"
                        required
                        defaultValue=""
                        className={PREMIUM_INPUT_CLASS}
                        placeholder={isRTL ? 'اسم الشارع، رقم العمارة، رقم الشقة...' : 'Street name, building no, apartment no...'}
                    />
                </div>

                {/* 8. Notes */}
                <div>
                    <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'ملاحظات إضافية (اختياري)' : 'Order Notes (Optional)'}</label>
                    <textarea
                        name="notes"
                        defaultValue=""
                        className={`${PREMIUM_INPUT_CLASS} h-auto py-3 resize-none`}
                        rows={2}
                        placeholder={isRTL ? 'أي ملاحظات خاصة بالتوصيل أو الطلب...' : 'Any special instructions...'}
                    />
                </div>
            </div>

            {/* 3. طريقة الدفع */}
            <div className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/50 space-y-4 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center border border-gray-100">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    </div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">{isRTL ? 'طريقة الدفع' : 'Payment Method'}</h2>
                </div>

                <div className="space-y-3">
                    {/* Cash on Delivery */}
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('cash_on_delivery')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-right ${paymentMethod === 'cash_on_delivery'
                            ? 'border-[#0E4435] bg-[#0E4435]/5 shadow-[0_2px_10px_rgba(14,68,53,0.08)]'
                            : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                    >
                        <div className="w-14 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-gray-100 overflow-hidden">
                            <img src="/payments/cod.svg" alt="Cash on Delivery" className="w-9 h-9 object-contain" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[15px] font-black text-gray-900">{isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</p>
                            <p className="text-[12px] text-gray-500 font-medium">{isRTL ? 'ادفع كاش عند وصول الطلب' : 'Pay in cash when the order arrives'}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'cash_on_delivery' ? 'border-[#0E4435]' : 'border-gray-300'}`}>
                            {paymentMethod === 'cash_on_delivery' && <div className="w-2.5 h-2.5 rounded-full bg-[#0E4435]" />}
                        </div>
                    </button>
                </div>

            </div>

            {/* شريط تأكيد الطلب السفلي الثابت - بلون صلب بدون ضبابية لمنع التعليق */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 md:p-6 border-t border-gray-200 rounded-t-[2rem] z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto px-4">
                    
                    {/* السعر الإجمالي */}
                    <div className="flex-1 text-right">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{isRTL ? 'الإجمالي المطلوب' : 'Total Amount'}</p>
                        {/* تم إزالة رسالة الضمان والشروط بناء على طلبك */}
                        <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                            {Math.round(total).toLocaleString()} <span className="text-xs font-bold text-gray-400 ml-1">{isRTL ? 'ج.م' : 'EGP'}</span>
                        </p>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-14 px-8 bg-[#0E4435] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/20 disabled:opacity-60 active:scale-95 transition-all hover:bg-[#0a3126]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{isRTL ? 'جاري...' : 'Processing'}</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={18} />
                                <span>{isRTL ? 'تأكيد الطلب' : 'Confirm Order'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}