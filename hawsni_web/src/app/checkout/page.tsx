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

// قائمة المحافظات لتسهيل وتريع الطلب
const EGYPT_GOVS =[
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'القليوبية', 'المنيا', 'الغربية', 'الإسماعيلية', 'أسيوط', 'الفيوم', 'سوهاج', 'قنا', 'بني سويف', 'أسوان', 'البحيرة', 'كفر الشيخ', 'المنوفية', 'دمياط', 'الأقصر', 'البحر الأحمر', 'السويس', 'بورسعيد', 'مطروح', 'شمال سيناء', 'جنوب سيناء'
];

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const { isRTL } = useLanguage();
    const { showToast } = useToastStore();

    // حالات الفاتورة والأموال (مفصولة عن الفورم لمنع التهنيج)
    const [shippingFee] = useState(50); // يمكنك ربطها لاحقاً بالـ API
    const [discount, setDiscount] = useState(0);
    const[appliedCoupon, setAppliedCoupon] = useState('');

    const subtotal = getTotal();
    const total = subtotal + shippingFee - discount;

    // توجيه المستخدم للسلة لو كانت فارغة
    useEffect(() => {
        if (items.length === 0) {
            router.push('/cart');
        }
    }, [items.length, router]);

    if (items.length === 0) return null;

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-cairo" dir={isRTL ? 'rtl' : 'ltr'}>
            <MeshBackground />

            {/* الهيدر العلوي */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
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

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    
                    {/* عمود اليمين: الفورم وكود الخصم (مفصول في مكون خاص لسرعة الأداء) */}
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

                    {/* عمود اليسار: الفاتورة الثابتة */}
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
// مكوّن الفورم المستقل: يمنع إعادة تصيير (Re-render) الصفحة بالكامل عند الكتابة
// ----------------------------------------------------------------------
function CheckoutForm({ isRTL, items, subtotal, shippingFee, discount, total, appliedCoupon, clearCart, router, showToast, setDiscount, setAppliedCoupon }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const[isApplyingPromo, setIsApplyingPromo] = useState(false);
    
    // الخانات الأساسية فقط (تم حذف الخانات المزعجة)
    const[formData, setFormData] = useState({
        name: '',
        phone: '',
        governorate: 'القاهرة',
        city: '',
        street: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData,[e.target.name]: e.target.value });
    };

    // معالجة كود الخصم
    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setIsApplyingPromo(true);
        try {
            // هنا يمكنك استدعاء couponService.validateCoupon من الباك إند
            // سأضع مثالاً وهمياً (خصم 10%) حتى تقوم بربطها
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

    // إرسال الطلب
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
            
            {/* قسم البرومو كود - تصميم مرن وأنيق */}
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
                        className={`flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold uppercase focus:ring-4 focus:ring-[#0E4435]/15 focus:border-[#0E4435] focus:bg-white outline-none transition-all shadow-sm ${isRTL ? 'text-right' : 'text-left'}`}
                    />
                    <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCode}
                        className="shrink-0 h-[58px] px-8 bg-gray-900 hover:bg-black text-white rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
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

            {/* بيانات التوصيل - تصميم الخانات النظيف */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900">{isRTL ? 'بيانات التوصيل' : 'Delivery Details'}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 px-1">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-base font-semibold focus:ring-4 focus:ring-[#0E4435]/15 focus:border-[#0E4435] focus:bg-white outline-none transition-all shadow-sm"
                            placeholder={isRTL ? "أحمد محمد..." : "Ahmed Mohamed..."}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 px-1">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-base font-semibold focus:ring-4 focus:ring-[#0E4435]/15 focus:border-[#0E4435] focus:bg-white outline-none transition-all shadow-sm"
                            placeholder="010xxxxxxxx"
                            dir="ltr"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 px-1">{isRTL ? 'المحافظة' : 'Governorate'}</label>
                        <select
                            name="governorate"
                            required
                            value={formData.governorate}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-base font-semibold focus:ring-4 focus:ring-[#0E4435]/15 focus:border-[#0E4435] focus:bg-white outline-none transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            {EGYPT_GOVS.map(gov => (
                                <option key={gov} value={gov}>{gov}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 px-1">{isRTL ? 'المدينة / المنطقة' : 'City / Area'}</label>
                        <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-base font-semibold focus:ring-4 focus:ring-[#0E4435]/15 focus:border-[#0E4435] focus:bg-white outline-none transition-all shadow-sm"
                            placeholder={isRTL ? 'مدينة نصر، التجمع...' : 'Nasr City, Maadi...'}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 px-1">{isRTL ? 'العنوان بالتفصيل (الشارع، العمارة، الشقة)' : 'Detailed Address (Street, Bldg, Flat)'}</label>
                    <input
                        type="text"
                        name="street"
                        required
                        value={formData.street}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-base font-semibold focus:ring-4 focus:ring-[#0E4435]/15 focus:border-[#0E4435] focus:bg-white outline-none transition-all shadow-sm"
                        placeholder={isRTL ? 'شارع كذا، عمارة رقم كذا...' : 'Street name, building no...'}
                    />
                </div>
            </div>

            {/* زر تأكيد الطلب */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-[#0E4435] text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-950/20 hover:scale-[1.02] hover:bg-[#0a3126] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>{isRTL ? 'جاري تأكيد الطلب...' : 'Processing...'}</span>
                    </>
                ) : (
                    <>
                        <ShieldCheck className="w-6 h-6" />
                        <span>{isRTL ? 'تأكيد الطلب (الدفع عند الاستلام)' : 'Confirm Order (COD)'}</span>
                    </>
                )}
            </button>
        </form>
    );
}