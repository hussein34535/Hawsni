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

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 relative">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    
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

// تصميم الخانات الاحترافي (Floating Labels)
const FLOATING_INPUT_CLASS = "block px-5 pb-3 pt-7 w-full text-base font-black text-gray-900 bg-gray-50 rounded-2xl border border-gray-200 appearance-none focus:outline-none focus:ring-4 focus:ring-[#0E4435]/15 focus:border-[#0E4435] peer shadow-sm transition-all";
const FLOATING_LABEL_CLASS = "absolute text-sm font-black text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#0E4435]";

function CheckoutForm({ isRTL, items, subtotal, shippingFee, discount, total, appliedCoupon, clearCart, router, showToast, setDiscount, setAppliedCoupon }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);
    
    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setIsApplyingPromo(true);
        try {
            if (promoCode.toUpperCase() === 'WELCOME10') {
                setDiscount(subtotal * 0.1); 
                setAppliedCoupon(promoCode.toUpperCase());
                showToast(isRTL ? 'تم تفعيل كود الخصم بنجاح!' : 'Promo code applied!', 'success');
            } else {
                showToast(isRTL ? 'كود الخصم غير صحيح أو منتهي' : 'Invalid promo code', 'error');
            }
        } catch (err) {
            showToast(isRTL ? 'حدث خطأ أثناء تطبيق الكود' : 'Error applying code', 'error');
        } finally {
            setIsApplyingPromo(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // جلب البيانات مباشرة من الفورم بدون State
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const governorate = formData.get('governorate') as string;
        const city = formData.get('city') as string;
        const street = formData.get('street') as string;

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
                    city: city,
                    state: governorate,
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
        <form onSubmit={handleSubmit} className="space-y-8 pb-32">
            
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

            {/* بيانات التوصيل */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900">{isRTL ? 'بيانات التوصيل' : 'Delivery Details'}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            defaultValue=""
                            className={FLOATING_INPUT_CLASS}
                            placeholder=" "
                        />
                        <label htmlFor="name" className={`${FLOATING_LABEL_CLASS} ${isRTL ? 'right-5 peer-focus:right-5' : 'left-5 peer-focus:left-5'}`}>
                            {isRTL ? 'الاسم بالكامل' : 'Full Name'}
                        </label>
                    </div>

                    <div className="relative">
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            required
                            defaultValue=""
                            className={`${FLOATING_INPUT_CLASS} ${isRTL ? 'text-right' : 'text-left'}`}
                            placeholder=" "
                            dir="ltr"
                        />
                        <label htmlFor="phone" className={`${FLOATING_LABEL_CLASS} ${isRTL ? 'right-5 peer-focus:right-5' : 'left-5 peer-focus:left-5'}`}>
                            {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <select
                            id="governorate"
                            name="governorate"
                            required
                            defaultValue="القاهرة"
                            className={`${FLOATING_INPUT_CLASS} cursor-pointer`}
                        >
                            {EGYPT_GOVS.map(gov => (
                                <option key={gov} value={gov}>{gov}</option>
                            ))}
                        </select>
                        <label htmlFor="governorate" className={`${FLOATING_LABEL_CLASS} ${isRTL ? 'right-5 peer-focus:right-5' : 'left-5 peer-focus:left-5'} -translate-y-3 scale-75 text-[#0E4435]`}>
                            {isRTL ? 'المحافظة' : 'Governorate'}
                        </label>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            id="city"
                            name="city"
                            required
                            defaultValue=""
                            className={FLOATING_INPUT_CLASS}
                            placeholder=" "
                        />
                        <label htmlFor="city" className={`${FLOATING_LABEL_CLASS} ${isRTL ? 'right-5 peer-focus:right-5' : 'left-5 peer-focus:left-5'}`}>
                            {isRTL ? 'المدينة / المنطقة' : 'City / Area'}
                        </label>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        id="street"
                        name="street"
                        required
                        defaultValue=""
                        className={FLOATING_INPUT_CLASS}
                        placeholder=" "
                    />
                    <label htmlFor="street" className={`${FLOATING_LABEL_CLASS} ${isRTL ? 'right-5 peer-focus:right-5' : 'left-5 peer-focus:left-5'}`}>
                        {isRTL ? 'العنوان بالتفصيل (الشارع، العمارة، الشقة)' : 'Detailed Address'}
                    </label>
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