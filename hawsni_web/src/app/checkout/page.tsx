'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Check,
  Home,
  Briefcase,
  Plus,
  X,
  Phone,
  User,
  Mail,
  Tag,
  Lock,
  ShoppingBag,
  Truck,
  ChevronDown,
  CreditCard,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { useLanguage } from '@/context/LanguageContext';
import { addressService, Address } from '@/services/addressService';
import { checkoutService, OrderData } from '@/services/checkoutService';
import { couponService } from '@/services/couponService';
import { authService } from '@/services/authService';

import OrderReceipt from '@/components/checkout/OrderReceipt';

// ─── Beautiful Input (ENLARGED) ─────────────────────────
function Input({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = 'text',
  id,
  disabled = false,
}: {
  icon: any;
  placeholder: string;
  value: string;
  onChange: (e: any) => void;
  type?: string;
  id?: string;
  disabled?: boolean;
}) {
  const { isRTL } = useLanguage();

  return (
    <div className="relative group">
      <div
        className={`absolute top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-[#0E4435] transition-colors ${
          isRTL ? 'right-5' : 'left-5'
        }`}
      >
        <Icon size={20} />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`w-full h-14 bg-white rounded-2xl text-[15px] font-bold text-gray-900 placeholder:text-gray-300 outline-none border border-gray-100 focus:border-[#0E4435] focus:ring-4 focus:ring-[#0E4435]/5 transition-all disabled:opacity-50 ${
          isRTL ? 'pr-12 pl-5 text-right' : 'pl-12 pr-5 text-left'
        }`}
      />
    </div>
  );
}

// ─── Beautiful Select (ENLARGED) ────────────────────────
function Select({
  value,
  onChange,
  children,
  disabled = false,
}: {
  value: string;
  onChange: (e: any) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { isRTL } = useLanguage();

  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`w-full h-14 bg-white rounded-2xl text-[15px] font-bold text-gray-900 outline-none border border-gray-100 focus:border-[#0E4435] focus:ring-4 focus:ring-[#0E4435]/5 transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
          isRTL ? 'pr-5 pl-12 text-right' : 'pl-5 pr-12 text-left'
        } ${!value ? 'text-gray-300' : ''}`}
      >
        {children}
      </select>
      <div
        className={`absolute top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none ${
          isRTL ? 'left-4' : 'right-4'
        }`}
      >
        <ChevronDown size={20} />
      </div>
    </div>
  );
}

