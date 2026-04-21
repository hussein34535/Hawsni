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

// ─── Beautiful Input ────────────────────────────────────
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
          isRTL ? 'right-4' : 'left-4'
        }`}
      >
        <Icon size={17} />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`w-full h-11 bg-white rounded-xl text-[13px] font-bold text-gray-900 placeholder:text-gray-300 outline-none border border-gray-100 focus:border-[#0E4435] focus:ring-2 focus:ring-[#0E4435]/5 transition-all disabled:opacity-50 ${
          isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
        }`}
      />
    </div>
  );
}

// ─── Beautiful Select ───────────────────────────────────
function Select({
  value,
  onChange,
  children,
  disabled = false,
  placeholder,
}: {
  value: string;
  onChange: (e: any) => void;
  children: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { isRTL } = useLanguage();

  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`w-full h-11 bg-white rounded-xl text-[13px] font-bold text-gray-900 outline-none border border-gray-100 focus:border-[#0E4435] focus:ring-2 focus:ring-[#0E4435]/5 transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
          isRTL ? 'pr-4 pl-10 text-right' : 'pl-4 pr-10 text-left'
        } ${!value ? 'text-gray-300' : ''}`}
      >
        {children}
      </select>
      <div
        className={`absolute top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none ${
          isRTL ? 'left-3' : 'right-3'
        }`}
      >
        <ChevronDown size={16} />
      </div>
    </div>
  );
}

// ─── Section Card ───────────────────────────────────────
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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-[#0E4435]/5 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-[#0E4435]" />
        </div>
        <h3 className="text-sm font-black text-gray-900">{title}</h3>
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
        const searchKey = Object.keys(govSettings).find(
          (k) =>
            k.trim() === selectedGov.trim() ||
            k.includes(selectedGov) ||
            selectedGov.includes(k)
        );
        if (searchKey) currentGov = govSettings[searchKey];
      }
    }

    if (!selectedGov) return { cost: 0, min: 1, max: 3 };

    const cost =
      threshold > 0 && subtotal >= threshold
        ? 0
        : currentGov
          ? currentGov.cost
          : shippingSettings.delivery_cost || 100;

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
        const discount = res.coupon.discountAmount;
        if (res.coupon.discountType === 'percentage') {
          const calculatedDiscount = subtotal * (discount / 100);
          setCouponDiscount(Math.round(calculatedDiscount * 100) / 100);
        } else {
          setCouponDiscount(discount);
        }
        showToast(isRTL ? 'تم تطبيق كود الخصم ✅' : 'Coupon applied ✅', 'success');
      }
    } catch {
      showToast(isRTL ? 'كود الخصم غير صالح' : 'Invalid coupon', 'error');
    }
  };

  // ─── Place Order ──────────────────────────────────────
  const handlePlaceOrder = async () => {
    // Validation
    if (!isAuthenticated) {
      if (guestInfo.name.length < 3) {
        showToast(isRTL ? 'يرجى إدخال اسم صحيح' : 'Please enter a valid name', 'error');
        return;
      }
      if (!/^01[0125]\d{8}$/.test(guestInfo.phone)) {
        showToast(isRTL ? 'رقم الهاتف غير صحيح' : 'Invalid phone number', 'error');
        return;
      }
    }

    if (!selectedGovId) {
      showToast(isRTL ? 'يرجى اختيار المحافظة' : 'Select a governorate', 'error');
      return;
    }
    if (!selectedDistrictId) {
      showToast(isRTL ? 'يرجى اختيار المنطقة' : 'Select a district', 'error');
      return;
    }

    const streetToValidate = isAuthenticated && isAddingNewAddress
      ? newAddress.street
      : guestInfo.street;
    if (!isAuthenticated || isAddingNewAddress) {
      if (streetToValidate.length < 5) {
        showToast(isRTL ? 'يرجى كتابة العنوان بالتفصيل' : 'Enter detailed address', 'error');
        return;
      }
    }

    setIsProcessing(true);
    try {
      let addressId = selectedAddressId;
      if (isAuthenticated && isAddingNewAddress) {
        const saveAddrRes = await addressService.addAddress({
          street: newAddress.street,
          city: newAddress.city,
          state: selectedGov,
          country: 'Egypt',
          type: newAddress.type,
          isDefault: addresses.length === 0,
        });
        if (saveAddrRes.success) addressId = saveAddrRes.address._id;
      }

      const orderData: OrderData = {
        items: items.map((item) => ({
          product: item.productId,
          name: item.name,
          price: Math.round(item.price * 100) / 100,
          quantity: Math.round(item.quantity),
          image_url: item.imageUrl,
          size: item.size || undefined,
          color: item.color || undefined,
          accessories: item.accessories || undefined,
        })),
        shippingAddress:
          isAuthenticated && addressId
            ? {
                ...addresses.find((a) => a._id === addressId),
                id: addressId,
                state: selectedGov,
                districtId: selectedDistrictId || undefined,
                address: addresses.find((a) => a._id === addressId)?.street || '',
              }
            : {
                street: guestInfo.street,
                city: guestInfo.city,
                state: selectedGov,
                districtId: selectedDistrictId || undefined,
                address: `${guestInfo.street}, ${guestInfo.city}, ${selectedGov}`,
              },
        paymentMethod: 'Cash on Delivery',
        subtotal: Math.round(subtotal * 100) / 100,
        shippingFee: Math.round(shippingFee * 100) / 100,
        discount: Math.round(couponDiscount * 100) / 100,
        totalAmount: Math.round(total * 100) / 100,
        couponCode: isCouponApplied ? couponCode : undefined,
        ...(!isAuthenticated
          ? {
              guestName: guestInfo.name,
              guestPhone: guestInfo.phone,
              guestAlternativePhone: guestInfo.phone2,
              guestEmail: guestInfo.email,
            }
          : {
              guestAlternativePhone: newAddress.alternativePhone,
              guestEmail: guestInfo.email,
            }),
        notes: notes || undefined,
      };

      const result = await checkoutService.placeOrder(orderData);
      if (result.success) {
        clearCart();
        router.push(`/order-success/${result.order.id || result.order._id}`);
      }
    } catch (error: any) {
      showToast(error.message || error || 'Failed to place order', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isProcessing) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-cairo pb-28 lg:pb-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 active:scale-95 transition-transform"
          >
            {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </button>
          <h1 className="text-base font-black text-gray-900">
            {isRTL ? 'إتمام الطلب' : 'Checkout'}
          </h1>
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {isRTL ? 'آمن' : 'Secure'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ─── Form Column ─────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Contact Section */}
            <Section title={isRTL ? 'بيانات التواصل' : 'Contact Info'} icon={User}>
              {isAuthenticated ? (
                <div className="bg-emerald-50/60 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <p className="text-xs font-bold text-emerald-700">
                    {isRTL ? 'مسجل دخول - ممكن تكمل على طول' : 'Logged in - proceed directly'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    icon={User}
                    placeholder={isRTL ? 'الاسم بالكامل' : 'Full Name'}
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      icon={Phone}
                      type="tel"
                      placeholder={isRTL ? 'رقم الموبايل' : 'Phone'}
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                    />
                    <Input
                      icon={Phone}
                      type="tel"
                      placeholder={isRTL ? 'رقم بديل' : 'Alt Phone'}
                      value={guestInfo.phone2}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone2: e.target.value })}
                    />
                  </div>
                  <Input
                    icon={Mail}
                    type="email"
                    placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                  />
                </div>
              )}
            </Section>

            {/* Address Section */}
            <Section title={isRTL ? 'عنوان التوصيل' : 'Delivery Address'} icon={MapPin}>
              {isAuthenticated && addresses.length > 0 && !isAddingNewAddress ? (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => {
                        setSelectedAddressId(addr._id);
                        setSelectedGov(addr.state || '');
                      }}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                        selectedAddressId === addr._id
                          ? 'border-[#0E4435] bg-emerald-50/20'
                          : 'border-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[#0E4435]">
                        {addr.type === 'home' ? <Home size={14} /> : <Briefcase size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{addr.street}</p>
                        <p className="text-[10px] text-gray-400">{addr.state}, {addr.city}</p>
                      </div>
                      {selectedAddressId === addr._id && (
                        <div className="w-5 h-5 bg-[#0E4435] rounded-full flex items-center justify-center text-white flex-shrink-0">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setIsAddingNewAddress(true)}
                    className="w-full p-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:border-[#0E4435] hover:text-[#0E4435] transition-colors"
                  >
                    <Plus size={14} />
                    {isRTL ? 'عنوان جديد' : 'New Address'}
                  </button>
                </div>
              ) : null}

              {/* Address Form (Guest or New Address) */}
              {(!isAuthenticated || isAddingNewAddress || addresses.length === 0) && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={selectedGovId}
                      onChange={(e: any) => {
                        const gov = governorates.find((g) => g.id === e.target.value);
                        setSelectedGovId(e.target.value);
                        setSelectedDistrictId('');
                        setSelectedGov(gov ? gov.arabicName : '');
                      }}
                    >
                      <option value="">{isRTL ? 'المحافظة' : 'Governorate'}</option>
                      {governorates.map((gov) => (
                        <option key={gov.id} value={gov.id}>
                          {isRTL ? gov.arabicName : gov.name}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={selectedDistrictId}
                      onChange={(e: any) => {
                        const dist = districts.find((d) => d.id === e.target.value);
                        setSelectedDistrictId(e.target.value);
                        if (!isAuthenticated) {
                          setGuestInfo({ ...guestInfo, city: dist ? dist.arabicName : '' });
                        } else {
                          setNewAddress({ ...newAddress, city: dist ? dist.arabicName : '' });
                        }
                      }}
                      disabled={!selectedGovId}
                    >
                      <option value="">{isRTL ? 'المنطقة' : 'District'}</option>
                      {districts.map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {isRTL ? dist.arabicName : dist.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Input
                    icon={MapPin}
                    placeholder={isRTL ? 'تفاصيل العنوان (شارع، مبنى)' : 'Address details'}
                    value={isAuthenticated ? newAddress.street : guestInfo.street}
                    onChange={(e) => {
                      if (isAuthenticated) {
                        setNewAddress({ ...newAddress, street: e.target.value });
                      } else {
                        setGuestInfo({ ...guestInfo, street: e.target.value });
                      }
                    }}
                  />
                  {isAuthenticated && isAddingNewAddress && (
                    <div className="flex gap-2">
                      {(['home', 'office', 'other'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setNewAddress({ ...newAddress, type })}
                          className={`flex-1 h-9 rounded-lg text-[11px] font-bold transition-all ${
                            newAddress.type === type
                              ? 'bg-[#0E4435] text-white'
                              : 'bg-gray-50 text-gray-400 border border-gray-100'
                          }`}
                        >
                          {isRTL
                            ? type === 'home'
                              ? 'منزل'
                              : type === 'office'
                                ? 'مكتب'
                                : 'آخر'
                            : type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Estimate */}
              {selectedGov && shippingFee > 0 && (
                <div className="flex items-center gap-2 bg-amber-50/60 rounded-lg p-2.5">
                  <Truck size={14} className="text-amber-500 flex-shrink-0" />
                  <p className="text-[11px] text-amber-700 font-bold">
                    {isRTL
                      ? `التوصيل خلال ${deliveryMin}-${deliveryMax} أيام عمل`
                      : `Delivery in ${deliveryMin}-${deliveryMax} business days`}
                  </p>
                </div>
              )}
              {selectedGov && shippingFee === 0 && (
                <div className="flex items-center gap-2 bg-emerald-50/60 rounded-lg p-2.5">
                  <Truck size={14} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-[11px] text-emerald-700 font-bold">
                    {isRTL ? '🎉 الشحن مجاني!' : '🎉 Free Shipping!'}
                  </p>
                </div>
              )}
            </Section>

            {/* Notes Section */}
            <Section title={isRTL ? 'ملاحظات' : 'Notes'} icon={Tag}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isRTL ? 'مثال: بجوار مسجد كذا...' : 'e.g. Near the mosque...'}
                rows={2}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full bg-white rounded-xl p-3 text-[13px] font-bold text-gray-900 outline-none border border-gray-100 focus:border-[#0E4435] focus:ring-2 focus:ring-[#0E4435]/5 transition-all placeholder:text-gray-300 resize-none"
              />
            </Section>
          </div>

          {/* ─── Receipt Column ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-20">
            <OrderReceipt
              subtotal={subtotal}
              shippingFee={shippingFee}
              discount={couponDiscount}
              total={total}
              couponApplied={isCouponApplied}
              selectedGov={selectedGov}
              deliveryEstimate={{ min: deliveryMin, max: deliveryMax }}
            />

            {/* Coupon */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isRTL ? 'كود الخصم' : 'Coupon code'}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={isCouponApplied}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className={`flex-1 h-10 bg-gray-50 rounded-lg px-3 text-xs font-bold outline-none border border-transparent focus:border-[#0E4435] disabled:opacity-50 ${
                    isRTL ? 'text-right' : 'text-left'
                  }`}
                />
                {isCouponApplied ? (
                  <button
                    onClick={() => {
                      setIsCouponApplied(false);
                      setCouponCode('');
                      setCouponDiscount(0);
                    }}
                    className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 h-10 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors active:scale-95"
                  >
                    {isRTL ? 'تطبيق' : 'Apply'}
                  </button>
                )}
              </div>
            </div>

            {/* Desktop CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className={`hidden lg:flex w-full h-14 bg-[#0E4435] text-white rounded-2xl font-black text-base items-center justify-center gap-2 shadow-lg shadow-emerald-950/10 active:scale-[0.98] transition-all ${
                isProcessing ? 'opacity-60 cursor-wait' : 'hover:bg-[#0b352a]'
              }`}
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag size={18} />
                  <span>{isRTL ? 'تأكيد الطلب' : 'Place Order'}</span>
                </>
              )}
            </button>

            {/* Trust */}
            <div className="hidden lg:flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-3">
                <Truck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-gray-400">
                  {isRTL ? 'توصيل سريع' : 'Fast Delivery'}
                </span>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-3">
                <Lock size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-gray-400">
                  {isRTL ? 'دفع آمن' : 'Secure Pay'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Mobile Sticky CTA ──────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-4 py-3 z-50">
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessing}
          className={`w-full h-12 bg-[#0E4435] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/10 active:scale-[0.98] transition-all ${
            isProcessing ? 'opacity-60' : ''
          }`}
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>{isRTL ? 'تأكيد الطلب' : 'Place Order'}</span>
              <span className="text-white/60">•</span>
              <span>{Math.round(total).toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
