'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/components/analytics/FacebookPixel';
import {
  ArrowLeft, MapPin, Check, Lock, Phone,
  User, Mail, Tag, ShoppingBag, Truck, ChevronDown, Shield, Sparkles, Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { useLanguage } from '@/context/LanguageContext';
import { addressService, Address } from '@/services/addressService';
import { checkoutService, OrderData } from '@/services/checkoutService';
import { couponService } from '@/services/couponService';
import MeshBackground from '@/components/checkout/MeshBackground';

// ─── Reusable UI Components ───────────────────────────────
const StepHeader = ({ icon: Icon, step, title }: { icon: any; step: number; title: string }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-8 h-8 rounded-lg bg-[#0E4435]/10 flex items-center justify-center text-[#0E4435]">
      <Icon size={16} />
    </div>
    <h2 className="text-[15px] font-black text-gray-800">{title}</h2>
    <div className="flex-1 h-px bg-gray-100" />
    <span className="text-[11px] font-bold text-gray-300">خطوة {step}</span>
  </div>
);

function Input({ icon: Icon, ...props }: any) {
  return (
    <div className="relative group">
      {Icon && <Icon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0E4435] transition-colors pointer-events-none" />}
      <input
        {...props}
        className={`w-full h-12 bg-gray-50/80 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#0E4435] focus:ring-2 focus:ring-[#0E4435]/10 transition-all ${Icon ? 'pr-11 pl-4' : 'px-4'}`}
      />
    </div>
  );
}

function Select({ children, ...props }: any) {
  return (
    <div className="relative group">
      <ChevronDown size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0E4435] transition-colors pointer-events-none" />
      <select
        {...props}
        className="w-full h-12 bg-gray-50/80 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 px-4 pl-10 outline-none focus:bg-white focus:border-[#0E4435] focus:ring-2 focus:ring-[#0E4435]/10 transition-all appearance-none text-right"
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

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [shippingSettings, setShippingSettings] = useState<any>(null);
  const [govId, setGovId] = useState('');
  const [cityId, setCityId] = useState('');
  const [govSearch, setGovSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [street, setStreet] = useState('');
  const [notes, setNotes] = useState('');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  // Auth & Address
  const [isAuth, setIsAuth] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Shipping & Processing
  const [shippingFee, setShippingFee] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Pricing calculation
  const subtotal = useMemo(() => items.reduce((s, i) => s + (i.price * i.quantity), 0), [items]);
  const total = Math.max(0, subtotal + shippingFee - couponDiscount);

  // Fetch auth & settings
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      setIsAuth(true);
      addressService.getAddresses().then(r => {
        if (r.success && r.addresses.length > 0) {
          setAddresses(r.addresses);
          setSelectedAddressId(r.addresses[0]._id);
        }
      }).catch(() => { });
    }

    checkoutService.getShippingSettings().then(r => {
      if (r.success) setShippingSettings(r.settings);
    }).catch(() => { });

    trackEvent('InitiateCheckout', { currency: 'EGP', num_items: items.length }, { eventID: conversionEventId });
  }, [items.length, conversionEventId]);

  // Filters for Search
  const governorates = useMemo(() => {
    if (!shippingSettings?.governorates) return [];
    const list = shippingSettings.governorates;
    if (!govSearch) return list;
    return list.filter((g: any) => 
      g.name.includes(govSearch) || 
      (g.englishName && g.englishName.toLowerCase().includes(govSearch.toLowerCase()))
    );
  }, [shippingSettings, govSearch]);

  const cities = useMemo(() => {
    if (!govId || !shippingSettings?.cities) return [];
    const list = shippingSettings.cities.filter((c: any) => c.governorateId === govId);
    if (!citySearch) return list;
    return list.filter((c: any) => 
      c.name.includes(citySearch) || 
      (c.englishName && c.englishName.toLowerCase().includes(citySearch.toLowerCase()))
    );
  }, [govId, shippingSettings, citySearch]);

  // Calculate Shipping Fee
  useEffect(() => {
    if (!shippingSettings || !govId) return;
    const gov = shippingSettings.governorates.find((g: any) => g._id === govId);
    if (gov) {
      const threshold = parseFloat(shippingSettings.free_delivery_threshold) || 0;
      if (threshold > 0 && subtotal >= threshold) setShippingFee(0);
      else setShippingFee(parseFloat(gov.cost) || parseFloat(shippingSettings.delivery_cost) || 0);
    }
  }, [govId, subtotal, shippingSettings]);

  const handleCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    try {
      const r = await couponService.validateCoupon(couponCode);
      if (r.success && r.coupon) {
        const coupon = r.coupon;
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
          showToast(`أقل مبلغ لتفعيل الكود هو ${coupon.minOrderAmount} ج.م`, 'error');
          return;
        }
        let discount = coupon.discountType === 'percentage'
          ? (subtotal * coupon.discountAmount) / 100
          : coupon.discountAmount;

        setCouponDiscount(discount);
        setCouponApplied(true);
        showToast('تم تطبيق الكوبون بنجاح ✓', 'success');
      }
    } catch (err: any) {
      showToast(err || 'كوبون غير صالح', 'error');
    }
  }, [couponCode, subtotal, showToast]);

  const handleOrder = async () => {
    if (!isAuth) {
      if (!name.trim()) return showToast('ادخل اسمك', 'error');
      if (!phone.trim() || phone.length < 10) return showToast('ادخل رقم هاتف صحيح', 'error');
      if (!govId) return showToast('اختر المحافظة', 'error');
      if (!cityId) return showToast('اختر المدينة/المنطقة', 'error');
      if (!street.trim()) return showToast('ادخل العنوان بالتفصيل', 'error');
    } else if (!selectedAddressId && !govId) {
      return showToast('اختر عنوان الشحن', 'error');
    }

    setProcessing(true);
    trackEvent('Purchase', { currency: 'EGP', value: total }, { eventID: conversionEventId });

    try {
      const selectedGov = shippingSettings?.governorates?.find((g: any) => g._id === govId);
      const selectedCity = shippingSettings?.cities?.find((c: any) => c._id === cityId);

      const shippingAddress = isAuth && selectedAddressId
        ? addresses.find(a => a._id === selectedAddressId)
        : { 
            governorate: selectedGov?.name, 
            city: selectedCity?.name, 
            street: street 
          };

      const result = await checkoutService.placeOrder({
        conversionEventId,
        items: items.map(i => ({ 
          product: i.productId, 
          name: i.name, 
          price: i.price, 
          quantity: i.quantity, 
          image_url: i.imageUrl, 
          size: i.size || undefined, 
          color: i.color || undefined,
          accessories: i.accessories
        })),
        shippingAddress,
        paymentMethod: 'Cash on Delivery',
        subtotal,
        shippingFee,
        discount: couponDiscount,
        totalAmount: total,
        couponCode: couponApplied ? couponCode : undefined,
        ...(!isAuth ? { 
          guestName: name, 
          guestPhone: phone, 
          guestAlternativePhone: phone2 || undefined, 
          guestEmail: email || undefined 
        } : {}),
        notes: notes || undefined,
      });

      if (result.success) {
        clearCart();
        router.push(`/order-success/${result.order.id || result.order._id}`);
      }
    } catch (e: any) {
      showToast(e || 'حدث خطأ أثناء إتمام الطلب', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0 && !processing) return null;

  return (
    <div className="min-h-screen font-cairo relative" dir="rtl">
      <MeshBackground />

      <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-2xl border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all active:scale-90 shadow-sm"
          >
            <ArrowLeft size={18} className="rotate-180" />
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
            <Lock size={14} className="text-[#0E4435]" />
            <span className="text-xs font-black text-[#0E4435]">إتمام الشراء الآمن</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-32 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-sm">
              <StepHeader icon={User} step={1} title="بيانات العميل" />
              {isAuth && addresses.length > 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0E4435] rounded-lg flex items-center justify-center"><Check size={16} strokeWidth={3} className="text-white" /></div>
                  <div>
                    <p className="text-sm font-black text-emerald-800">تم تسجيل الدخول</p>
                    <p className="text-xs font-semibold text-emerald-600/70">بياناتك محفوظة وأمنة</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">الاسم بالكامل <span className="text-red-400">*</span></label>
                    <Input icon={User} placeholder="مثال: أحمد محمد" value={name} onChange={(e: any) => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">رقم الهاتف <span className="text-red-400">*</span></label>
                      <Input icon={Phone} type="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">رقم بديل</label>
                      <Input icon={Phone} type="tel" placeholder="اختياري" value={phone2} onChange={(e: any) => setPhone2(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">البريد الإلكتروني <span className="text-[10px] font-bold text-[#0E4435] bg-[#0E4435]/10 px-1.5 py-0.5 rounded-md">ينصح به</span></label>
                    <Input icon={Mail} type="email" placeholder="example@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-sm">
              <StepHeader icon={MapPin} step={2} title="عنوان الشحن" />
              {isAuth && addresses.length > 0 ? (
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <button key={addr._id} onClick={() => setSelectedAddressId(addr._id)} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedAddressId === addr._id ? 'border-[#0E4435] bg-[#0E4435]/5' : 'border-gray-100 bg-gray-50'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedAddressId === addr._id ? 'bg-[#0E4435] text-white' : 'bg-white text-gray-300 border border-gray-100'}`}><MapPin size={14} /></div>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-bold text-gray-900">{addr.street}</p>
                        <p className="text-xs font-semibold text-gray-400">{addr.state}, {addr.city}</p>
                      </div>
                      {selectedAddressId === addr._id && <div className="w-5 h-5 bg-[#0E4435] rounded-full flex items-center justify-center"><Check size={11} strokeWidth={3} className="text-white" /></div>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">المحافظة <span className="text-red-400">*</span></label>
                    <div className="space-y-2">
                      <Input icon={Search} placeholder="ابحث عن المحافظة..." value={govSearch} onChange={(e: any) => setGovSearch(e.target.value)} />
                      <Select value={govId} onChange={(e: any) => { setGovId(e.target.value); setCityId(''); setCitySearch(''); }}>
                        <option value="">اختر المحافظة</option>
                        {governorates.map((g: any) => <option key={g._id} value={g._id}>{g.name}</option>)}
                      </Select>
                    </div>
                  </div>
                  <AnimatePresence>
                    {govId && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">المدينة / المنطقة <span className="text-red-400">*</span></label>
                        <Input icon={Search} placeholder="ابحث عن المدينة..." value={citySearch} onChange={(e: any) => setCitySearch(e.target.value)} />
                        <Select value={cityId} onChange={(e: any) => setCityId(e.target.value)}>
                          <option value="">اختر المدينة/المنطقة</option>
                          {cities.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </Select>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">العنوان بالتفصيل <span className="text-red-400">*</span></label>
                    <Input icon={MapPin} placeholder="الشارع، المبنى، رقم الشقة..." value={street} onChange={(e: any) => setStreet(e.target.value)} />
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-sm">
              <StepHeader icon={Tag} step={3} title="ملاحظات والخصم" />
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">ملاحظات للتوصيل</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder='مثال: "اتصل بي قبل الوصول"' rows={2} className="w-full bg-gray-50/80 border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:bg-white focus:border-[#0E4435] transition-all resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500" />لديك كود خصم؟</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="ادخل الكود" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} disabled={couponApplied} className="flex-1 h-12 bg-gray-50/80 border border-gray-200 rounded-xl px-4 text-sm font-bold outline-none focus:bg-white focus:border-[#0E4435] transition-all" />
                    <button onClick={handleCoupon} disabled={couponApplied || !couponCode.trim()} className="h-12 px-6 bg-gray-900 text-white rounded-xl font-black text-sm active:scale-95 disabled:opacity-30">{couponApplied ? '✓' : 'تطبيق'}</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm sticky top-24 overflow-hidden">
              <div className="p-6 border-b border-gray-100/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-[#0E4435] bg-[#0E4435]/10 px-3 py-1 rounded-full">{items.length} منتجات</span>
                  <h3 className="text-base font-black text-gray-900">ملخص الطلب</h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden border border-gray-50">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={18} className="text-gray-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs font-semibold text-gray-400">الكمية: {item.quantity} {item.size && `· ${item.size}`}</p>
                      </div>
                      <span className="text-sm font-black text-gray-800">{Math.round(item.price * item.quantity).toLocaleString()} ج.م</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-500 font-semibold"><span>{Math.round(subtotal).toLocaleString()} ج.م</span><span>المجموع الفرعي</span></div>
                <div className="flex justify-between text-sm font-semibold"><span className={shippingFee === 0 ? 'text-[#0E4435] font-black' : 'text-gray-500'}>{shippingFee === 0 ? 'مجاناً 🎉' : `${Math.round(shippingFee).toLocaleString()} ج.م`}</span><span className="text-gray-500 flex items-center gap-1.5"><Truck size={13} />الشحن</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-sm font-black text-red-500"><span>-{Math.round(couponDiscount).toLocaleString()} ج.م</span><span>خصم الكوبون</span></div>}
                <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                  <div className="text-left"><span className="text-3xl font-black text-gray-900">{Math.round(total).toLocaleString()}</span><span className="text-sm font-black text-gray-400 mr-1">ج.م</span></div>
                  <span className="text-xs font-black text-gray-400">الإجمالي</span>
                </div>
              </div>
              <div className="hidden lg:block p-6 pt-0">
                <button onClick={handleOrder} disabled={processing} className="w-full h-14 bg-[#0E4435] text-white rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-[#0E4435]/20 hover:bg-[#0a3a2d] disabled:opacity-60">
                  {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock size={16} />تأكيد الطلب</>}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t z-50 p-4 shadow-lg">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400">الإجمالي</p>
            <p className="text-xl font-black text-gray-900">{Math.round(total).toLocaleString()} <span className="text-xs text-gray-400">ج.م</span></p>
          </div>
          <button onClick={handleOrder} disabled={processing} className="h-12 px-8 bg-[#0E4435] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock size={14} />تأكيد الطلب</>}
          </button>
        </div>
      </div>
    </div>
  );
}