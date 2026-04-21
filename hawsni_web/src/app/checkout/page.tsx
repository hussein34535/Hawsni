'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/components/analytics/FacebookPixel';
import {
  ArrowLeft, ArrowRight, MapPin, Check, Lock, Phone,
  User, Mail, Tag, ShoppingBag, Truck, ChevronDown, Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { useLanguage } from '@/context/LanguageContext';
import { addressService, Address } from '@/services/addressService';
import { checkoutService } from '@/services/checkoutService';
import { couponService } from '@/services/couponService';
import MeshBackground from '@/components/checkout/MeshBackground';

// ─── Governorates data ────────────────────────────────────
const GOVERNORATES = [
  { id: 'cairo', name: 'Cairo', arabicName: 'القاهرة' },
  { id: 'giza', name: 'Giza', arabicName: 'الجيزة' },
  { id: 'alexandria', name: 'Alexandria', arabicName: 'الإسكندرية' },
  { id: 'dakahlia', name: 'Dakahlia', arabicName: 'الدقهلية' },
  { id: 'red_sea', name: 'Red Sea', arabicName: 'البحر الأحمر' },
  { id: 'beheira', name: 'Beheira', arabicName: 'البحيرة' },
  { id: 'fayoum', name: 'Fayoum', arabicName: 'الفيوم' },
  { id: 'gharbiya', name: 'Gharbiya', arabicName: 'الغربية' },
  { id: 'ismailia', name: 'Ismailia', arabicName: 'الإسماعيلية' },
  { id: 'menofia', name: 'Menofia', arabicName: 'المنوفية' },
  { id: 'minya', name: 'Minya', arabicName: 'المنيا' },
  { id: 'qaliubiya', name: 'Qaliubiya', arabicName: 'القليوبية' },
  { id: 'new_valley', name: 'New Valley', arabicName: 'الوادي الجديد' },
  { id: 'north_sinai', name: 'North Sinai', arabicName: 'شمال سيناء' },
  { id: 'suez', name: 'Suez', arabicName: 'السويس' },
  { id: 'aswan', name: 'Aswan', arabicName: 'أسوان' },
  { id: 'assiut', name: 'Assiut', arabicName: 'أسيوط' },
  { id: 'beni_suef', name: 'Beni Suef', arabicName: 'بني سويف' },
  { id: 'port_said', name: 'Port Said', arabicName: 'بور سعيد' },
  { id: 'damietta', name: 'Damietta', arabicName: 'دمياط' },
  { id: 'sharqia', name: 'Sharqia', arabicName: 'الشرقية' },
  { id: 'south_sinai', name: 'South Sinai', arabicName: 'جنوب سيناء' },
  { id: 'kafr_el_sheikh', name: 'Kafr El Sheikh', arabicName: 'كفر الشيخ' },
  { id: 'matruh', name: 'Matruh', arabicName: 'مطروح' },
  { id: 'luxor', name: 'Luxor', arabicName: 'الأقصر' },
  { id: 'qena', name: 'Qena', arabicName: 'قنا' },
  { id: 'sohag', name: 'Sohag', arabicName: 'سوهاج' },
];

// ─── Input Component ──────────────────────────────────────
function Field({
  label, required, recommended, icon: Icon, children,
}: {
  label: string; required?: boolean; recommended?: boolean; icon?: any; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-bold text-gray-500 flex items-center gap-1">
        {label}
        {required && <span className="text-red-400">*</span>}
        {recommended && <span className="text-[11px] text-emerald-600 font-black bg-emerald-50 px-1.5 py-0.5 rounded-md">ينصح به</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ icon: Icon, ...props }: any) {
  return (
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />}
      <input
        {...props}
        className={`w-full h-12 bg-white border border-gray-200 rounded-2xl text-[15px] font-bold text-gray-900 placeholder:text-gray-300 outline-none focus:border-[#0E4435] focus:ring-4 focus:ring-[#0E4435]/5 transition-all ${Icon ? 'pl-11 pr-4' : 'px-4'}`}
      />
    </div>
  );
}

function Select({ children, ...props }: any) {
  return (
    <div className="relative">
      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
      <select
        {...props}
        className="w-full h-12 bg-white border border-gray-200 rounded-2xl text-[15px] font-bold text-gray-900 px-4 pr-10 outline-none focus:border-[#0E4435] focus:ring-4 focus:ring-[#0E4435]/5 transition-all appearance-none"
      >
        {children}
      </select>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { showToast } = useToastStore();
  const { isRTL } = useLanguage();

  const [conversionEventId] = useState(() => `web_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  // Guest info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [govId, setGovId] = useState('');
  const [street, setStreet] = useState('');
  const [notes, setNotes] = useState('');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  // Auth
  const [isAuth, setIsAuth] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Shipping
  const [shippingFee, setShippingFee] = useState(0);
  const [processing, setProcessing] = useState(false);

  const selectedGov = GOVERNORATES.find(g => g.id === govId);

  // Pricing
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const total = Math.max(0, subtotal + shippingFee - couponDiscount);

  // Track InitiateCheckout
  useEffect(() => {
    trackEvent('InitiateCheckout', { currency: 'EGP', num_items: items.length }, { eventID: conversionEventId });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch auth & addresses
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    setIsAuth(true);
    addressService.getAddresses().then(r => {
      if (r.success && r.addresses.length > 0) {
        setAddresses(r.addresses);
        setSelectedAddressId(r.addresses[0]._id);
      }
    }).catch(() => {});
  }, []);

  // Fetch shipping fee
  useEffect(() => {
    checkoutService.getShippingSettings().then(r => {
      const cfg = r.settings;
      if (!cfg) return;
      const gov = selectedGov?.arabicName || '';
      const govCfg = cfg.governorate_settings?.[gov];
      const threshold = cfg.free_shipping_threshold || 0;
      if (threshold > 0 && subtotal >= threshold) setShippingFee(0);
      else if (govCfg) setShippingFee(parseFloat(govCfg.cost) || 0);
      else setShippingFee(parseFloat(cfg.delivery_cost) || 0);
    }).catch(() => {});
  }, [govId, subtotal, selectedGov]);

  const handleCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    try {
      const r = await couponService.validateCoupon(couponCode);
      if (r.success && r.coupon) {
        const coupon = r.coupon;
        
        // Check min order amount
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
          showToast(`أقل مبلغ لتفعيل الكود هو ${coupon.minOrderAmount} ج.م`, 'error');
          return;
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountAmount) / 100;
        } else {
          discount = coupon.discountAmount;
        }

        setCouponDiscount(discount);
        setCouponApplied(true);
        showToast('تم تطبيق الكوبون ✓', 'success');
      }
    } catch (err: any) { 
      showToast(err || 'كوبون غير صالح', 'error'); 
    }
  }, [couponCode, subtotal, showToast]);

  const handleOrder = async () => {
    // Validation
    if (!isAuth) {
      if (!name.trim()) return showToast('ادخل اسمك', 'error');
      if (!phone.trim() || phone.length < 10) return showToast('ادخل رقم هاتف صحيح', 'error');
      if (!govId) return showToast('اختر المحافظة', 'error');
      if (!street.trim()) return showToast('ادخل عنوانك', 'error');
    } else {
      if (!selectedAddressId && !govId) return showToast('اختر عنوان الشحن', 'error');
    }

    setProcessing(true);
    trackEvent('Purchase', { currency: 'EGP', value: total }, { eventID: conversionEventId });

    try {
      const shippingAddress = isAuth && selectedAddressId
        ? { ...addresses.find(a => a._id === selectedAddressId), state: selectedGov?.arabicName || '' }
        : { street, state: selectedGov?.arabicName || '', city: selectedGov?.arabicName || '', address: `${street}, ${selectedGov?.arabicName}` };

      const result = await checkoutService.placeOrder({
        conversionEventId,
        items: items.map(i => ({ product: i.productId, name: i.name, price: i.price, quantity: i.quantity, image_url: i.imageUrl, size: i.size ?? undefined, color: i.color ?? undefined })),
        shippingAddress,
        paymentMethod: 'Cash on Delivery',
        subtotal,
        shippingFee,
        discount: couponDiscount,
        totalAmount: total,
        couponCode: couponApplied ? couponCode : undefined,
        ...(!isAuth ? { guestName: name, guestPhone: phone, guestAlternativePhone: phone2 || undefined, guestEmail: email || undefined } : {}),
        notes: notes || undefined,
      });

      if (result.success) {
        clearCart();
        router.push(`/order-success/${result.order.id || result.order._id}`);
      }
    } catch (e: any) {
      showToast(e.message || 'حدث خطأ', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0 && !processing) return null;

  return (
    <div className="min-h-screen font-cairo pb-24 relative" dir="ltr">
      <MeshBackground />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-emerald-600" />
            <span className="text-[13px] font-black text-gray-700">إتمام الشراء الآمن</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT: FORM ── */}
          <div className="lg:col-span-7 space-y-5">

            {/* Customer Info */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
              <h2 className="text-[15px] font-black text-gray-900 flex items-center gap-2">
                <User size={16} className="text-[#0E4435]" />
                بيانات العميل
              </h2>

              {isAuth && addresses.length > 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Check size={16} strokeWidth={3} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-emerald-800">تم تسجيل الدخول</p>
                    <p className="text-xs font-bold text-emerald-600/70">بياناتك محفوظة</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="الاسم بالكامل" required>
                    <Input icon={User} placeholder="مثال: أحمد محمد" value={name} onChange={(e: any) => setName(e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="رقم الهاتف" required>
                      <Input icon={Phone} type="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
                    </Field>
                    <Field label="رقم بديل" >
                      <Input icon={Phone} type="tel" placeholder="اختياري" value={phone2} onChange={(e: any) => setPhone2(e.target.value)} />
                    </Field>
                  </div>
                  <Field label="البريد الإلكتروني" recommended>
                    <Input icon={Mail} type="email" placeholder="example@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                  </Field>
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
              <h2 className="text-[15px] font-black text-gray-900 flex items-center gap-2">
                <MapPin size={16} className="text-[#0E4435]" />
                عنوان الشحن
              </h2>

              {isAuth && addresses.length > 0 ? (
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <button
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${selectedAddressId === addr._id ? 'border-[#0E4435] bg-emerald-50/50' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${selectedAddressId === addr._id ? 'bg-[#0E4435] text-white' : 'bg-white text-gray-400'}`}>
                        <MapPin size={14} />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-black text-gray-900">{addr.street}</p>
                        <p className="text-xs font-bold text-gray-400">{addr.state}, {addr.city}</p>
                      </div>
                      {selectedAddressId === addr._id && (
                        <div className="w-5 h-5 bg-[#0E4435] rounded-full flex items-center justify-center">
                          <Check size={11} strokeWidth={3} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="المحافظة" required>
                    <Select value={govId} onChange={(e: any) => setGovId(e.target.value)}>
                      <option value="">اختر المحافظة</option>
                      {GOVERNORATES.map(g => (
                        <option key={g.id} value={g.id}>{g.arabicName}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="العنوان بالتفصيل" required>
                    <Input icon={MapPin} placeholder="الشارع، المبنى، رقم الشقة..." value={street} onChange={(e: any) => setStreet(e.target.value)} />
                  </Field>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-[15px] font-black text-gray-900 mb-4 flex items-center gap-2">
                <Tag size={16} className="text-[#0E4435]" />
                ملاحظات (اختياري)
              </h2>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder='مثال: "اتصل بي قبل الوصول"'
                rows={2}
                dir="rtl"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[14px] font-bold text-gray-900 outline-none focus:border-[#0E4435] focus:ring-4 focus:ring-[#0E4435]/5 transition-all placeholder:text-gray-300 resize-none"
              />
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <p className="text-[13px] font-black text-gray-500 mb-3">لديك كود خصم؟</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ادخل الكود"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  disabled={couponApplied}
                  className="flex-1 h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold text-gray-900 outline-none focus:border-[#0E4435] transition-all placeholder:text-gray-300 disabled:opacity-50"
                />
                <button
                  onClick={handleCoupon}
                  disabled={couponApplied || !couponCode.trim()}
                  className="h-11 px-5 bg-[#0E4435] text-white rounded-xl font-black text-sm active:scale-95 transition-all hover:bg-[#0b3328] disabled:opacity-40"
                >
                  {couponApplied ? '✓' : 'تطبيق'}
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: ORDER SUMMARY ── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
              {/* Items */}
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-black text-gray-900">طلبك</h3>
                  <span className="text-[11px] font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {items.length} منتج
                  </span>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={16} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-black text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs font-bold text-gray-400">× {item.quantity} {item.size && `· ${item.size}`}</p>
                      </div>
                      <span className="text-sm font-black text-gray-800 flex-shrink-0">
                        {Math.round(item.price * item.quantity).toLocaleString()} <span className="text-[10px] text-gray-400">ج.م</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex justify-between text-sm text-gray-500 font-bold">
                  <span>{Math.round(subtotal).toLocaleString()} ج.م</span>
                  <span>المجموع الفرعي</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className={shippingFee === 0 ? 'text-emerald-600 font-black' : 'text-gray-500'}>
                    {shippingFee === 0 ? 'مجاناً' : `${Math.round(shippingFee).toLocaleString()} ج.م`}
                  </span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <Truck size={13} />
                    الشحن
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm font-black text-emerald-600">
                    <span>-{Math.round(couponDiscount).toLocaleString()} ج.م</span>
                    <span>خصم الكوبون</span>
                  </div>
                )}

                {/* Total */}
                <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline">
                  <div className="text-right">
                    <span className="text-3xl font-black text-[#0E4435]">{Math.round(total).toLocaleString()}</span>
                    <span className="text-xs font-black text-gray-400 ml-1">ج.م</span>
                  </div>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">الإجمالي</span>
                </div>
              </div>

              {/* Payment method */}
              <div className="px-6 pb-4">
                <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0E4435] rounded-xl flex items-center justify-center">
                    <ShoppingBag size={14} className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-700">الدفع عند الاستلام</p>
                    <p className="text-[10px] font-bold text-gray-400">Cash on Delivery</p>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <div className="px-6 pb-6">
                <motion.button
                  whileHover={{ y: -2, boxShadow: '0 16px 32px rgba(14,68,53,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOrder}
                  disabled={processing}
                  className={`w-full h-14 bg-[#0E4435] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all ${processing ? 'opacity-60 cursor-wait' : 'hover:bg-[#0b3328]'}`}
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={16} />
                      تأكيد الطلب
                      <ArrowLeft size={16} />
                    </>
                  )}
                </motion.button>

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Shield size={12} className="text-gray-300" />
                  <p className="text-[10px] font-bold text-gray-400 text-center">
                    بياناتك آمنة ومحمية · هوسي
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
