'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    MapPin,
    Truck,
    CreditCard,
    CheckCircle2,
    Check,
    ChevronRight,
    Home,
    Briefcase,
    Plus,
    X,
    Phone,
    User,
    Mail,
    Tag,
    Receipt,
    User as PersonStanding
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';
import { addressService, Address } from '@/services/addressService';
import { checkoutService, OrderData } from '@/services/checkoutService';
import { couponService } from '@/services/couponService';
import { trackEvent } from '@/components/analytics/FacebookPixel';
import { trackGAEvent } from '@/components/analytics/GoogleAnalytics';
import { authService } from '@/services/authService';

const egyptGovernorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
    'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
    'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
    'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'سوهاج', 'الساحل الشمالي'
];

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const { isRTL, t } = useLanguage();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Address & Shipping State
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [shippingSettings, setShippingSettings] = useState<any>(null);
    const [freeDeliveryActive, setFreeDeliveryActive] = useState(false);
    const [selectedGov, setSelectedGov] = useState('');
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    const [newAddress, setNewAddress] = useState<{ street: string; city: string; type: 'home' | 'office' | 'other'; alternativePhone?: string }>({ street: '', city: '', type: 'home', alternativePhone: '' });

    // Guest Info
    const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', phone2: '', email: '', street: '', city: '' });

    // Coupon states
    const [notes, setNotes] = useState('');

    // Bosta Cascaded States
    const [governorates, setGovernorates] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [selectedGovId, setSelectedGovId] = useState('');
    const [selectedDistrictId, setSelectedDistrictId] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);

        const fetchData = async () => {
            try {
                const settingsRes = await checkoutService.getShippingSettings();
                setShippingSettings(settingsRes.settings);

                // Check if free delivery is enabled globally
                try {
                    const pubRes = await import('@/lib/axios').then(m => m.default.get('/settings/public'));
                    setFreeDeliveryActive(!!pubRes.data?.data?.free_delivery_enabled);
                } catch { }

                if (token) {
                    // Fetch user profile to auto-fill email
                    try {
                        const profile = await authService.getProfile();
                        if (profile.success && profile.user) {
                            setGuestInfo(prev => ({ ...prev, email: profile.user.email || '' }));
                        }
                    } catch (err) {
                        console.error('Failed to auto-fill email:', err);
                    }

                    const addrRes = await addressService.getAddresses();
                    const addrs = addrRes.addresses || [];
                    setAddresses(addrs);
                    if (addrs.length > 0) {
                        const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
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

    // Fetch Bosta Cities
    useEffect(() => {
        const fetchGovs = async () => {
            try {
                const axios = (await import('@/lib/axios')).default;
                const res = await axios.get('/shipping/cities');
                if (res.data.success) {
                    setGovernorates(res.data.cities || []);
                }
            } catch (err) {
                console.error('Failed to fetch governorates:', err);
            }
        };
        fetchGovs();
    }, []);

    // Fetch Bosta Districts when city changes
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
                if (res.data.success) {
                    setDistricts(res.data.districts || []);
                }
            } catch (err) {
                console.error('Failed to fetch districts:', err);
            }
        };
        fetchDistricts();
    }, [selectedGovId]);

    const subtotal = getTotal();

    const calculateShipping = () => {
        // Free delivery is fully on — skip all calculations
        if (freeDeliveryActive) return { cost: 0, min: 1, max: 2 };

        if (!shippingSettings) return { cost: 50, min: 3, max: 7 };
        const threshold = shippingSettings.free_shipping_threshold || 0;

        const govSettings = shippingSettings.governorate_settings || {};
        const currentGov = selectedGov && govSettings[selectedGov] ? govSettings[selectedGov] : null;

        const cost = (threshold > 0 && subtotal >= threshold)
            ? 0
            : (currentGov ? currentGov.cost : (shippingSettings.delivery_cost || 50));

        const min = currentGov ? currentGov.days_min : (shippingSettings.default_days_min || 3);
        const max = currentGov ? currentGov.days_max : (shippingSettings.default_days_max || 7);

        return { cost, min, max };
    };

    const { cost: shippingFee, min: deliveryMin, max: deliveryMax } = calculateShipping();
    const total = subtotal - couponDiscount + shippingFee;

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        try {
            const res = await couponService.validateCoupon(couponCode);
            if (res.success && res.coupon) {
                setIsCouponApplied(true);
                const discount = res.coupon.discountAmount;
                setCouponType(res.coupon.discountType);
                if (res.coupon.discountType === 'percentage') {
                    setCouponDiscount(subtotal * (discount / 100));
                } else {
                    setCouponDiscount(discount);
                }
            }
        } catch (error: any) {
            alert(error || 'Invalid coupon');
        }
    };

    const handleRemoveCoupon = () => {
        setIsCouponApplied(false);
        setCouponCode('');
        setCouponDiscount(0);
    };

    const handlePlaceOrder = async () => {
        if (!isAuthenticated && (!guestInfo.name || !guestInfo.phone || !guestInfo.street || !selectedGov)) {
            alert(isRTL ? 'يرجى إكمال جميع البيانات' : 'Please complete all fields');
            return;
        }
        if (isAuthenticated && !selectedAddressId && !isAddingNewAddress) {
            alert(isRTL ? 'يرجى اختيار عنوان' : 'Please select an address');
            return;
        }
        if (isAuthenticated && isAddingNewAddress && (!newAddress.street || !newAddress.city || !selectedGov)) {
            alert(isRTL ? 'يرجى إكمال بيانات العنوان الجديد' : 'Please complete new address details');
            return;
        }

        // Egyptian Phone validation (Guest Only)
        if (!isAuthenticated) {
            const phoneCleaner = guestInfo.phone ? guestInfo.phone.replace(/[\s\-+]/g, '') : '';
            const phoneRegex = /^2?(010|011|012|015)\d{8}$/;

            if (!phoneRegex.test(phoneCleaner)) {
                alert(isRTL ? 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)' : 'Please enter a valid Egyptian phone number (e.g. 01012345678)');
                return;
            }
        }

        setIsProcessing(true);
        try {
            let addressId = selectedAddressId;

            // If user is logged in and entered a new address, save it first
            if (isAuthenticated && isAddingNewAddress) {
                const saveAddrRes = await addressService.addAddress({
                    street: newAddress.street,
                    city: newAddress.city,
                    state: selectedGov,
                    country: 'Egypt',
                    type: newAddress.type,
                    isDefault: addresses.length === 0
                });
                if (saveAddrRes.success) {
                    addressId = saveAddrRes.address._id;
                }
            }

            const orderData: OrderData = {
                items: items.map(item => ({
                    product: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image_url: item.imageUrl,
                    size: item.size || undefined,
                    color: item.color || undefined,
                    accessories: item.accessories || undefined
                })),
                shippingAddress: isAuthenticated && addressId
                    ? {
                        ...addresses.find(a => a._id === addressId),
                        id: addressId,
                        state: selectedGov,
                        districtId: selectedDistrictId || undefined,
                        address: addresses.find(a => a._id === addressId)?.street || ''
                    }
                    : {
                        street: guestInfo.street,
                        city: guestInfo.city,
                        state: selectedGov,
                        districtId: selectedDistrictId || undefined,
                        address: `${guestInfo.street}, ${guestInfo.city}, ${selectedGov}`
                    },
                paymentMethod: 'Cash on Delivery',
                subtotal,
                shippingFee,
                discount: couponDiscount,
                totalAmount: total,
                couponCode: isCouponApplied ? couponCode : undefined,
                ...(!isAuthenticated ? {
                    guestName: guestInfo.name,
                    guestPhone: guestInfo.phone,
                    guestAlternativePhone: guestInfo.phone2,
                    guestEmail: guestInfo.email
                } : {
                    guestAlternativePhone: newAddress.alternativePhone,
                    guestEmail: guestInfo.email // Always include email if we have it
                }),
                notes: notes || undefined
            };

            const result = await checkoutService.placeOrder(orderData);
            if (result.success) {
                clearCart();
                router.push(`/order-success/${result.order.id || result.order._id}`);
            }
        } catch (error: any) {
            alert(error || 'Failed to place order');
        } finally {
            setIsProcessing(false);
        }
    };

    if (items.length === 0 && !isProcessing) return null;

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-24 text-right font-cairo" dir="ltr">
            {/* Sticky Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
                    >
                        {isRTL ? <ArrowRight className="w-5 h-5 text-gray-900" /> : <ArrowLeft className="w-5 h-5 text-gray-900" />}
                    </button>
                    <h1 className="text-lg font-black text-gray-900">
                        {isRTL ? 'إتمام الشراء' : 'Checkout'}
                    </h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Details Column */}
                <div className="lg:col-span-7 space-y-10">

                    {/* Guest Information */}
                    {!isAuthenticated && (
                        <section>
                            <div className="flex items-center gap-3 mb-5">
                                <PersonStanding className="w-7 h-7 text-[#0E4435]" />
                                <h2 className="text-xl font-black text-gray-900 font-cairo">
                                    {isRTL ? 'بيانات العميل' : 'Guest Information'}
                                </h2>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
                                <input
                                    type="text" value={guestInfo.name}
                                    onChange={e => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                    placeholder={isRTL ? 'الاسم الكامل' : 'Full Name'}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm"
                                />
                                <input
                                    type="tel" value={guestInfo.phone}
                                    onChange={e => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                    placeholder={isRTL ? 'رقم الهاتف الأساسي' : 'Primary Phone Number'}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm"
                                />
                                <input
                                    type="tel" value={guestInfo.phone2}
                                    onChange={e => setGuestInfo({ ...guestInfo, phone2: e.target.value })}
                                    placeholder={isRTL ? 'رقم هاتف آخر (اختياري)' : 'Alternative Phone (Optional)'}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm"
                                />
                                <input
                                    type="email" value={guestInfo.email}
                                    onChange={e => setGuestInfo({ ...guestInfo, email: e.target.value })}
                                    placeholder={isRTL ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm"
                                />
                            </div>
                        </section>
                    )}

                    {/* Shipping Address */}
                    <section>
                        <div className="flex items-center gap-3 mb-5">
                            <MapPin className="w-7 h-7 text-[#0E4435]" />
                            <h2 className="text-xl font-black text-gray-900 font-cairo">
                                {isRTL ? 'عنوان التوصيل' : 'Shipping Address'}
                            </h2>
                        </div>
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            {isAuthenticated ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr._id}
                                            onClick={() => {
                                                setSelectedAddressId(addr._id);
                                                setSelectedGov(addr.state || '');
                                                setIsAddingNewAddress(false);
                                            }}
                                            className={`
                                                cursor-pointer p-6 rounded-3xl border-2 transition-all relative flex items-center gap-4
                                                ${selectedAddressId === addr._id && !isAddingNewAddress ? 'border-[#0E4435] bg-emerald-50/20' : 'border-transparent bg-gray-50 hover:bg-gray-100'}
                                            `}
                                        >
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0E4435] shadow-sm">
                                                {addr.type === 'home' ? <Home size={18} /> : <Briefcase size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                                                    {isRTL ? (addr.type === 'home' ? 'منزل' : 'عمل') : addr.type}
                                                </h4>
                                                <p className="text-sm font-bold text-gray-900 truncate">{addr.street}</p>
                                            </div>
                                            {selectedAddressId === addr._id && !isAddingNewAddress && <CheckCircle2 className="text-[#0E4435]" size={20} />}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsAddingNewAddress(true)}
                                        className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-center gap-2 hover:bg-gray-100 ${isAddingNewAddress ? 'border-[#0E4435] bg-emerald-50/20 text-[#0E4435]' : 'border-dashed border-gray-200 text-gray-400'}`}
                                    >
                                        <Plus size={20} /> <span className="font-bold text-sm">{isRTL ? 'إضافة عنوان جديد' : 'Add New Address'}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <input
                                        type="text" value={guestInfo.street}
                                        onChange={e => setGuestInfo({ ...guestInfo, street: e.target.value })}
                                        placeholder={isRTL ? 'اسم الشارع / رقم العقار' : 'Street Address'}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <select
                                            value={selectedGovId} 
                                            onChange={e => {
                                                const gov = governorates.find(g => g.id === e.target.value);
                                                setSelectedGovId(e.target.value);
                                                setSelectedGov(gov ? gov.arabicName : '');
                                            }}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm"
                                        >
                                            <option value="">{isRTL ? 'اختر المحافظة' : 'Select Governorate'}</option>
                                            {governorates.map(gov => (
                                                <option key={gov.id} value={gov.id}>
                                                    {isRTL ? gov.arabicName : gov.name}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={selectedDistrictId}
                                            onChange={e => {
                                                const dist = districts.find(d => d.id === e.target.value);
                                                setSelectedDistrictId(e.target.value);
                                                setGuestInfo({ ...guestInfo, city: dist ? dist.arabicName : '' });
                                            }}
                                            disabled={!selectedGovId}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm disabled:opacity-50"
                                        >
                                            <option value="">{isRTL ? 'اختر المنطقة / الحي' : 'Select area / district'}</option>
                                            {districts.map(dist => (
                                                <option key={dist.id} value={dist.id}>
                                                    {isRTL ? dist.arabicName : dist.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* New Address Form for Authenticated Users */}
                            {isAuthenticated && isAddingNewAddress && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="pt-6 mt-6 border-t border-gray-100 space-y-4"
                                >
                                    <input
                                        type="text" value={newAddress.street}
                                        onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                        placeholder={isRTL ? 'اسم الشارع / رقم العقار الجديد' : 'New Street Address'}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <select
                                            value={selectedGovId} 
                                            onChange={e => {
                                                const gov = governorates.find(g => g.id === e.target.value);
                                                setSelectedGovId(e.target.value);
                                                setSelectedGov(gov ? gov.arabicName : '');
                                            }}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm"
                                        >
                                            <option value="">{isRTL ? 'اختر المحافظة' : 'Select Governorate'}</option>
                                            {governorates.map(gov => (
                                                <option key={gov.id} value={gov.id}>
                                                    {isRTL ? gov.arabicName : gov.name}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={selectedDistrictId}
                                            onChange={e => {
                                                const dist = districts.find(d => d.id === e.target.value);
                                                setSelectedDistrictId(e.target.value);
                                                setNewAddress({ ...newAddress, city: dist ? dist.arabicName : '' });
                                            }}
                                            disabled={!selectedGovId}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm disabled:opacity-50"
                                        >
                                            <option value="">{isRTL ? 'اختر المنطقة / الحي' : 'Select area / district'}</option>
                                            {districts.map(dist => (
                                                <option key={dist.id} value={dist.id}>
                                                    {isRTL ? dist.arabicName : dist.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2 mb-4">
                                        {(['home', 'office', 'other'] as const).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewAddress({ ...newAddress, type })}
                                                className={`flex-1 py-3 rounded-xl font-bold text-xs capitalize ${newAddress.type === type ? 'bg-[#0E4435] text-white' : 'bg-gray-50 text-gray-400'}`}
                                            >
                                                {isRTL ? (type === 'home' ? 'منزل' : type === 'office' ? 'مكتب' : 'آخر') : type}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="tel" value={newAddress.alternativePhone}
                                        onChange={e => setNewAddress({ ...newAddress, alternativePhone: e.target.value })}
                                        placeholder={isRTL ? 'رقم هاتف آخر (اختياري)' : 'Alternative Phone (Optional)'}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm"
                                    />
                                </motion.div>
                            )}
                        </div>
                    </section>

                    {/* Payment Method */}
                    <section>
                        <div className="flex items-center gap-3 mb-5">
                            <CreditCard className="w-7 h-7 text-[#0E4435]" />
                            <h2 className="text-xl font-black text-gray-900 font-cairo">
                                {isRTL ? 'طريقة الدفع' : 'Payment Method'}
                            </h2>
                        </div>
                        <div className="bg-emerald-50/50 rounded-[2rem] p-6 border border-[#0E4435]/20 flex items-center gap-5">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl">
                                💵
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-gray-900 font-cairo">
                                    {isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                                </h3>
                                <p className="text-sm font-bold text-gray-500 opacity-70">
                                    {isRTL ? 'ادفع عند استلام طلبك' : 'Pay when you receive your order'}
                                </p>
                            </div>
                            <CheckCircle2 className="w-7 h-7 text-[#0E4435]" />
                        </div>
                    </section>

                    {/* Promo Code */}
                    <section>
                        <div className="flex items-center gap-3 mb-5">
                            <Tag className="w-7 h-7 text-[#0E4435]" />
                            <h2 className="text-xl font-black text-gray-900 font-cairo">
                                {isRTL ? 'كود الخصم' : 'Promo Code'}
                            </h2>
                        </div>
                        <div className={`bg-white rounded-[2rem] p-8 shadow-sm border ${isCouponApplied ? 'border-emerald-200' : 'border-gray-100'}`}>
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <div className={`absolute inset-y-0 ${isRTL ? 'right-5' : 'left-5'} flex items-center pointer-events-none`}>
                                        <Tag className={`w-5 h-5 ${isCouponApplied ? 'text-[#0E4435]' : 'text-gray-300'}`} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={isRTL ? 'أدخل كود الخصم' : 'Enter promo code'}
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        disabled={isCouponApplied}
                                        className={`w-full ${isRTL ? 'pr-14 pl-5' : 'pl-14 pr-5'} py-4 rounded-2xl outline-none border-none font-bold text-sm ${isCouponApplied ? 'bg-emerald-50 text-[#0E4435]' : 'bg-gray-50 focus:ring-2 focus:ring-[#0E4435]'}`}
                                    />
                                </div>
                                {isCouponApplied ? (
                                    <button
                                        onClick={handleRemoveCoupon}
                                        className="px-6 py-4 bg-red-50 text-red-600 font-black rounded-2xl flex items-center gap-2 hover:bg-red-100 transition-colors"
                                    >
                                        <X size={18} /> {isRTL ? 'إزالة' : 'Remove'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleApplyCoupon}
                                        className="px-8 py-4 bg-black text-white font-black rounded-2xl hover:bg-gray-900 transition-colors"
                                    >
                                        {isRTL ? 'تطبيق' : 'Apply'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
 
                    {/* Order Notes */}
                    <section>
                        <div className="flex items-center gap-3 mb-5">
                            <Plus className="w-7 h-7 text-[#0E4435]" />
                            <h2 className="text-xl font-black text-gray-900 font-cairo">
                                {isRTL ? 'ملاحظات إضافية' : 'Order Notes'}
                            </h2>
                        </div>
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={isRTL ? 'مثال: رقم جرس مختلف، ملاحظة للمندوب...' : 'Example: different doorbell, instructions for driver...'}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#0E4435] outline-none font-bold text-sm min-h-[120px] resize-none"
                            />
                        </div>
                    </section>
                </div>

                {/* Summary Column */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/[0.02] border border-gray-50 lg:sticky lg:top-28">
                        <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-5">
                            <Receipt className="w-6 h-6 text-[#0E4435]" />
                            <h2 className="text-xl font-black text-gray-900 font-cairo uppercase tracking-tight">
                                {isRTL ? 'ملخص الطلب' : 'Order Summary'}
                            </h2>
                        </div>

                        <div className="space-y-4 font-cairo text-sm font-bold">
                            <div className="flex justify-between items-center text-gray-400">
                                <span>{isRTL ? 'المجموع' : 'Subtotal'}</span>
                                <span className="text-gray-900">{subtotal.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                            </div>
                            {isCouponApplied && (
                                <div className="flex justify-between items-center text-[#0E4435]">
                                    <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                                    <span>-{couponDiscount.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-gray-400">
                                <span>{isRTL ? 'الشحن' : 'Shipping'}</span>
                                <div className="text-left">
                                    <span className="text-gray-900 block">
                                        {shippingFee === 0 ? (isRTL ? 'مجاني' : 'Free') : `${shippingFee.toLocaleString()} ${isRTL ? 'ج.م' : 'EGP'}`}
                                    </span>
                                    {selectedGov && (
                                        <span className="text-[10px] text-[#0E4435] font-bold">
                                            {isRTL ? `توصيل خلال ${deliveryMin}-${deliveryMax} أيام` : `Delivery in ${deliveryMin}-${deliveryMax} days`}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="pt-6 border-t border-gray-50 mt-6 flex justify-between items-center">
                                <span className="text-lg font-black text-gray-900">{isRTL ? 'الإجمالي' : 'Total'}</span>
                                <span className="text-3xl font-black text-[#0E4435]">
                                    {total.toLocaleString()} <span className="text-xs">{isRTL ? 'ج.م' : 'EGP'}</span>
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={isProcessing}
                            className={`w-full mt-10 py-6 bg-[#0E4435] text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-emerald-950/20 transition-all ${isProcessing ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                        >
                            {isProcessing ? (
                                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{isRTL ? 'تأكيد الطلب' : 'Place Order'}</span>
                                    {isRTL ? <ArrowLeft className="w-6 h-6 rotate-180" /> : <ArrowRight className="w-6 h-6" />}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