// ─── Section Card (ENLARGED) ────────────────────────────
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[28px] border border-gray-100 p-7 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0E4435]/5 rounded-2xl flex items-center justify-center">
          <Icon size={20} className="text-[#0E4435]" />
        </div>
        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { isRTL, t } = useLanguage();
  const { showToast } = useToastStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Address & Shipping
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingSettings, setShippingSettings] = useState<any>(null);
  const [freeDeliveryActive, setFreeDeliveryActive] = useState(false);
  const [selectedGov, setSelectedGov] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<{
    street: string;
    city: string;
    type: 'home' | 'office' | 'other';
    alternativePhone?: string;
  }>({ street: '', city: '', type: 'home', alternativePhone: '' });

  // Guest Info
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    phone2: '',
    email: '',
    street: '',
    city: '',
  });

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  // Bosta
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedGovId, setSelectedGovId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');

  // ─── Data Fetching ────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    const fetchData = async () => {
      try {
        const settingsRes = await checkoutService.getShippingSettings();
        setShippingSettings(settingsRes.settings);

        try {
          const pubRes = await import('@/lib/axios').then((m) =>
            m.default.get('/settings/public')
          );
          setFreeDeliveryActive(!!pubRes.data?.data?.free_delivery_enabled);
        } catch {}

        if (token) {
          try {
            const profile = await authService.getProfile();
            if (profile.success && profile.user) {
              setGuestInfo((prev) => ({ ...prev, email: profile.user.email || '' }));
            }
          } catch {}

          const addrRes = await addressService.getAddresses();
          const addrs = addrRes.addresses || [];
          setAddresses(addrs);
          if (addrs.length > 0) {
            const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
            setSelectedAddressId(defaultAddr._id);
            setSelectedGov(defaultAddr.state || '');
            setIsAddingNewAddress(false);
          } else {
            setIsAddingNewAddress(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchGovs = async () => {
      try {
        const axios = (await import('@/lib/axios')).default;
        const res = await axios.get('/shipping/cities');
        if (res.data.success) setGovernorates(res.data.cities || []);
      } catch {}
    };
    fetchGovs();
  }, []);

  useEffect(() => {
    if (!selectedGovId) {
      setDistricts([]);
      setSelectedDistrictId('');
      return;
    }
    const fetchDistricts = async () => {
      try {
        const axios = (await import('@/lib/axios')).default;
        const res = await axios.get(`/shipping/districts/${selectedGovId}`);
        if (res.data.success) setDistricts(res.data.districts || []);
      } catch {}
    };
    fetchDistricts();
  }, [selectedGovId]);

  // ─── Calculations ─────────────────────────────────────
  const subtotal = getTotal();
  const calculateShipping = useMemo(() => {
    if (freeDeliveryActive) return { cost: 0, min: 1, max: 2 };
    if (!shippingSettings) return { cost: 0, min: 3, max: 7 };
    const threshold = shippingSettings.free_shipping_threshold || 0;
    const govSettings = shippingSettings.governorate_settings || {};
    let currentGov = null;
    if (selectedGov) {
      currentGov = govSettings[selectedGov];
      if (!currentGov) {
        const searchKey = Object.keys(govSettings).find((k) => k.trim() === selectedGov.trim() || k.includes(selectedGov) || selectedGov.includes(k));
        if (searchKey) currentGov = govSettings[searchKey];
      }
    }
    if (!selectedGov) return { cost: 0, min: 1, max: 3 };
    const cost = threshold > 0 && subtotal >= threshold ? 0 : currentGov ? currentGov.cost : shippingSettings.delivery_cost || 100;
    const min = currentGov ? currentGov.days_min : shippingSettings.default_days_min || 3;
    const max = currentGov ? currentGov.days_max : shippingSettings.default_days_max || 7;
    return { cost, min, max };
  }, [shippingSettings, freeDeliveryActive, selectedGov, subtotal]);

  const { cost: shippingFee, min: deliveryMin, max: deliveryMax } = calculateShipping;
  const total = Math.round((subtotal - couponDiscount + shippingFee) * 100) / 100;

  // ─── Coupon ───────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await couponService.validateCoupon(couponCode);
      if (res.success && res.coupon) {
        setIsCouponApplied(true);
        const discountVal = res.coupon.discountAmount;
        if (res.coupon.discountType === 'percentage') {
          setCouponDiscount(Math.round((subtotal * (discountVal / 100)) * 100) / 100);
        } else {
          setCouponDiscount(discountVal);
        }
        showToast(isRTL ? 'تم تطبيق كود الخصم ✅' : 'Coupon applied ✅', 'success');
      }
    } catch {
      showToast(isRTL ? 'كود الخصم غير صالح' : 'Invalid coupon', 'error');
    }
  };

  // ─── Place Order ──────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      if (guestInfo.name.length < 3) { showToast(isRTL ? 'يرجى إدخال اسم صحيح' : 'Valid name required', 'error'); return; }
      if (!/^01[0125]\d{8}$/.test(guestInfo.phone)) { showToast(isRTL ? 'رقم الهاتف غير صحيح' : 'Invalid phone', 'error'); return; }
    }
    if (!selectedGovId || !selectedDistrictId) { showToast(isRTL ? 'يرجى اختيار العنوان' : 'Address required', 'error'); return; }
    
    setIsProcessing(true);
    try {
      let addressId = selectedAddressId;
      if (isAuthenticated && isAddingNewAddress) {
        const addrRes = await addressService.addAddress({
          street: newAddress.street, city: newAddress.city, state: selectedGov, country: 'Egypt', type: newAddress.type, isDefault: addresses.length === 0,
        });
        if (addrRes.success) addressId = addrRes.address._id;
      }
      const result = await checkoutService.placeOrder({
        items: items.map(i => ({ 
          product: i.productId, 
          name: i.name, 
          price: i.price, 
          quantity: i.quantity, 
          image_url: i.imageUrl, 
          size: i.size ?? undefined, 
          color: i.color ?? undefined 
        })),
        shippingAddress: isAuthenticated && addressId ? { ...addresses.find(a => a._id === addressId), id: addressId, state: selectedGov, districtId: selectedDistrictId, address: addresses.find(a => a._id === addressId)?.street || '' }
          : { street: guestInfo.street, city: guestInfo.city, state: selectedGov, districtId: selectedDistrictId, address: `${guestInfo.street}, ${guestInfo.city}, ${selectedGov}` },
        paymentMethod: 'Cash on Delivery', subtotal, shippingFee, discount: couponDiscount, totalAmount: total, couponCode: isCouponApplied ? couponCode : undefined,
        ...(!isAuthenticated ? { guestName: guestInfo.name, guestPhone: guestInfo.phone, guestAlternativePhone: guestInfo.phone2, guestEmail: guestInfo.email }
          : { guestAlternativePhone: newAddress.alternativePhone, guestEmail: guestInfo.email }), notes: notes || undefined,
      });
      if (result.success) { clearCart(); router.push(`/order-success/${result.order.id || result.order._id}`); }
    } catch (e: any) { showToast(e.message || 'Error', 'error'); } finally { setIsProcessing(false); }
  };

  if (items.length === 0 && !isProcessing) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-cairo pb-32 lg:pb-10" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Premium Header (Enlarged) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-90 transition-all">
            {isRTL ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {isRTL ? 'إتمام الشراء' : 'Checkout'}
            </h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRTL ? 'اتصال آمن' : 'Secure Connection'}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#0E4435]/5 flex items-center justify-center text-[#0E4435]">
            <Lock size={18} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content (Inputs) */}
          <div className="lg:col-span-7 space-y-6">
            
            <Section title={isRTL ? 'بيانات العميل' : 'Customer Info'} icon={User}>
              {isAuthenticated ? (
                <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <Check size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-emerald-800">{isRTL ? 'تم تسجيل الدخول بنجاح' : 'Authenticated'}</p>
                    <p className="text-xs font-bold text-emerald-600/70">{isRTL ? 'بياناتك محفوظة وآمنة' : 'Your data is secured'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input icon={User} placeholder={isRTL ? 'الاسم بالكامل' : 'Full Name'} value={guestInfo.name} onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input icon={Phone} type="tel" placeholder={isRTL ? 'رقم الهاتف' : 'Phone Number'} value={guestInfo.phone} onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })} />
                    <Input icon={Phone} type="tel" placeholder={isRTL ? 'رقم هاتف بديل' : 'Alt Phone'} value={guestInfo.phone2} onChange={(e) => setGuestInfo({ ...guestInfo, phone2: e.target.value })} />
                  </div>
                  <Input icon={Mail} type="email" placeholder={isRTL ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'} value={guestInfo.email} onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })} />
                </div>
              )}
            </Section>

            <Section title={isRTL ? 'عنوان الشحن' : 'Shipping Address'} icon={MapPin}>
              {isAuthenticated && addresses.length > 0 && !isAddingNewAddress ? (
                <div className="grid grid-cols-1 gap-3">
                  {addresses.map((addr) => (
                    <button key={addr._id} onClick={() => { setSelectedAddressId(addr._id); setSelectedGov(addr.state || ''); }} className={`group p-5 rounded-[22px] border-2 text-right transition-all flex items-center gap-4 ${selectedAddressId === addr._id ? 'border-[#0E4435] bg-emerald-50/30' : 'border-gray-50 hover:border-gray-200 bg-white'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedAddressId === addr._id ? 'bg-[#0E4435] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                        {addr.type === 'home' ? <Home size={20} /> : <Briefcase size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-black text-gray-900">{addr.street}</p>
                        <p className="text-xs font-bold text-gray-400">{addr.state}, {addr.city}</p>
                      </div>
                      {selectedAddressId === addr._id && <div className="w-6 h-6 bg-[#0E4435] rounded-full flex items-center justify-center text-white"><Check size={14} strokeWidth={3} /></div>}
                    </button>
                  ))}
                  <button onClick={() => setIsAddingNewAddress(true)} className="p-4 rounded-2xl border-2 border-dashed border-gray-100 text-gray-300 font-black text-sm flex items-center justify-center gap-2 hover:border-[#0E4435] hover:text-[#0E4435] transition-all">
                    <Plus size={20} /> {isRTL ? 'إضافة عنوان جديد' : 'New Address'}
                  </button>
                </div>
              ) : null}

              {(!isAuthenticated || isAddingNewAddress || addresses.length === 0) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={selectedGovId} onChange={(e) => { const gov = governorates.find(g => g.id === e.target.value); setSelectedGovId(e.target.value); setSelectedDistrictId(''); setSelectedGov(gov ? gov.arabicName : ''); }}>
                      <option value="">{isRTL ? 'المحافظة' : 'Governorate'}</option>
                      {governorates.map(gov => <option key={gov.id} value={gov.id}>{isRTL ? gov.arabicName : gov.name}</option>)}
                    </Select>
                    <Select value={selectedDistrictId} onChange={(e) => { const dist = districts.find(d => d.id === e.target.value); setSelectedDistrictId(e.target.value); if(!isAuthenticated) setGuestInfo({...guestInfo, city: dist?.arabicName || ''}); else setNewAddress({...newAddress, city: dist?.arabicName || ''}); }} disabled={!selectedGovId}>
                      <option value="">{isRTL ? 'المنطقة / المركز' : 'District'}</option>
                      {districts.map(dist => <option key={dist.id} value={dist.id}>{isRTL ? dist.arabicName : dist.name}</option>)}
                    </Select>
                  </div>
                  <Input icon={MapPin} placeholder={isRTL ? 'تفاصيل العنوان (شارع، مبنى، رقم الشقة)' : 'Street, Building, Flat...'} value={isAuthenticated ? newAddress.street : guestInfo.street} onChange={(e) => isAuthenticated ? setNewAddress({...newAddress, street: e.target.value}) : setGuestInfo({...guestInfo, street: e.target.value})} />
                </div>
              )}
            </Section>

            <Section title={isRTL ? 'ملاحظات إضافية' : 'Order Notes'} icon={Tag}>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isRTL ? 'مثال: "اتصل بي قبل الوصول" أو "بجوار صيدلية كذا"' : 'e.g. Call before arrival...'} rows={3} dir={isRTL ? 'rtl' : 'ltr'} className="w-full bg-white rounded-2xl p-5 text-[15px] font-bold text-gray-900 outline-none border border-gray-100 focus:border-[#0E4435] focus:ring-4 focus:ring-[#0E4435]/5 transition-all placeholder:text-gray-300 resize-none" />
            </Section>
          </div>

          {/* Side Content (Receipt) */}
          <div className="lg:col-span-5 space-y-6">
            <OrderReceipt subtotal={subtotal} shippingFee={shippingFee} discount={couponDiscount} total={total} couponApplied={isCouponApplied} selectedGov={selectedGov} deliveryEstimate={{ min: deliveryMin, max: deliveryMax }} />
            

            <button onClick={handlePlaceOrder} disabled={isProcessing} className={`hidden lg:flex w-full h-16 bg-[#0E4435] text-white rounded-[22px] font-black text-lg items-center justify-center gap-3 shadow-xl shadow-emerald-950/20 active:scale-[0.98] transition-all ${isProcessing ? 'opacity-60 cursor-wait' : 'hover:bg-[#0b3328]'}`}>
              {isProcessing ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><CreditCard size={22} /> <span>{isRTL ? 'تأكيد وشحن الطلب' : 'Confirm Order'}</span></>}
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Bar (ENLARGED) */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
        <button onClick={handlePlaceOrder} disabled={isProcessing} className="w-full h-16 bg-[#0E4435] text-white rounded-[22px] font-black text-base flex items-center justify-between px-6 shadow-2xl shadow-emerald-950/40 active:scale-95 transition-all">
          <div className="text-right">
            <p className="text-[10px] text-white/50 uppercase leading-none mb-1">{isRTL ? 'إجمالي الدفع' : 'Pay'}</p>
            <p className="text-lg leading-none">{Math.round(total).toLocaleString()} <span className="text-xs">EGP</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span>{isProcessing ? '...' : (isRTL ? 'تأكيد' : 'Confirm')}</span>
            <ArrowLeft size={20} strokeWidth={3} className={isRTL ? '' : 'rotate-180'} />
          </div>
        </button>
      </div>
    </div>
  );
}
