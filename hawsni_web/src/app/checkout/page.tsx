'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck, Tag, User, Loader2, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';
import { useToastStore } from '@/store/toastStore';
import { checkoutService } from '@/services/checkoutService';
import OrderReceipt from '@/components/checkout/OrderReceipt';

// قائمة المحافظات لتسهيل وتسريع الطلب
const EGYPT_GOVS = [
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
        <div className="bg-[#FAFAFA] font-cairo pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* رأس الصفحة بسيط جداً وبدون sticky لتجنب التعليق على الموبايل */}
            <header className="bg-white border-b-2 border-black relative z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center text-black"
                    >
                        {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                    </button>
                    <h1 className="text-2xl font-black text-black">
                        {isRTL ? 'إتمام الطلب' : 'Checkout'}
                    </h1>
                    <div className="w-12 text-center">
                        <ShieldCheck className="w-7 h-7 text-black mx-auto" />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 relative z-0">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* فورم البيانات - يمين */}
                    <div className="w-full lg:w-3/5 order-2 lg:order-1">
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

                    {/* الفاتورة - يسار */}
                    <div className="w-full lg:w-2/5 order-1 lg:order-2">
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
// مكوّن الفورم المستقل
// ----------------------------------------------------------------------

// تصميم خانة الإدخال بخط أسود حاد وزوايا حادة ليعطي شكل قوي ومميز
const INPUT_CLASS = "w-full bg-white border-2 border-black px-5 py-4 text-black text-[16px] font-black focus:outline-none focus:ring-0 placeholder:text-gray-400 placeholder:font-bold rounded-none appearance-none";
const LABEL_CLASS = "block text-base font-black text-black mb-2";

function CheckoutForm({ isRTL, items, subtotal, shippingFee, discount, total, appliedCoupon, clearCart, router, showToast, setDiscount, setAppliedCoupon }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        governorate: 'القاهرة',
        city: '',
        street: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

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
                    street: formData.street,
                    city: formData.city,
                    state: formData.governorate,
                    country: 'Egypt'
                },
                paymentMethod: 'cash_on_delivery',
                subtotal,
                shippingFee,
                discount,
                totalAmount: total,
                couponCode: appliedCoupon || undefined,
                guestName: formData.name,
                guestPhone: formData.phone,
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
        <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* قسم البرومو كود */}
            <div className="bg-white p-6 md:p-8 border-2 border-black">
                <label className="flex items-center gap-2 mb-4 text-lg font-black text-black">
                    <Tag className="w-6 h-6 text-black" />
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
                        className="shrink-0 h-[60px] px-8 bg-black text-white font-black text-lg disabled:opacity-50 border-2 border-black"
                    >
                        {isApplyingPromo ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (isRTL ? 'تطبيق الخصم' : 'Apply')}
                    </button>
                </div>
                {appliedCoupon && (
                    <p className="mt-4 text-[#0E4435] text-sm font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        {isRTL ? `تم تفعيل الكود: ${appliedCoupon}` : `Code applied: ${appliedCoupon}`}
                    </p>
                )}
            </div>

            {/* بيانات التوصيل */}
            <div className="bg-white p-6 md:p-8 border-2 border-black space-y-6">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-black">
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-none">
                        <User className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-black">{isRTL ? 'بيانات التوصيل' : 'Delivery Details'}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={LABEL_CLASS}>{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className={INPUT_CLASS}
                            placeholder={isRTL ? "الاسم ثنائي على الأقل..." : "Full name..."}
                        />
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={INPUT_CLASS}
                            placeholder="010xxxxxxxx"
                            dir="ltr"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={LABEL_CLASS}>{isRTL ? 'المحافظة' : 'Governorate'}</label>
                        <div className="relative">
                            <select
                                name="governorate"
                                required
                                value={formData.governorate}
                                onChange={handleInputChange}
                                className={`${INPUT_CLASS} pr-10`}
                            >
                                {EGYPT_GOVS.map(gov => (
                                    <option key={gov} value={gov}>{gov}</option>
                                ))}
                            </select>
                            <div className={`pointer-events-none absolute inset-y-0 ${isRTL ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center text-black`}>
                                <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>{isRTL ? 'المدينة / المنطقة' : 'City / Area'}</label>
                        <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleInputChange}
                            className={INPUT_CLASS}
                            placeholder={isRTL ? 'المدينة أو الحي...' : 'City or area...'}
                        />
                    </div>
                </div>

                <div>
                    <label className={LABEL_CLASS}>{isRTL ? 'العنوان بالتفصيل' : 'Detailed Address'}</label>
                    <input
                        type="text"
                        name="street"
                        required
                        value={formData.street}
                        onChange={handleInputChange}
                        className={INPUT_CLASS}
                        placeholder={isRTL ? 'اسم الشارع، رقم العمارة، رقم الشقة...' : 'Street name, building no...'}
                    />
                </div>
            </div>

            {/* زر تأكيد الطلب العادي - غير ثابت لتجنب التعليق على الموبايل */}
            <div className="bg-black p-6 md:p-8 mt-8 border-2 border-black flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="w-full md:w-auto text-center md:text-right">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{isRTL ? 'الإجمالي المطلوب' : 'Total Amount'}</p>
                    <p className="text-4xl font-black text-white leading-none mt-2">
                        {Math.round(total).toLocaleString()} <span className="text-lg font-bold text-gray-400">{isRTL ? 'ج.م' : 'EGP'}</span>
                    </p>
                </div>
                
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto h-16 px-10 bg-white text-black font-black text-xl flex items-center justify-center gap-3 disabled:opacity-60 border-2 border-white hover:bg-gray-200 transition-colors rounded-none"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>{isRTL ? 'جاري المعالجة...' : 'Processing...'}</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={28} />
                            <span>{isRTL ? 'تأكيد الطلب الآن' : 'Confirm Order Now'}</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}