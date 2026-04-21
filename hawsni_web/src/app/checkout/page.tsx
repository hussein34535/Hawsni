'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { useLanguage } from '@/context/LanguageContext';
import { addressService, Address } from '@/services/addressService';
import { checkoutService, OrderData } from '@/services/checkoutService';
import { couponService } from '@/services/couponService';
import { authService } from '@/services/authService';

import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import OrderReceipt from '@/components/checkout/OrderReceipt';

// ─── Clean Input ────────────────────────────────────────
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
    <div className="relative">
      <div className={`absolute top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none ${
        isRTL ? 'right-4' : 'left-4'
      }`}>
        <Icon size={18} />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`w-full h-12 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-300 outline-none border border-transparent focus:border-gray-200 focus:bg-white transition-all disabled:opacity-50 ${
          isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
        }`}
      />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { isRTL, t } = useLanguage();
  const { showToast } = useToastStore();

  const [currentStep, setCurrentStep] = useState(1);
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
  // Safety rounding for total
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
          // IMPORTANT: Fixing float precision issue "19.9999999996"
          const calculatedDiscount = subtotal * (discount / 100);
          setCouponDiscount(Math.round(calculatedDiscount * 100) / 100);
        } else {
          setCouponDiscount(discount);
        }
        showToast(
          isRTL ? 'تم تطبيق كود الخصم ✅' : 'Coupon applied ✅',
          'success'
        );
      }
    } catch {
      showToast(
        isRTL ? 'كود الخصم غير صالح' : 'Invalid coupon',
        'error'
      );
    }
  };

  // ─── Place Order ──────────────────────────────────────
  const handlePlaceOrder = async () => {
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

      // Final Rounding for DB Safety
      const finalSubtotal = Math.round(subtotal * 100) / 100;
      const finalShipping = Math.round(shippingFee * 100) / 100;
      const finalDiscount = Math.round(couponDiscount * 100) / 100;
      const finalTotal = Math.round(total * 100) / 100;

      const orderData: OrderData = {
        items: items.map((item) => ({
          product: item.productId,
          name: item.name,
          price: Math.round(item.price * 100) / 100,
          quantity: Math.round(item.quantity), // Ensure INTEGER for DB
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
        subtotal: finalSubtotal,
        shippingFee: finalShipping,
        discount: finalDiscount,
        totalAmount: finalTotal,
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

  // ─── Validation ───────────────────────────────────────
  const validateStep = (step: number) => {
    if (step === 1) {
      if (isAuthenticated) return true;
      if (guestInfo.name.length < 3) {
        showToast(isRTL ? 'يرجى إدخال اسم صحيح' : 'Please enter a valid name', 'error');
        return false;
      }
      if (!/^01[0125]\d{8}$/.test(guestInfo.phone)) {
        showToast(isRTL ? 'رقم الهاتف غير صحيح' : 'Invalid phone number', 'error');
        return false;
      }
    }
    if (step === 2) {
      if (!selectedGovId) {
        showToast(isRTL ? 'يرجى اختيار المحافظة' : 'Select a governorate', 'error');
        return false;
      }
      if (!selectedDistrictId) {
        showToast(isRTL ? 'يرجى اختيار المنطقة' : 'Select a district', 'error');
        return false;
      }
      if (!isAuthenticated && guestInfo.street.length < 5) {
        showToast(isRTL ? 'يرجى كتابة العنوان بالتفصيل' : 'Enter detailed address', 'error');
        return false;
      }
      if (isAuthenticated && isAddingNewAddress && newAddress.street.length < 5) {
        showToast(isRTL ? 'يرجى كتابة العنوان بالتفصيل' : 'Enter detailed address', 'error');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep((prev) => prev + 1);
  };
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  if (items.length === 0 && !isProcessing) return null;

  const CHECKOUT_STEPS = [
    { id: 1, label: 'Contact', labelAr: 'البيانات', icon: User },
    { id: 2, label: 'Shipping', labelAr: 'العنوان', icon: MapPin },
    { id: 3, label: 'Review', labelAr: 'التأكيد', icon: CheckCircle2 },
  ];

  // ─── Select Style ─────────────────────────────────────
  const getSelectClass = () => {
    const base = 'w-full h-12 bg-gray-50 rounded-xl px-4 text-sm font-bold outline-none border border-transparent focus:border-gray-200 focus:bg-white transition-all appearance-none cursor-pointer';
    return `${base} ${isRTL ? 'text-right' : 'text-left'}`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-cairo" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => (currentStep > 1 ? prevStep() : router.back())}
            className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
          >
            {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </button>
          <div className="flex items-center gap-1.5">
            <Lock size={13} className="text-emerald-600" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {isRTL ? 'دفع آمن' : 'Secure Checkout'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <CheckoutSteps currentStep={currentStep} steps={CHECKOUT_STEPS} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── Form Side ──────────────────────────────── */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {/* STEP 1: Contact Info */}
              {currentStep === 1 && (
                <motion.section
                  key="step1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-black text-gray-900">
                      {isRTL ? 'بيانات التواصل' : 'Contact Info'}
                    </h2>
                    <p className="text-sm text-gray-400 font-bold mt-1">
                      {isRTL
                        ? 'هنحتاج البيانات دي عشان نتابع معاك طلبك'
                        : 'We need this to follow up on your order'}
                    </p>
                  </div>

                  {isAuthenticated ? (
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-emerald-800">
                          {isRTL ? 'أهلاً بيك! مسجل دخول' : 'Welcome back! Logged in'}
                        </p>
                        <p className="text-xs text-emerald-600/70 font-bold">
                          {isRTL
                            ? 'ممكن تكمل للعنوان على طول'
                            : 'You can proceed to address directly'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        id="guest-name"
                        icon={User}
                        placeholder={isRTL ? 'الاسم بالكامل' : 'Full Name'}
                        value={guestInfo.name}
                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          id="guest-phone"
                          type="tel"
                          icon={Phone}
                          placeholder={isRTL ? 'رقم الموبايل' : 'Phone'}
                          value={guestInfo.phone}
                          onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                        />
                        <Input
                          id="guest-phone2"
                          type="tel"
                          icon={Phone}
                          placeholder={isRTL ? 'رقم بديل (اختياري)' : 'Alt Phone'}
                          value={guestInfo.phone2}
                          onChange={(e) => setGuestInfo({ ...guestInfo, phone2: e.target.value })}
                        />
                      </div>
                      <Input
                        id="guest-email"
                        type="email"
                        icon={Mail}
                        placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      />
                    </div>
                  )}

                  <button
                    onClick={nextStep}
                    className="w-full h-12 bg-[#0E4435] text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-950/10 active:scale-[0.98] transition-all"
                  >
                    {isRTL ? 'متابعة' : 'Continue'}
                  </button>
                </motion.section>
              )}

              {/* STEP 2: Address */}
              {currentStep === 2 && (
                <motion.section
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-black text-gray-900">
                      {isRTL ? 'عنوان التوصيل' : 'Delivery Address'}
                    </h2>
                    <p className="text-sm text-gray-400 font-bold mt-1">
                      {isRTL
                        ? 'هنبعتلك طلبك على العنوان ده'
                        : "We'll ship your order to this address"}
                    </p>
                  </div>

                  {isAuthenticated ? (
                    <div className="space-y-4">
                      {/* Saved Addresses */}
                      <div className="space-y-2">
                        {addresses.map((addr) => (
                          <div
                            key={addr._id}
                            onClick={() => {
                              setSelectedAddressId(addr._id);
                              setSelectedGov(addr.state || '');
                              setIsAddingNewAddress(false);
                            }}
                            className={`
                              p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3
                              ${selectedAddressId === addr._id && !isAddingNewAddress
                                ? 'border-[#0E4435] bg-emerald-50/30'
                                : 'border-gray-100 bg-white hover:border-gray-200'}
                            `}
                          >
                            <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-[#0E4435]">
                              {addr.type === 'home' ? <Home size={18} /> : <Briefcase size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-emerald-600 uppercase">
                                {isRTL ? (addr.type === 'home' ? 'منزل' : 'مكتب') : addr.type}
                              </p>
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {addr.street}
                              </p>
                              <p className="text-xs text-gray-400">
                                {addr.state}, {addr.city}
                              </p>
                            </div>
                            {selectedAddressId === addr._id && !isAddingNewAddress && (
                              <div className="w-5 h-5 bg-[#0E4435] rounded-full flex items-center justify-center text-white flex-shrink-0">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add New */}
                        <button
                          onClick={() => setIsAddingNewAddress(true)}
                          className={`
                            w-full p-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2
                            ${isAddingNewAddress
                              ? 'border-[#0E4435] text-[#0E4435] bg-emerald-50/20'
                              : 'border-gray-200 text-gray-400 hover:border-gray-300'}
                          `}
                        >
                          <Plus size={16} />
                          <span className="text-sm font-bold">
                            {isRTL ? 'عنوان جديد' : 'New Address'}
                          </span>
                        </button>
                      </div>

                      {/* New Address Form */}
                      {isAddingNewAddress && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-3 pt-4 border-t border-gray-100"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={selectedGovId}
                              onChange={(e) => {
                                const gov = governorates.find((g) => g.id === e.target.value);
                                setSelectedGovId(e.target.value);
                                setSelectedDistrictId('');
                                setSelectedGov(gov ? gov.arabicName : '');
                              }}
                              className={getSelectClass()}
                            >
                              <option value="">{isRTL ? 'المحافظة' : 'Governorate'}</option>
                              {governorates.map((gov) => (
                                <option key={gov.id} value={gov.id}>
                                  {isRTL ? gov.arabicName : gov.name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={selectedDistrictId}
                              onChange={(e) => {
                                const dist = districts.find((d) => d.id === e.target.value);
                                setSelectedDistrictId(e.target.value);
                                setNewAddress({ ...newAddress, city: dist ? dist.arabicName : '' });
                              }}
                              disabled={!selectedGovId}
                              className={`${getSelectClass()} disabled:opacity-30`}
                            >
                              <option value="">{isRTL ? 'المنطقة' : 'District'}</option>
                              {districts.map((dist) => (
                                <option key={dist.id} value={dist.id}>
                                  {isRTL ? dist.arabicName : dist.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Input
                            id="new-street"
                            icon={MapPin}
                            placeholder={isRTL ? 'العنوان بالتفصيل' : 'Detailed Address'}
                            value={newAddress.street}
                            onChange={(e) =>
                              setNewAddress({ ...newAddress, street: e.target.value })
                            }
                          />
                          <div className="flex gap-2">
                            {(['home', 'office', 'other'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => setNewAddress({ ...newAddress, type })}
                                className={`
                                  flex-1 h-10 rounded-lg text-xs font-bold transition-all
                                  ${newAddress.type === type
                                    ? 'bg-[#0E4435] text-white'
                                    : 'bg-gray-50 text-gray-400 border border-gray-100'}
                                `}
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
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    /* Guest Address Form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={selectedGovId}
                          onChange={(e) => {
                            const gov = governorates.find((g) => g.id === e.target.value);
                            setSelectedGovId(e.target.value);
                            setSelectedDistrictId('');
                            setSelectedGov(gov ? gov.arabicName : '');
                          }}
                          className={getSelectClass()}
                        >
                          <option value="">{isRTL ? 'المحافظة' : 'Governorate'}</option>
                          {governorates.map((gov) => (
                            <option key={gov.id} value={gov.id}>
                              {isRTL ? gov.arabicName : gov.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedDistrictId}
                          onChange={(e) => {
                            const dist = districts.find((d) => d.id === e.target.value);
                            setSelectedDistrictId(e.target.value);
                            setGuestInfo({ ...guestInfo, city: dist ? dist.arabicName : '' });
                          }}
                          disabled={!selectedGovId}
                          className={`${getSelectClass()} disabled:opacity-30`}
                        >
                          <option value="">{isRTL ? 'المنطقة' : 'District'}</option>
                          {districts.map((dist) => (
                            <option key={dist.id} value={dist.id}>
                              {isRTL ? dist.arabicName : dist.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        id="guest-street"
                        icon={MapPin}
                        placeholder={isRTL ? 'تفاصيل العنوان (شارع، مبنى، شقة)' : 'Address details'}
                        value={guestInfo.street}
                        onChange={(e) => setGuestInfo({ ...guestInfo, street: e.target.value })}
                      />
                    </div>
                  )}

                  <button
                    onClick={nextStep}
                    className="w-full h-12 bg-[#0E4435] text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-950/10 active:scale-[0.98] transition-all"
                  >
                    {isRTL ? 'متابعة' : 'Continue'}
                  </button>
                </motion.section>
              )}

              {/* STEP 3: Review */}
              {currentStep === 3 && (
                <motion.section
                  key="step3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-black text-gray-900">
                      {isRTL ? 'مراجعة الطلب' : 'Review Order'}
                    </h2>
                    <p className="text-sm text-gray-400 font-bold mt-1">
                      {isRTL
                        ? 'تأكد إن كل حاجة صح قبل التأكيد'
                        : 'Make sure everything is correct before confirming'}
                    </p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        {isRTL ? 'الاسم' : 'Name'}
                      </p>
                      <p className="text-sm font-black text-gray-900 truncate">
                        {isAuthenticated ? (isRTL ? 'مسجل دخول' : 'Logged In') : guestInfo.name}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        {isRTL ? 'التوصيل لـ' : 'Shipping To'}
                      </p>
                      <p className="text-sm font-black text-gray-900 truncate">{selectedGov}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1.5">
                      {isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        isRTL
                          ? 'مثال: بجوار مسجد كذا...'
                          : 'e.g. Near the mosque...'
                      }
                      rows={3}
                      className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold outline-none border border-transparent focus:border-gray-200 focus:bg-white transition-all placeholder:text-gray-300 resize-none"
                    />
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className={`
                      w-full h-14 bg-[#0E4435] text-white rounded-xl font-black text-base
                      shadow-lg shadow-emerald-950/10 active:scale-[0.98] transition-all
                      flex items-center justify-center gap-2
                      ${isProcessing ? 'opacity-60 cursor-wait' : ''}
                    `}
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isRTL ? 'تأكيد الطلب' : 'Confirm Order'}</span>
                        {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                      </>
                    )}
                  </button>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Receipt Side ───────────────────────────── */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
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
              <div className="flex items-center gap-2 mb-3">
                <Tag size={14} className={isCouponApplied ? 'text-emerald-600' : 'text-gray-300'} />
                <span className="text-sm font-bold text-gray-900">
                  {isRTL ? 'كود خصم' : 'Coupon Code'}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isRTL ? 'الكود هنا...' : 'Enter code...'}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={isCouponApplied}
                  className="flex-1 h-10 bg-gray-50 rounded-lg px-3 text-sm font-bold outline-none border border-transparent focus:border-gray-200 disabled:opacity-50"
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
                    <X size={16} />
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

            {/* Trust Badges */}
            <div className="flex gap-3">
              <div className="flex-1 bg-white rounded-xl border border-gray-100 p-3 text-center">
                <Truck size={18} className="mx-auto mb-1 text-emerald-600" />
                <p className="text-[10px] font-bold text-gray-400">
                  {isRTL ? 'توصيل سريع' : 'Fast Delivery'}
                </p>
              </div>
              <div className="flex-1 bg-white rounded-xl border border-gray-100 p-3 text-center">
                <ShoppingBag size={18} className="mx-auto mb-1 text-emerald-600" />
                <p className="text-[10px] font-bold text-gray-400">
                  {isRTL ? 'منتجات أصلية' : 'Original Items'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Mobile Bottom Bar ─────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 z-40">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400">{isRTL ? 'الإجمالي' : 'Total'}</p>
            <p className="text-lg font-black text-[#0E4435]">
              {Math.round(total).toLocaleString()}{' '}
              <span className="text-[10px] font-bold">{isRTL ? 'ج.م' : 'EGP'}</span>
            </p>
          </div>
          <button
            onClick={currentStep < 3 ? nextStep : handlePlaceOrder}
            disabled={isProcessing}
            className="h-12 px-8 bg-[#0E4435] text-white rounded-xl font-black text-sm flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-950/10"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {currentStep < 3
                    ? isRTL
                      ? 'متابعة'
                      : 'Continue'
                    : isRTL
                      ? 'تأكيد'
                      : 'Confirm'}
                </span>
                {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

