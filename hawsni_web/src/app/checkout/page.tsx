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
    User as PersonStanding,
    Lock,
    ShoppingBag
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { useLanguage } from '@/context/LanguageContext';
import { addressService, Address } from '@/services/addressService';
import { checkoutService, OrderData } from '@/services/checkoutService';
import { couponService } from '@/services/couponService';
import { authService } from '@/services/authService';

// New Components
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import OrderReceipt from '@/components/checkout/OrderReceipt';

// Re-refined Premium Input Component
const CheckoutInput = ({ 
    icon: Icon, 
    placeholder, 
    value, 
    onChange, 
    type = 'text', 
    isValid = false, 
    id,
    disabled = false
}: { 
    icon: any, 
    placeholder: string, 
    value: string, 
    onChange: (e: any) => void, 
    type?: string, 
    isValid?: boolean, 
    id?: string,
    disabled?: boolean
}) => {
    const { isRTL } = useLanguage();
    return (
        <div className="relative group">
            <div className={`absolute inset-y-0 ${isRTL ? 'right-4 md:right-5' : 'left-4 md:left-5'} flex items-center pointer-events-none group-focus-within:text-[#0E4435] transition-colors text-gray-300`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                className={`
                    w-full ${isRTL ? 'pr-12 md:pr-16 pl-12' : 'pl-12 md:pl-16 pr-12'} py-4 md:py-6 bg-white border-2 rounded-2xl md:rounded-[1.5rem] 
                    font-black text-sm md:text-base outline-none transition-all duration-300
                    ${value ? 'border-emerald-50 bg-white text-gray-900' : 'border-gray-50 text-gray-400'}
                    focus:border-[#0E4435] focus:ring-8 focus:ring-[#0E4435]/5
                `}
            />
            {isValid && (
                <div className={`absolute inset-y-0 ${isRTL ? 'left-5' : 'right-5'} flex items-center`}>
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const { isRTL, t } = useLanguage();
    const { showToast } = useToastStore();
    
    // Step Tracking (1: Info, 2: Shipping, 3: Review)
    const [currentStep, setCurrentStep] = useState(1);
    
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
    const [couponCode, setCouponCode] = useState('');
    const [isCouponApplied, setIsCouponApplied] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
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

                try {
                    const pubRes = await import('@/lib/axios').then(m => m.default.get('/settings/public'));
                    setFreeDeliveryActive(!!pubRes.data?.data?.free_delivery_enabled);
                } catch { }

                if (token) {
                    try {
                        const profile = await authService.getProfile();
                        if (profile.success && profile.user) {
                            setGuestInfo(prev => ({ ...prev, email: profile.user.email || '' }));
                        }
                    } catch (err) {}

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

    useEffect(() => {
        const fetchGovs = async () => {
            try {
                const axios = (await import('@/lib/axios')).default;
                const res = await axios.get('/shipping/cities');
                if (res.data.success) setGovernorates(res.data.cities || []);
            } catch (err) {}
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
            } catch (err) {}
        };
        fetchDistricts();
    }, [selectedGovId]);

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
                const searchKey = Object.keys(govSettings).find(k => 
                   k.trim() === selectedGov.trim() || k.includes(selectedGov) || selectedGov.includes(k)
                );
                if (searchKey) currentGov = govSettings[searchKey];
            }
        }

        if (!selectedGov) return { cost: 0, min: 1, max: 3 };

        const cost = (threshold > 0 && subtotal >= threshold)
            ? 0
            : (currentGov ? currentGov.cost : (shippingSettings.delivery_cost || 100));

        const min = currentGov ? currentGov.days_min : (shippingSettings.default_days_min || 3);
        const max = currentGov ? currentGov.days_max : (shippingSettings.default_days_max || 7);

        return { cost, min, max };
    }, [shippingSettings, freeDeliveryActive, selectedGov, subtotal]);

    const { cost: shippingFee, min: deliveryMin, max: deliveryMax } = calculateShipping;
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
                showToast(isRTL ? 'تم تطبيق كود الخصم بنجاح 🎉' : 'Coupon applied successfully 🎉', 'success');
            }
        } catch (error: any) {
            showToast(isRTL ? 'كود الخصم غير موجود أو منتهي الصلاحية' : 'Invalid or expired coupon', 'error');
        }
    };

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
                    isDefault: addresses.length === 0
                });
                if (saveAddrRes.success) addressId = saveAddrRes.address._id;
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
                    guestEmail: guestInfo.email
                }),
                notes: notes || undefined
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
                showToast(isRTL ? 'يرجى اختيار المحافظة' : 'Please select a governorate', 'error');
                return false;
            }
            if (!selectedDistrictId) {
                showToast(isRTL ? 'يرجى اختيار المنطقة' : 'Please select a district', 'error');
                return false;
            }
            if (!isAuthenticated && guestInfo.street.length < 5) {
                showToast(isRTL ? 'يرجى كتابة العنوان بالتفصيل' : 'Please enter detailed address', 'error');
                return false;
            }
            if (isAuthenticated && isAddingNewAddress && newAddress.street.length < 5) {
                showToast(isRTL ? 'يرجى كتابة العنوان بالتفصيل' : 'Please enter detailed address', 'error');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) setCurrentStep(prev => prev + 1);
    };
    const prevStep = () => setCurrentStep(prev => prev - 1);

    if (items.length === 0 && !isProcessing) return null;

    const CHECKOUT_STEPS = [
        { id: 1, label: 'Contact', labelAr: 'البيانات', icon: User },
        { id: 2, label: 'Shipping', labelAr: 'العنوان', icon: MapPin },
        { id: 3, label: 'Review', labelAr: 'المراجعة', icon: CheckCircle2 },
    ];

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-cairo" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Minimal Header */}
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-50">
                <div className="max-w-7xl mx-auto px-6 h-20 md:h-24 flex items-center justify-between">
                    <button onClick={() => currentStep > 1 ? prevStep() : router.back()} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 active:scale-95 transition-all">
                        {isRTL ? <ArrowRight className="rotate-0" /> : <ArrowLeft />}
                    </button>
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                            {isRTL ? 'دفع آمن 100%' : '100% Secure Checkout'}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
                <CheckoutSteps currentStep={currentStep} steps={CHECKOUT_STEPS} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-start">
                    {/* Form Side */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.section 
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-2">
                                        <h2 className="text-3xl md:text-5xl font-black text-gray-900">
                                            {isRTL ? 'من نخدم اليوم؟' : 'Who are we serving?'}
                                        </h2>
                                        <p className="text-gray-400 font-bold text-base md:text-lg">
                                            {isRTL ? 'بيانات التواصل الأساسية لمتابعة طلبك' : 'Primary contact info to follow up your order'}
                                        </p>
                                    </div>

                                    {!isAuthenticated ? (
                                        <div className="space-y-4">
                                            <CheckoutInput 
                                                id="guest-name"
                                                icon={User}
                                                placeholder={isRTL ? 'الاسم بالكامل' : 'Full Name'}
                                                value={guestInfo.name}
                                                onChange={e => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                                isValid={guestInfo.name.length >= 3}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <CheckoutInput 
                                                    id="guest-phone"
                                                    type="tel"
                                                    icon={Phone}
                                                    placeholder={isRTL ? 'رقم الهاتف' : 'Phone'}
                                                    value={guestInfo.phone}
                                                    onChange={e => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                                    isValid={/^01[0125]\d{8}$/.test(guestInfo.phone)}
                                                />
                                                <CheckoutInput 
                                                    id="guest-phone2"
                                                    type="tel"
                                                    icon={Phone}
                                                    placeholder={isRTL ? 'رقم بديل (اختياري)' : 'Alt. Phone'}
                                                    value={guestInfo.phone2}
                                                    onChange={e => setGuestInfo({ ...guestInfo, phone2: e.target.value })}
                                                    isValid={guestInfo.phone2 ? /^01[0125]\d{8}$/.test(guestInfo.phone2) : false}
                                                />
                                            </div>
                                            <CheckoutInput 
                                                id="guest-email"
                                                type="email"
                                                icon={Mail}
                                                placeholder={isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                                                value={guestInfo.email}
                                                onChange={e => setGuestInfo({ ...guestInfo, email: e.target.value })}
                                                isValid={!!guestInfo.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100 flex items-center gap-6">
                                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-950/5">
                                                <CheckCircle2 size={40} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-[#0E4435]">{isRTL ? 'أهلاً بك مجدداً!' : 'Welcome Back!'}</h3>
                                                <p className="text-emerald-700/60 font-bold mt-1">
                                                    {isRTL ? 'أنت مسجل دخول بالفعل، يمكنك الانتقال للعنوان مباشرة' : 'You are logged in, proceed to address directly.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <button onClick={nextStep} className="w-full py-6 bg-[#0E4435] text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-950/20 hover:scale-[1.02] active:scale-95 transition-all">
                                        {isRTL ? 'متابعة للعنوان' : 'Proceed to Address'}
                                    </button>
                                </motion.section>
                            )}

                            {currentStep === 2 && (
                                <motion.section 
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-2">
                                        <h2 className="text-3xl md:text-5xl font-black text-gray-900">
                                            {isRTL ? 'أين نرسل طلبك؟' : 'Where to send?'}
                                        </h2>
                                        <p className="text-gray-400 font-bold text-base md:text-lg">
                                            {isRTL ? 'اختر عنوان التوصيل المفضل لديك' : 'Choose your preferred delivery address'}
                                        </p>
                                    </div>

                                    {isAuthenticated ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {addresses.map((addr) => (
                                                <div
                                                    key={addr._id}
                                                    onClick={() => {
                                                        setSelectedAddressId(addr._id);
                                                        setSelectedGov(addr.state || '');
                                                        setIsAddingNewAddress(false);
                                                    }}
                                                    className={`
                                                        cursor-pointer p-8 rounded-[2rem] border-4 transition-all relative flex flex-col gap-4
                                                        ${selectedAddressId === addr._id && !isAddingNewAddress ? 'border-[#0E4435] bg-white shadow-2xl shadow-emerald-950/5' : 'border-transparent bg-white hover:bg-gray-50 opacity-60'}
                                                    `}
                                                >
                                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#0E4435]">
                                                        {addr.type === 'home' ? <Home size={24} /> : <Briefcase size={24} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-xs text-emerald-600 uppercase tracking-widest mb-1">
                                                            {isRTL ? (addr.type === 'home' ? 'المنزل' : 'العمل') : addr.type}
                                                        </h4>
                                                        <p className="text-lg font-black text-gray-900">{addr.street}</p>
                                                        <p className="text-sm font-bold text-gray-400 mt-1">{addr.state}, {addr.city}</p>
                                                    </div>
                                                    {selectedAddressId === addr._id && !isAddingNewAddress && (
                                                        <div className="absolute top-6 right-6 w-8 h-8 bg-[#0E4435] rounded-full flex items-center justify-center text-white">
                                                            <Check size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setIsAddingNewAddress(true)}
                                                className={`p-8 rounded-[2rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${isAddingNewAddress ? 'border-[#0E4435] bg-emerald-50/20 text-[#0E4435]' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                                                    <Plus size={24} />
                                                </div>
                                                <span className="font-black text-lg">{isRTL ? 'عنوان جديد' : 'New Address'}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <select
                                                        value={selectedGovId} 
                                                        onChange={e => {
                                                            const gov = governorates.find(g => g.id === e.target.value);
                                                            setSelectedGovId(e.target.value);
                                                            setSelectedDistrictId('');
                                                            setSelectedGov(gov ? gov.arabicName : '');
                                                        }}
                                                        className={`w-full bg-white border-2 rounded-2xl py-5 px-6 font-black text-base outline-none transition-all appearance-none cursor-pointer ${ selectedGovId ? 'border-emerald-50 text-gray-900' : 'border-gray-50 text-gray-300'}`}
                                                    >
                                                        <option value="">{isRTL ? '📍 المحافظة' : '📍 Governorate'}</option>
                                                        {governorates.map(gov => <option key={gov.id} value={gov.id}>{isRTL ? gov.arabicName : gov.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        value={selectedDistrictId}
                                                        onChange={e => {
                                                            const dist = districts.find(d => d.id === e.target.value);
                                                            setSelectedDistrictId(e.target.value);
                                                            setGuestInfo({ ...guestInfo, city: dist ? dist.arabicName : '' });
                                                        }}
                                                        disabled={!selectedGovId}
                                                        className={`w-full bg-white border-2 rounded-2xl py-5 px-6 font-black text-base outline-none transition-all appearance-none cursor-pointer disabled:opacity-30 ${ selectedDistrictId ? 'border-emerald-50 text-gray-900' : 'border-gray-50 text-gray-300'}`}
                                                    >
                                                        <option value="">{isRTL ? '🏘️ المنطقة / الحي' : '🏘️ District'}</option>
                                                        {districts.map(dist => <option key={dist.id} value={dist.id}>{isRTL ? dist.arabicName : dist.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <CheckoutInput 
                                                id="guest-street"
                                                icon={MapPin}
                                                placeholder={isRTL ? 'تفاصيل العنوان (شارع، مبنى، شقة)' : 'Address details (Street, Building, Apt)'}
                                                value={guestInfo.street}
                                                onChange={e => setGuestInfo({ ...guestInfo, street: e.target.value })}
                                                isValid={guestInfo.street.length >= 5}
                                            />
                                        </div>
                                    )}

                                    {isAuthenticated && isAddingNewAddress && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 pt-6 border-t border-gray-100">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <select
                                                    value={selectedGovId} 
                                                    onChange={e => {
                                                        const gov = governorates.find(g => g.id === e.target.value);
                                                        setSelectedGovId(e.target.value);
                                                        setSelectedDistrictId('');
                                                        setSelectedGov(gov ? gov.arabicName : '');
                                                    }}
                                                    className="w-full bg-white border-2 border-gray-50 rounded-2xl py-5 px-6 font-black text-base appearance-none"
                                                >
                                                    <option value="">{isRTL ? '📍 المحافظة' : '📍 Governorate'}</option>
                                                    {governorates.map(gov => <option key={gov.id} value={gov.id}>{isRTL ? gov.arabicName : gov.name}</option>)}
                                                </select>
                                                <select
                                                    value={selectedDistrictId}
                                                    onChange={e => {
                                                        const dist = districts.find(d => d.id === e.target.value);
                                                        setSelectedDistrictId(e.target.value);
                                                        setNewAddress({ ...newAddress, city: dist ? dist.arabicName : '' });
                                                    }}
                                                    disabled={!selectedGovId}
                                                    className="w-full bg-white border-2 border-gray-50 rounded-2xl py-5 px-6 font-black text-base appearance-none disabled:opacity-30"
                                                >
                                                    <option value="">{isRTL ? '🏘️ منطقة العنوان الجديد' : '🏘️ New District'}</option>
                                                    {districts.map(dist => <option key={dist.id} value={dist.id}>{isRTL ? dist.arabicName : dist.name}</option>)}
                                                </select>
                                            </div>
                                            <CheckoutInput 
                                                id="new-street"
                                                icon={MapPin}
                                                placeholder={isRTL ? 'العنوان بالتفصيل' : 'Detailed Address'}
                                                value={newAddress.street}
                                                onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                                isValid={newAddress.street.length >= 5}
                                            />
                                            <div className="flex gap-2">
                                                {(['home', 'office', 'other'] as const).map(type => (
                                                    <button key={type} onClick={() => setNewAddress({ ...newAddress, type })} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${newAddress.type === type ? 'bg-[#0E4435] text-white shadow-xl shadow-emerald-950/20' : 'bg-white text-gray-400 border-2 border-gray-50'}`}>
                                                        {isRTL ? (type === 'home' ? '🏠 منزل' : type === 'office' ? '🏢 مكتب' : '📌 آخر') : type}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                    
                                    <button onClick={nextStep} className="w-full py-6 bg-[#0E4435] text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-950/20 hover:scale-[1.02] active:scale-95 transition-all">
                                        {isRTL ? 'مراجعة الطلب النهائي' : 'Review Final Order'}
                                    </button>
                                </motion.section>
                            )}

                            {currentStep === 3 && (
                                <motion.section 
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-2">
                                        <h2 className="text-3xl md:text-5xl font-black text-gray-900">
                                            {isRTL ? 'جاهز للانطلاق؟' : 'Ready to fly?'}
                                        </h2>
                                        <p className="text-gray-400 font-bold text-base md:text-lg">
                                            {isRTL ? 'راجع بياناتك الأخيرة قبل تأكيد الشحن' : 'Review your final data before confirming shipment'}
                                        </p>
                                    </div>

                                    {/* Final Info Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 bg-white rounded-3xl border-2 border-gray-50 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                                <User size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{isRTL ? 'الاسم' : 'Name'}</p>
                                                <p className="text-sm font-black text-gray-900">{isAuthenticated ? (isRTL ? 'مسجل دخول' : 'Logged In') : guestInfo.name}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white rounded-3xl border-2 border-gray-50 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                                                <MapPin size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{isRTL ? 'محافظة الشحن' : 'Province'}</p>
                                                <p className="text-sm font-black text-gray-900">{selectedGov}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Notes */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">
                                            {isRTL ? '📝 ملاحظات للطيار' : '📝 Notes for courier'}
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder={isRTL ? 'مثال: بجوار مسجد كذا، الدور التاني شمال...' : 'Example: near mosque, 2nd floor left...'}
                                            className="w-full bg-white border-2 border-gray-50 rounded-[1.5rem] p-6 focus:border-[#0E4435] focus:ring-8 focus:ring-[#0E4435]/5 outline-none font-black text-sm md:text-base min-h-[120px] resize-none transition-all placeholder:text-gray-200"
                                        />
                                    </div>
                                    
                                    <button 
                                        onClick={handlePlaceOrder} 
                                        disabled={isProcessing}
                                        className={`w-full py-8 bg-[#0E4435] text-white rounded-[2.5rem] font-black text-2xl shadow-[0_20px_50px_rgba(14,68,53,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        {isProcessing ? (
                                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>{isRTL ? 'تأكيد وشحن الطلب الآن' : 'Confirm & Ship Now'}</span>
                                                {isRTL ? <ArrowLeft /> : <ArrowRight />}
                                            </>
                                        )}
                                    </button>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Receipt Side */}
                    <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
                        <OrderReceipt 
                            subtotal={subtotal}
                            shippingFee={shippingFee}
                            discount={couponDiscount}
                            total={total}
                            couponApplied={isCouponApplied}
                            selectedGov={selectedGov}
                            deliveryEstimate={{ min: deliveryMin, max: deliveryMax }}
                        />

                        {/* Coupon Logic Integrated Into Side */}
                        <div className={`p-6 md:p-8 rounded-[2rem] border-4 transition-all ${isCouponApplied ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-gray-50'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <Tag className={isCouponApplied ? 'text-emerald-600' : 'text-gray-300'} />
                                <h3 className="font-black text-gray-900">{isRTL ? 'لديك كود خصم؟' : 'Have a code?'}</h3>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={isRTL ? 'اكتب الكود هنا...' : 'Enter code...'}
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    disabled={isCouponApplied}
                                    className="flex-1 bg-white border-2 border-gray-50 rounded-xl px-4 py-3 font-black text-sm outline-none focus:border-[#0E4435] disabled:opacity-50"
                                />
                                {isCouponApplied ? (
                                    <button onClick={() => { setIsCouponApplied(false); setCouponCode(''); setCouponDiscount(0); }} className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors">
                                        <X size={20} />
                                    </button>
                                ) : (
                                    <button onClick={handleApplyCoupon} className="px-6 bg-gray-900 text-white rounded-xl font-black text-sm hover:bg-black transition-colors active:scale-95">
                                        {isRTL ? 'تطبيق' : 'Apply'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Why Us? - Reassuring items */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white rounded-3xl border-2 border-gray-50 text-center">
                                <Truck className="mx-auto mb-2 text-emerald-600" size={24} />
                                <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{isRTL ? 'توصيل سريع' : 'Fast Delivery'}</p>
                            </div>
                            <div className="p-6 bg-white rounded-3xl border-2 border-gray-50 text-center">
                                <ShoppingBag className="mx-auto mb-2 text-emerald-600" size={24} />
                                <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{isRTL ? 'منتجات أصلية' : 'Original Items'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Mobile Sticky CTA Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 z-40 pb-safe">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRTL ? 'الإجمالي' : 'Total'}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#0E4435]">{total.toLocaleString()}</span>
                            <span className="text-[10px] font-black text-[#0E4435]">EGP</span>
                        </div>
                    </div>
                    <button 
                        onClick={currentStep < 3 ? nextStep : handlePlaceOrder}
                        disabled={isProcessing}
                        className="flex-1 h-14 bg-[#0E4435] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-emerald-950/20"
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{currentStep < 3 ? (isRTL ? 'الخطوة التالية' : 'Next Step') : (isRTL ? 'تأكيد الطلب' : 'Place Order')}</span>
                                {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
