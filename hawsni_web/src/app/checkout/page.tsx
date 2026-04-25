'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck, Tag, User, Loader2, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';
import { useToastStore } from '@/store/toastStore';
import { checkoutService } from '@/services/checkoutService';
import OrderReceipt from '@/components/checkout/OrderReceipt';
import MeshBackground from '@/components/checkout/MeshBackground';

// قائمة المحافظات لتسهيل وتسريع الطلب
const EGYPT_GOVS =[
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'القليوبية', 'المنيا', 'الغربية', 'الإسماعيلية', 'أسيوط', 'الفيوم', 'سوهاج', 'قنا', 'بني سويف', 'أسوان', 'البحيرة', 'كفر الشيخ', 'المنوفية', 'دمياط', 'الأقصر', 'البحر الأحمر', 'السويس', 'بورسعيد', 'مطروح', 'شمال سيناء', 'جنوب سيناء'
];

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const { isRTL } = useLanguage();
    const { showToast } = useToastStore();

    const [shippingFee] = useState(50);
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState('');

    const subtotal = getTotal();
    const total = subtotal + shippingFee - discount;

    useEffect(() => {
        if (items.length === 0) {
            router.push('/cart');
        }
    }, [items.length, router]);

    if (items.length === 0) return null;

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-cairo pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
            <MeshBackground />

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
                        />
                    </div>

                    <div className="w-full lg:w-2/5 order-2">
                        <OrderReceipt 
                            subtotal={subtotal}
                            shippingFee={shippingFee}
                            discount={discount}
                            total={total}
                            couponApplied={!!appliedCoupon}
                            selectedGov="القاهرة"
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

function CheckoutForm({ isRTL, items, subtotal, shippingFee, discount, total, appliedCoupon, clearCart, router, showToast, setDiscount, setAppliedCoupon }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Bosta API States
    const [cities, setCities] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [selectedCityId, setSelectedCityId] = useState('');
    const [isLoadingCities, setIsLoadingCities] = useState(true);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

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
        
        const districtSelect = e.currentTarget.elements.namedItem('city') as HTMLSelectElement;
        const cityName = districtSelect?.options[districtSelect.selectedIndex]?.text || '';

        const street = formData.get('street') as string;
        const notes = formData.get('notes') as string;

        try {
            const orderData = {
                items: items.map((i: any) => ({
                    product: i.productId,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    size: i.size,
                    color: i.color,
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
            };

            const res = await checkoutService.placeOrder(orderData);
            
            if (res.success) {
                clearCart();
                router.push(`/order-success/${res.order.id || res.order._id}`);
            } else {
                showToast(isRTL ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'Failed to place order', 'error');
                setIsSubmitting(false);
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.message || (isRTL ? 'حدث خطأ في النظام' : 'System error'), 'error');
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

            {/* بيانات التوصيل المجمعة بالترتيب المطلوب */}
            <div className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/50 space-y-4 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center border border-gray-100">
                        <User className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">{isRTL ? 'بيانات التوصيل' : 'Delivery Details'}</h2>
                </div>

                {/* 1. Name */}
                <div>
                    <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
                    <input
                        type="text"
                        name="name"
                        required
                        defaultValue=""
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
                            defaultValue=""
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
                        defaultValue=""
                        className={PREMIUM_INPUT_CLASS}
                        placeholder="example@email.com"
                        dir="ltr"
                    />
                </div>

                {/* 5 & 6. Governorate and City (Bosta) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100/60 mt-2">
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
                        <div className={`pointer-events-none absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} top-7 flex items-center text-gray-400`}>
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    <div className="relative">
                        <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'المدينة / المنطقة' : 'City / Area'}</label>
                        <select
                            name="city"
                            required
                            disabled={!selectedCityId || isLoadingDistricts}
                            className={`${PREMIUM_INPUT_CLASS} cursor-pointer pr-10`}
                        >
                            <option value="" disabled>{isLoadingDistricts ? (isRTL ? 'جاري التحميل...' : 'Loading...') : (isRTL ? 'اختر المدينة' : 'Select City')}</option>
                            {districts.map(dist => (
                                <option key={dist.id} value={dist.id}>{isRTL ? dist.arabicName : dist.name}</option>
                            ))}
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} top-7 flex items-center text-gray-400`}>
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                {/* 7. Detailed Address */}
                <div>
                    <label className={PREMIUM_LABEL_CLASS}>{isRTL ? 'العنوان بالتفصيل (الشارع، العمارة، الشقة)' : 'Detailed Address'}</label>
                    <input
                        type="text"
                        name="street"
                        required
                        defaultValue=""
                        className={PREMIUM_INPUT_CLASS}
                        placeholder={isRTL ? 'اسم الشارع، رقم العمارة، رقم الشقة...' : 'Street name, building no...'}
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

            {/* شريط تأكيد الطلب السفلي الثابت - بلون صلب بدون ضبابية لمنع التعليق */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 md:p-6 border-t border-gray-200 rounded-t-[2rem] z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto px-4">
                    
                    {/* السعر الإجمالي */}
                    <div className="flex-1 text-right">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{isRTL ? 'الإجمالي المطلوب' : 'Total Amount'}</p>
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