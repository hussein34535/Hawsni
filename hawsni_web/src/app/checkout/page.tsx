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
        <div className="min-h-screen bg-[#FAFAFA] font-cairo pb-28" dir={isRTL ? 'rtl' : 'ltr'}>

            {/* الهيدر العلوي - بدون أي blur */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center"
                    >
                        {isRTL ? <ArrowRight className="w-5 h-5 text-gray-900" /> : <ArrowLeft className="w-5 h-5 text-gray-900" />}
                    </button>
                    <h1 className="text-lg font-black text-gray-900">
                        {isRTL ? 'إتمام الطلب' : 'Checkout'}
                    </h1>
                    <div className="w-10 text-center">
                        <ShieldCheck className="w-5 h-5 text-[#0E4435] mx-auto opacity-50" />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    
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
// مكوّن الفورم المستقل: يمنع إعادة تصيير الصفحة بالكامل عند الكتابة
// ----------------------------------------------------------------------

// ستايل موحد للخانات - بدون أي transition أو shadow أو blur
const INPUT_CLASS = "w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-[16px] font-bold focus:border-black outline-none placeholder:text-gray-300 placeholder:font-normal";

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
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* قسم البرومو كود */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100">
                <label className="flex items-center gap-2 mb-3 text-sm font-black text-gray-900">
                    <Tag className="w-4 h-4 text-[#0E4435]" />
                    {isRTL ? 'هل لديك كود خصم؟' : 'Have a promo code?'}
                </label>
                <div className="flex gap-3">
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
                        className="shrink-0 h-[50px] px-6 bg-gray-900 text-white rounded-xl font-black text-sm disabled:opacity-40"
                    >
                        {isApplyingPromo ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isRTL ? 'تطبيق' : 'Apply')}
                    </button>
                </div>
                {appliedCoupon && (
                    <p className="mt-3 text-emerald-600 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        {isRTL ? `تم تفعيل الكود: ${appliedCoupon}` : `Code applied: ${appliedCoupon}`}
                    </p>
                )}
            </div>

            {/* بيانات التوصيل */}
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900">{isRTL ? 'بيانات التوصيل' : 'Delivery Details'}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1.5 px-1">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className={INPUT_CLASS}
                            placeholder={isRTL ? "أحمد محمد..." : "Ahmed Mohamed..."}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1.5 px-1">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1.5 px-1">{isRTL ? 'المحافظة' : 'Governorate'}</label>
                        <select
                            name="governorate"
                            required
                            value={formData.governorate}
                            onChange={handleInputChange}
                            className={`${INPUT_CLASS} appearance-none cursor-pointer`}
                        >
                            {EGYPT_GOVS.map(gov => (
                                <option key={gov} value={gov}>{gov}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1.5 px-1">{isRTL ? 'المدينة / المنطقة' : 'City / Area'}</label>
                        <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleInputChange}
                            className={INPUT_CLASS}
                            placeholder={isRTL ? 'مدينة نصر، التجمع...' : 'Nasr City, Maadi...'}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1.5 px-1">{isRTL ? 'العنوان بالتفصيل (الشارع، العمارة، الشقة)' : 'Detailed Address (Street, Bldg, Flat)'}</label>
                    <input
                        type="text"
                        name="street"
                        required
                        value={formData.street}
                        onChange={handleInputChange}
                        className={INPUT_CLASS}
                        placeholder={isRTL ? 'شارع كذا، عمارة رقم كذا...' : 'Street name, building no...'}
                    />
                </div>
            </div>

            {/* شريط تأكيد الطلب السفلي الثابت - بدون أي blur أو shadow ثقيلة */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 z-50">
                <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
                    
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{isRTL ? 'الإجمالي' : 'Total'}</p>
                        <p className="text-xl font-black text-gray-900 leading-none mt-0.5">
                            {Math.round(total).toLocaleString()} <span className="text-[10px] font-bold text-gray-400">{isRTL ? 'ج.م' : 'EGP'}</span>
                        </p>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-12 px-6 bg-[#0E4435] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{isRTL ? 'جاري...' : 'Wait...'}</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={16} />
                                <span>{isRTL ? 'تأكيد الطلب' : 'Confirm Order'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}